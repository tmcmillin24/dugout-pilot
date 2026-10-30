import { useState } from 'react';
import type { Team } from '@/lib/teams';
import { TeamLogo } from '@/components/team-logo';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AccessBadge, Button, Icon, Loading, Panel, Screen, StatusMessage, palette, ui } from '@/components/app-ui';
import { DisplayText } from '@/components/sports-type';
import { useTeams } from '@/providers/team-provider';

export default function TeamsScreen() {
  const { teams, active, loading, error, notice, select, refresh } = useTeams();
  return <Screen title="My teams" onRefresh={refresh}>
    <StatusMessage text={error} error /><StatusMessage text={notice} />
    <View style={s.actions}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/team-create')} style={s.add}><Icon name="plus" size={18} color={palette.ink} /><Text style={s.addText}>CREATE TEAM</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/team-join')} style={s.join}><Icon name="mail" size={18} color={palette.ink} /><Text style={s.addText}>JOIN TEAM</Text></Pressable>
    </View>
    {loading ? <Loading /> : teams.length ? <View style={s.list}>{teams.map(team => <View key={team.id} style={[s.team, team.id === active?.id && s.selected]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Select ${team.name}`} accessibilityState={{ selected: team.id === active?.id }} onPress={() => { void select(team.id); }} style={({ pressed }) => [s.teamRow, pressed && ui.dim]}>
        <RowLogo team={team}/>
        <View style={s.copy}><Text style={s.role}>{team.role === 'owner' ? 'TEAM OWNER' : 'COACHING STAFF'}</Text><DisplayText style={s.name}>{team.name.toUpperCase()}</DisplayText><AccessBadge team={team} /></View>
        {team.id === active?.id && <Icon name="check" color="#B9400E" size={20} />}
      </Pressable>
      {team.id === active?.id && <View style={s.teamFooter}><Text style={s.selectedText}>SELECTED TEAM</Text>{team.role === 'owner' && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/team-manage', params: { id: team.id } })} style={s.manage}><Text style={s.manageText}>MANAGE</Text><Icon name="arrow" size={14} color={palette.ink} /></Pressable>}</View>}
    </View>)}</View> : <Panel><View style={ui.inset}><DisplayText style={s.emptyTitle}>{error ? 'TEAMS UNAVAILABLE' : 'FIND YOUR DUGOUT.'}</DisplayText><Text style={ui.body}>{error ? 'Pull down to refresh.' : 'Create a team or use an invitation from your owner.'}</Text></View></Panel>}
    {!!error && <Button secondary onPress={() => { void refresh(); }}>Refresh teams</Button>}
  </Screen>;
}
const s = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, add: { flex: 1, minWidth: 135, backgroundColor: palette.accent, padding: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', minHeight: 48 }, join: { flex: 1, minWidth: 135, borderWidth: 1, borderColor: palette.ink, padding: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', minHeight: 48 }, addText: { color: palette.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  list: { gap: 14 }, team: { borderWidth: 1, borderLeftWidth: 4, borderColor: palette.line, backgroundColor: palette.panel, borderLeftColor: '#B8C5D0' }, selected: { borderLeftColor: palette.accent }, teamRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 }, crest: { width: 56, height: 64, backgroundColor: palette.navy, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, borderTopWidth: 3, borderTopColor: palette.accent, justifyContent: 'center', alignItems: 'center' }, initial: { color: palette.white, fontSize: 27 }, copy: { flex: 1, gap: 7 }, role: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, name: { color: palette.ink, fontSize: 28, lineHeight: 30 }, teamFooter: { flexDirection: 'row', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: palette.line, minHeight: 46 }, selectedText: { color: '#A9380C', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 }, manage: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, manageText: { color: palette.ink, fontWeight: '800', fontSize: 10 }, emptyTitle: { color: palette.ink, fontSize: 28 },
});

function RowLogo({team}:{team:Team}){const [height,setHeight]=useState(80);if(!team.logo_url)return null;return <View style={{width:height,alignSelf:'stretch',justifyContent:'center'}} onLayout={e=>{const next=Math.min(112,Math.round(e.nativeEvent.layout.height));if(next>0&&next!==height)setHeight(next);}}><View style={{position:'absolute',left:0,right:0,top:0,bottom:0,justifyContent:'center'}}><TeamLogo team={team} size={height} fallback="none"/></View></View>;}
