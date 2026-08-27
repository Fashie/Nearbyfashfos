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

export default function AppHeaderAndBanners() {
  const {
    activeTab,
    setActiveTab,
    selectedPreset,
    updatePresetWithCoordinates,
    setOnboardingCoords,
    onboardingAddress,
    setOnboardingAddress,
    onboardingState,
    setOnboardingState,
    setOnboardingStreetName,
    neighbors,
    setChatFilter,
    setShowContactsModal,
    topNotification,
    chatNotification,
    setCustomProfilePhoto,
    currentUser,
    showOnboarding,
    onboardingStep,
    setOnboardingStep,
    onboardingName,
    setOnboardingName,
    onboardingUsername,
    setOnboardingUsername,
    onboardingBio,
    setOnboardingBio,
    onboardingPhoto,
    setOnboardingPhoto,
    onboardingAgeRange,
    setOnboardingAgeRange,
    onboardingGender,
    setOnboardingGender,
    onboardingInterests,
    setOnboardingInterests,
    onboardingGpsStatus,
    setOnboardingGpsStatus,
    onboardingCamStatus,
    setOnboardingCamStatus,
    showMainMenuDropdown,
    setShowMainMenuDropdown,
    appTheme,
    setAppTheme,
    setUserCoords,
    setGpsSynced,
    setShowStateSearchModal,
    audioFeedback,
    setAudioFeedback,
    firestoreQuotaExceeded,
    setFirestoreQuotaExceeded,
    googleBillingError,
    setGoogleBillingError,
    dismissedIframeWarning,
    setDismissedIframeWarning,
    saveOnboardingDetails,
    triggerBeep,
    theme,
  } = useNearbyRuntime();

  return (
    <>
      {/* 🔔 Real-time Top Notification Overlay */}
      {topNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="absolute top-4 left-4 right-4 z-[9999] bg-neutral-900/95 border border-emerald-500/40 backdrop-blur-md rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center space-x-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            {topNotification.icon || "💡"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-extrabold">Discover Hub</p>
            <p className="text-xs text-white font-medium truncate">{topNotification.message}</p>
          </div>
        </motion.div>
      )}

      {/* 💬 Real-time Chat Page Activity Notification Overlay */}
      {chatNotification && activeTab === 'chat' && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="absolute top-4 left-4 right-4 z-[9999] bg-neutral-900/95 border border-indigo-500/40 backdrop-blur-md rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center space-x-3"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(99,102,241,0.3)]">
            📢
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-extrabold">New Update</p>
            <p className="text-xs text-white font-medium leading-tight">{chatNotification.message}</p>
            {chatNotification.subtext && (
              <p className="text-[10px] text-zinc-400 mt-0.5">{chatNotification.subtext}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Onboarding Wizard Fullscreen Overlay */}
      {showOnboarding && currentUser && (
        <div className="absolute inset-0 bg-[#07090e] z-[1000] flex flex-col justify-between p-6 overflow-y-auto w-full h-full">
          <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          
          {/* Step Tracker Indicator */}
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[11px] font-bold">o</div>
              <span className="text-sm font-display font-black tracking-wider uppercase text-white">Local Onboarding</span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono text-[10px] tracking-widest text-zinc-400">
              <span className={onboardingStep === 1 ? "text-indigo-400 font-black" : ""}>PROFILE</span>
              <span className="text-zinc-600">/</span>
              <span className={onboardingStep === 2 ? "text-indigo-400 font-black" : ""}>PERMISSIONS</span>
            </div>
          </div>

          {/* Main Step Contents */}
          <div className="flex-1 my-auto flex flex-col justify-center relative z-10">
            
            {/* STEP 1: profile setup */}
            {onboardingStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Create Your Profile</h2>
                  <p className="text-xs text-zinc-400">Set up your profile to start connecting.</p>
                </div>

                {/* Profile Avatar Selection & Picker exactly matching screenshot 5 */}
                <div className="flex items-center space-x-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-indigo-700 transition-all duration-350 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                      <div className="w-full h-full rounded-full bg-neutral-950 overflow-hidden flex items-center justify-center relative">
                        {onboardingPhoto ? (
                          <img referrerPolicy="no-referrer" src={onboardingPhoto} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-400/90 bg-neutral-900">
                            <radialGradient id="avGlowOn" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#07090e" stopOpacity="0" />
                            </radialGradient>
                            <circle cx="50%" cy="50%" r="48" fill="url(#avGlowOn)" />
                            {/* futuristic grid lines */}
                            <circle cx="50%" cy="50%" r="42" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="1,5" fill="none" opacity="0.4" />
                            <circle cx="50%" cy="50%" r="36" stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.6" />
                            <path
                              d="M50,18 C55,18 61,21 63,27 C65,30 66,33 65,37 C64,41 67,44 70,46 C73,48 74,50 71,52 C68,54 65,55 61,55 C57,55 55,59 55,63 C55,67 58,72 58,76 C52,81 46,81 41,76 C41,74 42,68 40,66 C38,64 34,64 32,61 C30,58 32,54 32,51 C32,47 30,45 32,43 C34,41 37,43 39,39 C41,35 40,29 42,24 C44,19 47,18 50,18 Z"
                              fill="#22d3ee"
                              opacity="0.85"
                              className="drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      id="onboarding-file-picker"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            setOnboardingPhoto(dataUrl);
                            setCustomProfilePhoto(dataUrl);
                            setAudioFeedback("Photo added.");
                            setTimeout(() => setAudioFeedback(""), 2000);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    {/* Glowing outer plus circle */}
                    <button
                      onClick={() => {
                        triggerBeep(420, 0.08);
                        document.getElementById('onboarding-file-picker')?.click();
                      }}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-tr from-[#0095F6] to-cyan-400 hover:scale-110 active:scale-90 rounded-full flex items-center justify-center cursor-pointer border-2 border-neutral-950 shadow-[0_0_12px_rgba(6,182,212,0.6)] text-white transition-all text-sm font-black"
                      title="Upload profile picture"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs font-bold text-white block">Avatar Photo</span>
                    <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                      Touch profile picture avatar circle to upload a grid photo from photo gallery or keep Google default.
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-455 mb-1.5 font-bold">Display Name</label>
                    <input
                      type="text"
                      value={onboardingName}
                      onChange={(e) => setOnboardingName(e.target.value)}
                      placeholder="Your full name (e.g. Lanre Fasipe)"
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs placeholder-neutral-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-sans transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-455 mb-1.5 font-bold">Choose Username</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-zinc-500 font-mono text-xs">@</span>
                      <input
                        type="text"
                        value={onboardingUsername}
                        onChange={(e) => setOnboardingUsername(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_\-]/g, ''))}
                        placeholder="fasipelanre"
                        className="w-full pl-8 pr-10 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs placeholder-neutral-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-cyan-300 font-mono transition-all"
                      />
                      {/* Interactive glowing ticking indicator checking availability */}
                      <div className="absolute right-3.5 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute" />
                      </div>
                    </div>
                    {onboardingUsername && (
                      <p className="text-[9px] font-mono text-cyan-400 mt-1.5 flex items-center space-x-1 pl-1">
                        <span>✓</span>
                        <span className="tracking-wide">@{onboardingUsername} available</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-455 font-bold">Bio / Description</label>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {onboardingBio.length} / 198
                      </span>
                    </div>
                    <textarea
                      value={onboardingBio}
                      onChange={(e) => {
                        if (e.target.value.length <= 198) {
                          setOnboardingBio(e.target.value);
                        }
                      }}
                      placeholder="Say a bit about yourself meeting neighbors..."
                      rows={3}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs placeholder-neutral-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-sans transition-all resize-none"
                    />
                  </div>

                  {/* Age Range and Gender selectors */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1 font-bold">Age Range</label>
                      <select
                        value={onboardingAgeRange}
                        onChange={(e) => setOnboardingAgeRange(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-white select-custom font-sans h-9"
                      >
                        <option value="18-24">18-24 years</option>
                        <option value="25-34">25-34 years</option>
                        <option value="35-44">35-44 years</option>
                        <option value="45+">45+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1 font-bold">Gender</label>
                      <select
                        value={onboardingGender}
                        onChange={(e) => setOnboardingGender(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-white select-custom font-sans h-9"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Core tag/interest chips */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5 font-bold">Your Core Interests (Choose Tap)</label>
                    <div className="flex flex-wrap gap-1.5">
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
                        const isSel = onboardingInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => {
                              triggerBeep(450, 0.04);
                              if (isSel) {
                                setOnboardingInterests(onboardingInterests.filter(i => i !== interest));
                              } else {
                                setOnboardingInterests([...onboardingInterests, interest]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border outline-none cursor-pointer ${
                              isSel 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm' 
                                : 'bg-neutral-950 border-neutral-800 text-zinc-400 hover:text-white hover:border-zinc-700'
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
                  onClick={() => {
                    if (!onboardingName.trim() || !onboardingUsername.trim()) {
                      triggerBeep(220, 0.15);
                      setAudioFeedback("Please enter your name and username.");
                      setTimeout(() => setAudioFeedback(""), 2000);
                      return;
                    }
                    triggerBeep(520, 0.08);
                    setOnboardingStep(2);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] shadow-[0_4px_15px_rgba(0,0,0,0.15)] rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-6 text-white"
                >
                  <span>Continue</span>
                </button>
              </div>
            )}

            {/* STEP 2: Permissions setup */}
            {onboardingStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Access Permissions</h2>
                  <p className="text-xs text-zinc-400">Configure device credentials to communicate on the grid.</p>
                </div>

                {/* GPS permission item */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-emerald-400 block" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs font-bold text-white block">Satellite GPS Geolocation</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">Used to calculate distances and find people nearby.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      triggerBeep(450, 0.05);
                      setOnboardingGpsStatus('pending');
                      if ("geolocation" in navigator) {
                        const triggerSuccess = async (pos: GeolocationPosition) => {
                          const { latitude, longitude } = pos.coords;
                          setOnboardingCoords({ lat: latitude, lng: longitude });
                          setUserCoords({ lat: latitude, lng: longitude });
                          setGpsSynced(true);
                          triggerBeep(650, 0.1);
                          setOnboardingGpsStatus('success');
                          
                          try {
                            const newP = await updatePresetWithCoordinates(latitude, longitude, true);
                            if (newP) {
                              setOnboardingAddress(newP.name);
                              setOnboardingState(newP.city);
                              const stName = newP.streets[0] || 'Gbongan Road';
                              setOnboardingStreetName(stName);
                              setAudioFeedback(`Location set: ${newP.name}`);
                              setTimeout(() => setAudioFeedback(""), 3000);
                            }
                          } catch (e) {
                            console.warn("Onboarding geocoding failed:", e);
                          }
                        };

                        navigator.geolocation.getCurrentPosition(
                          triggerSuccess,
                          (err) => {
                            console.warn("High-accuracy onboarding GPS failed, trying standard accuracy backup:", err);
                            // Fallback to standard accuracy query
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                triggerSuccess,
                                (fbErr) => {
                                  console.error("Backup onboarding standard GPS failed too:", fbErr);
                                  setOnboardingGpsStatus('failed');
                                },
                                { enableHighAccuracy: false, timeout: 15000 }
                              );
                            } else {
                              setOnboardingGpsStatus('failed');
                            }
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      } else {
                        setOnboardingGpsStatus('failed');
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-[10px] font-mono tracking-wider uppercase font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      onboardingGpsStatus === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : onboardingGpsStatus === 'failed'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700'
                    }`}
                  >
                    <span>{onboardingGpsStatus === 'success' ? '✓ Radar GPS Configured' : onboardingGpsStatus === 'failed' ? '⚠️ Request Refused (Retry)' : 'Request Geolocation Access'}</span>
                  </button>
                </div>

                {/* Camera/Mic permission item */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Camera className="w-5 h-5 text-emerald-400 block" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs font-bold text-white block">Camera & Microphones</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">Used to publish active daily grid stories and dial secure web-calls without delays.</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      triggerBeep(450, 0.05);
                      setOnboardingCamStatus('pending');
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        stream.getTracks().forEach(track => track.stop());
                        triggerBeep(650, 0.1);
                        setOnboardingCamStatus('success');
                      } catch (cameraErr) {
                        console.warn("Camera Refused:", cameraErr);
                        setOnboardingCamStatus('failed');
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-[10px] font-mono tracking-wider uppercase font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      onboardingCamStatus === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : onboardingCamStatus === 'failed'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700'
                    }`}
                  >
                    <span>{onboardingCamStatus === 'success' ? '✓ Camera & Mic Online' : onboardingCamStatus === 'failed' ? '⚠️ Audio/Video Refused (Retry)' : 'Request Audio/Video Access'}</span>
                  </button>
                </div>

                {/* Nav controls */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      triggerBeep(400, 0.05);
                      setOnboardingStep(1);
                    }}
                    className="py-3 bg-neutral-900 hover:bg-neutral-800 text-zinc-400 border border-neutral-800 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex-1 transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      triggerBeep(520, 0.08);
                      saveOnboardingDetails();
                    }}
                    className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider flex-[2] transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Proceed to Enter</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Complete Celebration */}
            {onboardingStep === 3 && (
              <div className="space-y-6 text-center font-display">
                {/* High-fidelity Concentric Glowing Rings exactly like the picture */}
                <div className="relative flex items-center justify-center w-32 h-32 mx-auto mt-2">
                  <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full animate-pulse shadow-[0_0_35px_rgba(6,182,212,0.05)]" />
                  <div className="absolute inset-3 border border-cyan-500/20 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.1)]" />
                  <div className="absolute inset-6 border-2 border-cyan-500/40 rounded-full flex items-center justify-center bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <div className="w-14 h-14 rounded-full border border-cyan-400 flex items-center justify-center bg-neutral-950 shadow-inner">
                      <Check className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">System Synced!</h2>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-normal">
                    Welcome to Nearby Network, {onboardingState || 'Osun'}! Your private, secured proximity profile has been provisioned o.
                  </p>
                </div>

                {/* Sleek details card with glowing borders as seen in screenshot 4 */}
                <div className="bg-[#0b101b]/95 border border-blue-900/40 rounded-3xl p-5 space-y-4 shadow-[0_0_20px_rgba(30,58,138,0.15)] text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Nearby Proximity ID</span>
                    <span className="font-mono text-[10px] bg-[#070c14] border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)] text-white px-3 py-1 rounded-xl">
                      {currentUser?.uid?.slice(0, 12) || '23iu6xZYBOX5'}...
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Username</span>
                    <span className="font-mono text-[10px] bg-[#070c14] border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-xl">
                      @{onboardingUsername}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 block">Location Epicenter</span>
                    <p className="text-neutral-200 text-xs font-semibold pl-1">
                      {onboardingAddress || "Oketunji Street, Osogbo, Osun State"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    triggerBeep(650, 0.2);
                    saveOnboardingDetails();
                  }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_4px_25px_rgba(99,102,241,0.35)] active:scale-97 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Build Connection & Enter Map &gt;</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer warning */}
          <div className="text-center pt-4 relative z-10 font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
            ✓ SECURED INTEGRITY ENFORCED BY Nearby Client
          </div>
        </div>
      )}

      {/* --- Top Header bar (Unified Status Bar / Branding) --- */}
      <div className={`px-4 pt-4 pb-3 ${theme.headerBg} flex justify-between items-center z-10 transition-all shadow-sm`}>
        <div className="flex items-center space-x-3">
          {/* Header Title: "Nearby" bold, geometric sans-serif */}
          <span className="text-xl font-display font-black tracking-tight bg-gradient-to-r from-brand-blue to-[#00F0FF] bg-clip-text text-transparent">
            Nearby
          </span>
          
          {/* Location Selector (Globe icon, Medium font) */}
          <button
            onClick={() => {
              setShowStateSearchModal(true);
              triggerBeep(480, 0.08);
            }}
            className="flex items-center space-x-1.5 opacity-90 hover:opacity-100 transition-all cursor-pointer"
            title="Click to search Nigeria States"
          >
            <Globe className={`w-4 h-4 ${appTheme === 'dark' ? 'text-[#F9FAFB]' : 'text-[#111827]'}`} />
            <span className={`text-xs font-display font-bold uppercase tracking-wider ${appTheme === 'dark' ? 'text-[#F9FAFB]' : 'text-[#111827]'}`}>{selectedPreset.city || "Lagos"}</span>
          </button>
        </div>

        {/* Action icons on far right: theme, kebab menu */}
        <div className="flex items-center space-x-1.5 relative">
          {/* Invite Contacts & Get Share Link */}
          <button
            onClick={() => {
              setShowContactsModal(true);
              triggerBeep(450, 0.05);
            }}
            className={`p-1.5 rounded-full transition cursor-pointer relative ${
              appTheme === 'dark' ? 'text-[#25D366] hover:bg-neutral-800' : 'text-emerald-600 hover:bg-neutral-100'
            }`}
            title="Invite Friends"
          >
            <Users className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#25D366] rounded-full" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#25D366] rounded-full animate-ping" />
          </button>

          {/* Theme Toggler */}
          <button
            onClick={() => {
              setAppTheme(appTheme === 'dark' ? 'light' : 'dark');
              triggerBeep(500, 0.08);
            }}
            className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              appTheme === 'dark' ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-neutral-800/10 text-brand-blue'
            }`}
            title={appTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {appTheme === 'dark' ? (
              <Sun className="w-4.5 h-4.5 animate-spin-slow" />
            ) : (
              <Moon className="w-4.5 h-4.5" />
            )}
          </button>

          {/* Kebab menu button */}
          <button
            onClick={() => {
              setShowMainMenuDropdown(!showMainMenuDropdown);
              triggerBeep(320, 0.05);
            }}
            className={`p-1.5 rounded-full transition cursor-pointer relative ${
              appTheme === 'dark' ? 'text-white hover:bg-neutral-800' : 'text-[#111827] hover:bg-neutral-100'
            }`}
            title="Menu Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Main screen dropdown list */}
          <AnimatePresence>
            {showMainMenuDropdown && (
              <>
                {/* Backdrop handler to close menu */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowMainMenuDropdown(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.12 }}
                  className={`absolute right-0 top-11 w-48 rounded-2xl shadow-2xl border p-2 z-50 overflow-hidden font-sans ${
                    appTheme === 'dark'
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-[0_10px_35px_rgba(0,0,0,0.5)]'
                      : 'bg-white border-neutral-100 text-neutral-800 shadow-[0_10px_35px_rgba(0,0,0,0.15)]'
                  }`}
                >
                  <button
                    onClick={() => {
                      setChatFilter('requests');
                      setShowMainMenuDropdown(false);
                      triggerBeep(450, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-500/10 rounded-xl transition font-medium flex items-center justify-between"
                  >
                    <span>New group connection</span>
                    <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-1.5 py-0.2 rounded font-black">ACTIVE</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('radar');
                      setShowMainMenuDropdown(false);
                      triggerBeep(450, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-500/10 rounded-xl transition"
                  >
                    New connection / Scan
                  </button>

                  <button
                    onClick={() => {
                      setShowMainMenuDropdown(false);
                      triggerBeep(450, 0.05);
                      setAudioFeedback("Desktop sync is active.");
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-500/10 rounded-xl transition"
                  >
                    Linked devices
                  </button>

                  <button
                    onClick={() => {
                      setChatFilter('favorites');
                      setShowMainMenuDropdown(false);
                      triggerBeep(450, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-500/10 rounded-xl transition"
                  >
                    Pinned / Starred messages
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('menu');
                      setShowMainMenuDropdown(false);
                      triggerBeep(450, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-500/10 rounded-xl transition font-semibold text-emerald-500"
                  >
                    Settings
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- Sub-Header Status Row (Neighborhood & GPS Link) --- */}
      <div className={`px-4 py-1.5 border-b flex justify-between items-center transition-all z-20 relative shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
        appTheme === 'dark' 
          ? 'bg-neutral-900/60 border-neutral-800 text-neutral-300' 
          : 'bg-neutral-50 border-neutral-150 text-neutral-600'
      }`}>
        <div className="flex items-center space-x-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-brand-blue animate-pulse shrink-0" />
          <span className="text-[10px] uppercase tracking-wider font-bold shrink-0">Neighborhood:</span>
          <span className="text-[11px] font-black truncate max-w-[200px] text-[#111827] dark:text-neutral-100">{selectedPreset.name || "Nearby"}</span>
        </div>
        
        <div className="flex items-center space-x-1.5 font-mono text-[10px] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9.5px] uppercase font-bold text-neutral-450 dark:text-neutral-500">GPS Link:</span>
          <span className="font-bold text-emerald-500">CONNECTED</span>
        </div>
      </div>

      {/* --- Iframe Sandbox Persistence Warning Banner --- */}
      {typeof window !== 'undefined' && window.self !== window.top && !dismissedIframeWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-300 flex items-start justify-between space-x-2 z-20">
          <div className="flex-1 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <span>⚠️ Session Ephemeral in Sandbox</span>
            </p>
            <p className="opacity-80 text-[11px] leading-relaxed">
              Mobile browsers block secure storage inside iframes. To make your profile, chats, and registrations 100% permanent and survive reloads, please open the application in a direct tab!
            </p>
            <div className="pt-1.5 flex items-center space-x-3">
              <button 
                onClick={() => {
                  triggerBeep(520, 0.05);
                  window.open(window.location.href, '_blank');
                }}
                className="bg-amber-600/20 hover:bg-amber-600/45 text-amber-200 border border-amber-500/35 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center space-x-1"
              >
                <span>🔗 Open in New Direct Tab</span>
              </button>
              <button 
                onClick={() => {
                  triggerBeep(400, 0.05);
                  setDismissedIframeWarning(true);
                }}
                className="text-zinc-400 hover:text-white underline text-[10px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Firestore Quota Exceeded Warn Banner --- */}
      {firestoreQuotaExceeded && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 text-xs text-rose-300 flex items-start justify-between space-x-2 z-20">
          <div className="flex-1 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <span>🔥 Daily Database Quota Limit Exceeded</span>
            </p>
            <p className="opacity-80 text-[11px] leading-relaxed">
              The public shared database has reached its free limit of 50,000 daily read/write actions. Safe offline local fallback mode has been activated. Connect your own free Firebase project in AI Studio to get your own unlimited database space!
            </p>
          </div>
          <button 
            onClick={() => setFirestoreQuotaExceeded(false)}
            className="text-rose-400 hover:text-white transition cursor-pointer text-sm font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* --- Google Maps Billing Warning Banner --- */}
      {googleBillingError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-300 flex items-start justify-between space-x-2 z-20">
          <div className="flex-1 space-y-1">
            <p className="font-semibold flex items-center space-x-1">
              <span>🗺️ Google Maps Reverse Geocoding Billing Required</span>
            </p>
            <p className="opacity-80 text-[11px] leading-relaxed">
              Google Maps reverse geocoding indicates billing is not enabled. We've instantly activated our high-precision OSM Nominatim reverse geocoder and offline geometric proximity matcher!
            </p>
            <p className="text-[11px] pt-1">
              <a 
                href="https://console.cloud.google.com/project/plucky-sky-dh7sp/billing/enable" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-white font-medium text-red-200 pr-2"
              >
                🔗 Enable GCP Billing
              </a>
              •
              <a 
                href="https://developers.google.com/maps/gmp-get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-white font-medium pl-2"
              >
                Get Started Guide
              </a>
            </p>
          </div>
          <button 
            onClick={() => setGoogleBillingError(false)}
            className="text-red-400 hover:text-white transition cursor-pointer text-sm font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* --- Dynamic Feedback Indicator --- */}
      <AnimatePresence>
        {audioFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(event, info) => {
              if (Math.abs(info.offset.x) > 50) {
                setAudioFeedback('');
                triggerBeep(320, 0.05);
              }
            }}
            className="absolute top-16 left-0 right-0 mx-auto w-[85%] max-w-xs bg-[#0F8A5F] text-white text-center py-2.5 px-4 rounded-full text-xs font-semibold shadow-xl z-50 flex items-center justify-between space-x-2 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center space-x-2 text-left flex-1 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 animate-pulse" />
              <span className="truncate">{audioFeedback}</span>
            </div>
            <span className="text-[10px] text-emerald-200 uppercase font-mono tracking-wider pl-1 shrink-0 select-none">Swipe</span>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
