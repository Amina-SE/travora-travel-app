// Car showroom: drag the car itself to drive to the next model; wheels spin with your finger.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { C, F, R, SCREEN_W, money } from '../theme';
import { CARS, CAR_CITIES, CAR_RATIO, IMG, MON, SHOWROOM_LIGHTS, fmtDate } from '../data';
import { Sheet } from '../sheet';
import FareCalendar from '../components/FareCalendar';
import { Btn, Chip, Header, Pressy, Row, Stars, Stepper, T, haptic, useInsets } from '../ui';

const CAR_W = SCREEN_W * 0.86;
const CAR_MAX_H = 196;

// Real car photo cut out of its background. The drive animation's wheel-spin value now
// leans the body and bounces the suspension, since a photo has no separate wheels.
function CarPhoto({ car, spin }) {
  const r = CAR_RATIO[car.img] || 1.9;
  const w = Math.min(CAR_W, CAR_MAX_H * r);
  const h = w / r;
  const lean = spin.interpolate({ inputRange: [-1.5, 0, 1.5], outputRange: ['2.2deg', '0deg', '-2.2deg'] });
  const bob = spin.interpolate({ inputRange: [-1.5, -0.75, 0, 0.75, 1.5], outputRange: [-3, -6, 0, -6, -3] });
  return (
    <View style={{ width: CAR_W, height: CAR_MAX_H, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={[styles.carShadow, { width: w * 0.86 }]} />
      <Animated.Image source={IMG.cars[car.img]} resizeMode="contain" style={{ width: w, height: h, transform: [{ translateY: bob }, { rotate: lean }] }} />
    </View>
  );
}
const EXTRAS = [
  { id: 'insurance', label: 'Full insurance', sub: 'Zero excess on damage', perDay: 12, icon: 'shield' },
  { id: 'child', label: 'Child seat', sub: 'For ages 1 to 4', perDay: 5, icon: 'smile' },
  { id: 'gps', label: 'GPS navigation', sub: 'Offline maps included', perDay: 4, icon: 'navigation' },
];

export default function CarScreen({ nav }) {
  const insets = useInsets();
  const [idx, setIdx] = useState(0);
  const car = CARS[idx];
  const lamp = SHOWROOM_LIGHTS[0];
  const [city, setCity] = useState('Karachi');
  const [pickup, setPickup] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; });
  const [calOpen, setCalOpen] = useState(false);
  const [len, setLen] = useState(3);
  const [driver, setDriver] = useState(false);
  const [extras, setExtras] = useState({ insurance: true });

  const x = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const light = useRef(new Animated.Value(0)).current;
  const idxRef = useRef(0);
  idxRef.current = idx;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(light, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  const driveTo = (dir) => {
    const next = idxRef.current + dir;
    if (next < 0 || next >= CARS.length) {
      Animated.spring(x, { toValue: 0, useNativeDriver: true, damping: 14 }).start();
      Animated.spring(spin, { toValue: 0, useNativeDriver: true }).start();
      haptic.warn();
      return;
    }
    haptic.soft();
    Animated.parallel([
      Animated.timing(x, { toValue: -dir * SCREEN_W * 1.2, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(spin, { toValue: dir * 1.5, duration: 320, useNativeDriver: true }),
    ]).start(() => {
      setIdx(next);
      x.setValue(dir * SCREEN_W * 1.2);
      spin.setValue(dir * 1.5);
      Animated.parallel([
        Animated.spring(x, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 90 }),
        Animated.timing(spin, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        x.setValue(g.dx);
        spin.setValue(-g.dx / 260);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80 || g.vx < -0.6) driveTo(1);
        else if (g.dx > 80 || g.vx > 0.6) driveTo(-1);
        else {
          Animated.spring(x, { toValue: 0, useNativeDriver: true, damping: 14 }).start();
          Animated.spring(spin, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const extrasPerDay = EXTRAS.reduce((s, e) => s + (extras[e.id] ? e.perDay : 0), 0) + (driver ? 25 : 0);
  const total = (car.price + extrasPerDay) * len;
  const dropoff = new Date(pickup.getFullYear(), pickup.getMonth(), pickup.getDate() + len);

  const book = () => {
    haptic.ok();
    const lines = [{ label: `${car.name}, ${len} ${len === 1 ? 'day' : 'days'} at ${money(car.price)}`, amount: car.price * len }];
    if (driver) lines.push({ label: 'Chauffeur', amount: 25 * len });
    EXTRAS.forEach((e) => extras[e.id] && lines.push({ label: e.label, amount: e.perDay * len }));
    nav.push('Checkout', {
      draft: {
        type: 'car',
        title: car.name,
        subtitle: `${car.type}, ${car.gear}`,
        className: car.type,
        location: city,
        date: pickup.toISOString(),
        dropoff: dropoff.toISOString(),
        days: len,
        carId: car.id,
        lines,
        subtotal: total,
        imageKey: `car.${car.img}`,
      },
    });
  };

  const nameX = x.interpolate({ inputRange: [-SCREEN_W, SCREEN_W], outputRange: [-SCREEN_W * 0.35, SCREEN_W * 0.35] });
  const sweep = light.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-SCREEN_W * 0.6, SCREEN_W * 0.6, -SCREEN_W * 0.6] });

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Header title="Rent a car" subtitle={`Pick-up in ${city}`} onBack={() => nav.pop()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Showroom */}
        <View style={styles.stage} {...pan.panHandlers}>
          <LinearGradient colors={['#151C40', '#1E2752', '#0B1028']} style={StyleSheet.absoluteFill} />
          <Animated.View pointerEvents="none" style={[styles.beam, { backgroundColor: lamp + '14', transform: [{ translateX: sweep }, { rotate: '18deg' }] }]} />
          <Animated.Text numberOfLines={1} style={[styles.bigName, { transform: [{ translateX: nameX }] }]}>{car.name}</Animated.Text>
          <View style={[styles.floor, { backgroundColor: lamp + '1F', borderColor: lamp + '55' }]} />
          <View pointerEvents="none" style={[styles.glow, { backgroundColor: lamp + '22' }]} />
          <Animated.View style={{ position: 'absolute', bottom: 34, alignSelf: 'center', transform: [{ translateX: x }] }}>
            <CarPhoto car={car} spin={spin} />
          </Animated.View>
          <View style={styles.pager}>
            {CARS.map((c, i) => <View key={c.id} style={[styles.pdot, i === idx && styles.pdotOn]} />)}
          </View>
          <Pressable style={[styles.arrow, { left: 10 }]} onPress={() => driveTo(-1)} hitSlop={10}><Feather name="chevron-left" size={20} color={idx ? C.mist : C.fog} /></Pressable>
          <Pressable style={[styles.arrow, { right: 10 }]} onPress={() => driveTo(1)} hitSlop={10}><Feather name="chevron-right" size={20} color={idx < CARS.length - 1 ? C.mist : C.fog} /></Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Row between style={{ marginTop: 18 }}>
            <View>
              <T v="h1">{car.name}</T>
              <Row style={{ marginTop: 4 }}>
                <T v="small" color={C.haze} style={{ marginRight: 10 }}>{car.type}</T>
                <Stars value={car.rating} />
              </Row>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <T v="h2" color={C.sand}>{money(car.price)}</T>
              <T v="tiny" color={C.haze}>a day</T>
            </View>
          </Row>


          <Row style={{ marginTop: 16, flexWrap: 'wrap' }}>
            {[
              ['account-group-outline', `${car.seats} seats`],
              ['car-shift-pattern', car.gear],
              ['gas-station-outline', car.fuel],
              ['map-marker-distance', car.range],
            ].map(([i, t]) => (
              <View key={t} style={styles.spec}>
                <MaterialCommunityIcons name={i} size={18} color={C.lagoon} />
                <T v="tiny" color={C.mist} style={{ marginTop: 5 }}>{t}</T>
              </View>
            ))}
          </Row>

          <T v="h3" style={{ marginTop: 22, marginBottom: 10 }}>Pick-up city</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {CAR_CITIES.map((c) => <Chip key={c} label={c} active={c === city} onPress={() => setCity(c)} />)}
          </ScrollView>

          <T v="h3" style={{ marginTop: 22, marginBottom: 10 }}>Pick-up date</T>
          <Pressy onPress={() => setCalOpen(true)} style={styles.dateCard} scaleTo={0.98}>
            <View style={styles.dateBig}>
              <T v="tiny" color={C.night} style={{ fontFamily: F.bold }}>{MON[pickup.getMonth()]}</T>
              <T v="h1" color={C.night} style={{ lineHeight: 34 }}>{pickup.getDate()}</T>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <T v="tiny" color={C.haze}>Pick up in {city}</T>
              <T v="h3">{fmtDate(pickup)}, {pickup.getFullYear()}</T>
              <T v="tiny" color={C.lagoon} style={{ marginTop: 3 }}>Return {fmtDate(dropoff)}, tap to change</T>
            </View>
            <View style={styles.calIcon}><Feather name="calendar" size={20} color={C.night} /></View>
          </Pressy>

          <Row between style={styles.box}>
            <View>
              <T v="label" style={{ fontFamily: F.bold }}>Rental length</T>
              <T v="tiny" color={C.haze}>Return {fmtDate(dropoff)}</T>
            </View>
            <Stepper value={len} onChange={setLen} min={1} max={21} />
          </Row>
          <Row between style={styles.box}>
            <View style={{ flex: 1 }}>
              <T v="label" style={{ fontFamily: F.bold }}>Add a chauffeur</T>
              <T v="tiny" color={C.haze}>Licensed local driver, +{money(25)} a day</T>
            </View>
            <Switch value={driver} onValueChange={(v) => { haptic.tap(); setDriver(v); }} trackColor={{ true: C.lantern, false: C.dusk2 }} thumbColor={C.mist} />
          </Row>

          <T v="h3" style={{ marginTop: 18, marginBottom: 10 }}>Extras</T>
          {EXTRAS.map((e) => {
            const on = !!extras[e.id];
            return (
              <Pressy key={e.id} onPress={() => setExtras((s) => ({ ...s, [e.id]: !s[e.id] }))} style={[styles.extra, on && styles.extraOn]} scaleTo={0.98}>
                <View style={[styles.extraIcon, on && { backgroundColor: C.lagoon, borderColor: C.lagoon }]}>
                  <Feather name={on ? 'check' : e.icon} size={16} color={on ? C.night : C.lagoon} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <T v="label" style={{ fontFamily: F.bold }}>{e.label}</T>
                  <T v="tiny" color={C.haze}>{e.sub}</T>
                </View>
                <T v="label" color={C.sand}>+{money(e.perDay)}/day</T>
              </Pressy>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={{ marginRight: 14 }}>
          <T v="tiny" color={C.haze}>{len} {len === 1 ? 'day' : 'days'} total</T>
          <T v="h2" color={C.sand}>{money(total)}</T>
        </View>
        <Btn title="Book this car" onPress={book} style={{ flex: 1 }} />
      </View>

      <Sheet visible={calOpen} onClose={() => setCalOpen(false)}>
        {calOpen ? (
          <FareCalendar
            value={pickup}
            title="Pick-up date"
            subtitle={`${car.name} from ${city}, daily rate shown`}
            verb="Pick up"
            rangeDays={len}
            fareFor={() => car.price}
            onConfirm={(d) => { setPickup(d); setCalOpen(false); }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  dateCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: R.l, backgroundColor: C.dusk, borderWidth: 1, borderColor: 'rgba(245,182,91,0.35)' },
  dateBig: { width: 64, height: 70, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: C.lantern, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  calIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' },
  stage: { height: 300, marginHorizontal: 16, borderRadius: R.l, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  beam: { position: 'absolute', top: -60, left: SCREEN_W * 0.3, width: 90, height: 460, backgroundColor: 'rgba(235,210,166,0.06)' },
  bigName: { position: 'absolute', top: 34, alignSelf: 'center', fontFamily: F.display, fontSize: 64, color: 'rgba(235,210,166,0.09)', letterSpacing: -2, width: SCREEN_W * 1.4, textAlign: 'center' },
  glow: { position: 'absolute', top: -140, alignSelf: 'center', width: 340, height: 340, borderRadius: 170 },
  carShadow: { position: 'absolute', bottom: 2, height: 22, borderRadius: 100, backgroundColor: 'rgba(0,0,0,0.55)', transform: [{ scaleY: 0.6 }] },
  floor: { position: 'absolute', bottom: 26, alignSelf: 'center', width: SCREEN_W * 0.9, height: 60, borderRadius: 300, backgroundColor: 'rgba(63,216,230,0.08)', borderWidth: 1, borderColor: 'rgba(63,216,230,0.25)', transform: [{ scaleY: 0.5 }] },
  pager: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row' },
  pdot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.line, marginHorizontal: 3 },
  pdotOn: { width: 20, backgroundColor: C.sand },
  arrow: { position: 'absolute', top: 130, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(11,16,40,0.6)', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  swatchOn: { borderColor: C.mist },
  swatchInner: { width: 24, height: 24, borderRadius: 12 },
  spec: { width: (SCREEN_W - 40 - 24) / 4, marginRight: 8, paddingVertical: 12, borderRadius: R.s, backgroundColor: C.dusk, alignItems: 'center' },
  day: { width: 54, height: 64, borderRadius: R.s, backgroundColor: C.dusk, alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 },
  dayRange: { backgroundColor: 'rgba(245,182,91,0.2)' },
  dayOn: { backgroundColor: C.lantern },
  box: { marginTop: 14, padding: 14, borderRadius: R.m, backgroundColor: C.dusk },
  extra: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: R.m, backgroundColor: C.dusk, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 8 },
  extraOn: { borderColor: 'rgba(63,216,230,0.6)' },
  extraIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'rgba(11,16,40,0.97)', borderTopWidth: 1, borderColor: 'rgba(235,210,166,0.12)' },
});
