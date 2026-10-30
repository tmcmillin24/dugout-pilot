import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { SportsTypeProvider } from '@/components/sports-type';
import { Stack, ThemeProvider, DefaultTheme } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Pressable, Text, View } from 'react-native';
import { AppStatusBar } from '@/components/app-status-bar';
import { RulesAssistantProvider } from '@/providers/rules-assistant-provider';
import { RulesChat } from '@/components/rules-chat';
import { CoachingProvider } from '@/providers/coaching-provider';
import { TeamProvider } from '@/providers/team-provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabaseConfigured } from '@/lib/supabase';
import { BrandLoading } from '@/components/brand-loading';
import AuthScreen from '@/components/auth-screen';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate() {
  const { session, loading, error, retry } = useAuth();
  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync().catch(() => {});
  }, [loading]);
  if (!supabaseConfigured) return <View style={{ flex: 1, backgroundColor: '#F1F3F5', justifyContent: 'center', padding: 28 }}>
    <Text style={{ color: '#082E4B', fontSize: 22, marginBottom: 16 }}>Connect Dugout Pilot</Text>
    <Text style={{ color: '#dce5ef', lineHeight: 24 }}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your local .env file, then restart Expo.</Text>
  </View>;
  if (loading) return <BrandLoading />;
  if (error) return (
    <View style={{ flex: 1, backgroundColor: '#F1F3F5', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <>
        <Text style={{ color: '#082E4B', marginBottom: 16 }}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={retry}><Text style={{ color: '#F45C1B', padding: 16 }}>Retry</Text></Pressable>
      </>
    </View>
  );
  if (!session) return <AuthScreen />;
  return <TeamProvider><CoachingProvider><RulesAssistantProvider><Stack screenOptions={{ headerShown: false, statusBarStyle: 'dark', contentStyle: { backgroundColor: '#F1F3F5' } }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="team-create" options={{ presentation: 'modal' }} />
    <Stack.Screen name="team-join" options={{ presentation: 'modal' }} />
    <Stack.Screen name="team-manage" />
    <Stack.Screen name="admin" />
    <Stack.Screen name="roster" />
    <Stack.Screen name="account" />
    <Stack.Screen name="team-stats" />
    <Stack.Screen name="rules" />
    <Stack.Screen name="team-settings" />
    <Stack.Screen name="team-coaches" />
    <Stack.Screen name="team-invite" options={{ presentation: 'modal' }} />
  </Stack><RulesChat /></RulesAssistantProvider></CoachingProvider></TeamProvider>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ DugoutDisplay: require('@expo-google-fonts/barlow-condensed/800ExtraBold/BarlowCondensed_800ExtraBold.ttf'), DugoutDisplayItalic: require('@expo-google-fonts/barlow-condensed/800ExtraBold_Italic/BarlowCondensed_800ExtraBold_Italic.ttf') });
  if (!fontsLoaded && !fontError) return <BrandLoading />;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><ThemeProvider value={DefaultTheme}><SportsTypeProvider ready={fontsLoaded}><AppStatusBar /><AuthProvider><AuthGate /></AuthProvider></SportsTypeProvider></ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}
