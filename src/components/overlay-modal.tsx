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
    // Closed Modal children have no mounted Animated.View. Do not create a
    // native animation for every hidden selector/sheet during screen startup.
    if (!visible) {
      if (open) {
        // Mount first; the next effect runs after its animated view commits.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
      return;
    }
    if (reduceMotion) {
      opacity.setValue(open ? 1 : 0);
      if (!open) setVisible(false);
      return;
    }
    // Keep these short transitions on JS: native value callbacks can arrive
    // after iOS suspends/resumes the app and detaches their listeners.
    const animation = Animated.timing(opacity, {
      toValue: open ? 1 : 0,
      duration: open ? 200 : 160,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => { if (finished && !open) setVisible(false); });
    return () => animation.stop();
  }, [open, visible, opacity, reduceMotion]);
  return <Modal supportedOrientations={['portrait', 'portrait-upside-down', 'landscape-left', 'landscape-right']} visible={visible} transparent animationType="none" presentationStyle="overFullScreen" statusBarTranslucent onRequestClose={onClose}>
    <Animated.View pointerEvents={open ? 'auto' : 'none'} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'} style={[styles.frame, { opacity }]}>
      <FrozenContent frozen={!open}>{children}</FrozenContent>
    </Animated.View>
  </Modal>;
}
const styles = StyleSheet.create({ frame: { flex: 1 } });
