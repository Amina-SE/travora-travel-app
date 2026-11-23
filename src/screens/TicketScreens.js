import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, LayoutAnimation, PanResponder, Platform, Pressable, ScrollView, Share, StyleSheet, UIManager, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { C, F, R, SCREEN_W, money } from '../theme';
import { fmtDate } from '../data';
import { Btn, Empty, Header, Input, Perforation, QR, Row, T, haptic, useInsets, Photo } from '../ui';
import { useStore } from '../store';
import { Sheet } from '../sheet';
import { MODE_ICON, MODE_NAME, bookingImage } from '../components/BookingBits';

function Field({ label, value, right }) {
  return (
    <View style={{ alignItems: right ? 'flex-end' : 'flex-start', flex: 1 }}>
      <T v="tiny" color="#5A6290">{label}</T>
      <T v="label" color={C.night} numberOfLines={1} style={{ fontFamily: F.xbold, marginTop: 2 }}>{value}</T>
    </View>
  );
}

export function TicketScreen({ nav, params }) {
  const store = useStore();
  const insets = useInsets();
  const b = store.bookings.find((x) => x.id === params.id) || params.booking;
  const [confirm, setConfirm] = useState(false);
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  // Drag the pass to tilt it in 3D, like holding a physical ticket.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => tilt.setValue({ x: Math.max(-1, Math.min(1, g.dx / 160)), y: Math.max(-1, Math.min(1, g.dy / 200)) }),
      onPanResponderRelease: () => Animated.spring(tilt, { toValue: { x: 0, y: 0 }, useNativeDriver: true, damping: 8, stiffness: 80 }).start(),
    })
  ).current;

  const back = () => (params.fromSuccess ? nav.reset('Main', { tab: 'trips' }) : nav.pop());
  if (!b) {
    return (
      <View style={{ flex: 1, backgroundColor: C.night }}>
        <Header title="Ticket" onBack={back} />
        <Empty icon="file" title="Ticket not found" body="This booking may have been removed from this device." />
      </View>
    );
  }
  const cancelled = b.status === 'cancelled';
  const img = bookingImage(b);
  const isTransport = ['flight', 'bus', 'train'].includes(b.type);
  const [fromCity, toCity] = isTransport ? b.title.split(' to ') : [];

  const share = () =>
    Share.share({ message: `My Travora booking ${b.ref}: ${b.title}, ${fmtDate(b.date)}${b.depart ? ` at ${b.depart}` : ''}.` }).catch(() => {});

  const rotY = tilt.x.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '16deg'] });
  const rotX = tilt.y.interpolate({ inputRange: [-1, 1], outputRange: ['12deg', '-12deg'] });
  const shine = tilt.x.interpolate({ inputRange: [-1, 1], outputRange: [-SCREEN_W, SCREEN_W] });

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Header title={`${MODE_NAME[b.type]} ticket`} subtitle={`Ref ${b.ref}`} onBack={back} right={<Pressable onPress={share} style={styles.shareBtn}><Feather name="share" size={18} color={C.mist} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <Animated.View
          {...pan.panHandlers}
          style={{ opacity: enter, transform: [{ perspective: 900 }, { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }, { rotateX: rotX }, { rotateY: rotY }] }}
        >
          <View style={[styles.pass, cancelled && { opacity: 0.55 }]}>
            {img && b.type === 'car' ? (
              <View style={[styles.passImg, { backgroundColor: '#E2C79A', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 }]}>
                <Image source={img} resizeMode="contain" style={{ width: SCREEN_W * 0.72, height: 130 }} />
              </View>
            ) : img ? (
              <View style={styles.passImg}>
                <Photo source={img} style={StyleSheet.absoluteFill} />
              </View>
            ) : null}
            <View style={{ padding: 20 }}>
              <Row between>
                <Row>
                  <MaterialCommunityIcons name={MODE_ICON[b.type]} size={18} color={C.night} />
                  <T v="label" color={C.night} style={{ marginLeft: 6, fontFamily: F.xbold }}>{b.operator || b.subtitle || b.className}</T>
                </Row>
                <View style={[styles.status, cancelled && { backgroundColor: C.danger }]}>
                  <T v="tiny" color={C.night} style={{ fontFamily: F.xbold }}>{cancelled ? 'Cancelled' : 'Confirmed'}</T>
                </View>
              </Row>

              {isTransport ? (
                <Row between style={{ marginTop: 18 }}>
                  <View style={{ flex: 1 }}>
                    <T v="h1" color={C.night} numberOfLines={1} adjustsFontSizeToFit>{fromCity}</T>
                    <T v="label" color="#5A6290">{b.depart}</T>
                  </View>
                  <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
                    <MaterialCommunityIcons name={MODE_ICON[b.type]} size={22} color={C.night} style={b.type === 'flight' ? { transform: [{ rotate: '90deg' }] } : null} />
                    <T v="tiny" color="#5A6290">{b.duration}</T>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <T v="h1" color={C.night} numberOfLines={1} adjustsFontSizeToFit>{toCity}</T>
                    <T v="label" color="#5A6290">{b.arrive}</T>
                  </View>
                </Row>
              ) : (
                <View style={{ marginTop: 16 }}>
                  <T v="h2" color={C.night}>{b.title}</T>
                  <T v="small" color="#5A6290">{b.type === 'hotel' ? `${b.subtitle}, ${b.location}` : `Pick-up in ${b.location}`}</T>
                </View>
              )}

              <Row style={{ marginTop: 18 }}>
                {b.type === 'hotel' ? (
                  <>
                    <Field label="Check-in" value={fmtDate(b.checkIn)} />
                    <Field label="Check-out" value={fmtDate(b.checkOut)} />
                    <Field label="Guests" value={String(b.guests)} right />
                  </>
                ) : b.type === 'car' ? (
                  <>
                    <Field label="Pick-up" value={fmtDate(b.date)} />
                    <Field label="Return" value={fmtDate(b.dropoff)} />
                    <Field label="Days" value={String(b.days)} right />
                  </>
                ) : (
                  <>
                    <Field label="Date" value={fmtDate(b.date)} />
                    <Field label="Class" value={b.className} />
                    <Field label={b.coach ? 'Coach' : 'Service'} value={b.coach ? String(b.coach) : b.code} right />
                  </>
                )}
              </Row>
              {b.seats && b.seats.length ? (
                <Row style={{ marginTop: 14 }}>
                  <Field label={b.seats.length === 1 ? 'Seat' : 'Seats'} value={b.seats.join(', ')} />
                  <Field label="Passenger" value={b.traveller?.name || ''} right />
                </Row>
              ) : (
                <Row style={{ marginTop: 14 }}>
                  <Field label="Lead guest" value={b.traveller?.name || ''} />
                </Row>
              )}
            </View>
            <Perforation color={C.night} />
            <View style={{ alignItems: 'center', padding: 20, paddingTop: 8 }}>
              <View style={styles.qrWrap}><QR value={b.ref + b.id} size={160} /></View>
              <T v="h3" color={C.night} style={{ marginTop: 10, letterSpacing: 4 }}>{b.ref}</T>
              <T v="tiny" color="#5A6290">{cancelled ? 'This ticket is no longer valid' : 'Show this code at boarding or check-in'}</T>
            </View>
            <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX: shine }, { rotate: '20deg' }] }]} />
          </View>
        </Animated.View>
        <T v="tiny" color={C.fog} style={{ textAlign: 'center', marginTop: 10 }}>Drag the ticket to tilt it</T>

        <View style={styles.receipt}>
          <T v="h3" style={{ marginBottom: 12 }}>Receipt</T>
          {(b.lines || []).map((l, i) => (
            <Row key={i} between style={{ marginBottom: 8 }}>
              <T v="small" color={C.haze} style={{ flex: 1 }}>{l.label}</T>
              <T v="small">{l.amount ? money(l.amount) : 'Included'}</T>
            </Row>
          ))}
          <Row between style={{ marginBottom: 8 }}><T v="small" color={C.haze}>Taxes and fees</T><T v="small">{money((b.taxes || 0) + (b.service || 0))}</T></Row>
          {b.discount ? <Row between style={{ marginBottom: 8 }}><T v="small" color={C.success}>Promo {b.promo}</T><T v="small" color={C.success}>−{money(b.discount)}</T></Row> : null}
          <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
          <Row between><T v="label" style={{ fontFamily: F.bold }}>Paid with {b.paidWith}</T><T v="h3" color={C.sand}>{money(b.total)}</T></Row>
          <T v="tiny" color={C.fog} style={{ marginTop: 8 }}>Booked {new Date(b.createdAt).toLocaleString()}</T>
        </View>

        {!cancelled ? <Btn kind="danger" title="Cancel booking" icon="x-circle" onPress={() => setConfirm(true)} style={{ marginTop: 16 }} /> : null}
      </ScrollView>

      <Sheet visible={confirm} onClose={() => setConfirm(false)}>
        <T v="h2">Cancel this booking?</T>
        <T v="bodyR" color={C.haze} style={{ marginTop: 8 }}>
          {b.title} on {fmtDate(b.date)}. A refund of {money(b.total)} goes back to {b.paidWith} within 5 to 7 days.
        </T>
        <Btn kind="lantern" title="Keep my booking" onPress={() => setConfirm(false)} style={{ marginTop: 20 }} />
        <Btn kind="danger" title="Cancel booking" onPress={() => { haptic.warn(); store.cancelBooking(b.id); setConfirm(false); }} style={{ marginTop: 10 }} />
      </Sheet>
    </View>
  );
}

export function EditProfileScreen({ nav }) {
  const store = useStore();
  const insets = useInsets();
  const u = store.user || {};
  const [name, setName] = useState(u.name || '');
  const [email, setEmail] = useState(u.email || '');
  const [phone, setPhone] = useState(u.phone || '');
  const [err, setErr] = useState({});
 
const save = async () => {
  const e = {};

  if (name.trim().length < 2) {
    e.name = 'Enter your full name';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    e.email = 'Enter a valid email';
  }

  setErr(e);

  if (Object.keys(e).length) {
    return haptic.warn();
  }

  try {
    await store.updateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      guest: false,
    });

    haptic.ok();
    nav.pop();
  } catch (error) {
    console.log('Profile update error:', error);
    setErr({
      save: 'Could not save your profile. Please try again.',
    });
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Header title="Personal details" onBack={() => nav.pop()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}>
        <Input label="Full name" icon="user" value={name} onChangeText={setName} error={err.name} />
        <Input label="Email" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={err.email} />
        <Input label="Phone" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Btn title="Save changes" onPress={save} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ = [
  ['How do I choose a seat?', 'After you pick a trip, the cabin opens in 3D. Drag sideways to look around, drag up or down to move along the aisle, and tap a seat. Hold a seat to preview the view from it, or switch to Seat map for a flat layout.'],
  ['Can I change class after opening the cabin?', 'Yes. Use the class switch at the top of the cabin. Your seats reset because each class has a different layout.'],
  ['Where is my e-ticket?', 'Open the Trips tab and tap any booking. The QR code works at boarding gates and hotel check-in desks.'],
  ['How do refunds work?', 'Cancel from the ticket screen. Refunds return to the original payment method within 5 to 7 working days.'],
  ['Is my card stored safely?', 'This demo only keeps the last four digits and expiry on your device. Full card numbers are never saved.'],
];

export function HelpScreen({ nav }) {
  const insets = useInsets();
  const [open, setOpen] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Header title="Help and support" onBack={() => nav.pop()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}>
        {FAQ.map(([q, a], i) => (
          <Pressable
            key={q}
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); haptic.tap(); setOpen(open === i ? -1 : i); }}
            style={styles.faq}
          >
            <Row between>
              <T v="label" style={{ fontFamily: F.bold, flex: 1, paddingRight: 10 }}>{q}</T>
              <Feather name={open === i ? 'minus' : 'plus'} size={18} color={C.sand} />
            </Row>
            {open === i ? <T v="small" color={C.haze} style={{ marginTop: 10 }}>{a}</T> : null}
          </Pressable>
        ))}
        <View style={styles.contact}>
          <Feather name="message-circle" size={22} color={C.lagoon} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <T v="label" style={{ fontFamily: F.bold }}>Still need help?</T>
            <T v="small" color={C.haze}>support@travora.app, replies within a day</T>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shareBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.dusk, alignItems: 'center', justifyContent: 'center' },
  pass: { backgroundColor: C.sand, borderRadius: R.l, overflow: 'hidden', marginTop: 8 },
  passImg: { height: 150, borderTopLeftRadius: R.l, borderTopRightRadius: R.l, overflow: 'hidden' },
  status: { backgroundColor: C.success, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  qrWrap: { padding: 12, backgroundColor: '#fff', borderRadius: 16 },
  shine: { position: 'absolute', top: -100, bottom: -100, width: 70, backgroundColor: 'rgba(255,255,255,0.22)' },
  receipt: { marginTop: 22, padding: 16, borderRadius: R.l, backgroundColor: C.dusk },
  faq: { padding: 16, borderRadius: R.m, backgroundColor: C.dusk, marginBottom: 10 },
  contact: { flexDirection: 'row', alignItems: 'center', marginTop: 14, padding: 16, borderRadius: R.m, borderWidth: 1, borderColor: 'rgba(63,216,230,0.4)' },
});
