import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Team } from '@/lib/teams';

export const palette = { canvas: '#0B1421', panel: '#142235', raised: '#1B2C42', line: '#293A50', ink: '#F4F5EF', muted: '#9CAFC2', accent: '#C4E59B', green: '#203D32', error: '#FFB6AE' };
const icons = {
  home: { ios: 'house', android: 'home', web: 'home' },
  teams: { ios: 'person.2', android: 'groups', web: 'groups' },
  link: { ios: 'link', android: 'link', web: 'link' },
  account: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  arrow: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  ball: { ios: 'baseball', android: 'sports_baseball', web: 'sports_baseball' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  shield: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
} as const;
export type IconName = keyof typeof icons;
export function Icon({ name, color = palette.muted, size = 22 }: { name: IconName; color?: ComponentProps<typeof SymbolView>['tintColor']; size?: number }) {
  return <SymbolView name={icons[name]} tintColor={color} size={size} style={{ width: size, height: size }} />;
}
export function Screen({ title, eyebrow = 'DUGOUT PILOT', subtitle, children, back = false, onRefresh, trailing }: { title: string; eyebrow?: string; subtitle?: string; children: ReactNode; back?: boolean; onRefresh?: () => Promise<void>; trailing?: ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  return <SafeAreaView edges={['top', 'left', 'right']} style={ui.screen}>
    <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} tintColor={palette.accent} onRefresh={() => { setRefreshing(true); void onRefresh().finally(() => setRefreshing(false)); }} /> : undefined}>
        {back && <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }} style={ui.back}><Icon name="back" color={palette.ink} size={18} /><Text style={ui.backText}>Back</Text></Pressable>}
        <View style={ui.masthead}><View style={ui.diamond} /><Text style={ui.eyebrow}>{eyebrow}</Text>{trailing && <View style={ui.trailing}>{trailing}</View>}</View>
        <View style={ui.intro}><Text style={ui.title}>{title}</Text>{subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}</View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={ui.section}><Text style={ui.sectionTitle}>{title}</Text>{children}</View>;
}
export function Panel({ children }: { children: ReactNode }) { return <View style={ui.panel}>{children}</View>; }
export function Button({ children, onPress, secondary = false, disabled = false }: { children: ReactNode; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [ui.button, secondary && ui.secondary, (pressed || disabled) && ui.dim]}><Text style={[ui.buttonText, secondary && ui.secondaryText]}>{children}</Text></Pressable>;
}
export function MenuRow({ icon, title, description, onPress, last = false, end }: { icon: IconName; title: string; description?: string; onPress?: () => void; last?: boolean; end?: ReactNode }) {
  const content = <><View style={ui.iconTile}><Icon name={icon} color={palette.accent} /></View><View style={ui.rowCopy}><Text style={ui.rowTitle}>{title}</Text>{description && <Text style={ui.rowDescription}>{description}</Text>}</View>{end ?? (onPress ? <Icon name="arrow" size={16} /> : null)}</>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [ui.menuRow, !last && ui.divider, pressed && ui.dim]}>{content}</Pressable> : <View style={[ui.menuRow, !last && ui.divider]}>{content}</View>;
}
export function AccessBadge({ team }: { team: Team }) {
  const label = team.test_access ? 'TEST ACCESS' : { trial: 'ELITE TRIAL', active: 'ACTIVE', pending: 'PENDING', expired: 'TRIAL ENDED', suspended: 'SUSPENDED' }[team.access_status];
  return <View style={[ui.badge, !['trial', 'active'].includes(team.access_status) && ui.badgeMuted]}><Text style={ui.badgeText}>{label}</Text></View>;
}
export function StatusMessage({ text, error = false }: { text: string; error?: boolean }) { return text ? <Text accessibilityLiveRegion="polite" style={[ui.message, error && ui.error]}>{text}</Text> : null; }
export function Loading() { return <View style={ui.loading}><ActivityIndicator color={palette.accent} accessibilityLabel="Loading teams" /></View>; }
export const ui = StyleSheet.create({
  flex: { flex: 1 }, screen: { flex: 1, backgroundColor: palette.canvas }, content: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 36, gap: 28, width: '100%', maxWidth: 720, alignSelf: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 24 }, trailing: { marginLeft: 'auto' }, diamond: { width: 11, height: 11, borderColor: palette.accent, borderWidth: 2, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  eyebrow: { color: palette.muted, fontSize: 11, letterSpacing: 2.4, fontWeight: '800' }, intro: { gap: 10 }, title: { color: palette.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2 }, subtitle: { color: palette.muted, fontSize: 15, lineHeight: 23, maxWidth: 480 },
  section: { gap: 12 }, sectionTitle: { color: palette.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' },
  panel: { borderColor: palette.line, borderWidth: 1, borderRadius: 20, backgroundColor: palette.panel, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, minHeight: 80 }, divider: { borderBottomWidth: 1, borderBottomColor: palette.line }, iconTile: { width: 42, height: 42, borderRadius: 13, backgroundColor: palette.raised, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 5 }, rowTitle: { color: palette.ink, fontSize: 16, fontWeight: '600' }, rowDescription: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  button: { backgroundColor: palette.accent, minHeight: 52, padding: 15, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 15, fontWeight: '800', color: palette.canvas, textAlign: 'center' }, secondary: { backgroundColor: palette.raised, borderWidth: 1, borderColor: palette.line }, secondaryText: { color: palette.ink }, dim: { opacity: 0.65 },
  badge: { alignSelf: 'flex-start', backgroundColor: palette.green, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 6 }, badgeMuted: { backgroundColor: palette.raised }, badgeText: { color: palette.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  message: { color: palette.accent, fontSize: 14, lineHeight: 21 }, error: { color: palette.error }, loading: { padding: 32 },
  back: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', minHeight: 44 }, backText: { color: palette.ink, fontSize: 15 },
  body: { color: palette.muted, fontSize: 15, lineHeight: 23 }, heading: { color: palette.ink, fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  inset: { padding: 22, gap: 16 }, input: { backgroundColor: palette.panel, borderColor: palette.line, borderWidth: 1, color: palette.ink, fontSize: 16, padding: 16, borderRadius: 13, minHeight: 54 }, label: { color: palette.ink, fontSize: 13, fontWeight: '600' },
});
