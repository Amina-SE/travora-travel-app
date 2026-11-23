import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { C, R, SCREEN_H } from './theme';
import { useInsets } from './ui';

// Bottom sheet with drag-to-dismiss.
export function Sheet({ visible, onClose, children, maxHeight = SCREEN_H * 0.86 }) {
  const insets = useInsets();
  const [mounted, setMounted] = useState(visible);
  const a = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      Animated.spring(a, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 200 }).start();
    } else if (mounted) {
      Animated.timing(a, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 1.1) closeRef.current && closeRef.current();
        else Animated.spring(drag, { toValue: 0, useNativeDriver: true, damping: 18 }).start();
      },
    })
  ).current;

  if (!mounted) return null;
  const ty = Animated.add(a.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.7, 0] }), drag);
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { maxHeight, paddingBottom: insets.bottom + 18, transform: [{ translateY: ty }] }]}>
        <View {...pan.panHandlers} style={styles.grabZone}>
          <View style={styles.grab} />
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(5,8,22,0.66)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.dusk, borderTopLeftRadius: R.l, borderTopRightRadius: R.l, paddingHorizontal: 20, borderTopWidth: 1, borderColor: 'rgba(235,210,166,0.16)' },
  grabZone: { paddingTop: 10, paddingBottom: 12, alignItems: 'center' },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: C.line },
});
