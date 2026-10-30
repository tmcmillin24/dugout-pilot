import { Image } from 'expo-image';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { launchLogoWidth } from '@/lib/launch-layout';

export function BrandLoading() {
  const {width,height}=useWindowDimensions();
  const logoWidth=launchLogoWidth(width,height,Platform.OS==='ios'&&Platform.isPad);
  return <View accessibilityLabel="Loading Dugout Pilot" accessibilityRole="progressbar" style={styles.screen}>
    <Image source={require('@/assets/images/dugout-launch.png')} contentFit="contain" style={[styles.logo,{width:logoWidth}]} accessibilityLabel="Dugout Pilot. Navigate your way through the game." />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  // Match the responsive native storyboard constraints.
  logo: { maxWidth: '100%', aspectRatio: 672 / 172 },
});
