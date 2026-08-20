import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  resetPassword,
  User
} from '../../../services/firebase/auth';
import { db, doc, getDoc, setDoc } from '../../../services/firebase/firestore';
import { UserProfile } from '../../../types';

interface AuthContextValue {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showLandingMode: boolean;
  setShowLandingMode: (show: boolean) => void;
  signInWithGoogle: () => Promise<any>;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<any>;
  sendPasswordReset: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  hasSavedAccountOnDisk: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [hasSavedAccountOnDisk, setHasSavedAccountOnDisk] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('nearby_current_uid'));
    } catch (_) {
      return false;
    }
  });
  const [showLandingMode, setShowLandingMode] = useState<boolean>(() => !hasSavedAccountOnDisk);

  // Sync profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        localStorage.setItem(`nearby_cached_profile_${uid}`, JSON.stringify(data));
        // Rule: Returning users with a populated name field bypass onboarding
        if (data.name && data.name.trim().length > 0) {
          setShowOnboarding(false);
          setShowLandingMode(false);
        } else {
          setShowOnboarding(true);
        }
      } else {
        // Fresh user: trigger onboarding
        setShowOnboarding(true);
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore, using disk cache:", err);
      try {
        const cached = localStorage.getItem(`nearby_cached_profile_${uid}`);
        if (cached) {
          setUserProfile(JSON.parse(cached));
          setShowOnboarding(false);
        }
      } catch (_) {}
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        localStorage.setItem('nearby_current_uid', user.uid);
        setHasSavedAccountOnDisk(true);
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const res = await loginWithGoogle();
    if (res.user) {
      localStorage.setItem('nearby_current_uid', res.user.uid);
      await fetchUserProfile(res.user.uid);
    }
    return res;
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    const res = await loginWithEmail(email, pass);
    if (res.user) {
      localStorage.setItem('nearby_current_uid', res.user.uid);
      await fetchUserProfile(res.user.uid);
    }
    return res;
  };

  const handleEmailSignUp = async (email: string, pass: string, name: string) => {
    const res = await registerWithEmail(email, pass);
    if (res.user) {
      localStorage.setItem('nearby_current_uid', res.user.uid);
      const newProfile: UserProfile = {
        uid: res.user.uid,
        name,
        username: name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000),
        email,
        bio: 'Connecting with neighbors face-to-face 👋',
        interests: ['Community', 'Safe Meetups'],
        verificationLevel: 'Basic',
        trustScore: 5.0,
        meetupCount: 0,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', res.user.uid), newProfile);
      setUserProfile(newProfile);
      setShowOnboarding(false);
      setShowLandingMode(false);
    }
    return res;
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
    setShowLandingMode(true);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...(userProfile || {}), ...updates, uid: currentUser.uid } as UserProfile;
    setUserProfile(updated);
    try {
      localStorage.setItem(`nearby_cached_profile_${currentUser.uid}`, JSON.stringify(updated));
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
    } catch (err) {
      console.warn("Failed to persist profile updates to Firestore:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        showOnboarding,
        setShowOnboarding,
        showLandingMode,
        setShowLandingMode,
        signInWithGoogle: handleGoogleSignIn,
        signInWithEmail: handleEmailSignIn,
        signUpWithEmail: handleEmailSignUp,
        sendPasswordReset: resetPassword,
        logout: handleLogout,
        updateUserProfile,
        hasSavedAccountOnDisk
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
