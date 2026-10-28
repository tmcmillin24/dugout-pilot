import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { teamError } from '@/lib/teams';
import { defaultBoard, normalizeBoard, type Board } from '@/lib/coaching/board';
import { useTeams } from './team-provider';
import { useAuth } from './auth-provider';

type CoachingState = { board: Board | null; loading: boolean; busy: boolean; error: string; notice: string; writable: boolean; reload: () => Promise<void>; commit: (change: (board: Board) => Board) => Promise<boolean> };
const Context = createContext<CoachingState | null>(null);
export function CoachingProvider({ children }: { children: ReactNode }) {
  const { active } = useTeams();
  const { session } = useAuth();
  return <TeamCoaching key={`${session?.user.id}:${active?.id ?? 'none'}`} teamId={active?.id} teamName={active?.name ?? ''} access={!!active && (active.test_access || active.access_status === 'active' || active.access_status === 'trial')}>{children}</TeamCoaching>;
}
function TeamCoaching({ teamId, teamName, access, children }: { teamId?: string; teamName: string; access: boolean; children: ReactNode }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(!!teamId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const current = useRef<{ board: Board; revision: number } | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const reload = useCallback(async () => {
    if (!teamId || lock.current) return;
    lock.current = true;
    try {
      const result = await supabase.from('team_boards').select('board,revision').eq('team_id', teamId).maybeSingle();
      if (result.error) throw result.error;
      const next = result.data ? normalizeBoard(result.data.board as Board) : { ...defaultBoard(teamName), practicePlans: [] };
      if (!alive.current) return;
      current.current = { board: next, revision: result.data?.revision ?? 0 };
      setBoard(next); setError(''); setNotice('');
    } catch (reason) { if (alive.current) setError(teamError(reason)); }
    finally { lock.current = false; if (alive.current) setLoading(false); }
  }, [teamId, teamName]);
  // The request updates state only after the Supabase promise settles.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void reload(); }, [reload]);
  const commit = useCallback(async (change: (board: Board) => Board) => {
    if (!teamId || !current.current || lock.current || !access) return false;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const next = change(current.current.board);
      const { data, error: failure } = await supabase.rpc('save_team_board', { p_team_id: teamId, p_revision: current.current.revision, p_board: { ...next, practicePlans: next.practicePlans ?? [] } });
      if (failure) throw failure;
      if (!alive.current) return false;
      current.current = { board: next, revision: data as number }; setBoard(next); setNotice('Saved to team.'); return true;
    } catch (reason) { if (alive.current) setError(teamError(reason)); return false; }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }, [access, teamId]);
  return <Context.Provider value={{ board, loading, busy, error, notice, writable: access && !busy && !loading, reload: async () => { if (lock.current) return; setLoading(true); await reload(); }, commit }}>{children}</Context.Provider>;
}
export function useCoaching() { const value = useContext(Context); if (!value) throw new Error('Coaching provider missing'); return value; }
