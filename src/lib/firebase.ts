

import { Platform } from 'react-native';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBYsKhMkjo_jhg1Koo_d9FnMxRqIc7S_Kw",
  authDomain: "sumo-93997.firebaseapp.com",
  projectId: "sumo-93997",
  storageBucket: "sumo-93997.firebasestorage.app",
  messagingSenderId: "913062446103",
  appId: "1:913062446103:web:6b9a9a1cbecdc24f6a8852",
  measurementId: "G-GEK095M3F7"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

// ✅ auth init: web uses getAuth; native uses initializeAuth with AsyncStorage
const _auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: /* @ts-ignore */ (getReactNativePersistence as any)(AsyncStorage) });

// typesafety for getReactNativePersistence at runtime:
import { getReactNativePersistence } from 'firebase/auth';

export const auth = _auth;
export const rtdb = getDatabase(app);

export const ensureAnonSignIn = async (): Promise<User> => {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
};

export const listenAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);
