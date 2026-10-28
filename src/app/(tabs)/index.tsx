import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AccessBadge, Button, Icon, Loading, MenuRow, Panel, Screen, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { useTeams } from '@/providers/team-provider';

export default function HomeScreen() {
  const { teams, active, loading, error, notice, refresh } = useTeams();
  return <Screen title="Your game plan." subtitle="A clear view of your team. A better start to game day." onRefresh={refresh}>
    <StatusMessage text={error} error /><StatusMessage text={notice} />
    {loading ? <Loading /> : active ? <View style={s.hero}>
      <View style={s.heroTop}><Text style={s.label}>YOUR DUGOUT</Text><AccessBadge team={active} /></View>
      <View style={s.identity}><View style={s.monogram}><Text style={s.monogramText}>{active.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</Text></View><View style={ui.flex}><Text style={s.teamName}>{active.name}</Text><Text style={s.role}>{active.role === 'owner' ? 'Team owner' : 'Coaching staff'}</Text></View></View>
      <View style={s.heroFooter}><Text style={s.meta}>{active.access_status === 'trial' && active.trial_ends_at ? `Elite trial through ${new Date(active.trial_ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : active.test_access ? 'Test access enabled' : active.access_status === 'expired' ? 'Your trial has ended' : 'Your team workspace'}</Text><Text style={s.meta}>{teams.length} {teams.length === 1 ? 'team' : 'teams'}</Text></View>
    </View> : !error ? <Panel><View style={ui.inset}><Icon name="ball" size={36} color={palette.accent} /><Text style={ui.heading}>Build your dugout.</Text><Text style={ui.body}>Create your first team or join your coaching staff with an invitation.</Text><Button onPress={() => router.push('/team-create')}>Create a team</Button><Button secondary onPress={() => router.push('/team-join')}>Join a team</Button></View></Panel> : <Button secondary onPress={() => { void refresh(); }}>Try again</Button>}
    {active && <Section title="Your workspace"><Panel>
      <MenuRow icon="teams" title="Team hub" description={active.role === 'owner' ? 'Your teams, coaches, and team settings' : 'Your teams and coaching access'} onPress={() => router.navigate('/teams')} />
      <MenuRow icon="link" title="Integrations" description="Keep your coaching tools in one place" onPress={() => router.navigate('/integrations')} last />
    </Panel></Section>}
    <Section title="On deck"><Panel>
      <MenuRow icon="ball" title="Game day" description="Lineups, defensive rotations, and pitching" end={<Text style={s.soon}>UP NEXT</Text>} />
      <MenuRow icon="clock" title="Practice planning" description="Focused sessions for your team" end={<Text style={s.soon}>UP NEXT</Text>} last />
    </Panel><Text style={s.footnote}>Game and practice tools are being built. Your team workspace is ready now.</Text></Section>
  </Screen>;
}
const s = StyleSheet.create({
  hero: { backgroundColor: '#172C37', borderWidth: 1, borderColor: '#315045', borderRadius: 24, padding: 22, gap: 24 }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  label: { color: '#AAC7BA', fontSize: 10, letterSpacing: 1.8, fontWeight: '700' }, identity: { flexDirection: 'row', alignItems: 'center', gap: 16 }, monogram: { width: 60, height: 60, borderRadius: 18, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }, monogramText: { color: palette.canvas, fontSize: 23, fontWeight: '800' },
  teamName: { color: palette.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 }, role: { color: '#AAC7BA', fontSize: 13, marginTop: 6 }, heroFooter: { borderTopWidth: 1, borderTopColor: '#315045', paddingTop: 16, flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' },
  meta: { color: '#AAC7BA', fontSize: 12 }, soon: { color: palette.muted, fontSize: 8, letterSpacing: 0.8, fontWeight: '700', maxWidth: 45 }, footnote: { color: palette.muted, fontSize: 12, lineHeight: 19 },
});
