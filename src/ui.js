import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C, F, R, S } from './theme';
import { rng } from './data';
import { META } from './imageMeta';

export const haptic = {
  tap: () => Haptics.selectionAsync().catch(() => {}),
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  firm: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  ok: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

const VARIANTS = {
  hero: { fontFamily: F.display, fontSize: 42, lineHeight: 44, letterSpacing: -1 },
  h1: { fontFamily: F.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  h2: { fontFamily: F.displayB, fontSize: 22, lineHeight: 27, letterSpacing: -0.3 },
  h3: { fontFamily: F.displayB, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 22 },
  bodyR: { fontFamily: F.bodyR, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: F.semi, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: F.body, fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: F.semi, fontSize: 11, lineHeight: 14 },
  num: { fontFamily: F.xbold, fontSize: 18, lineHeight: 22 },
};

export function T({ v = 'body', color = C.mist, style, children, ...rest }) {
  return (
    <Text {...rest} style={[VARIANTS[v], { color }, style]}>
      {children}
    </Text>
  );
}

const OUTER_KEYS = ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical', 'position', 'top', 'left', 'right', 'bottom', 'zIndex'];
function splitStyle(style) {
  const flat = StyleSheet.flatten(style) || {};
  const outer = {};
  const inner = {};
  Object.keys(flat).forEach((k) => {
    if (OUTER_KEYS.includes(k)) outer[k] = flat[k];
    else inner[k] = flat[k];
  });
  if (outer.flex || outer.flexGrow) inner.flexGrow = 1;
  return { outer, inner };
}

export function Pressy({ onPress, onPressIn, onPressOut, style, children, scaleTo = 0.96, disabled, hapticOn = true, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const { outer, inner } = splitStyle(style);
  return (
    <Pressable
      {...rest}
      style={outer}
      disabled={disabled}
      onPressIn={(e) => { to(scaleTo); onPressIn && onPressIn(e); }}
      onPressOut={(e) => { to(1); onPressOut && onPressOut(e); }}
      onPress={(e) => {
        if (hapticOn) haptic.tap();
        onPress && onPress(e);
      }}
    >
      <Animated.View style={[inner, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Btn({ title, onPress, icon, kind = 'primary', loading, disabled, style, small }) {
  const k = {
    primary: { bg: C.sand, fg: C.night, border: C.sand },
    lantern: { bg: C.lantern, fg: C.night, border: C.lantern },
    ghost: { bg: 'transparent', fg: C.mist, border: C.line },
    dark: { bg: C.dusk2, fg: C.mist, border: C.dusk2 },
    danger: { bg: 'transparent', fg: C.danger, border: '#5A2D45' },
  }[kind];
  return (
    <Pressy
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: k.bg, borderColor: k.border, opacity: disabled ? 0.45 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={k.fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={small ? 15 : 18} color={k.fg} style={{ marginRight: 8 }} /> : null}
          <T v="label" color={k.fg} style={{ fontFamily: F.bold, fontSize: small ? 13 : 15 }}>{title}</T>
        </>
      )}
    </Pressy>
  );
}

export function IconBtn({ name, onPress, style, color = C.mist, size = 20, badge }) {
  return (
    <Pressy onPress={onPress} style={[styles.iconBtn, style]}>
      <Feather name={name} size={size} color={color} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressy>
  );
}

export function useInsets() {
  return useSafeAreaInsets();
}

export function Header({ title, onBack, right, subtitle, transparent }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }, transparent && { position: 'absolute', left: 0, right: 0, zIndex: 20 }]}>
      {onBack ? <IconBtn name="chevron-left" onPress={onBack} size={22} /> : <View style={{ width: 44 }} />}
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
        {title ? <T v="h3" numberOfLines={1}>{title}</T> : null}
        {subtitle ? <T v="tiny" color={C.haze} numberOfLines={1} style={{ marginTop: 2 }}>{subtitle}</T> : null}
      </View>
      {right || <View style={{ width: 44 }} />}
    </View>
  );
}

export function Screen({ children, scroll = true, pad = true, style, contentStyle, bottomSpace = 30 }) {
  const insets = useSafeAreaInsets();
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: C.night }, style]}>{children}</View>;
  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: C.night }, style]}
      contentContainerStyle={[pad && { paddingHorizontal: S.l }, { paddingBottom: insets.bottom + bottomSpace }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Input({ label, icon, error, secure, style, right, ...rest }) {
  const [focus, setFocus] = useState(false);
  const [hide, setHide] = useState(!!secure);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: focus ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focus]);
  const border = a.interpolate({ inputRange: [0, 1], outputRange: [error ? C.danger : C.line, C.lantern] });
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <T v="label" color={C.haze} style={{ marginBottom: 7 }}>{label}</T> : null}
      <Animated.View style={[styles.input, { borderColor: border }]}>
        {icon ? <Feather name={icon} size={18} color={focus ? C.lantern : C.fog} style={{ marginRight: 10 }} /> : null}
        <TextInput
          placeholderTextColor={C.fog}
          selectionColor={C.lantern}
          // Passwords must be typed exactly: no auto-capital, auto-correct or trailing spaces from the keyboard.
          {...(secure ? { autoCapitalize: 'none', autoCorrect: false, spellCheck: false } : null)}
          {...rest}
          secureTextEntry={hide}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={styles.inputText}
        />
        {secure ? (
          <Pressable onPress={() => setHide((h) => !h)} hitSlop={10}>
            <Feather name={hide ? 'eye' : 'eye-off'} size={18} color={C.haze} />
          </Pressable>
        ) : right}
      </Animated.View>
      {error ? <T v="small" color={C.danger} style={{ marginTop: 6 }}>{error}</T> : null}
    </View>
  );
}

export function Chip({ label, active, onPress, icon, style }) {
  return (
    <Pressy onPress={onPress} style={[styles.chip, active && styles.chipOn, style]}>
      {icon ? <Feather name={icon} size={14} color={active ? C.night : C.haze} style={{ marginRight: 6 }} /> : null}
      <T v="label" color={active ? C.night : C.mist}>{label}</T>
    </Pressy>
  );
}

// Segmented control with a sliding lantern pill.
export function Segmented({ options, value, onChange, style }) {
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const x = useRef(new Animated.Value(idx)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: idx, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
  }, [idx]);
  const segW = w / options.length;
  return (
    <View style={[styles.seg, style]} onLayout={(e) => setW(e.nativeEvent.layout.width - 8)}>
      {w > 0 ? (
        <Animated.View
          style={[styles.segPill, { width: segW, transform: [{ translateX: x.interpolate({ inputRange: [0, Math.max(1, options.length - 1)], outputRange: [0, segW * Math.max(1, options.length - 1)] }) }] }]}
        />
      ) : null}
      {options.map((o) => (
        <Pressable key={o.id} style={styles.segItem} onPress={() => { haptic.tap(); onChange(o.id); }}>
          <T v="label" color={o.id === value ? C.night : C.haze} style={{ fontFamily: F.bold }}>{o.label}</T>
        </Pressable>
      ))}
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 9 }) {
  return (
    <View style={styles.stepper}>
      <Pressy onPress={() => value > min && onChange(value - 1)} style={styles.stepBtn}>
        <Feather name="minus" size={16} color={value > min ? C.mist : C.fog} />
      </Pressy>
      <T v="num" style={{ width: 30, textAlign: 'center' }}>{value}</T>
      <Pressy onPress={() => value < max && onChange(value + 1)} style={styles.stepBtn}>
        <Feather name="plus" size={16} color={value < max ? C.mist : C.fog} />
      </Pressy>
    </View>
  );
}

// Brand mark: an arched gateway over a horizon with the pool-light sun.
export function Logo({ size = 64, color = C.sand, sun = C.lagoon }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M15 54 V30 A17 17 0 0 1 49 30 V54" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M24 54 V33 A8 8 0 0 1 40 33 V54" stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.55} />
      <Circle cx={32} cy={44} r={5} fill={sun} />
      <Path d="M8 55 H56" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function Stars({ value, size = 12 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Feather name="star" size={size} color={C.lantern} />
      <T v="tiny" color={C.mist} style={{ marginLeft: 4 }}>{value.toFixed(1)}</T>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style, between, center = true }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: center ? 'center' : 'flex-start' }, between && { justifyContent: 'space-between' }, style]}>
      {children}
    </View>
  );
}

// Perforated ticket edge.
export function Perforation({ color = C.night }) {
  return (
    <View style={styles.perf}>
      <View style={[styles.notch, { left: -12, backgroundColor: color }]} />
      <View style={styles.dashes}>
        {Array.from({ length: 22 }).map((_, i) => <View key={i} style={styles.dash} />)}
      </View>
      <View style={[styles.notch, { right: -12, backgroundColor: color }]} />
    </View>
  );
}

// Deterministic QR-style code drawn with SVG (visual only).
export function QR({ value = 'TRAVORA', size = 150, color = C.night }) {
  const n = 25;
  const cell = size / n;
  const r = rng(value);
  const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const rects = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (r() > 0.52) rects.push(<Rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell + 0.3} height={cell + 0.3} fill={color} />);
    }
  }
  const fp = (ox, oy) => (
    <React.Fragment key={`f${ox}${oy}`}>
      <Rect x={ox * cell} y={oy * cell} width={7 * cell} height={7 * cell} fill={color} rx={cell} />
      <Rect x={(ox + 1) * cell} y={(oy + 1) * cell} width={5 * cell} height={5 * cell} fill="#fff" rx={cell * 0.6} />
      <Rect x={(ox + 2) * cell} y={(oy + 2) * cell} width={3 * cell} height={3 * cell} fill={color} rx={cell * 0.4} />
    </React.Fragment>
  );
  return (
    <Svg width={size} height={size}>
      {rects}
      {fp(0, 0)}{fp(n - 7, 0)}{fp(0, n - 7)}
    </Svg>
  );
}


// Photo: an image that fills its box and keeps the subject (the bed, the seats) in frame.
// React Native sizes a require()'d image to its pixel dimensions by default, and absolute
// edges alone don't override that, so we size and position the image explicitly instead.
export function Photo({ source, style, focus, children, imageStyle, onLoad }) {
  const [box, setBox] = useState(null);
  const m = META.get(source) || { r: 1.4, fx: 0.5, fy: 0.5 };
  const fx = focus?.x ?? m.fx;
  const fy = focus?.y ?? m.fy;
  let img = null;
  if (box && box.width > 0 && box.height > 0) {
    const W = box.width;
    const H = box.height;
    let w;
    let h;
    if (W / H > m.r) { w = W; h = W / m.r; } else { h = H; w = H * m.r; }
    const left = Math.min(0, Math.max(W - w, W / 2 - fx * w));
    const top = Math.min(0, Math.max(H - h, H / 2 - fy * h));
    img = <Image source={source} onLoad={onLoad} style={[{ position: 'absolute', left, top, width: w, height: h }, imageStyle]} resizeMode="cover" />;
  }
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: C.dusk }, style]} onLayout={(e) => setBox(e.nativeEvent.layout)}>
      {img}
      {children}
    </View>
  );
}

// Full-bleed background style for images that sit under content.
export const FILL = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' };

export function ArchImage({ source, style, height = 220, children, radius = R.arch, focus }) {
  return (
    <Photo source={source} focus={focus} style={[{ height, borderTopLeftRadius: radius, borderTopRightRadius: radius, borderBottomLeftRadius: R.m, borderBottomRightRadius: R.m }, style]}>
      {children}
    </Photo>
  );
}

export function Fade({ colors = ['transparent', C.night], style, locations }) {
  return <LinearGradient pointerEvents="none" colors={colors} locations={locations} style={[StyleSheet.absoluteFill, style]} />;
}

// Mount-time rise for a single orchestrated group; pass delay to stagger.
export function Rise({ delay = 0, children, style, distance = 24 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 620, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export function Empty({ icon, title, body, action, onAction }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 }}>
      <View style={styles.emptyIcon}><Feather name={icon} size={26} color={C.sand} /></View>
      <T v="h3" style={{ marginTop: 16, textAlign: 'center' }}>{title}</T>
      <T v="small" color={C.haze} style={{ marginTop: 6, textAlign: 'center' }}>{body}</T>
      {action ? <Btn title={action} onPress={onAction} small style={{ marginTop: 18, paddingHorizontal: 22 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { height: 54, borderRadius: R.m, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnSmall: { height: 40, borderRadius: R.s },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(21,28,64,0.78)', borderWidth: 1, borderColor: 'rgba(235,210,166,0.14)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: C.lantern, borderWidth: 1.5, borderColor: C.dusk },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.m, paddingBottom: 10 },
  input: { height: 54, borderRadius: R.s, borderWidth: 1.5, backgroundColor: C.dusk, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  inputText: { flex: 1, color: C.mist, fontFamily: F.semi, fontSize: 15, height: '100%' },
  chip: { flexDirection: 'row', alignItems: 'center', height: 38, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.dusk, marginRight: 8 },
  chipOn: { backgroundColor: C.sand, borderColor: C.sand },
  seg: { flexDirection: 'row', backgroundColor: 'rgba(21,28,64,0.85)', borderRadius: R.pill, padding: 4, borderWidth: 1, borderColor: 'rgba(235,210,166,0.14)' },
  segPill: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: R.pill, backgroundColor: C.lantern },
  segItem: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.dusk, borderRadius: R.m, padding: S.m, borderWidth: 1, borderColor: 'rgba(44,54,112,0.7)' },
  perf: { height: 24, justifyContent: 'center' },
  notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12 },
  dashes: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 18 },
  dash: { width: 6, height: 2, borderRadius: 1, backgroundColor: 'rgba(11,16,40,0.25)' },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.dusk, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
});
