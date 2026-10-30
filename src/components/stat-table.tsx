import { useAccountPreference } from '@/hooks/use-account-preference';
import { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Button, Panel, StatusMessage, palette, ui } from './app-ui';
import { Sheet, c } from './coaching-ui';
import { Toggle } from './practice-planner-controls';
import { useAuth } from '@/providers/auth-provider';
import { useTeams } from '@/providers/team-provider';
import { availableColumns, formatStat, statValue, type StatGroup } from '@/lib/coaching/stat-data';
import { formatPlayerName } from '@/lib/coaching/player-display';
import type { Player, Stat } from '@/lib/coaching/board';
function validateColumns(value:unknown):string[]|null{return Array.isArray(value)&&value.length&&value.every(k=>typeof k==='string')?[...new Set(value)]:null;}
const defaults={batting:['GP','PA','AB','H','R','RBI','AVG','OBP','OPS'],pitching:['IP','ERA','WHIP','SO','BB','#P'],fielding:['TC','A','PO','E','FPCT']};
export function StatTable({stats,players,group}:{stats:Record<string,Stat>;players:Player[];group:StatGroup}){
 const {session}=useAuth();const {active}=useTeams();const key=`stat-columns:${session?.user.id}:${active?.id}:${group}`;
 return <Columns key={key} storageKey={key} stats={stats} players={players} group={group}/>;
}
function Columns({storageKey,stats,players,group}:{storageKey:string;stats:Record<string,Stat>;players:Player[];group:StatGroup}){
 const {width}=useWindowDimensions();const identityWidth=width>=700?180:136;
 const keys=availableColumns(stats,group),[open,setOpen]=useState(false);
 const preference=useAccountPreference<string[]|null>(storageKey,null,validateColumns),selected=preference.value,error=preference.error;
 const visible=(selected??defaults[group]).filter(k=>keys.includes(k));const shown=visible.length?visible:keys.slice(0,6);
 function save(next:string[]){preference.save(next);}
 const rows=players.filter(p=>stats[p.id]&&availableColumns({p:stats[p.id]},group).length);
 return <View style={c.group}><View style={c.row}><Text style={[c.small,c.grow]}>{rows.length} players · Names stay fixed as you swipe</Text><Button secondary onPress={()=>setOpen(true)}>FILTER</Button></View><StatusMessage text={error} error/>
 {rows.length?<Panel><View style={{flexDirection:'row',width:'100%'}}>
 <View style={{width:identityWidth,borderRightWidth:1,borderColor:palette.line,backgroundColor:palette.panel}}><View style={{height:42,paddingHorizontal:12,justifyContent:'center',backgroundColor:palette.navy}}><Text style={{color:'white',fontSize:10,fontWeight:'800',letterSpacing:1}}>PLAYER</Text></View>{rows.map(p=><View key={p.id} style={{height:58,paddingHorizontal:10,justifyContent:'center',gap:3,borderTopWidth:1,borderColor:palette.line}}><Text style={{fontSize:10,fontWeight:'800',color:palette.accent}}>#{p.number||'—'}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[ui.rowTitle,{fontSize:14}]}>{formatPlayerName(p.name)}</Text></View>)}</View>
 <ScrollView horizontal showsHorizontalScrollIndicator directionalLockEnabled style={{flex:1,minWidth:0}}><View style={{width:shown.length*76}}><View style={{flexDirection:'row',height:42,backgroundColor:palette.navy}}>{shown.map(k=><View key={k} style={{width:76,justifyContent:'center',alignItems:'center'}}><Text style={{color:'white',fontSize:11,fontWeight:'800'}}>{k}</Text></View>)}</View>{rows.map((p,index)=><View key={p.id} style={{flexDirection:'row',height:58,borderTopWidth:1,borderColor:palette.line,backgroundColor:index%2?'#F3F6F8':palette.panel}}>{shown.map(k=><View key={k} style={{width:76,justifyContent:'center',alignItems:'center'}}><Text style={[ui.rowTitle,{fontSize:15,fontVariant:['tabular-nums']}]}>{formatStat(statValue(stats[p.id],group,k),k)}</Text></View>)}</View>)}</View></ScrollView>
 </View></Panel>:<Text style={ui.body}>No {group} statistics in this selection.</Text>}

 <Sheet title="Filter statistics" open={open} onClose={()=>setOpen(false)}><Text style={ui.body}>Choose the statistics to display. Hidden stats stay saved.</Text><Button secondary onPress={()=>save(defaults[group].filter(k=>keys.includes(k)))}>RESET TO DEFAULTS</Button><Button secondary onPress={()=>save(keys)}>SHOW ALL</Button>{keys.map(k=><Toggle key={k} label={k} selected={shown.includes(k)} onPress={()=>{if(shown.includes(k)){if(shown.length>1)save(shown.filter(v=>v!==k));}else save([...shown,k]);}}/>)}<Button onPress={()=>setOpen(false)}>DONE</Button></Sheet>
 </View>;
}
