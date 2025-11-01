// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { getDatabase } from 'firebase/database';


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

export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// tiny helper to ensure we’re signed in anonymously
export const ensureAnonSignIn = async (): Promise<User> => {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
};

// subscribe to auth changes
export const listenAuth = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);