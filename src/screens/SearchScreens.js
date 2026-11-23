import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { C, F, R, SCREEN_W, money } from '../theme';
import { CITIES, CLASSES, DOW, GROUND_CITIES, IMG, MON, fmtDate, nextDays, searchFlights, searchGround } from '../data';
import { Btn, Chip, Header, Pressy, Rise, Row, Stepper, T, haptic, useInsets, Photo } from '../ui';
import { Sheet } from '../sheet';
import { MODE_ICON } from '../components/BookingBits';
import FareCalendar from '../components/FareCalendar';

const TITLES = { flight: 'Book a flight', bus: 'Book a coach', train: 'Book a train' };
const HERO = { flight: IMG.flight.economy2, bus: IMG.bus.standard, train: IMG.train.main };

export function SearchScreen({ nav, params }) {
  const { mode } = params;
  const insets = useInsets();
  const isFlight = mode === 'flight';
  const [from, setFrom] = useState(isFlight ? 'KHI' : 'Karachi');
  const [to, setTo] = useState(isFlight ? 'DXB' : 'Lahore');
  const [depDate, setDepDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; });
  const [calOpen, setCalOpen] = useState(false);
  // Cheapest fare on a given day for this route: flights, coaches and trains alike.
  const fareFor = useCallback(
    (d) => (isFlight ? searchFlights(from, to, d.toISOString()) : searchGround(mode, from, to, d.toISOString())).reduce((m, t) => Math.min(m, t.price), Infinity),
    [isFlight, mode, from, to]
  );
  const [pax, setPax] = useState(1);
  const [cls, setCls] = useState(params.cls || CLASSES[mode][0].id);
  const [picker, setPicker] = useState(null);
  const [q, setQ] = useState('');
  const spin = useRef(new Animated.Value(0)).current;

  const label = (v) => (isFlight ? CITIES.find((c) => c.code === v) : { code: v.slice(0, 3).toUpperCase(), city: v, country: 'Pakistan' });
  const swap = () => {
    haptic.soft();
    Animated.timing(spin, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start(() => spin.setValue(0));
    setFrom(to);
    setTo(from);
  };
  const options = isFlight ? CITIES : GROUND_CITIES.map((c) => ({ code: c.slice(0, 3).toUpperCase(), city: c, country: 'Pakistan', value: c }));
  const filtered = options.filter((o) => `${o.city} ${o.code} ${o.country}`.toLowerCase().includes(q.toLowerCase()));

  const pick = (o) => {
    const v = isFlight ? o.code : o.value;
    if (picker === 'from') { if (v === to) setTo(from); setFrom(v); } else { if (v === from) setFrom(to); setTo(v); }
    setPicker(null);
    setQ('');
  };

  const F1 = label(from);
  const F2 = label(to);

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <View style={styles.heroWrap}>
        {HERO[mode] ? <Photo source={HERO[mode]} style={StyleSheet.absoluteFill} /> : <LinearGradient colors={['#2B2F6A', '#B7798A']} style={StyleSheet.absoluteFill} />}
        <LinearGradient colors={['rgba(11,16,40,0.55)', C.night]} style={StyleSheet.absoluteFill} />
      </View>
      <Header title={TITLES[mode]} onBack={() => nav.pop()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <Rise>
          <View style={styles.route}>
            <Pressy onPress={() => setPicker('from')} style={{ flex: 1 }}>
              <T v="tiny" color={C.haze}>From</T>
              <T v="h1" style={{ marginTop: 4 }}>{F1.code}</T>
              <T v="small" color={C.haze} numberOfLines={1}>{F1.city}</T>
            </Pressy>
            <Pressy onPress={swap} style={styles.swap}>
              <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                <Feather name="repeat" size={18} color={C.night} />
              </Animated.View>
            </Pressy>
            <Pressy onPress={() => setPicker('to')} style={{ flex: 1, alignItems: 'flex-end' }}>
              <T v="tiny" color={C.haze}>To</T>
              <T v="h1" style={{ marginTop: 4 }}>{F2.code}</T>
              <T v="small" color={C.haze} numberOfLines={1}>{F2.city}</T>
            </Pressy>
          </View>
        </Rise>

          <Pressy onPress={() => setCalOpen(true)} style={styles.dateCard} scaleTo={0.98}>
            <View style={styles.dateBig}>
              <T v="tiny" color={C.night} style={{ fontFamily: F.bold }}>{MON[depDate.getMonth()]}</T>
              <T v="h1" color={C.night} style={{ lineHeight: 34 }}>{depDate.getDate()}</T>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <T v="tiny" color={C.haze}>Departure</T>
              <T v="h3">{fmtDate(depDate)}, {depDate.getFullYear()}</T>
              <T v="tiny" color={C.lagoon} style={{ marginTop: 3 }}>From {money(fareFor(depDate))} on this day, tap to change</T>
            </View>
            <View style={styles.calIcon}><Feather name="calendar" size={20} color={C.night} /></View>
          </Pressy>

        <T v="h3" style={{ marginTop: 26, marginBottom: 10 }}>Class</T>
        {CLASSES[mode].map((c) => {
          const on = cls === c.id;
          return (
            <Pressy key={c.id} onPress={() => setCls(c.id)} style={[styles.clsCard, on && styles.clsOn]} scaleTo={0.98}>
              <Photo source={c.img} style={styles.clsPhoto}>
                <LinearGradient colors={['transparent', 'rgba(11,16,40,0.85)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
                <Pressy onPress={() => nav.push('Walkthrough', { mode, cls: c.id, pickLabel: 'Pick', onPick: setCls })} style={styles.walkBig} hitSlop={6}>
                  <MaterialCommunityIcons name="rotate-3d-variant" size={16} color={C.night} />
                  <T v="label" color={C.night} style={{ marginLeft: 6, fontFamily: F.xbold }}>Walk inside</T>
                </Pressy>
                <View style={{ position: 'absolute', left: 14, bottom: 12, right: 60 }}>
                  <T v="h3">{c.label}</T>
                </View>
                <View style={[styles.radio, styles.radioOnPhoto, on && { borderColor: C.lantern, backgroundColor: 'rgba(11,16,40,0.6)' }]}>{on ? <View style={styles.radioDot} /> : null}</View>
              </Photo>
              <Row between style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <T v="tiny" color={C.haze} numberOfLines={2} style={{ flex: 1, paddingRight: 10 }}>{c.blurb}</T>
                <T v="tiny" color={on ? C.lantern : C.fog} style={{ fontFamily: F.bold }}>{on ? 'Selected' : 'Tap to select'}</T>
              </Row>
            </Pressy>
          );
        })}

        <Row between style={{ marginTop: 20, padding: 16, borderRadius: R.m, backgroundColor: C.dusk }}>
          <View>
            <T v="label" style={{ fontFamily: F.bold }}>Travellers</T>
            <T v="tiny" color={C.haze}>You can pick a seat for each</T>
          </View>
          <Stepper value={pax} onChange={setPax} min={1} max={6} />
        </Row>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Btn
          title={`Search ${mode === 'flight' ? 'flights' : mode === 'bus' ? 'coaches' : 'trains'}`}
          icon="search"
          onPress={() => nav.push('Results', { mode, from: isFlight ? from : from, to, date: depDate.toISOString(), pax, cls, fromCity: F1.city, toCity: F2.city })}
        />
      </View>

      <Sheet visible={calOpen} onClose={() => setCalOpen(false)}>
        {calOpen ? (
          <FareCalendar
            value={depDate}
            fareFor={fareFor}
            subtitle={`${F1.city} to ${F2.city}, lowest fare per day`}
            onConfirm={(d) => { setDepDate(d); setCalOpen(false); }}
          />
        ) : null}
      </Sheet>

      <Sheet visible={!!picker} onClose={() => { setPicker(null); setQ(''); }}>
        <T v="h2">{picker === 'from' ? 'Leaving from' : 'Going to'}</T>
        <View style={styles.searchBox}>
          <Feather name="search" size={17} color={C.haze} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search a city" placeholderTextColor={C.fog} style={styles.searchInput} selectionColor={C.lantern} />
        </View>
        <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
          {filtered.map((o) => (
            <Pressy key={o.code + o.city} onPress={() => pick(o)} style={styles.cityRow}>
              <View style={styles.cityCode}><T v="label" color={C.sand} style={{ fontFamily: F.xbold }}>{o.code}</T></View>
              <View style={{ marginLeft: 12 }}>
                <T v="label" style={{ fontFamily: F.bold }}>{o.city}</T>
                <T v="tiny" color={C.haze}>{o.country}</T>
              </View>
            </Pressy>
          ))}
          {!filtered.length ? <T v="small" color={C.haze} style={{ paddingVertical: 20 }}>No cities match “{q}”. Try another spelling.</T> : null}
        </ScrollView>
      </Sheet>
    </View>
  );
}

const SORTS = [
  { id: 'cheap', label: 'Cheapest' },
  { id: 'early', label: 'Earliest' },
  { id: 'fast', label: 'Fastest' },
];
const mins = (d) => {
  const [h, m] = d.replace('m', '').split('h ').map((x) => parseInt(x, 10));
  return h * 60 + m;
};

export function ResultsScreen({ nav, params }) {
  const { mode, from, to, pax, cls, fromCity, toCity } = params;
  const insets = useInsets();
  const [date, setDate] = useState(params.date);
  const [sort, setSort] = useState('cheap');
  const mult = CLASSES[mode].find((c) => c.id === cls)?.mult || 1;
  const results = useMemo(() => {
    const list = mode === 'flight' ? searchFlights(from, to, date) : searchGround(mode, from, to, date);
    const s = [...list];
    if (sort === 'cheap') s.sort((a, b) => a.price - b.price);
    if (sort === 'early') s.sort((a, b) => a.depart.localeCompare(b.depart));
    if (sort === 'fast') s.sort((a, b) => mins(a.duration) - mins(b.duration));
    return s;
  }, [mode, from, to, date, sort]);

  const shiftDay = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    if (d < new Date(new Date().toDateString())) return haptic.warn();
    setDate(d.toISOString());
  };

  const travel = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    travel.setValue(0);
    Animated.timing(travel, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  }, [date, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Header title={`${fromCity} – ${toCity}`} subtitle={`${pax} ${pax === 1 ? 'traveller' : 'travellers'}, ${CLASSES[mode].find((c) => c.id === cls)?.label}`} onBack={() => nav.pop()} />
      <Row between style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <Pressy onPress={() => shiftDay(-1)} style={styles.dayNav}><Feather name="chevron-left" size={18} color={C.mist} /></Pressy>
        <T v="h3">{fmtDate(date)}</T>
        <Pressy onPress={() => shiftDay(1)} style={styles.dayNav}><Feather name="chevron-right" size={18} color={C.mist} /></Pressy>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        {SORTS.map((s) => <Chip key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} />)}
      </ScrollView>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {results.map((r, i) => (
          <Rise key={r.id + date + sort} delay={i * 70} distance={20}>
            <TripCard trip={r} mult={mult} travel={travel} onPress={() => nav.push('Cabin', { mode, trip: { ...r, from: fromCity, to: toCity }, cls })} best={sort === 'cheap' && i === 0} />
          </Rise>
        ))}
      </ScrollView>
    </View>
  );
}

function TripCard({ trip, mult, onPress, travel, best }) {
  const icon = MODE_ICON[trip.mode];
  const tx = travel.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  return (
    <Pressy onPress={onPress} style={styles.trip} scaleTo={0.98}>
      <Row between>
        <Row>
          <View style={[styles.opDot, { backgroundColor: trip.tint }]}><T v="tiny" color={C.night} style={{ fontFamily: F.xbold }}>{trip.operator[0]}</T></View>
          <View style={{ marginLeft: 10 }}>
            <T v="label" style={{ fontFamily: F.bold }}>{trip.operator}</T>
            <T v="tiny" color={C.haze}>{trip.code}</T>
          </View>
        </Row>
        {best ? <View style={styles.best}><T v="tiny" color={C.night} style={{ fontFamily: F.xbold }}>Best price</T></View> : null}
      </Row>
      <Row between style={{ marginTop: 16 }}>
        <T v="h2">{trip.depart}</T>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <View style={styles.track}>
            <View style={styles.trackLine} />
            <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: -9, transform: [{ translateX: tx.interpolate({ inputRange: [0, 1], outputRange: [-8, SCREEN_W * 0.27] }) }] }}>
              <MaterialCommunityIcons name={icon} size={18} color={C.lantern} style={trip.mode === 'flight' ? { transform: [{ rotate: '90deg' }] } : null} />
            </Animated.View>
          </View>
          <T v="tiny" color={C.haze} style={{ textAlign: 'center', marginTop: 10 }}>{trip.duration}{trip.stops ? `, ${trip.stops} ${trip.stops === 1 ? 'stop' : 'stops'}` : ', direct'}</T>
        </View>
        <T v="h2">{trip.arrive}</T>
      </Row>
      <View style={styles.tripFoot}>
        <T v="tiny" color={trip.seatsLeft < 8 ? C.lantern : C.haze}>{trip.seatsLeft < 8 ? `Only ${trip.seatsLeft} seats left` : `${trip.seatsLeft} seats open`}</T>
        <Row>
          <T v="h3" color={C.sand}>{money(trip.price * mult)}</T>
          <T v="tiny" color={C.haze}> per seat</T>
        </Row>
      </View>
    </Pressy>
  );
}

const styles = StyleSheet.create({
  heroWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  clsCard: { borderRadius: R.l, backgroundColor: C.dusk, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 12, overflow: 'hidden' },
  clsPhoto: { height: 150, borderTopLeftRadius: R.l - 2, borderTopRightRadius: R.l - 2 },
  walkBig: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: C.sand },
  radioOnPhoto: { position: 'absolute', right: 14, bottom: 12, marginLeft: 0 },
  walkMini: { flexDirection: 'row', alignItems: 'center', height: 30, paddingHorizontal: 10, borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(235,210,166,0.45)', marginLeft: 8 },
  dateCard: { flexDirection: 'row', alignItems: 'center', marginTop: 22, padding: 14, borderRadius: R.l, backgroundColor: C.dusk, borderWidth: 1, borderColor: 'rgba(245,182,91,0.35)' },
  dateBig: { width: 64, height: 70, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: C.lantern, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  calIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' },
  route: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: R.l, backgroundColor: 'rgba(21,28,64,0.92)', borderWidth: 1, borderColor: 'rgba(235,210,166,0.2)', marginTop: 20 },
  swap: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
  day: { width: 62, height: 76, borderRadius: R.m, backgroundColor: C.dusk, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: C.line },
  dayOn: { backgroundColor: C.lantern, borderColor: C.lantern },
  clsRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: R.m, backgroundColor: C.dusk, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 8 },
  clsOn: { borderColor: C.lantern },
  clsImg: { width: 62, height: 62, borderTopLeftRadius: 31, borderTopRightRadius: 31, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.lantern },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'rgba(11,16,40,0.96)' },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: R.s, backgroundColor: C.dusk2, paddingHorizontal: 12, marginVertical: 14 },
  searchInput: { flex: 1, marginLeft: 8, color: C.mist, fontFamily: F.semi, fontSize: 15 },
  cityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  cityCode: { width: 52, height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  dayNav: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.dusk, alignItems: 'center', justifyContent: 'center' },
  trip: { padding: 16, borderRadius: R.l, backgroundColor: C.dusk, borderWidth: 1, borderColor: 'rgba(44,54,112,0.8)', marginBottom: 12 },
  opDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  best: { backgroundColor: C.lagoon, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  track: { height: 2, justifyContent: 'center' },
  trackLine: { height: 1.5, borderRadius: 1, backgroundColor: C.line },
  tripFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line, borderStyle: 'dashed' },
});
