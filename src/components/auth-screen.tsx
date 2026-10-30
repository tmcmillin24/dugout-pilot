import { Image } from 'expo-image';
import { Icon, palette } from './app-ui';
import { useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const confirmationRef = useRef<ComponentRef<typeof TextInput>>(null);
  const signupBlocked = mode === 'signup' && (!confirmPassword || password !== confirmPassword);
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
    if (mode === 'signup' && (!confirmPassword || password !== confirmPassword)) {
      setFailed(true); setMessage('Passwords must match before creating your account.'); return;
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
          setConfirmPassword('');
          setShowPasswords(false);
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
          <View style={styles.card}>
            <Image source={require('@/assets/images/dugout-pilot-wordmark.jpeg')} contentFit="contain" accessibilityLabel="Dugout Pilot" style={styles.logo} />
            <Text style={styles.heading}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput accessibilityLabel="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} placeholder="coach@example.com" placeholderTextColor="#657C8E" />
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}><TextInput accessibilityLabel="Password" style={[styles.input, styles.passwordInput]} value={password} onChangeText={setPassword} secureTextEntry={!showPasswords} autoCapitalize="none" autoCorrect={false} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} editable={!busy} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} placeholderTextColor="#657C8E" onSubmitEditing={() => { if (mode === 'signup') confirmationRef.current?.focus(); else void submit(); }} returnKeyType={mode === 'signup' ? 'next' : 'go'} />
              <Pressable accessibilityRole="button" accessibilityLabel={`${showPasswords ? 'Hide' : 'Show'} ${mode === 'signup' ? 'both passwords' : 'password'}`} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => setShowPasswords(value => !value)} style={styles.eyeButton}><Icon name={showPasswords ? 'eyeOff' : 'eye'} color={palette.ink} size={22} /></Pressable>
            </View>
            {mode === 'signup' && <>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput ref={confirmationRef} accessibilityLabel="Confirm password" style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPasswords} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!busy} placeholder="Re-enter your password" placeholderTextColor="#657C8E" onSubmitEditing={() => { void submit(); }} returnKeyType="go" />
              {!!confirmPassword && password !== confirmPassword && <Text accessibilityLiveRegion="polite" style={[styles.message, styles.error]}>Passwords don’t match.</Text>}
            </>}
            {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, failed && styles.error]}>{message}</Text>}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || signupBlocked }} disabled={busy || signupBlocked} onPress={submit} style={[styles.button, (busy || signupBlocked) && styles.disabled]}>
              {busy ? <ActivityIndicator color={palette.ink} /> : <Text style={styles.buttonText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setPassword(''); setConfirmPassword(''); setShowPasswords(false); setMessage(''); setFailed(false); }} style={styles.switch}>
              <Text style={styles.switchText}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 }, page: { flex: 1, backgroundColor: palette.canvas },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 520, alignSelf: 'center' },
  card: { backgroundColor: palette.panel, borderRadius: 6, padding: 24, boxShadow: '0px 8px 26px rgba(0, 15, 29, 0.2)' },
  logo: { width: '100%', aspectRatio: 3, marginBottom: 24 },
  heading: { color: palette.cardInk, fontSize: 24, fontWeight: '800', marginBottom: 24, letterSpacing: -0.4 },
  label: { color: palette.cardInk, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  input: { color: palette.cardInk, backgroundColor: '#F2F6F9', borderColor: '#DCE6EE', borderWidth: 1, borderRadius: 4, padding: 14, fontSize: 16, marginBottom: 20 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F6F9', borderColor: '#DCE6EE', borderWidth: 1, borderRadius: 4, marginBottom: 20 },
  passwordInput: { flex: 1, minWidth: 0, borderWidth: 0, marginBottom: 0, backgroundColor: 'transparent' },
  eyeButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  message: { color: palette.cardInk, marginBottom: 16, lineHeight: 22 }, error: { color: '#B3261E' }, disabled: { opacity: 0.6 },
  button: { backgroundColor: palette.accent, borderRadius: 4, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: palette.ink, fontWeight: '800', fontSize: 16 },
  switch: { paddingTop: 22, paddingBottom: 4, alignItems: 'center' }, switchText: { color: '#AD3A0D', textAlign: 'center', fontWeight: '600', fontSize: 13 },
});
