// Cabin walk-through: stand inside the cabin, drag to look around, tap the glowing points,
// "walk forward" to the next view, then jump straight to choosing seats.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { C, F, R, SCREEN_H, SCREEN_W, money } from '../theme';
import { CLASSES } from '../data';
import { META } from '../imageMeta';
import { WALK } from '../walkData';
import { Btn, IconBtn, Row, Segmented, T, haptic, useInsets } from '../ui';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const MODE_LABEL = { flight: 'Flight cabin', bus: 'Coach', train: 'Train' };

export default function WalkthroughScreen({ nav, params }) {
  const { mode, onPick, price } = params;
  const insets = useInsets();
  const classes = CLASSES[mode];
  const [cls, setCls] = useState(params.cls || classes[0].id);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [spot, setSpot] = useState(null);
  const scenes = WALK[mode][cls] || WALK[mode][classes[0].id];
  const scene = scenes[Math.min(sceneIdx, scenes.length - 1)];
  const clsInfo = classes.find((c) => c.id === cls);

  // Size the photo so it covers the screen with room to look around.
  const m = META.get(scene.img) || { r: 0.8, fx: 0.5, fy: 0.55 };
  let imgW = Math.max(SCREEN_W * 1.45, SCREEN_H * 1.04 * m.r);
  let imgH = imgW / m.r;
  if (imgH < SCREEN_H * 1.04) { imgH = SCREEN_H * 1.04; imgW = imgH * m.r; }
  const minX = -(imgW - SCREEN_W);
  const minY = -(imgH - SCREEN_H);
  const startX = clamp(SCREEN_W / 2 - m.fx * imgW, minX, 0);
  const startY = clamp(SCREEN_H * 0.42 - m.fy * imgH, minY, 0);

  const px = useRef(new Animated.Value(startX)).current;
  const py = useRef(new Animated.Value(startY)).current;
  const zoom = useRef(new Animated.Value(0)).current; // 0 = arriving, 1 = settled, 2 = walking forward
  const pulse = useRef(new Animated.Value(0)).current;
  const cur = useRef({ x: startX, y: startY, sx: 0, sy: 0 });
  const bounds = useRef({});
  bounds.current = { minX, minY };

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  // Arrive in a scene: camera eases in from wide and pans onto the subject.
  const arrive = () => {
    zoom.setValue(0);
    const fromX = clamp(startX + SCREEN_W * 0.3, minX, 0);
    px.setValue(fromX);
    py.setValue(startY);
    cur.current = { ...cur.current, x: startX, y: startY };
    Animated.parallel([
      Animated.timing(zoom, { toValue: 1, duration: 1300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(px, { toValue: startX, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };
  useEffect(arrive, [cls, sceneIdx]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        px.stopAnimation((v) => { cur.current.x = v; });
        py.stopAnimation((v) => { cur.current.y = v; });
        cur.current.sx = cur.current.x;
        cur.current.sy = cur.current.y;
        setSpot(null);
      },
      onPanResponderMove: (_, g) => {
        const { minX: mx, minY: my } = bounds.current;
        let x = cur.current.sx + g.dx;
        let y = cur.current.sy + g.dy;
        if (x > 0) x *= 0.3;
        if (x < mx) x = mx + (x - mx) * 0.3;
        if (y > 0) y *= 0.3;
        if (y < my) y = my + (y - my) * 0.3;
        cur.current.x = x;
        cur.current.y = y;
        px.setValue(x);
        py.setValue(y);
      },
      onPanResponderRelease: (_, g) => {
        const { minX: mx, minY: my } = bounds.current;
        const tx = clamp(cur.current.x + g.vx * 220, mx, 0);
        const ty = clamp(cur.current.y + g.vy * 220, my, 0);
        cur.current.x = tx;
        cur.current.y = ty;
        Animated.spring(px, { toValue: tx, useNativeDriver: true, damping: 24, stiffness: 80 }).start();
        Animated.spring(py, { toValue: ty, useNativeDriver: true, damping: 24, stiffness: 80 }).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Walk forward: push into the photo, then arrive in the next view.
  const walk = (target) => {
    haptic.soft();
    setSpot(null);
    Animated.timing(zoom, { toValue: 2, duration: 520, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setSceneIdx(target);
    });
  };

  const changeClass = (id) => {
    if (id === cls) return;
    Animated.timing(zoom, { toValue: 2, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setSceneIdx(0);
      setCls(id);
    });
  };

  const chooseSeats = () => {
    haptic.ok();
    if (params.then === 'search') {
      nav.replace('Search', { mode, cls }, { transition: 'slide' });
    } else {
      if (onPick) onPick(cls);
      nav.pop();
    }
  };

  const scale = zoom.interpolate({ inputRange: [0, 1, 2], outputRange: [1.28, 1.06, 1.6] });
  const fade = zoom.interpolate({ inputRange: [0, 0.35, 1, 1.6, 2], outputRange: [0, 1, 1, 0.6, 0] });
  const ring = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });
  const ringO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
  const last = sceneIdx >= scenes.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
        <Animated.View style={{ width: imgW, height: imgH, opacity: fade, transform: [{ translateX: px }, { translateY: py }, { scale }] }}>
          <Image source={scene.img} style={{ width: imgW, height: imgH }} resizeMode="cover" />
          {scene.spots.map((h, i) => (
            <Pressable key={`${cls}-${sceneIdx}-${i}`} onPress={() => { haptic.soft(); setSpot(spot === i ? null : i); }} style={[styles.spot, { left: h.x * imgW - 22, top: h.y * imgH - 22 }]} hitSlop={8}>
              <Animated.View style={[styles.spotRing, { opacity: ringO, transform: [{ scale: ring }] }]} />
              <View style={[styles.spotDot, spot === i && { backgroundColor: C.lantern }]}>
                <Feather name={spot === i ? 'x' : 'plus'} size={13} color={C.night} />
              </View>
              {spot === i ? (
                <View style={[styles.bubble, h.x > 0.6 ? { right: 30 } : { left: 30 }]}>
                  <T v="small" color={C.mist} style={{ fontFamily: F.bold }}>{h.label}</T>
                </View>
              ) : null}
            </Pressable>
          ))}
        </Animated.View>
        <LinearGradient pointerEvents="none" colors={['rgba(11,16,40,0.8)', 'transparent', 'transparent', 'rgba(11,16,40,0.92)']} locations={[0, 0.22, 0.55, 1]} style={StyleSheet.absoluteFill} />
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 6, paddingHorizontal: 16 }}>
        <Row between>
          <IconBtn name="chevron-left" size={22} onPress={() => nav.pop()} />
          <View style={styles.hint}>
            <MaterialCommunityIcons name="gesture-swipe" size={15} color={C.sand} />
            <T v="tiny" color={C.mist} style={{ marginLeft: 6 }}>Drag to look around</T>
          </View>
          <View style={styles.counter}><T v="label" color={C.mist} style={{ fontFamily: F.bold }}>{sceneIdx + 1}/{scenes.length}</T></View>
        </Row>
        <Segmented options={classes} value={cls} onChange={changeClass} style={{ marginTop: 12 }} />
      </View>

      <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
        <Row between center={false}>
          <View style={{ flex: 1 }}>
            <T v="tiny" color={C.lagoon}>{MODE_LABEL[mode]}, {clsInfo.label}</T>
            <T v="h2" style={{ marginTop: 2 }}>{scene.title}</T>
          </View>
          {price ? (
            <View style={{ alignItems: 'flex-end' }}>
              <T v="h3" color={C.sand}>{money(price * clsInfo.mult)}</T>
              <T v="tiny" color={C.haze}>per seat</T>
            </View>
          ) : null}
        </Row>
        <T v="small" color={C.haze} style={{ marginTop: 6 }}>{clsInfo.blurb}. Tap the glowing points to explore.</T>
        <Row style={{ marginTop: 12 }}>
          {scenes.map((_, i) => (
            <Pressable key={i} onPress={() => i !== sceneIdx && walk(i)} hitSlop={6}>
              <View style={[styles.sceneDot, i === sceneIdx && styles.sceneDotOn]} />
            </Pressable>
          ))}
        </Row>
        <Row style={{ marginTop: 14 }}>
          {scenes.length > 1 ? (
            <Btn kind="ghost" icon={last ? 'rotate-ccw' : 'arrow-up'} title={last ? 'Back to start' : 'Walk forward'} onPress={() => walk(last ? 0 : sceneIdx + 1)} style={{ flex: 1, marginRight: 10 }} />
          ) : null}
          <Btn title={params.pickLabel ? `${params.pickLabel} ${clsInfo.label}` : `Choose ${clsInfo.label} seats`} onPress={chooseSeats} style={{ flex: 1.3 }} />
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(11,16,40,0.7)', borderRadius: R.pill, paddingHorizontal: 12, height: 32 },
  counter: { minWidth: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(21,28,64,0.8)', alignItems: 'center', justifyContent: 'center' },
  spot: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  spotRing: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.sand },
  spotDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', top: 2, width: 200, padding: 10, borderRadius: 12, backgroundColor: 'rgba(11,16,40,0.92)', borderWidth: 1, borderColor: 'rgba(235,210,166,0.35)' },
  card: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 18, backgroundColor: 'rgba(11,16,40,0.95)', borderTopLeftRadius: R.l, borderTopRightRadius: R.l, borderTopWidth: 1, borderColor: 'rgba(235,210,166,0.16)' },
  sceneDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line, marginRight: 6 },
  sceneDotOn: { width: 24, backgroundColor: C.lantern },
});
