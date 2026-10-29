import { memo, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet } from 'react-native';

// Keep the last open frame intact while the overlay leaves. Callers often clear
// their selected item immediately on close; rendering that empty state flashes.
const FrozenContent = memo(function FrozenContent({ children }: { children: ReactNode; frozen: boolean }) {
  return <>{children}</>;
}, (_previous, next) => next.frozen);

export function OverlayModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const [visible, setVisible] = useState(open);
  const [opacity] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (open) {
      // The native window must remain present until our exit animation finishes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
    const animation = Animated.timing(opacity, {
      toValue: open ? 1 : 0,
      duration: reduceMotion ? 0 : open ? 200 : 160,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished && !open) setVisible(false); });
    return () => animation.stop();
  }, [open, opacity, reduceMotion]);
  return <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape-left', 'landscape-right']} visible={visible} transparent animationType="none" presentationStyle="overFullScreen" statusBarTranslucent onRequestClose={onClose}>
    <Animated.View pointerEvents={open ? 'auto' : 'none'} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'} style={[styles.frame, { opacity }]}>
      <FrozenContent frozen={!open}>{children}</FrozenContent>
    </Animated.View>
  </Modal>;
}
const styles = StyleSheet.create({ frame: { flex: 1 } });
