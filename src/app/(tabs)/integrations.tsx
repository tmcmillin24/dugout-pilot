import { StyleSheet, Text, View } from 'react-native';
import { Icon, Panel, Screen, Section, palette, ui } from '@/components/app-ui';
import { DisplayText } from '@/components/sports-type';
import { useTeams } from '@/providers/team-provider';
export default function IntegrationsScreen() {
  const { active } = useTeams();
  return <Screen title="Integrations">
    <View style={s.teamContext}><Icon name="teams" color={palette.ink} size={18} /><Text style={s.teamName}>{active?.name ?? 'Select a team to get started'}</Text></View>
    <View>
      <View style={s.hero}><View style={s.top}><Text style={s.kicker}>TEAM DATA</Text><Text style={s.status}>COMING NEXT</Text></View><DisplayText italic style={s.heroTitle}>GAMECHANGER</DisplayText><Text style={s.heroSub}>From the box score to your dugout.</Text></View>
      <Panel><View style={ui.inset}><Text style={ui.body}>Bring exported team statistics into Dugout Pilot.</Text><View style={s.steps}>{['UPLOAD CSV', 'MATCH PLAYERS', 'REVIEW IMPORT'].map((label, index) => <View key={label} style={s.step}><DisplayText style={s.number}>{String(index + 1).padStart(2, '0')}</DisplayText><Text style={s.stepText}>{label}</Text></View>)}</View></View></Panel>
    </View>
    <Section title="Connection status"><Panel><View style={s.connection}><View style={s.statusDot} /><View style={ui.flex}><Text style={s.connectionTitle}>Not connected</Text><Text style={s.connectionDetail}>CSV imports are in development. Live sync is not enabled.</Text></View></View></Panel></Section>
  </Screen>;
}
const s = StyleSheet.create({
  teamContext: { flexDirection: 'row', alignItems: 'center', gap: 10 }, teamName: { color: palette.ink, fontSize: 13, fontWeight: '600', flex: 1 }, hero: { backgroundColor: palette.navy, padding: 22, borderBottomWidth: 4, borderBottomColor: palette.accent, gap: 16 }, top: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, kicker: { color: '#B5C9D7', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, status: { color: '#FFB38F', fontSize: 9, fontWeight: '800', letterSpacing: 1 }, heroTitle: { color: palette.white, fontSize: 43 }, heroSub: { color: '#B5C9D7', fontSize: 12 }, steps: { gap: 0 }, step: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 13, borderTopWidth: 1, borderColor: palette.line }, number: { color: '#BC450F', fontSize: 25 }, stepText: { color: palette.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }, connection: { flexDirection: 'row', gap: 12, padding: 18, alignItems: 'center' }, statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#8899A8' }, connectionTitle: { color: palette.ink, fontWeight: '700', fontSize: 14 }, connectionDetail: { color: palette.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
});
