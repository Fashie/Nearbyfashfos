import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Star, 
  Calendar, 
  MessageSquare, 
  UserPlus, 
  UserCheck, 
  Share2, 
  Heart, 
  MessageCircle, 
  Plus, 
  X, 
  Settings, 
  Sparkles, 
  CheckCircle, 
  Camera, 
  Lock, 
  Globe, 
  LogOut, 
  Briefcase, 
  HeartHandshake, 
  ShieldAlert, 
  Upload, 
  ExternalLink,
  ChevronRight,
  Info,
  Users
} from 'lucide-react';
import { Neighbor, Meetup, MeetupRating } from '../../../types';
import { db } from '../../../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface PremiumProfileViewProps {
  isOwnProfile: boolean;
  currentUser: any;
  neighbor: Neighbor | null;
  onClose: () => void;
  
  // Real state properties for active session updates
  userDisplayName: string;
  setUserDisplayName: (v: string) => void;
  userUsername: string;
  setUserUsername: (v: string) => void;
  userBio: string;
  setUserBio: (v: string) => void;
  userWebsite: string;
  setUserWebsite: (v: string) => void;
  userAgeRange: string;
  setUserAgeRange: (v: string) => void;
  userGender: string;
  setUserGender: (v: string) => void;
  userInterests: string[];
  setUserInterests: (v: string[]) => void;
  customProfilePhoto: string | null;
  setCustomProfilePhoto: (v: string | null) => void;
  userStatusText: string;
  setUserStatusText: (v: string) => void;
  userPosts: any[];
  userHighlights: any[];
  
  // Interactions & friendships
  friendIds: string[];
  sentFriendRequestIds: string[];
  pendingFriendRequests: string[];
  handleAcceptFriendRequest: (id: string) => void;
  handleAddNewFriend: (id: string) => void;
  
  // Meetups & Ratings
  meetups: Meetup[];
  meetupRatings: MeetupRating[];
  handleRateNeighbor: (id: string, stars: number, review?: string, meetupId?: string) => void;
  handleReportNeighbor: (id: string, reason: string) => void;
  handleCancelMeetup: (meetupId: string) => void;
  setScheduleMeetupTargetNeighbor: (n: Neighbor) => void;
  setScheduleMeetupPoint: (pt: string) => void;
  setScheduleMeetupTime: (time: string) => void;
  setShowScheduleMeetupModal: (val: boolean) => void;
  
  // System control states
  showEditProfileModal: boolean;
  setShowEditProfileModal: (val: boolean) => void;
  triggerBeep: (f: number, d: number) => void;
  setAudioFeedback: (val: string) => void;
  appTheme: string;
  neighbors: Neighbor[];
  
  // Event callbacks
  handleGalleryUploadForProfilePic?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  profileFileRef?: React.RefObject<HTMLInputElement | null>;
  postFileRef?: React.RefObject<HTMLInputElement | null>;
  handleGalleryUploadForPost?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setUploadMode?: (val: 'post' | 'highlight') => void;
  setViewingUserPostDetail?: (post: any) => void;
  setShowFriendsModal?: (val: boolean) => void;
  logoutUser?: () => void;
}

export const PremiumProfileView = React.memo(function PremiumProfileView({
  isOwnProfile,
  currentUser,
  neighbor,
  onClose,
  userDisplayName,
  setUserDisplayName,
  userUsername,
  setUserUsername,
  userBio,
  setUserBio,
  userWebsite,
  setUserWebsite,
  userAgeRange,
  setUserAgeRange,
  userGender,
  setUserGender,
  userInterests,
  setUserInterests,
  customProfilePhoto,
  setCustomProfilePhoto,
  userStatusText,
  setUserStatusText,
  userPosts,
  userHighlights,
  friendIds,
  sentFriendRequestIds,
  pendingFriendRequests,
  handleAcceptFriendRequest,
  handleAddNewFriend,
  meetups,
  meetupRatings,
  handleRateNeighbor,
  handleReportNeighbor,
  handleCancelMeetup,
  setScheduleMeetupTargetNeighbor,
  setScheduleMeetupPoint,
  setScheduleMeetupTime,
  setShowScheduleMeetupModal,
  showEditProfileModal,
  setShowEditProfileModal,
  triggerBeep,
  setAudioFeedback,
  appTheme,
  neighbors,
  handleGalleryUploadForProfilePic,
  profileFileRef,
  postFileRef,
  handleGalleryUploadForPost,
  setUploadMode,
  setViewingUserPostDetail,
  setShowFriendsModal,
  logoutUser
}) {
  // Local overlay states
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null);
  const [showInlineRatingForm, setShowInlineRatingForm] = useState<boolean>(false);
  const [ratingFormMeetupId, setRatingFormMeetupId] = useState<string | null>(null);
  const [activeRatingStars, setActiveRatingStars] = useState<number>(5);
  const [ratingReviewText, setRatingReviewText] = useState<string>("");
  const [showAllMutualFriends, setShowAllMutualFriends] = useState<boolean>(false);
  const [viewingHighlight, setViewingHighlight] = useState<any>(null);

  const isHighlightVideo = (hl: any) => {
    if (!hl) return false;
    if (hl.type === 'video') return true;
    if (hl.mediaUrl && (hl.mediaUrl.startsWith('data:video') || hl.mediaUrl.includes('.mp4') || hl.mediaUrl.includes('.mov') || hl.mediaUrl.includes('.webm') || hl.mediaUrl.includes('.ogg'))) {
      return true;
    }
    return false;
  };

  // Target data bindings depending on perspective
  const profileName = isOwnProfile ? userDisplayName : (neighbor?.name || "Neighbor");
  const profileUsername = isOwnProfile ? userUsername : (neighbor?.username || "neighbor");
  const profileBio = isOwnProfile ? userBio : (neighbor?.bio || "Let's connect face-to-face 👋");
  const profilePhotoUrl = isOwnProfile 
    ? (customProfilePhoto || currentUser?.photoURL) 
    : neighbor?.customProfilePhoto;
  
  const avatarEmoji = neighbor?.avatarEmoji || "🙋‍♂️";
  const avatarColor = neighbor?.avatarColor || "bg-emerald-500";
  const displayLocation = isOwnProfile ? "Osogbo, Nigeria" : (neighbor?.streetName || "Osogbo, Nigeria");
  
  const distanceText = isOwnProfile 
    ? "Owner Profile" 
    : neighbor?.distanceMeters !== undefined 
      ? `${neighbor.distanceMeters}m Away` 
      : "Nearby";

  const trustScore = isOwnProfile ? 5.0 : (neighbor?.trustScore !== undefined ? neighbor.trustScore : 5.0);
  const meetupsCompleted = isOwnProfile ? meetups.filter(m => m.status === 'completed').length : (neighbor?.meetupsCompleted || 0);
  const verifiedMeetups = Math.max(0, meetupsCompleted - (isOwnProfile ? 0 : 2));
  const memberSince = "2025"; // In compliance with SPEC

  // Get active user interests
  const interestsList = isOwnProfile 
    ? userInterests 
    : (neighbor?.interests || ["study", "coffee"]);

  // Calculate mutual interests if other user
  const mutualInterests = !isOwnProfile && currentUser 
    ? interestsList.filter(interest => userInterests.includes(interest))
    : [];

  // Lookup neighbor posts
  const getNeighborProfileData = (id: string, name: string) => {
    const dataMap: Record<string, { posts: any[]; highlights: any[] }> = {
      'nb-1': {
        posts: [
          { id: 'nb1-p1', mediaUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop', caption: 'Locally curated firewood jollof! 🍛🔥', timestamp: 'Yesterday' },
          { id: 'nb1-p2', mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop', caption: 'Desk setup looking sharp for weekend coding! 💻🚀', timestamp: '3 days ago' },
          { id: 'nb1-p3', mediaUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&auto=format&fit=crop', caption: 'Web dev is poetry in motion. ✍️💻', timestamp: '5 days ago' }
        ],
        highlights: [
          { id: 'nb1-hl1', name: 'Desk Setup', mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop' },
          { id: 'nb1-hl2', name: 'Food runs', mediaUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=200&auto=format&fit=crop' }
        ]
      },
      'nb-2': {
        posts: [
          { id: 'nb2-p1', mediaUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&auto=format&fit=crop', caption: 'Lagos traffic is something else... 🚗😩', timestamp: 'Yesterday' },
          { id: 'nb2-p2', mediaUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop', caption: 'Vintage design inspiration in Yaba! 📰✨', timestamp: '4 days ago' }
        ],
        highlights: [
          { id: 'nb2-hl1', name: 'Lekki drive', mediaUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&auto=format&fit=crop' }
        ]
      },
      'nb-3': {
        posts: [
          { id: 'nb3-p1', mediaUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop', caption: 'Vintage fashion shoot in Yaba block! 💅✨', timestamp: '2 days ago' },
          { id: 'nb3-p2', mediaUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&auto=format&fit=crop', caption: 'Brunch day, fit check. 🥞🥂', timestamp: '5 days ago' }
        ],
        highlights: [
          { id: 'nb3-hl1', name: 'Shoots', mediaUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop' }
        ]
      },
      'nb-4': {
        posts: [
          { id: 'nb4-p1', mediaUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop', caption: 'Morning baking baked goods! 🥐🎸', timestamp: '3 days ago' },
          { id: 'nb4-p2', mediaUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500&auto=format&fit=crop', caption: 'Playing classic acoustics 🎸🎤', timestamp: 'Yesterday' }
        ],
        highlights: [
          { id: 'nb4-hl1', name: 'Jamming', mediaUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&auto=format&fit=crop' }
        ]
      }
    };

    return dataMap[id] || {
      posts: [
        { id: `${id}-p1`, mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop', caption: `Nice meeting you! - ${name} 🌟`, timestamp: 'Yesterday' },
        { id: `${id}-p2`, mediaUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&auto=format&fit=crop', caption: `Fun times nearby! ✨`, timestamp: '4 days ago' }
      ],
      highlights: [
        { id: `${id}-hl1`, name: 'Vibes', mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&auto=format&fit=crop' }
      ]
    };
  };

  const activePosts = userPosts || [];
  const activeHighlights = userHighlights || [];

  // Calculate profile completion progress (circular)
  const calculateCompletion = () => {
    let score = 0;
    if (userDisplayName && userDisplayName !== "Nearby Member") score += 20;
    if (userBio && userBio !== "Connecting with neighbors face-to-face 👋") score += 20;
    if (userInterests && userInterests.length > 0) score += 20;
    if (customProfilePhoto || currentUser?.photoURL) score += 20;
    if (userWebsite && userWebsite !== "foslibrary.com.ng") score += 20;
    return score || 20; // Default min 20
  };
  const profileCompletionPercent = calculateCompletion();

  const missingSuggestions = [];
  if (!customProfilePhoto && !currentUser?.photoURL) missingSuggestions.push("Upload Profile Picture");
  if (!userBio || userBio === "Connecting with neighbors face-to-face 👋") missingSuggestions.push("Add Bio");
  if (!userInterests || userInterests.length === 0) missingSuggestions.push("Add Interests");
  if (!userWebsite || userWebsite === "foslibrary.com.ng") missingSuggestions.push("Verify Account website link");

  const isAFriend = isOwnProfile 
    ? true 
    : neighbor 
      ? (Array.isArray(friendIds) ? friendIds : []).includes(neighbor.id) || neighbor.isFriend || (Array.isArray(neighbor.friendIds) && neighbor.friendIds.includes(currentUser?.uid))
      : false;

  // Mutual friends list
  const getMutualFriends = () => {
    if (isOwnProfile) return [];
    // Select 3 random neighbors as mutual friends representation
    return neighbors.filter(n => n.id !== neighbor?.id && n.isFriend).slice(0, 3);
  };
  const mutualFriends = getMutualFriends();

  // Profile completeness UI representation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profileCompletionPercent / 100) * circumference;

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col justify-between overflow-hidden animate-fade-in text-neutral-950 font-sans">
      
      {/* 1. Header bar (Apple / Airbnb minimalistic back action) */}
      <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <button 
          onClick={onClose}
          className="text-xs font-bold text-neutral-800 hover:text-[#0F8A5F] px-4 py-2 bg-neutral-50 rounded-2xl transition-all duration-200 cursor-pointer flex items-center space-x-1"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <span className="font-extrabold text-xs tracking-tight text-neutral-400 uppercase font-mono">
          @{profileUsername}
        </span>
        <div className="w-[80px] flex justify-end">
          {isOwnProfile && (
            <button 
              onClick={() => {
                setShowEditProfileModal(true);
                triggerBeep(450, 0.05);
              }}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-full text-neutral-700 transition"
              title="Edit Profile Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto pb-8 space-y-8 bg-white relative scrollbar-none">
        
        {/* PROFILE HEADER GRAPHIC & AVATAR CONTAINER */}
        <div className="relative">
          {/* PROFILE HEADER WITH SOFT GRADIENT & subtle animation */}
          <div className="h-[280px] w-full bg-gradient-to-b from-[#0F8A5F] to-emerald-50 relative overflow-hidden flex items-center justify-center">
            {/* Very subtle animated floating lights */}
            <motion.div 
              animate={{ 
                y: [0, -18, 0], 
                x: [0, 15, 0], 
                opacity: [0.15, 0.35, 0.15] 
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute top-10 left-12 w-48 h-48 rounded-full bg-white blur-3xl pointer-events-none"
            />
            <motion.div 
              animate={{ 
                y: [0, 20, 0], 
                x: [0, -12, 0], 
                opacity: [0.1, 0.25, 0.1] 
              }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
              className="absolute bottom-4 right-10 w-40 h-40 rounded-full bg-emerald-300 blur-3xl pointer-events-none"
            />
            
            {/* Apple-styled floating greeting accent */}
            <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center space-y-1 select-none">
              <span className="text-[10px] uppercase font-bold text-white/70 tracking-widest font-mono">Nearby Safe Proximity</span>
              <h2 className="text-3xl font-black text-white drop-shadow-sm tracking-tight">
                {isOwnProfile ? "My Identity" : `${profileName}`}
              </h2>
            </div>
          </div>

          {/* PROFILE PHOTO CONTAINER FLOATING OVER THE BORDER */}
          <div className="absolute bottom-[-70px] left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  if (profilePhotoUrl) {
                    setFullscreenPhotoUrl(profilePhotoUrl);
                    triggerBeep(520, 0.08);
                  } else {
                    if (isOwnProfile && profileFileRef) {
                      profileFileRef.current?.click();
                    } else {
                      setAudioFeedback("Tap the Camera button to set an identity photo.");
                      setTimeout(() => setAudioFeedback(""), 2000);
                    }
                  }
                }}
                className="relative w-[140px] h-[140px] rounded-full overflow-hidden border-[5px] border-white flex items-center justify-center bg-white shadow-[0_12px_24px_rgba(0,0,0,0.12)] cursor-pointer"
              >
                {profilePhotoUrl ? (
                  <img 
                    src={profilePhotoUrl} 
                    alt={profileName} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-5xl rounded-full`}>
                    <span>{avatarEmoji}</span>
                  </div>
                )}
                {/* Online pulse bubble if other user */}
                {!isOwnProfile && neighbor?.onlineStatus === 'active' && (
                  <span className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-md" />
                )}
              </motion.div>

              {/* Direct Profile Photo Upload Button Overlay if Own Profile */}
              {isOwnProfile && profileFileRef && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    profileFileRef.current?.click();
                    triggerBeep(520, 0.05);
                  }}
                  className="absolute bottom-1 right-1 p-2.5 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-full border-2 border-white shadow-lg cursor-pointer transition active:scale-90 flex items-center justify-center"
                  title="Update Profile Picture"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SPACING COMPENSATOR FOR AVATAR */}
        <div className="pt-16 text-center space-y-2 px-6">
          <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
            <h1 className="text-[26px] font-black tracking-tight text-neutral-900">
              {profileName}
            </h1>
            {/* Always-verified beautiful certificate icon for High Trust levels or premium profiles */}
            {(trustScore >= 4.5 || isOwnProfile) && (
              <CheckCircle className="w-6 h-6 text-[#0F8A5F] fill-[#0F8A5F]/10 flex-shrink-0" title="Verified Safe Proximity Neighbor" />
            )}
          </div>
          <p className="text-sm text-neutral-500 font-sans tracking-tight">@{profileUsername}</p>

          {/* Location Line */}
          <div className="flex items-center justify-center space-x-2 text-xs font-medium text-neutral-500 pt-1">
            <MapPin className="w-3.5 h-3.5 text-[#0F8A5F]" />
            <span>{displayLocation}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-[#0F8A5F] font-bold">{distanceText}</span>
          </div>
        </div>

        {/* ACTION BUTTON PANEL */}
        <div className="px-5">
          <div className="flex gap-2 justify-center max-w-lg mx-auto">
            {isOwnProfile ? (
              <>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowEditProfileModal(true);
                    triggerBeep(520, 0.05);
                  }}
                  className="flex-1 h-[56px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-3xl font-bold text-sm transition-all duration-180 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (setShowFriendsModal) setShowFriendsModal(true);
                    triggerBeep(520, 0.05);
                  }}
                  className="flex-1 h-[56px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-3xl font-bold text-sm transition-all duration-180 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-neutral-600" />
                  <span>My Friends</span>
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const customLink = `${window.location.origin}/user/${userUsername}`;
                    navigator.clipboard.writeText(customLink);
                    setAudioFeedback(`✓ Link copied: ${customLink}`);
                    setTimeout(() => setAudioFeedback(""), 3000);
                    triggerBeep(520, 0.05);
                  }}
                  className="w-[56px] h-[56px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-3xl flex items-center justify-center cursor-pointer transition-all duration-180"
                  title="Share Profile Link"
                >
                  <Share2 className="w-4 h-4 text-neutral-600" />
                </motion.button>
              </>
            ) : (
              neighbor && (
                <>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onClose(); // Just go to chat room
                      triggerBeep(520, 0.05);
                    }}
                    className="flex-1 h-[56px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-3xl font-bold text-sm transition-all duration-180 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </motion.button>
                  {isAFriend && (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setScheduleMeetupTargetNeighbor(neighbor);
                        setScheduleMeetupPoint(neighbor.streetName || "Safe Neighborhood Spot");
                        setScheduleMeetupTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
                        setShowScheduleMeetupModal(true);
                        triggerBeep(520, 0.05);
                      }}
                      className="flex-1 h-[56px] bg-neutral-900 hover:bg-neutral-850 text-white rounded-3xl font-bold text-sm transition-all duration-180 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Meet Up</span>
                    </motion.button>
                  )}
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      triggerBeep(520, 0.05);
                      if (isAFriend) {
                        setAudioFeedback("You are already secure friends!");
                      } else if (sentFriendRequestIds.includes(neighbor.id)) {
                        setAudioFeedback("Friend request is currently pending.");
                      } else if (pendingFriendRequests.includes(neighbor.id)) {
                        handleAcceptFriendRequest(neighbor.id);
                        setAudioFeedback(`✓ Friendship accepted with ${neighbor.name}`);
                      } else {
                        handleAddNewFriend(neighbor.id);
                        setAudioFeedback(`✓ Friend request sent to ${neighbor.name}`);
                      }
                      setTimeout(() => setAudioFeedback(""), 3500);
                    }}
                    className={`flex-1 h-[56px] rounded-3xl font-bold text-sm transition-all duration-180 flex items-center justify-center space-x-2 cursor-pointer ${
                      isAFriend 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : sentFriendRequestIds.includes(neighbor.id)
                          ? 'bg-neutral-50 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                    }`}
                  >
                    {isAFriend ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Friend</span>
                      </>
                    ) : sentFriendRequestIds.includes(neighbor.id) ? (
                      <span>Pending</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Add Friend</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const shareLink = `${window.location.origin}/user/${neighbor.username}`;
                      navigator.clipboard.writeText(shareLink);
                      setAudioFeedback(`✓ Profile link copied: ${shareLink}`);
                      setTimeout(() => setAudioFeedback(""), 3500);
                      triggerBeep(520, 0.05);
                    }}
                    className="w-[56px] h-[56px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-3xl flex items-center justify-center cursor-pointer transition-all duration-180"
                    title="Share Proximity Grid"
                  >
                    <Share2 className="w-4 h-4 text-neutral-600" />
                  </motion.button>
                </>
              )
            )}
          </div>
        </div>

        {/* 3. TRUST CARD (SPEC REQUIREMENT) */}
        <div className="px-5">
          <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100/70">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">Verified Security Card</span>
              <span className="text-[10px] bg-[#0F8A5F]/10 text-[#0F8A5F] px-2 py-0.5 rounded-full font-bold">Level 2 Trust Check</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Trust score item */}
              <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-soft-sm text-center space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">Trust Rating</span>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-amber-400 text-sm font-black">
                    {"★".repeat(Math.round(trustScore))}
                    {"☆".repeat(5 - Math.round(trustScore))}
                  </span>
                  <span className="text-xs font-black text-neutral-800 bg-neutral-50 px-1.5 py-0.5 rounded font-mono">
                    {trustScore.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Trusted Meetups */}
              <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-soft-sm text-center space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">Trusted Meetups</span>
                <span className="text-lg font-black text-[#0F8A5F] block">
                  🤝 {meetupsCompleted}
                </span>
              </div>

              {/* Verified Meetups */}
              <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-soft-sm text-center space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">Verified Meetups</span>
                <span className="text-lg font-black text-emerald-600 block">
                  🔒 {verifiedMeetups}
                </span>
              </div>

              {/* Member Since */}
              <div className="p-4 bg-white rounded-2xl border border-neutral-100 shadow-soft-sm text-center space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">Member Since</span>
                <span className="text-lg font-black text-neutral-800 block">
                  ✨ {memberSince}
                </span>
              </div>
            </div>

            {/* Direct quick rating trigger if friend & other user */}
            {!isOwnProfile && neighbor && isAFriend && (
              <div className="bg-[#0F8A5F]/5 p-3.5 rounded-2xl border border-[#0F8A5F]/15 text-left space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 font-bold">Secure Rating Logger:</span>
                  <span className="text-[8px] bg-[#0F8A5F]/10 text-[#0F8A5F] px-1.5 py-0.5 rounded-full font-mono font-bold">Direct Record</span>
                </div>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={async () => {
                        const comment = prompt(`Log review for ${neighbor.name}:`, "Excellent communication, highly safe meeting spot.");
                        if (comment !== null) {
                          await handleRateNeighbor(neighbor.id, star, comment);
                          triggerBeep(600, 0.08);
                          setAudioFeedback(`✓ Rated ${star} stars securely`);
                        }
                      }}
                      className="text-lg transition hover:scale-125 focus:scale-125 text-amber-400 hover:text-amber-500"
                      title={`Submit rating for ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-[9px] text-neutral-400 italic">Tap to record a meet</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. ABOUT SECTION (SPEC REQUIREMENT) */}
        <div className="px-5">
          <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400 font-mono">About</h2>
              <span className="text-[9px] font-mono text-neutral-400 bg-white px-2 py-0.5 rounded border border-neutral-100">
                {profileBio.length} / 300
              </span>
            </div>
            
            {profileBio.trim() === "" || profileBio === "Let's connect." ? (
              /* EMPTY PROFILE STATE (SPEC REQUIREMENT) */
              <div className="py-4 text-center space-y-3">
                <span className="text-3xl">🌱</span>
                <p className="text-xs font-bold text-neutral-500">Tell people about yourself.</p>
                {isOwnProfile && (
                  <button 
                    onClick={() => setShowEditProfileModal(true)}
                    className="py-1.5 px-3 bg-[#0F8A5F] text-white font-extrabold text-[10px] rounded-xl cursor-pointer hover:bg-[#0C7A53] transition"
                  >
                    Complete Profile
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-700 leading-relaxed font-normal whitespace-pre-wrap font-sans max-w-full">
                {profileBio.slice(0, 300)}
              </p>
            )}

            {/* Link if provided */}
            {isOwnProfile ? (
              userWebsite && (
                <div className="text-[#0F8A5F] text-xs font-bold select-none hover:underline cursor-pointer flex items-center space-x-1 pt-1.5">
                  <ExternalLink className="w-3 h-3" />
                  <a href={`https://${userWebsite}`} target="_blank" rel="noopener noreferrer">
                    {userWebsite}
                  </a>
                </div>
              )
            ) : (
              neighbor?.streetName && (
                <div className="text-[#0F8A5F] text-xs font-bold select-none flex items-center space-x-1.5 pt-1">
                  <span>📍 Verified Local Area:</span>
                  <span className="text-neutral-700 font-normal">{neighbor.streetName}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* 5. PROFILE COMPLETION COMPONENT (ONLY FOR CURRENT USER - SPEC REQUIREMENT) */}
        {isOwnProfile && (
          <div className="px-5">
            <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">Profile Completion</span>
                <span className="text-xs font-bold text-[#0F8A5F]">{profileCompletionPercent}% Complete</span>
              </div>

              <div className="flex items-center space-x-5">
                {/* Circular progress SVG */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r={radius} className="text-neutral-200 stroke-current" strokeWidth="4" fill="transparent" />
                    <circle 
                      cx="28" cy="28" r={radius} 
                      className="text-[#0F8A5F] stroke-current" 
                      strokeWidth="4" 
                      fill="transparent" 
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-neutral-800">
                    {profileCompletionPercent}%
                  </div>
                </div>

                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-bold text-neutral-800">Complete your Safe Proximity grid</h4>
                  <p className="text-[10px] text-neutral-500 leading-snug">A complete profile builds trust up to 4.8x faster with nearby neighbors.</p>
                </div>
              </div>

              {missingSuggestions.length > 0 && (
                <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono block">Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSuggestions.map((sug, i) => (
                      <span 
                        key={i} 
                        onClick={() => {
                          setShowEditProfileModal(true);
                          triggerBeep(450, 0.05);
                        }}
                        className="text-[9px] font-bold text-neutral-600 bg-white border border-neutral-200 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-neutral-50"
                      >
                        + {sug}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. INTERESTS UI (SPEC REQUIREMENT) */}
        <div className="px-5">
          <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-4 text-left">
            <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono block">Proximity Interests</span>
            
            <div className="flex flex-wrap gap-1.5">
              {interestsList.map((interest) => (
                <span 
                  key={interest} 
                  className="text-xs font-extrabold bg-emerald-50 text-[#0F8A5F] px-3.5 py-1.5 rounded-full border border-emerald-100 shadow-soft-sm font-sans"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 7. MUTUAL INTERESTS (SPEC REQUIREMENT - OTHER USER PERSPECTIVE) */}
        {!isOwnProfile && mutualInterests.length > 0 && (
          <div className="px-5">
            <div className="bg-emerald-50/30 rounded-[28px] border border-emerald-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-3.5 text-left">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#0F8A5F]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#0F8A5F] font-mono">Mutual Connections</span>
              </div>
              
              <p className="text-xs font-bold text-neutral-700">You both enjoy:</p>
              
              <div className="flex flex-wrap gap-1.5">
                {mutualInterests.map((interest) => (
                  <span 
                    key={interest} 
                    className="text-xs font-black bg-[#0F8A5F] text-white px-3.5 py-1.5 rounded-full shadow-soft-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. MUTUAL FRIENDS (SPEC REQUIREMENT) */}
        {!isOwnProfile && mutualFriends.length > 0 && (
          <div className="px-5">
            <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">Mutual Friends</span>
                <button 
                  onClick={() => setShowAllMutualFriends(true)}
                  className="text-[10px] font-black text-[#0F8A5F] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Overlapping avatars row */}
              <div className="flex items-center">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {mutualFriends.map((f, i) => (
                    <div 
                      key={f.id} 
                      className="inline-block h-9 w-9 rounded-full ring-2 ring-white overflow-hidden bg-neutral-200"
                    >
                      {f.customProfilePhoto ? (
                        <img src={f.customProfilePhoto} alt={f.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className={`h-full w-full ${f.avatarColor} flex items-center justify-center text-xs`}>
                          <span>{f.avatarEmoji}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500 font-medium ml-3">
                  Including {mutualFriends.map(f => f.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONDITIONAL HIGHLIGHTS & POSTS SECTION BASED ON FRIENDSHIP (SPEC REQUIREMENT) */}
        {isAFriend ? (
          <>
            {/* INSTAGRAM-STYLE HIGHLIGHTS ROW (SPEC REQUIREMENT) */}
            <div className="px-5">
              <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">Highlights</span>
                  {isOwnProfile && setUploadMode && postFileRef && (
                    <button 
                      onClick={() => {
                        setUploadMode('highlight');
                        setTimeout(() => {
                          postFileRef.current?.click();
                        }, 50);
                        triggerBeep(450, 0.08);
                      }}
                      className="text-[10px] font-black text-[#0F8A5F] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>+ New Highlight</span>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 overflow-x-auto py-2 scrollbar-none">
                  {/* Add Highlight Circle if Own Profile and empty */}
                  {isOwnProfile && setUploadMode && postFileRef && (
                    <div className="flex flex-col items-center shrink-0 space-y-1.5">
                      <button
                        onClick={() => {
                          setUploadMode('highlight');
                          setTimeout(() => {
                            postFileRef.current?.click();
                          }, 50);
                          triggerBeep(450, 0.08);
                        }}
                        className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 hover:border-[#0F8A5F] flex items-center justify-center bg-white hover:bg-neutral-50 transition-all duration-200 cursor-pointer"
                        title="Add Highlight"
                      >
                        <Plus className="w-5 h-5 text-neutral-400" />
                      </button>
                      <span className="text-[10px] font-bold text-neutral-500 font-sans tracking-tight">New</span>
                    </div>
                  )}

                  {/* Display existing Highlights */}
                  {activeHighlights.length === 0 ? (
                    !isOwnProfile && (
                      <span className="text-xs font-medium text-neutral-400 py-3 block">No highlights uploaded yet.</span>
                    )
                  ) : (
                    activeHighlights.map((hl: any) => {
                      const isVideo = isHighlightVideo(hl);
                      return (
                        <div 
                          key={hl.id} 
                          className="flex flex-col items-center shrink-0 space-y-1.5 cursor-pointer group"
                          onClick={() => {
                            setViewingHighlight(hl);
                            triggerBeep(450, 0.05);
                          }}
                        >
                          {/* Circle Ring like IG */}
                          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-rose-500 hover:scale-105 transition duration-200 shadow-sm">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-neutral-100 relative">
                              {isVideo ? (
                                <div className="w-full h-full relative">
                                  <video 
                                    src={hl.mediaUrl} 
                                    className="w-full h-full object-cover rounded-full" 
                                    muted 
                                    playsInline 
                                  />
                                  <span className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <Camera className="w-3.5 h-3.5 text-white" />
                                  </span>
                                </div>
                              ) : (
                                <img src={hl.mediaUrl} alt={hl.name} className="w-full h-full object-cover rounded-full" />
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-neutral-600 font-sans tracking-tight max-w-[64px] truncate">
                            {hl.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 9. INSTAGRAM-STYLE SECURE GRAPHICS GALLERY (SPEC REQUIREMENT) */}
            <div className="px-5">
              <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 max-w-lg mx-auto space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">Personal Grid Feed</span>
                  {isOwnProfile && setUploadMode && postFileRef && (
                    <button 
                      onClick={() => {
                        setUploadMode('post');
                        setTimeout(() => {
                          postFileRef.current?.click();
                        }, 50);
                        triggerBeep(450, 0.08);
                      }}
                      className="text-[10px] font-black text-[#0F8A5F] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>+ Add Post</span>
                    </button>
                  )}
                </div>

                {activePosts.length === 0 ? (
                  <div className="py-6 text-center text-xs font-bold text-neutral-400">
                    No personal captures logged yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {activePosts.map((post: any) => (
                      <div 
                        key={post.id}
                        onClick={() => {
                          if (setViewingUserPostDetail) {
                            setViewingUserPostDetail(post);
                            triggerBeep(450, 0.05);
                          }
                        }}
                        className="aspect-square bg-white rounded-xl overflow-hidden relative border border-neutral-100/70 hover:opacity-90 cursor-pointer shadow-soft-sm transition-all duration-200 group"
                      >
                        {post.type === 'video' ? (
                          <div className="w-full h-full relative">
                            <video 
                              src={post.mediaUrl} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                              muted 
                              playsInline 
                            />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[7px] text-white font-mono font-bold tracking-wider">VIDEO</span>
                          </div>
                        ) : (
                          <img 
                            src={post.mediaUrl} 
                            alt="capture grid" 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 10. RECENT POST DETAILS (Apple/Airbnb style Feed Cards - SPEC REQUIREMENT) */}
            <div className="px-5">
              <div className="max-w-lg mx-auto space-y-5">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono block text-left">Recent Proximity Timeline</span>
                
                {activePosts.length === 0 ? (
                  <div className="bg-neutral-50/50 rounded-[28px] border border-neutral-100 p-6 text-center text-xs font-bold text-neutral-400">
                    Nothing posted recently.
                  </div>
                ) : (
                  activePosts.map((post: any) => (
                    <div 
                      key={post.id}
                      className="bg-white rounded-[28px] border border-neutral-100 overflow-hidden shadow-soft-sm hover:shadow-soft transition-all duration-300 text-left"
                    >
                      {/* Card Header */}
                      <div className="p-4 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100">
                          {profilePhotoUrl ? (
                            <img src={profilePhotoUrl} alt="author" className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-xs`}>
                              <span>{avatarEmoji}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-neutral-800">{profileName}</h4>
                          <span className="text-[9px] text-neutral-400 font-mono">{post.timestamp || "Just now"}</span>
                        </div>
                      </div>

                      {/* Card Media (Image or Video) */}
                      <div className="aspect-video w-full bg-neutral-100 overflow-hidden relative flex items-center justify-center">
                        {post.type === 'video' ? (
                          <video 
                            src={post.mediaUrl} 
                            controls 
                            playsInline
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
                        )}
                      </div>

                      {/* Card Actions & Caption */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1.5 text-neutral-600 hover:text-red-500 transition cursor-pointer">
                            <Heart className="w-4 h-4" />
                            <span className="text-[10px] font-bold">12</span>
                          </button>
                          <button className="flex items-center space-x-1.5 text-neutral-600 hover:text-[#0F8A5F] transition cursor-pointer">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-[10px] font-bold">3</span>
                          </button>
                          <button className="flex items-center space-x-1.5 text-neutral-600 hover:text-neutral-900 transition cursor-pointer">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-neutral-700 leading-normal">
                          <strong className="text-neutral-900 font-black mr-1.5">@{profileUsername}</strong>
                          {post.caption || "Safe gatherings at the local square, drop by neighbor!"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          /* LOCKED PROFILE OVERLAY CARD - GAMIFIED AND INTERACTIVE! (SPEC REQUIREMENT) */
          <div className="px-5 pb-6">
            <div className="pt-8 pb-10 px-6 border border-neutral-100 bg-neutral-50/50 rounded-[32px] flex flex-col items-center justify-center text-center space-y-5 max-w-lg mx-auto shadow-sm hover:shadow-soft transition duration-300">
              <div className="w-16 h-16 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-full flex items-center justify-center text-3xl animate-pulse">
                🔒
              </div>
              <div className="space-y-1.5 max-w-[270px]">
                <h4 className="font-extrabold text-sm text-neutral-800">Grid Feed & Highlights Locked</h4>
                <p className="text-xs text-neutral-500 leading-normal">
                  Only mutual friends can view each other's full profiles, highlights, and posts. Add {profileName} to unlock.
                </p>
              </div>

              {(sentFriendRequestIds || []).includes(neighbor?.id || "") ? (
                <button
                  className="py-2.5 px-6 bg-neutral-200 text-neutral-500 font-extrabold text-xs rounded-2xl tracking-wide uppercase transition shadow-sm cursor-not-allowed"
                  disabled
                >
                  Request sent
                </button>
              ) : (pendingFriendRequests || []).includes(neighbor?.id || "") ? (
                <button
                  onClick={() => {
                    if (neighbor) {
                      handleAcceptFriendRequest(neighbor.id);
                      triggerBeep(520, 0.08);
                    }
                  }}
                  className="py-2.5 px-6 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-extrabold text-xs rounded-2xl tracking-wide uppercase transition active:scale-95 cursor-pointer shadow-sm animate-pulse"
                >
                  Accept Request
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (neighbor) {
                      handleAddNewFriend(neighbor.id);
                      triggerBeep(520, 0.12);
                    }
                  }}
                  className="py-2.5 px-6 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-extrabold text-xs rounded-2xl tracking-wide uppercase transition active:scale-95 cursor-pointer shadow-sm"
                >
                  Add Friend
                </button>
              )}
            </div>
          </div>
        )}

        {/* 11. NEIGHBORHOOD REPORTS / BLOCKS SECTION (ONLY FOR OTHER USER) */}
        {!isOwnProfile && neighbor && (
          <div className="px-5">
            <div className="bg-red-50/20 rounded-[28px] border border-red-100 p-6 shadow-soft max-w-lg mx-auto space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-red-500 uppercase tracking-widest font-mono block">Neighbor Red Flags</span>
                  <span className="text-xs font-bold text-neutral-800">
                    {neighbor.reportsCount || 0} reports / complaints
                  </span>
                </div>
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>

              {/* Progress bar to Ban */}
              <div className="space-y-1">
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200">
                  <div 
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, ((neighbor.reportsCount || 0) / 10) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono text-neutral-400">
                  <span>0 reports</span>
                  <span className="text-red-500 font-bold">10 = Automatic Regional Ban</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[9px] text-neutral-500 leading-snug max-w-[200px]">
                  Safety issues? Report anonymously to local admins for safe intervention.
                </p>
                <button
                  onClick={() => {
                    const reason = prompt("Describe safety concern details:");
                    if (reason) {
                      handleReportNeighbor(neighbor.id, reason);
                      setAudioFeedback("✓ Safety report successfully logged.");
                      setTimeout(() => setAudioFeedback(""), 3000);
                    }
                  }}
                  className="py-1.5 px-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
                >
                  ⚠️ Report Neighbor
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FULLSCREEN PHOTO PREVIEW MODAL                                    */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {fullscreenPhotoUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenPhotoUrl(null)}
            className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              className="absolute top-5 right-5 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 z-[70] cursor-pointer"
              onClick={() => setFullscreenPhotoUrl(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={fullscreenPhotoUrl} alt="identity preview" className="object-contain max-w-full max-h-[80vh] rounded-2xl" />
              <div className="p-4 bg-black/80 backdrop-blur-md absolute bottom-0 left-0 right-0 text-center">
                <p className="text-xs text-white/90 font-sans">{profileName}</p>
                <span className="text-[9.5px] text-white/50 font-mono">@{profileUsername}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* MUTUAL FRIENDS OVERLAY DRAWER                                     */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {showAllMutualFriends && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAllMutualFriends(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55] flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[32px] w-full max-w-md p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                <span className="text-sm font-black uppercase tracking-widest text-neutral-400 font-mono">Mutual Connections</span>
                <button 
                  onClick={() => setShowAllMutualFriends(false)}
                  className="p-1 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {mutualFriends.map(friend => (
                  <div key={friend.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200">
                        {friend.customProfilePhoto ? (
                          <img src={friend.customProfilePhoto} alt={friend.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full ${friend.avatarColor} flex items-center justify-center text-sm`}>
                            <span>{friend.avatarEmoji}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-neutral-800">{friend.name}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono">@{friend.username}</span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-50 text-[#0F8A5F] px-2 py-0.5 rounded-full font-bold">MUTUAL</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* PREMIUM FLOATING EDIT PROFILE BOTTOM SHEET & LIVE PREVIEW          */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {showEditProfileModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditProfileModal(false)}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[55] flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[32px] w-full max-w-md p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl border-t border-neutral-100 text-neutral-800 relative scrollbar-none"
            >
              {/* Sliding handle */}
              <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-neutral-200 rounded-full" />

              {/* Title & Close */}
              <div className="flex justify-between items-center pt-2 border-b border-neutral-100 pb-3">
                <div className="text-left">
                  <h3 className="font-black text-lg text-neutral-900 tracking-tight flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-[#0F8A5F]" />
                    <span>Edit Profile</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-medium">Configure your nearby proximity identity.</p>
                </div>
                <button 
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-1 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>

              {/* LIVE PROFILE PREVIEW CARD */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F8A5F] font-mono block">Live Profile Preview</span>
                <div className="bg-gradient-to-b from-emerald-500/10 to-white rounded-2xl border border-emerald-500/10 p-5 shadow-soft space-y-3 relative overflow-hidden">
                  <div className="flex items-center space-x-3.5">
                    {/* Preview Photo */}
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-white shadow-soft-sm shrink-0">
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-2xl`}>
                          <span>{avatarEmoji}</span>
                        </div>
                      )}
                    </div>
                    {/* Names */}
                    <div>
                      <h4 className="text-sm font-black text-neutral-900 flex items-center space-x-1">
                        <span>{userDisplayName || "Nearby Member"}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-[#0F8A5F] fill-emerald-50" />
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-mono">@{userUsername || "nearby_member"}</p>
                      <p className="text-[9px] text-[#0F8A5F] font-bold mt-0.5">📍 Osogbo, Nigeria</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="text-[11px] text-neutral-600 leading-normal italic bg-white/60 p-2.5 rounded-xl border border-neutral-50/50">
                    "{userBio || "No biography added yet."}"
                  </div>

                  {/* Website link */}
                  {userWebsite && (
                    <div className="text-[10px] font-bold text-[#0F8A5F] flex items-center space-x-1">
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>{userWebsite}</span>
                    </div>
                  )}

                  {/* Interests Preview */}
                  {userInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {userInterests.map((interest) => (
                        <span key={interest} className="text-[8px] font-black bg-emerald-50 text-[#0F8A5F] px-2 py-0.5 rounded-full border border-emerald-100">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* BEAUTIFUL INPUT CARDS */}
              <div className="space-y-4 text-left">
                
                {/* Profile Photo Uploader Card */}
                {profileFileRef && handleGalleryUploadForProfilePic && (
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between shadow-soft-sm">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-neutral-800">Profile Photo</h4>
                      <p className="text-[10px] text-neutral-400 font-medium">Upload a verified face capture.</p>
                    </div>
                    <input 
                      type="file" 
                      ref={profileFileRef as any} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleGalleryUploadForProfilePic} 
                    />
                    <button 
                      onClick={() => profileFileRef.current?.click()}
                      className="p-2.5 bg-white hover:bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200 transition-all flex items-center justify-center cursor-pointer shadow-soft-sm"
                      title="Upload Avatar Image"
                    >
                      <Camera className="w-4 h-4 text-[#0F8A5F]" />
                    </button>
                  </div>
                )}

                {/* Name Card */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-soft-sm">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">Full Name</label>
                  <input 
                    type="text"
                    value={userDisplayName}
                    onChange={(e) => setUserDisplayName(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs text-neutral-800 focus:ring-1 focus:ring-[#0F8A5F] focus:outline-none focus:border-[#0F8A5F] font-medium shadow-soft-sm"
                    placeholder="e.g. Samuel Adebayo"
                  />
                </div>

                {/* Username Handle Card */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-soft-sm">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">Username Handle</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[#0F8A5F] text-xs font-mono font-bold">@</span>
                    <input 
                      type="text"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full bg-white border border-neutral-200 rounded-xl pl-7 pr-3 py-2.5 text-xs text-neutral-800 focus:ring-1 focus:ring-[#0F8A5F] focus:outline-none focus:border-[#0F8A5F] font-mono font-bold shadow-soft-sm"
                      placeholder="e.g. samuel"
                    />
                  </div>
                </div>

                {/* Grid Website Card */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-soft-sm">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">Grid Website / link</label>
                  <input 
                    type="text"
                    value={userWebsite}
                    onChange={(e) => setUserWebsite(e.target.value.toLowerCase())}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs text-neutral-800 focus:ring-1 focus:ring-[#0F8A5F] focus:outline-none focus:border-[#0F8A5F] font-mono shadow-soft-sm"
                    placeholder="e.g. samuel.ng"
                  />
                </div>

                {/* Biography Card */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-soft-sm">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">Short Biography</label>
                    <span className="text-[9px] text-neutral-400 font-mono font-bold">{userBio.length}/300</span>
                  </div>
                  <textarea 
                    rows={3}
                    maxLength={300}
                    value={userBio}
                    onChange={(e) => setUserBio(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs text-neutral-800 focus:ring-1 focus:ring-[#0F8A5F] focus:outline-none focus:border-[#0F8A5F] leading-relaxed shadow-soft-sm"
                    placeholder="Tell neighbors your story face-to-face o..."
                  />
                </div>

                {/* Age & Gender Selection Card */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 grid grid-cols-2 gap-3 shadow-soft-sm">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">Age Range</label>
                    <select
                      value={userAgeRange}
                      onChange={(e) => setUserAgeRange(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-2 py-2 text-xs text-neutral-800 focus:ring-1 focus:ring-[#0F8A5F] focus:outline-none font-sans font-medium"
                    >
                      <option value="18-24">18-24 years</option>
                      <option value="25-34">25-34 years</option>
                      <option value="35-44">35-44 years</option>
                      <option value="45+">45+ years</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono">Gender</label>
                    <select
                      value={userGender}
                      onChange={(e) => setUserGender(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-2 py-2 text-xs text-neutral-800 focus:ring-1 focus:ring-[#0F8A5F] focus:outline-none font-sans font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Interests Card */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3 shadow-soft-sm">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-mono block">Proximity Interests (Tap to Toggle)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '📚 Study Partner',
                      '🏃 Stroll Buddy',
                      '💼 Business Networking',
                      '🏋️ Gym Partner',
                      '🎮 Gaming Buddy',
                      '🙏 Christian Discussion',
                      '🙏 Muslim Discussion',
                      '🎨 Creative Collaboration',
                      '🍲 Food Hangout',
                      '🌍 New In Town'
                    ].map(interest => {
                      const isSel = userInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            triggerBeep(450, 0.04);
                            if (isSel) {
                              setUserInterests(userInterests.filter(i => i !== interest));
                            } else {
                              setUserInterests([...userInterests, interest]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border outline-none cursor-pointer ${
                            isSel 
                              ? 'bg-[#0F8A5F] border-[#0F8A5F] text-white shadow-soft-sm' 
                              : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-soft-xs'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* SAVE BUTTON */}
              <button
                onClick={async () => {
                  if (currentUser) {
                    try {
                      const userDocRef = doc(db, 'users', currentUser.uid);
                      await setDoc(userDocRef, {
                        name: userDisplayName,
                        username: userUsername,
                        website: userWebsite,
                        bio: userBio,
                        customProfilePhoto: customProfilePhoto,
                        ageRange: userAgeRange,
                        gender: userGender,
                        interests: userInterests,
                        updatedAt: new Date().toISOString()
                      }, { merge: true });
                      setAudioFeedback("✓ Proximity identity updated securely!");
                    } catch (e) {
                      console.error("Profile save error:", e);
                      setAudioFeedback("⚠ Error saving proximity identity.");
                    }
                    setTimeout(() => setAudioFeedback(""), 4000);
                  }
                  setShowEditProfileModal(false);
                  triggerBeep(520, 0.1);
                }}
                className="w-full py-4 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-black text-sm rounded-3xl tracking-wider uppercase shadow-md active:scale-95 transition cursor-pointer"
              >
                ✓ Save Proximity Identity
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs always available */}
      {profileFileRef && handleGalleryUploadForProfilePic && (
        <input 
          type="file" 
          ref={profileFileRef as any} 
          className="hidden" 
          accept="image/*" 
          onChange={handleGalleryUploadForProfilePic} 
        />
      )}
      {postFileRef && handleGalleryUploadForPost && (
        <input 
          type="file" 
          ref={postFileRef as any} 
          className="hidden" 
          accept="image/*,video/*" 
          onChange={handleGalleryUploadForPost} 
        />
      )}

      {/* 11. IMMERSIVE INSTAGRAM-STYLE STORY/HIGHLIGHT VIEWER */}
      <AnimatePresence>
        {viewingHighlight && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-4"
          >
            {/* Top Bar with Profile Info and Progress Indicators */}
            <div className="space-y-4">
              {/* Instagram-style segmented progress bar */}
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={() => {
                    setViewingHighlight(null);
                  }}
                  className="h-full bg-white rounded-full"
                />
              </div>

              {/* Header Info */}
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="author" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full ${avatarColor} flex items-center justify-center text-xs`}>
                        <span>{avatarEmoji}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black">{profileName}</h4>
                    <span className="text-[9px] text-white/60 font-mono">Highlight • {viewingHighlight.name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isOwnProfile && currentUser && (
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this highlight?")) return;
                        try {
                          const hlRef = doc(db, 'users', currentUser.uid, 'highlights', viewingHighlight.id);
                          await deleteDoc(hlRef);
                          setAudioFeedback("Highlight deleted.");
                        } catch (err) {
                          console.error("Delete highlight error:", err);
                        }
                        setViewingHighlight(null);
                        triggerBeep(320, 0.1);
                      }}
                      className="px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                      title="Delete Highlight"
                    >
                      <span>Delete</span>
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setViewingHighlight(null);
                      triggerBeep(400, 0.05);
                    }}
                    className="p-1.5 bg-white/10 hover:bg-white/25 rounded-full transition text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Body (Centered Image or Auto-Playing Video) */}
            <div className="flex-1 flex items-center justify-center my-4 overflow-hidden rounded-2xl relative bg-black">
              {isHighlightVideo(viewingHighlight) ? (
                <video 
                  src={viewingHighlight.mediaUrl} 
                  className="max-w-full max-h-full object-contain" 
                  autoPlay 
                  playsInline 
                  controls={false}
                  loop={false}
                  onEnded={() => setViewingHighlight(null)}
                />
              ) : (
                <img 
                  src={viewingHighlight.mediaUrl} 
                  alt={viewingHighlight.name} 
                  className="max-w-full max-h-full object-contain" 
                />
              )}
            </div>

            {/* Bottom Bar Caption / Title */}
            <div className="py-2 text-center text-white space-y-1 select-none">
              <span className="text-xs font-extrabold tracking-widest uppercase text-[#0F8A5F] font-mono">
                {viewingHighlight.name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
});
