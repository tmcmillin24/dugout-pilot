import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { listTeams, teamError, type Team } from '@/lib/teams';
import { useAuth } from './auth-provider';

export type TeamState = { teams: Team[]; active: Team | null; loading: boolean; error: string; notice: string; refresh: (preferred?: string) => Promise<void>; select: (id: string) => Promise<void> };
export const TeamContext = createContext<TeamState | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return null;
  return <AccountTeams key={session.user.id} userId={session.user.id}>{children}</AccountTeams>;
}
function AccountTeams({ children, userId }: { children: ReactNode; userId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const currentId = useRef<string | null>(null);
  const alive = useRef(true);
  const generation = useRef(0);
  const key = `dugout-pilot:active-team:${userId}`;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refresh = useCallback(async (preferred?: string) => {
    const request = ++generation.current;
    try {
      const available = await listTeams();
      const saved = preferred ?? currentId.current ?? await AsyncStorage.getItem(key);
      if (!alive.current || request !== generation.current) return;
      const next = available.find(team => team.id === saved)?.id ?? available[0]?.id ?? null;
      currentId.current = next; setSelected(next); setTeams(available); setError(''); setNotice('');
      if (next) {
        try { await AsyncStorage.setItem(key, next); }
        catch { if (alive.current) setNotice('Your team is selected, but this device could not save the selection.'); }
      }
    } catch (reason) {
      if (alive.current && request === generation.current) { setError(teamError(reason)); setTeams([]); setSelected(null); }
    } finally { if (alive.current && request === generation.current) setLoading(false); }
  }, [key]);
  // State updates happen after the requests resolve.
  useEffect(() => { void refresh(); const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); }); return () => listener.remove(); }, [refresh]);
  const select = useCallback(async (id: string) => {
    if (!teams.some(team => team.id === id)) return;
    ++generation.current; currentId.current = id; setSelected(id); setNotice('');
    try { await AsyncStorage.setItem(key, id); }
    catch { if (alive.current) setNotice('Your team is selected, but this device could not save the selection.'); }
  }, [key, teams]);
  return <TeamContext.Provider value={{ teams, active: teams.find(team => team.id === selected) ?? null, loading, error, notice, refresh, select }}>{children}</TeamContext.Provider>;
}
export function useTeams() { const value = useContext(TeamContext); if (!value) throw new Error('useTeams must be used inside TeamProvider'); return value; }
