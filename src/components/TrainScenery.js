// Dusk landscape sliding past the train windows, three hill layers at different speeds.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { C, SCREEN_H, SCREEN_W } from '../theme';

function hills(w, h, amp, seed) {
  let d = `M0 ${h}`;
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const x = (w / steps) * i;
    const t = (Math.PI * 2 * i) / steps; // periodic so tiles join seamlessly
    const y = h * 0.4 + Math.sin(t * 2 + seed) * amp + Math.cos(t * 3 + seed * 2) * amp * 0.5;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ` L${w} ${h} Z`;
}

function Layer({ speed, color, height, amp, seed, bottom, orbit, depth }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: speed, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_W] });
  const ox = orbit ? orbit.interpolate({ inputRange: [-26, 26], outputRange: [depth, -depth] }) : 0;
  const path = hills(SCREEN_W, height, amp, seed);
  return (
    <Animated.View style={{ position: 'absolute', left: -40, bottom, flexDirection: 'row', transform: [{ translateX: Animated.add(tx, ox) }] }}>
      {[0, 1, 2].map((i) => (
        <Svg key={i} width={SCREEN_W} height={height}>
          <Path d={path} fill={color} />
        </Svg>
      ))}
    </Animated.View>
  );
}

export default function TrainScenery({ orbit }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#1A2560', '#3B3F86', '#B7798A', '#F2B27A']} locations={[0, 0.45, 0.78, 1]} style={StyleSheet.absoluteFill} />
      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Circle cx={SCREEN_W * 0.72} cy={SCREEN_H * 0.62} r={46} fill="#FFD9A0" opacity={0.85} />
      </Svg>
      <Layer speed={60000} color="#4A3E7A" height={260} amp={40} seed={1} bottom={SCREEN_H * 0.18} orbit={orbit} depth={10} />
      <Layer speed={28000} color="#2C2A62" height={220} amp={30} seed={4} bottom={SCREEN_H * 0.1} orbit={orbit} depth={22} />
      <Layer speed={9000} color="#141A44" height={170} amp={18} seed={7} bottom={0} orbit={orbit} depth={40} />
      {/* window mullions */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', justifyContent: 'space-around' }]} pointerEvents="none">
        {[0, 1, 2].map((i) => <View key={i} style={{ width: 16, backgroundColor: 'rgba(11,16,40,0.85)' }} />)}
      </View>
    </View>
  );
}
