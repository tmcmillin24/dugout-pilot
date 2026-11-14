import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/** iOS uses native-stack view-controller appearance instead of the legacy
 * UIApplication setter, which is a no-op on iOS 27. */
export function AppStatusBar() {
  return Platform.OS === 'ios' ? null : <StatusBar style="dark" />;
}
