import { EmptyState } from './empty-state';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Panel, palette } from './app-ui';
import { Chips, c } from './coaching-ui';
import { DisplayText } from './sports-type';
import { StatTable } from './stat-table';
import type { Board } from '@/lib/coaching/board';
import { availableColumns, formatStat, gameSeason, groupLabels, inferEraInnings, teamSummary, type StatGroup } from '@/lib/coaching/stat-data';
import { displayDate } from '@/lib/coaching/calendar';
import { gameSchedule } from '@/lib/coaching/game-schedule';
export function GameStatsBrowser({board,year}:{board:Board;year:string}){
 const [selected,setSelected]=useState(''),[group,setGroup]=useState<StatGroup>('batting');
 const games=board.games.filter(g=>gameSeason(g)===year||!gameSeason(g));const game=games.find(g=>g.id===selected);
 if(!game)return <View style={c.group}><Text style={c.small}>Choose a game to open its box score.</Text>{games.length?<Panel>{games.map((g,i)=>{const count=Object.keys(g.stats).length,schedule=gameSchedule(g);return <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`Open ${g.label} versus ${g.opponent}`} onPress={()=>{setSelected(g.id);setGroup((Object.keys(groupLabels) as StatGroup[]).find(x=>availableColumns(g.stats,x).length)??'batting');}} style={({pressed})=>[{paddingHorizontal:16,paddingVertical:14,gap:6,borderBottomWidth:i<games.length-1?1:0,borderColor:palette.line,backgroundColor:pressed?'#EAF0F4':palette.panel}]}><View style={c.row}><Text style={[c.small,c.grow,{fontSize:10,fontWeight:'800'}]}>{g.label.toUpperCase()} · {schedule.date?displayDate(schedule.date):'DATE TBD'}</Text><Text style={{fontSize:10,fontWeight:'800',color:count?palette.accent:palette.muted}}>{count?`CSV · ${count} PLAYERS`:'NO BOX SCORE'}</Text></View><View style={c.row}><DisplayText style={{fontSize:24,lineHeight:27,color:palette.ink,flex:1}}>VS {g.opponent.toUpperCase()}</DisplayText><Text style={{fontSize:18,color:palette.muted}}>›</Text></View></Pressable>;})}</Panel>:<EmptyState title="Your game history starts here" description="Schedule a game in Lineups. Imported box scores will appear here." action="OPEN LINEUPS" onPress={()=>router.navigate('/lineups')}/>}</View>;
 const eraInnings=game.eraInnings??inferEraInnings(game.stats),summary=teamSummary(game.stats,eraInnings),hasStats=Object.keys(game.stats).length>0,schedule=gameSchedule(game);
 return <View style={c.group}><Button secondary onPress={()=>setSelected('')}>← ALL GAMES</Button>
 <View style={{backgroundColor:palette.navy,padding:20,borderRadius:10,borderBottomWidth:4,borderBottomColor:palette.accent,gap:10}}><Text style={{fontSize:10,fontWeight:'800',color:'#BED2DF',letterSpacing:1}}>{game.label.toUpperCase()} · {schedule.date?displayDate(schedule.date):'DATE TBD'}</Text><DisplayText style={{fontSize:34,color:'white'}}>VS {game.opponent.toUpperCase()}</DisplayText>{!!game.score&&<Text style={{color:'white',fontSize:22,fontWeight:'800'}}>{game.score}</Text>}
 {hasStats&&<View style={{flexDirection:'row',gap:24,flexWrap:'wrap'}}>{[{key:'R',label:'RUNS',value:summary.runs},{key:'H',label:'HITS',value:summary.hits},{key:'ERA',label:'ERA',value:summary.era}].map(m=><View key={m.key} style={{gap:4}}><DisplayText style={{color:'#FF9668',fontSize:32}}>{formatStat(m.value,m.key)}</DisplayText><Text style={{color:'#BED2DF',fontSize:10,fontWeight:'800'}}>{m.label}</Text></View>)}</View>}</View>
 {hasStats?<><Text style={c.small}>{game.importLabel}{game.importedAt?` · Updated ${new Date(game.importedAt).toLocaleDateString()}`:''}</Text><Chips values={Object.entries(groupLabels).map(([value,label])=>({value:value as StatGroup,label:label.toUpperCase()}))} selected={group} onSelect={setGroup}/><StatTable stats={game.stats} players={board.players} group={group}/></>:<EmptyState icon="upload" title="No box score for this game yet" description="Season CSVs contain totals. Import this game’s CSV to see its batting, pitching and fielding here." action="OPEN IMPORTS" onPress={()=>router.navigate('/integrations')}/>}
 </View>;
}

