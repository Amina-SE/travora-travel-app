import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";

import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "./firebase";
import {
  cloudUserOrNull,
  deleteCloudAccountData,
  loadCloudData,
  saveCloudBooking,
  saveCloudSettings,
  updateCloudBooking,
} from "./cloud";

const KEY = "travora:v1";
const Ctx = createContext(null);

// Everything that belongs to one person. Guests always start from this empty set,
// and each signed-in account gets its own copy kept in `vault`.
const freshData = () => ({
  bookings: [],
  cards: [],
  wallets: { applePay: true, googlePay: true, paypal: false },
  billing: {
    name: "",
    line1: "",
    city: "",
    zip: "",
    country: "Pakistan",
    phone: "",
  },
  saved: [],
});
const DATA_KEYS = ["bookings", "cards", "wallets", "billing", "saved"];
const pickData = (s) => DATA_KEYS.reduce((o, k) => ({ ...o, [k]: s[k] }), {});
const userKey = (u) =>
  u && !u.guest ? u.uid || (u.email || "").toLowerCase() || null : null;

// Switch the active data to whoever is signing in (or to nobody / a guest).
// The previous real account's data is parked in the vault first.
function enter(s, nextUser, seed = {}) {
  const vault = { ...(s.vault || {}) };
  const prevKey = userKey(s.user);
  if (prevKey) vault[prevKey] = pickData(s);
  const nextKey = userKey(nextUser);
  let data = freshData();
  if (nextKey) {
    data = vault[nextKey] || { ...data, billing: { ...data.billing, ...seed } };
  }
  return { vault, user: nextUser, ...data };
}

const DEFAULT = {
  onboarded: false,
  user: null,
  accounts: [], // local demo accounts: { name, email, phone, password }
  vault: {}, // saved data per signed-in account
  ...freshData(),
  notifications: true,
  remember: false,
};

const uid = (p) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function StoreProvider({ children }) {
  const [state, setState] = useState(DEFAULT);
  const [ready, setReady] = useState(false);
  const draft = useRef(null); // in-flight checkout, never persisted
  const stateRef = useRef(state);
  stateRef.current = state;
  // uid whose cloud data has finished loading. We never upload before this matches,
  // otherwise an empty local copy could overwrite what is saved in the cloud.
  const hydratedFor = useRef(null);

  // Pull this account's bookings, cards, saved stays etc. down from Firestore.
  const hydrate = async (uid) => {
    if (!uid) return;
    try {
      const { settings, bookings } = await loadCloudData(uid);
      setState((s) => {
        if (!s.user || s.user.guest || s.user.uid !== uid) return s; // someone else signed in meanwhile
        return {
          ...s,
          bookings,
          cards: settings?.cards ?? s.cards,
          wallets: settings?.wallets ?? s.wallets,
          billing: settings?.billing ?? s.billing,
          saved: settings?.saved ?? s.saved,
        };
      });
      hydratedFor.current = uid;
    } catch (e) {
      console.log("Could not load cloud data:", e.message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = { ...DEFAULT, ...JSON.parse(raw) };
          // Only restore the session when the user chose to stay signed in.
          const keep = saved.remember && saved.user && !saved.user.guest;
          if (!keep) {
            // Park the last account's data, then start clean so guests never see it.
            const k = userKey(saved.user);
            saved.vault = { ...(saved.vault || {}) };
            if (k) saved.vault[k] = pickData(saved);
            Object.assign(saved, freshData(), { user: null, remember: false });
            // Firebase remembers its own session too, so end it as well.
            try {
              await auth.authStateReady?.();
              if (auth.currentUser) await firebaseSignOut(auth);
            } catch (e) {
              /* ignore */
            }
          } else {
            // Kept session: make sure Firebase still knows this person, then load their cloud data.
            // A leftover local-only login (no Firebase uid) is not a real account, so it's dropped.
            // Apple sign-in is the one exception: it is not linked to Firebase yet.
            try {
              await auth.authStateReady?.();
            } catch (e) {
              /* ignore */
            }
            if (saved.user.uid && auth.currentUser?.uid === saved.user.uid) {
              setTimeout(() => hydrate(saved.user.uid), 0);
            } else if (saved.user.provider !== "apple") {
              Object.assign(saved, freshData(), {
                user: null,
                remember: false,
              });
            }
          }
          setState(saved);
        }
      } catch (e) {
        // corrupt storage: start fresh
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // Upload cards, wallets, billing and saved stays whenever they change.
  useEffect(() => {
    if (!ready) return undefined;
    const u = state.user;
    if (!u || u.guest || !u.uid || hydratedFor.current !== u.uid)
      return undefined;
    if (!cloudUserOrNull(u)) return undefined;
    const t = setTimeout(() => {
      saveCloudSettings(u.uid, {
        cards: state.cards,
        wallets: state.wallets,
        billing: state.billing,
        saved: state.saved,
      }).catch((e) => console.log("Could not save settings:", e.message));
    }, 800);
    return () => clearTimeout(t);
  }, [
    state.cards,
    state.wallets,
    state.billing,
    state.saved,
    state.user,
    ready,
  ]);

  const api = useMemo(() => {
    const set = (fn) => setState((s) => ({ ...s, ...fn(s) }));
    return {
      finishOnboarding: () => set(() => ({ onboarded: true })),
      signUp: async (
        { name, email, phone, password },
        accounts,
        remember = false,
      ) => {
        try {
          const credential = await createUserWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password,
          );

          await updateProfile(credential.user, {
            displayName: name,
          });

          await setDoc(doc(db, "users", credential.user.uid), {
            uid: credential.user.uid,
            name,
            email: email.trim().toLowerCase(),
            phone,
            createdAt: serverTimestamp(),
          });

          console.log(
            "Firebase sign-up OK. Project:",
            auth.app.options.projectId,
            "uid:",
            credential.user.uid,
          );
          hydratedFor.current = null;
          set((s) => ({
            ...enter(
              s,
              {
                name,
                email: email.trim().toLowerCase(),
                phone,
                uid: credential.user.uid,
              },
              { name, phone },
            ),
            remember,
          }));
          await hydrate(credential.user.uid);

          return null;
        } catch (error) {
          if (error.code === "auth/email-already-in-use")
            return "This email already has an account. Please sign in.";
          if (error.code === "auth/weak-password")
            return "Please choose a stronger password.";
          if (error.code === "auth/invalid-email")
            return "Please enter a valid email address.";

          return error.message || "Signup failed. Please try again.";
        }
      },

      signIn: async (email, password, accounts, remember = false) => {
        try {
          const credential = await signInWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password,
          );

          const firebaseUser = credential.user;

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          const profile = userDoc.exists() ? userDoc.data() : {};

          const name =
            profile.name || firebaseUser.displayName || "Travora User";
          const phone = profile.phone || firebaseUser.phoneNumber || "";

          console.log(
            "Firebase sign-in OK. Project:",
            auth.app.options.projectId,
            "uid:",
            firebaseUser.uid,
          );
          hydratedFor.current = null;
          set((s) => ({
            ...enter(
              s,
              { name, email: firebaseUser.email, phone, uid: firebaseUser.uid },
              { name, phone },
            ),
            remember,
          }));
          await hydrate(firebaseUser.uid);

          return null;
        } catch (error) {
          console.log("Sign-in failed:", error.code, error.message);
          if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/user-not-found" ||
            error.code === "auth/wrong-password"
          ) {
            return "Incorrect email or password. Please check and try again.";
          }

          if (error.code === "auth/invalid-email") {
            return "Please enter a valid email address.";
          }

          if (error.code === "auth/too-many-requests") {
            return "Too many attempts. Please try again later.";
          }

          return error.message || "Login failed. Please try again.";
        }
      },

      // Google/Apple: link to an existing account (same provider id, or same email) or create one.

      socialSignIn: async (profile, accounts, remember = false) => {
        if (profile.provider === "google") {
          const userId = profile.uid || profile.providerId;

          const userRef = doc(db, "users", userId);
          const existingDoc = await getDoc(userRef);

          const accountData = {
            uid: userId,
            name: profile.name || "Google User",
            email: profile.email,
            phone: "",
            photo: profile.photo || null,
            provider: "google",
            updatedAt: serverTimestamp(),
          };

          if (!existingDoc.exists()) {
            accountData.createdAt = serverTimestamp();
          }

          await setDoc(userRef, accountData, { merge: true });

          hydratedFor.current = null;
          set((s) => ({
            ...enter(
              s,
              {
                name: accountData.name,
                email: accountData.email,
                phone: "",
                photo: accountData.photo,
                uid: userId,
                provider: "google",
              },
              { name: accountData.name },
            ),
            remember,
          }));
          await hydrate(userId);

          return { isNew: !existingDoc.exists(), account: accountData };
        }

        // Keep the existing Apple local sign-in logic.
        const idKey = "appleId";

        let account =
          accounts.find((a) => a[idKey] && a[idKey] === profile.providerId) ||
          (profile.email
            ? accounts.find(
                (a) => a.email.toLowerCase() === profile.email.toLowerCase(),
              )
            : null);

        const isNew = !account;

        if (!account) {
          account = {
            name: profile.name || "Apple user",
            email:
              profile.email ||
              `${profile.providerId.slice(0, 10)}@privaterelay.appleid.com`,
            phone: "",
            password: null,
          };
        }

        account = {
          ...account,
          [idKey]: profile.providerId,
          photo: profile.photo || account.photo || null,
        };

        set((s) => ({
          accounts: isNew
            ? [...s.accounts, account]
            : s.accounts.map((a) => (a.email === account.email ? account : a)),
          ...enter(
            s,
            {
              name: account.name,
              email: account.email,
              phone: account.phone,
              photo: account.photo,
              provider: "apple",
            },
            { name: account.name },
          ),
          remember,
        }));
        hydratedFor.current = null; // Apple isn't linked to Firebase yet: its data stays on this device

        return { isNew, account };
      },

      // Guests get an empty slate: no trips, cards, saved stays or billing details.
      guest: () => {
        hydratedFor.current = null;
        set((s) => ({
          ...enter(s, {
            name: "Guest traveller",
            email: "guest@travora.app",
            phone: "",
            guest: true,
          }),
          remember: false,
        }));
      },

      // Sends Firebase's password-reset email. Returns null on success, or a message.
      resetPassword: async (email) => {
        try {
          await sendPasswordResetEmail(auth, email.trim().toLowerCase());
          return null;
        } catch (error) {
          console.log("Password reset failed:", error.code);
          if (error.code === "auth/invalid-email")
            return "Please enter a valid email address.";
          if (error.code === "auth/too-many-requests")
            return "Too many attempts. Please try again later.";
          return (
            error.message || "Could not send the reset email. Please try again."
          );
        }
      },

      // Permanently deletes the account: cloud data first, then the login itself.
      // Email accounts must re-enter their password. Throws an Error with a readable message.
      deleteAccount: async (password) => {
        const appUser = stateRef.current.user;
        if (!appUser || appUser.guest)
          throw new Error("Guests don’t have an account to delete.");

        const fbUser = cloudUserOrNull(appUser);
        if (fbUser) {
          try {
            if (!appUser.provider) {
              if (!password) throw new Error("Enter your password to confirm.");
              await reauthenticateWithCredential(
                fbUser,
                EmailAuthProvider.credential(fbUser.email, password),
              );
            } else {
              // Google: Firebase only allows deletion shortly after signing in.
              const last = new Date(
                fbUser.metadata?.lastSignInTime || 0,
              ).getTime();
              if (Date.now() - last > 4 * 60 * 1000) {
                throw new Error(
                  "For security, sign out, sign in with Google again, then delete your account right away.",
                );
              }
            }
            await deleteCloudAccountData(fbUser.uid);
            await deleteUser(fbUser);
          } catch (error) {
            console.log("Delete account failed:", error.code, error.message);
            if (
              error.code === "auth/invalid-credential" ||
              error.code === "auth/wrong-password"
            ) {
              throw new Error("That password is incorrect.");
            }
            if (error.code === "auth/requires-recent-login") {
              throw new Error(
                "For security, sign out, sign in again, then delete your account right away.",
              );
            }
            throw new Error(
              error.message ||
                "Could not delete the account. Please try again.",
            );
          }
        }

        hydratedFor.current = null;
        set((s) => {
          const k = userKey(s.user);
          const vault = { ...s.vault };
          if (k) delete vault[k];
          return {
            ...enter({ ...s, vault, user: null }, null),
            accounts: s.accounts.filter((a) => a.email !== appUser.email),
            remember: false,
          };
        });
      },

      signOut: async () => {
        try {
          await firebaseSignOut(auth);
        } catch (error) {
          console.log("Firebase sign out:", error.message);
        }

        hydratedFor.current = null;
        set((s) => ({
          ...enter(s, null),
          remember: false,
        }));
      },

      updateUser: async (patch) => {
        const cloudUser = cloudUserOrNull(stateRef.current.user);

        if (cloudUser) {
          await setDoc(
            doc(db, "users", cloudUser.uid),
            { ...patch, updatedAt: serverTimestamp() },
            { merge: true },
          );
        }

        set((s) => ({
          user: s.user ? { ...s.user, ...patch } : null,
        }));
      },

      setDraft: (d) => {
        draft.current = d;
      },
      getDraft: () => draft.current,

      addBooking: async (b) => {
        const booking = {
          ...b,
          id: uid("TRV").toUpperCase(),
          ref: Math.random().toString(36).slice(2, 8).toUpperCase(),
          status: "confirmed",
          createdAt: Date.now(),
        };

        // Saved to the cloud in the background so checkout never waits on the network.
        const cloudUser = cloudUserOrNull(stateRef.current.user);
        if (cloudUser) {
          saveCloudBooking(cloudUser.uid, booking).catch((e) =>
            console.log("Could not save booking:", e.message),
          );
        }

        set((s) => ({
          bookings: [booking, ...s.bookings],
        }));

        return booking;
      },

      cancelBooking: async (id) => {
        const cloudUser = cloudUserOrNull(stateRef.current.user);
        if (cloudUser) {
          updateCloudBooking(cloudUser.uid, id, { status: "cancelled" }).catch(
            (e) => console.log("Could not update booking:", e.message),
          );
        }

        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: "cancelled" } : b,
          ),
        }));
      },

      // Only the brand, last 4 digits, holder name and expiry are kept. The full number and CVV are never stored.
      addCard: (c) =>
        set((s) => {
          const makeDefault = !!c.default || s.cards.length === 0;
          const card = { ...c, id: uid("card"), default: makeDefault };
          const others = makeDefault
            ? s.cards.map((x) => ({ ...x, default: false }))
            : s.cards;
          return { cards: [...others, card] };
        }),
      removeCard: (id) =>
        set((s) => {
          const left = s.cards.filter((c) => c.id !== id);
          if (left.length && !left.some((c) => c.default))
            left[0] = { ...left[0], default: true };
          return { cards: left };
        }),
      setDefaultCard: (id) =>
        set((s) => ({
          cards: s.cards.map((c) => ({ ...c, default: c.id === id })),
        })),
      setWallet: (k, v) => set((s) => ({ wallets: { ...s.wallets, [k]: v } })),
      setBilling: (b) => set(() => ({ billing: b })),
      toggleSaved: (id) =>
        set((s) => ({
          saved: s.saved.includes(id)
            ? s.saved.filter((x) => x !== id)
            : [...s.saved, id],
        })),
      setNotifications: (v) => set(() => ({ notifications: v })),
      resetAll: () => setState({ ...DEFAULT, vault: {} }),
    };
  }, []);

  const value = useMemo(
    () => ({ ...state, ready, ...api }),
    [state, ready, api],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
