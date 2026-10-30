import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button, Panel, Section, palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import type { Board } from '@/lib/coaching/board';
import { statsSource, statValue, seasonKey } from '@/lib/coaching/stat-data';
export function SeasonSnapshot({board,loading=false,link=true}:{board:Board|null;loading?:boolean;link?:boolean}) {
  const source=board?statsSource(board):null;
  const rows=Object.values(source?.stats??{}).filter(s=>Object.keys(s).length);
  const sum=(key:string)=>{const values=rows.map(s=>statValue(s,'batting',key));return values.length&&values.every(v=>v!==undefined)?values.reduce<number>((a,b)=>a+(b??0),0):null;};
  const ab=sum('AB'),hits=sum('H');const avg=ab&&hits!==null?(hits/ab).toFixed(3).replace(/^0\./,'.'):'—';
  return <Section title="Season snapshot"><Panel><View style={s.body}>
    <Text style={s.eyebrow}>{rows.length ? `${board?seasonKey(board):''} · ${source?.snapshot?'SEASON IMPORT':'IMPORTED GAMES'}` : 'YOUR SEASON, AT A GLANCE'}</Text>
    {loading ? <Text style={ui.body}>Loading team stats…</Text> : rows.length ? <><View style={s.metrics}>{[{label:'AVG',value:avg},{label:'HITS',value:hits},{label:'RUNS',value:sum('R')},{label:'WALKS',value:sum('BB')}].map(m=><View key={m.label} style={s.metric}><DisplayText style={s.value}>{m.value??'—'}</DisplayText><Text style={s.label}>{m.label}</Text></View>)}</View><Text style={s.note}>{source?.snapshot?source.label:'From imported games only. Full season coverage is not assumed.'}</Text></> : <><DisplayText style={s.emptyTitle}>THE NUMBERS START HERE.</DisplayText><Text style={ui.body}>No season stats yet. Add a CSV through Imports in Team tools.</Text></>}
    {link && <Button secondary onPress={()=>router.push('/team-stats')}>VIEW TEAM STATS →</Button>}
  </View></Panel></Section>;
}
const s=StyleSheet.create({body:{padding:20,gap:18},eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:'800',color:palette.muted},metrics:{flexDirection:'row',flexWrap:'wrap',gap:12},metric:{flex:1,minWidth:120,gap:5},value:{fontSize:34,color:palette.ink},label:{fontSize:10,fontWeight:'800',letterSpacing:1,color:palette.muted},note:{fontSize:12,lineHeight:18,color:palette.muted},emptyTitle:{fontSize:27,color:palette.ink}});
