import { formatPlayerName } from '@/lib/coaching/player-display';
import { useEffect, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { palette, ui } from './app-ui';
import { BATTING_ROW_HEIGHT as HEIGHT, dragTarget, moveBatter, sameBattingOrder } from '@/lib/coaching/batting-order';
import type { Player } from '@/lib/coaching/board';
export type BattingScroll = {ref:RefObject<ComponentRef<typeof ScrollView>|null>;offset:RefObject<number>;onDragging:(value:boolean)=>void};
type Drag = {id:string;start:number;startScroll:number;translation:number;absoluteY:number};
export function DraggableBattingOrder({order,players,lastBatterId,disabled,onSave,onRemove,scroll}:{order:string[];players:Player[];lastBatterId?:string;disabled:boolean;onSave:(order:string[])=>Promise<boolean>;onRemove:(id:string)=>void;scroll:BattingScroll}) {
  const [preview,setPreview]=useState(order);const [active,setActive]=useState<string|null>(null);const [dragY,setDragY]=useState(0);
  const onDragging=scroll.onDragging;
  const drag=useRef<Drag|null>(null);const previewRef=useRef(order);const original=useRef(order);const interval=useRef<ReturnType<typeof setInterval>|null>(null);const viewport=useRef({top:100,bottom:600});const alive=useRef(true);
  // Parent keys the list by the saved order; a failed save also restores the original.
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(interval.current)clearInterval(interval.current);onDragging(false);};},[onDragging]);
  function paint(){const value=drag.current;if(!value)return;const delta=scroll.offset.current-value.startScroll;const next=moveBatter(original.current,value.id,dragTarget(value.start,value.translation,delta,original.current.length));previewRef.current=next;setPreview(next);setDragY(value.start*HEIGHT+value.translation+delta);}
  function begin(id:string){
    if(disabled||drag.current)return;
    original.current=[...order];previewRef.current=[...order];
    drag.current={id,start:order.indexOf(id),startScroll:scroll.offset.current,translation:0,absoluteY:0};setActive(id);setDragY(order.indexOf(id)*HEIGHT);scroll.onDragging(true);
    scroll.ref.current?.measureInWindow((_x,y,_width,height)=>{viewport.current={top:y,bottom:y+height};});
    interval.current=setInterval(()=>{const value=drag.current;if(!value)return;const {top,bottom}=viewport.current;const speed=value.absoluteY===0?0:value.absoluteY<top+70?-10:value.absoluteY>bottom-70?10:0;if(speed)scroll.ref.current?.scrollTo({y:Math.max(0,scroll.offset.current+speed),animated:false});paint();},32);
    AccessibilityInfo.announceForAccessibility(`${formatPlayerName(players.find(p=>p.id===id)?.name)} picked up.`);
  }
  function move(id:string,translation:number,absoluteY:number){if(drag.current?.id!==id)return;drag.current.translation=translation;drag.current.absoluteY=absoluteY;paint();}
  function finish(id:string,success:boolean){
    if(drag.current?.id!==id)return;
    if(interval.current)clearInterval(interval.current);interval.current=null;drag.current=null;setActive(null);scroll.onDragging(false);
    const next=success?previewRef.current:original.current;
    if(!success){setPreview(original.current);return;}
    if(sameBattingOrder(next,original.current))return;
    void onSave(next).then(ok=>{if(!ok&&alive.current){previewRef.current=original.current;setPreview(original.current);}if(ok)AccessibilityInfo.announceForAccessibility('Batting order saved.');});
  }
  function accessibleMove(id:string,delta:number){if(disabled||active)return;const next=moveBatter(order,id,order.indexOf(id)+delta);if(!sameBattingOrder(next,order))void onSave(next);}
  return <View style={[s.list,{height:Math.max(1,order.length)*HEIGHT}]}>{!order.length&&<Text style={[ui.body,{padding:16}]}>Add batters to start this game’s order.</Text>}{order.map(id=><BatterRow key={id} id={id} player={players.find(p=>p.id===id)} index={preview.indexOf(id)} y={active===id?dragY:0} active={active===id} disabled={disabled||!!active&&active!==id} last={id===lastBatterId} begin={begin} move={move} finish={finish} onRemove={()=>onRemove(id)} accessibleMove={delta=>accessibleMove(id,delta)}/>)}</View>;
}
function BatterRow({id,player,index,y,active,disabled,last,begin,move,finish,onRemove,accessibleMove}:{id:string;player?:Player;index:number;y:number;active:boolean;disabled:boolean;last:boolean;begin:(id:string)=>void;move:(id:string,translation:number,absoluteY:number)=>void;finish:(id:string,success:boolean)=>void;onRemove:()=>void;accessibleMove:(delta:number)=>void}) {
  const [translate]=useState(()=>new Animated.Value(index*HEIGHT));
  useEffect(()=>{if(active){translate.stopAnimation();translate.setValue(y);}else Animated.spring(translate,{toValue:index*HEIGHT,useNativeDriver:true,speed:22,bounciness:0}).start();},[active,index,translate,y]);
  const gesture=Gesture.Pan().enabled(!disabled).activateAfterLongPress(280).runOnJS(true).onStart(()=>begin(id)).onUpdate(event=>move(id,event.translationY,event.absoluteY)).onEnd((_event,success)=>finish(id,success)).onFinalize((_event,success)=>{if(!success)finish(id,false);});
  return <Animated.View style={[s.row,{transform:[{translateY:translate}],zIndex:active?10:1},active&&s.lifted]}>
    <GestureDetector gesture={gesture}><View accessible accessibilityRole="adjustable" accessibilityLabel={`${index+1}. ${formatPlayerName(player?.name)}${last?', last batter':''}`} accessibilityHint="Touch and hold to drag. With a screen reader, swipe up or down to move the batter." accessibilityActions={[{name:'increment',label:'Move down'},{name:'decrement',label:'Move up'}]} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='increment')accessibleMove(1);if(event.nativeEvent.actionName==='decrement')accessibleMove(-1);}} style={s.pickup}><Text style={s.grip}>⠿</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={s.number}>{index+1}</Text><View style={ui.flex}><Text numberOfLines={1} style={s.name}>{formatPlayerName(player?.name)}</Text><Text numberOfLines={1} style={s.meta}>{player?.number?`#${player.number}`:'No jersey number'}{last?' · LAST BATTER':''}</Text></View></View></GestureDetector>
    <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${formatPlayerName(player?.name)} from batting order`} disabled={disabled||active} onPress={onRemove} style={s.remove}><Text style={s.removeText}>×</Text></Pressable>
  </Animated.View>;
}
const s=StyleSheet.create({list:{position:'relative',marginVertical:6},row:{position:'absolute',left:0,right:0,top:0,height:HEIGHT-4,backgroundColor:palette.panel,borderWidth:1,borderColor:palette.line,borderRadius:6,flexDirection:'row',alignItems:'center'},lifted:{borderColor:palette.accent,backgroundColor:'#FFF6F0',shadowColor:palette.navy,shadowOffset:{width:0,height:5},shadowOpacity:0.2,shadowRadius:9,elevation:8},pickup:{flex:1,flexDirection:'row',alignItems:'center',gap:10,height:'100%',paddingHorizontal:12},grip:{fontSize:23,color:palette.muted,width:18},number:{flexShrink:0,fontVariant:['tabular-nums'],fontSize:25,fontWeight:'800',color:palette.accent,width:42},name:{fontSize:16,fontWeight:'700',color:palette.ink},meta:{fontSize:10,color:palette.muted,marginTop:5},remove:{width:44,height:48,justifyContent:'center',alignItems:'center'},removeText:{fontSize:24,color:palette.error}});
