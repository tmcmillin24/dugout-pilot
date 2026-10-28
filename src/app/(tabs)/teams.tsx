import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AccessBadge, Button, Icon, Loading, MenuRow, Panel, Screen, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { useTeams } from '@/providers/team-provider';

export default function TeamsScreen() {
  const { teams, active, loading, error, notice, select, refresh } = useTeams();
  return <Screen title="Teams" onRefresh={refresh}>
    <StatusMessage text={error} error /><StatusMessage text={notice} />
    <Section title="Your teams">
      {loading ? <Loading /> : teams.length ? <Panel>{teams.map((team, index) => <Pressable key={team.id} accessibilityRole="button" accessibilityLabel={`Select ${team.name}`} accessibilityState={{ selected: team.id === active?.id }} onPress={() => { void select(team.id); }} style={({ pressed }) => [s.teamRow, index < teams.length - 1 && ui.divider, pressed && ui.dim]}>
        <View style={[s.indicator, team.id === active?.id && s.indicatorActive]}>{team.id === active?.id ? <Icon name="check" color={palette.canvas} size={16} /> : <Icon name="teams" color={palette.cardMuted} size={20} />}</View>
        <View style={s.copy}><Text style={s.name}>{team.name}</Text><Text style={s.role}>{team.role === 'owner' ? 'Owner' : 'Coach'}{team.id === active?.id ? ' · Selected' : ''}</Text><AccessBadge team={team} /></View>
      </Pressable>)}</Panel> : <Panel><View style={ui.inset}><Text style={ui.heading}>{error ? 'Teams unavailable' : 'Your team starts here.'}</Text><Text style={ui.body}>{error ? 'Pull down to refresh or try again.' : 'Create a team or accept an invitation to get started.'}</Text></View></Panel>}
    </Section>
    {active && <Section title="Selected team"><Panel>
      {active.role === 'owner' ? <MenuRow icon="shield" title="Manage team" description={`${active.name} · Settings and coaches`} onPress={() => router.push({ pathname: '/team-manage', params: { id: active.id } })} last /> : <MenuRow icon="shield" title="Coach access" description={`${active.name} · Coach`} last />}
    </Panel></Section>}
    <Section title="Add a dugout"><Panel><MenuRow icon="plus" title="Create a team" description="Start with a 14-day Elite trial" onPress={() => router.push('/team-create')} /><MenuRow icon="mail" title="Join with an invitation" description="Enter your invitation code" onPress={() => router.push('/team-join')} last /></Panel></Section>
    {!!error && <Button secondary onPress={() => { void refresh(); }}>Refresh teams</Button>}
  </Screen>;
}
const s = StyleSheet.create({
  teamRow: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 }, indicator: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EDF3F7', alignItems: 'center', justifyContent: 'center' }, indicatorActive: { backgroundColor: palette.accent }, copy: { flex: 1, gap: 9 }, name: { color: palette.cardInk, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }, role: { color: palette.cardMuted, fontSize: 12 },
});
