import { useState, type ReactNode, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Loading, Screen, StatusMessage, palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import { useTeams } from '@/providers/team-provider';
import { useCoaching } from '@/providers/coaching-provider';

export function CoachingScreen({ title, children, back = false, scrollRef, scrollEnabled, onScroll }: { title: string; children: ReactNode; back?: boolean } & Pick<ComponentProps<typeof Screen>, 'scrollRef'|'scrollEnabled'|'onScroll'>) {
  const { active, loading: teamsLoading } = useTeams();
  const { board, loading, busy, error, notice, reload, writable } = useCoaching();
  return <Screen title={title} back={back} scrollRef={scrollRef} scrollEnabled={scrollEnabled} onScroll={onScroll} subtitle={active?.name} onRefresh={reload}>
    <StatusMessage text={error} error /><StatusMessage text={busy ? 'Saving…' : notice} />
    {teamsLoading || loading ? <Loading /> : !active ? <><Text style={ui.body}>Choose or create a team to get started.</Text><Button onPress={() => router.navigate('/teams')}>OPEN TEAMS</Button></> : !board ? <Button secondary onPress={() => { void reload(); }}>RETRY</Button> : <>
      {!writable && !busy && <Text style={ui.body}>View your saved plans. Active team access is required to make changes.</Text>}
      {error && <Button secondary onPress={() => { void reload(); }}>RELOAD TEAM DATA</Button>}{children}
    </>}
  </Screen>;
}
export function Chips<T extends string>({ values, selected, onSelect, disabled = false }: { values: { value: T; label: string }[]; selected: T; onSelect: (value: T) => void; disabled?: boolean }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={c.chips}>{values.map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: selected === item.value, disabled }} disabled={disabled} onPress={() => onSelect(item.value)} style={[c.chip, selected === item.value && c.selected, disabled && ui.dim]}><Text style={[c.chipText, selected === item.value && c.selectedText]}>{item.label}</Text></Pressable>)}</ScrollView>;
}
export function Field({ label, value, onChange, numeric = false, multiline = false }: { label: string; value: string; onChange: (text: string) => void; numeric?: boolean; multiline?: boolean }) {
  return <View style={c.stack}><Text style={ui.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType={numeric ? 'number-pad' : 'default'} multiline={multiline} maxLength={multiline ? 2000 : 120} style={[ui.input, multiline && { minHeight: 90 }]} /></View>;
}
export function Sheet({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const { error, busy } = useCoaching();
  return <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}><KeyboardAvoidingView style={c.scrim} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View accessibilityViewIsModal style={c.sheet}><View style={c.sheetHead}><DisplayText accessibilityRole="header" style={c.sheetTitle}>{title.toUpperCase()}</DisplayText><Pressable accessibilityRole="button" onPress={onClose} style={c.close}><Text style={c.closeText}>Close</Text></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={c.sheetBody}><StatusMessage text={error} error /><StatusMessage text={busy ? 'Saving…' : ''} />{children}</ScrollView></View></KeyboardAvoidingView></Modal>;
}
export function Choice({ label, value, options, onChange, disabled, fill = false }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; disabled?: boolean; fill?: boolean }) {
  const [open, setOpen] = useState(false);
  return <><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${options.find(x => x.value === value)?.label ?? 'Choose'}`} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={() => setOpen(true)} style={[c.choice,fill&&{flex:1,minHeight:92},disabled&&{backgroundColor:palette.raised,opacity:0.6}]}><Text style={ui.label}>{label}</Text><Text style={c.choiceValue}>{options.find(x => x.value === value)?.label ?? 'Choose'}{disabled?'':' ▾'}</Text></Pressable><Sheet title={label} open={open} onClose={() => setOpen(false)}>{options.map(item => <Pressable key={item.value} accessibilityRole="button" onPress={() => { onChange(item.value); setOpen(false); }} style={[c.option, item.value === value && { backgroundColor: palette.badgeSurface }]}><Text style={ui.rowTitle}>{item.label}</Text></Pressable>)}</Sheet></>;
}
export const c = StyleSheet.create({
  stack: { gap: 8 }, group: { gap: 16 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, grow: { flex: 1 },
  chips: { gap: 7 }, chip: { paddingHorizontal: 16, paddingVertical: 13, minHeight: 44, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.panel, borderRadius: 3 }, selected: { backgroundColor: palette.navy, borderColor: palette.navy }, chipText: { color: palette.ink, fontSize: 12, fontWeight: '800' }, selectedText: { color: palette.white },
  choice: { minHeight: 55, padding: 14, backgroundColor: palette.panel, borderWidth: 1, borderColor: palette.line, gap: 6, borderRadius: 4 }, choiceValue: { color: palette.ink, fontSize: 15, fontWeight: '600' },
  scrim: { flex: 1, backgroundColor: '#001426B8', justifyContent: 'center', padding: 20 }, sheet: { backgroundColor: palette.canvas, maxHeight: '85%', width: '100%', maxWidth: 620, alignSelf: 'center', borderRadius: 6, overflow: 'hidden' }, sheetHead: { backgroundColor: palette.navy, borderBottomWidth: 3, borderBottomColor: palette.accent, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 8 }, sheetTitle: { color: palette.white, fontSize: 28, flex: 1 }, close: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, closeText: { color: palette.white, fontWeight: '700' }, sheetBody: { padding: 18, gap: 16 }, option: { padding: 17, minHeight: 52, borderBottomWidth: 1, borderBottomColor: palette.line },
  number: { width: 32, color: palette.accent, fontSize: 23, fontWeight: '800' }, item: { padding: 15, borderBottomColor: palette.line, borderBottomWidth: 1, gap: 7 }, small: { fontSize: 12, lineHeight: 18, color: palette.muted },
  headline: { fontSize: 27, color: palette.ink }, danger: { color: palette.error, fontWeight: '700' }, compact: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
