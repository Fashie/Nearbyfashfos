export interface Neighbor {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  avatarEmoji: string;
  // Optional: we only know a real distance when both sides have fresh GPS. Friends
  // and existing chat threads stay in the list without one instead of disappearing.
  distanceMeters?: number; // e.g. 150 (walk distance)
  isOutsideRadar?: boolean;
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
  isGroup?: boolean; // GB WhatsApp Style Group chat support
  groupMembers?: string[]; // IDs of neighbors inside the group
  groupCreatedBy?: string; // 'user' or neighbor ID
  pinned?: boolean; // Pinned chat indicator
  pinTime?: number; // Sorting pinned chats
  isFriend?: boolean; // Friending limit support
  customProfilePhoto?: string; // Real-time user photo support o!
  typingTo?: string; // UID of user they are currently typing to o!
  lastSeen?: string; // Offline timestamp metadata o!
  isArchived?: boolean; // Archived chat support o!
  archiveTime?: number; // Sorting archives o!
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
  friendshipAcceptedAt?: string; // Track friendship accepted timestamp for expiration
  meetupHappened?: boolean; // Track if a meetup has been logged/rated
  ratedBy?: Record<string, number>; // Record of userId to stars given
}

export interface PublicSnap {
  id: string;
  type: 'image' | 'text';
  mediaUrl: string; // base64 or placeholder canvas drawing
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
  senderId: string; // 'user' or neighbor ID
  receiverId: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice' | 'call_log' | 'video' | 'document';
  text?: string;
  mediaUrl?: string; // base64 or placeholder
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
  
  // WhatsApp Features
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: {
    msgId: string;
    text?: string;
    senderName?: string;
    type: string;
  };
  reactions?: Array<{ userId: string; reaction: string }>;
  deletedForEveryone?: boolean;
  deletedForUsers?: string[]; // Whitelist of users who clicked Delete For Me o!
  isForwarded?: boolean;
  isStarred?: boolean;
  isEdited?: boolean;
  deliveredTime?: string;
  readTime?: string;
}

export interface CallState {
  active: boolean;
  type: 'audio' | 'video';
  neighborId: string; // who is being called or calling
  status: 'ringing' | 'connected' | 'disconnected';
  incoming: boolean; // is it an inbound call or outbound
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
