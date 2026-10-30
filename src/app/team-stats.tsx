import { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { Chips, Choice, CoachingScreen, c } from '@/components/coaching-ui';
import { Button, Panel, Section, StatusMessage, ui } from '@/components/app-ui';
import { SeasonSnapshot } from '@/components/season-snapshot';
import { GameStatsBrowser } from '@/components/game-stats-browser';
import { StatTable } from '@/components/stat-table';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { statsSource, seasonKey, gameSeason, groupLabels, aggregateStats, type StatGroup } from '@/lib/coaching/stat-data';
import { batterProfile, hasEliteAccess, playerReport, practicePriorities } from '@/lib/coaching/elite-stats';
import { formatPlayerName } from '@/lib/coaching/player-display';
import { parseCalendarDate } from '@/lib/coaching/calendar';
export default function TeamStatsScreen(){const {board}=useCoaching();const {active}=useTeams();return <CoachingScreen title="Team stats" back>{board&&<StatsWorkspace key={active?.id}/>}</CoachingScreen>;}
function StatsWorkspace(){
 const {board}=useCoaching();const {active}=useTeams();
 const [tab,setTab]=useState<'season'|'games'|'players'|'insights'>('season'),[group,setGroup]=useState<StatGroup>('batting'),[year,setYear]=useState(()=>board?seasonKey(board):''),[selectedPlayer,setSelectedPlayer]=useState(''),[error,setError]=useState('');
 if(!board)return null;
 const seasons=[...new Set([seasonKey(board),...(board.seasonImports??[]).map(s=>s.season),...board.games.map(gameSeason).filter(Boolean)])].sort().reverse();
 const source=statsSource(board,year);
 const stats=source.stats;
 const player=board.players.find(p=>p.id===selectedPlayer)??board.players[0];
 const recent=source.games.filter(g=>parseCalendarDate(g.date??'')).sort((a,b)=>parseCalendarDate(b.date!)!.getTime()-parseCalendarDate(a.date!)!.getTime()).slice(0,3);
 const ideas=practicePriorities({...board,statsSeason:year});
 return <>
 <Choice label="Stats season" value={year} options={seasons.map(value=>({value,label:value}))} onChange={setYear}/>
 <Chips values={[{value:'season',label:'SEASON'},{value:'games',label:'GAMES'},{value:'players',label:'PLAYERS'},{value:'insights',label:'ELITE INSIGHTS'}]} selected={tab} onSelect={setTab}/>
 {tab==='season'&&<SeasonSnapshot board={{...board,statsSeason:year}} link={false}/>}
 {tab==='games'&&<GameStatsBrowser key={year} board={board} year={year}/>}
 {tab==='players'&&<Choice label="Player" value={selectedPlayer} options={[{value:'',label:'All players'},...board.players.map(p=>({value:p.id,label:`${p.number?'#'+p.number+' ':''}${formatPlayerName(p.name)}`}))]} onChange={setSelectedPlayer}/>}
 {tab!=='insights'&&tab!=='games'&&<><Chips values={Object.entries(groupLabels).map(([value,label])=>({value:value as StatGroup,label:label.toUpperCase()}))} selected={group} onSelect={setGroup}/><Text style={c.small}>{source.label}</Text><StatTable stats={stats} players={tab==='players'&&selectedPlayer?board.players.filter(p=>p.id===selectedPlayer):board.players} group={group}/>{source.snapshot&&<Text style={c.small}>New game imports add to the season baseline. Games already in the season CSV are counted once.</Text>}</>}
 {tab==='insights'&&(!hasEliteAccess(active)?<Text style={ui.body}>These tools are available with active Elite or trial access.</Text>:<>
 <Section title="Practice priorities"><Panel><View style={c.item}>{ideas.length?ideas.map(i=><View key={i.focus} style={{gap:4,paddingVertical:6}}><Text style={ui.rowTitle}>{i.focus.toUpperCase()}</Text><Text style={ui.body}>{i.reason}</Text></View>):<Text style={ui.body}>No clear priority from the available sample yet. More complete game stats will help.</Text>}</View></Panel></Section>
 <Section title="Recent vs season"><Text style={ui.body}>Last {recent.length} dated game imports compared with {year} season data. Season exports alone cannot show recent trends.</Text>
 {recent.length?board.players.map(p=>{const rows=recent.flatMap(g=>g.stats[p.id]?[g.stats[p.id]]:[]);if(!rows.length)return null;const latest=batterProfile(aggregateStats(rows)),season=batterProfile(source.stats[p.id]);return <Panel key={p.id}><View style={c.item}><Text style={ui.rowTitle}>{formatPlayerName(p.name)}</Text><Text style={ui.body}>Recent AVG {latest.avg?.toFixed(3)??'—'} · Season AVG {season.avg?.toFixed(3)??'—'}</Text><Text style={c.small}>{rows.length} games · {latest.pa} recent PA{latest.small?' · Small sample':''}</Text></View></Panel>;}):<Text style={c.small}>Import individual games to build a recent-performance history.</Text>}</Section>
 <Section title="Player development report">{player?<><Choice label="Player" value={player.id} options={board.players.map(p=>({value:p.id,label:formatPlayerName(p.name)}))} onChange={setSelectedPlayer}/><Panel><View style={c.item}><Text style={ui.body}>{playerReport(player,source.stats[player.id])}</Text></View></Panel><Button secondary onPress={()=>{void Share.share({message:`${active?.name??'Team'} · ${year}\n${source.label}\n\n${playerReport(player,source.stats[player.id])}`}).catch(()=>setError('Could not open the share sheet.'));}}>SHARE REPORT</Button></>:<Text style={ui.body}>Import or add players to create a report.</Text>}</Section>
 <Text style={c.small}>Recommendations run on this device. They use imported numbers; they do not account for opponents, competition strength or injuries. Small samples need coach judgment.</Text>
 </>)}<StatusMessage text={error} error/>
 </>;
}
