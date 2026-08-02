import { db, setDocument, getDocument } from '../../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const profileService = {
  getUserProfile: async (uid: string) => {
    return getDocument('users', uid);
  },

  saveUserProfile: async (uid: string, profileData: any) => {
    await setDocument('users', uid, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, true);
    
    // Also store on-disk for instant restoration
    try {
      localStorage.setItem(`nearby_cached_profile_${uid}`, JSON.stringify(profileData));
    } catch (_) {}
  },

  updateProfilePhoto: async (uid: string, base64Photo: string) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      customProfilePhoto: base64Photo,
      updatedAt: new Date().toISOString()
    });
    
    // Sync with local cache
    try {
      const cachedRaw = localStorage.getItem(`nearby_cached_profile_${uid}`);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        parsed.customProfilePhoto = base64Photo;
        localStorage.setItem(`nearby_cached_profile_${uid}`, JSON.stringify(parsed));
      }
    } catch (_) {}
  }
};
