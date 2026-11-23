import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Feather } from '@expo/vector-icons';
import { C, F, R, SCREEN_H } from '../theme';
import { IMG } from '../data';
import { Btn, Input, Logo, Pressy, Row, T, haptic, useInsets, FILL } from '../ui';
import { useStore } from '../store';
import { Sheet } from '../sheet';
import * as AppleAuthentication from 'expo-apple-authentication';
import { AuthCancelled, providerStatus, signInWithApple, signInWithGoogle } from '../auth/social';
import { AUTH } from '../auth/authConfig';

// Tapping Google or Apple: run the in-app sign-in when this device supports it,
// otherwise just open the provider's own page.
async function openSocial(provider, setProvider) {
  let status = 'unsupported';
  try { status = await providerStatus(provider); } catch (e) { /* fall through to the link */ }
  if (status === 'ready') setProvider(provider);
  else Linking.openURL(AUTH.links[provider]).catch(() => {});
}

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const TEXT_SHADOW = { textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 };

// Full-screen photo with a slow drift, a frosted form panel on top.
function AuthShell({ title, subtitle, children, image }) {
  const insets = useInsets();
  const a = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const scale = Animated.add(
    a.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0] }),
    drift.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.06] })
  );
  const ty = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Animated.Image source={image} resizeMode="cover" style={[FILL, { transform: [{ scale }, { translateY: ty }] }]} />
      {/* readability scrims: light at the top for the logo, deep at the bottom for the form */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(11,16,40,0.45)', 'rgba(11,16,40,0)', 'rgba(11,16,40,0.3)', 'rgba(11,16,40,0.9)']}
        locations={[0, 0.2, 0.48, 0.8]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24, paddingHorizontal: 18 }}
        >
          <Row style={{ paddingHorizontal: 4 }}>
            <Logo size={34} />
            <T v="h3" color={C.sand} style={[{ marginLeft: 8 }, TEXT_SHADOW]}>Travora</T>
          </Row>
          <View style={{ flex: 1, minHeight: SCREEN_H * 0.2 }} />
          <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
            <T v="h1" color={C.white} style={[{ paddingHorizontal: 4 }, TEXT_SHADOW]}>{title}</T>
            <T v="bodyR" color="rgba(255,255,255,0.88)" style={[{ marginTop: 6, marginBottom: 16, paddingHorizontal: 4 }, TEXT_SHADOW]}>{subtitle}</T>
            <View style={styles.panel}>{children}</View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Socials({ onPress, label = 'or continue with' }) {
  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.rule} />
        <T v="label" color={C.mist} style={styles.dividerText}>{label}</T>
        <View style={styles.rule} />
      </View>
      <View style={styles.socialRow}>
        <Pressy style={styles.social} onPress={() => onPress('google')}>
          <AntDesign name="google" size={19} color={C.mist} />
          <T v="label" color={C.mist} style={styles.socialText}>Google</T>
        </Pressy>
        <View style={{ width: 12 }} />
        <Pressy style={styles.social} onPress={() => onPress('apple')}>
          <AntDesign name="apple" size={20} color={C.mist} />
          <T v="label" color={C.mist} style={styles.socialText}>Apple</T>
        </Pressy>
      </View>
    </>
  );
}

const PROVIDERS = {
  google: { name: 'Google', icon: 'google', shares: ['Your name', 'Your Google email address', 'Your profile photo'] },
  apple: { name: 'Apple', icon: 'apple', shares: ['Your name', 'Your email, or a private relay address if you choose to hide it'] },
};

// The "check" before connecting: shows what Travora receives, then runs the real native sign-in.
// If the provider can't run on this device, explains why and offers another way in.
function SocialSheet({ provider, onClose, onDone, onGuest, remember }) {
  const store = useStore();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const p = provider ? PROVIDERS[provider] : null;

  useEffect(() => {
    setStatus(null);
    setError('');
    setBusy(false);
    if (provider) providerStatus(provider).then(setStatus);
  }, [provider]);

  const go = async () => {
    setBusy(true);
    setError('');
    try {
      const profile = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
     await store.socialSignIn(profile, store.accounts, remember);
      haptic.ok();
      onDone();
    } catch (e) {
      if (!(e instanceof AuthCancelled)) {
        haptic.warn();
        setError(e.message || 'Sign-in didn’t complete. Try again.');
      }
    }
    setBusy(false);
  };

  return (
    <Sheet visible={!!provider} onClose={busy ? () => {} : onClose}>
      {p ? (
        <View>
          <Row>
            <View style={styles.provIcon}><AntDesign name={p.icon} size={26} color={C.night} /></View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <T v="h2">Continue with {p.name}</T>
              <T v="small" color={C.haze}>Connect your {p.name} account to Travora</T>
            </View>
          </Row>

          <View style={styles.shareBox}>
            <T v="label" color={C.mist} style={{ fontFamily: F.bold, marginBottom: 8 }}>Travora will receive</T>
            {p.shares.map((x) => (
              <Row key={x} style={{ marginBottom: 6 }}>
                <Feather name="check-circle" size={15} color={C.lagoon} />
                <T v="small" color={C.mist} style={{ marginLeft: 8, flex: 1 }}>{x}</T>
              </Row>
            ))}
            <Row style={{ marginTop: 4 }}>
              <Feather name="lock" size={14} color={C.haze} />
              <T v="tiny" color={C.haze} style={{ marginLeft: 8, flex: 1 }}>Your {p.name} password is never shared with Travora.</T>
            </Row>
          </View>

          {status === null ? (
            <T v="small" color={C.haze} style={{ marginTop: 18, textAlign: 'center' }}>Checking this device…</T>
          ) : null}

          {error ? (
            <View style={[styles.formErr, { marginTop: 14, marginBottom: 0 }]}><Feather name="alert-circle" size={16} color={C.danger} /><T v="small" color={C.mist} style={{ marginLeft: 8, flex: 1 }}>{error}</T></View>
          ) : null}

          {status === 'ready' && provider === 'apple' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={14}
              style={{ height: 54, marginTop: 18, opacity: busy ? 0.6 : 1 }}
              onPress={busy ? () => {} : go}
            />
          ) : null}
          {status === 'ready' && provider === 'google' ? (
            <Btn title="Continue with Google" icon="log-in" loading={busy} onPress={go} style={{ marginTop: 18 }} />
          ) : null}
          <Btn kind="ghost" title="Cancel" onPress={onClose} disabled={busy} style={{ marginTop: 10 }} />
        </View>
      ) : null}
    </Sheet>
  );
}

// "New to Travora? Create an account" style footer, centered and readable on any photo.
function SwitchLine({ text, action, onPress }) {
  return (
    <View style={styles.switchLine}>
      <T v="body" color={C.mist}>{text} </T>
      <Pressy onPress={onPress} hitSlop={8}>
        <T v="body" color={C.lantern} style={{ fontFamily: F.xbold }}>{action}</T>
      </Pressy>
    </View>
  );
}

export function SignInScreen({ nav }) {
  const store = useStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');

  const forgot = async () => {
    setInfo('');
    if (!emailOk(email)) return setErr({ email: 'Type your email here first, then tap Forgot password.' });
    setErr({});
    const msg = await store.resetPassword(email);
    if (msg) setErr({ form: msg });
    else setInfo('Reset link sent. Check your inbox (and spam folder) for an email from Firebase.');
  };

const submit = async () => {
  const e = {};
  setInfo('');

  if (!emailOk(email)) e.email = 'Enter an email like name@example.com';
  if (pw.length < 6) e.pw = 'Passwords are at least 6 characters';

  setErr(e);

  if (Object.keys(e).length) return haptic.warn();

  setLoading(true);

  try {
    const msg = await store.signIn(
      email.trim(),
      pw,
      store.accounts,
      remember
    );

    if (msg) {
      haptic.warn();
      setErr({ form: msg });
    } else {
      haptic.ok();
      nav.reset('Main');
    }
  } catch (error) {
    haptic.warn();
    setErr({ form: error.message || 'Login failed. Please try again.' });
  } finally {
    setLoading(false);
  }
};


  const [provider, setProvider] = useState(null);
  const social = () => {
    store.guest();
    nav.reset('Main');
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your trips and saved stays." image={IMG.signin}>
      <Input label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" error={err.email} />
      <Input label="Password" icon="lock" value={pw} onChangeText={setPw} placeholder="Your password" secure autoComplete="current-password" error={err.pw} />
      <Row between style={{ marginTop: -4, marginBottom: 18 }}>
        <Pressy onPress={() => setRemember((r) => !r)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.check, remember && { backgroundColor: C.sand, borderColor: C.sand }]}>{remember ? <Feather name="check" size={14} color={C.night} /> : null}</View>
          <T v="label" color={C.mist} style={{ marginLeft: 8 }}>Keep me signed in</T>
        </Pressy>
        <Pressy onPress={forgot}>
          <T v="label" color={C.lantern} style={{ fontFamily: F.bold }}>Forgot password?</T>
        </Pressy>
      </Row>
      {info ? (
        <View style={styles.formErr}><Feather name="check-circle" size={16} color={C.success} /><T v="small" color={C.mist} style={{ marginLeft: 8, flex: 1 }}>{info}</T></View>
      ) : null}
      {err.form ? (
        <View style={styles.formErr}><Feather name="alert-circle" size={16} color={C.danger} /><T v="small" color={C.mist} style={{ marginLeft: 8, flex: 1 }}>{err.form}</T></View>
      ) : null}
      <Btn title="Sign in" onPress={submit} loading={loading} />
      <Socials onPress={(p) => openSocial(p, setProvider)} />
      <SocialSheet provider={provider} remember={remember} onClose={() => setProvider(null)} onGuest={() => { setProvider(null); social(); }} onDone={() => { setProvider(null); nav.reset('Main'); }} />
      <SwitchLine text="New to Travora?" action="Create an account" onPress={() => nav.push('SignUp')} />
      <Pressy style={styles.guest} onPress={social}>
        <Feather name="compass" size={16} color={C.mist} />
        <T v="label" color={C.mist} style={{ marginLeft: 8, fontFamily: F.bold }}>Continue as a guest</T>
      </Pressy>
    </AuthShell>
  );
}

export function SignUpScreen({ nav }) {
  const store = useStore();
  const [f, setF] = useState({ name: '', email: '', phone: '', pw: '', pw2: '' });
  const [agree, setAgree] = useState(false);
  const [provider, setProvider] = useState(null);
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(f.pw)).length);
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  
const submit = async () => {
  const e = {};

  if (f.name.trim().length < 2) e.name = 'Enter your full name';
  if (!emailOk(f.email)) e.email = 'Enter an email like name@example.com';
  if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a phone number with at least 10 digits';
  if (f.pw.length < 6) e.pw = 'Use at least 6 characters';
  if (f.pw2 !== f.pw) e.pw2 = 'Passwords don’t match';
  if (!agree) e.agree = 'Accept the terms to create an account';

  setErr(e);

  if (Object.keys(e).length) return haptic.warn();

  setLoading(true);

  try {
    const msg = await store.signUp(
      {
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        password: f.pw,
      },
      store.accounts
    );

    if (msg) {
      setErr({ form: msg });
      haptic.warn();
    } else {
      haptic.ok();
      nav.reset('Main');
    }
  } catch (error) {
    haptic.warn();
    setErr({ form: error.message || 'Signup failed. Please try again.' });
  } finally {
    setLoading(false);
  }
};


  return (
    <AuthShell title="Create your account" subtitle="Save travellers, cards and tickets in one place." image={IMG.signup}>
      <Input label="Full name" icon="user" value={f.name} onChangeText={set('name')} placeholder="Ayesha Khan" autoCapitalize="words" error={err.name} />
      <Input label="Email" icon="mail" value={f.email} onChangeText={set('email')} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" error={err.email} />
      <Input label="Phone" icon="phone" value={f.phone} onChangeText={set('phone')} placeholder="+92 300 1234567" keyboardType="phone-pad" error={err.phone} />
      <Input label="Password" icon="lock" value={f.pw} onChangeText={set('pw')} placeholder="At least 6 characters" secure autoComplete="new-password" error={err.pw} style={{ marginBottom: 8 }} />
      <Row style={{ marginBottom: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < strength ? [C.danger, C.lantern, C.sand, C.success][strength - 1] : C.dusk2 }]} />
        ))}
        <T v="tiny" color={C.mist} style={{ marginLeft: 8, width: 60 }}>{f.pw ? strengthLabel : ''}</T>
      </Row>
      <Input label="Confirm password" icon="check-circle" value={f.pw2} onChangeText={set('pw2')} placeholder="Type it again" secure autoComplete="new-password" error={err.pw2} />
      <Pressy onPress={() => setAgree((a) => !a)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: err.agree ? 4 : 18 }}>
        <View style={[styles.check, agree && { backgroundColor: C.sand, borderColor: C.sand }]}>{agree ? <Feather name="check" size={14} color={C.night} /> : null}</View>
        <T v="small" color={C.mist} style={{ marginLeft: 10, flex: 1 }}>I agree to the <T v="small" color={C.lantern} style={{ fontFamily: F.bold }}>Terms of Service</T> and <T v="small" color={C.lantern} style={{ fontFamily: F.bold }}>Privacy Policy</T></T>
      </Pressy>
      {err.agree ? <T v="small" color={C.danger} style={{ marginBottom: 14 }}>{err.agree}</T> : null}
      {err.form ? (
        <View style={styles.formErr}><Feather name="alert-circle" size={16} color={C.danger} /><T v="small" color={C.mist} style={{ marginLeft: 8, flex: 1 }}>{err.form}</T></View>
      ) : null}
      <Btn title="Create account" onPress={submit} loading={loading} />
      <Socials onPress={(p) => openSocial(p, setProvider)} label="or sign up with" />
      <SocialSheet provider={provider} onClose={() => setProvider(null)} onGuest={() => { setProvider(null); store.guest(); nav.reset('Main'); }} onDone={() => { setProvider(null); nav.reset('Main'); }} />
      <SwitchLine text="Already have an account?" action="Sign in" onPress={() => nav.pop()} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  provIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.mist, alignItems: 'center', justifyContent: 'center' },
  shareBox: { marginTop: 18, padding: 14, borderRadius: R.m, backgroundColor: C.dusk2 },
  panel: { padding: 18, borderRadius: R.l, backgroundColor: 'rgba(11,16,40,0.8)', borderWidth: 1, borderColor: 'rgba(235,210,166,0.22)' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 16 },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(238,241,251,0.35)' },
  dividerText: { marginHorizontal: 12, opacity: 0.95 },
  socialRow: { flexDirection: 'row', alignItems: 'stretch' },
  social: { flex: 1, height: 52, borderRadius: R.s, borderWidth: 1.5, borderColor: 'rgba(238,241,251,0.4)', backgroundColor: 'rgba(238,241,251,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialText: { marginLeft: 10, fontFamily: F.bold, fontSize: 15 },
  switchLine: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 22 },
  guest: { alignSelf: 'center', marginTop: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, height: 42, borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(238,241,251,0.35)', backgroundColor: 'rgba(238,241,251,0.08)' },
  formErr: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: R.s, backgroundColor: 'rgba(255,122,138,0.14)', borderWidth: 1, borderColor: 'rgba(255,122,138,0.45)', marginBottom: 14 },
  bar: { flex: 1, height: 4, borderRadius: 2, marginRight: 4 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(238,241,251,0.5)', alignItems: 'center', justifyContent: 'center' },
});
