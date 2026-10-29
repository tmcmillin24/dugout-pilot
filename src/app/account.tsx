import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, MenuRow, Panel, Screen, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { useAuth } from '@/providers/auth-provider';
import { useTeams } from '@/providers/team-provider';
import { isSuperAdmin } from '@/lib/teams';
import { supabase } from '@/lib/supabase';

export default function AccountScreen() {
  const { session } = useAuth();
  const { teams, active } = useTeams();
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => { let alive = true; isSuperAdmin().then(value => { if (alive) setAdmin(value); }).catch(() => {}); return () => { alive = false; }; }, []);
  async function signOut() {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { const { error } = await supabase.auth.signOut({ scope: 'local' }); if (error) throw error; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not sign out. Try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function confirmSignOut() {
    if (Platform.OS === 'web') { if (window.confirm('Sign out of Dugout Pilot on this device?')) void signOut(); }
    else Alert.alert('Sign out?', 'Your teams and saved information will stay available when you sign back in.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', onPress: () => { void signOut(); } }]);
  }
  return <Screen title="Account" back>
    <Panel><View style={s.profile}><View style={s.avatar}><Icon name="account" size={32} color="#BC450F" /></View><View style={ui.flex}><Text style={s.email}>{session?.user.email}</Text><Text style={s.caption}>{teams.length} {teams.length === 1 ? 'team' : 'teams'} · {session?.user.email_confirmed_at ? 'Email confirmed' : 'Email confirmation pending'}</Text></View></View></Panel>
    <Section title="Workspace"><Panel><MenuRow icon="teams" title="Your teams" description={active ? `Selected: ${active.name}` : 'Create or join a team'} onPress={() => router.navigate('/teams')} />
      <MenuRow icon="link" title="Imports" onPress={() => router.navigate('/integrations')} />
      <MenuRow icon="shield" title="Team access" description="Roles and trial status" last />
    </Panel></Section>
    {admin && <Section title="Administration"><Panel><MenuRow icon="shield" title="Super Admin" description="Test access overrides for development teams" onPress={() => router.push('/admin')} last /></Panel></Section>}
    <StatusMessage text={error} error />
    <Button secondary disabled={busy} onPress={confirmSignOut}>{busy ? 'Signing out…' : 'Sign out'}</Button>
    <Text style={s.footer}>DUGOUT PILOT · VERSION 1.0</Text>
  </Screen>;
}
const s = StyleSheet.create({ profile: { flexDirection: 'row', gap: 16, alignItems: 'center', padding: 20 }, avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: palette.cardTint, justifyContent: 'center', alignItems: 'center' }, email: { color: palette.cardInk, fontSize: 16, fontWeight: '600' }, caption: { color: palette.cardMuted, fontSize: 12, marginTop: 8, lineHeight: 19 }, footer: { textAlign: 'center', color: palette.muted, letterSpacing: 1.4, fontSize: 10 } });
