import { hasPlan } from '@/lib/team-plans';
import { useNetworkState } from 'expo-network';
import { setupComplete } from '@/lib/coaching/game-readiness';
import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { teamError } from '@/lib/teams';
import { defaultBoard, normalizeBoard, type Board } from '@/lib/coaching/board';
import { useTeams } from './team-provider';
import { useAuth } from './auth-provider';

type CoachingState = { offline:boolean; syncing:boolean; lastSynced:string|null; restoreImport:(id:string)=>Promise<boolean>; board: Board | null; loading: boolean; busy: boolean; error: string; notice: string; writable: boolean; reload: () => Promise<void>; commit: (change: (board: Board) => Board) => Promise<boolean> };
const Context = createContext<CoachingState | null>(null);
export function CoachingProvider({ children }: { children: ReactNode }) {
  const { active } = useTeams();
  const { session } = useAuth();
  return <TeamCoaching key={`${session?.user.id}:${active?.id ?? 'none'}`} teamId={active?.id} teamName={active?.name ?? ''} access={hasPlan(active,'starter')}>{children}</TeamCoaching>;
}
function TeamCoaching({ teamId, teamName, access, children }: { teamId?: string; teamName: string; access: boolean; children: ReactNode }) {
  const network=useNetworkState();const offline=network.isConnected===false||network.isInternetReachable===false;
  const [syncing,setSyncing]=useState(false);const [lastSynced,setLastSynced]=useState<string|null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(!!teamId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const current = useRef<{ board: Board; revision: number } | null>(null);
  const lock = useRef(false);
  const pending = useRef(false);
  const syncFailed = useRef(false);
  const requestSync = useRef<()=>void>(()=>{});
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const reload = useCallback(async (quiet=false) => {
    if (!teamId)return;
    if(offline){if(alive.current)setLoading(false);return;}
    if (lock.current) { pending.current=true; return; }
    lock.current = true;setSyncing(true);
    try {
      const result = await supabase.from('team_boards').select('board,revision').eq('team_id', teamId).maybeSingle();
      if (result.error) throw result.error;
      if(alive.current)setLastSynced(new Date().toISOString());
      if(syncFailed.current&&alive.current){syncFailed.current=false;setError('');}
      if(current.current && (!result.data || result.data.revision<=current.current.revision)){if(!quiet){setError('');setNotice('');}return;}
      const next = result.data ? normalizeBoard(result.data.board as Board) : { ...defaultBoard(teamName), practicePlans: [] };
      if (!alive.current) return;
      current.current = { board: next, revision: result.data?.revision ?? 0 };
      setBoard(next); if(!quiet){setError('');setNotice('');}
    } catch (reason) { if (alive.current) {syncFailed.current=quiet;setError(quiet&&current.current?'Could not sync team data. Showing the last loaded version. '+teamError(reason):teamError(reason));} }
    finally { lock.current = false; if (alive.current) {setSyncing(false);setLoading(false);if(pending.current){pending.current=false;requestSync.current();}} }
  }, [teamId, teamName,offline]);
  useEffect(() => {
    if(!teamId)return;
    requestSync.current=()=>{void reload(true);};
    // Reload applies state only after its network request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const foreground=AppState.addEventListener('change',state=>{if(state==='active')void reload(true);});
    const timer=setInterval(()=>{if(AppState.currentState==='active')void reload(true);},10000);
    const channel=supabase.channel(`team-board:${teamId}`).on('postgres_changes',{event:'*',schema:'public',table:'team_boards',filter:`team_id=eq.${teamId}`},()=>{void reload(true);}).subscribe();
    return()=>{clearInterval(timer);foreground.remove();void supabase.removeChannel(channel);};
  }, [reload,teamId]);
  const commit = useCallback(async (change: (board: Board) => Board) => {
    if (!teamId || !current.current || lock.current || !access || offline) return false;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const changed = change(current.current.board);
      const next={...changed,setupComplete:current.current.board.setupComplete||setupComplete(changed)};
      const { data, error: failure } = await supabase.rpc('save_team_board', { p_team_id: teamId, p_revision: current.current.revision, p_board: { ...next, practicePlans: next.practicePlans ?? [] } });
      if (failure) throw failure;
      if (!alive.current) return false;
      current.current = { board: next, revision: data as number }; setBoard(next);setLastSynced(new Date().toISOString()); setNotice('Saved to team.'); return true;
    } catch (reason) { if (alive.current) setError(teamError(reason));if((reason as {code?:string})?.code==='40001')pending.current=true; return false; }
    finally { lock.current = false; if (alive.current) {setBusy(false);if(pending.current){pending.current=false;requestSync.current();}} }
  }, [access, teamId,offline]);
  const restoreImport=useCallback(async(id:string)=>{
    if(!teamId||!current.current||lock.current||!access||offline)return false;
    lock.current=true;setBusy(true);setError('');setNotice('');
    try{
      const result=await supabase.rpc('restore_team_import',{p_team_id:teamId,p_history_id:id,p_revision:current.current.revision});
      if(result.error)throw result.error;
      if(!alive.current)return false;
      const next=normalizeBoard(result.data.board as Board);
      current.current={board:next,revision:result.data.revision};setBoard(next);setLastSynced(new Date().toISOString());setNotice('Previous stats restored. Lineups, roster and pitching logs kept.');return true;
    }catch(reason){if(alive.current)setError(teamError(reason));if((reason as {code?:string})?.code==='40001')pending.current=true;return false;}
    finally{lock.current=false;if(alive.current){setBusy(false);if(pending.current){pending.current=false;requestSync.current();}}}
  },[teamId,access,offline]);
  return <Context.Provider value={{ board, loading, busy, error, notice, offline,syncing,lastSynced,restoreImport, writable: access && !busy && !loading && !offline, reload: async () => { if (lock.current) return; setLoading(true); await reload(); }, commit }}>{children}</Context.Provider>;
}
export function useCoaching() { const value = useContext(Context); if (!value) throw new Error('Coaching provider missing'); return value; }
