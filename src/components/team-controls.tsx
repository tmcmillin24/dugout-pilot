import { palette } from './app-ui';
import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { acceptCoachInvite, inviteCoach, listActivationTeams, listTeamCoaches, listTeamInvitations, removeTeamCoach, renameTeam, revokeCoachInvite, setTeamTestAccess, teamError, type ActivationTeam, type Team, type TeamInvitation, type TeamMember } from '@/lib/teams';

function Action({ children, onPress, disabled = false, danger = false, primary = false }: { children: ReactNode; onPress: () => void; disabled?: boolean; danger?: boolean; primary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.action, primary && s.primaryAction, disabled && s.disabled]}><Text style={[s.actionText, primary && s.primaryActionText, danger && s.error]}>{children}</Text></Pressable>;
}
function Message({ text, error = false }: { text: string; error?: boolean }) {
  return text ? <Text accessibilityLiveRegion="polite" style={error ? s.error : s.notice}>{text}</Text> : null;
}
function confirmAction(title: string, message: string, action: () => void) {
  if (Platform.OS === 'web') { if (window.confirm(`${title}\n\n${message}`)) action(); }
  else Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: action }]);
}

export function JoinTeam({ onJoined }: { onJoined: (teamId: string) => Promise<void> }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  async function accept() {
    if (inFlight.current) return;
    if (!/^[a-f0-9]{64}$/i.test(code.trim())) { setError('Paste the complete invitation code supplied by your team owner.'); return; }
    inFlight.current = true; setBusy(true); setError('');
    try {
      const teamId = await acceptCoachInvite(code);
      setCode('');
      await onJoined(teamId);
    } catch (reason) { setError(teamError(reason)); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <View style={s.section}>
    <Text style={s.body}>Use the email address your owner invited.</Text>
    <TextInput accessibilityLabel="Invitation code" style={s.input} value={code} onChangeText={setCode} editable={!busy} autoCorrect={false} autoCapitalize="none" placeholder="Invitation code" placeholderTextColor="#778397" />
    <Message text={error} error />
    <Action primary disabled={busy} onPress={() => { void accept(); }}>{busy ? 'Joining…' : 'Accept invitation'}</Action>
  </View>;
}

export function OwnerPanel({ team, onChanged, view = 'coaches' }: { team: Team; onChanged: () => Promise<void>; view?: 'settings' | 'coaches' | 'invite' }) {
  const [name, setName] = useState(team.name);
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(view === 'coaches');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [issued, setIssued] = useState<{ code: string; email: string; id: string } | null>(null);
  const request = useRef<{ email: string; code: string; id: string } | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const revision = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const load = useCallback(async () => {
    if (view !== 'coaches') return;
    const current = ++revision.current;
    try {
      const [people, pending] = await Promise.all([listTeamCoaches(team.id), listTeamInvitations(team.id)]);
      if (alive.current && revision.current === current) { setMembers(people); setInvitations(pending); }
    } catch (reason) { if (alive.current && revision.current === current) { setError(teamError(reason)); setMembers([]); setInvitations([]); } }
    finally { if (alive.current && revision.current === current) setLoading(false); }
  }, [team.id, view]);
  // This fetch updates state only after the database requests resolve.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); }
    catch (reason) { if (alive.current) setError(teamError(reason)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  function createInvite() {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) { setError('Enter a valid coach email address.'); return; }
    void run(async () => {
      setIssued(null);
      if (!request.current || request.current.email !== address) request.current = { email: address, id: randomUUID(), code: (randomUUID() + randomUUID()).replaceAll('-', '') };
      const draft = request.current;
      await inviteCoach(team.id, draft.email, draft.id, draft.code);
      if (!alive.current) return;
      setIssued(draft); request.current = null; setEmail('');
      setNotice('Ready to share. Expires in 7 days.');
      await load();
    });
  }
  return <View style={s.section}>
    {view === 'settings' && <>
    <Text style={s.label}>Team name</Text>
    <TextInput accessibilityLabel="Edit team name" style={s.input} value={name} onChangeText={setName} editable={!busy} maxLength={80} />
    <Action primary disabled={busy || name.trim().length < 2} onPress={() => { void run(async () => { await renameTeam(team.id, name); await onChanged(); if (alive.current) setNotice('Team name saved.'); }); }}>Save team name</Action>
    </>}
    {view === 'invite' && <>
    <Text style={s.label}>Coach email</Text>
    <Text style={s.body}>This invitation works only for the email below.</Text>
    <TextInput accessibilityLabel="Coach email" style={s.input} value={email} onChangeText={setEmail} editable={!busy} keyboardType="email-address" autoCorrect={false} autoCapitalize="none" autoComplete="email" placeholder="coach@example.com" placeholderTextColor="#778397" />
    <Action primary disabled={busy} onPress={createInvite}>{busy ? 'Working…' : 'Create coach invitation'}</Action>
    {issued && <View style={s.box}>
      <Text style={s.label}>Invitation for {issued.email}</Text>
      <Text selectable style={s.code}>{issued.code}</Text>
      <Text style={s.body}>Save this code before leaving. You can issue a replacement later.</Text>
      <Action disabled={busy} onPress={() => { void run(async () => { await Share.share({ message: `You are invited to coach ${team.name} in Dugout Pilot. Sign in or create an account with ${issued.email}, confirm that email, then enter this code under Join a team:\n\n${issued.code}\n\nThis invitation expires in 7 days.` }); }); }}>Share invitation</Action>
      <Action onPress={() => setIssued(null)}>Hide code</Action>
    </View>}
    </>}
    <Message text={error} error /><Message text={notice} />
    {view === 'coaches' && <>
    <Text style={s.heading}>Team access</Text>
    {loading ? <ActivityIndicator color={palette.accent} /> : members.map(member => <View style={s.box} key={member.user_id}>
      <Text style={s.label}>{member.email}</Text><Text style={s.body}>{member.role === 'owner' ? 'Owner' : 'Coach'}</Text>
      {member.role === 'coach' && <Action danger disabled={busy} onPress={() => confirmAction('Remove coach?', `Remove ${member.email} from ${team.name}? Their account and other teams stay available.`, () => { void run(async () => { await removeTeamCoach(team.id, member.user_id); await load(); if (alive.current) setNotice('Coach access removed.'); }); })}>Remove coach</Action>}
    </View>)}
    <Text style={s.heading}>Recent invitations</Text>
    {!loading && !invitations.length && <Text style={s.body}>No invitations yet.</Text>}
    {invitations.map(invitation => <View key={invitation.id} style={s.box}>
      <Text style={s.label}>{invitation.email}</Text>
      <Text style={s.body}>{invitation.status} · Expires {new Date(invitation.expires_at).toLocaleDateString()}</Text>
      {invitation.status === 'pending' && <Action disabled={busy} onPress={() => confirmAction('Revoke invitation?', `The invitation for ${invitation.email} will stop working.`, () => { void run(async () => { await revokeCoachInvite(team.id, invitation.id); if (alive.current) setIssued(value => value?.id === invitation.id ? null : value); await load(); if (alive.current) setNotice('Invitation revoked.'); }); })}>Revoke invitation</Action>}
    </View>)}
    <Action disabled={busy || loading} onPress={() => { setLoading(true); setError(''); void load(); }}>Refresh team access</Action>
    </>}
  </View>;
}

export function ActivationPanel({ onChanged }: { onChanged: () => Promise<void> }) {
  const [teams, setTeams] = useState<ActivationTeam[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const inFlight = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const load = useCallback(async (target: number) => {
    try { const rows = await listActivationTeams(target); if (alive.current) { setTeams(rows); setPage(target); } }
    catch (reason) { if (alive.current) { setTeams([]); setError(teamError(reason)); } }
    finally { if (alive.current) setLoading(false); }
  }, []);
  // State updates happen after the server responds.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(0); }, [load]);
  function change(team: ActivationTeam) {
    confirmAction(team.test_access ? 'Remove test access?' : 'Enable test access?', `${team.name} will become ${team.test_access ? 'subject to its original trial dates' : 'active for testing'}. This does not create a subscription.`, () => {
      if (inFlight.current) return;
      inFlight.current = true; setBusy(true); setError(''); setNotice('');
      void (async () => {
        try { await setTeamTestAccess(team.id, !team.test_access); if (!alive.current) return; await load(page); await onChanged(); if (alive.current) setNotice(`Test access ${team.test_access ? 'removed' : 'enabled'} for ${team.name}.`); }
        catch (reason) { if (alive.current) setError(teamError(reason)); }
        finally { inFlight.current = false; if (alive.current) setBusy(false); }
      })();
    });
  }
  return <View style={s.section}>
    <Message text={error} error /><Message text={notice} />
    {loading ? <ActivityIndicator color={palette.accent} /> : teams.map(team => <View style={s.box} key={team.id}>
      <Text style={s.label}>{team.name}</Text><Text style={s.body}>{team.test_access ? 'Active · Test access' : team.activation_status}</Text>
      <Text selectable style={s.meta}>{team.id}</Text>
      {(team.test_access || ['pending', 'trial'].includes(team.activation_status)) && <Action disabled={busy} onPress={() => change(team)}>{team.test_access ? 'Remove test access' : 'Enable test access'}</Action>}
    </View>)}
    {!loading && !teams.length && <Text style={s.body}>No teams on this page.</Text>}
    <Text style={s.body}>Page {page + 1}</Text>
    <Action disabled={busy || loading || page === 0} onPress={() => { setLoading(true); setError(''); void load(page - 1); }}>Previous page</Action>
    <Action disabled={busy || loading || teams.length < 50} onPress={() => { setLoading(true); setError(''); void load(page + 1); }}>Next page</Action>
    <Action disabled={busy || loading} onPress={() => { setLoading(true); setError(''); void load(page); }}>Refresh activation list</Action>
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: palette.panel, borderRadius: 20, padding: 20, gap: 16 },
  section: { gap: 16 }, box: { padding: 18, gap: 12, backgroundColor: palette.raised, borderColor: palette.line, borderWidth: 1, borderRadius: 5 },
  heading: { color: palette.ink, fontSize: 22, fontWeight: '700' }, label: { color: palette.ink, fontSize: 16, fontWeight: '600' }, body: { color: palette.muted, fontSize: 16, lineHeight: 24 },
  primaryAction: { backgroundColor: palette.accent, borderColor: palette.accent }, primaryActionText: { color: palette.ink },
  action: { borderColor: palette.line, borderWidth: 1, borderRadius: 4, padding: 14, minHeight: 48, justifyContent: 'center' }, actionText: { color: palette.ink, fontWeight: '700', textAlign: 'center' }, disabled: { opacity: 0.5 },
  input: { backgroundColor: palette.canvas, borderColor: palette.line, borderWidth: 1, borderRadius: 5, padding: 14, fontSize: 16, color: palette.ink },
  error: { color: palette.error, lineHeight: 22 }, notice: { color: palette.accent, lineHeight: 22 }, code: { color: palette.ink, fontFamily: 'monospace', lineHeight: 22 }, meta: { color: '#8d9bb0', fontSize: 12 },
});
