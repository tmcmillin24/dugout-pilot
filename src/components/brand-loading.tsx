import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function BrandLoading() {
  return <View accessibilityLabel="Loading Dugout Pilot" accessibilityRole="progressbar" style={styles.screen}>
    <Image source={require('@/assets/images/dugout-launch.png')} contentFit="contain" style={styles.logo} accessibilityLabel="Dugout Pilot. Navigate your way through the game." />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  logo: { width: '85%', maxWidth: 480, aspectRatio: 672 / 172 },
});
