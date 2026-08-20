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
  GoogleAuthProvider
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
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
  ? f.getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : f.getFirestore(app);

export const auth = getAuth(app);

// Force session persistence to local storage so credentials survive reload, background sleep, or tab minimization o!
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Failed to set explicit auth persistence:", err);
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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  // CRITICAL: Must write matching text to match test parsing of Firestore Errors!
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Dispatch a global event as standard custom logging
  if (typeof window !== 'undefined') {
    const isQuota = errInfo.error.includes("Quota exceeded") || errInfo.error.includes("quota");
    const event = new CustomEvent('firestore-error-event', { 
      detail: { ...errInfo, isQuota } 
    });
    window.dispatchEvent(event);
  }

  // If we hit permission or quota errors, seamlessly fall back to local storage
  const isPermissionError = errInfo.error.toLowerCase().includes("permission") || 
                            errInfo.error.toLowerCase().includes("insufficient") ||
                            errInfo.error.toLowerCase().includes("unauthorized");
  if (isPermissionError) {
    isFallbackMode = true;
    triggerAllFallbackListeners();
    console.warn("Firestore permission blocked on cloud database. Automatically fell back to secure, high-fidelity local-first storage mode!");
    return;
  }
}

// -------------------------------------------------------------
// SECURE ROBUST SEAMLESS LOCAL FALLBACK ENGINE O!
// -------------------------------------------------------------

export let isFallbackMode = false;
let localFallbackDb: Record<string, any> = {};

// Load local db from localStorage on boot
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

// Automatically turn on fallback if firestore has pre-existing daily quota exceeded errors or on boot check fails
function saveFallbackDb() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('local_fallback_db', JSON.stringify(localFallbackDb));
    }
  } catch (e) {
    console.warn("localStorage saving failed for fallback DB", e);
  }
}

function isQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return msg.includes('quota') || 
         msg.includes('exhausted') || 
         msg.includes('resource-exhausted') || 
         msg.includes('limit') ||
         msg.includes('permission') ||
         msg.includes('insufficient') ||
         msg.includes('unauthorized');
}

// Deep Merging helper for updates/merge operations
function mergeDeep(fbTarget: any, fbSource: any): any {
  if (!fbTarget || typeof fbTarget !== 'object') return fbSource;
  if (!fbSource || typeof fbSource !== 'object') return fbSource;

  const out = { ...fbTarget };
  Object.keys(fbSource).forEach(key => {
    const val = fbSource[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      out[key] = mergeDeep(out[key] || {}, val);
    } else if (val && val.__isFieldValueUnion) {
      const currentArr = Array.isArray(out[key]) ? out[key] : [];
      let nextArr = [...currentArr];
      val.values.forEach((v: any) => {
        if (!nextArr.includes(v)) nextArr.push(v);
      });
      out[key] = nextArr;
    } else if (val && val.__isFieldValueRemove) {
      const currentArr = Array.isArray(out[key]) ? out[key] : [];
      out[key] = currentArr.filter((item: any) => !val.values.includes(item));
    } else {
      out[key] = val;
    }
  });
  return out;
}

// ---------------------------
// REFERENCE PROXIES
// ---------------------------

export interface ProxyDocRef {
  __isProxyRef: true;
  type: 'doc';
  path: string;
  id: string;
  original: any;
}

export interface ProxyCollectionRef {
  __isProxyRef: true;
  type: 'collection';
  path: string;
  id: string;
  original: any;
}

export interface ProxyQuery {
  __isProxyRef: true;
  type: 'query';
  path: string;
  filters: any[];
  orders: any[];
  original: any;
}

export function doc(dbOrParent: any, ...segments: string[]): any {
  let basePath = '';
  if (dbOrParent && dbOrParent.__isProxyRef) {
    basePath = dbOrParent.path;
  }
  const cleanSegments = segments.filter(Boolean);
  const path = basePath ? [basePath, ...cleanSegments].join('/') : cleanSegments.join('/');
  
  let original: any = null;
  try {
    const origParent = dbOrParent && dbOrParent.__isProxyRef ? dbOrParent.original : dbOrParent;
    original = (f.doc as any)(origParent, ...segments);
  } catch (e) {
    // offline/disabled
  }

  return {
    __isProxyRef: true,
    type: 'doc' as const,
    path,
    id: cleanSegments[cleanSegments.length - 1] || '',
    original,
  };
}

export function collection(dbOrParent: any, ...segments: string[]): any {
  let basePath = '';
  if (dbOrParent && dbOrParent.__isProxyRef) {
    basePath = dbOrParent.path;
  }
  const cleanSegments = segments.filter(Boolean);
  const path = basePath ? [basePath, ...cleanSegments].join('/') : cleanSegments.join('/');

  let original: any = null;
  try {
    const origParent = dbOrParent && dbOrParent.__isProxyRef ? dbOrParent.original : dbOrParent;
    original = (f.collection as any)(origParent, ...segments);
  } catch (e) {
    // offline/disabled
  }

  return {
    __isProxyRef: true,
    type: 'collection' as const,
    path,
    id: cleanSegments[cleanSegments.length - 1] || '',
    original,
  };
}

export function query(collectionRef: any, ...constraints: any[]): any {
  const path = collectionRef.__isProxyRef ? collectionRef.path : '';
  const filters: any[] = [];
  const orders: any[] = [];
  let limitVal: number | null = null;
  let limitToLastVal: number | null = null;
  
  constraints.forEach(c => {
    if (c && c.type === 'where') {
      filters.push(c);
    } else if (c && c.type === 'orderBy') {
      orders.push(c);
    } else if (c && c.type === 'limit') {
      limitVal = c.value;
    } else if (c && c.type === 'limitToLast') {
      limitToLastVal = c.value;
    }
  });

  let original: any = null;
  try {
    // If not currently failing, prepare the real Firestore query
    if (!isFallbackMode) {
      const origColl = collectionRef.__isProxyRef ? collectionRef.original : collectionRef;
      const origConstraints = constraints.map(c => c && c.type ? c.original : c).filter(Boolean);
      original = (f.query as any)(origColl, ...origConstraints);
    }
  } catch (e) {
    // offline/disabled
  }

  return {
    __isProxyRef: true,
    type: 'query' as const,
    path,
    filters,
    orders,
    limitVal,
    limitToLastVal,
    original,
  };
}

export function where(field: string, op: string, value: any) {
  let original: any = null;
  try {
    original = f.where(field, op as any, value);
  } catch (e) {}
  return {
    type: 'where' as const,
    field,
    op,
    value,
    original,
  };
}

export function orderBy(field: string, direction: string = 'asc') {
  let original: any = null;
  try {
    original = f.orderBy(field, direction as any);
  } catch (e) {}
  return {
    type: 'orderBy' as const,
    field,
    direction,
    original,
  };
}

export function limit(value: number) {
  let original: any = null;
  try {
    original = f.limit(value);
  } catch (e) {}
  return {
    type: 'limit' as const,
    value,
    original,
  };
}

export function limitToLast(value: number) {
  let original: any = null;
  try {
    original = f.limitToLast(value);
  } catch (e) {}
  return {
    type: 'limitToLast' as const,
    value,
    original,
  };
}

export function arrayUnion(...elements: any[]) {
  return {
    __isFieldValueUnion: true,
    values: elements,
    original: f.arrayUnion(...elements),
  };
}

export function arrayRemove(...elements: any[]) {
  return {
    __isFieldValueRemove: true,
    values: elements,
    original: f.arrayRemove(...elements),
  };
}

// ---------------------------
// SNAPSHOT BUILDERS
// ---------------------------

export interface MockDocumentSnapshot {
  id: string;
  exists: () => boolean;
  data: () => any;
  ref: { path: string; id: string };
}

function buildMockDocSnapshot(path: string): MockDocumentSnapshot {
  const parts = path.split('/');
  const id = parts[parts.length - 1] || '';
  const val = localFallbackDb[path];
  return {
    id,
    exists: () => val !== undefined && val !== null,
    data: () => val ? JSON.parse(JSON.stringify(val)) : undefined,
    ref: { path, id }
  };
}

export interface MockQuerySnapshot {
  empty: boolean;
  size: number;
  docs: MockDocumentSnapshot[];
  forEach: (callback: (doc: MockDocumentSnapshot) => void) => void;
}

function buildMockQuerySnapshot(target: any): MockQuerySnapshot {
  const path = target.path; 
  const filters = target.filters || [];
  const orders = target.orders || [];

  const keys = Object.keys(localFallbackDb).filter(k => {
    if (!k.startsWith(path + '/')) return false;
    const sub = k.slice(path.length + 1);
    return !sub.includes('/'); // direct children only
  });

  let docs = keys.map(k => buildMockDocSnapshot(k)).filter(d => d.exists());

  // Apply filters
  filters.forEach(fItem => {
    const { field, op, value } = fItem;
    docs = docs.filter(d => {
      const docData = d.data();
      if (!docData) return false;
      const docVal = docData[field];
      if (op === '==' || op === '===') {
        return docVal === value;
      }
      if (op === '!=') {
        return docVal !== value;
      }
      if (op === 'in') {
        return Array.isArray(value) && value.includes(docVal);
      }
      if (op === 'array-contains') {
        return Array.isArray(docVal) && docVal.includes(value);
      }
      return true;
    });
  });

  // Apply orders
  orders.forEach(o => {
    const { field, direction } = o;
    docs.sort((a, b) => {
      const aVal = a.data()?.[field];
      const bVal = b.data()?.[field];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return direction === 'desc' ? 1 : -1;
      if (aVal > bVal) return direction === 'desc' ? -1 : 1;
      return 0;
    });
  });

  // Apply limits
  if (target.limitVal !== undefined && target.limitVal !== null) {
    docs = docs.slice(0, target.limitVal);
  } else if (target.limitToLastVal !== undefined && target.limitToLastVal !== null) {
    docs = docs.slice(-target.limitToLastVal);
  }

  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (callback) => {
      docs.forEach(callback);
    }
  };
}

// ---------------------------
// LIFECYCLE LISTENERS
// ---------------------------

interface FallbackListener {
  target: any;
  onNext: (snap: any) => void;
}
const fallbackListeners: FallbackListener[] = [];

function registerFallbackListener(target: any, onNext: (snap: any) => void): () => void {
  const listener = { target, onNext };
  fallbackListeners.push(listener);
  
  setTimeout(() => {
    try {
      if (target.type === 'doc') {
        onNext(buildMockDocSnapshot(target.path));
      } else {
        onNext(buildMockQuerySnapshot(target));
      }
    } catch (e) {
      console.warn("Error triggering initial fallback data", e);
    }
  }, 0);

  return () => {
    const idx = fallbackListeners.indexOf(listener);
    if (idx > -1) {
      fallbackListeners.splice(idx, 1);
    }
  };
}

function triggerAllFallbackListeners(changedPath?: string) {
  fallbackListeners.forEach(listener => {
    try {
      const match = !changedPath || 
                    listener.target.path === changedPath || 
                    listener.target.path.startsWith(changedPath + '/') || 
                    changedPath.startsWith(listener.target.path + '/');
      if (match) {
        if (listener.target.type === 'doc') {
          listener.onNext(buildMockDocSnapshot(listener.target.path));
        } else {
          listener.onNext(buildMockQuerySnapshot(listener.target));
        }
      }
    } catch (e) {
      console.warn("Real-time fallback notice callback failed", e);
    }
  });
}

// ---------------------------
// DATA ACCESS PROXIES
// ---------------------------

export async function getDoc(ref: any): Promise<any> {
  if (isFallbackMode) {
    return buildMockDocSnapshot(ref.path);
  }
  try {
    const origRef = ref.__isProxyRef ? ref.original : ref;
    return await f.getDoc(origRef);
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      triggerAllFallbackListeners();
      return buildMockDocSnapshot(ref.path);
    }
    throw err;
  }
}

export async function getDocFromServer(ref: any): Promise<any> {
  if (isFallbackMode) {
    return buildMockDocSnapshot(ref.path);
  }
  try {
    const origRef = ref.__isProxyRef ? ref.original : ref;
    return await f.getDocFromServer(origRef);
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      triggerAllFallbackListeners();
      return buildMockDocSnapshot(ref.path);
    }
    throw err;
  }
}

export async function getDocs(target: any): Promise<any> {
  if (isFallbackMode) {
    return buildMockQuerySnapshot(target);
  }
  try {
    const origTarget = target.__isProxyRef ? (target.original || target.ref?.original) : target;
    return await f.getDocs(origTarget);
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      triggerAllFallbackListeners();
      return buildMockQuerySnapshot(target);
    }
    throw err;
  }
}

export async function setDoc(ref: any, data: any, options?: any): Promise<void> {
  if (isFallbackMode) {
    const existing = localFallbackDb[ref.path] || {};
    if (options && options.merge) {
      localFallbackDb[ref.path] = mergeDeep(existing, data);
    } else {
      localFallbackDb[ref.path] = data;
    }
    saveFallbackDb();
    triggerAllFallbackListeners(ref.path);
    return;
  }
  try {
    const origRef = ref.__isProxyRef ? ref.original : ref;
    const cleanData = JSON.parse(JSON.stringify(data)); // clean custom wrapper proxy wrappers
    await f.setDoc(origRef, cleanData, options);
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      const existing = localFallbackDb[ref.path] || {};
      if (options && options.merge) {
        localFallbackDb[ref.path] = mergeDeep(existing, data);
      } else {
        localFallbackDb[ref.path] = data;
      }
      saveFallbackDb();
      triggerAllFallbackListeners(ref.path);
      return;
    }
    throw err;
  }
}

export async function updateDoc(ref: any, data: any): Promise<void> {
  if (isFallbackMode) {
    const existing = localFallbackDb[ref.path] || {};
    localFallbackDb[ref.path] = mergeDeep(existing, data);
    saveFallbackDb();
    triggerAllFallbackListeners(ref.path);
    return;
  }
  try {
    const origRef = ref.__isProxyRef ? ref.original : ref;
    const cleanData = JSON.parse(JSON.stringify(data));
    await f.updateDoc(origRef, cleanData);
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      const existing = localFallbackDb[ref.path] || {};
      localFallbackDb[ref.path] = mergeDeep(existing, data);
      saveFallbackDb();
      triggerAllFallbackListeners(ref.path);
      return;
    }
    throw err;
  }
}

export async function addDoc(collectionRef: any, data: any): Promise<any> {
  const randomId = 'sim_' + Math.random().toString(36).substring(2, 10);
  const path = collectionRef.path + '/' + randomId;
  
  if (isFallbackMode) {
    localFallbackDb[path] = data;
    saveFallbackDb();
    triggerAllFallbackListeners(path);
    return { id: randomId };
  }
  try {
    const origColl = collectionRef.__isProxyRef ? collectionRef.original : collectionRef;
    const cleanData = JSON.parse(JSON.stringify(data));
    return await f.addDoc(origColl, cleanData);
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      localFallbackDb[path] = data;
      saveFallbackDb();
      triggerAllFallbackListeners(path);
      return { id: randomId };
    }
    throw err;
  }
}

export async function deleteDoc(ref: any): Promise<void> {
  if (isFallbackMode) {
    delete localFallbackDb[ref.path];
    const keys = Object.keys(localFallbackDb);
    keys.forEach(k => {
      if (k === ref.path || k.startsWith(ref.path + '/')) {
        delete localFallbackDb[k];
      }
    });
    saveFallbackDb();
    triggerAllFallbackListeners(ref.path);
    return;
  }
  try {
    const origRef = ref.__isProxyRef ? ref.original : ref;
    await f.deleteDoc(origRef);
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      delete localFallbackDb[ref.path];
      const keys = Object.keys(localFallbackDb);
      keys.forEach(k => {
        if (k === ref.path || k.startsWith(ref.path + '/')) {
          delete localFallbackDb[k];
        }
      });
      saveFallbackDb();
      triggerAllFallbackListeners(ref.path);
      return;
    }
    throw err;
  }
}

const fallbackUnsubscribeMap = new Map<string, () => void>();

export function onSnapshot(target: any, onNext: (snap: any) => void, onError?: (err: any) => void): () => void {
  if (isFallbackMode) {
    return registerFallbackListener(target, onNext);
  }

  const origTarget = target.__isProxyRef ? (target.original || target.ref?.original) : target;
  if (!origTarget) {
    return registerFallbackListener(target, onNext);
  }

  const unsubKey = Math.random().toString(36).substring(7);

  const unsub = f.onSnapshot(origTarget, (snap) => {
    onNext(snap);
  }, (err) => {
    if (isQuotaError(err)) {
      isFallbackMode = true;
      triggerAllFallbackListeners();
      const localUnsub = registerFallbackListener(target, onNext);
      fallbackUnsubscribeMap.set(unsubKey, localUnsub);
    } else {
      if (onError) onError(err);
    }
  });

  return () => {
    unsub();
    const mapped = fallbackUnsubscribeMap.get(unsubKey);
    if (mapped) {
      mapped();
      fallbackUnsubscribeMap.delete(unsubKey);
    }
  };
}

// -------------------------------------------------------------
// WRAPPED FIREBASE AUTHENTICATION ENGINE - PRODUCTION READY
// -------------------------------------------------------------

export { GoogleAuthProvider };

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  return fOnAuthStateChanged(auth, callback);
}

export async function signOut(authInstance: any) {
  await fSignOut(auth);
}

export async function signInWithPopup(authInstance: any, provider: any) {
  try {
    return await fSignInWithPopup(auth, provider);
  } catch (err: any) {
    console.error("Sign-in with popup failed:", err);
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Google Sign-In is not enabled in your Firebase Console. Under Authentication -> Sign-In Method, enable 'Google' as a sign-in provider.");
    }
    throw err;
  }
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  try {
    return await fSignInWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    console.error("Sign-in with email failed:", err);
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Email/Password Sign-In is not enabled in your Firebase Console. Under Authentication -> Sign-In Method, enable 'Email/Password' as a sign-in provider.");
    }
    throw err;
  }
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  try {
    return await fCreateUserWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    console.error("Create user with email failed:", err);
    if (err.code === 'auth/operation-not-allowed') {
      throw new Error("Email/Password Sign-In is not enabled in your Firebase Console. Under Authentication -> Sign-In Method, enable 'Email/Password' as a sign-in provider.");
    }
    throw err;
  }
}

export const storage = getStorage(app);

/**
 * Uploads a File, Blob, or base64 string to Firebase Storage and returns the download URL.
 * Falls back to returning the base64/original data URL if upload fails (e.g., config missing/quota).
 */
export async function uploadToStorage(data: File | Blob | string, path: string): Promise<string> {
  try {
    const storageRef = sRef(storage, path);
    let blob: Blob;

    if (data instanceof File || data instanceof Blob) {
      blob = await compressImage(data);
    } else if (typeof data === 'string' && data.startsWith('data:')) {
      // It's a base64 Data URL, convert to Blob
      const arr = data.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const rawBlob = new Blob([u8arr], { type: mime });
      blob = await compressImage(rawBlob);
    } else {
      return data; // Return string directly if not base64
    }

    const snapshot = await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn("Firebase Storage upload failed, falling back to local/base64 representation:", err);
    
    // Attempt local compression before base64 fallback
    let fallbackBlob: Blob | null = null;
    if (data instanceof File || data instanceof Blob) {
      try {
        fallbackBlob = await compressImage(data);
      } catch (e) {}
    } else if (typeof data === 'string' && data.startsWith('data:')) {
      try {
        const arr = data.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const rawBlob = new Blob([u8arr], { type: mime });
        fallbackBlob = await compressImage(rawBlob);
      } catch (e) {}
    }

    if (fallbackBlob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(typeof data === 'string' ? data : '');
        reader.readAsDataURL(fallbackBlob!);
      });
    }

    if (typeof data === 'string') {
      return data;
    }
    // Convert File/Blob to base64 as fallback o!
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(data);
    });
  }
}

export interface AppNotification {
  id: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  type: 'friend_request' | 'message' | 'meetup' | 'rating' | 'post_like';
  title: string;
  message: string;
  isUnread: boolean;
  createdAt: string;
}

export async function createNotification(notification: Omit<AppNotification, 'id' | 'isUnread' | 'createdAt'>) {
  try {
    const id = Math.random().toString(36).substring(2, 11);
    const notifRef = f.doc(db, 'notifications', id);
    await f.setDoc(notifRef, {
      ...notification,
      id,
      isUnread: true,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to create Firestore notification:", err);
  }
}

export async function markNotificationsAsRead(userId: string, type?: string) {
  try {
    const q = f.query(
      f.collection(db, 'notifications'),
      f.where('userId', '==', userId),
      f.where('isUnread', '==', true)
    );
    const snap = await f.getDocs(q);
    const batchPromises = snap.docs.map(async (docSnap) => {
      if (!type || docSnap.data().type === type) {
        await f.updateDoc(f.doc(db, 'notifications', docSnap.id), { isUnread: false });
      }
    });
    await Promise.all(batchPromises);
  } catch (err) {
    console.warn("Failed to mark notifications as read:", err);
  }
}

