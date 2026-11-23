// All Firestore reading/writing for a signed-in user lives here.
//
// Data layout in Firestore:
//   users/{uid}                    -> profile (name, email, phone, ...)
//   users/{uid}/bookings/{id}      -> one document per booking
//   users/{uid}/data/settings      -> cards, wallets, billing, saved stays
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// Firestore rejects `undefined`, so strip it before saving.
const clean = (v) => JSON.parse(JSON.stringify(v));

export async function loadCloudData(uid) {
  const [settingsSnap, bookingsSnap] = await Promise.all([
    getDoc(doc(db, "users", uid, "data", "settings")),
    getDocs(collection(db, "users", uid, "bookings")),
  ]);

  const settings = settingsSnap.exists() ? settingsSnap.data() : null;
  const bookings = bookingsSnap.docs
    .map((d) => {
      // Server timestamps are Firestore objects, the app doesn't need them.
      const { createdAtServer, updatedAt, ...rest } = d.data();
      return rest;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return { settings, bookings };
}

export function saveCloudSettings(uid, data) {
  return setDoc(doc(db, "users", uid, "data", "settings"), {
    ...clean(data),
    updatedAt: serverTimestamp(),
  });
}

export function saveCloudBooking(uid, booking) {
  return setDoc(doc(db, "users", uid, "bookings", booking.id), {
    ...clean(booking),
    createdAtServer: serverTimestamp(),
  });
}

export function updateCloudBooking(uid, id, patch) {
  return setDoc(
    doc(db, "users", uid, "bookings", id),
    { ...clean(patch), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export const cloudUserOrNull = (appUser) => {
  const fb = auth.currentUser;
  return appUser && !appUser.guest && fb && fb.uid === appUser.uid ? fb : null;
};

// Remove everything stored for this account (used by "Delete account").
export async function deleteCloudAccountData(uid) {
  const bookings = await getDocs(collection(db, "users", uid, "bookings"));
  await Promise.all(bookings.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "users", uid, "data", "settings"));
  await deleteDoc(doc(db, "users", uid));
}
