import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { FirebaseUserService, FirebaseReferralService } from '../services/firebaseService';
import { UserProfile } from '../types';

export function useAuthUser(onToast?: (msg: string) => void) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Background token refresh every 45 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
        } catch (err) {
          console.warn('Background token refresh failed:', err);
        }
      }
    }, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Firebase Auth Listener & Profile Sync
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (unsubProfile) unsubProfile();

      if (firebaseUser && !firebaseUser.isAnonymous) {
        setIsAuthenticated(true);

        try {
          let profile = await FirebaseUserService.getUserProfile(firebaseUser.uid);
          if (!profile) {
            profile = await FirebaseUserService.createUserProfile(
              firebaseUser.uid,
              firebaseUser.email || `member_${firebaseUser.uid.substring(0, 5)}@nearby.fashfos.com`,
              firebaseUser.displayName || undefined
            );
          }
          setUser(profile);
          if (profile) {
            FirebaseReferralService.trackUserRetention(profile.id, profile.referrerId).catch((e) => console.warn(e));
          }

          unsubProfile = FirebaseUserService.subscribeUserProfile(firebaseUser.uid, (updatedProfile) => {
            setUser(updatedProfile);
          });
        } catch (profileErr) {
          console.warn('Profile fetch/create failed (offline or network issue):', profileErr);
          const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nearby Member';
          const fallbackProfile: UserProfile = {
            id: firebaseUser.uid,
            name,
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || '',
            referralCode: 'NEARBY' + firebaseUser.uid.substring(0, 4).toUpperCase(),
            referralLink: typeof window !== 'undefined' ? `${window.location.origin}/?ref=NEARBY` : 'https://nearby.fashfos.com',
            verifiedInvites: 0,
            pendingInvites: 0,
            totalEarningsNaira: 0,
            claimableBalanceNaira: 0,
            isAmbassador: false,
            claimedMilestones: [],
            badges: [],
            campus: 'UNILAG',
            bio: 'Nearby Member',
            online: true,
            lastActive: new Date().toISOString()
          };
          setUser(fallbackProfile);
        }
      } else {
        setIsAuthenticated(false);
        const guestProfile: UserProfile = {
          id: '',
          name: 'Guest Member',
          email: '',
          avatar: '',
          referralCode: '',
          referralLink: '',
          verifiedInvites: 0,
          pendingInvites: 0,
          totalEarningsNaira: 0,
          claimableBalanceNaira: 0,
          isAmbassador: false,
          claimedMilestones: [],
          badges: [],
          campus: 'UNILAG',
          bio: 'Sign in or create an account to get your personal referral link.',
          online: false,
          lastActive: new Date().toISOString()
        };
        setUser(guestProfile);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    if (onToast) {
      onToast('Signed out successfully');
    }
  }, [onToast]);

  return {
    user,
    setUser,
    isAuthenticated,
    authLoading,
    handleSignOut
  };
}
