import { initializeApp } from 'firebase/app';
import * as f from 'firebase/firestore';
import firebaseConfigDefault from '../../../firebase-applet-config.json';
import { auth } from './auth';

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

export const firebaseConfig = {
  apiKey: envConfig.apiKey || firebaseConfigDefault.apiKey,
  authDomain: envConfig.authDomain || firebaseConfigDefault.authDomain,
  projectId: envConfig.projectId || firebaseConfigDefault.projectId,
  storageBucket: envConfig.storageBucket || firebaseConfigDefault.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || firebaseConfigDefault.messagingSenderId,
  appId: envConfig.appId || firebaseConfigDefault.appId,
  measurementId: envConfig.measurementId || firebaseConfigDefault.measurementId,
  firestoreDatabaseId: envConfig.firestoreDatabaseId || firebaseConfigDefault.firestoreDatabaseId
};

export const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
  ? f.getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : f.getFirestore(app);

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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export let isFallbackMode = false;
let localFallbackDb: Record<string, any> = {};

try {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('local_fallback_db');
    if (saved) {
      localFallbackDb = JSON.parse(saved);
    }
  }
} catch (e) {
  console.warn("localStorage loading failed for fallback DB", e);
}

function saveFallbackDb() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('local_fallback_db', JSON.stringify(localFallbackDb));
    }
  } catch (e) {
    console.warn("localStorage saving failed for fallback DB", e);
  }
}

const fallbackListeners: Record<string, Array<(data: any) => void>> = {};

function notifyFallbackListeners(collectionName: string) {
  const listeners = fallbackListeners[collectionName] || [];
  const col = localFallbackDb[collectionName] || {};
  const data = Object.values(col);
  listeners.forEach(fn => {
    try { fn(data); } catch (_) {}
  });
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (typeof window !== 'undefined') {
    const isQuota = errInfo.error.includes("Quota exceeded") || errInfo.error.includes("quota");
    const event = new CustomEvent('firestore-error-event', { 
      detail: { ...errInfo, isQuota } 
    });
    window.dispatchEvent(event);
  }

  const isPermissionError = errInfo.error.toLowerCase().includes("permission") || 
                            errInfo.error.toLowerCase().includes("insufficient") ||
                            errInfo.error.toLowerCase().includes("unauthorized");
  if (isPermissionError) {
    isFallbackMode = true;
    console.warn("Firestore permission error. Switched to local fallback mode.");
  }
}

// Re-export core firestore methods
export const doc = f.doc;
export const collection = f.collection;
export const query = f.query;
export const orderBy = f.orderBy;
export const where = f.where;
export const limit = f.limit;
export const onSnapshot = f.onSnapshot;
export const getDoc = f.getDoc;
export const getDocs = f.getDocs;
export const setDoc = f.setDoc;
export const updateDoc = f.updateDoc;
export const deleteDoc = f.deleteDoc;
export const addDoc = f.addDoc;
export const arrayUnion = f.arrayUnion;
export const arrayRemove = f.arrayRemove;
export const getDocFromServer = f.getDocFromServer;
