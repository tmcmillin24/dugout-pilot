import { StyleSheet, Text, View } from 'react-native';
import { Icon, Panel, Screen, Section, palette, ui } from '@/components/app-ui';
import { useTeams } from '@/providers/team-provider';

export default function IntegrationsScreen() {
  const { active } = useTeams();
  return <Screen title="Integrations">
    <View style={s.context}><Icon name="teams" size={17} /><Text style={s.contextText}>{active?.name ?? 'Choose a team in the Teams tab'}</Text></View>
    <Section title="Planned integration"><Panel><View style={ui.inset}>
      <View style={s.top}><View style={s.logo}><Text style={s.logoText}>GC</Text></View><View style={s.copy}><Text style={ui.heading}>GameChanger</Text><Text style={s.tag}>CSV IMPORT · IN DEVELOPMENT</Text></View></View>
      <Text style={ui.body}>Import your team’s exported statistics.</Text>
      <View style={s.rule} />
      <Text style={s.label}>The import flow</Text>
      <Text style={ui.body}>Upload CSV. Match players. Review and import.</Text>
      <View style={s.note}><Icon name="shield" color={palette.accent} size={18} /><Text style={s.noteText}>CSV imports coming soon.</Text></View>
    </View></Panel></Section>
    
  </Screen>;
}
const s = StyleSheet.create({
  context: { flexDirection: 'row', alignItems: 'center', gap: 10 }, contextText: { color: palette.muted, fontSize: 13, flex: 1 }, top: { flexDirection: 'row', alignItems: 'center', gap: 14 }, logo: { backgroundColor: palette.cardTint, borderRadius: 14, width: 52, height: 52, justifyContent: 'center', alignItems: 'center' }, logoText: { color: palette.cardInk, fontWeight: '900', fontSize: 19 }, copy: { flex: 1, gap: 7 }, tag: { color: '#9D3A10', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }, rule: { height: 1, backgroundColor: palette.cardLine }, label: { color: palette.cardInk, fontSize: 14, fontWeight: '700' }, note: { flexDirection: 'row', gap: 10, backgroundColor: '#F1F5F8', borderRadius: 12, padding: 14 }, noteText: { color: palette.cardMuted, flex: 1, fontSize: 13, lineHeight: 20 }, footer: { color: palette.muted, fontSize: 12, lineHeight: 20 },
});
