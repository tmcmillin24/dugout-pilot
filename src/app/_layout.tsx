import { Stack, ThemeProvider, DarkTheme } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TeamProvider } from '@/providers/team-provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabaseConfigured } from '@/lib/supabase';
import AuthScreen from '@/components/auth-screen';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate() {
  const { session, loading, error, retry } = useAuth();
  useEffect(() => { void SplashScreen.hideAsync().catch(() => {}); }, []);
  if (!supabaseConfigured) return <View style={{ flex: 1, backgroundColor: '#0d1726', justifyContent: 'center', padding: 28 }}>
    <Text style={{ color: '#fff', fontSize: 22, marginBottom: 16 }}>Connect Dugout Pilot</Text>
    <Text style={{ color: '#dce5ef', lineHeight: 24 }}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your local .env file, then restart Expo.</Text>
  </View>;
  if (loading || error) return (
    <View style={{ flex: 1, backgroundColor: '#0d1726', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {loading ? <ActivityIndicator color="#a7db91" accessibilityLabel="Restoring session" /> : <>
        <Text style={{ color: '#fff', marginBottom: 16 }}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={retry}><Text style={{ color: '#a7db91', padding: 16 }}>Retry</Text></Pressable>
      </>}
    </View>
  );
  if (!session) return <AuthScreen />;
  return <TeamProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1421' } }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="team-create" options={{ presentation: 'modal' }} />
    <Stack.Screen name="team-join" options={{ presentation: 'modal' }} />
    <Stack.Screen name="team-manage" />
    <Stack.Screen name="admin" />
    <Stack.Screen name="team-settings" />
    <Stack.Screen name="team-coaches" />
    <Stack.Screen name="team-invite" options={{ presentation: 'modal' }} />
  </Stack></TeamProvider>;
}

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider value={DarkTheme}><StatusBar style="light" /><AuthProvider><AuthGate /></AuthProvider></ThemeProvider></SafeAreaProvider>;
}
