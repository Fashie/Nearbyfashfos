import { useState, useEffect } from 'react';
import {
  FirebaseTeamService,
  FirebaseQRService,
  FirebasePayoutService,
  FirebaseLeaderboardService,
  FirebaseStatsService,
  FirebaseReferralService,
  FirebaseMilestoneService,
  FirebaseInfluencerService
} from '../services/firebaseService';
import {
  Team,
  QRCodeItem,
  PayoutRequest,
  LeaderboardEntry,
  PlatformGlobalStats,
  ReferralRecord,
  ReferralAnalytics,
  Milestone,
  Influencer
} from '../types';

export function useFirestoreData(userId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState<boolean>(true);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [allInfluencers, setAllInfluencers] = useState<Influencer[]>([]);
  const [influencersLoading, setInfluencersLoading] = useState<boolean>(true);

  // Platform Global Real-Time Stats
  const [globalStats, setGlobalStats] = useState<PlatformGlobalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // User Referral Analytics & Records
  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>([]);
  const [referralAnalytics, setReferralAnalytics] = useState<ReferralAnalytics>({
    clicks: 0,
    installs: 0,
    successfulRegistrations: 0,
    verifiedReferrals: 0,
    fraudulentReferrals: 0,
    conversionRate: 0
  });

  // Real-time leaderboards computed from Firestore users
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [biweeklyLeaderboard, setBiweeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardsLoading, setLeaderboardsLoading] = useState<boolean>(true);

  // Seed QR codes & Milestones on mount
  useEffect(() => {
    FirebaseQRService.seedQRCodesIfEmpty().catch((err) =>
      console.error('Error seeding QR codes in Firestore:', err)
    );
    FirebaseMilestoneService.seedMilestonesIfEmpty().catch((err) =>
      console.error('Error seeding milestones in Firestore:', err)
    );
  }, []);

  // Subscribe to Milestones
  useEffect(() => {
    setMilestonesLoading(true);
    const unsub = FirebaseMilestoneService.subscribeMilestones((list) => {
      setMilestones(list);
      setMilestonesLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to Global Stats
  useEffect(() => {
    setStatsLoading(true);
    const unsub = FirebaseStatsService.subscribeGlobalStats(
      (stats) => {
        setGlobalStats(stats);
        setStatsLoading(false);
      },
      (err) => {
        console.warn('Global stats fetch error:', err);
        setStatsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to Referral Analytics for logged in user
  useEffect(() => {
    if (!userId) return;
    const unsub = FirebaseReferralService.subscribeReferralAnalytics(
      userId,
      (records, analytics) => {
        setReferralRecords(records);
        setReferralAnalytics(analytics);
      }
    );
    return () => unsub();
  }, [userId]);

  // Subscribe to Teams
  useEffect(() => {
    const unsub = FirebaseTeamService.subscribeTeams((list) => {
      setTeams(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to QR Codes
  useEffect(() => {
    const unsub = FirebaseQRService.subscribeQRCodes((list) => {
      setQrCodes(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to Payouts for logged in user
  useEffect(() => {
    if (!userId) return;
    const unsub = FirebasePayoutService.subscribePayouts(userId, (list) => {
      setPayoutHistory(list);
    });
    return () => unsub();
  }, [userId]);

  // Subscribe to Leaderboards
  useEffect(() => {
    setLeaderboardsLoading(true);
    const unsubWeekly = FirebaseLeaderboardService.subscribeLeaderboard('weekly', userId, (entries) => {
      setWeeklyLeaderboard(entries);
      setLeaderboardsLoading(false);
    });
    const unsubBiweekly = FirebaseLeaderboardService.subscribeLeaderboard('biweekly', userId, (entries) => {
      setBiweeklyLeaderboard(entries);
      setLeaderboardsLoading(false);
    });
    const unsubMonthly = FirebaseLeaderboardService.subscribeLeaderboard('monthly', userId, (entries) => {
      setMonthlyLeaderboard(entries);
      setLeaderboardsLoading(false);
    });
    const unsubAllTime = FirebaseLeaderboardService.subscribeLeaderboard('all-time', userId, (entries) => {
      setAllTimeLeaderboard(entries);
      setLeaderboardsLoading(false);
    });

    return () => {
      unsubWeekly();
      unsubBiweekly();
      unsubMonthly();
      unsubAllTime();
    };
  }, [userId]);

  // Subscribe to Influencers
  useEffect(() => {
    setInfluencersLoading(true);
    const unsubApproved = FirebaseInfluencerService.subscribeApprovedInfluencers((list) => {
      setInfluencers(list);
      setInfluencersLoading(false);
    });
    const unsubAll = FirebaseInfluencerService.subscribeAllInfluencers((list) => {
      setAllInfluencers(list);
    });

    return () => {
      unsubApproved();
      unsubAll();
    };
  }, []);

  return {
    teams,
    qrCodes,
    payoutHistory,
    milestones,
    milestonesLoading,
    influencers,
    allInfluencers,
    influencersLoading,
    globalStats,
    statsLoading,
    referralRecords,
    referralAnalytics,
    leaderboardsLoading,
    leaderboards: {
      weekly: weeklyLeaderboard,
      biweekly: biweeklyLeaderboard,
      monthly: monthlyLeaderboard,
      'all-time': allTimeLeaderboard
    }
  };
}

