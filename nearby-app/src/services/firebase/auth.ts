import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import firebaseConfigDefault from '../../../firebase-applet-config.json';

const envConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID
};

const firebaseConfig = {
  apiKey: envConfig.apiKey || firebaseConfigDefault.apiKey,
  authDomain: envConfig.authDomain || firebaseConfigDefault.authDomain,
  projectId: envConfig.projectId || firebaseConfigDefault.projectId,
  storageBucket: envConfig.storageBucket || firebaseConfigDefault.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || firebaseConfigDefault.messagingSenderId,
  appId: envConfig.appId || firebaseConfigDefault.appId,
  measurementId: envConfig.measurementId || firebaseConfigDefault.measurementId,
  firestoreDatabaseId: envConfig.firestoreDatabaseId || firebaseConfigDefault.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Failed to set explicit auth persistence:", err);
});

export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string) {
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function logoutUser() {
  try {
    localStorage.removeItem('nearby_current_uid');
  } catch (_) {}
  return signOut(auth);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function verifyEmail(user: User) {
  return sendEmailVerification(user);
}

export async function updateUserDisplayName(user: User, displayName: string, photoURL?: string) {
  return updateProfile(user, { displayName, photoURL });
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification
};
export type { User };
