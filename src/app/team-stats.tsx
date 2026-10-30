import { useState } from 'react';
import { Text, View } from 'react-native';
import { Chips, CoachingScreen, c } from '@/components/coaching-ui';
import { Panel, Section, ui } from '@/components/app-ui';
import { SeasonSnapshot } from '@/components/season-snapshot';
import { useCoaching } from '@/providers/coaching-provider';
import { battingTotals, importedGames } from '@/lib/coaching/team-stats';
import { formatPlayerName } from '@/lib/coaching/player-display';
import { displayDate } from '@/lib/coaching/calendar';
export default function TeamStatsScreen(){
 const {board}=useCoaching();const [tab,setTab]=useState<'season'|'games'|'players'>('season');
 const games=board?importedGames(board):[];
 return <CoachingScreen title="Team stats" back>{board&&<>
 <Chips values={[{value:'season',label:'SEASON'},{value:'games',label:'GAMES'},{value:'players',label:'PLAYERS'}]} selected={tab} onSelect={setTab}/>
 {tab==='season'&&<><SeasonSnapshot board={board} link={false}/><Text style={ui.body}>Totals cover imported games. OBP and ERA need complete supporting counts; individual rates are never averaged together.</Text></>}
 {tab==='games'&&<Section title={`Imported games · ${games.length}`}><Panel>{games.length?games.map(g=><View key={g.id} style={c.item}><Text style={ui.rowTitle}>{g.label} · {g.opponent}</Text><Text style={c.small}>{g.date?displayDate(g.date):'No date'}{g.score?` · ${g.score}`:''}</Text><Text style={c.small}>{g.importLabel}</Text>{board.players.filter(p=>g.stats[p.id]).map(p=>{const x=g.stats[p.id];return <Text key={p.id} style={ui.body}>{formatPlayerName(p.name)} · AB {x.ab??'—'} · H {x.h??'—'} · BB {x.bb??'—'} · IP {x.ip??'—'}</Text>;})}</View>):<View style={c.item}><Text style={ui.body}>No game stats imported yet. Use Imports in Team tools.</Text></View>}</Panel></Section>}
 {tab==='players'&&<Section title={`Roster · ${board.players.length}`}><Panel>{board.players.length?board.players.map(p=>{const rows=games.flatMap(g=>g.stats[p.id]?[g.stats[p.id]]:[]);const t=battingTotals(rows);return <View key={p.id} style={[c.item,c.row]}><Text style={c.number} numberOfLines={1}>{p.number||'—'}</Text><View style={c.grow}><Text style={ui.rowTitle}>{formatPlayerName(p.name)}</Text><Text style={c.small}>{rows.length?`${rows.length} imports · AVG ${t.avg} · H ${t.h??'—'} · AB ${t.ab??'—'} · BB ${t.bb??'—'}`:'No imported stats'}</Text></View></View>;}):<View style={c.item}><Text style={ui.body}>No players on this roster yet.</Text></View>}</Panel></Section>}
 </>}</CoachingScreen>;
}
