import { useState } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OverlayModal } from './overlay-modal';
import { Button, palette } from './app-ui';
import { Choice } from './coaching-ui';
import { DisplayText } from './sports-type';
import { formatPlayerName } from '@/lib/coaching/player-display';
import { nextBatterIndex } from '@/lib/coaching/batting-display';
import type { Board, Game } from '@/lib/coaching/board';

type Props = { board: Board; game: Game; writable: boolean; update: (change: (game: Game) => Game) => Promise<boolean> };
export function BattingDisplay({board,game,writable,update}:Props) {
  const [open,setOpen]=useState(false);
  return <><Button secondary disabled={!game.lineup.length} onPress={()=>setOpen(true)}>DUGOUT DISPLAY</Button><OverlayModal open={open} onClose={()=>setOpen(false)}>{open&&<Display board={board} game={game} writable={writable} update={update} onClose={()=>setOpen(false)}/>}</OverlayModal></>;
}
function Display({board,game,writable,update,onClose}:Props&{onClose:()=>void}) {
  useKeepAwake();
  const {width,height}=useWindowDimensions(); const insets=useSafeAreaInsets();
  const [pending,setPending]=useState(false); const [error,setError]=useState('');
  const index=nextBatterIndex(game.lineup,game.lastBatterId);
  const current=game.lineup[index]; const next=game.lineup[(index+1)%game.lineup.length];
  const player=(id:string)=>board.players.find(p=>p.id===id);
  const columns=width>=1000?3:width>=600?2:1;
  const compact=height<650;
  async function record(id:string) { if(pending||!writable)return;setPending(true);setError('');try {const ok=await update(g=>({...g,lastBatterId:id||undefined}));if(!ok)setError('Could not save. The batting position has not changed.');}catch{setError('Could not save. Try again.');}finally{setPending(false);} }
  return <View accessibilityViewIsModal style={[s.screen,{paddingTop:Math.max(insets.top,16),paddingBottom:Math.max(insets.bottom,12),paddingLeft:Math.max(insets.left,20),paddingRight:Math.max(insets.right,20)}]}>
    <View style={s.header}><DisplayText style={s.title}>DUGOUT DISPLAY</DisplayText><Pressable accessibilityRole="button" onPress={onClose} style={s.close}><Text style={s.closeText}>CLOSE</Text></Pressable></View>
    <View style={[s.spotlight,{padding:compact?12:20}]}><Text style={s.label}>AT BAT</Text><DisplayText numberOfLines={1} adjustsFontSizeToFit style={[s.current,{fontSize:compact?38:Math.min(64,width*.065)}]}>{player(current)?.number?`#${player(current)?.number}  `:''}{formatPlayerName(player(current)?.name)}</DisplayText><Text numberOfLines={1} style={s.deck}>ON DECK  ·  {formatPlayerName(player(next)?.name)}</Text></View>
    <ScrollView style={{flex:1}} contentContainerStyle={s.grid}><View style={{flexDirection:'row',flexWrap:'wrap'}}>{game.lineup.map((id,i)=><View key={id} style={[s.cell,{width:`${100/columns}%`}]}><View style={[s.player,id===next&&id!==current&&s.onDeck,id===current&&s.active]}><Text style={s.order}>{i+1}</Text><View style={{flex:1,minWidth:0}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.7} style={[s.name,{fontSize:width>=600?22:18}]}>{formatPlayerName(player(id)?.name)}</Text><Text style={s.meta}>{id===current?'AT BAT':id===next?'ON DECK':id===game.lastBatterId?'LAST BATTER':player(id)?.number?`#${player(id)?.number}`:' '}</Text></View></View></View>)}</View></ScrollView>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <View style={s.controls}><View style={{flex:1,minWidth:0}}><Choice label="Last batter" value={game.lastBatterId??''} disabled={!writable||pending} options={[{value:'',label:'Start of lineup'},...game.lineup.map(id=>({value:id,label:formatPlayerName(player(id)?.name)}))]} onChange={id=>{void record(id);}}/></View><Pressable accessibilityRole="button" accessibilityLabel="Mark current batter as last batter and advance" disabled={!writable||pending||!current} onPress={()=>{void record(current);}} style={[s.advance,(!writable||pending)&&{opacity:.5}]}><Text style={s.advanceText}>{pending?'SAVING…':'BATTER FINISHED →'}</Text></Pressable></View>
  </View>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:palette.navy,gap:12},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontSize:26,color:'white'},close:{minHeight:44,paddingHorizontal:14,justifyContent:'center'},closeText:{color:'white',fontWeight:'800'},spotlight:{backgroundColor:'#06455D',borderLeftWidth:5,borderLeftColor:palette.accent,borderRadius:6,gap:4},label:{color:'#FF986B',fontSize:13,fontWeight:'800',letterSpacing:2},current:{color:'white'},deck:{color:'#DBE9F1',fontSize:18},grid:{paddingVertical:4},cell:{padding:4},player:{minHeight:66,padding:12,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#123E54',borderWidth:2,borderColor:'transparent',borderRadius:6},active:{borderColor:palette.accent,backgroundColor:'#19526A'},onDeck:{borderColor:'#69BDE0',backgroundColor:'#15475F'},order:{fontSize:26,fontWeight:'800',color:'#FF986B',width:36,fontVariant:['tabular-nums']},name:{color:'white',fontWeight:'700'},meta:{color:'#C2D2DF',fontSize:11,fontWeight:'700',marginTop:3},controls:{flexDirection:'row',alignItems:'stretch',gap:10},advance:{flex:1,minWidth:0,minHeight:60,padding:12,backgroundColor:palette.accent,borderRadius:5,justifyContent:'center',alignItems:'center'},advanceText:{color:palette.navy,fontWeight:'900',fontSize:16,textAlign:'center'},error:{color:'#FFBCA4'}});
