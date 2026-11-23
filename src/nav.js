// A small animated stack navigator built on core Animated, so every transition
// is tuned for Travora and nothing depends on router internals that change per SDK.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, StyleSheet, View } from 'react-native';
import { C, SCREEN_H, SCREEN_W } from './theme';

const NavCtx = createContext(null);
let counter = 0;

function makeEntry(name, params, transition) {
  counter += 1;
  return { key: `s${counter}`, name, params: params || {}, transition, anim: new Animated.Value(0) };
}

function enterStyle(e) {
  const a = e.anim;
  switch (e.transition) {
    case 'fade':
      return {
        opacity: a,
        transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) }],
      };
    case 'rise':
      return {
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H, 0] }) }],
      };
    case 'zoom':
      return {
        opacity: a.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
          { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
        ],
      };
    default:
      return {
        opacity: a.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.4, 1, 1] }),
        transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_W, 0] }) }],
      };
  }
}

function underStyle(next) {
  if (!next) return null;
  const a = next.anim;
  if (next.transition === 'fade') {
    return { opacity: a.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }] };
  }
  if (next.transition === 'zoom') {
    return { transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] };
  }
  if (next.transition === 'rise') {
    return { transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }, { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) }] };
  }
  return {
    transform: [
      { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_W * 0.32] }) },
      { scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) },
    ],
  };
}

// Darkens the screen underneath while another one moves over it.
function dimFor(next) {
  if (!next) return null;
  const max = next.transition === 'fade' ? 0 : next.transition === 'zoom' ? 0.75 : 0.55;
  return next.anim.interpolate({ inputRange: [0, 1], outputRange: [0, max] });
}

export function Navigator({ screens, initial }) {
  const [stack, setStack] = useState(() => {
    const e = makeEntry(initial, {}, 'fade');
    e.anim.setValue(1);
    return [e];
  });
  const ref = useRef(stack);
  const commit = (s) => {
    ref.current = s;
    setStack(s);
  };

  const animateIn = (e, done) => {
    Animated.spring(e.anim, { toValue: 1, useNativeDriver: true, damping: 21, stiffness: 140, mass: 1 }).start(done);
  };

  const push = useCallback((name, params, opts = {}) => {
    const e = makeEntry(name, params, opts.transition || screens[name]?.transition || 'slide');
    commit([...ref.current, e]);
    animateIn(e);
  }, [screens]);

  const pop = useCallback(() => {
    const s = ref.current;
    if (s.length <= 1) return false;
    const top = s[s.length - 1];
    Animated.timing(top.anim, { toValue: 0, duration: 340, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })
      .start(() => commit(ref.current.filter((x) => x !== top)));
    return true;
  }, []);

  const replace = useCallback((name, params, opts = {}) => {
    const s = ref.current;
    const under = s[s.length - 1];
    const e = makeEntry(name, params, opts.transition || screens[name]?.transition || 'fade');
    commit([...s, e]);
    animateIn(e, () => commit(ref.current.filter((x) => x !== under)));
  }, [screens]);

  // Clear history and land on a screen (used after auth, after checkout).
  const reset = useCallback((name, params, opts = {}) => {
    const e = makeEntry(name, params, opts.transition || 'fade');
    commit([...ref.current, e]);
    animateIn(e, () => commit([e]));
  }, []);

  // Pop back to the most recent screen with this name, dropping what is above it.
  const popTo = useCallback((name) => {
    const s = ref.current;
    const idx = s.map((x) => x.name).lastIndexOf(name);
    if (idx < 0 || idx === s.length - 1) return;
    const top = s[s.length - 1];
    commit([...s.slice(0, idx + 1), top]);
    Animated.timing(top.anim, { toValue: 0, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => commit(ref.current.filter((x) => x !== top)));
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => pop());
    return () => sub.remove();
  }, [pop]);

  const api = useMemo(() => ({ push, pop, replace, reset, popTo }), [push, pop, replace, reset, popTo]);

  return (
    <NavCtx.Provider value={api}>
      <View style={styles.root}>
        {stack.map((e, i) => {
          const Screen = screens[e.name]?.component;
          if (!Screen) return null;
          const next = stack[i + 1];
          const isTop = i === stack.length - 1;
          // Screens two levels down are hidden but kept mounted, so going back is instant.
          const hidden = i < stack.length - 2;
          return (
            <Animated.View
              key={e.key}
              pointerEvents={isTop ? 'auto' : 'none'}
              style={[StyleSheet.absoluteFill, styles.screen, isTop ? enterStyle(e) : [enterStyle(e), underStyle(next)], hidden && styles.hidden]}
            >
              <Screen params={e.params} nav={api} focused={isTop} />
              {next ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#05081A', opacity: dimFor(next) }]} /> : null}
              {isTop && e.transition === 'slide' ? (
                <Animated.View pointerEvents="none" style={[styles.edge, { opacity: e.anim.interpolate({ inputRange: [0, 0.9, 1], outputRange: [1, 0.6, 0] }) }]} />
              ) : null}
            </Animated.View>
          );
        })}
      </View>
    </NavCtx.Provider>
  );
}

export const useNav = () => useContext(NavCtx);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.night },
  screen: { backgroundColor: C.night, overflow: 'hidden' },
  hidden: { opacity: 0 },
  edge: { position: 'absolute', top: 0, bottom: 0, left: -1, width: 14, backgroundColor: 'rgba(0,0,0,0.35)' },
});
