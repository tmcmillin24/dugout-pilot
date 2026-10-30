import { Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Button, Section, palette } from './app-ui';
import { DisplayText } from './sports-type';
import type { Board } from '@/lib/coaching/board';
import { statsSource, seasonKey, teamSummary, formatStat } from '@/lib/coaching/stat-data';
export function SeasonSnapshot({board,loading=false,link=true}:{board:Board|null;loading?:boolean;link?:boolean}) {
 const {width}=useWindowDimensions(),source=board?statsSource(board):null;
 const hasData=Object.values(source?.stats??{}).some(s=>Object.keys(s).length),summary=teamSummary(source?.stats??{},source?.eraInnings);
 const metrics=[{label:'BATTING AVG',key:'AVG',value:summary.avg},{label:'ON BASE',key:'OBP',value:summary.obp},{label:'TEAM ERA',key:'ERA',value:summary.era},{label:'HITS',key:'H',value:summary.hits},{label:'RUNS',key:'R',value:summary.runs},{label:'WALKS',key:'BB',value:summary.walks}];
 return <Section title="Season snapshot"><View style={s.card}>
 <View style={s.header}><View><Text style={s.eyebrow}>{board?seasonKey(board):'YOUR'} SEASON</Text><DisplayText style={s.heading}>TEAM TOTALS</DisplayText></View><View style={s.badge}><Text style={s.badgeText}>{source?.gamesPlayed!==undefined?`${source.gamesPlayed}${source.gamesPlayedExact?'':'+'} GAMES ${source.snapshot?'PLAYED':'IMPORTED'}`:'GAME TOTAL PENDING'}</Text></View></View>
 <View style={s.body}>{loading?<Text style={s.note}>Loading team stats…</Text>:hasData?<>
 <View style={s.metrics}>{metrics.map(m=><View key={m.key} style={[s.metric,{flexBasis:width>=700?'30%':'45%'},m.key==='ERA'&&s.era]}><Text style={[s.label,m.key==='ERA'&&s.eraLabel]}>{m.label}</Text><DisplayText style={[s.value,m.key==='ERA'&&s.eraValue]}>{formatStat(m.value,m.key)}</DisplayText>{m.key==='ERA'&&<Text style={s.eraLabel}>{source?.eraInnings?`${source.eraInnings}-inning basis`:'Needs ER / IP / ERA basis'}</Text>}</View>)}</View>
 <Text style={s.note}>{source?.label}</Text>
 </>:<><DisplayText style={s.emptyTitle}>NO STATS IMPORTED YET.</DisplayText><Text style={s.note}>Add your CSV through Imports in Team tools.</Text></>}
 {link&&<Button secondary onPress={()=>router.push('/team-stats')}>VIEW TEAM STATS →</Button>}
 </View></View></Section>;
}
const s=StyleSheet.create({card:{borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:palette.line,backgroundColor:palette.panel},header:{backgroundColor:palette.navy,padding:20,borderTopWidth:4,borderTopColor:palette.accent,flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12},eyebrow:{color:'#AEC6D5',fontSize:10,letterSpacing:1.5,fontWeight:'800',marginBottom:6},heading:{color:'white',fontSize:25},badge:{paddingVertical:7,paddingHorizontal:10,borderRadius:4,backgroundColor:'#20465C'},badgeText:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'white'},body:{padding:16,gap:16},metrics:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{flexGrow:1,minWidth:0,minHeight:100,padding:15,gap:8,borderRadius:7,backgroundColor:'#F0F4F7',justifyContent:'center'},era:{backgroundColor:palette.navy,borderLeftWidth:4,borderLeftColor:palette.accent},label:{fontSize:10,fontWeight:'800',letterSpacing:1,color:palette.muted},value:{fontSize:38,color:palette.ink,fontVariant:['tabular-nums']},eraValue:{color:'#FF9668'},eraLabel:{color:'#C6D9E5',fontSize:10},note:{fontSize:12,lineHeight:18,color:palette.muted},emptyTitle:{fontSize:25,color:palette.ink}});
