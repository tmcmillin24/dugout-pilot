import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, palette } from './app-ui';

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown: false, sceneStyle: { backgroundColor: palette.canvas },
    tabBarStyle: { backgroundColor: '#101D2C', borderTopColor: palette.line, borderTopWidth: 1, height: 66 + Math.max(insets.bottom, 10), paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) },
    tabBarActiveTintColor: palette.accent, tabBarInactiveTintColor: palette.muted,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 4 }, tabBarHideOnKeyboard: true,
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }} />
    <Tabs.Screen name="teams" options={{ title: 'Teams', tabBarIcon: ({ color }) => <Icon name="teams" color={color} /> }} />
    <Tabs.Screen name="integrations" options={{ title: 'Integrations', tabBarIcon: ({ color }) => <Icon name="link" color={color} /> }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <Icon name="account" color={color} /> }} />
  </Tabs>;
}
