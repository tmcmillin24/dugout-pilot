import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { OverlayModal } from './overlay-modal';
import { DisplayText } from './sports-type';
import { TeamLogo } from './team-logo';
import { palette } from './app-ui';
import { deleteTeam, teamError, type Team } from '@/lib/teams';
import { useTeams } from '@/providers/team-provider';

export default function DeleteTeamControl({ team }: { team: Team }) {
  const { forget } = useTeams();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  if (team.role !== 'owner') return null;
  function close() { if (!lock.current) { setOpen(false); setConfirmation(''); setError(''); } }
  async function confirmDelete() {
    if (lock.current || confirmation.trim() !== team.name) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await deleteTeam(team.id, confirmation);
      setOpen(false);
      await forget(team.id, team.name);
      router.replace('/teams');
    } catch (reason) { setError(teamError(reason)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>
    <View style={s.dangerZone}><View style={s.dangerCopy}><DisplayText style={s.zoneTitle}>DELETE TEAM</DisplayText><Text style={s.zoneCaption}>Permanently remove this team.</Text></View><Pressable accessibilityRole="button" onPress={() => { setConfirmation(''); setError(''); setOpen(true); }} style={s.openButton}><Text style={s.openText}>DELETE</Text></Pressable></View>
    <OverlayModal open={open} onClose={close}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
          <View accessibilityViewIsModal onAccessibilityEscape={close} style={s.dialog}>
            <View style={s.header}><Text style={s.kicker}>TEAM MANAGEMENT</Text><DisplayText accessibilityRole="header" style={s.title}>DELETE TEAM?</DisplayText></View>
            <View style={s.body}>
              <View style={s.identity}><TeamLogo team={team} size={48} /><View style={s.nameWrap}><Text style={s.teamName}>{team.name}</Text><Text style={s.permanent}>THIS CANNOT BE UNDONE</Text></View></View>
              <Text style={s.warning}>This permanently deletes the team, its invitations, and access for every coach.</Text>
              <Text style={s.secondary}>Your account and other teams stay intact.</Text>
              <Text style={s.label}>Type the team name to confirm:</Text>
              <Text selectable style={s.nameHint}>{team.name}</Text>
              <TextInput accessibilityLabel="Team name confirmation" value={confirmation} onChangeText={setConfirmation} style={s.input} autoCapitalize="none" autoCorrect={false} editable={!busy} placeholder="Team name" placeholderTextColor={palette.muted} returnKeyType="done" onSubmitEditing={() => { void confirmDelete(); }} />
              {!!error && <Text accessibilityLiveRegion="assertive" style={s.error}>{error}</Text>}
              <View style={s.buttons}><Pressable accessibilityRole="button" disabled={busy} onPress={close} style={[s.cancel, busy && s.disabled]}><Text style={s.cancelText}>CANCEL</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || confirmation.trim() !== team.name }} disabled={busy || confirmation.trim() !== team.name} onPress={() => { void confirmDelete(); }} style={[s.confirm, (busy || confirmation.trim() !== team.name) && s.disabled]}>{busy ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Deleting team" /> : <Text style={s.confirmText}>DELETE TEAM</Text>}</Pressable></View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OverlayModal>
  </>;
}
const s = StyleSheet.create({
  dangerZone: { paddingTop: 20, borderTopWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 12 }, dangerCopy: { flex: 1, gap: 5 }, zoneTitle: { color: '#A62D28', fontSize: 24 }, zoneCaption: { color: palette.muted, fontSize: 12 }, openButton: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D4A09B', backgroundColor: '#FFF5F3' }, openText: { color: '#A62D28', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  overlay: { flex: 1, backgroundColor: 'rgba(3, 19, 32, 0.76)' }, modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, dialog: { width: '100%', maxWidth: 430, backgroundColor: palette.panel, borderRadius: 5, overflow: 'hidden' }, header: { backgroundColor: palette.navy, borderBottomWidth: 4, borderBottomColor: palette.accent, padding: 22, gap: 8 }, kicker: { color: '#B3C9D8', fontSize: 9, letterSpacing: 1.7, fontWeight: '800' }, title: { color: palette.white, fontSize: 36 }, body: { padding: 22, gap: 15 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 12 }, nameWrap: { flex: 1, gap: 6 }, teamName: { color: palette.ink, fontSize: 17, fontWeight: '800' }, permanent: { color: '#A62D28', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }, warning: { color: palette.ink, fontSize: 14, lineHeight: 21 }, secondary: { color: palette.muted, fontSize: 12, lineHeight: 18 }, label: { color: palette.ink, fontSize: 12, fontWeight: '700', marginTop: 3 }, nameHint: { color: palette.muted, fontSize: 12, marginTop: -8 }, input: { borderWidth: 1, borderColor: palette.line, padding: 14, minHeight: 50, color: palette.ink, backgroundColor: palette.canvas, fontSize: 16 }, error: { color: '#A62D28', fontSize: 12, lineHeight: 19 }, buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 6 }, cancel: { flex: 1, minWidth: 115, minHeight: 50, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center', padding: 12 }, cancelText: { color: palette.ink, fontSize: 11, fontWeight: '800' }, confirm: { flex: 1, minWidth: 115, minHeight: 50, backgroundColor: '#AE302A', alignItems: 'center', justifyContent: 'center', padding: 12 }, confirmText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, disabled: { opacity: 0.45 },
});
