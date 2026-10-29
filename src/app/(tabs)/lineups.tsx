import { formatPlayerName } from '@/lib/coaching/player-display';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Panel, Section, StatusMessage, ui } from '@/components/app-ui';
import { Chips, Choice, CoachingScreen, Field, Sheet, c } from '@/components/coaching-ui';
import { router } from 'expo-router';
import { GameCard } from '@/components/game-card';
import { nextGameNumber } from '@/lib/coaching/game-management';
import { DraggableBattingOrder, type BattingScroll } from '@/components/draggable-batting-order';
import { DefensiveDiamond } from '@/components/defensive-diamond';
import { SavedDefenses } from '@/components/saved-defenses';
import { useCoaching } from '@/providers/coaching-provider';
import { POSITIONS, applyDefensiveLineup, assignPosition, dayFieldInnings, defensiveMode, fieldInnings, newGame, playerName, playersForPosition, recordFieldInning, type Board, type Game } from '@/lib/coaching/board';

type Mode = 'defense' | 'batting' | 'pitching';
export default function LineupsScreen() {
  const { board } = useCoaching();
  const scrollRef=useRef<ComponentRef<typeof ScrollView>>(null); const offset=useRef(0); const [dragging,setDragging]=useState(false);
  const scroll:BattingScroll={ref:scrollRef,offset,onDragging:setDragging};
  return <CoachingScreen title="Lineups" scrollRef={scrollRef} scrollEnabled={!dragging} onScroll={event=>{offset.current=event.nativeEvent.contentOffset.y;}}>{board && <LineupBoard key={board.activeGameId} board={board} scroll={scroll} />}</CoachingScreen>;
}
function LineupBoard({ board,scroll }: { board: Board;scroll:BattingScroll }) {
  const { commit, writable } = useCoaching();
  const [mode, setMode] = useState<Mode>('defense');
  const game = board.games.find(g => g.id === board.activeGameId) ?? board.games[0];
  if (!game) return <><Text style={ui.body}>No games yet. Add a game to build its lineup.</Text><Button disabled={!writable} onPress={()=>{const next=newGame(1,nextGameNumber(board.games));void commit(b=>({...b,games:[...b.games,next],activeGameId:next.id}));}}>ADD GAME</Button><Button secondary onPress={()=>router.push('/roster')}>MANAGE ROSTER</Button></>;
  const update = (change: (g: Game) => Game) => commit(b => ({ ...b, games: b.games.map(g => g.id === game.id ? change(g) : g) }));
  return <>
    <GameCard board={board} game={game}/>
    <Chips values={[{ value: 'defense', label: 'DEFENSE' }, { value: 'batting', label: 'BATTING' }, { value: 'pitching', label: 'PITCHING' }]} selected={mode} onSelect={setMode} />
    <Button secondary onPress={() => router.push('/roster')}>MANAGE ROSTER</Button>
    {!board.players.length ? <><Text style={ui.body}>Add your players to build a lineup.</Text><Button onPress={() => router.push('/roster')}>OPEN ROSTER</Button></> : mode === 'defense' ? <Defense board={board} game={game} update={update} /> : mode === 'batting' ? <Batting board={board} game={game} update={update} scroll={scroll} /> : <Pitching board={board} game={game} update={update} />}
  </>;
}
type GameProps = { board: Board; game: Game; update: (change: (g: Game) => Game) => Promise<boolean> };
function Defense({ board, game, update }: GameProps) {
  const { commit, writable } = useCoaching();
  const [position, setPosition] = useState<string | null>(null);
  const [slot, setSlot] = useState('defense-1');
  const [inning, setInning] = useState(String((game.defenseTrackingInning ?? 0) + 1));
  const [confirm, setConfirm] = useState(false);
  const [problem, setProblem] = useState('');
  const options = [{ value: '', label: 'Unassigned' }, ...(position ? playersForPosition(board.players,position as typeof POSITIONS[number]) : []).map(p => ({ value: p.id, label: `${p.number ? `#${p.number} ` : ''}${formatPlayerName(p.name)}` }))];
  const inningNumber = Number(inning);
  const recorded = game.defenseInnings?.[inningNumber];
  const bench = board.players.filter(p => !Object.values(game.positions).includes(p.id));
  return <>
    <SavedDefenses board={board} game={game} update={update} /><Choice label="Defensive lineup" value={defensiveMode(game, board.defensiveLineups)} options={[{ value: 'manual', label: 'Custom defense' }, ...board.defensiveLineups.map(l => ({ value: l.id, label: `${l.name} · P: ${playerName(board, l.positions.P)}` }))]} disabled={!writable} onChange={id => { const lineup = board.defensiveLineups.find(l => l.id === id); if (lineup) void update(g => applyDefensiveLineup(g, lineup, board.players)); else void update(g => ({ ...g, defensiveLineupId: 'manual' })); }} />
    <DefensiveDiamond board={board} positions={game.positions} disabled={!writable} onPosition={setPosition} />
    <Section title={`Bench · ${bench.length}`}><Panel>{bench.length ? bench.map(p => <View key={p.id} style={[c.item, c.row]}><Text style={c.number}>{p.number || '—'}</Text><Text style={[ui.rowTitle, c.grow]}>{formatPlayerName(p.name)}</Text><Text style={c.small}>{fieldInnings(game, p.id)} IP field</Text></View>) : <View style={c.item}><Text style={ui.body}>Everyone is on the field.</Text></View>}</Panel></Section>
    <View style={c.row}><View style={c.grow}><Choice label="Save defense to slot" value={slot} options={board.defensiveLineups.map(l => ({ value: l.id, label: l.name }))} onChange={setSlot} disabled={!writable} /></View><Button secondary disabled={!writable} onPress={() => { void commit(b => ({ ...b, defensiveLineups: b.defensiveLineups.map(l => l.id === slot ? { ...l, positions: { ...game.positions } } : l) })); }}>SAVE</Button></View>
    <Section title="Confirm this outing"><Text style={ui.body}>Select the inning, then confirm the field assignments.</Text><Field label="Inning" value={inning} onChange={setInning} numeric /><Button disabled={!writable || !Number.isInteger(inningNumber) || inningNumber < 1 || inningNumber > 30 || !Object.values(game.positions).some(Boolean)} onPress={() => setConfirm(true)}>CONFIRM THIS OUTING</Button></Section>
    <Section title="Field innings"><Panel>{board.players.map(p => <View key={p.id} style={[c.item, c.row]}><Text style={[ui.rowTitle, c.grow]}>{formatPlayerName(p.name)}</Text><Text style={c.small}>{fieldInnings(game, p.id)} game · {dayFieldInnings(board, game.day, p.id)} day</Text></View>)}</Panel></Section>
    <Sheet title={`${position ?? ''} assignment`} open={position !== null} onClose={() => setPosition(null)}>{options.map(p => <Pressable key={p.value} accessibilityRole="button" disabled={!writable} onPress={() => { if (position) void update(g => ({ ...g, positions: assignPosition(g.positions, position, p.value), defensiveLineupId: 'manual' })).then(ok => { if (ok) setPosition(null); else setProblem('Assignment was not saved. Close and check the team message.'); }); }} style={c.option}><Text style={ui.rowTitle}>{p.label}</Text></Pressable>)}{!board.players.some(p => position && p.positions?.includes(position as typeof POSITIONS[number])) && <><Text style={ui.body}>No players have this position listed yet. Add playable positions in Roster.</Text><Button secondary onPress={() => { setPosition(null); router.push('/roster'); }}>OPEN ROSTER</Button></>}<StatusMessage text={problem} error /></Sheet>
    <Sheet title={recorded ? `Replace inning ${inning}?` : `Record inning ${inning}?`} open={confirm} onClose={() => setConfirm(false)}><Text style={ui.body}>{recorded ? 'This replaces the previously confirmed assignments for this inning.' : 'This records one field inning for each assigned player. Choosing a lineup alone never adds innings.'}</Text>{POSITIONS.map(pos => <Text key={pos} style={ui.rowTitle}>{pos} · {playerName(board, game.positions[pos])}</Text>)}<Button disabled={!writable} onPress={() => { void update(g => recordFieldInning(g, inningNumber)).then(ok => { if (ok) { setConfirm(false); setInning(String(inningNumber + 1)); } else setProblem('Outing was not saved. Close and check the team message.'); }); }}>{recorded ? 'REPLACE OUTING' : 'RECORD OUTING'}</Button><StatusMessage text={problem} error /></Sheet>
  </>;
}
function Batting({ board, game, update,scroll }: GameProps&{scroll:BattingScroll}) {
  const { writable } = useCoaching();
  return <><Section title="Batting order"><Choice label="Add batter" value="" disabled={!writable} options={[{ value: '', label: 'Choose a player' }, ...board.players.filter(p => !game.lineup.includes(p.id)).map(p => ({ value: p.id, label: formatPlayerName(p.name) }))]} onChange={id => { if (id) void update(g => ({ ...g, lineup: [...g.lineup, id] })); }} /><Button secondary disabled={!writable} onPress={() => { void update(g => ({ ...g, lineup: [...g.lineup, ...board.players.filter(p => !g.lineup.includes(p.id)).map(p => p.id)] })); }}>ADD ALL PLAYERS</Button><Text style={ui.body}>Touch and hold a player, then drag to change the order.</Text><DraggableBattingOrder key={game.lineup.join(':')} order={game.lineup} players={board.players} lastBatterId={game.lastBatterId} disabled={!writable} scroll={scroll} onSave={lineup=>update(g=>({...g,lineup}))} onRemove={id=>{void update(g=>({...g,lineup:g.lineup.filter(p=>p!==id),lastBatterId:g.lastBatterId===id?undefined:g.lastBatterId}));}}/></Section><Choice label="Last batter" value={game.lastBatterId ?? ''} options={[{ value: '', label: 'Not recorded' }, ...game.lineup.map(id => ({ value: id, label: playerName(board, id) }))]} disabled={!writable} onChange={id => { void update(g => ({ ...g, lastBatterId: id || undefined })); }} />{game.lastBatterId && <Text style={ui.rowTitle}>Next up: {playerName(board, game.lineup[(game.lineup.indexOf(game.lastBatterId) + 1) % game.lineup.length])}</Text>}</>;
}
function Pitching({ board, game, update }: GameProps) {
  const { writable } = useCoaching();
  const [pitcher, setPitcher] = useState(''); const [innings, setInnings] = useState('0'); const [pitches, setPitches] = useState('0'); const [problem, setProblem] = useState('');
  const pitchers=playersForPosition(board.players,'P');
  if(!pitchers.length)return <><Text style={ui.body}>No pitchers are listed yet. Add P to a player’s positions in Roster.</Text><Button secondary onPress={()=>router.push('/roster')}>OPEN ROSTER</Button></>;
  return <><Section title="Pitching log"><Choice label="Pitcher" value={pitcher} options={[{ value: '', label: 'Choose a player' }, ...pitchers.map(p => ({ value: p.id, label: formatPlayerName(p.name) }))]} onChange={id => { setPitcher(id); setInnings(game.pitchers[id]?.innings ?? '0'); setPitches(String(game.pitchers[id]?.pitches ?? 0)); }} /><View style={c.row}><View style={c.grow}><Field label="Innings (2.1 = 2 innings + 1 out)" value={innings} onChange={setInnings} /></View><View style={c.grow}><Field label="Pitches" value={pitches} onChange={setPitches} numeric /></View></View><StatusMessage text={problem} error /><Button disabled={!writable || !pitchers.some(p=>p.id===pitcher)} onPress={() => { if (!/^\d{1,2}(\.[012])?$/.test(innings) || !/^\d{1,3}$/.test(pitches)) { setProblem('Use innings such as 2.1 or 2.2, and a whole pitch count.'); return; } setProblem(''); void update(g => ({ ...g, pitchers: { ...g.pitchers, [pitcher]: { innings, pitches: Number(pitches) } } })); }}>SAVE PITCHING LOG</Button></Section><Panel>{pitchers.map(p => { const log = game.pitchers[p.id]; const dayPitches = board.games.filter(g => g.day === game.day).reduce((n, g) => n + (g.pitchers[p.id]?.pitches ?? 0), 0); return <View key={p.id} style={c.item}><Text style={ui.rowTitle}>{formatPlayerName(p.name)}</Text><Text style={c.small}>{log?.innings ?? '0'} IP · {log?.pitches ?? 0} pitches this game · {dayPitches} pitches today</Text></View>; })}</Panel></>;
}
