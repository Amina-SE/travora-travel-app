import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { signOutSocial } from '../auth/social';
import { C, F, R, SCREEN_W, money, shadow } from '../theme';
import { HOTELS, IMG, fmtDate, findRoomHotel } from '../data';
import { ArchImage, Btn, Empty, IconBtn, Input, Pressy, Rise, Row, Segmented, Stars, T, haptic, useInsets, Photo } from '../ui';
import { Sheet } from '../sheet';
import { useStore } from '../store';
import { MODE_ICON, bookingImage } from '../components/BookingBits';

const TABS = [
  { id: 'home', icon: 'compass', label: 'Explore' },
  { id: 'trips', icon: 'briefcase', label: 'Trips' },
  { id: 'saved', icon: 'heart', label: 'Saved' },
  { id: 'profile', icon: 'user', label: 'Profile' },
];

export default function MainScreen({ nav, params }) {
  const [tab, setTabRaw] = useState(params.tab || 'home');
  const prevTab = useRef('home');
  const setTab = (t) => { setTabRaw((cur) => { if (cur !== t) prevTab.current = cur; return t; }); };
  const goBack = () => setTabRaw((cur) => { const back = prevTab.current && prevTab.current !== cur ? prevTab.current : 'home'; prevTab.current = 'home'; return back; });
  const insets = useInsets();
  const idx = TABS.findIndex((t) => t.id === tab);
  const x = useRef(new Animated.Value(idx)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const barW = SCREEN_W - 40;
  const itemW = (barW - 12) / TABS.length;

  useEffect(() => {
    Animated.spring(x, { toValue: idx, useNativeDriver: true, damping: 18, stiffness: 200 }).start();
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [idx]);

  useEffect(() => {
    if (params.tab) setTabRaw(params.tab);
  }, [params.tab]);

  const Body = { home: HomeTab, trips: TripsTab, saved: SavedTab, profile: ProfileTab }[tab];
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
        <Body nav={nav} goTab={setTab} goBack={goBack} />
      </Animated.View>
      <View style={[styles.tabbar, { bottom: insets.bottom + 12, width: barW }, shadow('#000', 12, 24, 0.5)]}>
        <Animated.View style={[styles.tabPill, { width: itemW, transform: [{ translateX: x.interpolate({ inputRange: [0, TABS.length - 1], outputRange: [0, itemW * (TABS.length - 1)] }) }] }]} />
        {TABS.map((t) => (
          <Pressable key={t.id} style={[styles.tabItem, { width: itemW }]} onPress={() => { haptic.tap(); setTab(t.id); }}>
            <Feather name={t.icon} size={19} color={t.id === tab ? C.night : C.haze} />
            {t.id === tab ? <T v="tiny" color={C.night} style={{ marginLeft: 6, fontFamily: F.xbold }}>{t.label}</T> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const MODES = [
  { id: 'flight', label: 'Flights', icon: 'airplane', go: (nav) => nav.push('Search', { mode: 'flight' }) },
  { id: 'hotel', label: 'Stays', icon: 'bed-king-outline', go: (nav) => nav.push('Hotel', { hotelId: 'h1' }) },
  { id: 'bus', label: 'Coaches', icon: 'bus-side', go: (nav) => nav.push('Search', { mode: 'bus' }) },
  { id: 'train', label: 'Trains', icon: 'train', go: (nav) => nav.push('Search', { mode: 'train' }) },
  { id: 'car', label: 'Cars', icon: 'car-sports', go: (nav) => nav.push('Cars') },
];

// A travel mode tile on Home. It flashes sand-yellow while pressed to confirm the tap,
// then fades back to its normal colour; no tile stays selected.
function ModeTile({ mode, onPress }) {
  const a = useRef(new Animated.Value(0)).current;
  const [lit, setLit] = useState(false);
  const flash = () => {
    a.stopAnimation();
    setLit(true);
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 120, useNativeDriver: false }),
      Animated.delay(260),
      Animated.timing(a, { toValue: 0, duration: 420, useNativeDriver: false }),
    ]).start(() => setLit(false));
  };
  const bg = a.interpolate({ inputRange: [0, 1], outputRange: [C.dusk, C.sand] });
  const border = a.interpolate({ inputRange: [0, 1], outputRange: [C.line, C.sand] });
  return (
    <Pressy onPressIn={flash} onPress={onPress} style={{ marginHorizontal: 4 }}>
      <Animated.View style={[styles.modeTile, { marginHorizontal: 0, backgroundColor: bg, borderColor: border }]}>
        <MaterialCommunityIcons name={mode.icon} size={28} color={lit ? C.night : C.sand} />
        <T v="label" color={lit ? C.night : C.mist} style={{ marginTop: 14, fontFamily: F.bold }}>{mode.label}</T>
      </Animated.View>
    </Pressy>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function HomeTab({ nav, goTab }) {
  const store = useStore();
  const insets = useInsets();
  const first = (store.user?.name || 'Traveller').split(' ')[0];
  const next = store.bookings.find((b) => b.status === 'confirmed' && new Date(b.date || b.checkIn) >= new Date(new Date().toDateString()));
  const hotel = HOTELS[0];
  const cabins = [
    { img: IMG.flight.first, title: 'First suites', sub: 'Doors, a bed and an onboard lounge', go: () => nav.push('Walkthrough', { mode: 'flight', cls: 'first', then: 'search', pickLabel: 'Book' }) },
    { img: IMG.flight.business, title: 'Business pods', sub: 'Lie-flat with lounge bar access', go: () => nav.push('Walkthrough', { mode: 'flight', cls: 'business', then: 'search', pickLabel: 'Book' }) },
    { img: IMG.bus.royal, title: 'Royal Lounge coach', sub: 'Captain recliners on the highway', go: () => nav.push('Walkthrough', { mode: 'bus', cls: 'royal', then: 'search', pickLabel: 'Book' }) },
    { img: IMG.train.first, title: 'First class rail', sub: '1+1 recliners and a dining car', go: () => nav.push('Walkthrough', { mode: 'train', cls: 'first', then: 'search', pickLabel: 'Book' }) },
    { img: IMG.bus.executive, title: 'Executive coach', sub: '2+1 leather under ambient light', go: () => nav.push('Walkthrough', { mode: 'bus', cls: 'executive', then: 'search', pickLabel: 'Book' }) },
  ];
  const rooms = HOTELS.flatMap((h) => h.rooms.map((r) => ({ ...r, hotel: h }))).slice(0, 8);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }}>
      <Row between style={{ paddingHorizontal: 22 }}>
        <Row>
          <View style={styles.avatar}><T v="label" color={C.night} style={{ fontFamily: F.xbold }}>{first[0]}</T></View>
          <View style={{ marginLeft: 10 }}>
            <T v="small" color={C.haze}>{greeting()}</T>
            <T v="h3">{first}</T>
          </View>
        </Row>
        <Pressy onPress={() => goTab('trips')} style={styles.bell}>
          <Feather name="bell" size={19} color={C.mist} />
          {next ? <View style={styles.bellDot} /> : null}
        </Pressy>
      </Row>

      <Rise delay={80} style={{ paddingHorizontal: 22, marginTop: 26 }}>
        <T v="hero">Where to{'\n'}next?</T>
      </Rise>

      <Rise delay={180}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 22 }}>
          {MODES.map((m) => (
            <ModeTile key={m.id} mode={m} onPress={() => setTimeout(() => m.go(nav), 140)} />
          ))}
        </ScrollView>
      </Rise>

      {next ? (
        <Pressy onPress={() => nav.push('Ticket', { id: next.id })} style={styles.nextTrip}>
          <View style={styles.nextIcon}><MaterialCommunityIcons name={MODE_ICON[next.type]} size={20} color={C.night} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T v="tiny" color={C.lagoon}>Your next trip</T>
            <T v="label" numberOfLines={1} style={{ fontFamily: F.bold }}>{next.title}</T>
            <T v="tiny" color={C.haze}>{fmtDate(next.date || next.checkIn)}{next.depart ? `, ${next.depart}` : ''}</T>
          </View>
          <Feather name="chevron-right" size={18} color={C.haze} />
        </Pressy>
      ) : null}

      <View style={{ paddingHorizontal: 22, marginTop: 30 }}>
        <Row between style={{ marginBottom: 12 }}>
          <T v="h2">Tonight’s stay</T>
          <Pressy onPress={() => nav.push('Hotel', { hotelId: hotel.id })}><T v="label" color={C.sand}>Open resort</T></Pressy>
        </Row>
        <Pressy onPress={() => nav.push('Hotel', { hotelId: hotel.id })} scaleTo={0.98}>
          <ArchImage source={hotel.cover} height={340}>
            <LinearGradient colors={['transparent', 'rgba(11,16,40,0.92)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
            <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
              <Stars value={hotel.rating} />
              <T v="h2" style={{ marginTop: 6 }}>{hotel.name}</T>
              <Row between style={{ marginTop: 4 }}>
                <T v="small" color={C.haze}>{hotel.city}</T>
                <T v="label" color={C.sand}>from {money(hotel.from)} a night</T>
              </Row>
            </View>
          </ArchImage>
        </Pressy>
      </View>

      <View style={{ marginTop: 30 }}>
        <View style={{ paddingHorizontal: 22, marginBottom: 12 }}>
          <T v="h2">Step inside a cabin</T>
          <T v="small" color={C.haze} style={{ marginTop: 2 }}>Walk through it first, then book your seat</T>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }} decelerationRate="fast" snapToInterval={232}>
          {cabins.map((c) => (
            <Pressy key={c.title} onPress={c.go} style={styles.cabinCard}>
              <Photo source={c.img} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['transparent', 'rgba(11,16,40,0.95)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
              <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
                <T v="h3">{c.title}</T>
                <T v="tiny" color={C.haze} style={{ marginTop: 3 }}>{c.sub}</T>
              </View>
            </Pressy>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: 30 }}>
        <View style={{ paddingHorizontal: 22, marginBottom: 12 }}>
          <T v="h2">Rooms to wander</T>
          <T v="small" color={C.haze} style={{ marginTop: 2 }}>Open one and drag to look around</T>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
          {rooms.map((r) => (
            <Pressy key={r.id} onPress={() => nav.push('Room', { roomId: r.id })} style={{ width: 170, marginHorizontal: 4 }}>
              <ArchImage source={IMG.rooms[r.img]} height={200} radius={85} />
              <T v="label" numberOfLines={1} style={{ marginTop: 8, fontFamily: F.bold }}>{r.name}</T>
              <T v="tiny" color={C.haze}>{r.hotel.name}</T>
              <T v="label" color={C.sand} style={{ marginTop: 2 }}>{money(r.price)} <T v="tiny" color={C.haze}>a night</T></T>
            </Pressy>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

export function BookingCard({ b, onPress }) {
  const img = bookingImage(b);
  const statusColor = b.status === 'cancelled' ? C.danger : C.success;
  return (
    <Pressy onPress={onPress} style={styles.bookCard} scaleTo={0.98}>
      {img ? <Photo source={img} style={styles.bookImg} /> : (
        <View style={[styles.bookImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: C.dusk2 }]}>
          <MaterialCommunityIcons name={MODE_ICON[b.type]} size={28} color={C.sand} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Row between>
          <Row>
            <MaterialCommunityIcons name={MODE_ICON[b.type]} size={14} color={C.lagoon} />
            <T v="tiny" color={C.lagoon} style={{ marginLeft: 5 }}>{b.className || b.subtitle}</T>
          </Row>
          <View style={[styles.status, { borderColor: statusColor }]}><T v="tiny" color={statusColor} style={{ fontSize: 10 }}>{b.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}</T></View>
        </Row>
        <T v="label" numberOfLines={1} style={{ fontFamily: F.bold, marginTop: 4 }}>{b.title}</T>
        <T v="tiny" color={C.haze} numberOfLines={1}>{fmtDate(b.date || b.checkIn)}{b.depart ? `, ${b.depart}` : ''}</T>
        <Row between style={{ marginTop: 6 }}>
          <T v="tiny" color={C.fog}>Ref {b.ref}</T>
          <T v="label" color={C.sand}>{money(b.total)}</T>
        </Row>
      </View>
    </Pressy>
  );
}

function TripsTab({ nav, goTab, goBack }) {
  const store = useStore();
  const insets = useInsets();
  const [seg, setSeg] = useState('upcoming');
  const today = new Date(new Date().toDateString());
  const groups = useMemo(() => ({
    upcoming: store.bookings.filter((b) => b.status !== 'cancelled' && new Date(b.date || b.checkIn) >= today),
    past: store.bookings.filter((b) => b.status !== 'cancelled' && new Date(b.date || b.checkIn) < today),
    cancelled: store.bookings.filter((b) => b.status === 'cancelled'),
  }), [store.bookings]);
  const list = groups[seg];
  const spent = store.bookings.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}>
      <Row style={{ marginBottom: 14 }}>
        <IconBtn name="chevron-left" size={22} onPress={goBack} />
        <T v="label" color={C.haze} style={{ marginLeft: 12 }}>Order history</T>
      </Row>
      <T v="h1">Your trips</T>
      <T v="small" color={C.haze} style={{ marginTop: 4 }}>{store.bookings.length} bookings, {money(spent)} spent</T>
      <Segmented
        style={{ marginTop: 18, marginBottom: 16 }}
        value={seg}
        onChange={setSeg}
        options={[{ id: 'upcoming', label: `Upcoming ${groups.upcoming.length || ''}` }, { id: 'past', label: 'Past' }, { id: 'cancelled', label: 'Cancelled' }]}
      />
      {list.length ? list.map((b, i) => (
        <Rise key={b.id} delay={i * 60} distance={16}>
          <BookingCard b={b} onPress={() => nav.push('Ticket', { id: b.id })} />
        </Rise>
      )) : (
        <Empty
          icon={seg === 'cancelled' ? 'x-circle' : 'map'}
          title={seg === 'upcoming' ? 'No trips planned yet' : seg === 'past' ? 'No past trips' : 'Nothing cancelled'}
          body={seg === 'upcoming' ? 'Book a seat or a room and your e-ticket will appear here.' : 'Trips you’ve completed show up here with their receipts.'}
          action={seg === 'upcoming' ? 'Find a trip' : null}
          onAction={() => goTab('home')}
        />
      )}
    </ScrollView>
  );
}

function SavedTab({ nav, goTab }) {
  const store = useStore();
  const insets = useInsets();
  const hotels = HOTELS.filter((h) => store.saved.includes(h.id));
  const rooms = store.saved.map((id) => findRoomHotel(id)).filter((x) => x.room);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}>
      <T v="h1">Saved</T>
      <T v="small" color={C.haze} style={{ marginTop: 4, marginBottom: 18 }}>Stays and rooms you’ve hearted</T>
      {!hotels.length && !rooms.length ? (
        <Empty icon="heart" title="Nothing saved yet" body="Tap the heart on any stay or room to keep it here." action="Browse stays" onAction={() => nav.push('Hotel', { hotelId: 'h1' })} />
      ) : null}
      {hotels.map((h) => (
        <Pressy key={h.id} onPress={() => nav.push('Hotel', { hotelId: h.id })} style={{ marginBottom: 16 }} scaleTo={0.98}>
          <ArchImage source={h.cover} height={200} radius={100}>
            <LinearGradient colors={['transparent', 'rgba(11,16,40,0.9)']} style={StyleSheet.absoluteFill} />
            <View style={{ position: 'absolute', left: 16, bottom: 14, right: 16 }}>
              <T v="h3">{h.name}</T>
              <T v="tiny" color={C.haze}>{h.city}</T>
            </View>
          </ArchImage>
        </Pressy>
      ))}
      {rooms.map(({ room, hotel }) => (
        <Pressy key={room.id} onPress={() => nav.push('Room', { roomId: room.id })} style={styles.bookCard}>
          <Photo source={IMG.rooms[room.img]} style={styles.bookImg} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T v="label" style={{ fontFamily: F.bold }}>{room.name}</T>
            <T v="tiny" color={C.haze}>{hotel.name}</T>
            <T v="label" color={C.sand} style={{ marginTop: 6 }}>{money(room.price)} a night</T>
          </View>
          <Pressy onPress={() => store.toggleSaved(room.id)} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="heart" size={20} color={C.danger} />
          </Pressy>
        </Pressy>
      ))}
    </ScrollView>
  );
}

function MenuRow({ icon, label, value, onPress, right, danger }) {
  return (
    <Pressy onPress={onPress} style={styles.menuRow} scaleTo={0.98}>
      <View style={[styles.menuIcon, danger && { borderColor: 'rgba(255,122,138,0.4)' }]}><Feather name={icon} size={17} color={danger ? C.danger : C.sand} /></View>
      <T v="label" color={danger ? C.danger : C.mist} style={{ flex: 1, marginLeft: 12, fontFamily: F.bold }}>{label}</T>
      {value ? <T v="small" color={C.haze} style={{ marginRight: 8 }}>{value}</T> : null}
      {right || <Feather name="chevron-right" size={18} color={C.fog} />}
    </Pressy>
  );
}


function ProfileTab({ nav, goTab }) {
  const store = useStore();
  const insets = useInsets();
  const u = store.user || {};
  const initials = (u.name || 'T').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState('');
  const [delErr, setDelErr] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const closeDelete = () => { if (delBusy) return; setDelOpen(false); setDelPw(''); setDelErr(''); };
  const confirmDelete = async () => {
    setDelBusy(true);
    setDelErr('');
    try {
      await store.deleteAccount(delPw);
      await signOutSocial(u.provider);
      haptic.ok();
      setDelOpen(false);
      nav.reset('SignIn');
    } catch (error) {
      haptic.warn();
      setDelErr(error.message || 'Could not delete the account.');
    } finally {
      setDelBusy(false);
    }
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}>
      <View style={styles.profileHead}>
        <LinearGradient colors={['rgba(245,182,91,0.25)', 'rgba(63,216,230,0.08)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.bigAvatar}><T v="h2" color={C.night}>{initials}</T></View>
        <T v="h2" style={{ marginTop: 12 }}>{u.name}</T>
        <T v="small" color={C.haze}>{u.email}</T>
        {u.provider ? (
          <View style={styles.provBadge}>
            <AntDesign name={u.provider === 'apple' ? 'apple' : 'google'} size={12} color={C.night} />
            <T v="tiny" color={C.night} style={{ marginLeft: 5, fontFamily: F.xbold }}>Signed in with {u.provider === 'apple' ? 'Apple' : 'Google'}</T>
          </View>
        ) : null}
        <Row style={{ marginTop: 18 }}>
          {[
            { n: store.bookings.length, l: 'Trips' },
            { n: store.saved.length, l: 'Saved' },
            { n: store.cards.length, l: 'Cards' },
          ].map((s, i) => (
            <View key={s.l} style={[styles.stat, i === 1 && styles.statMid]}>
              <T v="h2" color={C.sand}>{s.n}</T>
              <T v="tiny" color={C.haze}>{s.l}</T>
            </View>
          ))}
        </Row>
      </View>
      <T v="label" color={C.fog} style={{ marginTop: 24, marginBottom: 8 }}>Account</T>
      <MenuRow icon="user" label="Personal details" onPress={() => nav.push('EditProfile')} />
      <MenuRow icon="credit-card" label="Payment methods" value={`${store.cards.length} saved`} onPress={() => nav.push('PaymentMethods')} />
      <MenuRow icon="map-pin" label="Billing address" value={store.billing.city || 'Add'} onPress={() => nav.push('Billing')} />
      <MenuRow icon="clock" label="Order history" value={`${store.bookings.length}`} onPress={() => goTab('trips')} />
      <T v="label" color={C.fog} style={{ marginTop: 20, marginBottom: 8 }}>Preferences</T>
      <MenuRow
        icon="bell"
        label="Trip notifications"
        onPress={() => store.setNotifications(!store.notifications)}
        right={<Switch value={store.notifications} onValueChange={store.setNotifications} trackColor={{ true: C.lantern, false: C.dusk2 }} thumbColor={C.mist} />}
      />
      <MenuRow icon="help-circle" label="Help and support" onPress={() => nav.push('Help')} />
     <MenuRow
  icon="log-out"
  label="Sign out"
  danger
  onPress={async () => {
    try {
      await signOutSocial(u.provider);
      await store.signOut();
      nav.reset('SignIn');
    } catch (error) {
      console.log('Logout error:', error);
    }
  }}
  right={<View />}
/>
      {!u.guest ? (
        <MenuRow icon="trash-2" label="Delete account" danger onPress={() => setDelOpen(true)} right={<View />} />
      ) : null}
      <Sheet visible={delOpen} onClose={closeDelete}>
        <View style={{ padding: 22 }}>
          <T v="h2">Delete your account?</T>
          <T v="body" color={C.haze} style={{ marginTop: 8 }}>
            This permanently removes your login, trips, saved stays, cards and billing details. It can’t be undone.
          </T>
          {!u.provider ? (
            <Input label="Confirm with your password" icon="lock" value={delPw} onChangeText={setDelPw} placeholder="Your password" secure autoComplete="current-password" style={{ marginTop: 18 }} />
          ) : null}
          {delErr ? <T v="small" color={C.danger} style={{ marginTop: 6 }}>{delErr}</T> : null}
          <Btn kind="danger" title="Delete permanently" onPress={confirmDelete} loading={delBusy} style={{ marginTop: 18 }} />
          <Btn kind="ghost" title="Cancel" onPress={closeDelete} disabled={delBusy} style={{ marginTop: 10 }} />
        </View>
      </Sheet>
      <T v="tiny" color={C.fog} style={{ textAlign: 'center', marginTop: 18 }}>Travora 1.0, built with Expo SDK 58</T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabbar: { position: 'absolute', alignSelf: 'center', height: 62, borderRadius: R.pill, backgroundColor: 'rgba(21,28,64,0.97)', borderWidth: 1, borderColor: 'rgba(235,210,166,0.16)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  tabPill: { position: 'absolute', left: 6, height: 48, borderRadius: R.pill, backgroundColor: C.sand },
  tabItem: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.dusk, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  bellDot: { position: 'absolute', top: 11, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: C.lantern },
  modeTile: { width: 104, height: 120, marginHorizontal: 4, borderTopLeftRadius: 52, borderTopRightRadius: 52, borderBottomLeftRadius: R.m, borderBottomRightRadius: R.m, backgroundColor: C.dusk, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 18 },
  nextTrip: { marginHorizontal: 22, marginTop: 22, padding: 14, borderRadius: R.m, backgroundColor: 'rgba(63,216,230,0.08)', borderWidth: 1, borderColor: 'rgba(63,216,230,0.35)', flexDirection: 'row', alignItems: 'center' },
  nextIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.lagoon, alignItems: 'center', justifyContent: 'center' },
  cabinCard: { width: 224, height: 280, marginHorizontal: 4, borderRadius: R.l, overflow: 'hidden', backgroundColor: C.dusk },
  bookCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: R.m, backgroundColor: C.dusk, borderWidth: 1, borderColor: 'rgba(44,54,112,0.7)', marginBottom: 12 },
  bookImg: { width: 78, height: 92, borderTopLeftRadius: 39, borderTopRightRadius: 39, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  status: { borderWidth: 1, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2 },
  profileHead: { alignItems: 'center', paddingVertical: 24, borderRadius: R.l, overflow: 'hidden', backgroundColor: C.dusk, borderWidth: 1, borderColor: C.line },
  provBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 10, height: 24, borderRadius: R.pill, backgroundColor: C.sand },
  bigAvatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center' },
  stat: { alignItems: 'center', paddingHorizontal: 24 },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.line },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: R.m, backgroundColor: C.dusk, marginBottom: 8 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
});
