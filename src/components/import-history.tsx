import {useCallback,useState} from 'react';
import {Text,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {Button,Panel,Section,StatusMessage,ui} from './app-ui';
import {Sheet,c} from './coaching-ui';
import {EmptyState} from './empty-state';
import {supabase} from '@/lib/supabase';
import {useTeams} from '@/providers/team-provider';
import {useCoaching} from '@/providers/coaching-provider';
import {hasPlan} from '@/lib/team-plans';
type Entry={id:string;created_at:string;label:string;summary:string;player_count:number;actor:string;recoverable:boolean;revision:number};
export function ImportHistory(){const {active}=useTeams();const {board,busy,writable,restoreImport}=useCoaching();const [entries,setEntries]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState<Entry|null>(null),[version,setVersion]=useState(0);const teamId=active?.id;
 const refresh=useCallback(()=>{let alive=true;void supabase.rpc('list_team_import_history',{p_team_id:teamId}).then(({data,error})=>{if(!alive)return;setLoading(false);if(error){setError('Import history could not load. Check your connection and make sure the latest database update is installed.');return;}setEntries(data??[]);setError('');});return()=>{alive=false;};}
 // Import writes and explicit retries must refresh this focused screen even with the same team ID.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 ,[teamId,board,version]);
 useFocusEffect(refresh);
 return <Section title="Import history"><Text style={c.small}>Latest 30 stats changes · backups for the latest 5. History begins with this update.</Text>{loading?<Text style={c.small}>Loading import history…</Text>:error?<><StatusMessage text={error} error/><Button secondary onPress={()=>{setLoading(true);setVersion(v=>v+1);}}>RETRY HISTORY</Button></>:entries.length?<Panel>{entries.map(entry=><View key={entry.id} style={[c.item,{gap:8}]}><Text style={ui.rowTitle}>{entry.label}</Text><Text style={ui.body}>{entry.summary}</Text><Text style={c.small}>{new Date(entry.created_at).toLocaleString()} · {entry.actor}</Text><Text style={c.small}>{entry.player_count} tracked players after this change</Text>{entry.recoverable&&<Button secondary disabled={!writable||busy||!hasPlan(active,'elite')} onPress={()=>{setSelected(entry);}}>RESTORE STATS FROM BEFORE THIS CHANGE</Button>}</View>)}</Panel>:<EmptyState icon="upload" title="Your import history starts here" description="After your next CSV import, you’ll see who made the change and a backup of the previous stats."/>}<Sheet title="Restore previous stats?" open={!!selected} onClose={()=>{if(!busy)setSelected(null);}}>{selected&&<><Text style={ui.rowTitle}>Before {selected.label}</Text><Text style={ui.body}>{new Date(selected.created_at).toLocaleString()}</Text><Text style={ui.body}>This restores the team’s season and game stats to the state before this change. Later stats imports will be rolled back.</Text><Text style={ui.body}>Current roster, batting orders, defensive assignments, pitching logs and practice plans stay. Deleted games will not be recreated, and stats for removed players are excluded.</Text><Text style={c.small}>The current stats are backed up as another history entry before restoration.</Text><Button disabled={busy||!writable||!hasPlan(active,'elite')} onPress={()=>{void restoreImport(selected.id).then(ok=>{if(ok)setSelected(null);});}}>{busy?'RESTORING…':'RESTORE PREVIOUS STATS'}</Button><Button secondary disabled={busy} onPress={()=>setSelected(null)}>KEEP CURRENT STATS</Button></>}</Sheet></Section>;
}
