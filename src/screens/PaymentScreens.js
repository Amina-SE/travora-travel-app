import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Svg, { Circle, Path } from "react-native-svg";
import { C, F, R, SCREEN_H, SCREEN_W, money } from "../theme";
import { fmtDate } from "../data";
import {
  Btn,
  Header,
  Input,
  Perforation,
  Pressy,
  Row,
  T,
  haptic,
  useInsets,
  Photo,
} from "../ui";
import { useStore } from "../store";
import { MODE_ICON, MODE_NAME, bookingImage } from "../components/BookingBits";

const PROMOS = {
  TRAVORA10: {
    label: "10% off your booking",
    calc: (s) => Math.round(s * 0.1),
  },
  FIRSTTRIP: { label: "$20 off your first trip", calc: () => 20 },
};

export const brandOf = (num = "") => {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "card";
};
const BRAND_ICON = {
  visa: "cc-visa",
  mastercard: "cc-mastercard",
  amex: "cc-amex",
  card: "credit-card",
};
const TONES = {
  dusk: ["#2B3A78", "#151C40"],
  lantern: ["#F5B65B", "#B8742C"],
  lagoon: ["#3FD8E6", "#1E6E8A"],
  sand: ["#EBD2A6", "#9C7F55"],
};

export function CardFace({
  brand = "card",
  number,
  last4,
  holder,
  exp,
  tone = "dusk",
  width = SCREEN_W - 40,
  style,
}) {
  const dark = tone === "dusk";
  const ink = dark ? C.mist : C.night;
  const shown = number
    ? (number.replace(/\D/g, "") + "•".repeat(16))
        .slice(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim()
    : `•••• •••• •••• ${last4}`;
  return (
    <View
      style={[
        { width, height: width * 0.6, borderRadius: R.l, overflow: "hidden" },
        style,
      ]}
    >
      <LinearGradient
        colors={TONES[tone] || TONES.dusk}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={width} height={width * 0.6} style={StyleSheet.absoluteFill}>
        <Path
          d={`M${width * 0.55} ${width * 0.6} V${width * 0.32} A${width * 0.2} ${width * 0.2} 0 0 1 ${width * 0.95} ${width * 0.32} V${width * 0.6}`}
          stroke={ink}
          strokeOpacity={0.12}
          strokeWidth={14}
          fill="none"
        />
      </Svg>
      <View style={{ flex: 1, padding: 20, justifyContent: "space-between" }}>
        <Row between>
          <T v="h3" color={ink}>
            Travora
          </T>
          <FontAwesome name={BRAND_ICON[brand]} size={32} color={ink} />
        </Row>
        <View
          style={{
            width: 42,
            height: 30,
            borderRadius: 6,
            backgroundColor: dark
              ? "rgba(235,210,166,0.7)"
              : "rgba(11,16,40,0.25)",
          }}
        />
        <T
          v="h2"
          color={ink}
          style={{ letterSpacing: 2, fontFamily: F.xbold, fontSize: 20 }}
        >
          {shown}
        </T>
        <Row between>
          <View>
            <T v="tiny" color={ink} style={{ opacity: 0.7 }}>
              Card holder
            </T>
            <T
              v="label"
              color={ink}
              numberOfLines={1}
              style={{ fontFamily: F.bold, maxWidth: width * 0.55 }}
            >
              {holder || "Your name"}
            </T>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T v="tiny" color={ink} style={{ opacity: 0.7 }}>
              Expires
            </T>
            <T v="label" color={ink} style={{ fontFamily: F.bold }}>
              {exp || "MM/YY"}
            </T>
          </View>
        </Row>
      </View>
    </View>
  );
}

function SummaryVisual({ d }) {
  if (d.type === "car") {
    return (
      <View
        style={[
          styles.sumImg,
          {
            backgroundColor: C.dusk2,
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 14,
          },
        ]}
      >
        <Image
          source={bookingImage(d)}
          resizeMode="contain"
          style={{ width: 88, height: 52 }}
        />
      </View>
    );
  }
  const img = d.image || bookingImage(d);
  if (img) return <Photo source={img} style={styles.sumImg} />;
  return (
    <LinearGradient
      colors={["#3B3F86", "#B7798A"]}
      style={[
        styles.sumImg,
        { alignItems: "center", justifyContent: "center" },
      ]}
    >
      <MaterialCommunityIcons
        name={MODE_ICON[d.type]}
        size={30}
        color={C.mist}
      />
    </LinearGradient>
  );
}

export function CheckoutScreen({ nav, params }) {
  const store = useStore();
  const insets = useInsets();
  const d = params.draft;
  const u = store.user || {};
  const [name, setName] = useState(u.guest ? "" : u.name || "");
  const [email, setEmail] = useState(u.guest ? "" : u.email || "");
  const [phone, setPhone] = useState(u.phone || "");
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoErr, setPromoErr] = useState("");
  const defCard = store.cards.find((c) => c.default) || store.cards[0];
  // A saved card is required to book, so nothing is pre-selected until one exists.
  const [method, setMethod] = useState(defCard ? defCard.id : null);
  const [err, setErr] = useState({});
  const [paying, setPaying] = useState(false);
  const proc = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // pick up a card added from this screen
    if (!method && store.cards.length)
      setMethod(store.cards[store.cards.length - 1].id);
  }, [store.cards.length]);

  const taxRate = d.type === "hotel" ? 0.12 : d.type === "car" ? 0.06 : 0.08;
  const taxes = Math.round(d.subtotal * taxRate);
  const service =
    d.type === "hotel" ? 0 : 3 * Math.max(1, d.seats ? d.seats.length : 1);
  const discount = promo
    ? Math.min(d.subtotal, PROMOS[promo].calc(d.subtotal))
    : 0;
  const total = d.subtotal + taxes + service - discount;
  const b = store.billing;
  const billingOk = b.name && b.line1 && b.city;

  const applyPromo = () => {
    const k = code.trim().toUpperCase();
    if (PROMOS[k]) {
      setPromo(k);
      setPromoErr("");
      haptic.ok();
    } else {
      setPromo(null);
      setPromoErr("That code isn’t valid. Try TRAVORA10.");
      haptic.warn();
    }
  };

  const hasCard = store.cards.length > 0;
  const methods = !hasCard
    ? []
    : [
        ...store.cards.map((c) => ({
          id: c.id,
          icon: BRAND_ICON[c.brand],
          fa: true,
          label: `${c.brand === "card" ? "Card" : c.brand[0].toUpperCase() + c.brand.slice(1)} ending ${c.last4}`,
          sub: `Expires ${c.exp}`,
        })),
        store.wallets.applePay && Platform.OS === "ios"
          ? {
              id: "applePay",
              icon: "apple",
              label: "Apple Pay",
              sub: "Pay with Face ID",
            }
          : null,
        store.wallets.googlePay && Platform.OS !== "ios"
          ? {
              id: "googlePay",
              icon: "google",
              label: "Google Pay",
              sub: "Pay with your saved Google card",
            }
          : null,
        store.wallets.paypal
          ? {
              id: "paypal",
              icon: "paypal",
              fa: true,
              label: "PayPal",
              sub: "You’ll confirm in PayPal",
            }
          : null,
        d.type === "hotel"
          ? {
              id: "property",
              icon: "home",
              feather: true,
              label: "Pay at the property",
              sub: "Card held as guarantee only",
            }
          : null,
      ].filter(Boolean);

  const pay = () => {
    const e = {};
    if (name.trim().length < 2) e.name = "Enter the lead traveller’s name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      e.email = "Enter an email for your e-ticket";
    if (!billingOk) e.billing = "Add a billing address to continue";
    if (!hasCard) e.method = "Add a payment card to complete your booking";
    else if (!method || !methods.some((x) => x.id === method))
      e.method = "Choose how you’d like to pay";
    setErr(e);
    if (Object.keys(e).length) return haptic.warn();
    setPaying(true);
    proc.setValue(0);
    Animated.timing(proc, {
      toValue: 1,
      duration: 1900,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(async () => {
      try {
        const m = methods.find((x) => x.id === method);
        const { image, ...rest } = d;
        const booking = await store.addBooking({
          ...rest,
          traveller: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
          taxes,
          service,
          discount,
          promo,
          total,
          paidWith: m ? m.label : "Card",
        });
        haptic.ok();
        nav.reset("Success", { id: booking.id, booking });
      } catch (error) {
        // Don't leave the screen stuck on "processing" if the booking couldn't be saved.
        setPaying(false);
        setErr({
          method: "The booking could not be completed. Please try again.",
        });
        haptic.warn();
      }
    });
  };

  const ringLen = 2 * Math.PI * 34;
  const ringDash = proc.interpolate({
    inputRange: [0, 1],
    outputRange: [ringLen, 0],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.night }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header
        title="Checkout"
        subtitle={MODE_NAME[d.type]}
        onBack={() => nav.pop()}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 130,
        }}
      >
        <View style={styles.summary}>
          <Row center={false}>
            <SummaryVisual d={d} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <T v="tiny" color={C.lagoon}>
                {d.className}
              </T>
              <T v="h3" numberOfLines={2} style={{ marginTop: 2 }}>
                {d.title}
              </T>
              {d.operator ? (
                <T v="tiny" color={C.haze}>
                  {d.operator}, {d.code}
                </T>
              ) : null}
              {d.subtitle && !d.operator ? (
                <T v="tiny" color={C.haze}>
                  {d.subtitle}
                </T>
              ) : null}
              <T v="small" color={C.mist} style={{ marginTop: 6 }}>
                {d.type === "hotel"
                  ? `${fmtDate(d.checkIn)} to ${fmtDate(d.checkOut)}`
                  : d.type === "car"
                    ? `${fmtDate(d.date)} to ${fmtDate(d.dropoff)}`
                    : `${fmtDate(d.date)}, ${d.depart} to ${d.arrive}`}
              </T>
            </View>
          </Row>
          {d.seats && d.seats.length ? (
            <Row style={{ flexWrap: "wrap", marginTop: 12 }}>
              {d.coach ? (
                <View style={styles.pill}>
                  <T v="tiny" color={C.sand}>
                    Coach {d.coach}
                  </T>
                </View>
              ) : null}
              {d.seats.map((s) => (
                <View key={s} style={styles.pill}>
                  <T v="tiny" color={C.sand}>
                    {s}
                  </T>
                </View>
              ))}
            </Row>
          ) : null}
          {d.type === "hotel" ? (
            <T v="tiny" color={C.haze} style={{ marginTop: 10 }}>
              {d.nights} nights, {d.guests} guests, {d.location}
            </T>
          ) : null}
          {d.type === "car" ? (
            <T v="tiny" color={C.haze} style={{ marginTop: 10 }}>
              Pick-up in {d.location}, {d.days} days
            </T>
          ) : null}
        </View>

        <T v="h3" style={styles.section}>
          Lead traveller
        </T>
        <Input
          label="Full name"
          icon="user"
          value={name}
          onChangeText={setName}
          placeholder="As on your ID"
          error={err.name}
        />
        <Input
          label="Email for e-ticket"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="name@example.com"
          error={err.email}
        />
        <Input
          label="Phone (optional)"
          icon="phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+92 300 1234567"
        />

        <Row between style={styles.section}>
          <T v="h3">Billing address</T>
          <Pressy onPress={() => nav.push("Billing")}>
            <T v="label" color={C.sand}>
              {billingOk ? "Edit" : "Add"}
            </T>
          </Pressy>
        </Row>
        <Pressy
          onPress={() => nav.push("Billing")}
          style={[styles.boxRow, err.billing && { borderColor: C.danger }]}
          scaleTo={0.98}
        >
          <Feather name="map-pin" size={18} color={C.sand} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            {billingOk ? (
              <>
                <T v="label" style={{ fontFamily: F.bold }}>
                  {b.name}
                </T>
                <T v="tiny" color={C.haze}>
                  {b.line1}, {b.city} {b.zip}, {b.country}
                </T>
              </>
            ) : (
              <T v="label" color={C.haze}>
                Add the address on your card statement
              </T>
            )}
          </View>
          <Feather name="chevron-right" size={18} color={C.fog} />
        </Pressy>
        {err.billing ? (
          <T v="small" color={C.danger} style={{ marginTop: 6 }}>
            {err.billing}
          </T>
        ) : null}

        <Row between style={styles.section}>
          <T v="h3">Payment method</T>
          <Pressy onPress={() => nav.push("AddCard", { fromCheckout: true })}>
            <T v="label" color={C.sand}>
              Add card
            </T>
          </Pressy>
        </Row>
        {methods.map((m) => {
          const on = method === m.id;
          const Icon = m.fa
            ? FontAwesome
            : m.feather
              ? Feather
              : MaterialCommunityIcons;
          return (
            <Pressy
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[
                styles.boxRow,
                { marginBottom: 8 },
                on && { borderColor: C.lantern },
              ]}
              scaleTo={0.98}
            >
              <View style={styles.methodIcon}>
                <Icon name={m.icon} size={20} color={C.mist} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <T v="label" style={{ fontFamily: F.bold }}>
                  {m.label}
                </T>
                <T v="tiny" color={C.haze}>
                  {m.sub}
                </T>
              </View>
              <View style={[styles.radio, on && { borderColor: C.lantern }]}>
                {on ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressy>
          );
        })}
        {!hasCard ? (
          <>
            <T v="small" color={C.haze} style={{ marginBottom: 10 }}>
              You need a saved card to book. Add one to continue.
            </T>
            <Btn
              kind="ghost"
              icon="plus"
              title="Add a payment card"
              onPress={() => nav.push("AddCard", { fromCheckout: true })}
            />
          </>
        ) : null}
        {err.method ? (
          <T v="small" color={C.danger} style={{ marginTop: 6 }}>
            {err.method}
          </T>
        ) : null}

        <T v="h3" style={styles.section}>
          Promo code
        </T>
        <Row>
          <View
            style={[
              styles.promo,
              promoErr && { borderColor: C.danger },
              promo && { borderColor: C.success },
            ]}
          >
            <Feather name="tag" size={16} color={promo ? C.success : C.fog} />
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              placeholder="TRAVORA10"
              placeholderTextColor={C.fog}
              style={styles.promoInput}
              selectionColor={C.lantern}
            />
          </View>
          <Btn
            small
            title="Apply"
            kind="dark"
            onPress={applyPromo}
            style={{ marginLeft: 8, height: 50, paddingHorizontal: 20 }}
          />
        </Row>
        {promoErr ? (
          <T v="small" color={C.danger} style={{ marginTop: 6 }}>
            {promoErr}
          </T>
        ) : null}
        {promo ? (
          <T v="small" color={C.success} style={{ marginTop: 6 }}>
            {PROMOS[promo].label} applied
          </T>
        ) : null}

        <View style={[styles.summary, { marginTop: 22 }]}>
          {d.lines.map((l, i) => (
            <Row key={i} between style={{ marginBottom: 8 }}>
              <T v="small" color={C.haze} style={{ flex: 1 }}>
                {l.label}
              </T>
              <T v="small">{l.amount ? money(l.amount) : "Included"}</T>
            </Row>
          ))}
          <Row between style={{ marginBottom: 8 }}>
            <T v="small" color={C.haze}>
              Taxes
            </T>
            <T v="small">{money(taxes)}</T>
          </Row>
          {service ? (
            <Row between style={{ marginBottom: 8 }}>
              <T v="small" color={C.haze}>
                Service fee
              </T>
              <T v="small">{money(service)}</T>
            </Row>
          ) : null}
          {discount ? (
            <Row between style={{ marginBottom: 8 }}>
              <T v="small" color={C.success}>
                Promo {promo}
              </T>
              <T v="small" color={C.success}>
                −{money(discount)}
              </T>
            </Row>
          ) : null}
          <View
            style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }}
          />
          <Row between>
            <T v="h3">Total</T>
            <T v="h2" color={C.sand}>
              {money(total)}
            </T>
          </Row>
        </View>
        <Row style={{ marginTop: 12, justifyContent: "center" }}>
          <Feather name="lock" size={12} color={C.fog} />
          <T v="tiny" color={C.fog} style={{ marginLeft: 6 }}>
            Demo checkout. No real payment is taken.
          </T>
        </Row>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Btn
          title={
            method === "property"
              ? `Confirm, pay ${money(total)} later`
              : `Pay ${money(total)}`
          }
          icon="lock"
          onPress={pay}
        />
      </View>

      {paying ? (
        <View style={[StyleSheet.absoluteFill, styles.processing]}>
          <Svg width={90} height={90}>
            <Circle
              cx={45}
              cy={45}
              r={34}
              stroke={C.line}
              strokeWidth={5}
              fill="none"
            />
            <AnimatedCircle
              cx={45}
              cy={45}
              r={34}
              stroke={C.lantern}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${ringLen}`}
              strokeDashoffset={ringDash}
              transform="rotate(-90 45 45)"
            />
          </Svg>
          <T v="h3" style={{ marginTop: 18 }}>
            Confirming your booking
          </T>
          <T v="small" color={C.haze} style={{ marginTop: 4 }}>
            Holding your{" "}
            {d.type === "hotel" ? "room" : d.type === "car" ? "car" : "seats"}{" "}
            and issuing your ticket
          </T>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function BillingScreen({ nav }) {
  const store = useStore();
  const insets = useInsets();
  const [f, setF] = useState({
    ...store.billing,
    name: store.billing.name || store.user?.name || "",
  });
  const [err, setErr] = useState({});
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Enter the name on the card";
    if (f.line1.trim().length < 4) e.line1 = "Enter a street address";
    if (f.city.trim().length < 2) e.city = "Enter a city";
    setErr(e);
    if (Object.keys(e).length) return haptic.warn();
    store.setBilling(f);
    haptic.ok();
    nav.pop();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.night }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="Billing address" onBack={() => nav.pop()} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 30,
        }}
      >
        <T v="small" color={C.haze} style={{ marginBottom: 18 }}>
          Use the address your bank has on file for this card.
        </T>
        <Input
          label="Full name"
          icon="user"
          value={f.name}
          onChangeText={set("name")}
          error={err.name}
        />
        <Input
          label="Street address"
          icon="home"
          value={f.line1}
          onChangeText={set("line1")}
          placeholder="House 12, Street 4, Block 7"
          error={err.line1}
        />
        <Row center={false}>
          <Input
            label="City"
            value={f.city}
            onChangeText={set("city")}
            placeholder="Karachi"
            error={err.city}
            style={{ flex: 1.3, marginRight: 10 }}
          />
          <Input
            label="Postal code"
            value={f.zip}
            onChangeText={set("zip")}
            placeholder="75500"
            keyboardType="number-pad"
            style={{ flex: 1 }}
          />
        </Row>
        <Input
          label="Country"
          icon="globe"
          value={f.country}
          onChangeText={set("country")}
        />
        <Input
          label="Phone"
          icon="phone"
          value={f.phone}
          onChangeText={set("phone")}
          keyboardType="phone-pad"
        />
        <Btn title="Save address" onPress={save} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AddCardScreen({ nav }) {
  const store = useStore();
  const insets = useInsets();
  const [num, setNum] = useState("");
  const [holder, setHolder] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [tone, setTone] = useState("lantern");
  const [def, setDef] = useState(store.cards.length === 0);
  const [err, setErr] = useState({});
  const flip = useRef(new Animated.Value(0)).current;
  const brand = brandOf(num);
  const cardW = SCREEN_W - 40;

  const showBack = (v) =>
    Animated.spring(flip, {
      toValue: v ? 1 : 0,
      useNativeDriver: true,
      damping: 14,
      stiffness: 120,
    }).start();
  const fmtNum = (t) =>
    t
      .replace(/\D/g, "")
      .slice(0, brandOf(t) === "amex" ? 15 : 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const fmtExp = (t) => {
    const d = t.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const save = () => {
    const n = num.replace(/\D/g, "");
    const e = {};
    const need = brand === "amex" ? 15 : 16;
    if (n.length < need) e.num = `Enter all ${need} digits of the card number`;
    if (holder.trim().length < 2) e.holder = "Enter the name shown on the card";
    const [mm, yy] = exp.split("/").map((x) => parseInt(x, 10));
    const now = new Date();
    if (
      !mm ||
      mm > 12 ||
      !yy ||
      2000 + yy < now.getFullYear() ||
      (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)
    )
      e.exp = "Enter a future date as MM/YY";
    if (cvv.length < 3) e.cvv = "3 or 4 digits on the back";
    setErr(e);
    if (Object.keys(e).length) return haptic.warn();
    store.addCard({
      brand,
      last4: n.slice(-4),
      holder: holder.trim(),
      exp,
      tone,
      default: def,
    });
    haptic.ok();
    nav.pop();
  };

  const front = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const back = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.night }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="Add a card" onBack={() => nav.pop()} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 30,
        }}
      >
        <View style={{ height: cardW * 0.6, marginTop: 6 }}>
          <Animated.View
            style={[
              styles.face,
              { transform: [{ perspective: 1000 }, { rotateY: front }] },
            ]}
          >
            <CardFace
              brand={brand}
              number={num}
              holder={holder}
              exp={exp}
              tone={tone}
              width={cardW}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.face,
              { transform: [{ perspective: 1000 }, { rotateY: back }] },
            ]}
          >
            <View
              style={{
                width: cardW,
                height: cardW * 0.6,
                borderRadius: R.l,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={TONES[tone]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={{
                  height: 44,
                  backgroundColor: "#05081A",
                  marginTop: 26,
                }}
              />
              <Row style={{ marginTop: 20, paddingHorizontal: 20 }}>
                <View
                  style={{
                    flex: 1,
                    height: 38,
                    backgroundColor: "rgba(255,255,255,0.85)",
                    borderRadius: 6,
                  }}
                />
                <View style={styles.cvvBox}>
                  <T v="h3" color={C.night}>
                    {cvv.padEnd(3, "•")}
                  </T>
                </View>
              </Row>
              <T
                v="tiny"
                color={tone === "dusk" ? C.mist : C.night}
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 20,
                  opacity: 0.7,
                }}
              >
                Security code
              </T>
            </View>
          </Animated.View>
        </View>

        <Row style={{ marginTop: 16, marginBottom: 18 }}>
          <T v="small" color={C.haze} style={{ marginRight: 12 }}>
            Card colour
          </T>
          {Object.keys(TONES).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                haptic.tap();
                setTone(t);
              }}
              style={[styles.tone, tone === t && { borderColor: C.mist }]}
            >
              <LinearGradient
                colors={TONES[t]}
                style={{ flex: 1, borderRadius: 12 }}
              />
            </Pressable>
          ))}
        </Row>

        <Input
          label="Card number"
          icon="credit-card"
          value={num}
          onChangeText={(t) => setNum(fmtNum(t))}
          keyboardType="number-pad"
          placeholder="1234 5678 9012 3456"
          onFocus={() => showBack(false)}
          error={err.num}
        />
        <Input
          label="Name on card"
          icon="user"
          value={holder}
          onChangeText={setHolder}
          autoCapitalize="words"
          placeholder="Ayesha Khan"
          error={err.holder}
        />
        <Row center={false}>
          <Input
            label="Expiry"
            icon="calendar"
            value={exp}
            onChangeText={(t) => setExp(fmtExp(t))}
            keyboardType="number-pad"
            placeholder="MM/YY"
            error={err.exp}
            style={{ flex: 1, marginRight: 10 }}
          />
          <CvvInput
            value={cvv}
            onChange={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
            onFocus={() => showBack(true)}
            onBlur={() => showBack(false)}
            error={err.cvv}
          />
        </Row>
        <Row between style={[styles.boxRow, { marginBottom: 20 }]}>
          <T v="label" style={{ fontFamily: F.bold }}>
            Set as default card
          </T>
          <Switch
            value={def}
            onValueChange={setDef}
            trackColor={{ true: C.lantern, false: C.dusk2 }}
            thumbColor={C.mist}
          />
        </Row>
        <Btn title="Save card" icon="check" onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// CVV field that flips the card preview when focused.
function CvvInput({ value, onChange, onFocus, onBlur, error }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      <T v="label" color={C.haze} style={{ marginBottom: 7 }}>
        Security code
      </T>
      <View
        style={[
          styles.cvvInput,
          { borderColor: focus ? C.lantern : error ? C.danger : C.line },
        ]}
      >
        <Feather
          name="lock"
          size={18}
          color={focus ? C.lantern : C.fog}
          style={{ marginRight: 10 }}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="123"
          placeholderTextColor={C.fog}
          selectionColor={C.lantern}
          onFocus={() => {
            setFocus(true);
            onFocus();
          }}
          onBlur={() => {
            setFocus(false);
            onBlur();
          }}
          style={{
            flex: 1,
            color: C.mist,
            fontFamily: F.semi,
            fontSize: 15,
            height: "100%",
          }}
        />
      </View>
      {error ? (
        <T v="small" color={C.danger} style={{ marginTop: 6 }}>
          {error}
        </T>
      ) : null}
    </View>
  );
}

export function PaymentMethodsScreen({ nav }) {
  const store = useStore();
  const insets = useInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Header
        title="Payment methods"
        onBack={() => nav.pop()}
        right={
          <Pressy onPress={() => nav.push("AddCard")} style={styles.addBtn}>
            <Feather name="plus" size={20} color={C.night} />
          </Pressy>
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 30,
        }}
      >
        <T v="h3" style={{ marginTop: 8, marginBottom: 12 }}>
          Cards
        </T>
        {store.cards.map((c) => (
          <View key={c.id} style={{ marginBottom: 18 }}>
            <CardFace {...c} />
            <Row between style={{ marginTop: 10 }}>
              {c.default ? (
                <Row>
                  <Feather name="check-circle" size={15} color={C.success} />
                  <T v="small" color={C.success} style={{ marginLeft: 6 }}>
                    Default card
                  </T>
                </Row>
              ) : (
                <Pressy
                  onPress={() => {
                    haptic.soft();
                    store.setDefaultCard(c.id);
                  }}
                >
                  <T v="label" color={C.sand}>
                    Make default
                  </T>
                </Pressy>
              )}
              <Pressy
                onPress={() => {
                  haptic.warn();
                  store.removeCard(c.id);
                }}
              >
                <T v="label" color={C.danger}>
                  Remove
                </T>
              </Pressy>
            </Row>
          </View>
        ))}
        {!store.cards.length ? (
          <T v="small" color={C.haze} style={{ marginBottom: 14 }}>
            No cards saved. Add one to check out faster.
          </T>
        ) : null}
        <Btn
          kind="ghost"
          icon="plus"
          title="Add a new card"
          onPress={() => nav.push("AddCard")}
        />

        <T v="h3" style={{ marginTop: 26, marginBottom: 12 }}>
          Wallets
        </T>
        {[
          {
            k: "applePay",
            icon: "apple",
            label: "Apple Pay",
            sub: "Shown on iPhone",
          },
          {
            k: "googlePay",
            icon: "google",
            label: "Google Pay",
            sub: "Shown on Android",
          },
          {
            k: "paypal",
            icon: "alpha-p-circle-outline",
            label: "PayPal",
            sub: "Confirm each payment in PayPal",
          },
        ].map((w) => (
          <Row key={w.k} between style={[styles.boxRow, { marginBottom: 8 }]}>
            <Row style={{ flex: 1 }}>
              <View style={styles.methodIcon}>
                <MaterialCommunityIcons
                  name={w.icon}
                  size={20}
                  color={C.mist}
                />
              </View>
              <View style={{ marginLeft: 12 }}>
                <T v="label" style={{ fontFamily: F.bold }}>
                  {w.label}
                </T>
                <T v="tiny" color={C.haze}>
                  {w.sub}
                </T>
              </View>
            </Row>
            <Switch
              value={!!store.wallets[w.k]}
              onValueChange={(v) => store.setWallet(w.k, v)}
              trackColor={{ true: C.lantern, false: C.dusk2 }}
              thumbColor={C.mist}
            />
          </Row>
        ))}
      </ScrollView>
    </View>
  );
}

// Confirmation: a check draws itself, then the ticket slides out of a slot.
export function SuccessScreen({ nav, params }) {
  const insets = useInsets();
  const b = params.booking;
  const check = useRef(new Animated.Value(0)).current;
  const ticket = useRef(new Animated.Value(0)).current;
  const sparks = useRef(
    [...Array(10)].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(check, {
        toValue: 1,
        useNativeDriver: true,
        damping: 9,
        stiffness: 140,
      }),
      Animated.parallel([
        ...sparks.map((s, i) =>
          Animated.timing(s, {
            toValue: 1,
            duration: 900,
            delay: i * 25,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
        Animated.timing(ticket, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.night,
        paddingTop: insets.top + 40,
        paddingHorizontal: 22,
        paddingBottom: insets.bottom + 20,
      }}
    >
      <LinearGradient
        colors={["rgba(63,216,230,0.12)", "transparent"]}
        style={[StyleSheet.absoluteFill, { height: SCREEN_H * 0.5 }]}
      />
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 100,
            height: 100,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sparks.map((s, i) => {
            const a = (i / sparks.length) * Math.PI * 2;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.spark,
                  {
                    backgroundColor: i % 2 ? C.lagoon : C.lantern,
                    opacity: s.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 1, 0],
                    }),
                    transform: [
                      {
                        translateX: s.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.cos(a) * 80],
                        }),
                      },
                      {
                        translateY: s.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.sin(a) * 80],
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}
          <Animated.View
            style={[styles.checkCircle, { transform: [{ scale: check }] }]}
          >
            <Feather name="check" size={46} color={C.night} />
          </Animated.View>
        </View>
        <T v="h1" style={{ marginTop: 20, textAlign: "center" }}>
          You’re booked
        </T>
        <T
          v="bodyR"
          color={C.haze}
          style={{ marginTop: 6, textAlign: "center" }}
        >
          We sent the e-ticket to {b.traveller.email}
        </T>
      </View>

      <View style={{ flex: 1, justifyContent: "center", overflow: "hidden" }}>
        <View style={styles.slot} />
        <Animated.View
          style={{
            opacity: ticket,
            transform: [
              {
                translateY: ticket.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-160, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.miniTicket}>
            <Row between>
              <View style={{ flex: 1 }}>
                <T v="tiny" color="#5A6290">
                  {MODE_NAME[b.type]}, {b.className}
                </T>
                <T v="h3" color={C.night} numberOfLines={1}>
                  {b.title}
                </T>
              </View>
              <MaterialCommunityIcons
                name={MODE_ICON[b.type]}
                size={26}
                color={C.night}
              />
            </Row>
            <Perforation color={C.night} />
            <Row between>
              <View>
                <T v="tiny" color="#5A6290">
                  Booking ref
                </T>
                <T v="h3" color={C.night}>
                  {b.ref}
                </T>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <T v="tiny" color="#5A6290">
                  Paid
                </T>
                <T v="h3" color={C.night}>
                  {money(b.total)}
                </T>
              </View>
            </Row>
          </View>
        </Animated.View>
      </View>

      <Btn
        title="View ticket"
        icon="maximize"
        onPress={() => nav.replace("Ticket", { id: b.id, fromSuccess: true })}
      />
      <Btn
        title="Back to home"
        kind="ghost"
        onPress={() => nav.reset("Main")}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    padding: 16,
    borderRadius: R.l,
    backgroundColor: C.dusk,
    borderWidth: 1,
    borderColor: "rgba(44,54,112,0.8)",
    marginTop: 6,
  },
  sumImg: {
    width: 92,
    height: 108,
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  pill: {
    borderWidth: 1,
    borderColor: "rgba(235,210,166,0.4)",
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  section: { marginTop: 24, marginBottom: 12 },
  boxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: R.m,
    backgroundColor: C.dusk,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.dusk2,
    alignItems: "center",
    justifyContent: "center",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.lantern,
  },
  promo: {
    flex: 1,
    height: 50,
    borderRadius: R.s,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.dusk,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  promoInput: {
    flex: 1,
    marginLeft: 8,
    color: C.mist,
    fontFamily: F.bold,
    fontSize: 15,
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(11,16,40,0.97)",
    borderTopWidth: 1,
    borderColor: "rgba(235,210,166,0.12)",
  },
  processing: {
    backgroundColor: "rgba(11,16,40,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  face: { position: "absolute", backfaceVisibility: "hidden" },
  cvvBox: {
    width: 70,
    height: 38,
    marginLeft: 10,
    borderRadius: 6,
    backgroundColor: C.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  tone: {
    width: 40,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    marginRight: 8,
    padding: 2,
  },
  cvvInput: {
    height: 54,
    borderRadius: R.s,
    borderWidth: 1.5,
    backgroundColor: C.dusk,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.success,
    alignItems: "center",
    justifyContent: "center",
  },
  spark: { position: "absolute", width: 8, height: 8, borderRadius: 4 },
  slot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#05081A",
    marginBottom: -4,
    zIndex: 2,
    borderWidth: 1,
    borderColor: C.line,
  },
  miniTicket: { backgroundColor: C.sand, borderRadius: R.l, padding: 18 },
});
