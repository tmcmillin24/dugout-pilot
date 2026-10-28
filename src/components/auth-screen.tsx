import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  async function submit() {
    if (busy) return;
    setMessage('');
    setFailed(false);
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || !password) {
      setFailed(true); setMessage('Enter a valid email address and your password.'); return;
    }
    if (mode === 'signup' && password.length < 8) {
      setFailed(true); setMessage('Use a password with at least 8 characters.'); return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: address, password });
        if (error) throw error;
        if (!data.session) {
          setPassword('');
          setMode('signin');
          setMessage('Check your email to confirm your account, then return here to sign in.');
        }
      }
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Unable to connect. Please try again.');
    } finally { setBusy(false); }
  }
  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>DUGOUT PILOT</Text>
          <Text style={styles.title}>Ready for the next inning.</Text>
          <Text style={styles.subtitle}>Your team. Your plan. Your dugout.</Text>
          <View style={styles.card}>
            <Text style={styles.heading}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput accessibilityLabel="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} placeholder="coach@example.com" placeholderTextColor="#778397" />
            <Text style={styles.label}>Password</Text>
            <TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} editable={!busy} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} placeholderTextColor="#778397" onSubmitEditing={submit} returnKeyType="go" />
            {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, failed && styles.error]}>{message}</Text>}
            <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={[styles.button, busy && styles.disabled]}>
              {busy ? <ActivityIndicator color="#10251c" /> : <Text style={styles.buttonText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setPassword(''); setMessage(''); setFailed(false); }} style={styles.switch}>
              <Text style={styles.switchText}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 }, page: { flex: 1, backgroundColor: '#0d1726' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 520, alignSelf: 'center' },
  eyebrow: { color: '#a7db91', fontWeight: '800', letterSpacing: 3, marginBottom: 20 },
  title: { color: '#fff', fontSize: 38, fontWeight: '800', lineHeight: 44 },
  subtitle: { color: '#b2bfd0', fontSize: 17, marginTop: 12, marginBottom: 32 },
  card: { backgroundColor: '#172438', borderRadius: 24, padding: 24 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  label: { color: '#dce5ef', marginBottom: 8, fontWeight: '600' },
  input: { color: '#fff', backgroundColor: '#0d1726', borderColor: '#40506a', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20 },
  message: { color: '#b9e9a8', marginBottom: 16, lineHeight: 22 },
  error: { color: '#ffb4ab' }, disabled: { opacity: 0.6 },
  button: { backgroundColor: '#a7db91', borderRadius: 12, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#10251c', fontWeight: '800', fontSize: 16 },
  switch: { paddingVertical: 20, alignItems: 'center' }, switchText: { color: '#dce5ef', textAlign: 'center' },
});
