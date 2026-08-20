export interface Neighbor {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  avatarEmoji: string;
  distanceMeters: number; // e.g. 150 (walk distance)
  streetName: string; // e.g. "Linden Ave, 3 mins walk"
  bio: string;
  interests: string[];
  publicSnaps: PublicSnap[];
  activeStory: StorySnap[];
  onlineStatus: 'active' | 'recently' | 'offline' | 'away';
  latOffset: number; // offset from center for our proximity radar
  lngOffset: number; // offset from center for our proximity radar
  latitude?: number;
  longitude?: number;
  isGroup?: boolean;
  groupMembers?: string[];
  groupCreatedBy?: string;
  pinned?: boolean;
  pinTime?: number;
  isFriend?: boolean;
  customProfilePhoto?: string;
  typingTo?: string;
  lastSeen?: string;
  isArchived?: boolean;
  archiveTime?: number;
  ageRange?: string;
  gender?: string;
  communities?: string[];
  trustScore?: number;
  meetupsCompleted?: number;
  ratingsCount?: number;
  totalRatingPoints?: number;
  reportsCount?: number;
  banned?: boolean;
  verificationLevel?: 'Basic' | 'Verified';
  dayTimeAvailability?: 'Available Right Now' | 'Today' | 'Tomorrow' | 'This Weekend';
  friendshipAcceptedAt?: string;
  meetupHappened?: boolean;
  ratedBy?: Record<string, number>;
}

export interface PublicSnap {
  id: string;
  type: 'image' | 'text';
  mediaUrl: string;
  caption?: string;
  timestamp: string;
}

export interface StorySnap {
  id: string;
  type?: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  timestamp: string;
  viewed: boolean;
  createdAt?: number;
  viewers?: Array<{
    userId: string;
    username: string;
    name: string;
    timestamp: string;
  }>;
  reactions?: Array<{
    userId: string;
    username: string;
    emoji: string;
  }>;
  replies?: Array<{
    userId: string;
    username: string;
    name: string;
    text: string;
    timestamp: string;
  }>;
  privacy?: 'everyone' | 'friends' | 'custom';
  customList?: string[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice' | 'call_log' | 'video' | 'document';
  text?: string;
  mediaUrl?: string;
  audioDurationSec?: number;
  fileName?: string;
  fileSize?: string;
  callLog?: {
    type: 'audio' | 'video';
    status: 'missed' | 'completed' | 'declined';
    durationSeconds?: number;
  };
  isUnread?: boolean;
  chatThreadId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: {
    msgId: string;
    text?: string;
    senderName?: string;
    type: string;
  };
  reactions?: Array<{ userId: string; reaction: string }>;
  deletedForEveryone?: boolean;
  deletedForUsers?: string[];
  isForwarded?: boolean;
  isStarred?: boolean;
  isEdited?: boolean;
  deliveredTime?: string;
  readTime?: string;
}

export interface CallState {
  active: boolean;
  type: 'audio' | 'video';
  neighborId: string;
  status: 'ringing' | 'connected' | 'disconnected';
  incoming: boolean;
  durationSeconds: number;
  callId?: string;
}

export interface Meetup {
  meetupId: string;
  hostUID: string;
  participantUID: string;
  meetingPoint: string;
  meetingLatitude: number;
  meetingLongitude: number;
  status: 'completed' | 'cancelled' | 'scheduled';
  scheduledTime: string;
  createdAt: string;
}

export interface MeetupRating {
  ratingId: string;
  meetupId: string;
  reviewerUID: string;
  receiverUID: string;
  stars: number;
  review: string;
  createdAt: string;
}

export interface UserNote {
  id: string;
  name: string;
  avatarColor: string;
  avatarEmoji: string;
  text: string;
}

export interface LocationPreset {
  name: string;
  city: string;
  coords: { lat: number; lng: number };
  streets: string[];
}

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  displayName?: string;
  email?: string;
  phone?: string;
  bio: string;
  website?: string;
  ageRange?: string;
  gender?: string;
  interests: string[];
  communities?: string[];
  customProfilePhoto?: string | null;
  statusText?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  verificationLevel?: 'Basic' | 'Verified';
  trustScore?: number;
  meetupCount?: number;
  isUserVisibleOnRadar?: boolean;
  radarVisibilityMode?: 'everyone' | 'friends' | 'hidden';
  appLanguage?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  senderAvatarEmoji?: string;
  senderAvatarColor?: string;
  title: string;
  message: string;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'story_reaction' | 'meetup_proposed' | 'meetup_confirmed' | 'system';
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  caption: string;
  mediaUrl?: string;
  locationTag?: string;
  likes: number;
  likedByMe?: boolean;
  comments: Array<{
    id: string;
    authorName: string;
    text: string;
    timestamp: string;
  }>;
}

export type ActiveTabType = 'radar' | 'chats' | 'explore' | 'profile' | 'chat' | 'status' | 'menu';
export type AppThemeType = 'light' | 'dark';
