import { TeamLogo } from '@/components/team-logo';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccessBadge, Button, Icon, Loading, Panel, Screen, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { DisplayText } from '@/components/sports-type';
import { useTeams } from '@/providers/team-provider';

export default function HomeScreen() {
  const { teams, active, loading, error, notice, refresh, select } = useTeams();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const daysLeft = active?.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(active.trial_ends_at) - now) / 86400000)) : 0;
  const openTeam = () => { if (active?.role === 'owner') router.push({ pathname: '/team-manage', params: { id: active.id } }); else router.navigate('/teams'); };
  return <Screen title="Clubhouse" hideTitle onRefresh={refresh}>
    <StatusMessage text={error} error /><StatusMessage text={notice} />
    {!!teams.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.teamRail}>
      {teams.map(team => <Pressable accessibilityRole="button" accessibilityLabel={`Select ${team.name}`} accessibilityState={{ selected: active?.id === team.id }} key={team.id} onPress={() => { void select(team.id); }} style={({ pressed }) => [s.railItem, active?.id === team.id && s.railSelected, pressed && ui.dim]}><TeamLogo team={team} size={46} /><Text numberOfLines={1} style={s.railName}>{team.name}</Text></Pressable>)}
      <Pressable accessibilityRole="button" accessibilityLabel="Add a team" onPress={() => router.push('/team-create')} style={s.railItem}><View style={s.railCrest}><Icon name="plus" color={palette.ink} size={20} /></View><Text style={s.railName}>Add team</Text></Pressable>
    </ScrollView>}
    {loading ? <Loading /> : active ? <View>
      <View style={s.hero}>
        <Image source={require('@/assets/images/clubhouse-field.svg')} contentFit="contain" style={s.field} pointerEvents="none" />
        <View style={s.heroTop}><Text style={s.heroKicker}>THE CLUBHOUSE</Text><AccessBadge team={active} /></View>
        <View style={s.heroIdentity}><TeamLogo team={active} size={64} /><DisplayText italic style={s.teamTitle}>{active.name.toUpperCase()}</DisplayText></View>
        <Pressable accessibilityRole="button" onPress={openTeam} style={({ pressed }) => [s.heroCta, pressed && ui.dim]}><Text style={s.heroCtaLabel}>OPEN TEAM</Text><Icon name="arrow" color={palette.white} size={16} /></Pressable>
      </View>
      <View style={s.readouts}>
        <View style={s.readout}><Text style={s.readoutLabel}>YOUR ROLE</Text><DisplayText style={s.readoutValue}>{active.role === 'owner' ? 'OWNER' : 'COACH'}</DisplayText></View>
        <View style={[s.readout, s.readoutBorder]}><Text style={s.readoutLabel}>YOUR TEAMS</Text><DisplayText style={s.readoutValue}>{String(teams.length).padStart(2, '0')}</DisplayText></View>
        <View style={s.readout}><Text style={s.readoutLabel}>ACCESS</Text><DisplayText style={s.readoutValue}>{active.test_access ? 'TEST' : active.access_status === 'trial' ? 'ELITE TRIAL' : active.access_status.toUpperCase()}</DisplayText></View>
      </View>
    </View> : !error ? <View style={s.empty}><Icon name="ball" size={40} color={palette.accent} /><DisplayText italic style={s.emptyTitle}>MAKE IT YOUR DUGOUT.</DisplayText><Text style={s.emptyCopy}>Create your team or join your coaching staff.</Text><Button onPress={() => router.push('/team-create')}>CREATE A TEAM</Button><Button secondary onPress={() => router.push('/team-join')}>JOIN A TEAM</Button></View> : <Button secondary onPress={() => { void refresh(); }}>Try again</Button>}
    {active && <>
      <Section title="Coach's corner"><View style={s.actions}>
        <Pressable accessibilityRole="button" onPress={() => { if (active.role === 'owner') router.push({ pathname: '/team-coaches', params: { id: active.id } }); else router.navigate('/teams'); }} style={({ pressed }) => [s.action, pressed && s.pressed]}>
          <View style={s.actionTop}><Icon name="teams" color={palette.ink} size={26} /><Icon name="arrow" size={16} /></View><DisplayText style={s.actionTitle}>COACHING STAFF</DisplayText><Text style={s.actionMeta}>{active.role === 'owner' ? 'Manage team access' : 'Your coaching access'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/integrations')} style={({ pressed }) => [s.action, pressed && s.pressed]}>
          <View style={s.actionTop}><Icon name="link" color={palette.ink} size={25} /><Icon name="arrow" size={16} /></View><DisplayText style={s.actionTitle}>INTEGRATIONS</DisplayText><Text style={s.actionMeta}>Game data & imports</Text>
        </Pressable>
      </View></Section>
      {active.access_status === 'trial' && active.trial_ends_at && <Panel><View style={s.trial}>
        <View style={s.trialTop}><DisplayText style={s.trialTitle}>ELITE TRIAL</DisplayText><Text style={s.trialDate}>Ends {new Date(active.trial_ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text></View>
        <View style={s.trialTrack}><View style={[s.trialFill, { width: `${Math.min(100, daysLeft / 14 * 100)}%` }]} /></View>
        <Text style={s.trialCaption}>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</Text>
      </View></Panel>}
    </>}
  </Screen>;
}
const s = StyleSheet.create({
  teamRail: { gap: 20, paddingBottom: 2 }, railItem: { width: 78, alignItems: 'center', gap: 9, paddingBottom: 9, borderBottomWidth: 3, borderBottomColor: 'transparent', minHeight: 88 }, railSelected: { borderBottomColor: palette.accent }, railCrest: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E3E9EE', borderWidth: 1, borderColor: '#D1DBE3', alignItems: 'center', justifyContent: 'center' }, railCrestSelected: { backgroundColor: palette.navy, borderColor: palette.navy }, railInitial: { color: palette.ink, fontSize: 15, fontWeight: '900' }, railInitialSelected: { color: palette.white }, railName: { color: palette.ink, fontSize: 11, fontWeight: '700', maxWidth: 78 },
  hero: { backgroundColor: palette.navy, borderRadius: 4, borderBottomWidth: 4, borderBottomColor: palette.accent, padding: 22, minHeight: 240, overflow: 'hidden', justifyContent: 'space-between', gap: 20 }, field: { position: 'absolute', right: -60, bottom: -24, width: 300, height: 280, opacity: 0.65 }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }, heroKicker: { color: '#ADC3D2', fontSize: 10, fontWeight: '800', letterSpacing: 2 }, heroIdentity: { flexDirection: 'row', alignItems: 'center', gap: 16 }, teamTitle: { color: palette.white, fontSize: 40, lineHeight: 43, letterSpacing: 0.3, flex: 1 }, heroCta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 14, paddingVertical: 10, minHeight: 44 }, heroCtaLabel: { color: palette.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  readouts: { flexDirection: 'row', backgroundColor: palette.panel, borderColor: palette.line, borderWidth: 1, borderTopWidth: 0, paddingVertical: 18 }, readout: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, gap: 6 }, readoutBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: palette.line }, readoutLabel: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 }, readoutValue: { color: palette.ink, fontSize: 22, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, action: { flex: 1, minWidth: 135, padding: 17, backgroundColor: palette.panel, borderWidth: 1, borderColor: palette.line, borderBottomWidth: 3, borderBottomColor: palette.navy, gap: 7 }, actionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, actionTitle: { color: palette.ink, fontSize: 23 }, actionMeta: { color: palette.muted, fontSize: 11, lineHeight: 17 }, pressed: { transform: [{ scale: 0.985 }], opacity: 0.8 },
  trial: { padding: 17, gap: 12 }, trialTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, trialTitle: { color: palette.ink, fontSize: 21 }, trialDate: { color: palette.muted, fontSize: 11 }, trialTrack: { height: 4, backgroundColor: '#E5E9ED' }, trialFill: { height: 4, backgroundColor: palette.accent }, trialCaption: { color: palette.muted, fontSize: 11 },
  empty: { gap: 20, backgroundColor: palette.navy, padding: 24, borderBottomWidth: 4, borderBottomColor: palette.accent }, emptyTitle: { color: palette.white, fontSize: 38, lineHeight: 41 }, emptyCopy: { color: '#C5D4DE', fontSize: 14, lineHeight: 22 },
});
