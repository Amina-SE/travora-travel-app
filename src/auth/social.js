
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';

import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';

import { auth } from '../firebase';
import { AUTH } from './authConfig';

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function providerStatus(provider) {
  if (provider === 'apple') {
    if (Platform.OS !== 'ios') return 'unsupported';

    try {
      return (await AppleAuthentication.isAvailableAsync())
        ? 'ready'
        : 'unsupported';
    } catch (e) {
      return 'unsupported';
    }
  }

  // Browser Google login does not need native client IDs.
  if (Platform.OS === 'web') return 'ready';

  if (isExpoGo) return 'expo-go';

  if (
    !AUTH.googleWebClientId ||
    (Platform.OS === 'ios' && !AUTH.googleIosClientId)
  ) {
    return 'not-configured';
  }

  return 'ready';
}

export class AuthCancelled extends Error {}

export async function signInWithApple() {
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const name = [
      cred.fullName?.givenName,
      cred.fullName?.familyName,
    ].filter(Boolean).join(' ');

    return {
      provider: 'apple',
      providerId: cred.user,
      email: cred.email || null,
      name: name || null,
      photo: null,
    };
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') {
      throw new AuthCancelled();
    }

    throw new Error(
      'Apple sign-in didn’t complete. Check that you’re signed in to iCloud on this iPhone.'
    );
  }
}

export async function signInWithGoogle() {
  // Browser Google login using Firebase popup.
  if (Platform.OS === 'web') {
    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      return {
        provider: 'google',
        providerId: user.uid,
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Google User',
        photo: user.photoURL || null,
      };
    } catch (e) {
      if (e?.code === 'auth/popup-closed-by-user') {
        throw new AuthCancelled();
      }

      if (e?.code === 'auth/popup-blocked') {
        throw new Error('Your browser blocked the Google popup. Allow popups and try again.');
      }

      if (e?.code === 'auth/unauthorized-domain') {
        throw new Error('This website domain is not authorized in Firebase Authentication.');
      }

      throw new Error(
        e.message || 'Google sign-in failed. Please try again.'
      );
    }
  }

  // Existing native Google login.
  const G = require('@react-native-google-signin/google-signin');

  const {
    GoogleSignin,
    statusCodes,
    isSuccessResponse,
    isErrorWithCode,
  } = G;

  try {
    GoogleSignin.configure({
      webClientId: AUTH.googleWebClientId,
      iosClientId: AUTH.googleIosClientId || undefined,
    });

    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const res = await GoogleSignin.signIn();

    if (!isSuccessResponse(res)) throw new AuthCancelled();

    const u = res.data.user;

    // Sign in to Firebase too, so this person has a real account and cloud data.
    const fb = await signInWithCredential(
      auth,
      GoogleAuthProvider.credential(res.data.idToken)
    );

    return {
      provider: 'google',
      providerId: fb.user.uid,
      uid: fb.user.uid,
      email: u.email,
      name: u.name || [u.givenName, u.familyName].filter(Boolean).join(' '),
      photo: u.photo || null,
    };
  } catch (e) {
    if (e instanceof AuthCancelled) throw e;

    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new AuthCancelled();
      }

      if (e.code === statusCodes.IN_PROGRESS) {
        throw new Error('A Google sign-in is already open.');
      }

      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play services is missing or out of date on this phone.');
      }
    }

    throw new Error(
      'Google sign-in didn’t complete. Check your connection and client IDs.'
    );
  }
}

export async function signOutSocial(provider) {
  if (provider !== 'google' || Platform.OS === 'web' || isExpoGo) return;

  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut();
  } catch (e) {
    // Already signed out.
  }
}
