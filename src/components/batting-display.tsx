import { Image } from 'expo-image';
import { FIELD_POINTS } from './defensive-diamond';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OverlayModal } from './overlay-modal';
import { Button, palette } from './app-ui';
import { Sheet, c } from './coaching-ui';
import { DisplayText } from './sports-type';
import { formatPlayerName } from '@/lib/coaching/player-display';
import { nextBatterIndex } from '@/lib/coaching/batting-display';
import { POSITIONS, type Board, type Game } from '@/lib/coaching/board';

type Props = { renderTrigger?:(open:()=>void,disabled:boolean)=>ReactNode; board: Board; game: Game; writable: boolean; update: (change: (game: Game) => Game) => Promise<boolean> };
export function BattingDisplay({board,game,writable,update,renderTrigger}:Props) {
  const [open,setOpen]=useState(false);
  return <>{renderTrigger?renderTrigger(()=>setOpen(true),!board.players.length):<Button secondary disabled={!board.players.length} onPress={()=>setOpen(true)}>DUGOUT DISPLAY</Button>}<OverlayModal open={open} onClose={()=>setOpen(false)}>{open&&<Display board={board} game={game} writable={writable} update={update} onClose={()=>setOpen(false)}/>}</OverlayModal></>;
}
function Display({board,game,writable,update,onClose}:Props&{onClose:()=>void}) {
  useKeepAwake();
  const {width,height}=useWindowDimensions(); const insets=useSafeAreaInsets();
  const [page,setPage]=useState<'offense'|'defense'>(game.lineup.length?'offense':'defense');
  const [pending,setPending]=useState(false); const [error,setError]=useState(''); const [editing,setEditing]=useState(false);
  const pager=useRef<ComponentRef<typeof ScrollView>>(null);
  const pageWidth=Math.min(1400,width-Math.max(insets.left,width>=600?28:16)-Math.max(insets.right,width>=600?28:16));
  // Native paging shares directional touch locking with the vertical roster scroll views.
  useEffect(()=>{pager.current?.scrollTo({x:page==='defense'?pageWidth:0,animated:false});},[page,pageWidth]);
  const index=nextBatterIndex(game.lineup,game.lastBatterId);
  const current=game.lineup[index]; const next=game.lineup[(index+1)%game.lineup.length];
  const player=(id:string)=>board.players.find(p=>p.id===id);
  const columns=width>=1000?3:width>=600?2:1;
  const compact=height<650;
  const tablet=width>=600;
  const perColumn=Math.ceil(game.lineup.length/columns);
  const groups=Array.from({length:columns},(_,i)=>game.lineup.slice(i*perColumn,(i+1)*perColumn));
  async function record(id:string) { if(pending||!writable)return;setPending(true);setError('');try {const ok=await update(g=>({...g,lastBatterId:id||undefined}));if(!ok)setError('Could not save. The batting position has not changed.');else setEditing(false);}catch{setError('Could not save. Try again.');}finally{setPending(false);} }
  return <View accessibilityViewIsModal style={[s.screen,{paddingTop:Math.max(insets.top,12),paddingBottom:Math.max(insets.bottom,12),paddingLeft:Math.max(insets.left,tablet?28:16),paddingRight:Math.max(insets.right,tablet?28:16)}]}><View style={[s.frame,height<650&&{gap:6}]}>
    <View style={s.header}><View style={{flex:1,minWidth:0}}><Text style={s.brand}>DUGOUT PILOT</Text><Text numberOfLines={1} style={s.matchup}>{game.label} · vs {game.opponent}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close dugout display" onPress={onClose} style={s.close}><Text style={s.closeText}>×</Text></Pressable></View>
    <View style={s.pageTabs} accessibilityRole="tablist">{(['offense','defense'] as const).map(value=><Pressable key={value} accessibilityRole="tab" accessibilityState={{selected:page===value}} onPress={()=>setPage(value)} style={[s.pageTab,page===value&&s.pageSelected]}><Text style={[s.pageLabel,page===value&&s.pageSelectedLabel]}>{value==='offense'?'OFFENSE':'DEFENSE'}</Text></Pressable>)}</View>
    <Text style={s.swipeHint}>{page==='offense'?'Swipe left for defensive positions →':'← Swipe right for batting order'}</Text>
    <ScrollView ref={pager} horizontal pagingEnabled directionalLockEnabled nestedScrollEnabled bounces={false} showsHorizontalScrollIndicator={false} scrollEnabled={!editing} style={{flex:1,minHeight:0}} contentContainerStyle={{alignItems:'stretch'}} onMomentumScrollEnd={event=>setPage(event.nativeEvent.contentOffset.x>=pageWidth/2?'defense':'offense')}>
    <View style={{width:pageWidth,gap:compact?8:14}} accessibilityElementsHidden={page!=='offense'} importantForAccessibility={page==='offense'?'auto':'no-hide-descendants'}>
    {!game.lineup.length?<View style={s.empty}><DisplayText style={s.emptyTitle}>NO BATTING ORDER YET</DisplayText><Text style={s.swipeHint}>Add batters in Lineups to display the offensive order.</Text></View>:<>
    <View style={[s.spotlights,{flexDirection:tablet?'row':'column'}]}>
      <View style={[s.atBat,{flex:tablet?1.5:undefined,padding:compact?14:20}]}><View style={s.cardHead}><Text style={s.label}>AT BAT</Text><Text style={s.slot}>ORDER {index+1}</Text></View><View style={s.heroRow}><DisplayText numberOfLines={1} adjustsFontSizeToFit style={[s.jersey,{fontSize:compact?52:72}]}>{player(current)?.number||'—'}</DisplayText><DisplayText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.45} style={[s.current,{fontSize:tablet?50:38}]}>{formatPlayerName(player(current)?.name)}</DisplayText></View></View>
      <View style={[s.onDeckCard,{flex:tablet?1:undefined,padding:compact?14:20}]}><View style={s.cardHead}><Text style={[s.label,{color:'#93D8F3'}]}>ON DECK</Text><Text style={[s.slot,{color:'#93D8F3'}]}>NEXT</Text></View><View style={s.heroRow}><DisplayText numberOfLines={1} style={[s.deckJersey,{fontSize:compact?40:52}]}>{player(next)?.number||'—'}</DisplayText><DisplayText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.45} style={[s.deckName,{fontSize:tablet?36:30}]}>{game.lineup.length>1?formatPlayerName(player(next)?.name):'—'}</DisplayText></View></View>
    </View>
    <View style={s.orderHead}><Text style={s.orderLabel}>BATTING ORDER</Text><Text style={s.count}>{game.lineup.length} PLAYERS</Text></View>
    <ScrollView directionalLockEnabled nestedScrollEnabled style={{flex:1,minHeight:0}} indicatorStyle="white" contentContainerStyle={{paddingBottom:8}}><View style={s.orderColumns}>{groups.map((group,column)=><View key={column} style={s.orderColumn}>{group.map((id,row)=>{const i=column*perColumn+row;const atBat=id===current;const onDeck=id===next&&!atBat;return <View key={id} style={[s.player,atBat&&s.active,onDeck&&s.onDeck]}><Text style={[s.order,atBat&&s.darkText]}>{String(i+1).padStart(2,'0')}</Text><View style={{flex:1,minWidth:0}}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={[s.name,{fontSize:tablet?23:20}]}>{formatPlayerName(player(id)?.name)}</Text><Text style={[s.meta,atBat&&s.darkText]}>{atBat?'AT BAT':onDeck?'ON DECK':id===game.lastBatterId?'LAST BATTER':'BATTING ORDER'}</Text></View><Text numberOfLines={1} style={[s.rowJersey,atBat&&s.darkText]}>{player(id)?.number?`#${player(id)?.number}`:'—'}</Text></View>;})}</View>)}</View></ScrollView>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <View style={[s.controls,{flexDirection:tablet?'row':'column'}]}><Pressable accessibilityRole="button" accessibilityLabel="Change last batter" disabled={!writable||pending} onPress={()=>setEditing(true)} style={s.lastControl}><Text style={s.lastLabel}>LAST BATTER</Text><Text numberOfLines={1} style={s.lastValue}>{game.lastBatterId?formatPlayerName(player(game.lastBatterId)?.name):'Start of lineup'} <Text style={s.edit}> · CHANGE</Text></Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Mark current batter as last batter and advance" disabled={!writable||pending||!current} onPress={()=>{void record(current);}} style={[s.advance,(!writable||pending)&&{opacity:.5}]}><Text style={s.advanceText}>{pending?'SAVING…':'BATTER FINISHED'}  →</Text></Pressable></View>
    </>}
    </View>
    <View style={{width:pageWidth}} accessibilityElementsHidden={page!=='defense'} importantForAccessibility={page==='defense'?'auto':'no-hide-descendants'}>
      <DefensiveDisplay board={board} game={game} width={pageWidth} height={height} />
    </View>
    </ScrollView>
    <Sheet title="Last batter" open={editing} onClose={()=>setEditing(false)}>{[{id:'',name:'Start of lineup'},...game.lineup.map(id=>({id,name:formatPlayerName(player(id)?.name)}))].map(item=><Pressable key={item.id} accessibilityRole="button" disabled={!writable||pending} onPress={()=>{void record(item.id);}} style={c.option}><Text style={c.choiceValue}>{item.name}{(game.lastBatterId??'')===item.id?'  ✓':''}</Text></Pressable>)}{!!error&&<Text accessibilityRole="alert" style={c.danger}>{error}</Text>}</Sheet>
  </View></View>;
}

function DefensiveDisplay({board,game,width,height}:{board:Board;game:Game;width:number;height:number}) {
  const landscape=width>height;
  const fieldWidth=width;
  const fieldHeight=landscape?Math.max(230,height-220):fieldWidth*460/420;
  const artAspect=landscape?2:420/460;
  const artWidth=Math.min(fieldWidth,fieldHeight*artAspect);
  const artHeight=artWidth/artAspect;
  const bench=board.players.filter(p=>!Object.values(game.positions).includes(p.id));
  return <ScrollView directionalLockEnabled nestedScrollEnabled style={{flex:1}} indicatorStyle="white" contentContainerStyle={{flexGrow:1,paddingBottom:8}}><View style={{flexDirection:'column',alignItems:'center',gap:18}}>
    <View style={[s.defensiveField,{width:fieldWidth,height:fieldHeight}]}>
      <Image source={landscape?require('@/assets/images/dugout-field-landscape.svg'):require('@/assets/images/defensive-field.svg')} contentFit="contain" transition={0} accessible={false} style={StyleSheet.absoluteFill}/>
      {POSITIONS.map(position=>{const [left,top]=FIELD_POINTS[position];const player=board.players.find(p=>p.id===game.positions[position]);return <View key={position} style={[s.fieldPosition,{left:(fieldWidth-artWidth)/2+artWidth*left/100-fieldWidth*.13,top:(fieldHeight-artHeight)/2+artHeight*top/100}]}>
        <Text style={s.fieldPositionLabel}>{position}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={[s.fieldPlayer,{fontSize:fieldWidth>=500?17:13}]}>{player?formatPlayerName(player.name):'Unassigned'}</Text>
        <Text style={s.fieldNumber}>{player?.number?`#${player.number}`:'—'}</Text>
      </View>;})}
    </View>
    <View style={{width:'100%',minWidth:0,gap:10}}>
      <Text style={s.orderLabel}>BENCH · {bench.length}</Text>
      {bench.length?bench.map(p=><View key={p.id} style={s.defensiveBenchRow}><Text style={s.fieldBenchNumber}>{p.number?`#${p.number}`:'—'}</Text><Text style={[s.name,{flex:1,fontSize:18}]}>{formatPlayerName(p.name)}</Text></View>):<Text style={s.swipeHint}>Everyone is on the field.</Text>}
      <Text style={s.swipeHint}>Current assignments · Update positions in Lineups</Text>
    </View>
  </View></ScrollView>;
}

const s=StyleSheet.create({
  pageTabs:{flexDirection:'row',gap:8},pageTab:{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:8,borderWidth:1,borderColor:'#326A84'},pageSelected:{backgroundColor:'#FF6514',borderColor:'#FF6514'},pageLabel:{fontSize:12,fontWeight:'900',letterSpacing:1.5,color:'#A7BDCE'},pageSelectedLabel:{color:'#062C43'},swipeHint:{color:'#9FB7C9',fontSize:11,lineHeight:16},empty:{flex:1,alignItems:'center',justifyContent:'center',gap:10},emptyTitle:{color:'white',fontSize:30},
  defensiveField:{backgroundColor:'#082E4B',borderRadius:12,overflow:'hidden',borderBottomWidth:4,borderBottomColor:'#FF6514'},fieldPosition:{position:'absolute',width:'26%',marginTop:-30,alignItems:'center',justifyContent:'center',minHeight:62,gap:3,paddingHorizontal:3,backgroundColor:'#082E4BF2',borderWidth:1,borderColor:'#648A9A',borderRadius:8},fieldPositionLabel:{color:'#FF986B',fontSize:12,fontWeight:'900'},fieldPlayer:{color:'white',fontWeight:'800',textAlign:'center',width:'100%'},fieldNumber:{color:'#93D8F3',fontSize:12,fontWeight:'800',fontVariant:['tabular-nums']},defensiveBenchRow:{flexDirection:'row',alignItems:'center',gap:12,padding:12,backgroundColor:'#F4F7FA',borderRadius:8},fieldBenchNumber:{color:'#C04700',fontSize:19,fontWeight:'800',minWidth:42,fontVariant:['tabular-nums']},
  screen:{flex:1,backgroundColor:'#061E30'},frame:{flex:1,width:'100%',maxWidth:1400,alignSelf:'center',gap:14},
  header:{flexDirection:'row',alignItems:'center',gap:12,paddingBottom:10,borderBottomWidth:1,borderBottomColor:'#284356'},brand:{fontSize:13,color:'white',fontWeight:'900',letterSpacing:2},matchup:{fontSize:12,color:'#A7BDCE',marginTop:5},close:{width:44,height:44,justifyContent:'center',alignItems:'center'},closeText:{color:'#DCE8F0',fontSize:32,fontWeight:'400',lineHeight:36},
  spotlights:{gap:12},atBat:{minWidth:0,backgroundColor:'#FF6514',borderRadius:12,overflow:'hidden'},onDeckCard:{minWidth:0,backgroundColor:'#133A51',borderWidth:1,borderColor:'#326A84',borderRadius:12},cardHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},label:{color:'#062C43',fontSize:12,fontWeight:'900',letterSpacing:2},slot:{color:'#173B50',fontSize:10,fontWeight:'800',letterSpacing:1},heroRow:{flexDirection:'row',alignItems:'center',gap:16,marginTop:8},jersey:{color:'#062C43',maxWidth:'30%'},current:{color:'#062C43',flex:1,minWidth:0},deckJersey:{color:'#93D8F3',maxWidth:'30%'},deckName:{color:'white',flex:1,minWidth:0},
  orderHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:3},orderLabel:{fontSize:12,fontWeight:'900',letterSpacing:1.7,color:'#E2EDF4'},count:{fontSize:10,fontWeight:'700',color:'#9FB7C9',letterSpacing:1},orderColumns:{flexDirection:'row',gap:12},orderColumn:{flex:1,minWidth:0,gap:8},player:{minHeight:72,padding:14,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#F4F7FA',borderWidth:2,borderColor:'#F4F7FA',borderRadius:8},active:{backgroundColor:'#FFE2CE',borderColor:'#FF6514'},onDeck:{backgroundColor:'#DCEFF8',borderColor:'#73B9D7'},order:{fontSize:21,fontWeight:'800',color:'#6B8293',width:32,fontVariant:['tabular-nums']},darkText:{color:'#973300'},name:{color:'#092F48',fontWeight:'800'},meta:{color:'#526E80',fontSize:9,fontWeight:'800',letterSpacing:1,marginTop:5},rowJersey:{color:'#526E80',fontSize:14,fontWeight:'800',fontVariant:['tabular-nums'],minWidth:28},
  controls:{gap:12,borderTopWidth:1,borderTopColor:'#284356',paddingTop:12},lastControl:{flex:1,minWidth:0,minHeight:48,justifyContent:'center',gap:5},lastLabel:{fontSize:9,letterSpacing:1.5,fontWeight:'800',color:'#9FB7C9'},lastValue:{fontSize:15,color:'white',fontWeight:'700'},edit:{fontSize:10,color:'#93D8F3',fontWeight:'800'},advance:{flex:1,minWidth:0,minHeight:54,padding:14,backgroundColor:'#FF6514',borderRadius:8,justifyContent:'center',alignItems:'center'},advanceText:{color:palette.navy,fontWeight:'900',letterSpacing:.7,fontSize:15,textAlign:'center'},error:{color:'#FFBCA4'},
});
