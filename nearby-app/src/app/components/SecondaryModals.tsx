import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin as GMapPin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import GoogleMapIntegration from '../../features/maps/components/GoogleMapIntegration';
import { OnboardingScreen } from '../../features/authentication/components/OnboardingScreen';
import { CallOverlay } from '../../features/calls/components/CallOverlay';
import { LandingScreen } from '../../features/authentication/components/LandingScreen';
import {
  MapPin,
  Instagram,
  Music,
  MessageCircle,
  Camera,
  User,
  Phone,
  Video as VideoIcon,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  Upload,
  Radio,
  Navigation,
  Compass,
  Radar,
  Heart,
  Palette,
  Check,
  CheckCheck,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Mail,
  Plus,
  X,
  Play,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Volume2,
  Tv,
  Smile,
  Info,
  Sun,
  Moon,
  UserPlus,
  Settings,
  Menu,
  Grid,
  Key,
  Lock,
  Bell,
  Globe,
  Link,
  Share2,
  HelpCircle,
  Shield,
  ShieldAlert,
  CheckCircle2,
  LogOut,
  Image as ImageIcon,
  Home,
  Users,
  Paperclip,
  FileText,
  Download,
  Crown,
  SlidersHorizontal,
  Reply,
  Trash2,
  Pin,
  Archive,
  ArrowLeft,
  MessageSquare,
  RefreshCw,
  Wifi,
  WifiOff,
  Signal,
  VolumeX,
  MoreVertical,
  MoreHorizontal,
  Bluetooth,
  Star
} from 'lucide-react';
import { Neighbor, DirectMessage, CallState, StorySnap, PublicSnap, Meetup, MeetupRating } from '../../types';
import { NEIGHBORHOODS, NIGERIAN_STATES, INITIAL_NEIGHBORS, INITIAL_MESSAGES, LocationPreset, INITIAL_NOTES, UserNote } from '../../mockData';
import { getStateStreets } from '../../utils';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  where,
  arrayUnion,
  arrayRemove,
  getDocFromServer,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  uploadToStorage,
  createNotification,
  markNotificationsAsRead,
  AppNotification
} from '../../firebase';
import {
  User as FirebaseUser,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import ExploreTab from '../../features/explore/components/ExploreTab';
import { PremiumChatRoom } from '../../features/chat/components/PremiumChatRoom';
import { PremiumProfileView } from '../../features/profile/components/PremiumProfileView';
import { useNearbyRuntime } from '../context/NearbyRuntimeContext';

export default function SecondaryModals() {
  const {
    setActiveTab,
    updatePresetWithCoordinates,
    neighbors,
    setSelectedNeighbor,
    pendingFriendRequests,
    sentFriendRequestIds,
    showFriendsModal,
    setShowFriendsModal,
    showNeighborFriendsModal,
    setShowNeighborFriendsModal,
    showNotificationsModal,
    setShowNotificationsModal,
    showContactsModal,
    setShowContactsModal,
    showContactsPermissionPrompt,
    setShowContactsPermissionPrompt,
    newContactName,
    setNewContactName,
    newContactPhone,
    setNewContactPhone,
    showAddContactForm,
    setShowAddContactForm,
    notifications,
    profileFileRef,
    postFileRef,
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
    userCommunities,
    appLanguage,
    setAppLanguage,
    showLanguageModal,
    setShowLanguageModal,
    showInviteModal,
    setShowInviteModal,
    contactsList,
    setContactsList,
    isRequestingContacts,
    showHelpModal,
    setShowHelpModal,
    helpEmail,
    setHelpEmail,
    helpCategory,
    setHelpCategory,
    helpMessage,
    setHelpMessage,
    showAccountModal,
    setShowAccountModal,
    showPrivacyModal,
    setShowPrivacyModal,
    showChatsConfigModal,
    setShowChatsConfigModal,
    userTelephone,
    setUserTelephone,
    privacyDisappearing,
    setPrivacyDisappearing,
    viewingNeighborProfile,
    setViewingNeighborProfile,
    showEditProfileModal,
    setShowEditProfileModal,
    customProfilePhoto,
    setCustomProfilePhoto,
    viewingUserPostDetail,
    setViewingUserPostDetail,
    neighborPosts,
    neighborHighlights,
    userStatusText,
    setUserStatusText,
    userPosts,
    setUserPosts,
    userHighlights,
    meetups,
    meetupRatings,
    showScheduleMeetupModal,
    setShowScheduleMeetupModal,
    scheduleMeetupTargetNeighbor,
    setScheduleMeetupTargetNeighbor,
    scheduleMeetupPoint,
    setScheduleMeetupPoint,
    scheduleMeetupTime,
    setScheduleMeetupTime,
    ratingReviewText,
    setRatingReviewText,
    activeRatingStars,
    setActiveRatingStars,
    showInlineRatingForm,
    setShowInlineRatingForm,
    ratingFormMeetupId,
    setRatingFormMeetupId,
    aboutDetailModal,
    setAboutDetailModal,
    confirmDeleteAccount,
    setConfirmDeleteAccount,
    handleGalleryUploadForProfilePic,
    handleGalleryUploadForPost,
    _setChatMessages,
    currentUser,
    setIsAiTyping,
    setUploadMode,
    customChatBg,
    setCustomChatBg,
    customChatFont,
    setCustomChatFont,
    friendIds,
    setFriendIds,
    isUserVisibleOnRadar,
    setIsUserVisibleOnRadar,
    appTheme,
    setUserCoords,
    setGpsSynced,
    setSearchStateQuery,
    showStateSearchModal,
    setShowStateSearchModal,
    setAudioFeedback,
    showForwardModal,
    setShowForwardModal,
    logoutUser,
    saveOrUpdateMessageInFirestore,
    handleMarkAllNotificationsRead,
    handleClearAllNotifications,
    handleDeleteNotification,
    handleToggleReadNotification,
    getGroupedNotifications,
    triggerBeep,
    handleRateNeighbor,
    handleScheduleMeetup,
    handleCancelMeetup,
    handleReportNeighbor,
    handleAddNewFriend,
    handleAcceptFriendRequest,
    saveContactsToFirestore,
    handleSyncContacts,
    executeContactsSyncAfterPermission,
    theme,
  } = useNearbyRuntime();

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* NIGERIAN STATES MAP CENTRAL ACCURACY LOCATOR SEARCH */}
      {/* ---------------------------------------------------- */}
      {showStateSearchModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5">
          <div className={`p-6 rounded-[24px] w-full max-w-sm space-y-6 border transition-all relative ${
            appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-2xl'
          }`}>
            <button 
              onClick={() => {
                setShowStateSearchModal(false);
                setSearchStateQuery('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full transition-all bg-neutral-800/10 dark:bg-neutral-800 hover:scale-105 active:scale-95 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Premium Animated Radar concentric tracker section */}
            <div className="flex flex-col items-center justify-center pt-2 space-y-3.5 relative overflow-hidden">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 border border-blue-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/30 animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                  <Compass className="w-5 h-5 text-white animate-spin-slow" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <h3 className={`font-display font-extrabold text-center text-lg uppercase tracking-tight ${theme.textMain}`}>
                  Sync Live GPS Tracker
                </h3>
                <p className={`text-[11px] text-center leading-relaxed max-w-[260px] mx-auto ${theme.textMuted}`}>
                  Establish high-accuracy satellite signal triangulation o! Nearby auto-tracks your coordinates to map out local streets, find active safe meetups, and connect with neighbors within walking distance.
                </p>
              </div>
            </div>

            {/* GPS accurate flashy pulsing button */}
            <div className="pt-2">
              <button
                onClick={async () => {
                  if (navigator.geolocation) {
                    setAudioFeedback("🛰️ Scanning satellite signals...");
                    
                    const triggerSuccess = async (p: GeolocationPosition) => {
                      const { latitude, longitude } = p.coords;
                      setUserCoords({ lat: latitude, lng: longitude });
                      setGpsSynced(true);
                      
                      const newP = await updatePresetWithCoordinates(latitude, longitude, true);
                      if (newP) {
                        setAudioFeedback(`🛰️ GPS snaps: ${newP.name}`);
                      } else {
                        setAudioFeedback("🛰️ Accurate GPS center enabled!");
                      }
                      
                      setShowStateSearchModal(false);
                      setSearchStateQuery('');
                      setTimeout(() => setAudioFeedback(''), 3000);
                    };

                    navigator.geolocation.getCurrentPosition(
                      triggerSuccess,
                      (err) => {
                        console.warn("High-accuracy teleporter GPS failed o, trying standard-accuracy backup:", err);
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            triggerSuccess,
                            (fbErr) => {
                              console.error("Backup teleporter standard GPS failed too:", fbErr);
                              setAudioFeedback("⚠️ Geolocation blocked or unavailable");
                              setTimeout(() => setAudioFeedback(''), 3500);
                            },
                            { enableHighAccuracy: false, timeout: 15000 }
                          );
                        } else {
                          setAudioFeedback("⚠️ Geolocation blocked or unavailable");
                          setTimeout(() => setAudioFeedback(''), 3500);
                        }
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  } else {
                    setAudioFeedback("⚠️ Your device doesn't support GPS");
                    setTimeout(() => setAudioFeedback(''), 3000);
                  }
                }}
                className="w-full h-[58px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-[18px] text-[12px] tracking-wider uppercase flex items-center justify-center space-x-2 cursor-pointer shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.55)] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 animate-pulse-slow"
              >
                <Navigation className="w-4 h-4 fill-white animate-pulse" />
                <span>ENABLE REAL-TIME GPS TRACKER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 📝 NEW CUSTOM EDIT PROFILE DIALOG MODAL (NEARBY COHESIVE STYLE) */}
      {/* ---------------------------------------------------- */}
      {showEditProfileModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 rounded-[2.5rem] w-full max-w-sm border transition-all space-y-4 bg-neutral-900 border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="font-black text-sm tracking-tight text-white flex items-center space-x-1.5">
                <span>📝 Edit Proximity Profile</span>
              </span>
              <button 
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 px-2.5 bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-3.5 font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Full Name</label>
                <input 
                  type="text"
                  value={userDisplayName}
                  onChange={(e) => setUserDisplayName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Lanre Fasipe"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Username Handle</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-500 text-xs font-mono">@</span>
                  <input 
                    type="text"
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                    placeholder="e.g. fashfos"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Grid Website/Link</label>
                <input 
                  type="text"
                  value={userWebsite}
                  onChange={(e) => setUserWebsite(e.target.value.toLowerCase())}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  placeholder="e.g. foslibrary.com.ng"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Bio / Agriculture Metier (Linebreaks Supported)</label>
                <textarea 
                  rows={2}
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  placeholder="Tell neighbors your story o..."
                />
              </div>

              {/* Age Range & Gender */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Age Range</label>
                  <select
                    value={userAgeRange}
                    onChange={(e) => setUserAgeRange(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
                  >
                    <option value="18-24">18-24 years</option>
                    <option value="25-34">25-34 years</option>
                    <option value="35-44">35-44 years</option>
                    <option value="45+">45+ years</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Gender</label>
                  <select
                    value={userGender}
                    onChange={(e) => setUserGender(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Interests multi-select tags */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Your Interests (Tap to Toggle)</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    '📚 Study Partner',
                    '🏃 Stroll Buddy',
                    '💼 Business Networking',
                    '🏋️ Gym Partner',
                    '🎮 Gaming Buddy',
                    '🙏 Christian Faith Discussion',
                    '🙏 Muslim Faith Discussion',
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
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all border outline-none cursor-pointer ${
                          isSel 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

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
                      ageRange: userAgeRange,
                      gender: userGender,
                      interests: userInterests,
                      communities: userCommunities,
                      updatedAt: new Date().toISOString()
                    }, { merge: true });
                    setAudioFeedback("Profile updated.");
                  } catch (e) {
                    console.error("Profile save error:", e);
                    setAudioFeedback("Error saving profile.");
                  }
                  setTimeout(() => setAudioFeedback(""), 4000);
                }
                setShowEditProfileModal(false);
                triggerBeep(520, 0.1);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl tracking-wider uppercase shadow-md active:scale-95 transition cursor-pointer"
            >
              ✓ Save Custom Grid Info
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🤝 SCHEDULE SAFE MEETUP MODAL OVERLAY */}
      {/* ---------------------------------------------------- */}
      {showScheduleMeetupModal && scheduleMeetupTargetNeighbor && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-[2rem] w-full max-w-sm space-y-4 shadow-2xl text-white">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="font-extrabold text-xs uppercase tracking-wider text-indigo-400">🤝 Propose Safe Meetup</span>
              <button 
                onClick={() => {
                  setShowScheduleMeetupModal(false);
                  setScheduleMeetupTargetNeighbor(null);
                }} 
                className="text-[10px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 px-2.5 py-1.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Meeting Partner</span>
              <p className="text-sm font-bold">{scheduleMeetupTargetNeighbor.name} (@{scheduleMeetupTargetNeighbor.username})</p>
            </div>

            {/* Meeting Spot with suggested chips */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Meeting Point / Spot</span>
              <input
                type="text"
                value={scheduleMeetupPoint}
                onChange={(e) => setScheduleMeetupPoint(e.target.value)}
                placeholder="E.g., Linden Cafe, Sweet Sensation, etc."
                className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="space-y-1 pt-1">
                <span className="text-[8px] text-zinc-500 block uppercase font-bold">Suggested Safe Spots (Tap to copy):</span>
                <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto scrollbar-none">
                  {[
                    "Linden Cafe ☕",
                    "Central Gardens 🌳",
                    "Public Library 📚",
                    "Admiralty Boardwalk 🌊",
                    "Wuse Food Court 🍔"
                  ].map(spot => (
                    <button
                      key={spot}
                      type="button"
                      onClick={() => {
                        setScheduleMeetupPoint(spot);
                        triggerBeep(480, 0.05);
                      }}
                      className="text-[9px] bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 px-2 py-1 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
                    >
                      {spot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Time Input */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Scheduled Date & Time</span>
              <input
                type="datetime-local"
                value={scheduleMeetupTime}
                onChange={(e) => setScheduleMeetupTime(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              disabled={!scheduleMeetupPoint || !scheduleMeetupTime}
              onClick={async () => {
                await handleScheduleMeetup(
                  scheduleMeetupTargetNeighbor.id, 
                  scheduleMeetupPoint, 
                  scheduleMeetupTime,
                  scheduleMeetupTargetNeighbor.latitude || 0,
                  scheduleMeetupTargetNeighbor.longitude || 0
                );
                setShowScheduleMeetupModal(false);
                setScheduleMeetupTargetNeighbor(null);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl tracking-widest uppercase shadow-lg active:scale-95 transition cursor-pointer"
            >
              Propose Meetup 🚀
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🌐 SWITCHABLE APP LANGUAGE MODAL DIALOG (YORUBA, IGBO, HAUSA, PIDGIN) */}
      {/* ---------------------------------------------------- */}
      {showLanguageModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="font-extrabold text-sm text-white">🌐 Switch App Language</span>
              <button 
                onClick={() => setShowLanguageModal(false)} 
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            
            <p className="text-[10px] text-neutral-400 leading-normal">
              Select your preferred language dialo to adapt labels and settings options triggers in real-time.
            </p>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
              {[
                { code: 'english', label: '🇬🇧 English (Standard)' },
                { code: 'hausa', label: '🇳🇬 Hausa (Yaren Hausa)' },
                { code: 'igbo', label: '🇳🇬 Igbo (Asụsụ Igbo)' },
                { code: 'yoruba', label: '🇳🇬 Yoruba (Èdè Yorùbá)' },
                { code: 'pidgin', label: '🇳🇬 Pidgin (Urban Dialect)' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setAppLanguage(lang.code as any);
                    setShowLanguageModal(false);
                    setAudioFeedback(`✓ Language adapted: ${lang.label.split(' ')[1]}`);
                    setTimeout(() => setAudioFeedback(""), 3505);
                    triggerBeep(480, 0.08);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    appLanguage === lang.code 
                      ? 'bg-indigo-950/40 border-indigo-505 text-indigo-300' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                  }`}
                >
                  <span>{lang.label}</span>
                  {appLanguage === lang.code && <span className="text-indigo-400 font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🔗 SOCIAL INVITE A FRIEND REFERRAL PROXIMITY DIALOG */}
      {/* ---------------------------------------------------- */}
      {showInviteModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="font-extrabold text-sm text-white">🔗 Tell customized friend!</span>
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-normal">
              Send this custom proximity reference link to your friends in Nigeria so they can teleport onto your local radar map!
            </p>

            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between space-x-2">
              <span className="text-[11px] font-mono text-indigo-400 select-all truncate">
                {window.location.origin}/join-nearby-radar?ref={userUsername}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join-nearby-radar?ref=${userUsername}`);
                  setAudioFeedback("✓ Proximity referral link copied to clipboard!");
                  setTimeout(() => setAudioFeedback(""), 3505);
                  triggerBeep(520, 0.1);
                }}
                className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] uppercase font-mono tracking-wider transition active:scale-95 cursor-pointer flex-shrink-0"
              >
                Copy
              </button>
            </div>

            {/* Simulated social links */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-center text-[10px] font-semibold font-mono text-neutral-400">
              <div 
                onClick={() => {
                  setAudioFeedback("Redirecting to Whatsapp conversation room o...");
                  window.open(`https://api.whatsapp.com/send?text=How%20far!%20Join%20me%20on%20Nearby%20Proximity%20Radar%2520so%2520we%2520can%20connect%20and%20gist!%20Join%20here:%20${window.location.origin}/join-nearby-radar?ref=${userUsername}`);
                }}
                className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl hover:bg-emerald-950/40 cursor-pointer text-emerald-400 hover:text-emerald-300 transition"
              >
                💬 Ask on WhatsApp
              </div>
              <div 
                onClick={() => {
                  setAudioFeedback("Opening share options...");
                  if (navigator.share) {
                    navigator.share({
                      title: 'Nearby Proximity Radar',
                      text: 'Join me on Nearby Radar so we can talk and see each other on map!',
                      url: `${window.location.origin}/join-nearby-radar?ref=${userUsername}`,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(`${window.location.origin}/join-nearby-radar?ref=${userUsername}`);
                    setAudioFeedback("Link copied.");
                    setTimeout(() => setAudioFeedback(""), 3000);
                  }
                }}
                className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl hover:bg-neutral-850 cursor-pointer text-white transition font-bold animate-pulse text-center"
              >
                📲 Quick Universal Share
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🔔 PREMIUM REDESIGNED NOTIFICATIONS CENTER OVERLAY */}
      {/* ---------------------------------------------------- */}
      {showNotificationsModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="p-6 bg-[#0E1015] border border-neutral-800/80 rounded-[2.5rem] w-full max-w-sm space-y-4 max-h-[85%] overflow-hidden shadow-2xl flex flex-col font-sans"
          >
            {/* Header section with actions */}
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800/60 flex-shrink-0">
              <div className="flex items-center space-x-2 text-left">
                <Bell className="w-4 h-4 text-indigo-400" />
                <span className="font-black text-sm text-white tracking-tight">Notification Center</span>
              </div>
              <button 
                onClick={() => {
                  triggerBeep(450, 0.05);
                  setShowNotificationsModal(false);
                }}
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800/60 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-neutral-800 transition active:scale-95 font-medium"
              >
                Close
              </button>
            </div>

            {/* Quick bulk actions bar */}
            {notifications.length > 0 && (
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-neutral-400 py-1 bg-white/5 px-4 rounded-2xl border border-white/5 flex-shrink-0">
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="hover:text-emerald-400 transition font-bold cursor-pointer"
                >
                  Mark all read ✓
                </button>
                <div className="w-1 h-1 rounded-full bg-neutral-700" />
                <button
                  onClick={handleClearAllNotifications}
                  className="hover:text-red-400 transition font-bold cursor-pointer"
                >
                  Delete all ✕
                </button>
              </div>
            )}

            {/* Notifications Scrollable area grouped by Today, Yesterday, Earlier */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-left">
              {notifications.length === 0 ? (
                /* Premium Empty State */
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                      <Bell className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="space-y-1 max-w-[200px] mx-auto">
                    <p className="text-xs font-bold text-white">All clean, my neighbor!</p>
                    <p className="text-[10px] text-neutral-500 font-medium">You have no neighborhood alerts or activity notifications right now.</p>
                  </div>
                </div>
              ) : (() => {
                const grouped = getGroupedNotifications();
                
                const renderNotificationCard = (notif: AppNotification) => {
                  // Determine icon and theme color
                  let iconElement = <Bell className="w-3.5 h-3.5 text-indigo-400" />;
                  let bgIconClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                  
                  if (notif.type === 'friend_request') {
                    iconElement = <UserPlus className="w-3.5 h-3.5 text-rose-400" />;
                    bgIconClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  } else if (notif.type === 'message') {
                    iconElement = <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
                    bgIconClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  } else if (notif.type === 'meetup') {
                    iconElement = <MapPin className="w-3.5 h-3.5 text-cyan-400" />;
                    bgIconClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                  } else if (notif.type === 'rating') {
                    iconElement = <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />;
                    bgIconClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  } else if (notif.type === 'post_like') {
                    iconElement = <Heart className="w-3.5 h-3.5 text-pink-400" />;
                    bgIconClass = 'bg-pink-500/10 text-pink-400 border-pink-500/20';
                  }

                  // Relative time helper
                  const getRelativeTimeStr = (isoString?: string) => {
                    if (!isoString) return '';
                    const msec = Date.now() - new Date(isoString).getTime();
                    const secs = Math.floor(msec / 1000);
                    if (secs < 60) return 'Just now';
                    const mins = Math.floor(secs / 60);
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h ago`;
                    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  };

                  return (
                    <motion.div
                      layout
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`p-4 rounded-[1.25rem] border flex items-start justify-between space-x-3 transition duration-200 relative group overflow-hidden ${
                        notif.isUnread 
                          ? 'bg-[#141822] border-indigo-500/20 shadow-sm shadow-indigo-500/5' 
                          : 'bg-neutral-900/40 border-neutral-850'
                      }`}
                    >
                      {/* Left Side: Avatar with miniature type badge */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-750 flex items-center justify-center text-xl shadow-inner select-none">
                          {/* Locate neighbor's real emoji or display letter */}
                          {notif.senderName ? notif.senderName.substring(0, 2) : '🔔'}
                        </div>
                        {/* Type Icon Badge */}
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border shadow-sm ${bgIconClass}`}>
                          {iconElement}
                        </div>
                      </div>

                      {/* Middle: Content details */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-white leading-none tracking-tight">
                            {notif.title}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {getRelativeTimeStr(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans leading-normal line-clamp-2">
                          {notif.message}
                        </p>
                        
                        {/* Interactive Match Button if Friend request */}
                        {notif.type === 'friend_request' && (
                          <div className="pt-1.5 flex items-center space-x-2">
                            <button
                              onClick={() => {
                                triggerBeep(520, 0.05);
                                setShowNotificationsModal(false);
                                setActiveTab('chat');
                              }}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[9px] uppercase font-mono tracking-wider cursor-pointer"
                            >
                              Check requests
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Swipe / Quick Trigger Action Panel */}
                      <div className="flex flex-col space-y-1.5 shrink-0 self-center pl-1 opacity-60 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleReadNotification(notif.id, notif.isUnread)}
                          className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-indigo-400 transition cursor-pointer"
                          title={notif.isUnread ? "Mark as Read" : "Mark as Unread"}
                        >
                          <Check className={`w-3.5 h-3.5 ${notif.isUnread ? 'text-indigo-400' : 'text-neutral-500'}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-neutral-500 hover:text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  );
                };

                return (
                  <div className="space-y-4">
                    {/* TODAY SECTION */}
                    {grouped.today.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block px-1">
                          Today
                        </span>
                        <div className="space-y-2">
                          {grouped.today.map(renderNotificationCard)}
                        </div>
                      </div>
                    )}

                    {/* YESTERDAY SECTION */}
                    {grouped.yesterday.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block px-1">
                          Yesterday
                        </span>
                        <div className="space-y-2">
                          {grouped.yesterday.map(renderNotificationCard)}
                        </div>
                      </div>
                    )}

                    {/* EARLIER SECTION */}
                    {grouped.earlier.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block px-1">
                          Earlier
                        </span>
                        <div className="space-y-2">
                          {grouped.earlier.map(renderNotificationCard)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 💁‍♂️ CUSTOM HELP AND DIRECT SUPPORT ENQUIRY PORTAL */}
      {/* ---------------------------------------------------- */}
      {showHelpModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-sm space-y-4 max-h-[90%] overflow-y-auto scrollbar-thin shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
              <span className="font-extrabold text-sm text-white">💁‍♂️ Help & Support Desk</span>
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-2xl text-[11px] text-indigo-305 leading-relaxed font-sans">
              <strong>Need help?</strong><br />
              Send us a message below and we will get back to you at <strong>{currentUser?.email || "fasipelanre@gmail.com"}</strong> as soon as possible.
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">Contact Support Email</label>
                <input 
                  type="email"
                  value={helpEmail || currentUser?.email || "fasipelanre@gmail.com"}
                  onChange={(e) => setHelpEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">Category of Issue</label>
                <select 
                  value={helpCategory}
                  onChange={(e) => setHelpCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option>Location and GPS issues</option>
                  <option>Account support</option>
                  <option>Language options</option>
                  <option>Profile and photos</option>
                  <option>General enquiry</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">Describe encounter problem</label>
                <textarea 
                  rows={3}
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none leading-relaxed"
                  placeholder="Describe your issue..."
                />
              </div>
            </div>

            <button
              onClick={async () => {
                if (!helpMessage.trim()) {
                  setAudioFeedback("Please describe your issue.");
                  return;
                }
                const ticketId = `tkt-${Date.now()}`;
                try {
                  if (currentUser) {
                    const ticketRef = doc(db, 'users', currentUser.uid, 'stories', ticketId);
                    await setDoc(ticketRef, {
                      id: ticketId,
                      category: helpCategory,
                      email: helpEmail || currentUser.email || "fasipelanre@gmail.com",
                      message: helpMessage,
                      timestamp: new Date().toISOString(),
                      type: 'ticket'
                    });
                  }
                } catch (err) {
                   console.error("Error logging support ticket onto Firebase, fallback to simulation: ", err);
                }
                
                setHelpMessage("");
                setShowHelpModal(false);
                setAudioFeedback("Issue submitted. We will find a fix within 24 hours.");
                setTimeout(() => setAudioFeedback(""), 4500);
                triggerBeep(580, 0.1);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition active:scale-95 cursor-pointer font-sans"
            >
              🚀 Submit Issue for Assistance
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🔒 MUTUAL FRIENDS NEIGHBOR INSTAGRAM PROFILE DIALOG OVERLAY */}
      {/* ---------------------------------------------------- */}
      {viewingNeighborProfile && (
        <Suspense fallback={<div className="p-8 text-center text-zinc-400 font-sans text-xs">Loading Profile...</div>}>
          <PremiumProfileView 
            isOwnProfile={false}
            currentUser={currentUser}
            neighbor={neighbors.find(n => n.id === viewingNeighborProfile.id) || viewingNeighborProfile}
            onClose={() => setViewingNeighborProfile(null)}
            
            userDisplayName={userDisplayName}
            setUserDisplayName={setUserDisplayName}
            userUsername={userUsername}
            setUserUsername={setUserUsername}
            userBio={userBio}
            setUserBio={setUserBio}
            userWebsite={userWebsite}
            setUserWebsite={setUserWebsite}
            userAgeRange={userAgeRange}
            setUserAgeRange={setUserAgeRange}
            userGender={userGender}
            setUserGender={setUserGender}
            userInterests={userInterests}
            setUserInterests={setUserInterests}
            customProfilePhoto={customProfilePhoto}
            setCustomProfilePhoto={setCustomProfilePhoto}
            userStatusText={userStatusText}
            setUserStatusText={setUserStatusText}
            userPosts={neighborPosts}
            userHighlights={neighborHighlights}
            
            friendIds={friendIds}
            sentFriendRequestIds={sentFriendRequestIds}
            pendingFriendRequests={pendingFriendRequests}
            handleAcceptFriendRequest={handleAcceptFriendRequest}
            handleAddNewFriend={handleAddNewFriend}
            
            meetups={meetups}
            meetupRatings={meetupRatings}
            handleRateNeighbor={handleRateNeighbor}
            handleReportNeighbor={handleReportNeighbor}
            handleCancelMeetup={handleCancelMeetup}
            setScheduleMeetupTargetNeighbor={setScheduleMeetupTargetNeighbor}
            setScheduleMeetupPoint={setScheduleMeetupPoint}
            setScheduleMeetupTime={setScheduleMeetupTime}
            setShowScheduleMeetupModal={setShowScheduleMeetupModal}
            
            showEditProfileModal={showEditProfileModal}
            setShowEditProfileModal={setShowEditProfileModal}
            triggerBeep={triggerBeep}
            setAudioFeedback={setAudioFeedback}
            appTheme={appTheme}
            neighbors={neighbors}
            
            handleGalleryUploadForProfilePic={handleGalleryUploadForProfilePic}
            profileFileRef={profileFileRef}
            postFileRef={postFileRef}
            handleGalleryUploadForPost={handleGalleryUploadForPost}
            setUploadMode={setUploadMode}
            setViewingUserPostDetail={setViewingUserPostDetail}
            setShowFriendsModal={setShowFriendsModal}
            logoutUser={logoutUser}
          />
        </Suspense>
      )}

      {viewingNeighborProfile && false && ((profileParam) => {
        const currentNeighbor = neighbors.find(n => n.id === profileParam.id) || profileParam;
        const isAFriend = (Array.isArray(friendIds) ? friendIds : []).includes(currentNeighbor.id) || currentNeighbor.isFriend || (Array.isArray(currentNeighbor.friendIds) && currentNeighbor.friendIds.includes(currentUser?.uid));
        const viewingNeighborProfile = currentNeighbor; // Shadowing outer state for real-time updates
        
        // Custom lookups for neighbor profile posts
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

        const profileData = getNeighborProfileData(viewingNeighborProfile.id, viewingNeighborProfile.name);
        
        return (
          <div className="absolute inset-0 bg-neutral-950 z-50 flex flex-col justify-between overflow-hidden animate-fade-in text-white font-sans">
            {/* Header */}
            <div className="px-4 py-3.5 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center">
              <button 
                onClick={() => setViewingNeighborProfile(null)}
                className="text-xs bg-neutral-800 font-bold px-3 py-1.5 rounded-xl hover:bg-neutral-700 active:scale-95 transition cursor-pointer"
              >
                ← Back to Chat
              </button>
              <span className="font-extrabold text-xs tracking-tight font-mono text-neutral-400">
                @{viewingNeighborProfile.username}
              </span>
              <div className="w-[80px]" />
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 relative scrollbar-thin">
              
              {/* SECTION 1: PHOTO */}
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-neutral-800 flex items-center justify-center bg-neutral-900 shadow-xl transition-transform hover:scale-105 duration-300">
                  {viewingNeighborProfile.customProfilePhoto ? (
                    <img src={viewingNeighborProfile.customProfilePhoto} alt={viewingNeighborProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${viewingNeighborProfile.avatarColor} flex items-center justify-center text-4xl`}>
                      <span>{viewingNeighborProfile.avatarEmoji}</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-neutral-950 animate-pulse" title="Online now" />
                </div>
              </div>

              {/* SECTION 2: NAME */}
              <div className="text-center space-y-1.5">
                <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-1">
                  <h3 className="font-extrabold text-lg text-white tracking-tight">{viewingNeighborProfile.name}</h3>

                  {/* Trusted User Badge */}
                  <span className="inline-flex items-center text-[9px] bg-emerald-500/20 border border-emerald-500/35 text-[#25D366] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider space-x-1">
                    <span>🤝</span>
                    <span>Trusted ({viewingNeighborProfile.meetupsCompleted || 0} meetups)</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono">@{viewingNeighborProfile.username}</p>
              </div>

              {/* SECTION 3: DISTANCE */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📍</span>
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">Local Distance</span>
                    <span className="text-xs font-extrabold text-emerald-400">
                      {(() => {
                        const meters = viewingNeighborProfile.distanceMeters;
                        if (meters <= 100) return '0–100m (street level)';
                        if (meters <= 500) return '100–500m (neighborhood)';
                        if (meters <= 1000) return '500m–1km (Area Level)';
                        return 'Over 1km (State Level)';
                      })()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">Local Block</span>
                  <span className="text-xs font-bold text-zinc-300 font-mono max-w-[150px] block truncate">{viewingNeighborProfile.streetName}</span>
                </div>
              </div>

              {/* SECTION 4: TRUST SCORE & RATINGS */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Trust Score Rating</span>
                  <div className="flex items-center space-x-1.5 text-amber-400">
                    <span className="text-sm font-black">
                      {"★".repeat(Math.round(viewingNeighborProfile.trustScore !== undefined ? viewingNeighborProfile.trustScore : 5.0))}
                      {"☆".repeat(5 - Math.round(viewingNeighborProfile.trustScore !== undefined ? viewingNeighborProfile.trustScore : 5.0))}
                    </span>
                    <span className="text-xs font-black font-mono text-zinc-200 bg-neutral-850 px-2 py-0.5 rounded-lg border border-neutral-800">
                      {(viewingNeighborProfile.trustScore !== undefined ? viewingNeighborProfile.trustScore : 5.0).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-850 flex flex-col items-center justify-center space-y-1 text-center">
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    🤝 {viewingNeighborProfile.meetupsCompleted || 0} Trusted Meetups
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Based on {viewingNeighborProfile.ratingsCount || 0} permanent ratings
                  </span>
                </div>
                
                <div className="flex items-center justify-between bg-neutral-950/20 p-2.5 rounded-xl border border-neutral-850/50">
                  <span className="text-[10px] text-zinc-400 font-bold">Tap stars to rate:</span>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const score = viewingNeighborProfile.trustScore !== undefined ? viewingNeighborProfile.trustScore : 5.0;
                      const starValue = idx + 1;
                      const isActive = starValue <= Math.round(score);
                      return (
                        <button
                          key={idx}
                          id={`rate-star-${starValue}`}
                          onClick={() => {
                            handleRateNeighbor(viewingNeighborProfile.id, starValue);
                          }}
                          className={`text-lg transition-transform hover:scale-125 focus:scale-125 active:scale-95 cursor-pointer ${
                            isActive ? "text-amber-400 font-black" : "text-zinc-800"
                          }`}
                          title={`Rate ${starValue} Stars`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 5: INTENT TAGS */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">Intent Tags / Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingNeighborProfile.interests || ['Tech Partner', 'Street Food']).map((interest) => (
                    <span 
                      key={interest} 
                      className="text-[10px] font-extrabold bg-indigo-950/30 border border-indigo-900/40 text-indigo-300 px-3 py-1 rounded-xl font-mono shadow-sm"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* SECTION 6: SHORT BIO */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">Short Bio</span>
                <div className="bg-neutral-900/40 border border-neutral-850 p-3.5 rounded-2xl">
                  <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {viewingNeighborProfile.bio || "Let's connect."}
                  </p>
                </div>
              </div>

              {/* SECTION 7: MEETUP & TRUST CENTER */}
              <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-mono block">Meetups Completed</span>
                    <span className="text-sm font-black text-white">{viewingNeighborProfile.meetupsCompleted || 0} safe meetups</span>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-lg border border-emerald-500/20">
                    🤝
                  </div>
                </div>

                {/* Meetup scheduler and tracking status */}
                {(() => {
                  const activeMeetup = meetups.find(m => 
                    m.status === 'scheduled' && 
                    ((m.hostUID === currentUser?.uid && m.participantUID === viewingNeighborProfile.id) ||
                     (m.participantUID === currentUser?.uid && m.hostUID === viewingNeighborProfile.id))
                  );

                  const reviews = meetupRatings.filter(r => r.receiverUID === viewingNeighborProfile.id);

                  return (
                    <div className="space-y-3 pt-2 border-t border-neutral-800/40">
                      {activeMeetup ? (
                        <div className="bg-neutral-900/50 p-3 rounded-xl border border-indigo-500/30 space-y-2.5 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest font-mono animate-pulse">● Active Scheduled Meetup</span>
                            <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">Pending</span>
                          </div>
                          
                          <div className="space-y-1 text-xs">
                            <p className="text-zinc-300"><span className="text-zinc-500 font-medium">📍 Meeting Point:</span> <strong className="text-white font-semibold">{activeMeetup.meetingPoint}</strong></p>
                            <p className="text-zinc-300"><span className="text-zinc-500 font-medium">📅 Time:</span> <strong className="text-white font-semibold">{new Date(activeMeetup.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong></p>
                          </div>

                          {showInlineRatingForm && ratingFormMeetupId === activeMeetup.meetupId ? (
                            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-3 mt-2 animate-fade-in">
                              <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Complete & Review Meetup</h4>
                              <div className="space-y-1">
                                <span className="text-[9px] text-zinc-500 block">Select Trust Rating:</span>
                                <div className="flex items-center space-x-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setActiveRatingStars(star)}
                                      className={`text-2xl transition hover:scale-110 active:scale-95 ${star <= activeRatingStars ? 'text-amber-400 font-bold' : 'text-neutral-800'}`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] text-zinc-500 block">Written Review:</span>
                                <textarea
                                  value={ratingReviewText}
                                  onChange={(e) => setRatingReviewText(e.target.value)}
                                  placeholder="E.g., Wonderful conversation at the coffee spot. Very safe and helpful partner!"
                                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-zinc-650"
                                  rows={2}
                                />
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={async () => {
                                    await handleRateNeighbor(viewingNeighborProfile.id, activeRatingStars, ratingReviewText, activeMeetup.meetupId);
                                    setShowInlineRatingForm(false);
                                    setRatingReviewText("");
                                    setRatingFormMeetupId(null);
                                  }}
                                  className="flex-1 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-neutral-950 font-black rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                                >
                                  Submit & Close
                                </button>
                                <button
                                  onClick={() => {
                                    setShowInlineRatingForm(false);
                                    setRatingFormMeetupId(null);
                                  }}
                                  className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-zinc-400 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex space-x-2 pt-1">
                              <button
                                onClick={() => {
                                  setRatingFormMeetupId(activeMeetup.meetupId);
                                  setActiveRatingStars(5);
                                  setRatingReviewText("");
                                  setShowInlineRatingForm(true);
                                }}
                                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                Mark Completed 🤝
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to cancel this meetup?")) {
                                    handleCancelMeetup(activeMeetup.meetupId);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {isAFriend && (
                            <button
                              onClick={() => {
                                setScheduleMeetupTargetNeighbor(viewingNeighborProfile);
                                setScheduleMeetupPoint(viewingNeighborProfile.streetName || "Safe Neighborhood Spot");
                                setScheduleMeetupTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16)); // Default 1 hour from now
                                setShowScheduleMeetupModal(true);
                              }}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <span>📅 Schedule Safe Meetup</span>
                            </button>
                          )}

                          {isAFriend && !viewingNeighborProfile.meetupHappened && (
                            <div className="bg-neutral-950/20 p-2.5 rounded-xl border border-neutral-850/50 flex flex-col space-y-2 text-left">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-zinc-400 font-bold">Quick Rating (direct logging):</span>
                                <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">Direct Mode</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  return (
                                    <button
                                      key={star}
                                      onClick={async () => {
                                        const comment = prompt(`Give feedback review for ${viewingNeighborProfile.name}:`, "Great neighbor, very polite and trustworthy.");
                                        if (comment !== null) {
                                          await handleRateNeighbor(viewingNeighborProfile.id, star, comment);
                                        }
                                      }}
                                      className="text-lg transition hover:scale-125 focus:scale-125 text-amber-400"
                                      title={`Rate ${star} Stars Directly`}
                                    >
                                      ★
                                    </button>
                                  );
                                })}
                                <span className="text-[8px] text-zinc-500 font-mono">Click a star & review</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Neighborhood Reviews History List */}
                      {reviews.length > 0 && (
                        <div className="pt-2 space-y-1.5 border-t border-neutral-800/40 text-left">
                          <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold block font-mono">Neighborhood Reviews ({reviews.length})</span>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                            {reviews.map(rev => (
                              <div key={rev.ratingId} className="bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-850/50 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] text-indigo-400 font-mono font-bold">Verified Neighbor</span>
                                  <span className="text-amber-400 text-[10px] font-black">{"★".repeat(rev.stars)}</span>
                                </div>
                                <p className="text-[10px] text-zinc-300 italic leading-snug">"{rev.review}"</p>
                                <span className="text-[8px] text-zinc-500 font-mono block text-right">{new Date(rev.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 8: REPORTS */}
              <div className="bg-neutral-900/60 border border-neutral-800/80 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-red-500 uppercase tracking-widest font-mono block">Reports / Complaints</span>
                    <span className="text-xs font-bold text-zinc-200">
                      {viewingNeighborProfile.reportsCount || 0} reports
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-850">
                    Threshold: 10
                  </span>
                </div>

                {/* Progress bar to Ban */}
                <div className="space-y-1">
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div 
                      className="bg-red-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((viewingNeighborProfile.reportsCount || 0) / 10) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500">
                    <span>0 reports</span>
                    <span className="text-red-400 font-bold">10 = AUTOMATIC BAN SYSTEM</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <p className="text-[9px] text-zinc-400 leading-tight max-w-[200px]">
                    Immediate action is taken for harassment or unsafe behavior.
                  </p>
                  <button
                    onClick={() => {
                      const reason = prompt("Describe the reason for reporting:");
                      if (reason) {
                        handleReportNeighbor(viewingNeighborProfile.id, reason);
                      }
                    }}
                    className="py-1.5 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-extrabold transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    ⚠️ Report User
                  </button>
                </div>
              </div>

              {/* Grid content conditional - Mutual friends only */}
              {isAFriend ? (
                <>
                  {/* Share Profile button */}
                  <button
                    onClick={() => {
                      const shareLink = `${window.location.origin}/user/${viewingNeighborProfile.username}`;
                      navigator.clipboard.writeText(shareLink);
                      setAudioFeedback(`✓ Link copied for ${viewingNeighborProfile.name}!`);
                      setTimeout(() => setAudioFeedback(""), 3000);
                      triggerBeep(520, 0.05);
                    }}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-neutral-200 text-xs font-bold transition cursor-pointer"
                  >
                    Share Proximity Profile grid
                  </button>

                  {/* Highlights */}
                  <div className="space-y-1.5 pt-1.5">
                    <h4 className="text-[10px] uppercase font-sans font-extrabold tracking-wider text-neutral-500">Highlights</h4>
                    <div className="flex space-x-4 overflow-x-auto py-1 scrollbar-none">
                      {neighborHighlights.map(hl => (
                        <div key={hl.id} className="flex flex-col items-center flex-shrink-0">
                          <div className="w-14 h-14 rounded-full p-[1px] border border-neutral-800 overflow-hidden bg-neutral-950">
                            <img src={hl.mediaUrl} alt={hl.name} className="w-full h-full rounded-full object-cover" />
                          </div>
                          <span className="text-[10px] font-sans font-semibold text-neutral-3.5 mt-1 tracking-tight">{hl.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Posts Grid */}
                  <div className="space-y-2.5 pt-3 border-t border-neutral-900">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono text-neutral-400 block mb-1">
                      Personal Grid Feed ({neighborPosts.length})
                    </span>

                    <div className="grid grid-cols-3 gap-1">
                      {neighborPosts.map(post => (
                        <div 
                          key={post.id} 
                          onClick={() => {
                            setViewingUserPostDetail(post);
                            triggerBeep(450, 0.05);
                          }}
                          className="aspect-square bg-neutral-900 relative overflow-hidden rounded-lg cursor-pointer group"
                        >
                          <img src={post.mediaUrl} alt="post item" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Locked Profile overlay screen - Gamified and interactive! */
                <div className="pt-6 pb-12 px-4 border border-indigo-500/10 bg-neutral-900/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                  <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-3xl animate-pulse">
                    🔒
                  </div>
                  <div className="space-y-1.5 max-w-[270px]">
                    <h4 className="font-bold text-sm text-white">Profile Locked</h4>
                    <p className="text-xs text-neutral-400 leading-normal">
                      Only mutual friends can view each other's full profiles. Add {viewingNeighborProfile.name} to unlock.
                    </p>
                  </div>

                  {sentFriendRequestIds.includes(viewingNeighborProfile.id) ? (
                    <button
                      onClick={() => {
                        handleAddNewFriend(viewingNeighborProfile.id);
                      }}
                      className="py-2.5 px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl tracking-wide uppercase transition active:scale-95 cursor-pointer shadow-md"
                    >
                      Request sent
                    </button>
                  ) : pendingFriendRequests.includes(viewingNeighborProfile.id) ? (
                    <button
                      onClick={() => {
                        handleAcceptFriendRequest(viewingNeighborProfile.id);
                      }}
                      className="py-2.5 px-5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl tracking-wide uppercase transition active:scale-95 cursor-pointer shadow-md"
                    >
                      Accept Request
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleAddNewFriend(viewingNeighborProfile.id);
                        triggerBeep(520, 0.12);
                      }}
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl tracking-wide uppercase transition active:scale-95 cursor-pointer shadow-md"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })(viewingNeighborProfile)}

      {/* ---------------------------------------------------- */}
      {/* 🔑 ACCOUNT, PRIVACY & CHATS FUNCTIONAL CONFIGURATION OVERLAYS */}
      {/* ---------------------------------------------------- */}
      {showAccountModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="font-extrabold text-sm text-white">🔑 Account Security Center</span>
              <button 
                onClick={() => setShowAccountModal(false)} 
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-3.5 font-sans">
              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-0.5">Telephone Registration Number</label>
                <input 
                  type="text" 
                  value={userTelephone} 
                  onChange={(e) => setUserTelephone(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" 
                />
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 space-y-2 leading-relaxed">
                <p>Connected via Google Cloud Authentication</p>
                <p className="text-indigo-400 font-mono text-[10px]">Email: {currentUser?.email || "fasipelanre@gmail.com"}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowAccountModal(false);
                setAudioFeedback("Account settings saved.");
                setTimeout(() => setAudioFeedback(""), 3000);
                triggerBeep(450, 0.05);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition active:scale-95 font-sans"
            >
              Save Account Preferences
            </button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="font-extrabold text-sm text-white">🔒 Privacy Center</span>
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">Disappearing messaging history</label>
                <select 
                  value={privacyDisappearing} 
                  onChange={(e) => setPrivacyDisappearing(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option>Off</option>
                  <option>24 Hours</option>
                  <option>7 Days</option>
                </select>
              </div>
              <div 
                onClick={() => {
                  setIsUserVisibleOnRadar(prev => !prev);
                  setAudioFeedback(`Radar invisibility toggled!`);
                  setTimeout(() => setAudioFeedback(""), 2000);
                  triggerBeep(450, 0.05);
                }}
                className="p-3 bg-neutral-950 border border-neutral-800 hover:border-indigo-500 rounded-xl text-xs font-semibold text-neutral-200 cursor-pointer flex justify-between items-center transition"
              >
                <span>Incognito Invisibility Mode</span>
                <span className={isUserVisibleOnRadar ? "text-rose-450 font-bold" : "text-green-500 font-bold"}>
                  {isUserVisibleOnRadar ? "OFF" : "ON 🕵️‍♂️"}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setShowPrivacyModal(false)} 
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition active:scale-95"
            >
              Apply Privacy Options
            </button>
          </div>
        </div>
      )}

      {showChatsConfigModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="font-extrabold text-sm text-white">💬 Chats Customizer</span>
              <button 
                onClick={() => setShowChatsConfigModal(false)} 
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2 py-1 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 leading-normal">
              Custom visual styles allows personalization of your private Chat DMs thread. Try changing wallpaper!
            </p>
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">DM Wallpapers background</label>
                <select 
                  value={customChatBg} 
                  onChange={(e) => setCustomChatBg(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="cosmic">Cosmic Slate Dark Theme</option>
                  <option value="sunset">Lagos Twilight Purple Sunset</option>
                  <option value="mint">Kano Rainforest Green Mint</option>
                  <option value="matrix">Matrix Cyber Punk</option>
                  <option value="default">Default Neutral Charcoal</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">DM Typographic Font style</label>
                <select 
                  value={customChatFont} 
                  onChange={(e) => setCustomChatFont(e.target.value)} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="default">Standard Elegant Inter Sans</option>
                  <option value="mono">JetBrains Mono Cyber</option>
                  <option value="serif">Ibadan Traditional Serif</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => setShowChatsConfigModal(false)} 
              className="w-full py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition active:scale-95 font-sans"
            >
              ✓ Save Layout Design
            </button>
          </div>
        </div>
      )}

      {aboutDetailModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
          <div className={`p-6 rounded-[28px] border w-full max-w-sm space-y-4 shadow-2xl transition-all ${
            appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-zinc-100' : 'bg-white border-stone-200 text-neutral-900'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800/40">
              <span className="font-black text-sm tracking-tight">
                {aboutDetailModal === 'privacy' && '🔒 Privacy & Node Policy'}
                {aboutDetailModal === 'terms' && '📜 Terms of Grid Usage'}
                {aboutDetailModal === 'guidelines' && '🛡️ Mesh Guidelines'}
              </span>
              <button 
                onClick={() => {
                  triggerBeep(450, 0.05);
                  setAboutDetailModal(null);
                }} 
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                  appTheme === 'dark' ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Close
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto text-[11px] leading-relaxed text-neutral-400 space-y-3 font-sans pr-1">
              {aboutDetailModal === 'privacy' && (
                <>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">1. Proximity Privacy Zero-Knowledge</p>
                  <p>Your coordinates are calculated purely client-side on your device. Only hashed approximations are broadcasted to regional mesh nodes to match nearby neighbors.</p>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">2. Disappearing Chat Buffers</p>
                  <p>Private conversations are stored locally in Firestore with configurable disappearing timelines. Once the timeline is triggered, records are permanently purged.</p>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">3. Absolute Ghost Mode</p>
                  <p>Enabling Ghost Mode completely unpublishes your active beacon from regional maps while allowing you to navigate nearby spots privately.</p>
                </>
              )}
              {aboutDetailModal === 'terms' && (
                <>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">1. Local Connection Authorization</p>
                  <p>By connecting with neighbors, you agree to engage respectfully. Nearby does not accept harassment, spoofing grid coordinates, or malicious mapping reports.</p>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">2. Real-World Safe Meetups</p>
                  <p>Scheduling physical meetups is done entirely at your discretion. Users must respect meetups safety recommendations (daylight, public spots, crowd areas).</p>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">3. Trust Verification Score</p>
                  <p>Your Trust rating score (out of 5.0) is dynamic and based on real peer ratings and safe meeting feedbacks. Artificially inflating ratings is forbidden.</p>
                </>
              )}
              {aboutDetailModal === 'guidelines' && (
                <>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">1. Golden Rule of Proximity</p>
                  <p>Nearby is built for genuine, trusted physical connections. Be helpful, clear, and safe. Do not treat nearby like bulk broadcasting channels.</p>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">2. Transparent Profile Identities</p>
                  <p>Keep your bio, age range, and interests honest. High trust scores are awarded to profiles that show authentic personality and community contributions.</p>
                  <p className="font-bold text-xs text-neutral-300 dark:text-zinc-200">3. Respect Block & Ghost Flags</p>
                  <p>If a neighbor chooses to turn off visibility or disconnect, respect their privacy boundaries. Respect block triggers and disappearing DM logs.</p>
                </>
              )}
            </div>

            <button 
              onClick={() => {
                triggerBeep(450, 0.05);
                setAboutDetailModal(null);
              }} 
              className="w-full py-2.5 bg-[#0F8A5F] hover:bg-[#0c704d] text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
            >
              Understand & Agree
            </button>
          </div>
        </div>
      )}

      {/* DOUBLE CONFIRMATION DELETE PROFILE POPUP */}
      {confirmDeleteAccount && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
          <div className={`p-6 rounded-[28px] border border-red-900/30 w-full max-w-sm space-y-4 shadow-2xl text-left bg-gradient-to-br ${
            appTheme === 'dark' ? 'from-neutral-950 to-neutral-900' : 'from-red-50/20 to-white'
          }`}>
            <div className="flex items-center space-x-2 text-red-500 pb-2 border-b border-red-950/20">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
              <span className="font-black text-sm tracking-tight">Irreversible Deletion</span>
            </div>

            <p className="text-xs font-bold text-neutral-200 dark:text-zinc-100">
              Are you absolutely sure you want to delete your Nearby account?
            </p>

            <p className="text-[10px] text-neutral-400 leading-relaxed">
              All your connection histories, direct messages, active safety star rating scores, and local grid credentials will be completely erased from the local Firestore nodes. This action cannot be undone.
            </p>

            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => {
                  triggerBeep(420, 0.05);
                  setConfirmDeleteAccount(false);
                }}
                className={`py-2.5 text-xs font-bold rounded-xl border cursor-pointer transition active:scale-95 text-center ${
                  appTheme === 'dark' ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750' : 'bg-neutral-100 border-stone-200 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                No, Keep My Profile
              </button>

              <button
                onClick={() => {
                  triggerBeep(300, 0.2);
                  setConfirmDeleteAccount(false);
                  logoutUser();
                  setAudioFeedback("Profile deleted from grid nodes.");
                  setTimeout(() => setAudioFeedback(""), 3000);
                }}
                className="py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl text-center cursor-pointer transition active:scale-95 shadow-lg"
              >
                Yes, Delete My Account Permanent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PERSONAL FRIENDS MODAL                               */}
      {/* ---------------------------------------------------- */}
      {showFriendsModal && (() => {
        const safeFriendIds = Array.isArray(friendIds) ? friendIds : [];
        return (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5">
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-sm space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <span className="font-display font-medium text-white text-sm flex items-center space-x-1.5">
                  <span className="text-electric-blue text-base">👥</span>
                  <span>Your Friends List ({safeFriendIds.length})</span>
                </span>
                <button 
                  onClick={() => setShowFriendsModal(false)}
                  className="text-xs text-muted-silver hover:text-white bg-neutral-800 hover:bg-neutral-750 px-2.5 py-1 rounded-xl cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>

              <p className="text-[11px] text-muted-silver leading-normal font-sans">
                These are your mutual high-priority connections within trekking distance in Yaba grid.
              </p>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                {safeFriendIds.length === 0 ? (
                  <p className="text-center text-xs text-neutral-500 py-6 font-mono">No friends added yet.</p>
                ) : (
                  safeFriendIds.map(fid => {
                    const friend = neighbors.find(n => n.id === fid);
                    if (!friend) return null;
                    return (
                      <div key={fid} className="flex items-center justify-between p-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full ${friend.avatarColor} flex items-center justify-center text-sm`}>
                            <span>{friend.avatarEmoji}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{friend.name}</span>
                            <span className="text-[10px] text-muted-silver">{friend.streetName}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setFriendIds(prev => (Array.isArray(prev) ? prev : []).filter(p => p !== fid));
                            triggerBeep(320, 0.1);
                          }}
                          className="text-[10px] text-rose-450 hover:underline px-2 py-1 font-mono transition"
                        >
                          Disconnect 💔
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <button
                onClick={() => setShowFriendsModal(false)}
                className="w-full py-2.5 bg-electric-blue hover:bg-electric-blue/90 text-white font-sans text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done Checking
              </button>
            </div>
          </div>
        );
      })()}

      {/* ---------------------------------------------------- */}
      {/* NEIGHBOR FRIENDS MODAL (Check & Connect)             */}
      {/* ---------------------------------------------------- */}
      {showNeighborFriendsModal && (() => {
        const targetNeighbor = neighbors.find(n => n.id === showNeighborFriendsModal);
        if (!targetNeighbor) return null;

        // Custom list of virtual friends for this neighbor to connect with
        const sourceFriends = targetNeighbor.id === 'nb-1' 
          ? ['nb-2', 'nb-3', 'nb-4'] 
          : targetNeighbor.id === 'nb-2' 
            ? ['nb-1', 'nb-3', 'nb-4'] 
            : ['nb-1', 'nb-2'];

        return (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5">
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-sm space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{targetNeighbor.avatarEmoji}</span>
                  <span className="font-display font-medium text-white text-sm">
                    {targetNeighbor.name}'s Friends ({sourceFriends.length})
                  </span>
                </div>
                <button 
                  onClick={() => setShowNeighborFriendsModal(null)}
                  className="text-xs text-muted-silver hover:text-white bg-neutral-800 hover:bg-neutral-750 px-2.5 py-1 rounded-xl cursor-pointer transition"
                >
                  Close
                </button>
              </div>

              <p className="text-[11px] text-muted-silver leading-normal font-sans">
                You can check {targetNeighbor.name}'s connections and click <b>Connect</b> to add them to your own list!
              </p>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                {sourceFriends.map(fid => {
                  const possibleFriend = neighbors.find(n => n.id === fid);
                  if (!possibleFriend) return null;
                  const isAlreadyMyFriend = (Array.isArray(friendIds) ? friendIds : []).includes(fid);

                  return (
                    <div key={fid} className="flex items-center justify-between p-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-full ${possibleFriend.avatarColor} flex items-center justify-center text-sm`}>
                          <span>{possibleFriend.avatarEmoji}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{possibleFriend.name}</span>
                          <span className="text-[10px] text-muted-silver">{possibleFriend.streetName}</span>
                        </div>
                      </div>

                      {isAlreadyMyFriend ? (
                        <span className="text-[9px] text-green-400 font-mono font-bold bg-green-500/10 px-2 py-0.5 rounded-lg">
                          Connected ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setFriendIds(prev => [...(Array.isArray(prev) ? prev : []), fid]);
                            triggerBeep(490, 0.12);
                            setAudioFeedback(`Connected with ${possibleFriend.name}!`);
                            setTimeout(() => setAudioFeedback(""), 2000);
                          }}
                          className="bg-electric-blue hover:bg-electric-blue/90 text-[10px] text-white px-2.5 py-1 rounded-lg font-mono font-bold transition duration-200"
                        >
                          Connect ➕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowNeighborFriendsModal(null)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white font-sans text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        );
      })()}

      {/* 📸 FULL INSTAGRAM POST DETAIL VIEW & REMOVAL / CAPTION EDIT MODAL */}
      {viewingUserPostDetail && (
        <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md z-50 flex flex-col justify-between overflow-hidden text-white font-sans animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3.5 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center">
            <button 
              onClick={() => setViewingUserPostDetail(null)}
              className="text-xs bg-neutral-800 font-bold px-3 py-1.5 rounded-xl hover:bg-neutral-700 active:scale-95 transition cursor-pointer"
            >
              ← Back
            </button>
            <span className="font-extrabold text-xs tracking-tight font-mono text-neutral-400">
              Media Coordinates Detail
            </span>
            <div className="w-[50px]" />
          </div>

          {/* Center media viewer */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-neutral-950 scrollbar-none overflow-y-auto w-full">
            <div className="w-full max-w-sm rounded-[2.5rem] overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl relative">
              <div className="aspect-square bg-neutral-950">
                <img 
                  src={viewingUserPostDetail.mediaUrl} 
                  alt="selected visual coordinate" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Information body with action lines */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start text-xs font-sans font-medium text-neutral-400">
                  <span>Uploaded {viewingUserPostDetail.timestamp || 'Just now'}</span>
                  <span className="uppercase text-indigo-400 font-bold">{viewingUserPostDetail.type || 'IMAGE'}</span>
                </div>

                {/* Edit Caption Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans font-bold tracking-wider text-muted-silver uppercase">Caption / Description</label>
                  <textarea
                    value={viewingUserPostDetail.caption || ''}
                    onChange={(e) => {
                      const newCap = e.target.value;
                      setViewingUserPostDetail(prev => prev ? { ...prev, caption: newCap } : null);
                    }}
                    rows={2}
                    placeholder="Provide description o..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white focus:outline-none resize-none font-sans"
                  />
                </div>

                {/* Interactive Controls - Edit Action & Delete Action */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1.5">
                  {/* EDIT/SAVE BUTTON */}
                  <button
                    onClick={async () => {
                      const fUser = auth.currentUser;
                      if (fUser) {
                        try {
                          const postRef = doc(db, 'users', fUser.uid, 'posts', viewingUserPostDetail.id);
                          await setDoc(postRef, {
                            caption: viewingUserPostDetail.caption || ''
                          }, { merge: true });
                          setAudioFeedback("Saved.");
                        } catch (err) {
                          console.error("Save description error:", err);
                          setAudioFeedback("Couldn't save. Try again.");
                        }
                      } else {
                        // Fallback state update for offline prototype testing too
                        setUserPosts(prev => prev.map(p => p.id === viewingUserPostDetail.id ? { ...p, caption: viewingUserPostDetail.caption } : p));
                        setAudioFeedback("Caption updated.");
                      }
                      setTimeout(() => setAudioFeedback(""), 3500);
                      triggerBeep(520, 0.05);
                    }}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer active:scale-95 text-center flex items-center justify-center space-x-1"
                  >
                    <span>Save Changes</span>
                  </button>

                  {/* DESTRUCTION / REMOVE BUTTON */}
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this post?")) return;
                      const fUser = auth.currentUser;
                      if (fUser) {
                        try {
                          const postRef = doc(db, 'users', fUser.uid, 'posts', viewingUserPostDetail.id);
                          await deleteDoc(postRef);
                          setAudioFeedback("Post deleted.");
                        } catch (err) {
                          console.error("Delete post error:", err);
                          setAudioFeedback("Couldn't delete post.");
                        }
                      } else {
                        setUserPosts(prev => prev.filter(p => p.id !== viewingUserPostDetail.id));
                        setAudioFeedback("Post deleted.");
                      }
                      setViewingUserPostDetail(null);
                      setTimeout(() => setAudioFeedback(""), 3500);
                      triggerBeep(320, 0.1);
                    }}
                    className="py-2.5 bg-red-650 hover:bg-neutral-800 border border-neutral-700 text-red-400 rounded-xl transition cursor-pointer active:scale-95 text-center flex items-center justify-center space-x-1"
                  >
                    <span>Delete Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ↩ WhatsApp Forward picker modal */}
      {showForwardModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-sm space-y-4 shadow-2xl text-white">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="font-display font-medium text-sm flex items-center space-x-1.5">
                <span className="text-[#25D366] text-base">↩</span>
                <span>Forward Message to...</span>
              </span>
              <button 
                onClick={() => {
                  setShowForwardModal(null);
                  triggerBeep(320, 0.05);
                }} 
                className="text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 px-2.5 py-1 rounded-xl cursor-pointer transition"
              >
                Close
              </button>
            </div>
            
            <p className="text-[11px] text-zinc-400 leading-normal font-sans">
              Choose a friend or group from your list to forward this message.
            </p>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
              {neighbors.map((nb) => (
                <div key={nb.id} className="flex items-center justify-between p-2.5 bg-neutral-950/70 rounded-xl border border-neutral-800/60">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-full ${nb.avatarColor} flex items-center justify-center text-sm`}>
                      <span>{nb.avatarEmoji}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{nb.name}</span>
                      <span className="text-[10px] text-zinc-400">{nb.isGroup ? 'Group Conversation' : 'Buddy'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Trigger upgraded Forward message logic on destination neighbor
                      const contentText = showForwardModal.text || "";
                      const type = showForwardModal.type || 'text';
                      const mediaUrl = showForwardModal.mediaUrl || undefined;
                      const fileName = showForwardModal.fileName || undefined;
                      const fileSize = showForwardModal.fileSize || undefined;
                      const audioDurationSec = showForwardModal.audioDurationSec || undefined;

                      // Trigger forward
                      setSelectedNeighbor(nb);
                      
                      // Run in timeout so selected neighbor is active context
                      setTimeout(() => {
                        const currentUid = currentUser?.uid || 'user';
                        const newMsgId = `msg-${Date.now()}`;
                        const payload: DirectMessage = {
                          id: newMsgId,
                          senderId: currentUid,
                          receiverId: nb.id,
                          text: contentText,
                          type: type as any,
                          mediaUrl: mediaUrl,
                          fileName: fileName,
                          fileSize: fileSize,
                          audioDurationSec: audioDurationSec,
                          timestamp: new Date().toISOString(),
                          isUnread: true,
                          isForwarded: true,
                          status: 'sent',
                          reactions: []
                        };

                        _setChatMessages(prev => ({
                          ...prev,
                          [nb.id]: [...(prev[nb.id] || []), payload]
                        }));

                        // Trigger companion AI simulation response if forwarded to AI
                        if (nb.id === 'nb-myai') {
                          setIsAiTyping(true);
                          setTimeout(() => {
                            setIsAiTyping(false);
                            const response: DirectMessage = {
                              id: `msg-${Date.now() + 1}`,
                              senderId: 'nb-myai',
                              receiverId: currentUid,
                              text: "Thanks for forwarding this. That's very helpful detail about our neighborhood.",
                              type: 'text',
                              timestamp: new Date().toISOString(),
                              isUnread: true,
                              status: 'read'
                            };
                            _setChatMessages(prev => ({
                              ...prev,
                              [nb.id]: [...(prev[nb.id] || []), response]
                            }));
                            triggerBeep(520, 0.08);
                          }, 1500);
                        }

                        // Save to firestore if online!
                        saveOrUpdateMessageInFirestore(payload, nb.id);
                      }, 100);

                      setAudioFeedback(`✓ Forwarded message to ${nb.name}!`);
                      setShowForwardModal(null);
                      setTimeout(() => setAudioFeedback(""), 3550);
                      triggerBeep(560, 0.1);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white px-3 py-1.5 rounded-lg font-mono font-bold transition duration-205"
                  >
                    Forward ↩
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* ---------------------------------------------------- */}
      {/* 👥 GLOBAL CONTACTS AND NEARBY INVITE DIALOG MODAL */}
      {/* ---------------------------------------------------- */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-[1100] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#161616] border border-neutral-800/80 rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative p-6 space-y-6 max-h-[85vh] overflow-y-auto scrollbar-thin">
            
            {/* Header row */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0F8A5F] bg-[#0F8A5F]/10 px-3.5 py-1 rounded-full">
                Personal Invites
              </span>
              <button 
                onClick={() => {
                  setShowContactsModal(false);
                  triggerBeep(325, 0.05);
                }}
                className="text-neutral-400 hover:text-white text-xs bg-neutral-800/60 hover:bg-neutral-800 px-3.5 py-1.5 rounded-xl transition duration-150 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Description Text */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Your Block. Your People</h3>
              <p className="text-xs text-neutral-400 leading-normal max-w-[280px] mx-auto">
                Invite friends in your contact list to join your Nearby network o!
              </p>
            </div>

            {/* Shareable Invite Link Box */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                Your Shareable invite Link
              </label>
              <div className="flex items-center space-x-1.5 bg-neutral-950 p-1.5 rounded-[18px] border border-neutral-800/60 focus-within:border-[#0F8A5F] transition-colors">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/join/${userUsername || 'fasipelanre'}`}
                  className="bg-transparent text-xs text-neutral-300 font-mono flex-1 focus:outline-none pl-3 border-none select-all"
                />
                <button
                  onClick={() => {
                    const l = `${window.location.origin}/join/${userUsername || 'fasipelanre'}`;
                    navigator.clipboard.writeText(l);
                    setAudioFeedback("Link copied.");
                    setTimeout(() => setAudioFeedback(""), 3000);
                    triggerBeep(520, 0.08);
                  }}
                  className="bg-[#0F8A5F] hover:bg-[#0C7A53] hover:scale-[1.02] active:scale-95 text-[11px] font-black text-white px-4 py-2 rounded-[14px] font-sans transition-all cursor-pointer shadow-md"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Platform Sharing Grid */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                Share Link Via Platforms
              </label>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                {/* WhatsApp */}
                <button
                  onClick={() => {
                    const l = `${window.location.origin}/join/${userUsername || 'fasipelanre'}`;
                    const text = `Connect with me on Nearby: ${l}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    setAudioFeedback("Opening WhatsApp...");
                    setTimeout(() => setAudioFeedback(""), 3000);
                    triggerBeep(580, 0.1);
                  }}
                  className="flex flex-col items-center space-y-1.5 p-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/40 rounded-[18px] hover:scale-[1.03] active:scale-95 hover:border-emerald-500/20 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-neutral-300 font-sans text-[9px] font-medium">WhatsApp</span>
                </button>

                {/* Snapchat */}
                <button
                  onClick={() => {
                    const l = `${window.location.origin}/join/${userUsername || 'fasipelanre'}`;
                    window.open(`https://www.snapchat.com/share?url=${encodeURIComponent(l)}`, '_blank');
                    setAudioFeedback("Opening Snapchat...");
                    setTimeout(() => setAudioFeedback(""), 3000);
                    triggerBeep(580, 0.1);
                  }}
                  className="flex flex-col items-center space-y-1.5 p-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/40 rounded-[18px] hover:scale-[1.03] active:scale-95 hover:border-yellow-500/20 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFFC00] flex items-center justify-center text-black shadow-sm">
                    <Smile className="w-4 h-4" />
                  </div>
                  <span className="text-neutral-300 font-sans text-[9px] font-medium">Snapchat</span>
                </button>

                {/* Instagram */}
                <button
                  onClick={() => {
                    const l = `${window.location.origin}/join/${userUsername || 'fasipelanre'}`;
                    navigator.clipboard.writeText(l);
                    setAudioFeedback("Copied! Opening Instagram...");
                    setTimeout(() => setAudioFeedback(""), 3500);
                    triggerBeep(580, 0.1);
                    window.open(`https://www.instagram.com/direct/inbox/`, '_blank');
                  }}
                  className="flex flex-col items-center space-y-1.5 p-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/40 rounded-[18px] hover:scale-[1.03] active:scale-95 hover:border-fuchsia-500/20 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF3008] to-[#C724B1] flex items-center justify-center text-white shadow-sm">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <span className="text-neutral-300 font-sans text-[9px] font-medium">Instagram</span>
                </button>

                {/* TikTok */}
                <button
                  onClick={() => {
                    const l = `${window.location.origin}/join/${userUsername || 'fasipelanre'}`;
                    navigator.clipboard.writeText(l);
                    setAudioFeedback("Copied! Opening TikTok...");
                    setTimeout(() => setAudioFeedback(""), 3500);
                    triggerBeep(580, 0.1);
                    window.open(`https://www.tiktok.com/`, '_blank');
                  }}
                  className="flex flex-col items-center space-y-1.5 p-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/40 rounded-[18px] hover:scale-[1.03] active:scale-95 hover:border-teal-500/20 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow-sm border border-neutral-800">
                    <Music className="w-4 h-4" />
                  </div>
                  <span className="text-neutral-300 font-sans text-[9px] font-medium">TikTok</span>
                </button>
              </div>
            </div>

            {/* Personal Contacts List section */}
            <div className="space-y-3 pt-4 border-t border-neutral-800/60">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                  Personal Contacts
                </label>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => {
                      setShowAddContactForm(!showAddContactForm);
                      triggerBeep(450, 0.05);
                    }}
                    className="text-[9px] bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 border border-neutral-700/60 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{showAddContactForm ? 'Close' : '+ Add Contact'}</span>
                  </button>
                  <button
                    onClick={handleSyncContacts}
                    disabled={isRequestingContacts}
                    className="text-[9px] bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 border border-indigo-500/20 flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isRequestingContacts ? 'animate-spin' : ''}`} />
                    <span>{isRequestingContacts ? 'Syncing...' : 'Sync Contacts'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Add Contact Form */}
              {showAddContactForm && (
                <div className="bg-neutral-950 p-4 rounded-[20px] border border-neutral-800/60 space-y-3 animate-fade-in">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-white">Add New Contact</h4>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Contact Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full h-10 bg-neutral-900 border border-neutral-850 rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#0F8A5F] transition-all font-sans"
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone Number"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="w-full h-10 bg-neutral-900 border border-neutral-850 rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#0F8A5F] transition-all font-mono"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!newContactName.trim() || !newContactPhone.trim()) {
                        setAudioFeedback("Please fill in all fields.");
                        setTimeout(() => setAudioFeedback(""), 2200);
                        return;
                      }
                      const newC = {
                        name: newContactName.trim(),
                        phone: newContactPhone.trim(),
                        nearby: Math.random() > 0.4
                      };
                      const updated = [newC, ...contactsList];
                      setContactsList(updated);
                      await saveContactsToFirestore(updated);
                      setNewContactName("");
                      setNewContactPhone("");
                      setShowAddContactForm(false);
                      setAudioFeedback(`Saved ${newC.name}.`);
                      setTimeout(() => setAudioFeedback(""), 3000);
                      triggerBeep(580, 0.1);
                    }}
                    className="w-full h-10 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer flex items-center justify-center shadow-md"
                  >
                    Save Contact to Address Book
                  </button>
                </div>
              )}

              {/* Scrollable list of contacts with premium rows */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
                {contactsList.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 font-mono text-center py-6">
                    Address book is empty. Sync contacts or add a contact to start.
                  </p>
                ) : (
                  contactsList.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-900/60 rounded-xl border border-neutral-800/40 transition-colors">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">{c.name}</span>
                        <span className="text-[9px] text-neutral-500 font-mono">{c.phone}</span>
                      </div>
                      {c.nearby ? (
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold tracking-wide">
                          Nearby
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const l = `${window.location.origin}/join/${userUsername || 'fasipelanre'}`;
                            const text = `Connect with me on Nearby: ${l}`;
                            setAudioFeedback(`Opening SMS to invite ${c.name}...`);
                            setTimeout(() => setAudioFeedback(""), 3000);
                            triggerBeep(520, 0.08);
                            window.open(`sms:${c.phone}?body=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="py-1 px-3 bg-[#0F8A5F]/10 hover:bg-[#0F8A5F]/20 text-[9px] font-bold text-[#0F8A5F] rounded-lg cursor-pointer transition active:scale-95"
                        >
                          Invite
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🛡️ SIMULATED OS CONTACTS ACCESS PERMISSION DIALOG OVERLAY */}
      {/* ---------------------------------------------------- */}
      {showContactsPermissionPrompt && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[1300] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xs bg-[#1c1c1e] text-white rounded-2xl overflow-hidden shadow-2xl p-5 border border-neutral-800 text-center space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-3xl">👥</span>
              <h4 className="text-sm font-bold text-white">"Nearby" Would Like to Access Your Contacts</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              This allows Nearby to read your address book to discover friends already nearby, sync your connection circle, and let you invite friends directly via secure SMS.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowContactsPermissionPrompt(false);
                  setAudioFeedback("Permission denied.");
                  triggerBeep(300, 0.1);
                  setTimeout(() => setAudioFeedback(""), 2000);
                }}
                className="py-2 bg-neutral-800 hover:bg-neutral-750 text-xs font-bold text-zinc-400 rounded-xl transition cursor-pointer"
              >
                Don't Allow
              </button>
              <button
                onClick={() => {
                  setShowContactsPermissionPrompt(false);
                  triggerBeep(600, 0.1);
                  executeContactsSyncAfterPermission();
                }}
                className="py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition cursor-pointer"
              >
                Allow Access
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
