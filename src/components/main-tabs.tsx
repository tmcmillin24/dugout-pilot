import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, palette } from './app-ui';

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown: false, sceneStyle: { backgroundColor: palette.canvas },
    tabBarStyle: { backgroundColor: palette.panel, borderTopColor: palette.line, borderTopWidth: 1, height: 66 + Math.max(insets.bottom, 10), paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) },
    tabBarActiveTintColor: palette.ink, tabBarInactiveTintColor: palette.muted,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 4 }, tabBarHideOnKeyboard: true,
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <View style={{ alignItems: 'center', gap: 5 }}><View style={{ width: 20, height: 3, backgroundColor: focused ? palette.accent : 'transparent' }} /><Icon name="home" color={color} /></View> }} />
    <Tabs.Screen name="teams" options={{ title: 'Teams', tabBarIcon: ({ color, focused }) => <View style={{ alignItems: 'center', gap: 5 }}><View style={{ width: 20, height: 3, backgroundColor: focused ? palette.accent : 'transparent' }} /><Icon name="teams" color={color} /></View> }} />
    <Tabs.Screen name="integrations" options={{ title: 'Integrations', tabBarIcon: ({ color, focused }) => <View style={{ alignItems: 'center', gap: 5 }}><View style={{ width: 20, height: 3, backgroundColor: focused ? palette.accent : 'transparent' }} /><Icon name="link" color={color} /></View> }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, focused }) => <View style={{ alignItems: 'center', gap: 5 }}><View style={{ width: 20, height: 3, backgroundColor: focused ? palette.accent : 'transparent' }} /><Icon name="account" color={color} /></View> }} />
  </Tabs>;
}
