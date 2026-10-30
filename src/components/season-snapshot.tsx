import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
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
type Props={board:Board|null;loading?:boolean;link?:boolean};
export function SeasonSnapshot(props:Props){const {session}=useAuth(),{active}=useTeams();const storageKey=`snapshot-metrics:${session?.user.id}:${active?.id}`;return <Snapshot key={storageKey} {...props} storageKey={storageKey}/>;}
function Snapshot({board,loading=false,link=true,storageKey}:Props&{storageKey:string}) {
 const {width}=useWindowDimensions(),source=board?statsSource(board):null;
 const hasData=Object.values(source?.stats??{}).some(s=>Object.keys(s).length);
 const choices=snapshotMetrics(source?.stats??{},source?.eraInnings);
 const [selected,setSelected]=useState(SNAPSHOT_DEFAULTS),[draft,setDraft]=useState(SNAPSHOT_DEFAULTS),[open,setOpen]=useState(false),[error,setError]=useState('');
 const touched=useRef(false),writes=useRef(Promise.resolve());
 useEffect(()=>{let alive=true;AsyncStorage.getItem(storageKey).then(v=>{if(!alive||touched.current||!v)return;const saved:unknown=JSON.parse(v);if(Array.isArray(saved)){const valid=[...new Set(saved.filter((k):k is string=>typeof k==='string'&&SNAPSHOT_KEYS.includes(k)))].slice(0,6);if(valid.length)setSelected(valid);}}).catch(()=>{if(alive)setError('Could not load your saved stat selection.');});return()=>{alive=false;};},[storageKey]); // choices are the same fixed catalog for every season.
 function save(){if(!draft.length||draft.length>6)return;touched.current=true;setSelected(draft);setOpen(false);writes.current=writes.current.then(()=>AsyncStorage.setItem(storageKey,JSON.stringify(draft))).catch(()=>setError('Stats updated, but this device could not save your preference.'));}
 const metrics=selected.flatMap(key=>choices.find(c=>c.key===key)??[]);
 return <Section title="Season snapshot"><View style={s.card}>
 <View style={s.header}><View><Text style={s.eyebrow}>{board?seasonKey(board):'YOUR'} SEASON</Text><DisplayText style={s.heading}>TEAM TOTALS</DisplayText></View><View style={{gap:8,alignItems:'flex-end'}}><View style={s.badge}><Text style={s.badgeText}>{source?.gamesPlayed!==undefined?`${source.gamesPlayed}${source.gamesPlayedExact?'':'+'} GAMES ${source.snapshot?'PLAYED':'IMPORTED'}`:'GAME TOTAL PENDING'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Filter team totals" onPress={()=>{touched.current=true;setDraft(selected);setOpen(true);}} style={s.filter}><Text style={s.filterText}>FILTER · {selected.length}/6</Text></Pressable></View></View>
 <View style={s.body}>{loading?<Text style={s.note}>Loading team stats…</Text>:hasData?<>
 <View style={s.metrics}>{metrics.map(m=><View key={m.key} style={[s.metric,{flexBasis:width>=700?'30%':'45%'}]}><Text style={s.label}>{m.label.toUpperCase()}</Text><DisplayText style={s.value}>{formatStat(m.value,m.key)}</DisplayText></View>)}</View>
 <Text style={s.note}>{source?.label}{selected.includes('ERA')?` · ERA: ${source?.eraInnings?`${source.eraInnings}-inning basis`:'basis not available'}`:''}</Text>
 </>:<><DisplayText style={s.emptyTitle}>NO STATS IMPORTED YET.</DisplayText><Text style={s.note}>Add your CSV through Imports in Team tools.</Text></>}
 {!!error&&<Text style={[s.note,{color:palette.error}]}>{error}</Text>}{link&&<Button secondary onPress={()=>router.push('/team-stats')}>VIEW TEAM STATS →</Button>}
 </View></View><Sheet title="Choose team totals" open={open} onClose={()=>setOpen(false)}><Text style={ui.body}>Choose up to six stats for your snapshot.</Text><Text accessibilityLiveRegion="polite" style={ui.label}>{draft.length} OF 6 SELECTED</Text>{choices.map(choice=>{const checked=draft.includes(choice.key),disabled=!checked&&draft.length>=6;return <Pressable key={choice.key} accessibilityRole="checkbox" accessibilityState={{checked,disabled}} disabled={disabled} onPress={()=>setDraft(checked?draft.filter(k=>k!==choice.key):[...draft,choice.key])} style={[c.option,c.row,checked&&{backgroundColor:'#E8F0F4'},disabled&&ui.dim]}><Text style={{width:24,color:palette.accent,fontSize:18}}>{checked?'✓':'○'}</Text><Text style={[ui.rowTitle,c.grow]}>{choice.label}</Text></Pressable>;})}<Button disabled={!draft.length||draft.length>6} onPress={save}>SAVE FILTER</Button><Button secondary onPress={()=>setDraft(SNAPSHOT_DEFAULTS)}>RESET TO DEFAULTS</Button></Sheet></Section>;
}
const s=StyleSheet.create({card:{borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:palette.line,backgroundColor:palette.panel},header:{backgroundColor:palette.navy,padding:20,borderTopWidth:4,borderTopColor:palette.accent,flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12},eyebrow:{color:'#AEC6D5',fontSize:10,letterSpacing:1.5,fontWeight:'800',marginBottom:6},heading:{color:'white',fontSize:25},badge:{paddingVertical:7,paddingHorizontal:10,borderRadius:4,backgroundColor:'#20465C'},badgeText:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'white'},filter:{minHeight:36,paddingHorizontal:12,justifyContent:'center',borderWidth:1,borderColor:'#658294',borderRadius:6},filterText:{fontSize:10,fontWeight:'800',letterSpacing:0.7,color:'white'},body:{padding:16,gap:16},metrics:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{flexGrow:1,minWidth:0,minHeight:112,padding:15,gap:8,borderRadius:9,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#D8E2EA',borderTopWidth:3,borderTopColor:'#90A9BA',boxShadow:'0px 3px 7px rgba(0,35,55,0.10)',justifyContent:'center'},label:{fontSize:10,lineHeight:14,fontWeight:'800',letterSpacing:0.7,color:palette.muted},value:{fontSize:38,color:palette.ink,fontVariant:['tabular-nums']},note:{fontSize:12,lineHeight:18,color:palette.muted},emptyTitle:{fontSize:25,color:palette.ink}});
