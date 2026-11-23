import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { C, F, R, SCREEN_H, SCREEN_W } from '../theme';
import { IMG } from '../data';
import { Btn, Pressy, Row, T, haptic, useInsets } from '../ui';
import { useStore } from '../store';

const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);

export function SplashScreen({ nav }) {
  const store = useStore();
  const draw = useRef(new Animated.Value(0)).current; // svg stroke, JS driver
  const word = useRef(new Animated.Value(0)).current;
  const sun = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;
  const done = useRef(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(draw, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(sun, { toValue: 1, duration: 650, easing: Easing.out(Easing.back(1.6)), useNativeDriver: false }),
        Animated.timing(word, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(450),
    ]).start(() => setAnimDone(true));
  }, []);

  useEffect(() => {
    if (!animDone || !store.ready || done.current) return;
    done.current = true;
    Animated.timing(out, { toValue: 1, duration: 380, useNativeDriver: true }).start(() => {
      // Intro slides play on every launch. Only someone who chose "Keep me signed in"
      // (a restored session) goes straight to the app.
      if (!store.user) nav.reset('Onboarding');
      else nav.reset('Main');
    });
  }, [animDone, store.ready]);

  const archLen = 120;
  const dash = draw.interpolate({ inputRange: [0, 1], outputRange: [archLen, 0] });
  const lineDash = draw.interpolate({ inputRange: [0, 0.6, 1], outputRange: [50, 50, 0] });
  const sunY = sun.interpolate({ inputRange: [0, 1], outputRange: [58, 44] });
  const sunR = sun.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  const letters = 'Travora'.split('');

  return (
    <Animated.View style={[styles.splash, { opacity: out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: out.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>
      <LinearGradient colors={['#0B1028', '#151C40', '#2B2F6A']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.glowOrb} />
      <Svg width={128} height={128} viewBox="0 0 64 64">
        <APath d="M15 54 V30 A17 17 0 0 1 49 30 V54" stroke={C.sand} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={`${archLen}`} strokeDashoffset={dash} />
        <APath d="M8 55 H56" stroke={C.sand} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="50" strokeDashoffset={lineDash} />
        <ACircle cx={32} cy={sunY} r={sunR} fill={C.lagoon} />
      </Svg>
      <Row style={{ marginTop: 18 }}>
        {letters.map((l, i) => (
          <Animated.Text
            key={i}
            style={{
              fontFamily: F.display,
              fontSize: 40,
              color: C.mist,
              letterSpacing: 1,
              opacity: word.interpolate({ inputRange: [i / 10, Math.min(1, i / 10 + 0.4)], outputRange: [0, 1], extrapolate: 'clamp' }),
              transform: [{ translateY: word.interpolate({ inputRange: [i / 10, Math.min(1, i / 10 + 0.4)], outputRange: [22, 0], extrapolate: 'clamp' }) }],
            }}
          >
            {l}
          </Animated.Text>
        ))}
      </Row>
      <Animated.View style={{ opacity: word }}>
        <T v="small" color={C.haze} style={{ marginTop: 8 }}>Flights, stays, coaches, trains and cars in one place</T>
      </Animated.View>
    </Animated.View>
  );
}

const SLIDES = [
  { img: IMG.hero, title: 'Stay somewhere\nthat glows', body: 'Walk through rooms before you book them. Drag to look around, tap the details that matter.' },
  { img: IMG.flight.first, title: 'Choose your seat\nfrom inside', body: 'Step into the cabin, orbit around it and preview the view from any seat.' },
  { img: IMG.bus.royal, title: 'Every road,\none ticket', body: 'Coaches, trains and rental cars with live seat maps and instant e-tickets.' },
];

export function OnboardingScreen({ nav }) {
  const store = useStore();
  const insets = useInsets();
  const x = useRef(new Animated.Value(0)).current;
  const list = useRef(null);
  const [idx, setIdx] = useState(0);

  const finish = () => {
    haptic.ok();
    store.finishOnboarding();
    nav.reset('SignIn');
  };
  const next = () => {
    if (idx < SLIDES.length - 1) list.current?.scrollToOffset({ offset: (idx + 1) * SCREEN_W, animated: true });
    else finish();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Animated.FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const range = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W];
          const imgX = x.interpolate({ inputRange: range, outputRange: [-SCREEN_W * 0.35, 0, SCREEN_W * 0.35] });
          const scale = x.interpolate({ inputRange: range, outputRange: [1.25, 1.05, 1.25] });
          const textY = x.interpolate({ inputRange: range, outputRange: [60, 0, 60] });
          const textO = x.interpolate({ inputRange: range, outputRange: [0, 1, 0] });
          return (
            <View style={{ width: SCREEN_W, height: SCREEN_H }}>
              <View style={[styles.archMask, { top: insets.top + 60 }]}>
                <Animated.Image source={item.img} resizeMode="cover" style={{ width: '100%', height: '100%', transform: [{ translateX: imgX }, { scale }] }} />
                <LinearGradient colors={['transparent', 'rgba(11,16,40,0.65)']} style={StyleSheet.absoluteFill} />
              </View>
              <Animated.View style={[styles.slideText, { bottom: insets.bottom + 150, opacity: textO, transform: [{ translateY: textY }] }]}>
                <T v="hero">{item.title}</T>
                <T v="bodyR" color={C.haze} style={{ marginTop: 12, maxWidth: 320 }}>{item.body}</T>
              </Animated.View>
            </View>
          );
        }}
      />
      <View style={[styles.onbTop, { top: insets.top + 12 }]}>
        <T v="h3" color={C.sand}>Travora</T>
        <Pressy onPress={finish}><T v="label" color={C.haze}>Skip</T></Pressy>
      </View>
      <View style={[styles.onbBottom, { bottom: insets.bottom + 34 }]}>
        <Row>
          {SLIDES.map((_, i) => {
            const w = x.interpolate({ inputRange: [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W], outputRange: [1, 3.2, 1], extrapolate: 'clamp' });
            const o = x.interpolate({ inputRange: [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W], outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { opacity: o, transform: [{ scaleX: w }] }]} />;
          })}
        </Row>
        <Btn title={idx === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={next} style={{ width: 150 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glowOrb: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(63,216,230,0.07)', bottom: -120, alignSelf: 'center' },
  archMask: { position: 'absolute', left: 22, right: 22, height: SCREEN_H * 0.5, borderTopLeftRadius: 220, borderTopRightRadius: 220, borderBottomLeftRadius: R.l, borderBottomRightRadius: R.l, overflow: 'hidden', backgroundColor: C.dusk },
  slideText: { position: 'absolute', left: 26, right: 26 },
  onbTop: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  onbBottom: { position: 'absolute', left: 26, right: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.sand, marginRight: 14 },
});
