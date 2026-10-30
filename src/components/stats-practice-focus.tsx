import { Text, View } from 'react-native';
import { Button, Panel, ui } from './app-ui';
import { useTeams } from '@/providers/team-provider';
import { hasEliteAccess, practicePriorities } from '@/lib/coaching/elite-stats';
import type { Board } from '@/lib/coaching/board';
import type { PracticeSettings } from '@/lib/coaching/practice';
export function StatsPracticeFocus({board,onFocus}:{board:Board;onFocus:(focus:PracticeSettings['focus'])=>void}){const {active}=useTeams();if(!hasEliteAccess(active))return null;const ideas=practicePriorities(board);if(!ideas.length)return null;return <Panel><View style={{padding:16,gap:12}}><Text style={ui.rowTitle}>ELITE · Practice priorities</Text>{ideas.map(idea=><View key={idea.focus} style={{gap:8}}><Text style={ui.body}>{idea.reason}</Text><Button secondary onPress={()=>onFocus(idea.focus)}>USE {idea.focus.toUpperCase()} FOCUS</Button></View>)}</View></Panel>;}
