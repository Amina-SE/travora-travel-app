import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, PanResponder, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { C, F, R, SCREEN_H, SCREEN_W, money } from '../theme';
import { HOTELS, IMG, fmtDate, findRoomHotel } from '../data';
import { Sheet } from '../sheet';
import FareCalendar from '../components/FareCalendar';
import { ArchImage, Btn, Chip, IconBtn, Pressy, Row, Stars, Stepper, T, haptic, useInsets, Photo, FILL } from '../ui';
import { useStore } from '../store';
import { META } from '../imageMeta';

const AMENITY_ICON = {
  'Infinity pool': 'pool', 'Private beach': 'beach', Spa: 'spa-outline', 'Kids club': 'human-child', 'Fine dining': 'silverware-fork-knife',
  Gym: 'dumbbell', 'Rooftop bar': 'glass-cocktail', Hammam: 'hot-tub', Breakfast: 'coffee-outline', 'Airport shuttle': 'van-passenger',
  'Overwater deck': 'waves', 'Snorkel trips': 'diving-snorkel', 'Sunset bar': 'weather-sunset',
  'Rooftop pool': 'pool', Onsen: 'hot-tub', Concierge: 'bell-outline',
};
const HERO_H = SCREEN_H * 0.62;

export function HotelScreen({ nav, params }) {
  const store = useStore();
  const insets = useInsets();
  const [hotelId, setHotelId] = useState(params.hotelId || 'h1');
  const hotel = HOTELS.find((h) => h.id === hotelId);
  const y = useRef(new Animated.Value(0)).current;
  const swap = useRef(new Animated.Value(1)).current;
  const saved = store.saved.includes(hotel.id);

  const changeHotel = (id) => {
    if (id === hotelId) return;
    Animated.timing(swap, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setHotelId(id);
      Animated.timing(swap, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  };

  const heroY = y.interpolate({ inputRange: [-200, 0, HERO_H], outputRange: [-60, 0, HERO_H * 0.45], extrapolateRight: 'clamp' });
  const heroS = y.interpolate({ inputRange: [-200, 0], outputRange: [1.35, 1], extrapolate: 'clamp' });
  const barBg = y.interpolate({ inputRange: [HERO_H * 0.5, HERO_H * 0.8], outputRange: [0, 1], extrapolate: 'clamp' });
  const titleO = y.interpolate({ inputRange: [-80, 0, 200], outputRange: [1, 1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={{ height: HERO_H, overflow: 'hidden' }}>
          <Animated.Image source={hotel.cover} resizeMode="cover" style={[FILL, { opacity: swap, transform: [{ translateY: heroY }, { scale: heroS }] }]} />
          <LinearGradient colors={['rgba(11,16,40,0.45)', 'transparent', 'rgba(11,16,40,0.4)', C.night]} locations={[0, 0.25, 0.7, 1]} style={StyleSheet.absoluteFill} />
          <Animated.View style={{ position: 'absolute', left: 22, right: 22, bottom: 26, opacity: Animated.multiply(titleO, swap) }}>
            <Stars value={hotel.rating} size={13} />
            <T v="hero" style={{ marginTop: 8 }}>{hotel.name}</T>
            <Row style={{ marginTop: 8 }}>
              <Feather name="map-pin" size={14} color={C.sand} />
              <T v="small" color={C.sand} style={{ marginLeft: 6 }}>{hotel.city}</T>
              <T v="small" color={C.haze} style={{ marginLeft: 12 }}>{hotel.reviews.toLocaleString('en-US')} reviews</T>
            </Row>
          </Animated.View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4 }}>
          {HOTELS.map((h) => <Chip key={h.id} label={h.name} active={h.id === hotelId} onPress={() => changeHotel(h.id)} />)}
        </ScrollView>

        <Animated.View style={{ paddingHorizontal: 22, opacity: swap }}>
          <T v="bodyR" color={C.haze} style={{ marginTop: 18 }}>{hotel.tagline}</T>
          <View style={styles.amenities}>
            {hotel.amenities.map((a) => (
              <View key={a} style={styles.amenity}>
                <MaterialCommunityIcons name={AMENITY_ICON[a] || 'check'} size={22} color={C.sand} />
                <T v="tiny" color={C.mist} style={{ marginTop: 6, textAlign: 'center' }}>{a}</T>
              </View>
            ))}
          </View>

          <Row between style={{ marginTop: 26, marginBottom: 12 }}>
            <T v="h2">Choose your room</T>
            <T v="small" color={C.haze}>{hotel.rooms.length} types</T>
          </Row>
          {hotel.rooms.map((r) => (
            <Pressy key={r.id} onPress={() => nav.push('Room', { roomId: r.id })} style={{ marginBottom: 22 }} scaleTo={0.98}>
              <ArchImage source={IMG.rooms[r.img]} height={240}>
                <View style={styles.walk}>
                  <MaterialCommunityIcons name="rotate-3d-variant" size={15} color={C.night} />
                  <T v="tiny" color={C.night} style={{ marginLeft: 6, fontFamily: F.xbold }}>Walk through</T>
                </View>
              </ArchImage>
              <Row between style={{ marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <T v="h3">{r.name}</T>
                  <T v="tiny" color={C.haze} style={{ marginTop: 3 }}>{r.size} m², {r.beds}, up to {r.guests} guests</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T v="h3" color={C.sand}>{money(r.price)}</T>
                  <T v="tiny" color={C.haze}>a night</T>
                </View>
              </Row>
            </Pressy>
          ))}

          <T v="h2" style={{ marginTop: 6, marginBottom: 12 }}>Good to know</T>
          {[
            ['clock', 'Check-in from 15:00, check-out by 12:00'],
            ['shield', 'Free cancellation up to 48 hours before arrival'],
            ['wifi', 'Fast Wi-Fi in every room and by the pool'],
          ].map(([i, t]) => (
            <Row key={t} style={{ marginBottom: 12 }}>
              <Feather name={i} size={16} color={C.lagoon} />
              <T v="small" color={C.mist} style={{ marginLeft: 10, flex: 1 }}>{t}</T>
            </Row>
          ))}
        </Animated.View>
      </Animated.ScrollView>

      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,16,40,0.96)', opacity: barBg }]} />
        <IconBtn name="chevron-left" size={22} onPress={() => nav.pop()} />
        <Animated.View style={{ flex: 1, alignItems: 'center', opacity: barBg }}>
          <T v="h3" numberOfLines={1}>{hotel.name}</T>
        </Animated.View>
        <IconBtn name="share-2" size={18} onPress={() => Share.share({ message: `${hotel.name}, ${hotel.city}. Found on Travora.` }).catch(() => {})} style={{ marginRight: 8 }} />
        <IconBtn name="heart" size={18} color={saved ? C.danger : C.mist} onPress={() => { haptic.soft(); store.toggleSaved(hotel.id); }} />
      </View>
    </View>
  );
}

// Immersive room: the photo is wider than the screen; drag to look around,
// tap the glowing points for details.
export function RoomScreen({ nav, params }) {
  const store = useStore();
  const insets = useInsets();
  const [roomId, setRoomId] = useState(params.roomId);
  const { hotel, room } = findRoomHotel(roomId);
  const [spot, setSpot] = useState(null);
  const [open, setOpen] = useState(true);
  const [checkIn, setCheckIn] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; });
  const [calOpen, setCalOpen] = useState(false);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);

  const meta = META.get(IMG.rooms[room.img]) || { r: 1.3, fx: 0.5, fy: 0.55 };
  const imgH = SCREEN_H * 1.04;
  const imgW = Math.max(SCREEN_W * 1.6, imgH * meta.r);
  const minX = -(imgW - SCREEN_W);
  // start the camera looking at the bed
  const startX = Math.max(minX, Math.min(0, SCREEN_W / 2 - meta.fx * imgW));
  const [panelH, setPanelH] = useState(SCREEN_H * 0.55);
  const PEEK = 96 + insets.bottom;
  const clampY = (v, visible) => Math.max(-(imgH - visible), Math.min(0, v));
  const openVisible = SCREEN_H - panelH + 28;
  const closedVisible = SCREEN_H - PEEK + 28;
  const openY = clampY(openVisible / 2 - meta.fy * imgH, openVisible);
  const closedY = clampY(closedVisible / 2 - meta.fy * imgH, closedVisible);
  const px = useRef(new Animated.Value(startX)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const py = useRef(new Animated.Value(0)).current;
  const intro = useRef(new Animated.Value(0)).current;
  const swap = useRef(new Animated.Value(1)).current;
  const panel = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const cur = useRef({ x: startX, y: 0, sx: 0, sy: 0 });
  const bounds = useRef({ minX });
  bounds.current = { minX };

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  const enter = () => {
    intro.setValue(0);
    px.setValue(Math.min(0, startX + SCREEN_W * 0.35));
    cur.current.x = startX;
    Animated.parallel([
      Animated.timing(intro, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(px, { toValue: startX, duration: 1700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };
  useEffect(enter, [roomId]);

  useEffect(() => {
    Animated.spring(panel, { toValue: open ? 1 : 0, useNativeDriver: true, damping: 20, stiffness: 160 }).start();
  }, [open]);

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
        const { minX: mn } = bounds.current;
        let x = cur.current.sx + g.dx;
        if (x > 0) x = x * 0.3;
        if (x < mn) x = mn + (x - mn) * 0.3;
        const yv = Math.max(-40, Math.min(40, cur.current.sy + g.dy * 0.4));
        cur.current.x = x;
        cur.current.y = yv;
        px.setValue(x);
        py.setValue(yv);
      },
      onPanResponderRelease: (_, g) => {
        const { minX: mn } = bounds.current;
        const target = Math.max(mn, Math.min(0, cur.current.x + g.vx * 220));
        cur.current.x = target;
        cur.current.y = 0;
        Animated.spring(px, { toValue: target, useNativeDriver: true, damping: 24, stiffness: 80 }).start();
        Animated.spring(py, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 70 }).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Booking panel: tap or swipe the header to open/close; it follows your finger.
  const openRef = useRef(open);
  openRef.current = open;
  const sheetPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        const d = openRef.current ? Math.max(0, g.dy) : Math.min(0, g.dy);
        dragY.setValue(d);
      },
      onPanResponderRelease: (_, g) => {
        const tap = Math.abs(g.dy) < 6 && Math.abs(g.dx) < 6;
        let next = openRef.current;
        if (tap) next = !openRef.current;
        else if (g.dy > 50 || g.vy > 0.6) next = false;
        else if (g.dy < -50 || g.vy < -0.6) next = true;
        haptic.soft();
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 160 }).start();
        setOpen(next);
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const switchRoom = (id) => {
    if (id === roomId) return;
    haptic.tap();
    Animated.timing(swap, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setRoomId(id);
      setSpot(null);
      Animated.timing(swap, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    });
  };

  const total = room.price * nights;
  const checkOut = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + nights);
  const taxes = Math.round(total * 0.12);
  const saved = store.saved.includes(room.id);

  const reserve = () => {
    haptic.ok();
    nav.push('Checkout', {
      draft: {
        type: 'hotel',
        title: room.name,
        subtitle: hotel.name,
        className: hotel.name,
        location: hotel.city,
        date: checkIn.toISOString(),
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        nights,
        guests,
        lines: [{ label: `${nights} ${nights === 1 ? 'night' : 'nights'} at ${money(room.price)}`, amount: total }],
        subtotal: total,
        image: IMG.rooms[room.img],
        imageKey: `room.${room.img}`,
      },
    });
  };

  const scaleIntro = intro.interpolate({ inputRange: [0, 1], outputRange: [1.35, 1.06] });
  const panelY = Animated.add(panel.interpolate({ inputRange: [0, 1], outputRange: [Math.max(0, panelH - PEEK), 0] }), dragY);
  const baseY = panel.interpolate({ inputRange: [0, 1], outputRange: [closedY, openY] });
  const chevron = panel.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const ring = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });
  const ringO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
        <Animated.View style={{ width: imgW, height: imgH, opacity: swap, transform: [{ translateX: px }, { translateY: Animated.add(py, baseY) }, { scale: scaleIntro }] }}>
          <Image source={IMG.rooms[room.img]} style={{ width: imgW, height: imgH }} resizeMode="cover" />
          {room.hotspots.map((h, i) => (
            <Pressable key={i} onPress={() => { haptic.soft(); setSpot(spot === i ? null : i); }} style={[styles.spot, { left: h.x * imgW - 22, top: h.y * imgH - 22 }]} hitSlop={8}>
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
        <LinearGradient pointerEvents="none" colors={['rgba(11,16,40,0.75)', 'transparent', 'transparent', 'rgba(11,16,40,0.85)']} locations={[0, 0.2, 0.5, 1]} style={StyleSheet.absoluteFill} />
      </View>

      <View style={[styles.roomTop, { paddingTop: insets.top + 6 }]}>
        <IconBtn name="chevron-left" size={22} onPress={() => nav.pop()} />
        <View style={styles.dragHint}>
          <MaterialCommunityIcons name="gesture-swipe-horizontal" size={15} color={C.sand} />
          <T v="tiny" color={C.mist} style={{ marginLeft: 6 }}>Drag to look around</T>
        </View>
        <IconBtn name="heart" size={18} color={saved ? C.danger : C.mist} onPress={() => { haptic.soft(); store.toggleSaved(room.id); }} />
      </View>

      <Animated.View onLayout={(e) => setPanelH(e.nativeEvent.layout.height)} style={[styles.panel, { paddingBottom: insets.bottom + 14, transform: [{ translateY: panelY }] }]}>
        <View {...sheetPan.panHandlers}>
        <View style={styles.panelHandle}>
          <View style={styles.grab} />
          <Animated.View style={{ position: 'absolute', right: 0, top: 2, transform: [{ rotate: chevron }] }}>
            <View style={styles.chevBtn}><Feather name="chevron-up" size={18} color={C.night} /></View>
          </Animated.View>
        </View>
        <Row between>
          <View style={{ flex: 1 }}>
            <T v="h2" numberOfLines={1}>{room.name}</T>
            <T v="tiny" color={C.haze}>{hotel.name}, {room.view}</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T v="h2" color={C.sand}>{money(room.price)}</T>
            <T v="tiny" color={C.haze}>a night</T>
          </View>
        </Row>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18 }}>
          {hotel.rooms.map((r) => (
            <Pressable key={r.id} onPress={() => switchRoom(r.id)} style={[styles.thumb, r.id === roomId && styles.thumbOn]}>
              <Photo source={IMG.rooms[r.img]} style={styles.thumbImg} />
            </Pressable>
          ))}
          <View style={{ justifyContent: 'center', marginLeft: 6 }}>
            {[`${room.size} m²`, room.beds, `Up to ${room.guests}`].map((t) => <T key={t} v="tiny" color={C.haze}>{t}</T>)}
          </View>
        </ScrollView>
        <Pressable onPress={() => { haptic.tap(); setCalOpen(true); }} style={styles.stayCard}>
          <View style={styles.stayIcon}><Feather name="calendar" size={18} color={C.night} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T v="tiny" color={C.haze}>Check-in to check-out</T>
            <T v="label" style={{ fontFamily: F.bold }}>{fmtDate(checkIn)} to {fmtDate(checkOut)}</T>
          </View>
          <T v="tiny" color={C.lagoon} style={{ fontFamily: F.bold }}>Change</T>
        </Pressable>
        <Row between style={{ marginTop: 12 }}>
          <View>
            <T v="tiny" color={C.haze}>Nights</T>
            <Stepper value={nights} onChange={setNights} min={1} max={14} />
          </View>
          <View>
            <T v="tiny" color={C.haze}>Guests</T>
            <Stepper value={guests} onChange={setGuests} min={1} max={room.guests} />
          </View>
        </Row>
        <Row between style={{ marginTop: 14 }}>
          <View>
            <T v="tiny" color={C.haze}>{fmtDate(checkIn)} to {fmtDate(checkOut)}</T>
            <T v="h3" color={C.sand}>{money(total)} <T v="tiny" color={C.haze}>+ {money(taxes)} taxes</T></T>
          </View>
          <Btn title="Reserve" onPress={reserve} style={{ paddingHorizontal: 28 }} />
        </Row>
      </Animated.View>
      <Sheet visible={calOpen} onClose={() => setCalOpen(false)}>
        {calOpen ? (
          <FareCalendar
            value={checkIn}
            title="Check-in date"
            subtitle={`${room.name}, ${nights} ${nights === 1 ? 'night' : 'nights'} highlighted`}
            verb="Check in"
            rangeDays={nights}
            fareFor={() => room.price}
            onConfirm={(d) => { setCheckIn(d); setCalOpen(false); }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, marginHorizontal: -4 },
  amenity: { width: (SCREEN_W - 44 - 24) / 3, margin: 4, paddingVertical: 14, borderRadius: R.m, backgroundColor: C.dusk, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(44,54,112,0.6)' },
  walk: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: C.sand, borderRadius: R.pill, paddingHorizontal: 12, height: 32 },
  roomTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  dragHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(11,16,40,0.7)', borderRadius: R.pill, paddingHorizontal: 12, height: 32 },
  spot: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  spotRing: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.sand },
  spotDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', top: 2, width: 190, padding: 10, borderRadius: 12, backgroundColor: 'rgba(11,16,40,0.92)', borderWidth: 1, borderColor: 'rgba(235,210,166,0.35)' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, backgroundColor: 'rgba(11,16,40,0.97)', borderTopLeftRadius: R.l, borderTopRightRadius: R.l, borderTopWidth: 1, borderColor: 'rgba(235,210,166,0.16)' },
  panelHandle: { alignItems: 'center', paddingVertical: 12, minHeight: 40 },
  chevBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: C.line },
  thumb: { width: 62, height: 62, borderRadius: 14, marginRight: 8, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbOn: { borderColor: C.lantern },
  thumbImg: { width: '100%', height: '100%' },
  stayCard: { flexDirection: 'row', alignItems: 'center', marginTop: 14, padding: 12, borderRadius: R.m, backgroundColor: C.dusk, borderWidth: 1, borderColor: 'rgba(245,182,91,0.35)' },
  stayIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.lantern, alignItems: 'center', justifyContent: 'center' },
  miniDay: { width: 46, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 6, backgroundColor: C.dusk },
  miniDayRange: { backgroundColor: 'rgba(245,182,91,0.22)' },
  miniDayOn: { backgroundColor: C.lantern },
  reopen: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: C.sand, borderRadius: R.pill, paddingHorizontal: 18, height: 46 },
});
