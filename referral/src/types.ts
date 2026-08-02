export interface InvitedFriend {
  id: string;
  name: string;
  campus: string;
  status: 'VERIFIED' | 'PENDING' | 'FRAUDULENT';
  step: string;
  date: string;
  ipAddress?: string;
  flagReason?: string;
}

export interface ReferralAnalytics {
  clicks: number;
  installs: number;
  successfulRegistrations: number;
  verifiedReferrals: number;
  fraudulentReferrals: number;
  conversionRate: number;
}

export interface PlatformGlobalStats {
  totalUsers: number;
  totalReferrals: number;
  totalAppDownloads: number;
  totalRewardsPaidNaira: number;
  activeContestants: number;
  updatedAt: string;
}

export interface UserRetentionInfo {
  userId: string;
  referrerId?: string;
  registeredAt: string;
  lastActiveAt: string;
  activeDates: string[]; // e.g. ["2026-08-01", "2026-08-02"]
  activeDaysCount: number;
  daysElapsed: number;
  retentionRate: number; // 0 to 100 percentage
  is7DayRetained: boolean;
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerCode: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  campus: string;
  status: 'VERIFIED' | 'PENDING' | 'FRAUDULENT';
  step: 'Clicked' | 'Installed' | 'Registered' | 'Verified Account' | string;
  retentionDaysActive?: number;
  retentionRatePercent?: number;
  flagReason?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  referralCode: string;
  referralLink: string;
  referredByCode?: string;
  referrerId?: string;
  verifiedInvites: number;
  pendingInvites: number;
  totalEarningsNaira: number;
  claimableBalanceNaira: number;
  badges: Badge[];
  teamId?: string;
  claimedMilestones: number[]; // array of milestone invite counts achieved: e.g., [5, 20]
  isAmbassador: boolean;
  campus?: string;
  bio?: string;
  online?: boolean;
  lastActive?: string;
  hasFollowedSocials?: boolean;
  followedSocialPlatform?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export interface Badge {
  id: string;
  name: string;
 description: string;
  iconName: string;
  color: string;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  verifiedInvites: number;
  prizeNaira: number;
  badge?: string;
  isCurrentUser?: boolean;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  creatorName: string;
  creatorAvatar: string;
  members: {
    id: string;
    name: string;
    avatar: string;
    verifiedInvites: number;
  }[];
  totalVerifiedInvites: number;
  rank: number;
  estimatedPrizeNaira: number;
}

export interface QRCodeItem {
  id: string;
  code: string;
  campusName: string;
  locationHint: string;
  prizeNaira: number;
  monthNumber: number; // 1, 2, or 3
  isRedeemed: boolean;
  redeemedByUserId?: string;
  redeemedByName?: string;
  redeemedAt?: string;
}

export interface Influencer {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  campus: string;
  socialHandles: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
  customReferralCode: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
  campaignName: string;
  analytics: {
    clicks: number;
    installs: number;
    verifiedReferrals: number;
    conversionRate: number;
  };
  commissionRateNairaPerReferral: number;
  totalCommissionsEarnedNaira: number;
  unpaidCommissionsNaira: number;
  rank?: number;
  prizeNaira?: number;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amountNaira: number;
  type: 'Referral Earnings' | 'Treasure Hunt' | 'Leaderboard Prize' | 'Team Prize' | 'Milestone Reward';
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'paid';
  rejectionReason?: string;
  fraudRiskScore?: number;
  referralsVerifiedAtRequest: number;
  requestedAt: string;
  processedAt?: string;
  socialTagHandle?: string;
  socialPostUrl?: string;
  socialTagConfirmed?: boolean;
}

export interface Milestone {
  invitesRequired: number;
  rewardTitle: string;
  rewardDescription: string;
  rewardType: 'subscription' | 'cash' | 'badge' | 'swag' | 'ambassador';
  valueNaira?: number;
  badgeName?: string;
  limitedCount?: number;
  claimedGlobalCount?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'referral' | 'payout' | 'friend_request' | 'team' | 'treasure' | 'chat';
  read: boolean;
  createdAt: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}

export interface OperationState {
  loading: boolean;
  error: string | null;
  success: string | null;
}
