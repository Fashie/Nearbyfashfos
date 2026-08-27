import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged as fOnAuthStateChanged,
  signOut as fSignOut,
  signInWithPopup as fSignInWithPopup,
  signInWithEmailAndPassword as fSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fCreateUserWithEmailAndPassword,
  GoogleAuthProvider,
} from 'firebase/auth';
import * as f from 'firebase/firestore';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfigDefault from '../firebase-applet-config.json';
import { compressImage } from './utils/imageCompressor';

const envConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

const firebaseConfig = {
  apiKey: envConfig.apiKey || firebaseConfigDefault.apiKey,
  authDomain: envConfig.authDomain || firebaseConfigDefault.authDomain,
  projectId: envConfig.projectId || firebaseConfigDefault.projectId,
  storageBucket: envConfig.storageBucket || firebaseConfigDefault.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || firebaseConfigDefault.messagingSenderId,
  appId: envConfig.appId || firebaseConfigDefault.appId,
  measurementId: envConfig.measurementId || firebaseConfigDefault.measurementId,
  firestoreDatabaseId: envConfig.firestoreDatabaseId || firebaseConfigDefault.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? f.getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : f.getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set explicit auth persistence:', err);
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: { providerId?: string | null; email?: string | null }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  if (typeof window !== 'undefined') {
    const lower = errInfo.error.toLowerCase();
    window.dispatchEvent(new CustomEvent('firestore-error-event', {
      detail: {
        ...errInfo,
        isQuota: lower.includes('quota') || lower.includes('resource-exhausted'),
      },
    }));
  }
}

// Keep Firebase's native references and sentinels. There is intentionally no
// local database fallback: a successful local write must never masquerade as a
// successful cloud write in a realtime social application.
export const doc = f.doc;
export const collection = f.collection;
export const query = f.query;
export const where = f.where;
export const orderBy = f.orderBy;
export const limit = f.limit;
export const limitToLast = f.limitToLast;
export const arrayUnion = f.arrayUnion;
export const arrayRemove = f.arrayRemove;
export const onSnapshot = f.onSnapshot;

export async function getDoc(ref: any) {
  try {
    return await f.getDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, ref.path);
    throw err;
  }
}

export async function getDocFromServer(ref: any) {
  try {
    return await f.getDocFromServer(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, ref.path);
    throw err;
  }
}

export async function getDocs(target: any) {
  try {
    return await f.getDocs(target);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, target.path);
    throw err;
  }
}

export async function setDoc(ref: any, data: any, options?: any) {
  try {
    return await f.setDoc(ref, data, options as any);
  } catch (err) {
    handleFirestoreError(err, options?.merge ? OperationType.UPDATE : OperationType.CREATE, ref.path);
    throw err;
  }
}

export async function updateDoc(ref: any, data: any) {
  try {
    return await f.updateDoc(ref, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, ref.path);
    throw err;
  }
}

export async function addDoc(collectionRef: any, data: any) {
  try {
    return await f.addDoc(collectionRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, collectionRef.path);
    throw err;
  }
}

export async function deleteDoc(ref: any) {
  try {
    return await f.deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, ref.path);
    throw err;
  }
}

export { GoogleAuthProvider };

export function onAuthStateChanged(_authInstance: any, callback: (user: any) => void) {
  return fOnAuthStateChanged(auth, callback);
}

export async function signOut(_authInstance: any) {
  return fSignOut(auth);
}

export async function signInWithPopup(_authInstance: any, provider: any) {
  try {
    return await fSignInWithPopup(auth, provider);
  } catch (err: any) {
    console.error('Sign-in with popup failed:', err);
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Google Sign-In is not enabled in your Firebase Console. Under Authentication -> Sign-In Method, enable 'Google'.");
    }
    throw err;
  }
}

export async function signInWithEmailAndPassword(_authInstance: any, email: string, pass: string) {
  try {
    return await fSignInWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    console.error('Sign-in with email failed:', err);
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Email/Password Sign-In is not enabled in your Firebase Console. Under Authentication -> Sign-In Method, enable 'Email/Password'.");
    }
    throw err;
  }
}

export async function createUserWithEmailAndPassword(_authInstance: any, email: string, pass: string) {
  try {
    return await fCreateUserWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    console.error('Create user with email failed:', err);
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Email/Password Sign-In is not enabled in your Firebase Console. Under Authentication -> Sign-In Method, enable 'Email/Password'.");
    }
    throw err;
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',', 2);
  if (!header || !encoded) throw new Error('Invalid data URL.');
  const mime = header.match(/data:([^;]+);base64/i)?.[1] || 'application/octet-stream';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Uploads media to Firebase Storage. Upload failure is propagated deliberately. */
export async function uploadToStorage(data: File | Blob | string, path: string): Promise<string> {
  let blob: Blob;
  if (data instanceof File || data instanceof Blob) {
    blob = await compressImage(data);
  } else if (typeof data === 'string' && data.startsWith('data:')) {
    blob = await compressImage(dataUrlToBlob(data));
  } else {
    throw new Error('uploadToStorage expects a File, Blob, or data URL.');
  }

  try {
    const storageRef = sRef(storage, path);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'application/octet-stream',
    });
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.error(`Firebase Storage upload failed for ${path}:`, err);
    throw err;
  }
}

export interface AppNotification {
  id: string;
  userId: string;
  senderId: string;
  senderName: string;
  type: string;
  title: string;
  message: string;
  isUnread: boolean;
  createdAt: string;
}

export async function createNotification(notification: Omit<AppNotification, 'id' | 'isUnread' | 'createdAt'>) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const notifRef = f.doc(db, 'notifications', id);
  try {
    await f.setDoc(notifRef, {
      ...notification,
      id,
      isUnread: true,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, notifRef.path);
    throw err;
  }
}

export async function markNotificationsAsRead(userId: string, type?: string) {
  try {
    const q = f.query(
      f.collection(db, 'notifications'),
      f.where('userId', '==', userId),
      f.where('isUnread', '==', true),
    );
    const snap = await f.getDocs(q);
    await Promise.all(snap.docs
      .filter((docSnap) => !type || docSnap.data().type === type)
      .map((docSnap) => f.updateDoc(f.doc(db, 'notifications', docSnap.id), { isUnread: false })));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    throw err;
  }
}
