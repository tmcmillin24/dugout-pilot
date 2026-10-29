import { useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { palette } from './app-ui';
/** A persistent rail and position label make nested scrolling discoverable. */
export function ScrollRoster({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const [offset, setOffset] = useState(0);
  const overflow = content > viewport + 2;
  const progress = overflow ? Math.min(1, Math.max(0, offset / (content - viewport))) : 0;
  return <View>
    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator indicatorStyle="black" onLayout={e=>setViewport(e.nativeEvent.layout.height)} onContentSizeChange={(_w,h)=>setContent(h)} onScroll={e=>setOffset(e.nativeEvent.contentOffset.y)} scrollEventThrottle={32} style={{maxHeight:300}} contentContainerStyle={{paddingRight:12}}>{children}</ScrollView>
    {overflow && <><View pointerEvents="none" style={{position:'absolute',top:8,right:5,bottom:38,width:4,borderRadius:2,backgroundColor:palette.line}}><View style={{position:'absolute',top:`${progress*70}%`,height:'30%',width:4,borderRadius:2,backgroundColor:palette.navy}}/></View><Text style={{paddingVertical:8,textAlign:'center',fontSize:11,fontWeight:'700',color:palette.muted,backgroundColor:palette.raised}}>{progress>.98?'↑ Scroll for earlier players':'↕ Scroll to see all players'}</Text></>}
  </View>;
}
