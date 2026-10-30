import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Panel, StatusMessage, palette, ui } from './app-ui';
import { Sheet, c } from './coaching-ui';
import { Toggle } from './practice-planner-controls';
import { useAuth } from '@/providers/auth-provider';
import { useTeams } from '@/providers/team-provider';
import { availableColumns, formatStat, statValue, type StatGroup } from '@/lib/coaching/stat-data';
import { formatPlayerName } from '@/lib/coaching/player-display';
import type { Player, Stat } from '@/lib/coaching/board';
const defaults={batting:['GP','PA','AB','H','R','RBI','AVG','OBP','OPS'],pitching:['IP','ERA','WHIP','SO','BB','#P'],fielding:['TC','A','PO','E','FPCT']};
export function StatTable({stats,players,group}:{stats:Record<string,Stat>;players:Player[];group:StatGroup}){
 const {session}=useAuth();const {active}=useTeams();const key=`stat-columns:${session?.user.id}:${active?.id}:${group}`;
 return <Columns key={key} storageKey={key} stats={stats} players={players} group={group}/>;
}
function Columns({storageKey,stats,players,group}:{storageKey:string;stats:Record<string,Stat>;players:Player[];group:StatGroup}){
 const keys=availableColumns(stats,group),[selected,setSelected]=useState<string[]|null>(null),[open,setOpen]=useState(false),[error,setError]=useState('');
 const touched=useRef(false),writes=useRef(Promise.resolve());
 useEffect(()=>{let alive=true;AsyncStorage.getItem(storageKey).then(v=>{if(alive&&!touched.current&&v){const x=JSON.parse(v);if(Array.isArray(x)&&x.every(k=>typeof k==='string'))setSelected(x);}}).catch(()=>{if(alive)setError('Could not load saved column preferences.');});return()=>{alive=false;};},[storageKey]);
 const visible=(selected??defaults[group]).filter(k=>keys.includes(k));const shown=visible.length?visible:keys.slice(0,6);
 function save(next:string[]){touched.current=true;setSelected(next);writes.current=writes.current.then(()=>AsyncStorage.setItem(storageKey,JSON.stringify(next))).catch(()=>setError('Columns changed, but preferences could not be saved on this device.'));}
 const rows=players.filter(p=>stats[p.id]&&availableColumns({p:stats[p.id]},group).length);
 return <View style={c.group}><View style={c.row}><Text style={[c.small,c.grow]}>{rows.length} players · Swipe sideways for more columns</Text><Button secondary onPress={()=>setOpen(true)}>COLUMNS</Button></View><StatusMessage text={error} error/>
 {rows.length?<Panel><ScrollView horizontal showsHorizontalScrollIndicator><View><View style={{flexDirection:'row',padding:12,backgroundColor:palette.raised}}><Text style={[ui.label,{width:160}]}>PLAYER</Text>{shown.map(k=><Text key={k} style={[ui.label,{width:76,textAlign:'right'}]}>{k}</Text>)}</View>{rows.map(p=><View key={p.id} style={{flexDirection:'row',padding:12,minHeight:48,borderTopWidth:1,borderColor:palette.line}}><Text numberOfLines={1} style={[ui.rowTitle,{width:160}]}>{p.number?`#${p.number} `:''}{formatPlayerName(p.name)}</Text>{shown.map(k=><Text key={k} style={[ui.body,{width:76,textAlign:'right',fontVariant:['tabular-nums']}]}>{formatStat(statValue(stats[p.id],group,k),k)}</Text>)}</View>)}</View></ScrollView></Panel>:<Text style={ui.body}>No {group} statistics in this selection.</Text>}
 <Sheet title="Visible statistics" open={open} onClose={()=>setOpen(false)}><Text style={ui.body}>Viewing preferences only. Every imported statistic stays saved and available to the coaching tools.</Text><Button secondary onPress={()=>save(defaults[group].filter(k=>keys.includes(k)))}>RESET TO DEFAULTS</Button><Button secondary onPress={()=>save(keys)}>SHOW ALL</Button>{keys.map(k=><Toggle key={k} label={k} selected={shown.includes(k)} onPress={()=>{if(shown.includes(k)){if(shown.length>1)save(shown.filter(v=>v!==k));}else save([...shown,k]);}}/>)}<Button onPress={()=>setOpen(false)}>DONE</Button></Sheet>
 </View>;
}
