import { LineupExport } from '@/components/lineup-export';
import { PlanGate } from '@/components/plan-access';
import { defenseLimit, hasPlan } from '@/lib/team-plans';
import { useTeams } from '@/providers/team-provider';
import { DisplayText } from '@/components/sports-type';
import { LineupAction } from '@/components/lineup-action';
import { EliteBattingTools, ElitePitchingTools } from '@/components/elite-lineup-tools';
import { ScrollRoster } from '@/components/scroll-roster';
import { BattingDisplay } from '@/components/batting-display';
import { ResponsiveColumns } from '@/components/responsive-columns';
import { formatPlayerName } from '@/lib/coaching/player-display';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Button, Icon, Panel, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { Choice, CoachingScreen, Field, FieldRow, Sheet, c } from '@/components/coaching-ui';
import { router, useLocalSearchParams } from 'expo-router';
import { AddGameButton, GameCard } from '@/components/game-card';
import { DraggableBattingOrder, type BattingScroll } from '@/components/draggable-batting-order';
import { DefensiveDiamond } from '@/components/defensive-diamond';
import { SavedDefenses } from '@/components/saved-defenses';
import { useCoaching } from '@/providers/coaching-provider';
import { POSITIONS, applyDefensiveLineup, assignPosition, fieldPlayingTime, defensiveMode, fieldInnings, playerName, playersForPosition, recordFieldInning, type Board, type Game } from '@/lib/coaching/board';

type Mode = 'defense' | 'batting' | 'pitching';
export default function LineupsScreen() {
  const params=useLocalSearchParams<{mode?:string;open?:string}>();
  const { board, commit, writable } = useCoaching();
  const game=board?.games.find(g=>g.id===board.activeGameId)??board?.games[0];
  const scrollRef=useRef<ComponentRef<typeof ScrollView>>(null); const offset=useRef(0); const [dragging,setDragging]=useState(false);
  const scroll:BattingScroll={ref:scrollRef,offset,onDragging:setDragging};
  return <CoachingScreen title="Lineups" titleAction={board&&game?<BattingDisplay key={game.id} board={board} game={game} writable={writable} update={change=>commit(b=>({...b,games:b.games.map(g=>g.id===game.id?change(g):g)}))} renderTrigger={(open,disabled)=><Pressable accessibilityRole="button" accessibilityLabel="Open dugout display" accessibilityState={{disabled}} disabled={disabled} onPress={open} style={({pressed})=>[{minHeight:44,paddingHorizontal:12,borderRadius:8,borderWidth:1,borderColor:palette.navy,borderBottomWidth:3,borderBottomColor:palette.accent,backgroundColor:palette.navy,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0px 3px 8px rgba(0,35,55,0.20)'},(pressed||disabled)&&ui.dim]}><Icon name="openWindow" size={18} color={palette.accent}/><Text style={{fontSize:10,lineHeight:14,fontWeight:'800',letterSpacing:0.3,color:palette.white}}>DUGOUT DISPLAY</Text></Pressable>}/>:undefined} scrollRef={scrollRef} scrollEnabled={!dragging} onScroll={event=>{offset.current=event.nativeEvent.contentOffset.y;}}>{board && <LineupBoard key={`${board.activeGameId}:${params.open??''}`} board={board} scroll={scroll} initialMode={params.mode==='pitching'?'pitching':params.mode==='batting'?'batting':'defense'} />}</CoachingScreen>;
}
function LineupBoard({ board,scroll,initialMode }: { board: Board;scroll:BattingScroll;initialMode:Mode }) {
  const { commit, writable } = useCoaching();
  const [mode, setMode] = useState<Mode>(initialMode);
  const game = board.games.find(g => g.id === board.activeGameId) ?? board.games[0];
  if (!game) return <><Text style={ui.body}>No games yet. Add a game to build its lineup.</Text><AddGameButton board={board}/><Button secondary onPress={()=>router.push('/roster')}>MANAGE ROSTER</Button></>;
  const update = (change: (g: Game) => Game) => commit(b => ({ ...b, games: b.games.map(g => g.id === game.id ? change(g) : g) }));
  return <>
    <GameCard board={board} game={game} headerAction={<LineupExport board={board} game={game}/>}/>
    <View style={{width:'100%',flexDirection:'row',gap:8}}>{([{value:'defense',label:'DEFENSE'},{value:'batting',label:'BATTING'},{value:'pitching',label:'PITCHING'}] as const).map(item=><Pressable key={item.value} accessibilityRole="tab" accessibilityState={{selected:mode===item.value}} onPress={()=>setMode(item.value)} style={[c.chip,{flex:1,minWidth:0,minHeight:52,paddingHorizontal:4,alignItems:'center',justifyContent:'center'},mode===item.value&&c.selected]}><Text style={[c.chipText,{textAlign:'center'},mode===item.value&&c.selectedText]}>{item.label}</Text></Pressable>)}</View>
    <View key="lineup-actions" style={{flexDirection:'row',gap:8,alignItems:'stretch'}}>
      <View style={{flex:1,minWidth:0}}><LineupAction label="MANAGE ROSTER" onPress={()=>router.push('/roster')}/></View>
      {mode==='defense'&&!!board.players.length&&<View style={{flex:1,minWidth:0}}><SavedDefenses board={board} game={game} update={update}/></View>}
      {mode==='batting'&&<><View style={{flex:1,minWidth:0}}><EliteBattingTools board={board} game={game} writable={writable} update={update} renderTrigger={(open,disabled)=><LineupAction label="BATTING BLUEPRINT" onPress={open} disabled={disabled} elite/>}/></View></>}
      {mode==='pitching'&&<View style={{flex:1,minWidth:0}}><ElitePitchingTools board={board} game={game} writable={writable} update={update} renderTrigger={(open,disabled)=><LineupAction label="PITCHING BLUEPRINT" onPress={open} disabled={disabled} elite/>}/></View>}
    </View>
    {!board.players.length ? <><Text style={ui.body}>Add your players to build a lineup.</Text><Button onPress={() => router.push('/roster')}>OPEN ROSTER</Button></> : <><View key="defense-panel" collapsable={false} pointerEvents={mode==='defense'?'auto':'none'} accessibilityElementsHidden={mode!=='defense'} importantForAccessibility={mode==='defense'?'auto':'no-hide-descendants'} style={{display:mode==='defense'?'flex':'none',gap:22}}><Defense board={board} game={game} update={update}/></View>{mode==='batting'&&<View key="batting-panel" collapsable={false} style={c.group}><Batting board={board} game={game} update={update} scroll={scroll}/></View>}{mode==='pitching'&&<View key="pitching-panel" collapsable={false} style={c.group}><Pitching board={board} game={game} update={update}/></View>}</>}
  </>;
}
type GameProps = { board: Board; game: Game; update: (change: (g: Game) => Game) => Promise<boolean> };
function Defense({ board, game, update }: GameProps) {
  const { commit, writable } = useCoaching();
  const [position, setPosition] = useState<string | null>(null);
  const {active}=useTeams();const limit=defenseLimit(active);
  const [slot, setSlot] = useState('defense-1');
  const [inning, setInning] = useState(String((game.defenseTrackingInning ?? 0) + 1));
  const [confirm, setConfirm] = useState(false);
  const [problem, setProblem] = useState('');
  const options = [{ value: '', label: 'Unassigned' }, ...(position ? playersForPosition(board.players,position as typeof POSITIONS[number]) : []).map(p => ({ value: p.id, label: `${p.number ? `#${p.number} ` : ''}${formatPlayerName(p.name)}` }))];
  const inningNumber = Number(inning);
  const recorded = game.defenseInnings?.[inningNumber];
  const bench = board.players.filter(p => !Object.values(game.positions).includes(p.id));
  const {width,height}=useWindowDimensions();const landscape=width>=900&&height>=600&&width>height;
  const rosterHeight=landscape?Math.min(288,Math.max(216,Math.floor((height-350)*0.55/72)*72)):300;
  const field=<DefensiveDiamond board={board} positions={game.positions} disabled={!writable} onPosition={setPosition} />;
  const saveControls=<View style={c.row}><View style={c.grow}><Choice label="Save defense to slot" value={slot} options={board.defensiveLineups.slice(0,limit).map(l => ({ value: l.id, label: l.name }))} onChange={setSlot} disabled={!writable} /></View><Button secondary style={{minHeight:76}} disabled={!writable} onPress={() => { void commit(b => ({ ...b, defensiveLineups: b.defensiveLineups.map(l => l.id === slot ? { ...l, positions: { ...game.positions } } : l) })); }}>SAVE</Button></View>;
  const outingControls=<PlanGate plan="pro" title="Defensive innings tracking"><Section title="Confirm this outing"><Text style={ui.body}>Select the inning, then confirm the field assignments.</Text><Field label="Inning" value={inning} onChange={setInning} numeric /><Button disabled={!writable || !Number.isInteger(inningNumber) || inningNumber < 1 || inningNumber > 30 || !Object.values(game.positions).some(Boolean)} onPress={() => setConfirm(true)}>CONFIRM THIS OUTING</Button></Section></PlanGate>;
  const benchList=<Section title={`Bench · ${bench.length}`}><Panel><ScrollRoster maxHeight={rosterHeight} height={landscape?rosterHeight:undefined}>{bench.length ? bench.map(p => <View key={p.id} style={[c.item,c.row,landscape&&{height:72,padding:12,gap:8}]}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[c.number,landscape&&{width:34,fontSize:21}]}>{p.number || '—'}</Text>{landscape?<View style={{flex:1,minWidth:0,gap:3}}><Text numberOfLines={1} style={ui.rowTitle}>{formatPlayerName(p.name)}</Text>{hasPlan(active,'pro')&&<Text style={c.small}>{fieldInnings(game,p.id)} IP</Text>}</View>:<><Text numberOfLines={1} style={[ui.rowTitle,c.grow]}>{formatPlayerName(p.name)}</Text>{hasPlan(active,'pro')&&<Text style={c.small}>{fieldInnings(game,p.id)} IP</Text>}</>}</View>) : <View style={c.item}><Text style={ui.body}>Everyone is on the field.</Text></View>}</ScrollRoster></Panel></Section>;
  const inningsList=<PlanGate plan="pro" title="Field innings and playing time"><Section title={`Field innings · ${board.players.length}`}><Panel><ScrollRoster maxHeight={rosterHeight} height={landscape?rosterHeight:undefined}>{board.players.map(p => {
    const totals=fieldPlayingTime(board,p.id);
    return <View key={p.id} style={[c.item,c.row,landscape&&{height:72,padding:12,gap:8}]}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[c.number,landscape&&{width:34,fontSize:21}]}>{p.number || '—'}</Text>
      <View style={{flex:1,minWidth:0,gap:6}}>
        <Text numberOfLines={1} style={ui.rowTitle}>{formatPlayerName(p.name)}</Text>
        <View style={{flexDirection:'row',gap:16}}>
          {([{label:'Games',value:totals.games},{label:'Innings',value:totals.innings}]).map(stat=><View key={stat.label} style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:4}}>
            <Text style={c.small}>{stat.label}</Text>
            <Text style={[c.small,{fontVariant:['tabular-nums'],fontWeight:'700',color:palette.ink}]}>{stat.value}</Text>
          </View>)}
        </View>
      </View>
    </View>;
  })}</ScrollRoster></Panel></Section></PlanGate>;
  return <>
    <Choice label="Defensive lineup" value={defensiveMode(game, board.defensiveLineups)} options={[{ value: 'manual', label: 'Custom defense' }, ...board.defensiveLineups.slice(0,limit).map(l => ({ value: l.id, label: `${l.name} · P: ${playerName(board, l.positions.P)}` }))]} disabled={!writable} onChange={id => { const lineup = board.defensiveLineups.find(l => l.id === id); if (lineup) void update(g => applyDefensiveLineup(g, lineup, board.players)); else void update(g => ({ ...g, defensiveLineupId: 'manual' })); }} />
    {landscape?<View key="landscape-defense" style={{flexDirection:'row',alignItems:'stretch',gap:22}}><View style={{flex:0.4,minWidth:0,gap:16}}>{field}<View style={{marginTop:'auto'}}>{saveControls}</View></View><View style={{flex:0.6,minWidth:0,gap:20}}><ResponsiveColumns minimum={210} gap={16}><View style={c.group}>{benchList}</View><View style={c.group}>{inningsList}</View></ResponsiveColumns><View style={{marginTop:'auto'}}>{outingControls}</View></View></View>:<ResponsiveColumns key="portrait-defense" stretch><View style={[c.group,{flexGrow:1,justifyContent:'space-between'}]}>{field}{saveControls}{outingControls}</View><View style={[c.group,{flexGrow:1,justifyContent:'space-between'}]}>{benchList}{inningsList}</View></ResponsiveColumns>}

    <Sheet title={`${position ?? ''} assignment`} open={position !== null} onClose={() => setPosition(null)}>{options.map(p => <Pressable key={p.value} accessibilityRole="button" disabled={!writable} onPress={() => { if (position) void update(g => ({ ...g, positions: assignPosition(g.positions, position, p.value), defensiveLineupId: 'manual' })).then(ok => { if (ok) setPosition(null); else setProblem('Assignment was not saved. Close and check the team message.'); }); }} style={c.option}><Text style={ui.rowTitle}>{p.label}</Text></Pressable>)}{!board.players.some(p => position && p.positions?.includes(position as typeof POSITIONS[number])) && <><Text style={ui.body}>No players have this position listed yet. Add playable positions in Roster.</Text><Button secondary onPress={() => { setPosition(null); router.push('/roster'); }}>OPEN ROSTER</Button></>}<StatusMessage text={problem} error /></Sheet>
    <Sheet title={recorded ? `Replace inning ${inning}?` : `Record inning ${inning}?`} open={confirm} onClose={() => setConfirm(false)}><Text style={ui.body}>{recorded ? 'This replaces the previously confirmed assignments for this inning.' : 'This records one field inning for each assigned player. Choosing a lineup alone never adds innings.'}</Text>{POSITIONS.map(pos => <Text key={pos} style={ui.rowTitle}>{pos} · {playerName(board, game.positions[pos])}</Text>)}<Button disabled={!writable} onPress={() => { void update(g => recordFieldInning(g, inningNumber)).then(ok => { if (ok) { setConfirm(false); setInning(String(inningNumber + 1)); } else setProblem('Outing was not saved. Close and check the team message.'); }); }}>{recorded ? 'REPLACE OUTING' : 'RECORD OUTING'}</Button><StatusMessage text={problem} error /></Sheet>
  </>;
}
function Batting({ board, game, update,scroll }: GameProps&{scroll:BattingScroll}) {
  const { writable } = useCoaching();
  return <><View style={c.group}><LineupSectionHeader title="Batting order" caption={`${game.lineup.length} BATTERS`}/><Choice label="Add batter" value="" disabled={!writable} options={[{ value: '', label: 'Choose a player' }, ...board.players.filter(p => !game.lineup.includes(p.id)).map(p => ({ value: p.id, label: formatPlayerName(p.name) }))]} onChange={id => { if (id) void update(g => ({ ...g, lineup: [...g.lineup, id] })); }} /><Button secondary disabled={!writable} onPress={()=>{void update(g=>({...g,lineup:[...g.lineup,...board.players.filter(p=>!g.lineup.includes(p.id)).map(p=>p.id)]}));}}>ADD ALL PLAYERS</Button>{game.lineup.length>0?<><Text style={[c.small,{textAlign:'left'}]}>Hold and drag to reorder · × to remove</Text><DraggableBattingOrder key={game.lineup.join(':')} order={game.lineup} players={board.players} lastBatterId={game.lastBatterId} disabled={!writable} scroll={scroll} onSave={lineup=>update(g=>({...g,lineup}))} onRemove={id=>{void update(g=>({...g,lineup:g.lineup.filter(p=>p!==id),lastBatterId:g.lastBatterId===id?undefined:g.lastBatterId}));}}/></>:<View style={{padding:24,gap:6,alignItems:'center',borderRadius:10,borderWidth:1,borderColor:palette.line,backgroundColor:palette.panel}}><DisplayText style={{fontSize:24,color:palette.ink,textAlign:'center'}}>BUILD YOUR BATTING ORDER</DisplayText><Text style={[c.small,{textAlign:'center'}]}>Choose a batter above or add all players to begin.</Text></View>}</View>{game.lineup.length>0&&<Choice label="Last batter" value={game.lastBatterId ?? ''} options={[{ value: '', label: 'Not recorded' }, ...game.lineup.map(id => ({ value: id, label: playerName(board, id) }))]} disabled={!writable} onChange={id => { void update(g => ({ ...g, lastBatterId: id || undefined })); }} />}</>;
}
function Pitching({ board, game, update }: GameProps) {
  const { writable } = useCoaching();
  const [pitcher, setPitcher] = useState(''); const [innings, setInnings] = useState('0'); const [pitches, setPitches] = useState('0'); const [problem, setProblem] = useState('');
  const pitchers=playersForPosition(board.players,'P');
  if(!pitchers.length)return <><Text style={ui.body}>No pitchers are listed yet. Add P to a player’s positions in Roster.</Text><Button secondary onPress={()=>router.push('/roster')}>OPEN ROSTER</Button></>;
  return <PlanGate plan="pro" title="Pitch and inning tracking"><>{!!game.pitchingPlan?.length&&<Section title="Game pitching plan"><Panel>{game.pitchingPlan.map((id,i)=><View key={id} style={[c.item,c.row]}><Text style={{width:70,color:palette.accent,fontSize:11,fontWeight:'800'}}>{i===0?'STARTER':i===game.pitchingPlan!.length-1?'CLOSER':'RELIEF'}</Text><Text style={[ui.rowTitle,c.grow]}>{playerName(board,id)}</Text></View>)}</Panel></Section>}<View style={c.group}><LineupSectionHeader title="Pitching log" caption={`${pitchers.length} PITCHERS`}/><Choice label="Pitcher" value={pitcher} options={[{ value: '', label: 'Choose a player' }, ...pitchers.map(p => ({ value: p.id, label: formatPlayerName(p.name) }))]} onChange={id => { setPitcher(id); setInnings(game.pitchers[id]?.innings ?? '0'); setPitches(String(game.pitchers[id]?.pitches ?? 0)); }} /><FieldRow><Field label="Innings" value={innings} onChange={setInnings}/><Field label="Pitches" value={pitches} onChange={setPitches} numeric/></FieldRow><Text style={c.small}>Innings: 2.1 means 2 innings + 1 out; 2.2 means 2 innings + 2 outs.</Text><StatusMessage text={problem} error /><Button disabled={!writable || !pitchers.some(p=>p.id===pitcher)} onPress={() => { if (!/^\d{1,2}(\.[012])?$/.test(innings) || !/^\d{1,3}$/.test(pitches)) { setProblem('Use innings such as 2.1 or 2.2, and a whole pitch count.'); return; } setProblem(''); void update(g => ({ ...g, pitchers: { ...g.pitchers, [pitcher]: { innings, pitches: Number(pitches) } } })); }}>SAVE PITCHING LOG</Button></View><Panel accent="navy"><View style={l.staffHeader}><Text style={l.staffTitle}>PITCHING STAFF</Text><Text style={l.staffCount}>{pitchers.length} PLAYERS</Text></View>{pitchers.map(p => { const log = game.pitchers[p.id]; const dayPitches = board.games.filter(g => g.day === game.day).reduce((n, g) => n + (g.pitchers[p.id]?.pitches ?? 0), 0); return <View key={p.id} style={[c.item,{gap:12}]}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={l.pitcherNumber}>{p.number?`#${p.number}`:'—'}</Text><Text style={ui.rowTitle}>{formatPlayerName(p.name)}</Text></View><View style={l.statsRow}>{[{label:'INNINGS',value:log?.innings??'0'},{label:'GAME PITCHES',value:log?.pitches??0},{label:'TODAY’S PITCHES',value:dayPitches}].map((stat,index)=><View key={stat.label} style={[l.stat,index>0&&l.statDivider]}><Text style={l.statValue}>{stat.value}</Text><Text style={l.statLabel}>{stat.label}</Text></View>)}</View></View>; })}</Panel></></PlanGate>;
}


function LineupSectionHeader({title,caption}:{title:string;caption:string}) {
 return <View style={l.sectionHeader}><DisplayText accessibilityRole="header" style={l.sectionTitle}>{title.toUpperCase()}</DisplayText><Text style={l.sectionCaption}>{caption}</Text></View>;
}
const l=StyleSheet.create({
 sectionHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,paddingHorizontal:16,paddingVertical:14,backgroundColor:palette.navy,borderRadius:8,borderBottomWidth:3,borderBottomColor:palette.accent},
 sectionTitle:{color:palette.white,fontSize:23,lineHeight:28,flexShrink:1},sectionCaption:{color:'#AFCBDB',fontSize:10,fontWeight:'800',letterSpacing:1},
 staffHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,backgroundColor:'#E8F0F5',gap:8},staffTitle:{color:palette.navy,fontSize:11,fontWeight:'900',letterSpacing:1},staffCount:{color:palette.muted,fontSize:10,fontWeight:'700'},pitcherNumber:{color:palette.accent,fontSize:16,fontWeight:'900',fontVariant:['tabular-nums'],minWidth:40},
 statsRow:{flexDirection:'row',backgroundColor:'#F1F6F9',borderRadius:6,paddingVertical:10},stat:{flex:1,minWidth:0,alignItems:'center',gap:4,paddingHorizontal:4},statDivider:{borderLeftWidth:1,borderLeftColor:'#CEDDE7'},statValue:{fontSize:20,fontWeight:'800',color:palette.navy,fontVariant:['tabular-nums']},statLabel:{fontSize:8,fontWeight:'800',letterSpacing:.4,color:palette.muted,textAlign:'center'},
});
