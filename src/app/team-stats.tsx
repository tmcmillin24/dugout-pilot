import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlanGate } from '@/components/plan-access';
import { Chips, Choice, CoachingScreen, c } from '@/components/coaching-ui';
import { palette } from '@/components/app-ui';
import { ActionLabel } from '@/components/lineup-action';
import { SeasonSnapshot } from '@/components/season-snapshot';
import { GameStatsBrowser } from '@/components/game-stats-browser';
import { EliteInsights } from '@/components/elite-insights';
import { StatTable } from '@/components/stat-table';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { statsSource, seasonKey, gameSeason, groupLabels, type StatGroup } from '@/lib/coaching/stat-data';
import { formatPlayerName } from '@/lib/coaching/player-display';
export default function TeamStatsScreen(){const {board}=useCoaching();const {active}=useTeams();return <CoachingScreen title="Team stats" back>{board&&<StatsWorkspace key={active?.id}/>}</CoachingScreen>;}
function StatsWorkspace(){
 const {board}=useCoaching();
 const [tab,setTab]=useState<'season'|'games'|'players'|'insights'>('season'),[group,setGroup]=useState<StatGroup>('batting'),[year,setYear]=useState(()=>board?seasonKey(board):''),[selectedPlayer,setSelectedPlayer]=useState('');
 if(!board)return null;
 const seasons=[...new Set([seasonKey(board),...(board.seasonImports??[]).map(s=>s.season),...board.games.map(gameSeason).filter(Boolean)])].sort().reverse();
 const source=statsSource(board,year),stats=source.stats;
 return <View style={c.group}>
 <PlanGate compact plan="pro" title="Season history"><Choice label="Stats season" value={year} options={seasons.map(value=>({value,label:value}))} onChange={setYear}/></PlanGate>
 <View accessibilityRole="tablist" style={{flexDirection:'row',gap:6}}>{(['season','games','players','insights'] as const).map(value=>{const elite=value==='insights',selected=tab===value;return <Pressable key={value} accessibilityRole="tab" accessibilityLabel={elite?'Elite Insights':value} accessibilityState={{selected}} onPress={()=>setTab(value)} style={{flex:1,minWidth:0,height:60,justifyContent:'center',alignItems:'center',paddingHorizontal:5,borderRadius:7,borderWidth:1,borderColor:elite?(selected?palette.accent:palette.navy):palette.line,borderTopWidth:elite?3:1,borderTopColor:elite?palette.accent:palette.line,backgroundColor:elite||selected?palette.navy:palette.panel}}><ActionLabel label={value.toUpperCase()} badge={elite?'ELITE':undefined} color={elite||selected?'white':palette.ink} badgeColor="#FFA06F"/></Pressable>;})}</View>
 {tab==='season'&&<SeasonSnapshot board={{...board,statsSeason:year}} link={false}/>}
 {tab==='games'&&<PlanGate compact plan="pro" title="Game and season history"><GameStatsBrowser key={year} board={board} year={year}/></PlanGate>}
 {tab==='players'&&<Choice label="Player" value={selectedPlayer} options={[{value:'',label:'All players'},...board.players.map(p=>({value:p.id,label:`${p.number?'#'+p.number+' ':''}${formatPlayerName(p.name)}`}))]} onChange={setSelectedPlayer}/>}
 {tab!=='insights'&&tab!=='games'&&<><Chips values={Object.entries(groupLabels).map(([value,label])=>({value:value as StatGroup,label:label.toUpperCase()}))} selected={group} onSelect={setGroup}/><Text style={c.small}>{source.label}</Text><StatTable stats={stats} players={tab==='players'&&selectedPlayer?board.players.filter(p=>p.id===selectedPlayer):board.players} group={group}/>{source.snapshot&&<Text style={c.small}>New game imports add to the season baseline. Games already in the season CSV are counted once.</Text>}</>}
 {tab==='insights'&&<EliteInsights board={board} year={year} selectedPlayer={selectedPlayer} onSelect={setSelectedPlayer}/>}
 </View>;
}

