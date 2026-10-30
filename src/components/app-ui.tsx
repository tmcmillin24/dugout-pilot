import { useRulesAssistant } from '@/providers/rules-assistant-provider';
import { Image } from 'expo-image';
import { DisplayText } from './sports-type';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useState, type ComponentProps, type ReactNode, type ComponentRef, type RefObject } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Team } from '@/lib/teams';

export const palette = { canvas: '#F1F3F5', panel: '#FFFFFF', raised: '#E8EDF1', line: '#D8DFE5', ink: '#082E4B', muted: '#637182', accent: '#F45C1B', badgeSurface: '#FFF0E8', error: '#B3261E', cardInk: '#082E4B', cardMuted: '#637182', cardLine: '#E4E8EC', cardTint: '#FFF0E8', navy: '#082E4B', white: '#FFFFFF' };
const icons = {
  eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
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
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  trash: { ios: 'trash', android: 'delete_outline', web: 'delete_outline' },
  chat: { ios: 'bubble.left.and.bubble.right', android: 'chat_bubble_outline', web: 'chat_bubble_outline' },
  upload: { ios: 'square.and.arrow.up', android: 'upload_file', web: 'upload_file' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  send: { ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' },
  settings: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
} as const;
export type IconName = keyof typeof icons;
export function Icon({ name, color = palette.muted, size = 22 }: { name: IconName; color?: ComponentProps<typeof SymbolView>['tintColor']; size?: number }) {
  return <SymbolView name={icons[name]} tintColor={color} size={size} style={{ width: size, height: size }} />;
}
export function Screen({ title, subtitle, children, back = false, onRefresh, trailing, hideTitle = false, scrollRef, scrollEnabled = true, onScroll }: { title: string; eyebrow?: string; subtitle?: string; children: ReactNode; back?: boolean; onRefresh?: () => Promise<void>; trailing?: ReactNode; hideTitle?: boolean; scrollRef?: RefObject<ComponentRef<typeof ScrollView> | null>; scrollEnabled?: boolean; onScroll?: ScrollViewProps['onScroll'] }) {
  const { width } = useWindowDimensions();
  const tablet = width >= 768;
  const roomy = width >= 600;
  const insets = useSafeAreaInsets();
  const windowControlsInset = Platform.OS === 'ios' && Platform.isPad && insets.top < 24 ? 26 : 0;
  const [refreshing, setRefreshing] = useState(false);
  const assistant = useRulesAssistant();
  return <SafeAreaView edges={['top', 'left', 'right']} style={ui.screen}>
    <View style={[ui.toolbar, { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: tablet ? 32 : roomy ? 24 : 16, height: (tablet ? 88 : 78) + windowControlsInset, paddingTop: windowControlsInset }]}>
      {back ? <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }} style={ui.headerButton}><Icon name="back" color={palette.ink} size={20} /></Pressable> : null}
      <View style={ui.brandGroup}><Image source={require('@/assets/images/dugout-pilot-wordmark.jpeg')} contentFit="contain" contentPosition="left center" accessibilityLabel="Dugout Pilot" style={ui.brandLogo} /></View>
      <View style={ui.toolbarEnd}>{assistant && <Pressable accessibilityRole="button" accessibilityLabel="Ask the rules assistant" onPress={() => assistant.show()} style={[ui.assistantButton, roomy && { minWidth: 148, minHeight: 50, paddingHorizontal: 16, gap: 9, flexDirection: 'row' }]}><Icon name="chat" color={palette.ink} size={roomy ? 28 : 18} /><Text style={[ui.assistantLabel, roomy && { fontSize: 12, lineHeight: 14, letterSpacing: 0.8 }]}>{roomy ? 'ASK DUGOUT' : 'ASK\nDUGOUT'}</Text></Pressable>}{trailing ?? <Pressable accessibilityRole="button" accessibilityLabel="Open account" onPress={() => router.push('/account')} style={[ui.headerButton, roomy && { minWidth: 62, minHeight: 62, marginLeft: 10 }]}><Icon name="account" color={palette.ink} size={roomy ? 40 : 25} /></Pressable>}</View>
    </View>
    <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} scrollEnabled={scrollEnabled} onScroll={onScroll} scrollEventThrottle={16} style={{ backgroundColor: palette.canvas }} contentContainerStyle={[ui.content, roomy && { maxWidth: 1180, paddingHorizontal: tablet ? 32 : 24, paddingTop: tablet ? 28 : 24, paddingBottom: 40, gap: 24 }]} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} tintColor={palette.accent} onRefresh={() => { setRefreshing(true); void onRefresh().finally(() => setRefreshing(false)); }} /> : undefined}>
        {!hideTitle && <View style={ui.intro}><DisplayText accessibilityRole="header" style={ui.title}>{title.toUpperCase()}</DisplayText>{subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}</View>}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Section({ title, children, style }: { title: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.section,style]}><View style={ui.sectionHeader}><View style={ui.sectionMarker} /><DisplayText accessibilityRole="header" style={ui.sectionTitle}>{title.toUpperCase()}</DisplayText></View>{children}</View>;
}
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[ui.panel,style]}>{children}</View>; }
export function Button({ children, onPress, secondary = false, disabled = false, style }: { children: ReactNode; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [ui.button, secondary && ui.secondary, style, (pressed || disabled) && ui.dim]}><Text style={[ui.buttonText, secondary && ui.secondaryText]}>{children}</Text></Pressable>;
}
export function MenuRow({ icon, title, description, onPress, last = false, end }: { icon: IconName; title: string; description?: string; onPress?: () => void; last?: boolean; end?: ReactNode }) {
  const content = <><View style={ui.iconTile}><Icon name={icon} color={palette.ink} /></View><View style={ui.rowCopy}><Text style={ui.rowTitle}>{title}</Text>{description && <Text style={ui.rowDescription}>{description}</Text>}</View>{end ?? (onPress ? <Icon name="arrow" color={palette.cardMuted} size={16} /> : null)}</>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [ui.menuRow, !last && ui.divider, pressed && ui.dim]}>{content}</Pressable> : <View style={[ui.menuRow, !last && ui.divider]}>{content}</View>;
}
export function AccessBadge({ team }: { team: Team }) {
  const label = team.test_access ? 'TEST ACCESS' : { trial: 'ELITE TRIAL', active: 'ACTIVE', pending: 'PENDING', expired: 'TRIAL ENDED', suspended: 'SUSPENDED' }[team.access_status];
  return <View style={[ui.badge, !['trial', 'active'].includes(team.access_status) && ui.badgeMuted]}><Text style={ui.badgeText}>{label}</Text></View>;
}
export function StatusMessage({ text, error = false }: { text: string; error?: boolean }) { return text ? <Text accessibilityLiveRegion="polite" style={[ui.message, error && ui.error]}>{text}</Text> : null; }
export function Loading() { return <View style={ui.loading}><ActivityIndicator color={palette.accent} accessibilityLabel="Loading teams" /></View>; }
export const ui = StyleSheet.create({
  flex: { flex: 1 }, screen: { flex: 1, backgroundColor: palette.panel }, content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 28, gap: 22, backgroundColor: palette.canvas, width: '100%', maxWidth: 720, alignSelf: 'center', flexGrow: 1 },
  toolbar: { height: 78, backgroundColor: palette.panel, borderBottomWidth: 1, borderBottomColor: palette.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }, brandGroup: { flex: 1, maxWidth: 218, minWidth: 0, justifyContent: 'center' }, brandLogo: { width: '100%', aspectRatio: 1548 / 373 }, toolbarEnd: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }, assistantButton: { minWidth: 60, minHeight: 44, paddingHorizontal: 9, borderRadius: 12, backgroundColor: palette.badgeSurface, borderWidth: 1, borderColor: '#F5C6AD', alignItems: 'center', justifyContent: 'center', gap: 2 }, assistantLabel: { color: palette.ink, fontSize: 8, lineHeight: 9, textAlign: 'center', fontWeight: '800', letterSpacing: 0.6 }, headerButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 24 }, trailing: { marginLeft: 'auto' }, diamond: { width: 11, height: 11, borderColor: palette.accent, borderWidth: 2, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  wordmark: { color: palette.ink, fontWeight: '900', fontSize: 13, letterSpacing: 1.3 }, wordmarkAccent: { color: palette.accent },
  eyebrow: { color: palette.muted, fontSize: 11, letterSpacing: 2.4, fontWeight: '800' }, intro: { gap: 6 }, title: { color: palette.ink, fontSize: 34, fontWeight: '800', letterSpacing: 0.2 }, subtitle: { color: palette.muted, fontSize: 15, lineHeight: 23, maxWidth: 480 },
  section: { gap: 12, width: '100%', minWidth: 0 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sectionMarker: { width: 3, height: 17, backgroundColor: palette.accent }, sectionTitle: { flexShrink: 1, color: palette.ink, fontSize: 23, fontWeight: '800', letterSpacing: 0.2 },
  panel: { borderColor: palette.line, borderWidth: 1, borderRadius: 5, backgroundColor: palette.panel, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 67 }, divider: { borderBottomWidth: 1, borderBottomColor: palette.cardLine }, iconTile: { width: 26, height: 34, borderRadius: 0, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, gap: 5 }, rowTitle: { color: palette.cardInk, fontSize: 16, fontWeight: '600' }, rowDescription: { color: palette.cardMuted, fontSize: 13, lineHeight: 19 },
  button: { backgroundColor: palette.accent, minHeight: 52, padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 15, fontWeight: '800', color: palette.ink, textAlign: 'center' }, secondary: { backgroundColor: palette.raised, borderWidth: 1, borderColor: palette.line }, secondaryText: { color: palette.ink }, dim: { opacity: 0.65 },
  badge: { alignSelf: 'flex-start', backgroundColor: palette.badgeSurface, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 2 }, badgeMuted: { backgroundColor: '#EAF0F5' }, badgeText: { color: '#9D3A10', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  message: { color: palette.ink, fontSize: 14, lineHeight: 21 }, error: { color: palette.error }, loading: { padding: 32 },
  back: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', minHeight: 44 }, backText: { color: palette.ink, fontSize: 15 },
  body: { color: palette.cardMuted, fontSize: 15, lineHeight: 23 }, heading: { color: palette.cardInk, fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  inset: { padding: 22, gap: 16 }, input: { backgroundColor: palette.raised, borderColor: palette.line, borderWidth: 1, color: palette.ink, fontSize: 16, padding: 16, borderRadius: 5, minHeight: 54 }, label: { color: palette.ink, fontSize: 13, fontWeight: '600' },
});
