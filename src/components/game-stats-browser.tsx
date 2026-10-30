import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Icon, Panel, palette, ui } from './app-ui';
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
 if(!game)return <View style={c.group}><Text style={c.small}>Choose a game to open its box score.</Text>{games.length?games.map(g=>{const count=Object.keys(g.stats).length;const schedule=gameSchedule(g);return <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`Open ${g.label} versus ${g.opponent}`} onPress={()=>{setSelected(g.id);setGroup((Object.keys(groupLabels) as StatGroup[]).find(x=>availableColumns(g.stats,x).length)??'batting');}} style={({pressed})=>[{backgroundColor:palette.panel,borderRadius:9,borderWidth:1,borderColor:palette.line,padding:18,gap:9},pressed&&ui.dim]}><View style={c.row}><Text style={[c.small,c.grow]}>{g.label.toUpperCase()} · {schedule.date?displayDate(schedule.date):'DATE TBD'}</Text><Icon name="arrow" size={17}/></View><DisplayText style={{fontSize:29,color:palette.ink}}>VS {g.opponent.toUpperCase()}</DisplayText><Text style={{fontSize:11,fontWeight:'700',color:count?palette.accent:palette.muted}}>{count?`${count} PLAYER RECORDS · VIEW BOX SCORE`:'SCHEDULED · NO GAME CSV YET'}</Text></Pressable>;}):<Text style={ui.body}>No games scheduled for this season.</Text>}</View>;
 const eraInnings=game.eraInnings??inferEraInnings(game.stats),summary=teamSummary(game.stats,eraInnings),hasStats=Object.keys(game.stats).length>0,schedule=gameSchedule(game);
 return <View style={c.group}><Button secondary onPress={()=>setSelected('')}>← ALL GAMES</Button>
 <View style={{backgroundColor:palette.navy,padding:20,borderRadius:10,borderBottomWidth:4,borderBottomColor:palette.accent,gap:10}}><Text style={{fontSize:10,fontWeight:'800',color:'#BED2DF',letterSpacing:1}}>{game.label.toUpperCase()} · {schedule.date?displayDate(schedule.date):'DATE TBD'}</Text><DisplayText style={{fontSize:34,color:'white'}}>VS {game.opponent.toUpperCase()}</DisplayText>{!!game.score&&<Text style={{color:'white',fontSize:22,fontWeight:'800'}}>{game.score}</Text>}
 {hasStats&&<View style={{flexDirection:'row',gap:24,flexWrap:'wrap'}}>{[{key:'R',label:'RUNS',value:summary.runs},{key:'H',label:'HITS',value:summary.hits},{key:'ERA',label:'ERA',value:summary.era}].map(m=><View key={m.key} style={{gap:4}}><DisplayText style={{color:'#FF9668',fontSize:32}}>{formatStat(m.value,m.key)}</DisplayText><Text style={{color:'#BED2DF',fontSize:10,fontWeight:'800'}}>{m.label}</Text></View>)}</View>}</View>
 {hasStats?<><Text style={c.small}>{game.importLabel}{game.importedAt?` · Updated ${new Date(game.importedAt).toLocaleDateString()}`:''}</Text><Chips values={Object.entries(groupLabels).map(([value,label])=>({value:value as StatGroup,label:label.toUpperCase()}))} selected={group} onSelect={setGroup}/><StatTable stats={game.stats} players={board.players} group={group}/></>:<Panel><View style={[c.item,{gap:8}]}><Text style={ui.rowTitle}>This game has no imported box score yet.</Text><Text style={ui.body}>A season CSV contains totals, not individual game results. Add this game’s CSV through Imports to see its batting, pitching and fielding here.</Text></View></Panel>}
 </View>;
}
