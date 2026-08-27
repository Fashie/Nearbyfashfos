import { db, setDoc, getDoc, updateDoc, handleFirestoreError, OperationType } from '../../../firebase';
import { doc } from 'firebase/firestore';

export const profileService = {
  getUserProfile: async (uid: string) => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  },

  saveUserProfile: async (uid: string, profileData: any) => {
    await setDoc(doc(db, 'users', uid), {
      ...profileData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    try {
      localStorage.setItem(`nearby_cached_profile_${uid}`, JSON.stringify(profileData));
    } catch (_) {}
  },

  // Accepts a Firebase Storage URL, never a base64 payload.
  updateProfilePhoto: async (uid: string, photoUrl: string) => {
    if (!photoUrl || photoUrl.startsWith('data:')) {
      throw new Error('Profile photo must be uploaded to Firebase Storage before it is persisted.');
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        customProfilePhoto: photoUrl,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }

    try {
      const cachedRaw = localStorage.getItem(`nearby_cached_profile_${uid}`);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        localStorage.setItem(`nearby_cached_profile_${uid}`, JSON.stringify({ ...parsed, customProfilePhoto: photoUrl }));
      }
    } catch (_) {}
  },
};
