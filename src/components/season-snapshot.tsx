import { useAccountPreference } from '@/hooks/use-account-preference';
import { useState } from 'react';
import { Pressable, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Button, Section, palette, ui } from './app-ui';
import { Sheet, c } from './coaching-ui';
import { DisplayText } from './sports-type';
import { useAuth } from '@/providers/auth-provider';
import { useTeams } from '@/providers/team-provider';
import type { Board } from '@/lib/coaching/board';
import { statsSource, seasonKey, formatStat } from '@/lib/coaching/stat-data';
import { snapshotMetrics, SNAPSHOT_DEFAULTS } from '@/lib/coaching/snapshot-metrics';
const SNAPSHOT_KEYS=snapshotMetrics({}).map(choice=>choice.key);
function validateMetrics(value:unknown){if(!Array.isArray(value))return null;const valid=[...new Set(value.filter((k):k is string=>typeof k==='string'&&SNAPSHOT_KEYS.includes(k)))].slice(0,6);return valid.length?valid:null;}
type Props={board:Board|null;loading?:boolean;link?:boolean};
export function SeasonSnapshot(props:Props){const {session}=useAuth(),{active}=useTeams();const storageKey=`snapshot-metrics:${session?.user.id}:${active?.id}`;return <Snapshot key={storageKey} {...props} storageKey={storageKey}/>;}
function Snapshot({board,loading=false,link=true,storageKey}:Props&{storageKey:string}) {
 const {width,height}=useWindowDimensions(),source=board?statsSource(board):null;
 const landscape=width>=900&&height>=600&&width>height;
 const hasData=Object.values(source?.stats??{}).some(s=>Object.keys(s).length);
 const choices=snapshotMetrics(source?.stats??{},source?.eraInnings);
 const preference=useAccountPreference(storageKey,SNAPSHOT_DEFAULTS,validateMetrics),selected=preference.value,error=preference.error;
 const [draft,setDraft]=useState(SNAPSHOT_DEFAULTS),[open,setOpen]=useState(false);
 function save(){if(!draft.length||draft.length>6)return;preference.save(draft);setOpen(false);}
 const metrics=selected.flatMap(key=>choices.find(c=>c.key===key)??[]);
 return <Section title="Season snapshot"><View style={s.card}>
 <View style={s.header}><View><Text style={s.eyebrow}>{board?seasonKey(board):'YOUR'} SEASON{source?.gamesPlayed!==undefined?` · ${source.gamesPlayed}${source.gamesPlayedExact?'':'+'} ${source.gamesPlayed===1?'GAME':'GAMES'}`:''}</Text><DisplayText style={s.heading}>TEAM TOTALS</DisplayText></View><Pressable accessibilityRole="button" accessibilityLabel="Filter team totals" onPress={()=>{setDraft(selected);setOpen(true);}} style={s.filter}><Text style={s.filterText}>FILTER · {selected.length}/6</Text></Pressable></View>
 <View style={s.body}>{loading?<Text style={s.note}>Loading team stats…</Text>:hasData?<>
 {landscape?<View key="landscape-stat-strip" style={s.statStrip}>{metrics.map((m,i)=><View key={m.key} style={[s.stripMetric,i>0&&s.statDivider]}><Text style={[s.label,{minHeight:28,textAlign:'center'}]}>{m.label.toUpperCase()}</Text><DisplayText style={[s.value,{fontSize:34,textAlign:'center'}]}>{formatStat(m.value,m.key)}</DisplayText></View>)}</View>:<View key="portrait-stat-grid" style={s.metrics}>{metrics.map(m=><View key={m.key} style={[s.metric,{flexBasis:width>=700?'30%':'45%'}]}><Text style={s.label}>{m.label.toUpperCase()}</Text><DisplayText style={s.value}>{formatStat(m.value,m.key)}</DisplayText></View>)}</View>}

 <Text style={s.note}>{source?.label}{selected.includes('ERA')?` · ERA: ${source?.eraInnings?`${source.eraInnings}-inning basis`:'basis not available'}`:''}</Text>
 </>:<><DisplayText style={s.emptyTitle}>NO STATS IMPORTED YET.</DisplayText><Text style={s.note}>Add your CSV through Imports in Team tools.</Text></>}
 {!!error&&<Text style={[s.note,{color:palette.error}]}>{error}</Text>}{link&&<Button secondary onPress={()=>router.push('/team-stats')}>VIEW TEAM STATS →</Button>}
 </View></View><Sheet title="Choose team totals" open={open} onClose={()=>setOpen(false)}><Text style={ui.body}>Choose up to six stats for your snapshot.</Text><Text accessibilityLiveRegion="polite" style={ui.label}>{draft.length} OF 6 SELECTED</Text>{choices.map(choice=>{const checked=draft.includes(choice.key),disabled=!checked&&draft.length>=6;return <Pressable key={choice.key} accessibilityRole="checkbox" accessibilityState={{checked,disabled}} disabled={disabled} onPress={()=>setDraft(checked?draft.filter(k=>k!==choice.key):[...draft,choice.key])} style={[c.option,c.row,checked&&{backgroundColor:'#E8F0F4'},disabled&&ui.dim]}><Text style={{width:24,color:palette.accent,fontSize:18}}>{checked?'✓':'○'}</Text><Text style={[ui.rowTitle,c.grow]}>{choice.label}</Text></Pressable>;})}<Button disabled={!draft.length||draft.length>6} onPress={save}>SAVE FILTER</Button><Button secondary onPress={()=>setDraft(SNAPSHOT_DEFAULTS)}>RESET TO DEFAULTS</Button></Sheet></Section>;
}
const s=StyleSheet.create({statStrip:{flexDirection:'row',alignItems:'stretch',paddingVertical:8},stripMetric:{flex:1,minWidth:0,paddingHorizontal:10,gap:8,justifyContent:'center'},statDivider:{borderLeftWidth:1,borderLeftColor:'#CFDAE2'},card:{borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:palette.line,backgroundColor:palette.panel},header:{backgroundColor:palette.navy,padding:14,borderTopWidth:4,borderTopColor:palette.accent,flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:10},eyebrow:{color:'#AEC6D5',fontSize:10,letterSpacing:1.5,fontWeight:'800',marginBottom:6},heading:{color:'white',fontSize:25},filter:{minHeight:40,paddingHorizontal:12,justifyContent:'center',borderWidth:1,borderColor:'#658294',borderRadius:6},filterText:{fontSize:10,fontWeight:'800',letterSpacing:0.7,color:'white'},body:{padding:16,gap:16},metrics:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{flexGrow:1,minWidth:0,minHeight:112,padding:15,gap:8,borderRadius:9,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#D8E2EA',borderTopWidth:3,borderTopColor:'#90A9BA',boxShadow:'0px 3px 7px rgba(0,35,55,0.10)',justifyContent:'center'},label:{fontSize:10,lineHeight:14,fontWeight:'800',letterSpacing:0.7,color:palette.muted},value:{fontSize:38,color:palette.ink,fontVariant:['tabular-nums']},note:{fontSize:12,lineHeight:18,color:palette.muted},emptyTitle:{fontSize:25,color:palette.ink}});
