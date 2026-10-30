import { Text, View } from 'react-native';
import { Button, Panel, palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import { useTeams } from '@/providers/team-provider';
import { hasEliteAccess, practicePriorities } from '@/lib/coaching/elite-stats';
import type { Board } from '@/lib/coaching/board';
import type { PracticeSettings } from '@/lib/coaching/practice';
export function StatsPracticeFocus({board,onFocus}:{board:Board;onFocus:(focus:PracticeSettings['focus'])=>void}){const {active}=useTeams();if(!hasEliteAccess(active))return null;const ideas=practicePriorities(board);if(!ideas.length)return null;return <Panel><View style={{padding:16,gap:12}}><View style={{gap:6}}><Text style={{color:palette.accent,fontSize:11,lineHeight:14,fontWeight:'800',letterSpacing:1.2}}>ELITE</Text><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{width:3,height:20,backgroundColor:palette.accent}}/><DisplayText accessibilityRole="header" style={{fontSize:27,lineHeight:30,color:palette.ink,flex:1}}>PRACTICE PRIORITIES</DisplayText></View></View>{ideas.map(idea=><View key={idea.focus} style={{gap:8}}><Text style={ui.body}>{idea.reason}</Text><Button secondary onPress={()=>onFocus(idea.focus)}>USE {idea.focus.toUpperCase()} FOCUS</Button></View>)}</View></Panel>;}
