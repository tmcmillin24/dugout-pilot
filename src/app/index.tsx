import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign out. Try again.');
    } finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.brand}>DUGOUT PILOT</Text>
    <Text style={styles.title}>Welcome to your dugout.</Text>
    <Text style={styles.body}>Signed in as {session?.user.email}</Text>
    <Text style={styles.card}>Your account is ready. Team creation, coach invitations, and the Thundercats game-management features are the next development phase.</Text>
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={signOut} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0d1726' },
  content: { padding: 28, gap: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },
  brand: { color: '#a7db91', letterSpacing: 3, fontWeight: '800' },
  title: { color: '#fff', fontSize: 34, fontWeight: '800' },
  body: { color: '#b2bfd0', fontSize: 16 },
  card: { color: '#dce5ef', backgroundColor: '#172438', padding: 24, borderRadius: 20, fontSize: 17, lineHeight: 26 },
  error: { color: '#ffb4ab' }, button: { padding: 16, borderColor: '#a7db91', borderWidth: 1, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#a7db91', fontWeight: '700' },
});
