// The immersive cabin: drag sideways to orbit the camera, drag up/down to glide along the aisle,
// tap a seat to pick it, long-press a seat to see the view from it.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Image, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { C, F, R, SCREEN_H, SCREEN_W, glow, money } from '../theme';
import { CLASSES, IMG, fmtDate } from '../data';
import { buildDeck, deckGeometry } from '../cabins';
import { Btn, Chip, IconBtn, Row, Segmented, T, haptic, useInsets, Photo } from '../ui';
import { Sheet } from '../sheet';
import TrainScenery from '../components/TrainScenery';

const MAX_SEATS = 6;
const TILT = 40;
const ZONE_INFO = {
  lounge: {
    business: { img: IMG.flight.lounge, title: 'Business lounge bar', body: 'A curved bar behind the cockpit with cocktails, small plates and a sofa corner. Lounge access includes the departure lounge at the airport.', price: 45, cta: 'Add lounge access' },
    first: { img: IMG.flight.lounge, title: 'Onboard lounge', body: 'Leather sofas, a stocked bar and window-side tables for dinner with a view. Included with every First suite.', price: 0, cta: 'Included with your suite' },
  },
  spa: { first: { img: IMG.flight.first, title: 'Shower spa', body: 'A private shower suite with heated floors and full-size amenities. Reserve a 25-minute slot now and the crew will remind you.', price: 0, cta: 'Reserve a slot' } },
  dining: { first: { img: IMG.train.first2, title: 'Dining car', body: 'White-tablecloth dining with a three-course menu and window tables. Reserve a sitting and the steward will bring you through.', price: 18, cta: 'Reserve a table' } },
  vip: { royal: { img: IMG.bus.vip, title: 'Private lounge cabin', body: 'A sealed rear cabin with L-shaped sofas, mood lighting and a sound system for up to 8 guests.', price: 60, cta: 'Book the lounge cabin' } },
};

export default function CabinScreen({ params, nav }) {
  const { mode, trip } = params;
  const insets = useInsets();
  const classes = CLASSES[mode];
  const [cls, setCls] = useState(params.cls || classes[0].id);
  const [shown, setShown] = useState(cls);
  const [coach, setCoach] = useState(3);
  const [selected, setSelected] = useState([]);
  const [extras, setExtras] = useState({});
  const [zoneOpen, setZoneOpen] = useState(null);
  const [viewSeat, setViewSeat] = useState(null);
  const [stageH, setStageH] = useState(SCREEN_H * 0.5);

  const clsInfo = classes.find((c) => c.id === shown);
  const base = Math.round(trip.price * clsInfo.mult);
  const deck = useMemo(() => buildDeck(mode, shown, base, `${trip.id}-${mode === 'train' ? coach : ''}`), [mode, shown, base, trip.id, coach]);
  const geo = useMemo(() => deckGeometry(deck), [deck]);
  const nose = deck.shell === 'plane' ? geo.innerW * 0.62 + 30 : deck.shell === 'bus' ? 70 : 44;
  const tail = deck.shell === 'plane' ? 70 : 34;
  const shellW = geo.innerW + (deck.shell === 'plane' ? 44 : 30);
  const shellH = geo.innerH + nose + tail;

  // Animated camera.
  const intro = useRef(new Animated.Value(0)).current;
  const scroll = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const viewA = useRef(new Animated.Value(0)).current;
  const viewShift = useRef(new Animated.Value(0)).current;
  const camTilt = useRef(new Animated.Value(TILT)).current; // degrees
  const camSpin = useRef(new Animated.Value(0)).current; // degrees
  const camZoom = useRef(new Animated.Value(1)).current;
  const [camera, setCamera] = useState('aisle');
  const cur = useRef({ scroll: 0, orbit: 0, startS: 0, startO: 0 });
  const range = useRef({ min: -200, max: 40 });
  range.current = { min: Math.min(0, -(shellH - stageH * 0.78)), max: 46 };

  const runIntro = () => {
    intro.setValue(0);
    Animated.timing(intro, { toValue: 1, duration: 1150, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  useEffect(runIntro, []);

  const switchClass = (id) => {
    if (id === cls) return;
    setCls(id);
    Animated.timing(intro, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setShown(id);
      setSelected([]);
      setExtras({});
      cur.current.scroll = 0;
      scroll.setValue(0);
      runIntro();
    });
  };

  const switchRef = useRef(null);
  switchRef.current = switchClass;
  const openWalk = () => {
    haptic.tap();
    nav.push('Walkthrough', { mode, cls: shown, price: trip.price, onPick: (c) => switchRef.current && switchRef.current(c) });
  };

  const switchCoach = (n) => {
    if (n === coach) return;
    Animated.timing(intro, { toValue: 0.35, duration: 200, useNativeDriver: true }).start(() => {
      setCoach(n);
      setSelected([]);
      Animated.timing(intro, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
      onPanResponderGrant: () => {
        scroll.stopAnimation((v) => { cur.current.scroll = v; });
        orbit.stopAnimation((v) => { cur.current.orbit = v; });
        cur.current.startS = cur.current.scroll;
        cur.current.startO = cur.current.orbit;
      },
      onPanResponderMove: (_, g) => {
        const { min, max } = range.current;
        let s = cur.current.startS + g.dy * 1.15;
        if (s > max) s = max + (s - max) * 0.3; // rubber band at the ends
        if (s < min) s = min + (s - min) * 0.3;
        const o = Math.max(-26, Math.min(26, cur.current.startO + g.dx * 0.13));
        cur.current.scroll = s;
        cur.current.orbit = o;
        scroll.setValue(s);
        orbit.setValue(o);
      },
      onPanResponderRelease: (_, g) => {
        const { min, max } = range.current;
        const target = Math.max(min, Math.min(max, cur.current.scroll + g.vy * 170));
        cur.current.scroll = target;
        cur.current.orbit = 0;
        Animated.spring(scroll, { toValue: target, useNativeDriver: true, damping: 22, stiffness: 95 }).start();
        Animated.spring(orbit, { toValue: 0, useNativeDriver: true, damping: 12, stiffness: 70 }).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const toggleSeat = (cell) => {
    setSelected((sel) => {
      if (sel.some((s) => s.id === cell.id)) return sel.filter((s) => s.id !== cell.id);
      if (sel.length >= MAX_SEATS) {
        haptic.warn();
        return sel;
      }
      haptic.soft();
      return [...sel, cell];
    });
  };

  const openView = (cell) => {
    haptic.firm();
    setViewSeat(cell);
    const left = cell.letter <= 'C' || cell.letter === 'L1' || cell.letter === 'L2';
    viewShift.setValue(left ? 34 : -34);
    Animated.timing(viewA, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  };
  const closing = useRef(false);
  const closeView = () => {
    if (closing.current) return;
    closing.current = true;
    haptic.tap();
    Animated.timing(viewA, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => { closing.current = false; setViewSeat(null); });
  };

  // Camera presets, like switching camera views in an auditorium. "Seat map" flattens to 2D.
  const CAMERAS = [
    { id: 'aisle', label: 'Aisle', icon: 'video', tilt: TILT, spin: 0, zoom: 1 },
    { id: 'overhead', label: 'Overhead', icon: 'arrow-down-circle', tilt: 18, spin: 0, zoom: 0.92 },
    { id: 'side', label: 'Side', icon: 'rotate-cw', tilt: 52, spin: -32, zoom: 0.95 },
    { id: 'map', label: 'Seat map', icon: 'grid', tilt: 0, spin: 0, zoom: 1 },
  ];
  const setCam = (id) => {
    const c = CAMERAS.find((x) => x.id === id);
    haptic.tap();
    setCamera(id);
    Animated.parallel([
      Animated.spring(camTilt, { toValue: c.tilt, useNativeDriver: true, damping: 18, stiffness: 90 }),
      Animated.spring(camSpin, { toValue: c.spin, useNativeDriver: true, damping: 18, stiffness: 90 }),
      Animated.spring(camZoom, { toValue: c.zoom, useNativeDriver: true, damping: 18, stiffness: 90 }),
    ]).start();
  };

  // Android back button: close the seat view first instead of leaving the cabin.
  useEffect(() => {
    if (!viewSeat) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { closeView(); return true; });
    return () => sub.remove();
  }, [viewSeat]);

  const zoneMeta = zoneOpen ? ZONE_INFO[zoneOpen]?.[shown] : null;
  const extrasTotal = Object.keys(extras).reduce((sum, k) => sum + (extras[k] ? (ZONE_INFO[k]?.[shown]?.price || 0) : 0), 0);
  const seatsTotal = selected.reduce((s, c) => s + c.price, 0);
  const total = seatsTotal + extrasTotal;

  const totalBump = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    totalBump.setValue(1.12);
    Animated.spring(totalBump, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
  }, [total]);

  const proceed = () => {
    haptic.ok();
    const clsLabel = clsInfo.label;
    const lines = selected.map((s) => ({ label: `${mode === 'train' ? `Coach ${coach}, ` : ''}${mode === 'train' && shown === 'sleeper' ? 'Berth' : 'Seat'} ${s.id}`, amount: s.price }));
    Object.keys(extras).forEach((k) => {
      if (extras[k]) {
        const z = ZONE_INFO[k][shown];
        lines.push({ label: z.title, amount: z.price });
      }
    });
    nav.push('Checkout', {
      draft: {
        type: mode,
        title: `${trip.from} to ${trip.to}`,
        operator: trip.operator,
        code: trip.code,
        date: trip.date,
        depart: trip.depart,
        arrive: trip.arrive,
        duration: trip.duration,
        className: clsLabel,
        seats: selected.map((s) => s.id),
        coach: mode === 'train' ? coach : undefined,
        lines,
        subtotal: total,
        image: clsInfo.img,
        imageKey: `${mode}.${shown}`,
      },
    });
  };

  // Transforms (built once; the underlying values are stable refs).
  const A = useMemo(() => ({
    tilt: Animated.add(camTilt, intro.interpolate({ inputRange: [0, 1], outputRange: [34, 0] })).interpolate({ inputRange: [0, 90], outputRange: ['0deg', '90deg'] }),
    spin: Animated.add(Animated.add(orbit, camSpin), intro.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] })).interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] }),
    deckScale: Animated.multiply(camZoom, intro.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] })),
    deckOpacity: Animated.multiply(
      intro.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
      viewA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
    ),
    deckHide: viewA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    hint: Animated.multiply(viewA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), intro),
    bgX: orbit.interpolate({ inputRange: [-26, 26], outputRange: [34, -34] }),
    bgY: scroll.interpolate({ inputRange: [-900, 60], outputRange: [70, -8], extrapolate: 'clamp' }),
    bgFade: intro.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    viewScale: viewA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.42] }),
    viewX: Animated.multiply(viewA, viewShift),
    dim: viewA.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] }),
  }), []);
  const { tilt, spin, deckScale, deckHide, bgX, bgY, bgFade, viewScale, viewX } = A;
  const dimOpacity = A.dim;

  const N = deck.rows.length;
  const rowAnims = useMemo(() => deck.rows.map((_, i) => {
    const st = 0.28 + 0.58 * (i / N);
    const en = Math.min(1, st + 0.18);
    const op = intro.interpolate({ inputRange: [0, st, en, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
    return { op, y: op.interpolate({ inputRange: [0, 1], outputRange: [-26, 0] }) };
  }), [deck]);
  let y = 0;
  const rowOffsets = deck.rows.map((row) => {
    const top = y;
    if (row.kind === 'seats') y += deck.seatH + deck.rowGap;
    else if (row.kind === 'zone') y += 66 + deck.rowGap;
    else if (row.kind === 'exit') y += 22;
    else if (row.kind === 'table') y += 12 + deck.rowGap;
    else if (row.kind === 'cabin') y += deck.seatH * 2 + 26 + deck.rowGap;
    return top;
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      {/* Backdrop: the real cabin, parallaxing with the camera. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgFade, transform: [{ translateX: viewX }, { scale: viewScale }] }]}>
        {!clsInfo.img ? (
          <TrainScenery orbit={orbit} />
        ) : (
          <Animated.Image
            source={clsInfo.img}
            resizeMode="cover"
            style={{ position: 'absolute', left: -50, top: -60, width: SCREEN_W + 100, height: SCREEN_H + 120, transform: [{ translateX: bgX }, { translateY: bgY }] }}
          />
        )}
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: dimOpacity }]}>
        <LinearGradient colors={['rgba(11,16,40,0.92)', 'rgba(11,16,40,0.55)', 'rgba(11,16,40,0.72)', C.night]} locations={[0, 0.3, 0.7, 0.95]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Top bar */}
      <Animated.View pointerEvents={viewSeat ? 'none' : 'auto'} style={{ paddingTop: insets.top + 6, paddingHorizontal: 16, zIndex: 5, opacity: deckHide }}>
        <Row between>
          <IconBtn name="chevron-left" size={22} onPress={() => nav.pop()} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <T v="h3" numberOfLines={1}>{trip.from} – {trip.to}</T>
            <T v="tiny" color={C.haze}>{trip.operator}, {trip.depart}, {fmtDate(trip.date)}</T>
          </View>
          <IconBtn name="maximize-2" size={18} onPress={() => selected.length ? openView(selected[selected.length - 1]) : haptic.warn()} />
        </Row>
        <Segmented options={classes} value={cls} onChange={switchClass} style={{ marginTop: 12 }} />
        <Row style={{ marginTop: 10 }} between>
          <T v="small" color={C.haze} style={{ flex: 1, paddingRight: 10 }} numberOfLines={2}>{clsInfo.blurb}</T>
          <T v="label" color={C.sand}>from {money(base)}</T>
        </Row>
        <Pressable onPress={openWalk} style={styles.walkBtn}>
          <MaterialCommunityIcons name="rotate-3d-variant" size={15} color={C.night} />
          <T v="tiny" color={C.night} style={{ marginLeft: 6, fontFamily: F.xbold }}>Walk through this {mode === 'flight' ? 'cabin' : mode === 'bus' ? 'coach' : 'train'}</T>
        </Pressable>
        {mode === 'train' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Chip key={n} label={`Coach ${n}`} active={coach === n} onPress={() => switchCoach(n)} icon={n === coach ? 'check' : undefined} />
            ))}
          </ScrollView>
        ) : null}
      </Animated.View>

      {/* Stage */}
      <View style={styles.stage} onLayout={(e) => setStageH(e.nativeEvent.layout.height)} {...pan.panHandlers}>
        <Animated.View
          style={{
            width: SCREEN_W,
            height: stageH,
            alignItems: 'center',
            opacity: A.deckOpacity,
            transform: [{ perspective: 950 }, { rotateX: tilt }, { rotateZ: spin }, { scale: deckScale }],
          }}
        >
          <Animated.View style={{ transform: [{ translateY: scroll }], paddingTop: 44 }}>
            <Shell deck={deck} width={shellW} height={shellH} nose={nose} tail={tail} geo={geo} rowOffsets={rowOffsets}>
              {deck.rows.map((row, i) => {
                const ra = rowAnims[i];
                return (
                  <Animated.View key={row.key} style={{ opacity: ra.op, transform: [{ translateY: ra.y }] }}>
                    <DeckRow
                      row={row}
                      deck={deck}
                      selected={selected}
                      extras={extras}
                      onSeat={toggleSeat}
                      onView={openView}
                      onZone={(z) => { haptic.tap(); setZoneOpen(z.id); }}
                    />
                  </Animated.View>
                );
              })}
            </Shell>
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.camBar, { opacity: A.hint }]}>
          {CAMERAS.map((c) => (
            <Pressable key={c.id} onPress={() => setCam(c.id)} style={[styles.camBtn, camera === c.id && styles.camOn]}>
              <Feather name={c.icon} size={13} color={camera === c.id ? C.night : C.haze} />
              <T v="tiny" color={camera === c.id ? C.night : C.haze} style={{ marginLeft: 5, fontFamily: F.bold }}>{c.label}</T>
            </Pressable>
          ))}
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.hint, { opacity: A.hint }]}>
          <Feather name="move" size={12} color={C.haze} />
          <T v="tiny" color={C.haze} style={{ marginLeft: 6 }}>Drag to look around, hold a seat to see its view</T>
        </Animated.View>
      </View>

      {/* Legend + tray */}
      <Animated.View pointerEvents={viewSeat ? 'none' : 'auto'} style={[styles.tray, { paddingBottom: insets.bottom + 14, opacity: deckHide }]}>
        <Row style={{ marginBottom: 12 }}>
          <Legend color="rgba(238,241,251,0.16)" border="rgba(238,241,251,0.5)" label="Open" />
          <Legend color="rgba(63,216,230,0.14)" border={C.lagoon} label="Premium" />
          <Legend color={C.lantern} border={C.lantern} label="Yours" />
          <Legend color={C.taken} border={C.taken} label="Taken" />
        </Row>
        <Row between>
          <View style={{ flex: 1 }}>
            {selected.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selected.map((s) => (
                  <Pressable key={s.id} onPress={() => toggleSeat(s)} style={styles.seatTag}>
                    <T v="label" color={C.night} style={{ fontFamily: F.xbold }}>{s.id}</T>
                    <Feather name="x" size={12} color={C.night} style={{ marginLeft: 4 }} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <T v="small" color={C.haze}>Pick up to {MAX_SEATS} {mode === 'train' && shown === 'sleeper' ? 'berths' : 'seats'}</T>
            )}
          </View>
          <Animated.View style={{ transform: [{ scale: totalBump }], alignItems: 'flex-end', marginLeft: 10 }}>
            <T v="tiny" color={C.haze}>Total</T>
            <T v="h2" color={C.sand}>{money(total)}</T>
          </Animated.View>
        </Row>
        <Btn title={selected.length ? `Continue with ${selected.length} ${selected.length === 1 ? 'seat' : 'seats'}` : 'Select a seat to continue'} disabled={!selected.length} onPress={proceed} style={{ marginTop: 12 }} />
      </Animated.View>

      {/* View-from-seat overlay */}
      {viewSeat ? (
        <Animated.View style={[StyleSheet.absoluteFill, styles.viewWrap, { zIndex: 50, elevation: 50, opacity: viewA, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
          <Row between style={{ paddingHorizontal: 16 }}>
            <View style={styles.viewBadge}>
              <MaterialCommunityIcons name="eye-outline" size={16} color={C.night} />
              <T v="label" color={C.night} style={{ marginLeft: 6, fontFamily: F.xbold }}>View from {viewSeat.id}</T>
            </View>
            <IconBtn name="x" onPress={closeView} />
          </Row>
          <View style={{ flex: 1 }} />
          <View style={styles.viewCard}>
            <T v="h2">{clsInfo.label}, {viewSeat.id}</T>
            <T v="small" color={C.haze} style={{ marginTop: 4 }}>{viewSeat.tag || (viewSeat.window ? 'Window seat' : 'Aisle access')}</T>
            <Row between style={{ marginTop: 14 }}>
              <T v="h3" color={C.sand}>{money(viewSeat.price)}</T>
              <Btn
                small
                kind={selected.some((s) => s.id === viewSeat.id) ? 'ghost' : 'lantern'}
                title={selected.some((s) => s.id === viewSeat.id) ? 'Remove seat' : viewSeat.taken ? 'Already taken' : 'Choose this seat'}
                disabled={viewSeat.taken}
                onPress={() => { toggleSeat(viewSeat); closeView(); }}
                style={{ paddingHorizontal: 18 }}
              />
            </Row>
          </View>
        </Animated.View>
      ) : null}

      <Sheet visible={!!zoneMeta} onClose={() => setZoneOpen(null)}>
        {zoneMeta ? (
          <View>
            <View style={styles.zoneImgWrap}>
              <Photo source={zoneMeta.img} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['transparent', 'rgba(21,28,64,0.9)']} style={StyleSheet.absoluteFill} />
            </View>
            <T v="h2" style={{ marginTop: 16 }}>{zoneMeta.title}</T>
            <T v="bodyR" color={C.haze} style={{ marginTop: 6 }}>{zoneMeta.body}</T>
            <Row between style={{ marginTop: 18 }}>
              <T v="h3" color={C.sand}>{zoneMeta.price ? `+${money(zoneMeta.price)}` : 'No extra charge'}</T>
              {zoneMeta.price || zoneOpen === 'spa' ? (
                <Btn
                  small
                  kind={extras[zoneOpen] ? 'ghost' : 'lantern'}
                  title={extras[zoneOpen] ? 'Remove' : zoneMeta.cta}
                  style={{ paddingHorizontal: 18 }}
                  onPress={() => {
                    haptic.ok();
                    setExtras((x) => ({ ...x, [zoneOpen]: !x[zoneOpen] }));
                    setZoneOpen(null);
                  }}
                />
              ) : (
                <T v="label" color={C.lagoon}>{zoneMeta.cta}</T>
              )}
            </Row>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

function Legend({ color, border, label }) {
  return (
    <Row style={{ marginRight: 14 }}>
      <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: color, borderWidth: 1.2, borderColor: border, marginRight: 6 }} />
      <T v="tiny" color={C.haze}>{label}</T>
    </Row>
  );
}

// Vehicle body drawn around the seat map.
function Shell({ deck, width, height, nose, tail, geo, rowOffsets, children }) {
  const plane = deck.shell === 'plane';
  const bus = deck.shell === 'bus';
  let wingTop = 0;
  let wingH = 0;
  if (plane && deck.wings) {
    const seatRowsIdx = deck.rows.map((r, i) => (r.kind === 'seats' ? i : -1)).filter((i) => i >= 0);
    const a = seatRowsIdx[deck.wings[0]];
    const b = seatRowsIdx[deck.wings[1]];
    wingTop = nose + rowOffsets[a];
    wingH = rowOffsets[b] - rowOffsets[a];
  }
  const radiusTop = plane ? width / 2 : bus ? 30 : 18;
  return (
    <View style={{ width, height }}>
      {plane && deck.wings ? (
        <>
          <Svg width={150} height={wingH + 120} style={{ position: 'absolute', left: -140, top: wingTop - 20 }}>
            <Path d={`M150 10 L8 ${wingH * 0.75} L18 ${wingH * 0.92} L150 ${wingH * 0.62} Z`} fill="rgba(235,210,166,0.10)" stroke="rgba(235,210,166,0.4)" strokeWidth={1.2} />
            <Ellipse cx={92} cy={wingH * 0.5} rx={10} ry={20} fill="rgba(63,216,230,0.18)" stroke="rgba(63,216,230,0.5)" />
          </Svg>
          <Svg width={150} height={wingH + 120} style={{ position: 'absolute', right: -140, top: wingTop - 20 }}>
            <Path d={`M0 10 L142 ${wingH * 0.75} L132 ${wingH * 0.92} L0 ${wingH * 0.62} Z`} fill="rgba(235,210,166,0.10)" stroke="rgba(235,210,166,0.4)" strokeWidth={1.2} />
            <Ellipse cx={58} cy={wingH * 0.5} rx={10} ry={20} fill="rgba(63,216,230,0.18)" stroke="rgba(63,216,230,0.5)" />
          </Svg>
        </>
      ) : null}
      <View
        style={{
          width,
          height,
          borderTopLeftRadius: radiusTop,
          borderTopRightRadius: radiusTop,
          borderBottomLeftRadius: plane ? 60 : 18,
          borderBottomRightRadius: plane ? 60 : 18,
          backgroundColor: 'rgba(16,22,52,0.88)',
          borderWidth: 1.5,
          borderColor: 'rgba(235,210,166,0.38)',
          paddingTop: nose,
          paddingBottom: tail,
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {plane ? <Cockpit width={width} nose={nose} /> : null}
        {bus ? <BusFront width={width} /> : null}
        {deck.shell === 'train' ? <TrainEnds width={width} /> : null}
        {children}
        {plane ? (
          <View style={styles.galley}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={C.haze} />
            <T v="tiny" color={C.haze} style={{ marginLeft: 6 }}>Galley</T>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Cockpit({ width, nose }) {
  return (
    <View style={{ position: 'absolute', top: nose * 0.3, alignItems: 'center', width }}>
      <Row>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 16, height: 9, marginHorizontal: 2, borderRadius: 3, backgroundColor: 'rgba(63,216,230,0.35)', transform: [{ rotate: `${(i - 1.5) * 12}deg` }] }} />
        ))}
      </Row>
      <T v="tiny" color={C.fog} style={{ marginTop: 10 }}>Cockpit</T>
    </View>
  );
}

function BusFront({ width }) {
  return (
    <View style={{ position: 'absolute', top: 0, width, height: 64 }}>
      <LinearGradient colors={['rgba(63,216,230,0.35)', 'transparent']} style={{ height: 18, marginHorizontal: 10, marginTop: 6, borderRadius: 10 }} />
      <Row between style={{ paddingHorizontal: 18, marginTop: 8 }}>
        <MaterialCommunityIcons name="steering" size={22} color={C.haze} />
        <Row>
          <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: C.lantern, marginRight: 6 }} />
          <T v="tiny" color={C.haze}>Door</T>
        </Row>
      </Row>
    </View>
  );
}

function TrainEnds({ width }) {
  return (
    <>
      <View style={{ position: 'absolute', top: 8, width, alignItems: 'center' }}>
        <Row>
          <MaterialCommunityIcons name="door-sliding" size={16} color={C.haze} />
          <T v="tiny" color={C.haze} style={{ marginLeft: 6 }}>Vestibule</T>
        </Row>
      </View>
      <View style={{ position: 'absolute', bottom: 8, width, alignItems: 'center' }}>
        <Row>
          <MaterialCommunityIcons name="toilet" size={14} color={C.fog} />
          <T v="tiny" color={C.fog} style={{ marginLeft: 6 }}>Restroom</T>
        </Row>
      </View>
    </>
  );
}

function DeckRow({ row, deck, selected, extras, onSeat, onView, onZone }) {
  const gap = deck.gap;
  if (row.kind === 'exit') {
    return (
      <Row style={{ height: 22, justifyContent: 'space-between', width: deckGeometry(deck).innerW }}>
        <View style={styles.exitMark}><T v="tiny" color={C.night} style={{ fontSize: 9 }}>Exit</T></View>
        <View style={{ flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 0.5, borderColor: 'rgba(245,182,91,0.4)', marginHorizontal: 6 }} />
        <View style={styles.exitMark}><T v="tiny" color={C.night} style={{ fontSize: 9 }}>Exit</T></View>
      </Row>
    );
  }
  if (row.kind === 'zone') {
    const on = !!extras[row.zone.id];
    return (
      <Pressable onPress={() => onZone(row.zone)} style={[styles.zone, { width: deckGeometry(deck).innerW, marginBottom: deck.rowGap }, on && styles.zoneOn]}>
        <View style={[styles.zoneIcon, on && { backgroundColor: C.lagoon }]}>
          <Feather name={on ? 'check' : row.zone.icon} size={16} color={on ? C.night : C.lagoon} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <T v="label" style={{ fontFamily: F.bold }}>{row.zone.title}</T>
          <T v="tiny" color={C.haze} numberOfLines={1}>{on ? 'Added to your booking' : row.zone.sub}</T>
        </View>
        <Feather name="chevron-right" size={16} color={C.haze} />
      </Pressable>
    );
  }
  if (row.kind === 'table') {
    return (
      <Row style={{ height: 12, marginBottom: deck.rowGap }}>
        {row.pattern.split('').map((ch, i) => (
          <View key={i} style={{ width: ch === '_' ? deck.aisleW : deck.seatW, height: 8, marginRight: i < row.pattern.length - 1 ? gap : 0, borderRadius: 3, backgroundColor: ch === '_' ? 'transparent' : 'rgba(235,210,166,0.28)' }} />
        ))}
      </Row>
    );
  }
  if (row.kind === 'cabin') {
    const [l1, u1, l2, u2] = row.cells;
    const berth = (c) => (
      <Seat key={c.key} cell={c} deck={deck} w={deck.seatW} h={deck.seatH} selected={selected.some((s) => s.id === c.id)} onPress={onSeat} onLong={onView} />
    );
    return (
      <View style={[styles.cabin, { marginBottom: deck.rowGap }]}>
        <T v="tiny" color={C.haze} style={{ marginBottom: 5 }}>{row.label}</T>
        <Row center={false}>
          <View>
            <Row>{berth(l1)}<View style={{ width: gap }} />{berth(l2)}</Row>
            <View style={{ height: 6 }} />
            <Row>{berth(u1)}<View style={{ width: gap }} />{berth(u2)}</Row>
          </View>
          <View style={{ width: deck.aisleW, alignSelf: 'stretch', marginLeft: gap, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(238,241,251,0.18)' }} />
        </Row>
      </View>
    );
  }
  let labelled = false;
  return (
    <Row style={{ marginBottom: deck.rowGap }}>
      {row.cells.map((c, i) => {
        const mr = i < row.cells.length - 1 ? gap : 0;
        if (c.kind !== 'seat') {
          const show = !labelled;
          labelled = true;
          return (
            <View key={c.key} style={{ width: deck.aisleW, marginRight: mr, alignItems: 'center' }}>
              {show ? <T v="tiny" color={C.fog}>{row.label}</T> : null}
            </View>
          );
        }
        return (
          <View key={c.key} style={{ marginRight: mr }}>
            <Seat cell={c} deck={deck} w={deck.seatW} h={deck.seatH} selected={selected.some((s) => s.id === c.id)} onPress={onSeat} onLong={onView} />
          </View>
        );
      })}
    </Row>
  );
}

const Seat = React.memo(function Seat({ cell, deck, w, h, selected, onPress, onLong }) {
  const s = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(lift, { toValue: selected ? 1 : 0, useNativeDriver: true, damping: 10, stiffness: 220 }).start();
  }, [selected]);
  const press = () => {
    if (cell.taken) {
      haptic.warn();
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }
    Animated.sequence([
      Animated.timing(s, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    onPress(cell);
  };
  const isPremium = !cell.taken && !!cell.tag && /legroom|exit|front|solo|window pod|window suite|lower/i.test(cell.tag);
  const fill = cell.taken ? C.taken : selected ? C.lantern : isPremium ? 'rgba(63,216,230,0.12)' : 'rgba(238,241,251,0.09)';
  const border = cell.taken ? C.taken : selected ? C.lantern : isPremium ? C.lagoon : 'rgba(238,241,251,0.42)';
  const back = cell.taken ? '#353E78' : selected ? '#FFD893' : isPremium ? 'rgba(63,216,230,0.28)' : 'rgba(238,241,251,0.2)';
  const ty = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const sc = Animated.multiply(s, lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }));
  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] });
  const rot = `${cell.rotate || 0}deg`;
  const label = selected ? cell.letter : null;

  return (
    <Pressable onPress={press} onLongPress={() => onLong(cell)} delayLongPress={320} hitSlop={2}>
      <Animated.View style={[{ width: w, height: h, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }, { rotate: rot }] }, selected && glow(C.lantern)]}>
        <SeatShape style={deck.style} w={w} h={h} fill={fill} border={border} back={back} taken={cell.taken} selected={selected} label={label} />
      </Animated.View>
    </Pressable>
  );
});

function SeatShape({ style, w, h, fill, border, back, taken, selected, label }) {
  const ink = selected ? C.night : C.haze;
  if (style === 'biz') {
    return (
      <View style={{ flex: 1, borderRadius: 12, backgroundColor: fill, borderWidth: 1.3, borderColor: border, padding: 4 }}>
        <View style={{ height: 5, borderRadius: 2, backgroundColor: back, marginHorizontal: 6 }} />
        <View style={{ flex: 1, marginTop: 4, borderRadius: 9, backgroundColor: back, alignItems: 'center', justifyContent: 'center' }}>
          {taken ? <Feather name="x" size={12} color={C.fog} /> : label ? <T v="tiny" color={ink} style={{ fontFamily: F.xbold }}>{label}</T> : <MaterialCommunityIcons name="bed-outline" size={14} color={ink} />}
        </View>
      </View>
    );
  }
  if (style === 'first') {
    return (
      <View style={{ flex: 1, borderRadius: 14, backgroundColor: fill, borderWidth: 1.3, borderColor: border, padding: 6, flexDirection: 'row' }}>
        <View style={{ flex: 1, borderRadius: 10, backgroundColor: back, alignItems: 'center', justifyContent: 'center' }}>
          {taken ? <Feather name="x" size={14} color={C.fog} /> : label ? <T v="label" color={ink} style={{ fontFamily: F.xbold }}>{label}</T> : <MaterialCommunityIcons name="bed-king-outline" size={20} color={ink} />}
        </View>
        <View style={{ width: 3, marginLeft: 4, borderRadius: 2, backgroundColor: selected ? C.night : 'rgba(245,182,91,0.6)' }} />
      </View>
    );
  }
  if (style === 'sleeper') {
    return (
      <View style={{ flex: 1, borderRadius: 7, backgroundColor: fill, borderWidth: 1.2, borderColor: border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
        <View style={{ width: 12, height: h - 10, borderRadius: 4, backgroundColor: back }} />
        <T v="tiny" color={taken ? C.fog : ink} style={{ marginLeft: 6, fontSize: 10, fontFamily: F.bold }}>{taken ? 'Taken' : label || ''}</T>
      </View>
    );
  }
  if (style === 'busRoyal' || style === 'trainFirst') {
    return (
      <View style={{ flex: 1, borderRadius: 18, backgroundColor: fill, borderWidth: 1.3, borderColor: border, padding: 5 }}>
        <View style={{ height: h * 0.32, borderRadius: 12, backgroundColor: back, marginHorizontal: 6 }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {taken ? <Feather name="x" size={12} color={C.fog} /> : label ? <T v="tiny" color={ink} style={{ fontFamily: F.xbold }}>{label}</T> : null}
        </View>
      </View>
    );
  }
  const arm = style === 'busExec' || style === 'trainBiz';
  return (
    <View style={{ flex: 1, borderRadius: arm ? 9 : 7, backgroundColor: fill, borderWidth: 1.2, borderColor: border, paddingHorizontal: arm ? 4 : 2, paddingTop: 2 }}>
      <View style={{ height: h * 0.4, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderRadius: 3, backgroundColor: back }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {taken ? <Feather name="x" size={9} color={C.fog} /> : label ? <T v="tiny" color={ink} style={{ fontSize: 9, fontFamily: F.xbold }}>{label}</T> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, overflow: 'hidden', marginTop: 6 },
  walkBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, height: 32, paddingHorizontal: 12, borderRadius: R.pill, backgroundColor: C.sand },
  camBar: { position: 'absolute', top: 4, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(11,16,40,0.78)', borderRadius: R.pill, padding: 3, borderWidth: 1, borderColor: 'rgba(235,210,166,0.14)' },
  camBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, height: 28, borderRadius: R.pill },
  camOn: { backgroundColor: C.sand },
  hint: { position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(11,16,40,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill },
  tray: { paddingHorizontal: 18, paddingTop: 14, backgroundColor: 'rgba(11,16,40,0.96)', borderTopLeftRadius: R.l, borderTopRightRadius: R.l, borderTopWidth: 1, borderColor: 'rgba(235,210,166,0.14)' },
  seatTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.lantern, borderRadius: R.pill, paddingHorizontal: 11, height: 30, marginRight: 6 },
  exitMark: { backgroundColor: C.lantern, paddingHorizontal: 5, borderRadius: 4 },
  zone: { height: 66, borderRadius: 16, borderWidth: 1.2, borderStyle: 'dashed', borderColor: 'rgba(63,216,230,0.6)', backgroundColor: 'rgba(63,216,230,0.06)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  zoneOn: { borderStyle: 'solid', backgroundColor: 'rgba(63,216,230,0.16)' },
  zoneIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.lagoon, alignItems: 'center', justifyContent: 'center' },
  cabin: { padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(235,210,166,0.3)', backgroundColor: 'rgba(235,210,166,0.04)' },
  galley: { flexDirection: 'row', alignItems: 'center', marginTop: 6, opacity: 0.8 },
  viewWrap: { justifyContent: 'space-between' },
  viewBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.sand, borderRadius: R.pill, paddingHorizontal: 12, height: 34 },
  viewCard: { marginHorizontal: 16, padding: 18, borderRadius: R.l, backgroundColor: 'rgba(11,16,40,0.9)', borderWidth: 1, borderColor: 'rgba(235,210,166,0.2)' },
  zoneImgWrap: { height: 190, borderTopLeftRadius: 100, borderTopRightRadius: 100, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' },
});
