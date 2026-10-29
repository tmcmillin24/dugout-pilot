import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, MenuRow, Panel, StatusMessage, palette, ui } from './app-ui';
import { Field, Sheet, c } from './coaching-ui';
import { DisplayText } from './sports-type';
import { useCoaching } from '@/providers/coaching-provider';
import { newGame, type Board, type Game } from '@/lib/coaching/board';
import { nextGameNumber, removeGame } from '@/lib/coaching/game-management';
export function GameCard({board,game}:{board:Board;game:Game}) {
  const {commit,writable,busy}=useCoaching();const [picker,setPicker]=useState(false);const [menu,setMenu]=useState(false);const [mode,setMode]=useState<'actions'|'edit'|'delete'>('actions');
  function add(){const next=newGame(game.day,nextGameNumber(board.games),game);void commit(b=>({...b,games:[...b.games,next],activeGameId:next.id}));}
  return <>
    <View style={s.card}><View style={s.top}><Text style={s.kicker}>GAME</Text><Pressable accessibilityRole="button" accessibilityLabel="Game options: edit, add, or delete" onPress={()=>{setMode('actions');setMenu(true);}} style={s.more}><Icon name="more" color={palette.ink} size={24}/></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel={`Choose game. ${game.label} versus ${game.opponent}`} disabled={!writable} onPress={()=>setPicker(true)} style={s.selection}><View style={ui.flex}><Text style={s.meta}>DAY {game.day} · {game.label}</Text><DisplayText style={s.opponent}>{game.opponent}</DisplayText><Text style={s.time}>{game.time||'Date / time not set'}</Text></View><Text style={s.chevron}>▾</Text></Pressable></View>
    <Sheet title="Choose game" open={picker} onClose={()=>setPicker(false)}>{board.games.map(item=><Pressable key={item.id} accessibilityRole="button" disabled={!writable} onPress={()=>{void commit(b=>({...b,activeGameId:item.id})).then(ok=>{if(ok)setPicker(false);});}} style={[c.option,item.id===game.id&&{backgroundColor:palette.badgeSurface}]}><Text style={ui.rowTitle}>{item.label} · {item.opponent}</Text><Text style={c.small}>Day {item.day} · {item.time||'Time not set'}</Text></Pressable>)}</Sheet>
    <Sheet title={mode==='delete'?'Delete game?':mode==='edit'?'Edit game':'Game options'} open={menu} onClose={()=>{if(!busy)setMenu(false);}}>
      {mode==='actions'?<Panel><MenuRow icon="settings" title="Edit game" onPress={()=>setMode('edit')}/><MenuRow icon="plus" title="Add next game" onPress={()=>{if(writable){setMenu(false);add();}}}/><MenuRow icon="trash" title="Delete game" onPress={()=>setMode('delete')} last/></Panel>:mode==='edit'?<GameDetails key={game.id} game={game} close={()=>setMenu(false)}/>:<>
        <View style={s.warning}><Icon name="trash" color={palette.error} size={28}/><DisplayText style={s.warningTitle}>{game.label.toUpperCase()}</DisplayText><Text style={ui.rowTitle}>vs {game.opponent}</Text></View>
        <Text style={ui.body}>Delete this game and its batting order, field assignments, confirmed innings, pitching logs, imported stats, and notes?</Text><Text style={c.small}>Your roster, saved defensive lineups, practices, and other games stay available.</Text>
        <Pressable accessibilityRole="button" disabled={!writable} onPress={()=>{void commit(b=>removeGame(b,game.id)).then(ok=>{if(ok)setMenu(false);});}} style={[ui.button,{backgroundColor:palette.error},!writable&&ui.dim]}><Text style={[ui.buttonText,{color:palette.white}]}>DELETE GAME</Text></Pressable><Button secondary disabled={busy} onPress={()=>setMenu(false)}>CANCEL</Button>
      </>}
    </Sheet>
  </>;
}
function GameDetails({game,close}:{game:Game;close:()=>void}) {
  const {commit,writable}=useCoaching();const [label,setLabel]=useState(game.label);const [opponent,setOpponent]=useState(game.opponent);const [day,setDay]=useState(String(game.day));const [time,setTime]=useState(game.time);const [problem,setProblem]=useState('');
  const valid=/^\d{1,3}$/.test(day)&&Number(day)>=1&&!!label.trim()&&!!opponent.trim();
  return <><Field label="Game label" value={label} onChange={setLabel}/><Field label="Opponent" value={opponent} onChange={setOpponent}/><Field label="Tournament day" value={day} onChange={setDay} numeric/><Field label="Date / time" value={time} onChange={setTime}/><Button disabled={!writable||!valid} onPress={()=>{void commit(b=>({...b,games:b.games.map(g=>g.id===game.id?{...g,label:label.trim(),opponent:opponent.trim(),day:Number(day),time}:g)})).then(ok=>{if(ok)close();else setProblem('Game was not saved. Check the team message above.');});}}>SAVE DETAILS</Button><StatusMessage text={problem} error/></>;
}
const s=StyleSheet.create({card:{width:'100%',backgroundColor:palette.panel,borderWidth:1,borderColor:palette.line,borderRadius:8,overflow:'hidden'},top:{flexDirection:'row',alignItems:'center',paddingLeft:17,paddingRight:5,borderBottomWidth:1,borderColor:palette.line},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1.6,color:palette.muted,flex:1},more:{width:44,height:44,alignItems:'center',justifyContent:'center'},selection:{padding:17,flexDirection:'row',alignItems:'center',gap:12},meta:{fontSize:11,fontWeight:'700',color:palette.muted},opponent:{fontSize:30,color:palette.ink,marginVertical:4},time:{fontSize:12,color:palette.muted,lineHeight:18},chevron:{fontSize:21,color:palette.ink},warning:{gap:8,padding:17,backgroundColor:'#FFF0ED',borderRadius:7},warningTitle:{fontSize:29,color:palette.ink}});
