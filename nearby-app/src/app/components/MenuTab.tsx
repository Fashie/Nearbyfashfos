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

export default function MenuTab() {
  const {
    activeTab,
    neighbors,
    pendingFriendRequests,
    sentFriendRequestIds,
    setShowFriendsModal,
    setShowNotificationsModal,
    notifications,
    unreadNotificationsCount,
    profileFileRef,
    postFileRef,
    showInstagramProfile,
    setShowInstagramProfile,
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
    setShowHelpModal,
    privacyDisappearing,
    setPrivacyDisappearing,
    showEditProfileModal,
    setShowEditProfileModal,
    customProfilePhoto,
    setCustomProfilePhoto,
    setViewingUserPostDetail,
    userStatusText,
    setUserStatusText,
    userPosts,
    userHighlights,
    meetups,
    meetupRatings,
    setShowScheduleMeetupModal,
    setScheduleMeetupTargetNeighbor,
    setScheduleMeetupPoint,
    setScheduleMeetupTime,
    gbFreezeLastSeen,
    setGbFreezeLastSeen,
    gbAntiDelete,
    setGbAntiDelete,
    gbHideOnline,
    setGbHideOnline,
    gbBlueTickOnReply,
    setGbBlueTickOnReply,
    settingsSubView,
    setSettingsSubView,
    privacyLocationVisibility,
    setPrivacyLocationVisibility,
    privacyReadReceipts,
    setPrivacyReadReceipts,
    privacyTrustedOnly,
    setPrivacyTrustedOnly,
    notifMessages,
    setNotifMessages,
    notifFriendRequests,
    setNotifFriendRequests,
    notifMeetups,
    setNotifMeetups,
    notifRatings,
    setNotifRatings,
    notifNearbyUsers,
    setNotifNearbyUsers,
    notifEvents,
    setNotifEvents,
    appearanceMode,
    setAppearanceMode,
    setAboutDetailModal,
    setConfirmDeleteAccount,
    handleGalleryUploadForProfilePic,
    handleGalleryUploadForPost,
    currentUser,
    setUploadMode,
    customAccentColor,
    setCustomAccentColor,
    customChatBg,
    setCustomChatBg,
    friendIds,
    isUserVisibleOnRadar,
    setIsUserVisibleOnRadar,
    appTheme,
    setAudioFeedback,
    logoutUser,
    triggerBeep,
    handleRateNeighbor,
    handleCancelMeetup,
    handleReportNeighbor,
    handleAddNewFriend,
    handleAcceptFriendRequest,
    theme,
  } = useNearbyRuntime();

  return (
    <>
          {activeTab === 'menu' && (
            <motion.div
              key="menu-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              {!showInstagramProfile ? (
                (() => {
                  const CustomSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange();
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-250 shrink-0 cursor-pointer relative flex items-center ${
                          checked ? 'bg-[#0F8A5F]' : 'bg-neutral-300 dark:bg-neutral-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-250 ${
                            checked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    );
                  };

                  return (
                  /* VIEW A: SETTINGS PAGE */
                  <div className={`p-6 pb-24 space-y-6 overflow-y-auto h-full font-sans max-w-md mx-auto ${appTheme === 'dark' ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    
                    {/* MAIN SETTINGS VIEW */}
                    {settingsSubView === 'main' && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* HEADER */}
                        <div className="flex justify-between items-center text-left">
                          <div>
                            <h2 className="text-3xl font-black tracking-tight font-display">Settings</h2>
                            <p className="text-xs text-neutral-400 font-medium mt-0.5">Manage your Nearby experience.</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Notification Bell Button */}
                            <button
                              onClick={() => {
                                triggerBeep(450, 0.05);
                                setShowNotificationsModal(true);
                              }}
                              className={`p-2.5 rounded-full transition active:scale-95 relative cursor-pointer ${
                                appTheme === 'dark' ? 'bg-neutral-850 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                              title="Notifications Center"
                            >
                              <Bell className="w-4 h-4" />
                              {unreadNotificationsCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white ring-2 ring-neutral-900">
                                  {unreadNotificationsCount}
                                </span>
                              )}
                            </button>

                            <button 
                              onClick={() => {
                                triggerBeep(450, 0.05);
                                setShowHelpModal(true);
                              }}
                              className={`p-2.5 rounded-full transition active:scale-95 cursor-pointer ${
                                appTheme === 'dark' ? 'bg-neutral-850 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                              title="Search Help"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* PROFILE CARD */}
                        <div 
                          onClick={() => {
                            setShowInstagramProfile(true);
                            triggerBeep(520, 0.08);
                          }}
                          className={`p-5 rounded-[24px] border flex items-center justify-between cursor-pointer transition active:scale-98 shadow-sm hover:shadow-md ${
                            appTheme === 'dark' 
                              ? 'bg-neutral-900/60 border-neutral-800 backdrop-blur-md' 
                              : 'bg-white border-stone-200/50 shadow-soft-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-4 min-w-0">
                            {/* Large Profile Picture */}
                            <div className="relative shrink-0">
                              {customProfilePhoto ? (
                                <div className="p-[2.5px] bg-gradient-to-tr from-[#0F8A5F] via-[#22C55E] to-[#10B981] rounded-full">
                                  <img 
                                    src={customProfilePhoto} 
                                    alt="my custom profile" 
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-neutral-900"
                                  />
                                </div>
                              ) : currentUser?.photoURL ? (
                                <div className="p-[2.5px] bg-gradient-to-tr from-[#0F8A5F] via-[#22C55E] to-[#10B981] rounded-full">
                                  <img 
                                    src={currentUser.photoURL} 
                                    alt="google profile" 
                                    referrerPolicy="no-referrer"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-neutral-900"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
                                  🙋‍♂️
                                </div>
                              )}
                              <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#0F8A5F] border-2 border-white dark:border-neutral-900 rounded-full shadow-md" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 text-left">
                              <h4 className="font-extrabold text-base tracking-tight truncate flex items-center space-x-1.5">
                                <span>{userDisplayName}</span>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-sans tracking-tight">ACTIVE</span>
                              </h4>
                              <p className="text-xs text-neutral-400 font-mono mt-0.5">@{userUsername}</p>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[190px] italic">"{userStatusText}"</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerBeep(450, 0.05);
                                setShowEditProfileModal(true);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition active:scale-95 ${
                                appTheme === 'dark' ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                              }`}
                            >
                              Edit Profile
                            </button>
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          </div>
                        </div>

                        {/* SETTING GROUP 1: PERSONAL & SECURITY */}
                        <div className="space-y-2 text-left">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">Account & Privacy</span>
                          <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                            appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                          }`}>
                            {/* Row 1: Account (Edit Profile) */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setShowEditProfileModal(true);
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                  <User className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Account Info</span>
                                  <span className="text-[10px] text-neutral-400 block">Edit name, avatar, website, and bio biography</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            {/* Row 2: Privacy */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setSettingsSubView('privacy');
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                  <Lock className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Privacy & Security</span>
                                  <span className="text-[10px] text-neutral-400 block">Location visibility, radar ghost, read receipts</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            {/* Row 3: Notifications */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setSettingsSubView('notifications');
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                  <Bell className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Notifications</span>
                                  <span className="text-[10px] text-neutral-400 block">Alert sound preferences, alerts toggles</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>
                          </div>
                        </div>

                        {/* SETTING GROUP 2: DISCOVERY & UTILITIES */}
                        <div className="space-y-2 text-left">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">Connection & Proximity</span>
                          <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                            appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                          }`}>
                            {/* Row 1: Radar */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setSettingsSubView('radar');
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                                  <Radar className="w-4 h-4 animate-pulse" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Radar Configuration</span>
                                  <span className="text-[10px] text-neutral-400 block">Proximity scans, range limits, background grid</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            {/* Row 2: Meetups */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setSettingsSubView('meetups');
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Meetups & Safe Spots</span>
                                  <span className="text-[10px] text-neutral-400 block">Physical meetup criteria, safe spots mapping</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            {/* Row 3: Chats */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setSettingsSubView('chats');
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600">
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Chats Customizer & Stealth</span>
                                  <span className="text-[10px] text-neutral-400 block">Wallpapers, color accents, advanced anti-delete</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>
                          </div>
                        </div>

                        {/* SETTING GROUP 3: SYSTEM PREFERENCES */}
                        <div className="space-y-2 text-left">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">Personalization & Info</span>
                          <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                            appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                          }`}>
                            {/* Row 1: Appearance */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setSettingsSubView('appearance');
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                  <Palette className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Appearance Theme</span>
                                  <span className="text-[10px] text-neutral-400 block">Light, Dark, or System mode choice</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            {/* Row 2: Help */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setShowHelpModal(true);
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500">
                                  <HelpCircle className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">Help & Community support</span>
                                  <span className="text-[10px] text-neutral-400 block">FAQ forums, feedback submission, report grid errors</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            {/* Row 3: About */}
                            <div 
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                setSettingsSubView('about');
                              }}
                              className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                                appTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                  <Info className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <span className="text-xs font-bold block">About Nearby</span>
                                  <span className="text-[10px] text-neutral-400 block">Version, policies, guidelines</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>
                          </div>
                        </div>

                        {/* DANGER ZONE - EXPANDED APPLE RED CARD */}
                        <div className="space-y-2 text-left">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 px-1">Danger Zone</span>
                          <div className={`p-4 border rounded-[24px] space-y-4 shadow-sm bg-gradient-to-br ${
                            appTheme === 'dark' 
                              ? 'from-red-950/25 to-neutral-900/40 border-red-950 text-neutral-300' 
                              : 'from-red-50/40 to-white border-red-100 text-neutral-700'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-extrabold text-red-500">Caution Account Area</p>
                                <p className="text-[10px] text-neutral-400 leading-normal mt-0.5">
                                  Logging out removes active local node session caches. Deleting account is irreversible and removes your safety scores and grid credentials.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <button
                                onClick={() => {
                                  triggerBeep(420, 0.05);
                                  logoutUser();
                                }}
                                className={`py-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 cursor-pointer transition active:scale-95 ${
                                  appTheme === 'dark' 
                                    ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white' 
                                    : 'bg-white border-stone-200 hover:bg-stone-50 hover:text-neutral-900'
                                }`}
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Log Out</span>
                              </button>

                              <button
                                onClick={() => {
                                  triggerBeep(350, 0.15);
                                  setConfirmDeleteAccount(true);
                                }}
                                className="py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition active:scale-95 shadow-sm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Profile</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* PRIVACY SUBVIEW */}
                    {settingsSubView === 'privacy' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 text-left"
                      >
                        <button 
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setSettingsSubView('main');
                          }}
                          className="flex items-center space-x-1.5 text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white text-xs font-bold py-1 select-none"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back to Settings</span>
                        </button>

                        <div>
                          <h2 className="text-3xl font-black tracking-tight">Privacy Center</h2>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">Control your grid coordinates & proximity discovery preferences.</p>
                        </div>

                        <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                          appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                        }`}>
                          {/* Option 1: Location Visibility */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Location Sharing</span>
                                <span className="text-[10px] text-neutral-400 block">Share your precise coordinates with near devices</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={privacyLocationVisibility} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setPrivacyLocationVisibility(!privacyLocationVisibility);
                              }} 
                            />
                          </div>

                          {/* Option 2: Radar Visibility */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                                <Radar className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Radar Visibility</span>
                                <span className="text-[10px] text-neutral-400 block">Appear in neighboring radar proximity sweeps</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={isUserVisibleOnRadar} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setIsUserVisibleOnRadar(!isUserVisibleOnRadar);
                              }} 
                            />
                          </div>

                          {/* Option 3: Online Status */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Eye className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Show Active Status</span>
                                <span className="text-[10px] text-neutral-400 block">Show active connection lights on dashboard</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={!gbHideOnline} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setGbHideOnline(!gbHideOnline);
                              }} 
                            />
                          </div>

                          {/* Option 4: Read Receipts */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                                <CheckCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Read Receipts</span>
                                <span className="text-[10px] text-neutral-400 block">Show double blue ticks when viewing DMs</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={privacyReadReceipts} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setPrivacyReadReceipts(!privacyReadReceipts);
                              }} 
                            />
                          </div>

                          {/* Option 5: Last Seen */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Show Last Seen Timeline</span>
                                <span className="text-[10px] text-neutral-400 block">Publish timeline of last active presence</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={!gbFreezeLastSeen} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setGbFreezeLastSeen(!gbFreezeLastSeen);
                              }} 
                            />
                          </div>

                          {/* Option 6: Trusted Only */}
                          <div className={`h-[64px] px-4 flex items-center justify-between`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500">
                                <Shield className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Trusted Connections Only</span>
                                <span className="text-[10px] text-neutral-400 block">Limit private DMs to accepted neighbors only</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={privacyTrustedOnly} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setPrivacyTrustedOnly(!privacyTrustedOnly);
                              }} 
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* NOTIFICATIONS SUBVIEW */}
                    {settingsSubView === 'notifications' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 text-left"
                      >
                        <button 
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setSettingsSubView('main');
                          }}
                          className="flex items-center space-x-1.5 text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white text-xs font-bold py-1 select-none"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back to Settings</span>
                        </button>

                        <div>
                          <h2 className="text-3xl font-black tracking-tight">Notifications</h2>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">Control when and how you are notified of neighborhood activities.</p>
                        </div>

                        <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                          appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                        }`}>
                          {/* Option 1: Messages */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <MessageSquare className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Direct Message DMs</span>
                                <span className="text-[10px] text-neutral-400 block">Tones and vibration for private text replies</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={notifMessages} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setNotifMessages(!notifMessages);
                              }} 
                            />
                          </div>

                          {/* Option 2: Friend Requests */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                                <UserPlus className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Connection Requests</span>
                                <span className="text-[10px] text-neutral-400 block">Alerts for inbound neighbor match invites</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={notifFriendRequests} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setNotifFriendRequests(!notifFriendRequests);
                              }} 
                            />
                          </div>

                          {/* Option 3: Meetups */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Meetups Scheduling</span>
                                <span className="text-[10px] text-neutral-400 block">Coordination confirmations, active safety times</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={notifMeetups} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setNotifMeetups(!notifMeetups);
                              }} 
                            />
                          </div>

                          {/* Option 4: Ratings */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Safety Star Ratings</span>
                                <span className="text-[10px] text-neutral-400 block">Alerts for trust endorsements on your profile</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={notifRatings} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setNotifRatings(!notifRatings);
                              }} 
                            />
                          </div>

                          {/* Option 5: Nearby Users */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500">
                                <Compass className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Nearby Proximity alerts</span>
                                <span className="text-[10px] text-neutral-400 block">Alert when a connection enters 500m radius</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={notifNearbyUsers} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setNotifNearbyUsers(!notifNearbyUsers);
                              }} 
                            />
                          </div>

                          {/* Option 6: Events */}
                          <div className={`h-[64px] px-4 flex items-center justify-between`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                <Radio className="w-4 h-4 animate-pulse" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Local Broadcast Events</span>
                                <span className="text-[10px] text-neutral-400 block">Neighborhood safety bulletins and announcements</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={notifEvents} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setNotifEvents(!notifEvents);
                              }} 
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* APPEARANCE SUBVIEW */}
                    {settingsSubView === 'appearance' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 text-left"
                      >
                        <button 
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setSettingsSubView('main');
                          }}
                          className="flex items-center space-x-1.5 text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white text-xs font-bold py-1 select-none"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back to Settings</span>
                        </button>

                        <div>
                          <h2 className="text-3xl font-black tracking-tight font-display">Appearance</h2>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">Configure theme appearance layouts according to light comfort.</p>
                        </div>

                        <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                          appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                        }`}>
                          {/* Option 1: Light Theme */}
                          <div 
                            onClick={() => {
                              triggerBeep(420, 0.05);
                              setAppearanceMode('light');
                            }}
                            className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition ${
                              appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                <Sun className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Light Theme</span>
                                <span className="text-[10px] text-neutral-400 block">Clean, high-contrast crisp day design</span>
                              </div>
                            </div>
                            {appearanceMode === 'light' && <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />}
                          </div>

                          {/* Option 2: Dark Theme */}
                          <div 
                            onClick={() => {
                              triggerBeep(420, 0.05);
                              setAppearanceMode('dark');
                            }}
                            className={`h-[64px] px-4 flex items-center justify-between cursor-pointer transition ${
                              appTheme === 'dark' ? 'hover:bg-white/5 border-b border-neutral-800/60' : 'hover:bg-stone-50 border-b border-stone-100'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <Moon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Dark Slate Theme</span>
                                <span className="text-[10px] text-neutral-400 block">Eye-safe slate twilight night visual theme</span>
                              </div>
                            </div>
                            {appearanceMode === 'dark' && <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />}
                          </div>

                          {/* Option 3: System Theme */}
                          <div 
                            onClick={() => {
                              triggerBeep(420, 0.05);
                              setAppearanceMode('system');
                            }}
                            className="h-[64px] px-4 flex items-center justify-between cursor-pointer transition hover:bg-neutral-100/40 dark:hover:bg-white/5"
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                <Compass className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">System Default</span>
                                <span className="text-[10px] text-neutral-400 block">Matches device settings schedule automatically</span>
                              </div>
                            </div>
                            {appearanceMode === 'system' && <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* RADAR SETTINGS SUBVIEW */}
                    {settingsSubView === 'radar' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 text-left"
                      >
                        <button 
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setSettingsSubView('main');
                          }}
                          className="flex items-center space-x-1.5 text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white text-xs font-bold py-1 select-none"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back to Settings</span>
                        </button>

                        <div>
                          <h2 className="text-3xl font-black tracking-tight">Radar Settings</h2>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">Customize nearby neighbor scan sweeps and walking range caps.</p>
                        </div>

                        <div className={`p-5 rounded-[24px] space-y-4 border ${
                          appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50 shadow-sm'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Radar className="w-4 h-4 text-rose-500 animate-pulse" />
                              <span className="text-xs font-bold">Proximity Scan Ranges</span>
                            </div>
                            <span className="text-[10px] font-mono text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                          </div>

                          <p className="text-[10px] text-neutral-400 leading-normal font-sans">
                            Configuring a smaller walking sweep radius decreases signal consumption and shows localized neighbors closer to your real-world coordinates.
                          </p>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                            {[
                              { label: "100m Proximity", sub: "Urban Close" },
                              { label: "1km Area", sub: "Standard Walking" },
                              { label: "5km Region", sub: "Wide Sweep" }
                            ].map((item, idx) => (
                              <div 
                                key={idx}
                                onClick={() => triggerBeep(480 + (idx * 30), 0.08)}
                                className={`p-3 rounded-xl border cursor-pointer transition duration-200 hover:scale-[1.02] ${
                                  idx === 1 
                                    ? 'border-[#0F8A5F] bg-[#0F8A5F]/10 text-[#0F8A5F] font-bold' 
                                    : (appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300' : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-neutral-700')
                                }`}
                              >
                                <span className="block text-[11px] font-extrabold">{item.label}</span>
                                <span className="block text-[8.5px] text-neutral-400 mt-0.5 font-sans font-medium">{item.sub}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* MEETUPS SUBVIEW */}
                    {settingsSubView === 'meetups' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 text-left"
                      >
                        <button 
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setSettingsSubView('main');
                          }}
                          className="flex items-center space-x-1.5 text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white text-xs font-bold py-1 select-none"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back to Settings</span>
                        </button>

                        <div>
                          <h2 className="text-3xl font-black tracking-tight font-display">Meetup Criteria</h2>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">Control Physical meetups criteria to guarantee safety rules.</p>
                        </div>

                        <div className={`p-5 rounded-[24px] border space-y-4 ${
                          appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50 shadow-sm'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <Shield className="text-emerald-500 w-4 h-4" />
                            <span className="text-xs font-bold">Proximity Safety Checks</span>
                          </div>

                          <p className="text-[10px] text-neutral-400 leading-normal font-sans">
                            Nearby recommends meeting up only at verified, crowded public spaces. We can automatically log meetup checkpoints with local public nodes for double safety assurance.
                          </p>

                          <div className="space-y-2 text-xs">
                            <div className={`p-3 rounded-xl flex items-center justify-between border ${
                              appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800' : 'bg-stone-50 border-stone-200'
                            }`}>
                              <div>
                                <span className="block font-bold text-xs">Require Verified Spots Only</span>
                                <span className="block text-[9px] text-neutral-400">Restricts meetup scheduling outside public points</span>
                              </div>
                              <CustomSwitch checked={true} onChange={() => triggerBeep(420, 0.05)} />
                            </div>

                            <div className={`p-3 rounded-xl flex items-center justify-between border ${
                              appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800' : 'bg-stone-50 border-stone-200'
                            }`}>
                              <div>
                                <span className="block font-bold text-xs">Pre-Share Coordinates Route</span>
                                <span className="block text-[9px] text-neutral-400">Share active walking vectors to trusted contacts</span>
                              </div>
                              <CustomSwitch checked={false} onChange={() => triggerBeep(420, 0.05)} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* CHATS SUBVIEW */}
                    {settingsSubView === 'chats' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 text-left"
                      >
                        <button 
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setSettingsSubView('main');
                          }}
                          className="flex items-center space-x-1.5 text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white text-xs font-bold py-1 select-none"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back to Settings</span>
                        </button>

                        <div>
                          <h2 className="text-3xl font-black tracking-tight font-display">Chats & Stealth</h2>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">Customize chat thread wallpaper skins, custom colors and GB privacy features.</p>
                        </div>

                        <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                          appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                        }`}>
                          {/* Option 1: Anti-Delete Messages */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5 pr-2">
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Anti-Delete Messages</span>
                                <span className="text-[10px] text-neutral-400 block">Keep original text even if sender deletes it</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={gbAntiDelete} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setGbAntiDelete(!gbAntiDelete);
                              }} 
                            />
                          </div>

                          {/* Option 2: Blue Tick on Reply */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5 pr-2">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <CheckCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Blue Tick on Reply</span>
                                <span className="text-[10px] text-neutral-400 block">Only register blue read tick when you reply back</span>
                              </div>
                            </div>
                            <CustomSwitch 
                              checked={gbBlueTickOnReply} 
                              onChange={() => {
                                triggerBeep(450, 0.05);
                                setGbBlueTickOnReply(!gbBlueTickOnReply);
                              }} 
                            />
                          </div>

                          {/* Option 3: Disappearing Messaging select */}
                          <div className={`px-4 py-3 flex flex-col justify-center border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Disappearing messaging history</label>
                            <select 
                              value={privacyDisappearing} 
                              onChange={(e) => {
                                setPrivacyDisappearing(e.target.value);
                                triggerBeep(450, 0.05);
                              }} 
                              className={`w-full bg-transparent border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium ${
                                appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-stone-50 border-stone-200 text-neutral-800'
                              }`}
                            >
                              <option value="Off">Off (Keep History Forever)</option>
                              <option value="24 Hours">24 Hours (Automatic Wipes)</option>
                              <option value="7 Days">7 Days (Weekly Purges)</option>
                            </select>
                          </div>

                          {/* Option 4: DM Wallpapers select */}
                          <div className={`px-4 py-3 flex flex-col justify-center border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Chat DM Wallpaper background</label>
                            <select 
                              value={customChatBg || "default"} 
                              onChange={(e) => {
                                setCustomChatBg(e.target.value);
                                triggerBeep(450, 0.05);
                              }} 
                              className={`w-full bg-transparent border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium ${
                                appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-stone-50 border-stone-200 text-neutral-800'
                              }`}
                            >
                              <option value="default">Default Neutral Texture</option>
                              <option value="safari">Lagos Sunset Orange</option>
                              <option value="mint">Emerald Oasis Mint</option>
                              <option value="lavender">Cosmic Lavender Purple</option>
                              <option value="charcoal">Deep Space Slate</option>
                            </select>
                          </div>

                          {/* Option 5: Chat Theme Accents */}
                          <div className="px-4 py-3.5 flex flex-col justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Accent Color Theme</span>
                            <div className="flex gap-2.5">
                              {[
                                { id: 'indigo', bg: 'bg-indigo-600' },
                                { id: 'emerald', bg: 'bg-[#0F8A5F]' },
                                { id: 'blue', bg: 'bg-blue-600' },
                                { id: 'rose', bg: 'bg-rose-600' },
                                { id: 'amber', bg: 'bg-amber-500' },
                                { id: 'purple', bg: 'bg-purple-600' }
                              ].map((col) => (
                                <button
                                  key={col.id}
                                  onClick={() => {
                                    setCustomAccentColor(col.id as any);
                                    triggerBeep(520, 0.1);
                                    setAudioFeedback(`Accent theme updated to ${col.id}!`);
                                    setTimeout(() => setAudioFeedback(""), 2000);
                                  }}
                                  className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition shrink-0 ${col.bg} border-2 ${
                                    customAccentColor === col.id ? (appTheme === 'dark' ? 'border-white scale-105 shadow-md' : 'border-neutral-800 scale-105 shadow-md') : 'border-transparent'
                                  }`}
                                  title={col.id}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ABOUT SUBVIEW */}
                    {settingsSubView === 'about' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 text-left"
                      >
                        <button 
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setSettingsSubView('main');
                          }}
                          className="flex items-center space-x-1.5 text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white text-xs font-bold py-1 select-none"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Back to Settings</span>
                        </button>

                        <div>
                          <h2 className="text-3xl font-black tracking-tight font-display">About Nearby</h2>
                          <p className="text-xs text-neutral-400 font-medium mt-0.5">Learn more about our local physical mesh-network grid standards.</p>
                        </div>

                        <div className={`border rounded-[24px] overflow-hidden shadow-sm ${
                          appTheme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-stone-200/50'
                        }`}>
                          {/* Option 1: Version */}
                          <div className={`h-[64px] px-4 flex items-center justify-between border-b ${
                            appTheme === 'dark' ? 'border-neutral-800/60' : 'border-stone-100'
                          }`}>
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <Compass className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Grid Mesh Version</span>
                                <span className="text-[10px] text-neutral-400 block">Nearby proximity client protocol</span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-neutral-400">v2.4.0 (Build 904)</span>
                          </div>

                          {/* Option 2: Privacy Policy */}
                          <div 
                            onClick={() => {
                              triggerBeep(450, 0.05);
                              setAboutDetailModal('privacy');
                            }}
                            className={`h-[64px] px-4 flex items-center justify-between cursor-pointer border-b ${
                              appTheme === 'dark' ? 'border-neutral-800/60 hover:bg-white/5' : 'border-stone-100 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Privacy Policy</span>
                                <span className="text-[10px] text-neutral-400 block">Read how your offline-first profile coordinates stay safe</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          </div>

                          {/* Option 3: Terms of Service */}
                          <div 
                            onClick={() => {
                              triggerBeep(450, 0.05);
                              setAboutDetailModal('terms');
                            }}
                            className={`h-[64px] px-4 flex items-center justify-between cursor-pointer border-b ${
                              appTheme === 'dark' ? 'border-neutral-800/60 hover:bg-white/5' : 'border-stone-100 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Terms of Grid Usage</span>
                                <span className="text-[10px] text-neutral-400 block">Nearby digital credentials agreement norms</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          </div>

                          {/* Option 4: Community Guidelines */}
                          <div 
                            onClick={() => {
                              triggerBeep(450, 0.05);
                              setAboutDetailModal('guidelines');
                            }}
                            className={`h-[64px] px-4 flex items-center justify-between cursor-pointer ${
                              appTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                <Shield className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold block">Community Guidelines</span>
                                <span className="text-[10px] text-neutral-400 block">Trust score norms, respectful walk meets protocols</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })()
            ) : (
                /* VIEW B: PREMIUM APPLE/AIRBNB STYLE PROFILE VIEW */
                <div className={`transition-all duration-300 min-h-full flex flex-col bg-white overflow-y-auto`}>
                  <Suspense fallback={<div className="p-8 text-center text-zinc-400 font-sans text-xs">Loading Profile...</div>}>
                    <PremiumProfileView 
                      isOwnProfile={true}
                      currentUser={currentUser}
                      neighbor={null}
                      onClose={() => {
                        setShowInstagramProfile(false);
                        triggerBeep(450, 0.05);
                      }}
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
                      userPosts={userPosts}
                      userHighlights={userHighlights}
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
                      setScheduleMeetupTargetNeighbor={(n) => {
                        setScheduleMeetupTargetNeighbor(n);
                      }}
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
                </div>
              )}
            </motion.div>
          )}
    </>
  );
}
