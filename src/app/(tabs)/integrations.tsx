import { StyleSheet, Text, View } from 'react-native';
import { Icon, Panel, Screen, Section, palette, ui } from '@/components/app-ui';
import { useTeams } from '@/providers/team-provider';

export default function IntegrationsScreen() {
  const { active } = useTeams();
  return <Screen title="Your tools, together." eyebrow="INTEGRATIONS" subtitle="Bring your game data into the coaching workspace.">
    <View style={s.context}><Icon name="teams" size={17} /><Text style={s.contextText}>{active?.name ?? 'Choose a team in the Teams tab'}</Text></View>
    <Section title="Planned integration"><Panel><View style={ui.inset}>
      <View style={s.top}><View style={s.logo}><Text style={s.logoText}>GC</Text></View><View style={s.copy}><Text style={ui.heading}>GameChanger</Text><Text style={s.tag}>CSV IMPORT · IN DEVELOPMENT</Text></View></View>
      <Text style={ui.body}>Turn exported batting, pitching, and fielding statistics into useful team insights.</Text>
      <View style={s.rule} />
      <Text style={s.label}>The import flow</Text>
      <Text style={ui.body}>Export your stats, review player matches, then confirm the import for the selected team.</Text>
      <View style={s.note}><Icon name="shield" color={palette.accent} size={18} /><Text style={s.noteText}>No account connection or live sync is active yet.</Text></View>
    </View></Panel></Section>
    <Text style={s.footer}>Imports will stay separate for each team. Invitations and team access are managed in the Teams tab.</Text>
  </Screen>;
}
const s = StyleSheet.create({
  context: { flexDirection: 'row', alignItems: 'center', gap: 10 }, contextText: { color: palette.muted, fontSize: 13, flex: 1 }, top: { flexDirection: 'row', alignItems: 'center', gap: 14 }, logo: { backgroundColor: '#B8DFBF', borderRadius: 14, width: 52, height: 52, justifyContent: 'center', alignItems: 'center' }, logoText: { color: '#163327', fontWeight: '900', fontSize: 19 }, copy: { flex: 1, gap: 7 }, tag: { color: palette.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }, rule: { height: 1, backgroundColor: palette.line }, label: { color: palette.ink, fontSize: 14, fontWeight: '700' }, note: { flexDirection: 'row', gap: 10, backgroundColor: palette.raised, borderRadius: 12, padding: 14 }, noteText: { color: palette.muted, flex: 1, fontSize: 13, lineHeight: 20 }, footer: { color: palette.muted, fontSize: 12, lineHeight: 20 },
});
