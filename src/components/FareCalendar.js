// Fare calendar: 12 months, month chips to jump anywhere, swipe or arrows to move,
// each day can show a price (flights, coaches and trains show the cheapest fare; cars show the daily rate).
// Used for flight, coach and train departures and car pick-up.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, F, R, SCREEN_W, money } from '../theme';
import { MON, fmtDate } from '../data';
import { Btn, Row, T, haptic } from '../ui';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function FareCalendar({ value, onConfirm, fareFor, title = 'Departure', subtitle, verb = 'Depart', rangeDays = 0 }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(today.getFullYear(), today.getMonth() + i, 1)), [today]);
  const initial = Math.max(0, months.findIndex((m) => m.getFullYear() === value.getFullYear() && m.getMonth() === value.getMonth()));
  const [mIdx, setMIdx] = useState(initial);
  const [picked, setPicked] = useState(startOfDay(value));
  const slide = useRef(new Animated.Value(0)).current;
  const chips = useRef(null);
  const idxRef = useRef(mIdx);
  idxRef.current = mIdx;

  const month = months[mIdx];
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first grid
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d);
      const past = date < today;
      out.push({ date, past, fare: past || !fareFor ? null : fareFor(date) });
    }
    return out;
  }, [mIdx, fareFor]);

  const fares = cells.filter((c) => c && c.fare).map((c) => c.fare).sort((a, b) => a - b);
  const varies = fares.length > 1 && fares[0] !== fares[fares.length - 1];
  const lowCut = varies ? fares[Math.floor(fares.length * 0.25)] : -1;
  const cheapest = cells.filter((c) => c && c.fare === fares[0])[0];

  // Slide the grid out, swap the month, slide it back in from the other side.
  const animateTo = (target) => {
    const cur = idxRef.current;
    if (target === cur) return;
    if (target < 0 || target >= months.length) {
      haptic.warn();
      return;
    }
    const dir = target > cur ? 1 : -1;
    haptic.tap();
    Animated.timing(slide, { toValue: -dir, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      idxRef.current = target;
      setMIdx(target);
      slide.setValue(dir);
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }).start();
    });
  };
  const go = (dir) => animateTo(idxRef.current + dir);
  const jump = (i) => animateTo(i);

  useEffect(() => {
    chips.current?.scrollTo({ x: Math.max(0, mIdx * 86 - SCREEN_W / 3), animated: true });
  }, [mIdx]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) go(1);
        else if (g.dx > 40) go(-1);
      },
    })
  ).current;

  const pick = (d) => {
    haptic.soft();
    setPicked(d);
  };

  const quick = [
    { label: 'This weekend', date: (() => { const d = new Date(today); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d; })() },
    { label: 'Next week', date: (() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; })() },
    { label: 'In a month', date: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()) },
    { label: 'In 3 months', date: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()) },
  ];
  const selectQuick = (d) => {
    const i = months.findIndex((m) => m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth());
    if (i >= 0 && i !== mIdx) jump(i);
    pick(startOfDay(d));
  };

  const cellW = (SCREEN_W - 40) / 7;
  const tx = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [-SCREEN_W * 0.5, 0, SCREEN_W * 0.5] });
  const op = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] });

  return (
    <View>
      <Row between>
        <View>
          <T v="h2">{title}</T>
          {subtitle ? <T v="tiny" color={C.haze}>{subtitle}</T> : null}
        </View>
        <View style={styles.yearPill}><T v="label" color={C.sand} style={{ fontFamily: F.bold }}>{month.getFullYear()}</T></View>
      </Row>

      <ScrollView ref={chips} horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {months.map((m, i) => {
          const on = i === mIdx;
          return (
            <Pressable key={i} onPress={() => jump(i)} style={[styles.monthChip, on && styles.monthOn]}>
              <T v="label" color={on ? C.night : C.mist} style={{ fontFamily: F.bold }}>{MON[m.getMonth()]}</T>
              <T v="tiny" color={on ? C.night : C.fog} style={{ fontSize: 10 }}>{m.getFullYear()}</T>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {quick.map((q) => (
          <Pressable key={q.label} onPress={() => selectQuick(q.date)} style={styles.quick}>
            <Feather name="zap" size={12} color={C.lagoon} />
            <T v="tiny" color={C.mist} style={{ marginLeft: 5, fontFamily: F.bold }}>{q.label}</T>
          </Pressable>
        ))}
      </ScrollView>

      <Row between style={{ marginTop: 14 }}>
        <Pressable onPress={() => go(-1)} hitSlop={10} style={[styles.arrow, mIdx === 0 && { opacity: 0.35 }]}><Feather name="chevron-left" size={18} color={C.mist} /></Pressable>
        <T v="h3">{MON[month.getMonth()]} {month.getFullYear()}</T>
        <Pressable onPress={() => go(1)} hitSlop={10} style={[styles.arrow, mIdx === months.length - 1 && { opacity: 0.35 }]}><Feather name="chevron-right" size={18} color={C.mist} /></Pressable>
      </Row>

      <Row style={{ marginTop: 12 }}>
        {WEEK.map((w, i) => <T key={w} v="tiny" color={i > 4 ? C.sand : C.fog} style={{ width: cellW, textAlign: 'center' }}>{w}</T>)}
      </Row>

      <Animated.View {...pan.panHandlers} style={[styles.grid, { opacity: op, transform: [{ translateX: tx }] }]}>
        {cells.map((c, i) => {
          if (!c) return <View key={`e${i}`} style={{ width: cellW, height: 52 }} />;
          const on = sameDay(c.date, picked);
          const diff = Math.round((c.date - picked) / 86400000);
          return (
            <DayCell
              key={i}
              cell={c}
              width={cellW}
              on={on}
              inRange={rangeDays > 1 && diff > 0 && diff < rangeDays}
              isToday={sameDay(c.date, today)}
              low={!!c.fare && c.fare <= lowCut}
              onPress={() => pick(c.date)}
            />
          );
        })}
      </Animated.View>

      {varies ? (
      <Row style={{ marginTop: 6, flexWrap: 'wrap' }}>
        <View style={[styles.dot, { backgroundColor: C.lagoon }]} />
        <T v="tiny" color={C.haze} style={{ marginRight: 14 }}>Lowest fares this month</T>
        {cheapest ? (
          <Pressable onPress={() => pick(cheapest.date)}>
            <T v="tiny" color={C.lagoon} style={{ fontFamily: F.bold }}>Cheapest: {cheapest.date.getDate()} {MON[cheapest.date.getMonth()]}, {money(cheapest.fare)}</T>
          </Pressable>
        ) : null}
      </Row>
      ) : null}

      <Btn title={`${verb} ${fmtDate(picked)}`} icon="check" onPress={() => { haptic.ok(); onConfirm(picked); }} style={{ marginTop: 16 }} />
    </View>
  );
}

// One day in the grid. Each cell owns its animation value, so selecting a new day
// can never leave another day stuck at a smaller size.
function DayCell({ cell, width, on, inRange, isToday, low, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (on) {
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 260 }).start();
    } else {
      scale.setValue(1);
    }
  }, [on]);
  return (
    <Pressable disabled={cell.past} onPress={onPress} style={{ width, height: 52, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.day, inRange && styles.dayRange, isToday && styles.today, on && styles.dayOn, { transform: [{ scale }] }]}>
        <T v="label" color={cell.past ? C.fog : on ? C.night : C.mist} style={{ fontFamily: F.xbold, opacity: cell.past ? 0.45 : 1 }}>{cell.date.getDate()}</T>
        {cell.fare ? (
          <T v="tiny" color={on ? C.night : low ? C.lagoon : C.haze} style={{ fontSize: 9, marginTop: -1 }}>{money(cell.fare)}</T>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  yearPill: { borderWidth: 1, borderColor: 'rgba(235,210,166,0.4)', borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5 },
  monthChip: { width: 78, height: 50, marginRight: 8, borderRadius: R.s, backgroundColor: C.dusk2, alignItems: 'center', justifyContent: 'center' },
  monthOn: { backgroundColor: C.lantern },
  quick: { flexDirection: 'row', alignItems: 'center', height: 30, paddingHorizontal: 11, marginRight: 8, borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(63,216,230,0.4)' },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.dusk2, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  day: { width: 44, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: 'rgba(235,210,166,0.6)' },
  dayOn: { backgroundColor: C.lantern, borderColor: C.lantern },
  dayRange: { backgroundColor: 'rgba(245,182,91,0.22)' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
});
