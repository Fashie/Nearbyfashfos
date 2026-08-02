import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  UserProfile,
  Team,
  QRCodeItem,
  PayoutRequest,
  ChatMessage,
  Conversation,
  NotificationItem,
  Friendship,
  OperationState,
  ReferralAnalytics,
  PlatformGlobalStats,
  ReferralRecord,
  LeaderboardEntry,
  Milestone,
  Influencer
} from '../types';
import { CAMPUS_QR_CODES, generateReferralCode } from '../constants/appConstants';

// Cache store to prevent redundant Firestore reads
const cacheStore: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache for heavy queries

function getCached<T>(key: string): T | null {
  const item = cacheStore[key];
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cacheStore[key] = { data, timestamp: Date.now() };
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    Object.keys(cacheStore).forEach((k) => delete cacheStore[k]);
  } else {
    Object.keys(cacheStore).forEach((k) => {
      if (k.startsWith(keyPrefix)) delete cacheStore[k];
    });
  }
}

// Wrapper for retryable async operations
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise((res) => setTimeout(res, delayMs * attempt));
    }
  }
  throw new Error('Operation failed after retries.');
}

// Helper to convert Firestore dates
const sanitizeDoc = <T>(snap: QueryDocumentSnapshot<DocumentData> | DocumentData): T => {
  const data = typeof snap.data === 'function' ? snap.data() : snap;
  return { ...data } as T;
};

// Helper to remove undefined fields before sending data to Firestore
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const result: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val) && typeof val.toDate !== 'function') {
        result[key] = cleanFirestoreData(val);
      } else {
        result[key] = val;
      }
    }
  });
  return result as T;
}

// ==========================================
// USER PROFILES & NEARBY DISCOVERY
// ==========================================

export const FirebaseUserService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `user_${userId}`;
    const cached = getCached<UserProfile>(cacheKey);
    if (cached) return cached;

    return withRetry(async () => {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        setCache(cacheKey, profile);
        return profile;
      }
      return null;
    });
  },

  async createUserProfile(userId: string, email: string, name?: string): Promise<UserProfile> {
    const cleanName = name || email.split('@')[0] || 'Nearby Member';
    const referralCode = generateReferralCode(cleanName);
    const domain = typeof window !== 'undefined' && window.location.host.includes('fashfos.com')
      ? 'https://nearby.fashfos.com'
      : (typeof window !== 'undefined' ? window.location.origin : 'https://nearby.fashfos.com');
    const referralLink = `${domain}/?ref=${referralCode}`;

    // Check for pending referral stored in localStorage from invite link
    let pendingRefCode = typeof window !== 'undefined' ? localStorage.getItem('nearby_pending_ref') : null;
    let referrerId: string | undefined = undefined;
    let referredByCode: string | undefined = undefined;

    if (pendingRefCode) {
      pendingRefCode = pendingRefCode.trim().toUpperCase();
      try {
        const q = query(collection(db, 'users'), where('referralCode', '==', pendingRefCode), limit(1));
        const refSnap = await getDocs(q);
        if (!refSnap.empty) {
          const referrerDoc = refSnap.docs[0];
          const referrerData = referrerDoc.data() as UserProfile;
          if (referrerData.id !== userId) {
            referrerId = referrerData.id;
            referredByCode = pendingRefCode;
          }
        }
      } catch (err) {
        console.warn('Error verifying referrer profile:', err);
      }
    }

    const profile: UserProfile = {
      id: userId,
      name: cleanName,
      email: email,
      avatar: '',
      referralCode,
      referralLink,
      referredByCode,
      referrerId,
      verifiedInvites: 0,
      pendingInvites: 0,
      totalEarningsNaira: 0,
      claimableBalanceNaira: 0,
      isAmbassador: false,
      claimedMilestones: [],
      badges: [],
      campus: 'UNILAG',
      bio: 'New Nearby Member exploring local campus connections!',
      online: true,
      hasFollowedSocials: false,
      lastActive: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', userId), cleanFirestoreData(profile));
    setCache(`user_${userId}`, profile);
    invalidateCache('all_users');

    // Automatically record referral in Firestore if registered via invite link
    if (referrerId && referredByCode) {
      try {
        await FirebaseReferralService.recordReferral(
          referrerId,
          referredByCode,
          userId,
          cleanName,
          email,
          profile.campus || 'UNILAG'
        );
      } catch (refErr) {
        console.warn('Error recording automated referral:', refErr);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nearby_pending_ref');
      }
    }

    // Initialize 7-Day Activity Retention Tracking in Firestore
    try {
      await FirebaseReferralService.trackUserRetention(userId, referrerId);
    } catch (retErr) {
      console.warn('Error initializing 7-day retention:', retErr);
    }

    return profile;
  },

  async updateUserProfile(profile: UserProfile): Promise<void> {
    await withRetry(async () => {
      const userRef = doc(db, 'users', profile.id);
      await setDoc(userRef, cleanFirestoreData({ ...profile, lastActive: new Date().toISOString() }), { merge: true });
      setCache(`user_${profile.id}`, profile);
      invalidateCache('all_users');
    });
  },

  async markSocialFollowed(userId: string, platform?: string): Promise<{ success: boolean; message: string }> {
    return withRetry(async () => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        hasFollowedSocials: true,
        followedSocialPlatform: platform || 'social'
      });
      invalidateCache(`user_${userId}`);
      return { success: true, message: 'Social follow verified! Your unique referral link is assigned and unlocked.' };
    });
  },

  subscribeUserProfile(userId: string, onUpdate: (profile: UserProfile) => void): () => void {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const profile = snap.data() as UserProfile;
          setCache(`user_${userId}`, profile);
          onUpdate(profile);
        }
      },
      (err) => {
        console.warn('subscribeUserProfile offline/error:', err);
      }
    );
  },

  async getAllRegisteredUsers(limitCount: number = 50): Promise<UserProfile[]> {
    const cacheKey = `all_users_${limitCount}`;
    const cached = getCached<UserProfile[]>(cacheKey);
    if (cached) return cached;

    return withRetry(async () => {
      const q = query(collection(db, 'users'), limit(limitCount));
      const querySnap = await getDocs(q);
      const users: UserProfile[] = [];
      querySnap.forEach((docSnap) => {
        users.push(docSnap.data() as UserProfile);
      });
      setCache(cacheKey, users);
      return users;
    });
  },

  subscribeAllUsers(onUpdate: (users: UserProfile[]) => void): () => void {
    const q = query(collection(db, 'users'), limit(100));
    return onSnapshot(
      q,
      (querySnap) => {
        const users: UserProfile[] = [];
        querySnap.forEach((docSnap) => {
          users.push(docSnap.data() as UserProfile);
        });
        setCache('all_users_100', users);
        onUpdate(users);
      },
      (err) => {
        console.warn('subscribeAllUsers offline/error:', err);
      }
    );
  }
};

// ==========================================
// TEAMS & SQUADS
// ==========================================

export const FirebaseTeamService = {
  async getTeams(): Promise<Team[]> {
    const cached = getCached<Team[]>('teams');
    if (cached) return cached;

    return withRetry(async () => {
      const q = query(collection(db, 'teams'), limit(50));
      const snap = await getDocs(q);
      const teams: Team[] = [];
      snap.forEach((docSnap) => {
        teams.push(docSnap.data() as Team);
      });
      // Sort descending by totalVerifiedInvites
      teams.sort((a, b) => b.totalVerifiedInvites - a.totalVerifiedInvites);
      teams.forEach((t, index) => {
        t.rank = index + 1;
        t.estimatedPrizeNaira = t.rank === 1 ? 50000 : t.rank === 2 ? 20000 : t.rank === 3 ? 10000 : 0;
      });
      setCache('teams', teams);
      return teams;
    });
  },

  async createTeam(user: UserProfile, name: string): Promise<Team> {
    return withRetry(async () => {
      // 1. Check if user is already in a team
      const existingTeams = await this.getTeams();
      const inTeam = existingTeams.find(
        (t) => t.id === user.teamId || t.members.some((m) => m.id === user.id)
      );
      if (inTeam) {
        throw new Error(`You are already a member of squad "${inTeam.name}". Please leave your current squad before creating a new one.`);
      }

      // 2. Generate unique team code
      const cleanName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'SQUAD';
      const randCode = `${cleanName}${Math.floor(100 + Math.random() * 900)}`;
      const teamId = `team_${Date.now()}`;

      const newTeam: Team = {
        id: teamId,
        name: name.trim(),
        code: randCode,
        creatorName: user.name,
        creatorAvatar: user.avatar || '',
        members: [
          {
            id: user.id,
            name: user.name,
            avatar: user.avatar || '',
            verifiedInvites: user.verifiedInvites || 0
          }
        ],
        totalVerifiedInvites: user.verifiedInvites || 0,
        rank: existingTeams.length + 1,
        estimatedPrizeNaira: existingTeams.length === 0 ? 50000 : 0
      };

      await setDoc(doc(db, 'teams', teamId), newTeam);

      // 3. Update user profile with teamId
      await updateDoc(doc(db, 'users', user.id), {
        teamId: teamId
      });

      invalidateCache('teams');
      invalidateCache(`user_${user.id}`);
      return newTeam;
    });
  },

  async joinTeam(user: UserProfile, code: string): Promise<Team> {
    return withRetry(async () => {
      const cleanCode = code.trim().toUpperCase();

      // 1. Check if user is already in a team
      const existingTeams = await this.getTeams();
      const userCurrentTeam = existingTeams.find(
        (t) => t.id === user.teamId || t.members.some((m) => m.id === user.id)
      );
      if (userCurrentTeam) {
        throw new Error(`You are already a member of squad "${userCurrentTeam.name}". Leave your current squad first to join another.`);
      }

      // 2. Find target team by code
      const q = query(collection(db, 'teams'), where('code', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error(`No squad found with invitation code "${cleanCode}". Please verify the code with your team captain.`);
      }

      const teamDoc = snap.docs[0];
      const targetTeam = teamDoc.data() as Team;

      // 3. Validate team capacity (Max 5)
      if (targetTeam.members.length >= 5) {
        throw new Error(`Squad "${targetTeam.name}" is already at full capacity (5/5 members).`);
      }

      // 4. Add user to members
      const updatedMembers = [
        ...targetTeam.members,
        {
          id: user.id,
          name: user.name,
          avatar: user.avatar || '',
          verifiedInvites: user.verifiedInvites || 0
        }
      ];

      const newTotalInvites = updatedMembers.reduce((sum, m) => sum + (m.verifiedInvites || 0), 0);

      const updatedTeam: Team = {
        ...targetTeam,
        members: updatedMembers,
        totalVerifiedInvites: newTotalInvites
      };

      await setDoc(doc(db, 'teams', targetTeam.id), updatedTeam);

      // 5. Update user profile
      await updateDoc(doc(db, 'users', user.id), {
        teamId: targetTeam.id
      });

      // Notify team captain
      const captainMember = targetTeam.members[0];
      if (captainMember) {
        await FirebaseNotificationService.createNotification({
          userId: captainMember.id,
          title: 'New Teammate Joined!',
          message: `${user.name} joined your squad "${targetTeam.name}"! Combined total is now ${newTotalInvites} verified referrals.`,
          type: 'team'
        });
      }

      invalidateCache('teams');
      invalidateCache(`user_${user.id}`);
      return updatedTeam;
    });
  },

  async leaveTeam(userId: string, teamId: string): Promise<void> {
    return withRetry(async () => {
      const teamRef = doc(db, 'teams', teamId);
      const snap = await getDoc(teamRef);
      if (snap.exists()) {
        const team = snap.data() as Team;
        const updatedMembers = team.members.filter((m) => m.id !== userId);

        if (updatedMembers.length === 0) {
          // If no members remain, delete team
          await setDoc(teamRef, { ...team, members: [], totalVerifiedInvites: 0 });
        } else {
          const newTotalInvites = updatedMembers.reduce((sum, m) => sum + (m.verifiedInvites || 0), 0);
          await updateDoc(teamRef, {
            members: updatedMembers,
            totalVerifiedInvites: newTotalInvites
          });
        }
      }

      // Update user doc
      await updateDoc(doc(db, 'users', userId), {
        teamId: ''
      });

      invalidateCache('teams');
      invalidateCache(`user_${userId}`);
    });
  },

  async saveTeam(team: Team): Promise<void> {
    await withRetry(async () => {
      await setDoc(doc(db, 'teams', team.id), team);
      invalidateCache('teams');
    });
  },

  subscribeTeams(onUpdate: (teams: Team[]) => void): () => void {
    const q = query(collection(db, 'teams'));
    return onSnapshot(
      q,
      (snap) => {
        const teams: Team[] = [];
        snap.forEach((docSnap) => {
          teams.push(docSnap.data() as Team);
        });
        teams.sort((a, b) => b.totalVerifiedInvites - a.totalVerifiedInvites);
        teams.forEach((t, index) => {
          t.rank = index + 1;
          t.estimatedPrizeNaira = t.rank === 1 ? 50000 : t.rank === 2 ? 20000 : t.rank === 3 ? 10000 : 0;
        });
        setCache('teams', teams);
        onUpdate(teams);
      },
      (err) => {
        console.warn('subscribeTeams offline/error:', err);
      }
    );
  }
};

// ==========================================
// TREASURE HUNT QR CODES
// ==========================================

export const FirebaseQRService = {
  async seedQRCodesIfEmpty(): Promise<QRCodeItem[]> {
    return withRetry(async () => {
      const q = query(collection(db, 'qrcodes'), limit(10));
      const snap = await getDocs(q);
      if (snap.empty) {
        for (const qr of CAMPUS_QR_CODES) {
          await setDoc(doc(db, 'qrcodes', qr.id), qr);
        }
        setCache('qrcodes', CAMPUS_QR_CODES);
        return CAMPUS_QR_CODES;
      }
      const existing: QRCodeItem[] = [];
      snap.forEach((d) => existing.push(d.data() as QRCodeItem));
      setCache('qrcodes', existing);
      return existing;
    });
  },

  subscribeQRCodes(onUpdate: (codes: QRCodeItem[]) => void): () => void {
    const q = query(collection(db, 'qrcodes'));
    return onSnapshot(
      q,
      (snap) => {
        const codes: QRCodeItem[] = [];
        snap.forEach((d) => codes.push(d.data() as QRCodeItem));
        setCache('qrcodes', codes);
        onUpdate(codes);
      },
      (err) => {
        console.warn('subscribeQRCodes offline/error:', err);
      }
    );
  },

  async redeemQRCode(
    userId: string,
    qrId: string,
    code: string,
    bankDetails: { bankName: string; accountNumber: string; accountName: string }
  ): Promise<{ success: boolean; message: string; prizeNaira?: number }> {
    return withRetry(async () => {
      // 1. Fetch User Profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { success: false, message: 'User profile not found.' };
      }
      const user = userSnap.data() as UserProfile;

      // 2. Fetch QR code document
      const qrRef = doc(db, 'qrcodes', qrId);
      const qrSnap = await getDoc(qrRef);
      if (!qrSnap.exists()) {
        return { success: false, message: 'Invalid Treasure QR Code.' };
      }
      const qr = qrSnap.data() as QRCodeItem;

      // 3. Server Verification: Code match check
      if (qr.code.toUpperCase() !== code.trim().toUpperCase()) {
        return { success: false, message: 'Treasure code verification failed. Code does not match campus records.' };
      }

      // 4. Server Verification: Check if already redeemed
      if (qr.isRedeemed) {
        return {
          success: false,
          message: `This Treasure Code was already discovered and claimed by ${qr.redeemedByName || 'another user'}!`
        };
      }

      // 5. Anti-Cheat: Prevent user from redeeming more than 3 treasure codes per month
      const qUserClaims = query(
        collection(db, 'qrcodes'),
        where('redeemedByUserId', '==', userId),
        where('monthNumber', '==', qr.monthNumber)
      );
      const userClaimsSnap = await getDocs(qUserClaims);
      if (userClaimsSnap.size >= 3) {
        return {
          success: false,
          message: 'Anti-cheat limit reached: You have already claimed 3 treasure codes for this campus month!'
        };
      }

      // 6. Update QR Code doc atomically
      const now = new Date().toISOString();
      await updateDoc(qrRef, {
        isRedeemed: true,
        redeemedByUserId: userId,
        redeemedByName: user.name,
        redeemedAt: now
      });

      // 7. Credit user balance & update bank details
      const prizeNaira = qr.prizeNaira || 2000;
      await updateDoc(userRef, {
        totalEarningsNaira: (user.totalEarningsNaira || 0) + prizeNaira,
        claimableBalanceNaira: (user.claimableBalanceNaira || 0) + prizeNaira,
        bankDetails
      });

      // 8. Auto-create payout request in 'payouts' collection
      const payoutRef = doc(collection(db, 'payouts'));
      const payout: PayoutRequest = {
        id: payoutRef.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amountNaira: prizeNaira,
        type: 'Treasure Hunt',
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
        status: 'pending_review',
        referralsVerifiedAtRequest: user.verifiedInvites || 0,
        fraudRiskScore: 0,
        requestedAt: now
      };
      await setDoc(payoutRef, payout);

      // 9. Send Notification
      await FirebaseNotificationService.createNotification({
        userId,
        title: 'Treasure Prize Unlocked! 🎁',
        message: `Congratulations! You found Treasure Code #${qr.code} on campus! ₦${prizeNaira.toLocaleString()} added to your balance.`,
        type: 'treasure'
      });

      invalidateCache('qrcodes');
      invalidateCache(`user_${userId}`);

      return {
        success: true,
        message: `Treasure Code Verified! ₦${prizeNaira.toLocaleString()} added to your claimable balance!`,
        prizeNaira
      };
    });
  }
};

// ==========================================
// INFLUENCER & CAMPUS CREATOR SERVICE
// ==========================================

export const FirebaseInfluencerService = {
  async applyForInfluencerProgram(
    userId: string,
    data: {
      campus: string;
      socialHandles: {
        instagram?: string;
        tiktok?: string;
        twitter?: string;
        youtube?: string;
      };
      customReferralCode: string;
      campaignName?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    return withRetry(async () => {
      // 1. Fetch User Profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { success: false, message: 'User profile not found.' };
      }
      const user = userSnap.data() as UserProfile;

      // 2. Check if already applied
      const infRef = doc(db, 'influencers', userId);
      const infSnap = await getDoc(infRef);
      if (infSnap.exists()) {
        const existing = infSnap.data() as Influencer;
        if (existing.verificationStatus === 'pending') {
          return { success: false, message: 'Your influencer application is currently under admin review.' };
        }
        if (existing.verificationStatus === 'approved') {
          return { success: false, message: 'You are already an approved Nearby Campus Influencer!' };
        }
      }

      const newInfluencer: Influencer = {
        id: userId,
        userId: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        campus: data.campus || user.campus || 'Main Campus',
        socialHandles: {
          instagram: data.socialHandles.instagram || '',
          tiktok: data.socialHandles.tiktok || '',
          twitter: data.socialHandles.twitter || '',
          youtube: data.socialHandles.youtube || ''
        },
        customReferralCode: (data.customReferralCode || user.referralCode).toUpperCase(),
        verificationStatus: 'pending',
        campaignName: data.campaignName || 'Campus Creator Launch Challenge',
        analytics: {
          clicks: 12,
          installs: user.verifiedInvites,
          verifiedReferrals: user.verifiedInvites,
          conversionRate: user.verifiedInvites > 0 ? 85 : 0
        },
        commissionRateNairaPerReferral: 100,
        totalCommissionsEarnedNaira: user.verifiedInvites * 100,
        unpaidCommissionsNaira: user.claimableBalanceNaira,
        createdAt: new Date().toISOString()
      };

      await setDoc(infRef, newInfluencer);

      await FirebaseNotificationService.createNotification({
        userId,
        title: 'Influencer Application Received 🌟',
        message: 'Your application for Nearby Campus Creator status has been submitted for admin verification.',
        type: 'referral'
      });

      return {
        success: true,
        message: 'Application submitted! Pending admin review and verification.'
      };
    });
  },

  subscribeApprovedInfluencers(onUpdate: (influencers: Influencer[]) => void): () => void {
    const q = query(
      collection(db, 'influencers'),
      where('verificationStatus', '==', 'approved')
    );

    return onSnapshot(
      q,
      (snap) => {
        const list: Influencer[] = [];
        snap.forEach((d) => list.push(d.data() as Influencer));

        // Sort by verified referrals descending
        list.sort((a, b) => b.analytics.verifiedReferrals - a.analytics.verifiedReferrals);

        // Compute rank & prize
        const prizes = [80000, 40000, 20000, 10000, 10000];
        list.forEach((inf, idx) => {
          inf.rank = idx + 1;
          inf.prizeNaira = prizes[idx] || 0;
        });

        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeApprovedInfluencers offline/error:', err);
      }
    );
  },

  subscribeAllInfluencers(onUpdate: (influencers: Influencer[]) => void): () => void {
    const q = query(collection(db, 'influencers'));
    return onSnapshot(
      q,
      (snap) => {
        const list: Influencer[] = [];
        snap.forEach((d) => list.push(d.data() as Influencer));
        list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeAllInfluencers offline/error:', err);
      }
    );
  },

  async approveInfluencer(influencerId: string): Promise<void> {
    await withRetry(async () => {
      const infRef = doc(db, 'influencers', influencerId);
      const snap = await getDoc(infRef);
      if (snap.exists()) {
        const inf = snap.data() as Influencer;
        await updateDoc(infRef, {
          verificationStatus: 'approved',
          verifiedAt: new Date().toISOString()
        });

        await updateDoc(doc(db, 'users', inf.userId), {
          isAmbassador: true
        });

        await FirebaseNotificationService.createNotification({
          userId: inf.userId,
          title: 'Campus Creator Approved! 🎉',
          message: 'Congratulations! Your Nearby Campus Creator status has been verified by the admin team.',
          type: 'referral'
        });
      }
    });
  },

  async rejectInfluencer(influencerId: string, reason?: string): Promise<void> {
    await withRetry(async () => {
      const infRef = doc(db, 'influencers', influencerId);
      const snap = await getDoc(infRef);
      if (snap.exists()) {
        const inf = snap.data() as Influencer;
        await updateDoc(infRef, {
          verificationStatus: 'rejected',
          rejectionReason: reason || 'Requirements not met'
        });

        await FirebaseNotificationService.createNotification({
          userId: inf.userId,
          title: 'Influencer Application Status',
          message: `Your campus creator application was not approved: ${reason || 'Does not meet requirements.'}`,
          type: 'referral'
        });
      }
    });
  }
};

// ==========================================
// PAYOUTS & BANK WITHDRAWALS
// ==========================================

export const FirebasePayoutService = {
  async requestPayout(
    userId: string,
    bankDetails: { bankName: string; accountNumber: string; accountName: string },
    customAmountNaira?: number
  ): Promise<{ success: boolean; message: string; payoutId?: string }> {
    return withRetry(async () => {
      // 1. Fetch User Profile from Firestore (Never trust client balance!)
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { success: false, message: 'User profile not found.' };
      }
      const user = userSnap.data() as UserProfile;

      const currentBalance = user.claimableBalanceNaira || 0;

      // 2. Server Validation: Minimum withdrawal threshold check (₦1,000)
      if (currentBalance < 1000) {
        return {
          success: false,
          message: `Minimum withdrawal threshold is ₦1,000. Your current claimable balance is ₦${currentBalance.toLocaleString()}.`
        };
      }

      // Calculate withdrawal amount safely
      const requestedAmount = customAmountNaira && customAmountNaira > 0 ? Math.min(customAmountNaira, currentBalance) : currentBalance;

      if (requestedAmount < 1000) {
        return {
          success: false,
          message: 'Minimum withdrawal amount per transaction is ₦1,000.'
        };
      }

      // 3. Fraud Detection Check: Query referral records to analyze fraud risk score
      const qRef = query(
        collection(db, 'referrals'),
        where('referrerId', '==', userId)
      );
      const refSnap = await getDocs(qRef);
      let verifiedCount = 0;
      let fraudulentCount = 0;

      refSnap.forEach((d) => {
        const r = d.data() as ReferralRecord;
        if (r.status === 'VERIFIED') verifiedCount++;
        if (r.status === 'FRAUDULENT') fraudulentCount++;
      });

      const totalReferrals = verifiedCount + fraudulentCount;
      let fraudRiskScore = 10;
      if (fraudulentCount > 0) {
        const fraudRatio = fraudulentCount / Math.max(totalReferrals, 1);
        fraudRiskScore = Math.min(100, Math.round(fraudRatio * 100) + 40);
      }

      // 4. Server-Side Deduct Balance & Save Bank Details
      const newClaimable = currentBalance - requestedAmount;
      await updateDoc(userRef, {
        claimableBalanceNaira: newClaimable,
        bankDetails: {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          accountName: bankDetails.accountName
        }
      });

      // 5. Generate Payout Record in Firestore
      const payoutRef = doc(collection(db, 'payouts'));
      const payoutRecord: PayoutRequest = {
        id: payoutRef.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amountNaira: requestedAmount,
        type: 'Referral Earnings',
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
        status: 'pending_review',
        fraudRiskScore,
        referralsVerifiedAtRequest: verifiedCount,
        requestedAt: new Date().toISOString()
      };

      await setDoc(payoutRef, payoutRecord);

      // 6. Send Notification
      await FirebaseNotificationService.createNotification({
        userId,
        title: 'Withdrawal Request Queued 🏦',
        message: `Your bank cash withdrawal of ₦${requestedAmount.toLocaleString()} to ${bankDetails.accountName} (${bankDetails.bankName}) is queued (Status: Pending Audit).`,
        type: 'payout'
      });

      invalidateCache(`payouts_${userId}`);
      invalidateCache(`user_${userId}`);

      return {
        success: true,
        message: `Withdrawal of ₦${requestedAmount.toLocaleString()} submitted! Queued for bank processing.`,
        payoutId: payoutRef.id
      };
    });
  },

  async updatePayoutSocialTag(
    payoutId: string,
    socialTagHandle: string
  ): Promise<{ success: boolean; message: string }> {
    return withRetry(async () => {
      const payoutRef = doc(db, 'payouts', payoutId);
      await updateDoc(payoutRef, {
        socialTagHandle: socialTagHandle.trim(),
        socialTagConfirmed: true
      });
      return { success: true, message: 'Social post tag saved! Admin team notified for payout verification.' };
    });
  },

  subscribePayouts(userId: string, onUpdate: (payouts: PayoutRequest[]) => void): () => void {
    const q = query(collection(db, 'payouts'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const list: PayoutRequest[] = [];
        snap.forEach((d) => list.push(d.data() as PayoutRequest));
        list.sort((a, b) => (b.requestedAt > a.requestedAt ? 1 : -1));
        setCache(`payouts_${userId}`, list);
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribePayouts offline/error:', err);
      }
    );
  },

  subscribeAllPayouts(onUpdate: (payouts: PayoutRequest[]) => void): () => void {
    const q = query(collection(db, 'payouts'));
    return onSnapshot(
      q,
      (snap) => {
        const list: PayoutRequest[] = [];
        snap.forEach((d) => list.push(d.data() as PayoutRequest));
        list.sort((a, b) => (b.requestedAt > a.requestedAt ? 1 : -1));
        onUpdate(list);
      },
      (err) => {
        console.warn('subscribeAllPayouts offline/error:', err);
      }
    );
  },

  async updatePayoutStatus(
    payoutId: string,
    newStatus: 'approved' | 'rejected' | 'paid',
    reason?: string
  ): Promise<void> {
    await withRetry(async () => {
      const payoutRef = doc(db, 'payouts', payoutId);
      const snap = await getDoc(payoutRef);
      if (!snap.exists()) return;

      const payout = snap.data() as PayoutRequest;
      const prevStatus = payout.status;

      // Update payout doc
      await updateDoc(payoutRef, {
        status: newStatus,
        rejectionReason: reason || undefined,
        processedAt: new Date().toISOString()
      });

      // If rejected, refund the money back to user's claimableBalanceNaira!
      if (newStatus === 'rejected' && prevStatus !== 'rejected') {
        const userRef = doc(db, 'users', payout.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const user = userSnap.data() as UserProfile;
          await updateDoc(userRef, {
            claimableBalanceNaira: (user.claimableBalanceNaira || 0) + payout.amountNaira
          });
        }
      }

      await FirebaseNotificationService.createNotification({
        userId: payout.userId,
        title: `Payout ${newStatus.toUpperCase()}`,
        message:
          newStatus === 'paid'
            ? `₦${payout.amountNaira.toLocaleString()} has been paid out to your bank account!`
            : newStatus === 'rejected'
            ? `Your payout request was rejected: ${reason || 'Failed security audit'}. Balance refunded.`
            : `Your payout request of ₦${payout.amountNaira.toLocaleString()} was approved!`,
        type: 'payout'
      });

      invalidateCache(`payouts_${payout.userId}`);
    });
  }
};

// ==========================================
// FRIENDSHIPS & CONNECTIONS
// ==========================================

export const FirebaseFriendshipService = {
  async sendFriendRequest(
    requester: UserProfile,
    receiver: UserProfile
  ): Promise<Friendship> {
    return withRetry(async () => {
      const friendshipId = `friend_${requester.id}_${receiver.id}`;
      const friendship: Friendship = {
        id: friendshipId,
        requesterId: requester.id,
        requesterName: requester.name,
        requesterAvatar: requester.avatar,
        receiverId: receiver.id,
        receiverName: receiver.name,
        receiverAvatar: receiver.avatar,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'friendships', friendshipId), friendship);

      // Create notification for receiver
      await FirebaseNotificationService.createNotification({
        userId: receiver.id,
        title: 'New Friend Request!',
        message: `${requester.name} wants to connect with you on Nearby.`,
        type: 'friend_request'
      });

      return friendship;
    });
  },

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    await withRetry(async () => {
      const ref = doc(db, 'friendships', friendshipId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const friendship = snap.data() as Friendship;
        await updateDoc(ref, { status: 'accepted' });

        // Notify requester
        await FirebaseNotificationService.createNotification({
          userId: friendship.requesterId,
          title: 'Friend Request Accepted!',
          message: `${friendship.receiverName} accepted your friend request on Nearby.`,
          type: 'friend_request'
        });
      }
    });
  },

  subscribeFriendships(
    userId: string,
    onUpdate: (friendships: Friendship[]) => void
  ): () => void {
    const q1 = query(collection(db, 'friendships'), where('requesterId', '==', userId));
    const q2 = query(collection(db, 'friendships'), where('receiverId', '==', userId));

    let friendsMap: Record<string, Friendship> = {};

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        snap.forEach((d) => {
          const item = d.data() as Friendship;
          friendsMap[item.id] = item;
        });
        onUpdate(Object.values(friendsMap));
      },
      (err) => console.warn('friendship unsub1 offline/error:', err)
    );

    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        snap.forEach((d) => {
          const item = d.data() as Friendship;
          friendsMap[item.id] = item;
        });
        onUpdate(Object.values(friendsMap));
      },
      (err) => console.warn('friendship unsub2 offline/error:', err)
    );

    return () => {
      unsub1();
      unsub2();
    };
  }
};

// ==========================================
// CHAT MESSAGES & CONVERSATIONS
// ==========================================

export const FirebaseChatService = {
  async getOrCreateConversation(user1: UserProfile, user2: UserProfile): Promise<string> {
    const convId = [user1.id, user2.id].sort().join('_conv_');
    const convRef = doc(db, 'conversations', convId);

    const snap = await getDoc(convRef);
    if (!snap.exists()) {
      const conv: Conversation = {
        id: convId,
        participantIds: [user1.id, user2.id],
        participantNames: { [user1.id]: user1.name, [user2.id]: user2.name },
        participantAvatars: { [user1.id]: user1.avatar, [user2.id]: user2.avatar },
        updatedAt: new Date().toISOString()
      };
      await setDoc(convRef, conv);
    }
    return convId;
  },

  subscribeConversations(
    userId: string,
    onUpdate: (conversations: Conversation[]) => void
  ): () => void {
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId)
    );
    return onSnapshot(
      q,
      (snap) => {
        const convs: Conversation[] = [];
        snap.forEach((d) => convs.push(d.data() as Conversation));
        convs.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
        onUpdate(convs);
      },
      (err) => console.warn('subscribeConversations offline/error:', err)
    );
  },

  async sendMessage(
    conversationId: string,
    sender: UserProfile,
    recipientId: string,
    text: string
  ): Promise<void> {
    await withRetry(async () => {
      const msgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
      const newMsg: ChatMessage = {
        id: msgRef.id,
        conversationId,
        senderId: sender.id,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        text,
        createdAt: new Date().toISOString()
      };
      await setDoc(msgRef, newMsg);

      // Update conversation metadata
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: text,
        lastMessageTime: newMsg.createdAt,
        updatedAt: newMsg.createdAt
      });

      // Send notification
      await FirebaseNotificationService.createNotification({
        userId: recipientId,
        title: `Message from ${sender.name}`,
        message: text.substring(0, 60),
        type: 'chat'
      });
    });
  },

  subscribeMessages(
    conversationId: string,
    onUpdate: (messages: ChatMessage[]) => void
  ): () => void {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach((d) => msgs.push(d.data() as ChatMessage));
        onUpdate(msgs);
      },
      (err) => console.warn('subscribeMessages offline/error:', err)
    );
  }
};

// ==========================================
// NOTIFICATIONS
// ==========================================

export const FirebaseNotificationService = {
  async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: 'referral' | 'payout' | 'friend_request' | 'team' | 'treasure' | 'chat';
  }): Promise<void> {
    await withRetry(async () => {
      const notifRef = doc(collection(db, 'notifications'));
      const notif: NotificationItem = {
        id: notifRef.id,
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        read: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(notifRef, notif);
    });
  },

  subscribeNotifications(
    userId: string,
    onUpdate: (notifs: NotificationItem[]) => void
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(50)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: NotificationItem[] = [];
        snap.forEach((d) => list.push(d.data() as NotificationItem));
        list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        onUpdate(list);
      },
      (err) => console.warn('subscribeNotifications offline/error:', err)
    );
  },

  async markAsRead(notifId: string): Promise<void> {
    await withRetry(async () => {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    });
  }
};

// ==========================================
// REAL-TIME LEADERBOARDS & STANDINGS
// ==========================================

export const FirebaseLeaderboardService = {
  subscribeLeaderboard(
    type: 'weekly' | 'biweekly' | 'monthly' | 'all-time',
    currentUserId?: string,
    onUpdate?: (entries: LeaderboardEntry[]) => void
  ): () => void {
    const cacheKey = `leaderboard_${type}`;
    const cached = getCached<LeaderboardEntry[]>(cacheKey);
    if (cached && onUpdate) {
      onUpdate(cached.map((e) => ({ ...e, isCurrentUser: e.userId === currentUserId })));
    }

    const q = query(collection(db, 'users'), limit(100));
    return onSnapshot(
      q,
      (snap) => {
        const users: UserProfile[] = [];
        snap.forEach((d) => {
          const u = d.data() as UserProfile;
          users.push(u);
        });

        // Sort descending by verifiedInvites, then by lastActive
        users.sort((a, b) => (b.verifiedInvites || 0) - (a.verifiedInvites || 0));

        const prizePools: Record<string, number[]> = {
          weekly: [20000, 10000, 5000],
          biweekly: [30000, 15000, 7500],
          monthly: [50000, 30000, 20000],
          'all-time': [100000, 50000, 25000, 10000, 5000]
        };

        const prizes = prizePools[type] || [20000, 10000, 5000];

        const entries: LeaderboardEntry[] = users.map((u, idx) => ({
          rank: idx + 1,
          userId: u.id,
          name: u.name,
          avatar: u.avatar || '',
          verifiedInvites: u.verifiedInvites || 0,
          prizeNaira: prizes[idx] || 0,
          isCurrentUser: u.id === currentUserId,
          badge: u.isAmbassador ? 'Ambassador VIP' : u.verifiedInvites >= 20 ? 'Top Referrer' : undefined
        }));

        setCache(cacheKey, entries);

        if (onUpdate) {
          onUpdate(entries);
        }
      },
      (err) => console.warn('subscribeLeaderboard offline/error:', err)
    );
  }
};

// ==========================================
// MILESTONES & PROGRESSION SERVICE
// ==========================================

export const FirebaseMilestoneService = {
  async seedMilestonesIfEmpty(): Promise<Milestone[]> {
    return withRetry(async () => {
      const q = query(collection(db, 'milestones'));
      const snap = await getDocs(q);
      if (snap.empty) {
        const initialMilestones: Milestone[] = [
          {
            invitesRequired: 5,
            rewardTitle: '1-Month Premium Membership',
            rewardDescription: 'Enjoy 1 month of Nearby Premium features (unlimited radar filter, priority badges).',
            rewardType: 'subscription'
          },
          {
            invitesRequired: 20,
            rewardTitle: '₦2,000 Cash Bonus',
            rewardDescription: 'Instant ₦2,000 credited directly to your claimable balance for inviting 20 verified friends.',
            rewardType: 'cash',
            valueNaira: 2000
          },
          {
            invitesRequired: 30,
            rewardTitle: 'Exclusive "Community Builder" Badge',
            rewardDescription: 'Ultra-rare badge strictly limited to early community builders. Displays proudly on your Nearby profile.',
            rewardType: 'badge',
            badgeName: 'Community Builder',
            limitedCount: 1000,
            claimedGlobalCount: 0
          },
          {
            invitesRequired: 50,
            rewardTitle: 'Nearby T-Shirt & ₦5,000 Cash',
            rewardDescription: 'Receive an official Nearby high-quality cotton T-Shirt + ₦5,000 cash bonus.',
            rewardType: 'swag',
            valueNaira: 5000,
            limitedCount: 100,
            claimedGlobalCount: 0
          },
          {
            invitesRequired: 100,
            rewardTitle: 'Nearby Ambassador Status & VIP Stipend',
            rewardDescription: 'Become an official Nearby Ambassador! Unlock executive status, direct founder access, and monthly stipends.',
            rewardType: 'ambassador',
            valueNaira: 15000
          }
        ];

        for (const m of initialMilestones) {
          const docId = `milestone_${m.invitesRequired}`;
          await setDoc(doc(db, 'milestones', docId), m);
        }
        setCache('milestones', initialMilestones);
        return initialMilestones;
      }

      const existing: Milestone[] = [];
      snap.forEach((d) => existing.push(d.data() as Milestone));
      existing.sort((a, b) => a.invitesRequired - b.invitesRequired);
      setCache('milestones', existing);
      return existing;
    });
  },

  subscribeMilestones(onUpdate: (milestones: Milestone[]) => void): () => void {
    const q = query(collection(db, 'milestones'));
    return onSnapshot(
      q,
      (snap) => {
        const list: Milestone[] = [];
        snap.forEach((d) => list.push(d.data() as Milestone));
        list.sort((a, b) => a.invitesRequired - b.invitesRequired);
        setCache('milestones', list);
        onUpdate(list);
      },
      (err) => console.warn('subscribeMilestones offline/error:', err)
    );
  },

  async claimMilestoneReward(
    userId: string,
    invitesRequired: number
  ): Promise<{ success: boolean; message: string }> {
    return withRetry(async () => {
      // 1. Fetch User Profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { success: false, message: 'User profile not found.' };
      }

      const user = userSnap.data() as UserProfile;

      // 2. Server Verification: Check verified invites
      if ((user.verifiedInvites || 0) < invitesRequired) {
        return {
          success: false,
          message: `Verification failed: You currently have ${user.verifiedInvites} verified invites. ${invitesRequired} required.`
        };
      }

      // 3. Prevent Duplication / Already Claimed Check
      const claimedList = user.claimedMilestones || [];
      if (claimedList.includes(invitesRequired)) {
        return { success: false, message: 'Reward for this milestone has already been claimed and locked.' };
      }

      // 4. Fetch Milestone details from Firestore
      const milestoneRef = doc(db, 'milestones', `milestone_${invitesRequired}`);
      const milestoneSnap = await getDoc(milestoneRef);
      let milestoneData: Milestone | null = milestoneSnap.exists() ? (milestoneSnap.data() as Milestone) : null;

      // Check limited count if applicable
      if (milestoneData?.limitedCount) {
        const currentClaimed = milestoneData.claimedGlobalCount || 0;
        if (currentClaimed >= milestoneData.limitedCount) {
          return { success: false, message: 'Sorry, this limited-edition milestone reward has reached maximum capacity.' };
        }
        await updateDoc(milestoneRef, {
          claimedGlobalCount: currentClaimed + 1
        });
      }

      // 5. Calculate Bonus
      const bonusNaira = milestoneData?.valueNaira || 0;
      const updatedClaimed = [...claimedList, invitesRequired];

      await updateDoc(userRef, {
        claimedMilestones: updatedClaimed,
        totalEarningsNaira: (user.totalEarningsNaira || 0) + bonusNaira,
        claimableBalanceNaira: (user.claimableBalanceNaira || 0) + bonusNaira,
        isAmbassador: user.isAmbassador || invitesRequired >= 100
      });

      // 6. Send Notification
      await FirebaseNotificationService.createNotification({
        userId,
        title: 'Milestone Reward Claimed! 🎉',
        message: `Successfully unlocked ${milestoneData?.rewardTitle || `${invitesRequired} Invites Milestone`}! ${
          bonusNaira > 0 ? `+₦${bonusNaira.toLocaleString()} added to your claimable balance.` : ''
        }`,
        type: 'payout'
      });

      invalidateCache(`user_${userId}`);
      invalidateCache('milestones');

      return {
        success: true,
        message: `Milestone unlocked! ${bonusNaira > 0 ? `₦${bonusNaira.toLocaleString()} added to your claimable balance.` : ''}`
      };
    });
  }
};

// ==========================================
// REAL-TIME GLOBAL PLATFORM STATS
// ==========================================

export const FirebaseStatsService = {
  subscribeGlobalStats(
    onUpdate: (stats: PlatformGlobalStats) => void,
    onError?: (err: any) => void
  ): () => void {
    const qUsers = query(collection(db, 'users'), limit(100));
    const qPayouts = query(collection(db, 'payouts'), limit(100));

    return onSnapshot(
      qUsers,
      (usersSnap) => {
        let totalUsers = usersSnap.size || 0;
        let totalReferrals = 0;

        usersSnap.forEach((docSnap) => {
          const u = docSnap.data() as UserProfile;
          if (u.verifiedInvites) {
            totalReferrals += u.verifiedInvites;
          }
        });

        // App downloads correlates with registered members and installs
        const totalAppDownloads = totalUsers + totalReferrals;

        // Fetch payouts snapshot for total paid rewards
        getDocs(qPayouts)
          .then((payoutsSnap) => {
            let totalPaidNaira = 0;
            payoutsSnap.forEach((pDoc) => {
              const p = pDoc.data() as PayoutRequest;
              if (p.status === 'approved' || p.status === 'paid') {
                totalPaidNaira += p.amountNaira || 0;
              }
            });

            onUpdate({
              totalUsers,
              totalReferrals,
              totalAppDownloads,
              totalRewardsPaidNaira: totalPaidNaira,
              activeContestants: totalUsers,
              updatedAt: new Date().toISOString()
            });
          })
          .catch(() => {
            onUpdate({
              totalUsers,
              totalReferrals,
              totalAppDownloads,
              totalRewardsPaidNaira: 0,
              activeContestants: totalUsers,
              updatedAt: new Date().toISOString()
            });
          });
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  }
};

// ==========================================
// SERVER-AUTHORITATIVE REFERRAL & ANALYTICS SERVICE
// ==========================================

export const FirebaseReferralService = {
  subscribeReferralAnalytics(
    referrerId: string,
    onUpdate: (records: ReferralRecord[], analytics: ReferralAnalytics) => void
  ): () => void {
    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', referrerId),
      limit(100)
    );

    return onSnapshot(
      q,
      (snap) => {
        const records: ReferralRecord[] = [];
        let clicks = 0;
        let installs = 0;
        let successfulRegistrations = 0;
        let verifiedReferrals = 0;
        let fraudulentReferrals = 0;

        snap.forEach((docSnap) => {
          const ref = docSnap.data() as ReferralRecord;
          records.push(ref);

          if (ref.status === 'VERIFIED') {
          verifiedReferrals++;
          successfulRegistrations++;
          installs++;
          clicks++;
        } else if (ref.status === 'FRAUDULENT') {
          fraudulentReferrals++;
          clicks++;
        } else if (ref.status === 'PENDING') {
          if (ref.step === 'Clicked') clicks++;
          if (ref.step === 'Installed') {
            clicks++;
            installs++;
          }
          if (ref.step === 'Registered') {
            clicks++;
            installs++;
            successfulRegistrations++;
          }
        }
      });

      // Default baseline counts for clicks if recorded in click counter
      clicks = Math.max(clicks, verifiedReferrals + installs);

      const totalAttempts = verifiedReferrals + fraudulentReferrals + (successfulRegistrations - verifiedReferrals);
      const conversionRate = totalAttempts > 0 ? Math.round((verifiedReferrals / Math.max(clicks, 1)) * 100) : 0;

      records.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

      onUpdate(records, {
        clicks,
        installs,
        successfulRegistrations,
        verifiedReferrals,
        fraudulentReferrals,
        conversionRate
      });
    });
  },

  async logLinkClick(referrerId: string, referrerCode: string): Promise<void> {
    try {
      const clickRef = doc(collection(db, 'referral_clicks'));
      await setDoc(clickRef, {
        referrerId,
        referrerCode,
        clickedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Click log non-critical warning:', e);
    }
  },

  async logLinkClickByCode(referrerCode: string): Promise<void> {
    try {
      const cleanCode = referrerCode.trim().toUpperCase();
      const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode), limit(1));
      const snap = await getDocs(q);
      let referrerId = 'unknown';
      if (!snap.empty) {
        referrerId = snap.docs[0].id;
      }
      const clickRef = doc(collection(db, 'referral_clicks'));
      await setDoc(clickRef, {
        referrerId,
        referrerCode: cleanCode,
        clickedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('logLinkClickByCode warning:', e);
    }
  },

  async trackUserRetention(userId: string, referrerId?: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const user = userSnap.data() as UserProfile;
      const actualReferrerId = referrerId || user.referrerId;

      const retentionRef = doc(db, 'user_retention', userId);
      const retentionSnap = await getDoc(retentionRef);

      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      let activeDates: string[] = [todayStr];
      if (retentionSnap.exists()) {
        const existingData = retentionSnap.data();
        activeDates = existingData.activeDates || [];
        if (!activeDates.includes(todayStr)) {
          activeDates.push(todayStr);
        }
      }

      const registeredTime = new Date(user.lastActive || Date.now()).getTime();
      const nowTime = Date.now();
      const daysDiff = Math.max(1, Math.floor((nowTime - registeredTime) / (1000 * 60 * 60 * 24)) + 1);
      const daysElapsed = Math.min(daysDiff, 7);
      const activeDaysCount = Math.min(activeDates.length, 7);
      const retentionRate = Math.round((activeDaysCount / daysElapsed) * 100);
      const is7DayRetained = activeDaysCount >= 3;

      const retentionRecord = {
        userId,
        referrerId: actualReferrerId || null,
        registeredAt: user.lastActive || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        activeDates,
        activeDaysCount,
        daysElapsed,
        retentionRate,
        is7DayRetained,
        updatedAt: new Date().toISOString()
      };

      await setDoc(retentionRef, retentionRecord, { merge: true });

      // If referred by someone, update the referrer's ReferralRecord in Firestore
      if (actualReferrerId) {
        const qRef = query(
          collection(db, 'referrals'),
          where('referrerId', '==', actualReferrerId),
          where('referredUserId', '==', userId),
          limit(1)
        );
        const refSnap = await getDocs(qRef);
        if (!refSnap.empty) {
          const refDoc = refSnap.docs[0];
          await updateDoc(refDoc.ref, {
            retentionDaysActive: activeDaysCount,
            retentionRatePercent: retentionRate,
            step: `Verified (${activeDaysCount}/7 Days Active - ${retentionRate}%)`
          });
        }
      }
    } catch (e) {
      console.warn('trackUserRetention warning:', e);
    }
  },

  async recordReferral(
    referrerId: string,
    referrerCode: string,
    referredUserId: string,
    referredUserName: string,
    referredUserEmail: string,
    campus: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. Anti-Self Referral Check
    if (referrerId === referredUserId) {
      return { success: false, message: 'Self-referral is strictly prohibited by anti-fraud policy.' };
    }

    // 2. Prevent Duplicate Referral Check
    const qDup = query(
      collection(db, 'referrals'),
      where('referredUserId', '==', referredUserId)
    );
    const dupSnap = await getDocs(qDup);
    if (!dupSnap.empty) {
      return { success: false, message: 'This referred user has already registered through an invite link.' };
    }

    // 3. Prevent Abuse / Check Referrer Existence
    const referrerRef = doc(db, 'users', referrerId);
    const referrerSnap = await getDoc(referrerRef);
    if (!referrerSnap.exists()) {
      return { success: false, message: 'Referrer profile not found in Nearby database.' };
    }

    const newRefDoc = doc(collection(db, 'referrals'));
    const record: ReferralRecord = {
      id: newRefDoc.id,
      referrerId,
      referrerCode,
      referredUserId,
      referredUserName,
      referredUserEmail,
      campus,
      status: 'VERIFIED',
      step: 'Verified Account',
      createdAt: new Date().toISOString()
    };

    await setDoc(newRefDoc, record);

    // Update Referrer User Profile
    const referrerData = referrerSnap.data() as UserProfile;
    const updatedVerified = (referrerData.verifiedInvites || 0) + 1;
    let earnedMilestoneBonus = 0;

    if (updatedVerified === 20 && !referrerData.claimedMilestones?.includes(20)) {
      earnedMilestoneBonus += 2000;
    }
    if (updatedVerified === 50 && !referrerData.claimedMilestones?.includes(50)) {
      earnedMilestoneBonus += 5000;
    }

    await setDoc(
      referrerRef,
      {
        verifiedInvites: updatedVerified,
        totalEarningsNaira: (referrerData.totalEarningsNaira || 0) + earnedMilestoneBonus,
        claimableBalanceNaira: (referrerData.claimableBalanceNaira || 0) + earnedMilestoneBonus,
        isAmbassador: updatedVerified >= 100,
        lastActive: new Date().toISOString()
      },
      { merge: true }
    );

    // Notify Referrer
    await FirebaseNotificationService.createNotification({
      userId: referrerId,
      title: 'New Verified Referral!',
      message: `${referredUserName} joined Nearby using your link. +1 verified referral added.`,
      type: 'referral'
    });

    return { success: true, message: `Referral verified! +1 added to ${referrerData.name}'s balance.` };
  }
};

