import { db, auth, OperationType, handleFirestoreError } from '../../firebase';
import * as f from 'firebase/firestore';

export { db, auth, OperationType, handleFirestoreError };

// Basic Firebase Wrapper services
export const getDocument = async (col: string, id: string) => {
  try {
    const docRef = f.doc(db, col, id);
    const snap = await f.getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${col}/${id}`);
    throw err;
  }
};

export const setDocument = async (col: string, id: string, data: any, merge = true) => {
  try {
    const docRef = f.doc(db, col, id);
    await f.setDoc(docRef, data, { merge });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${col}/${id}`);
    throw err;
  }
};

export const addDocument = async (col: string, data: any) => {
  try {
    const colRef = f.collection(db, col);
    const docRef = await f.addDoc(colRef, data);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, col);
    throw err;
  }
};
