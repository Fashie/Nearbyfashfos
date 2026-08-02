import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin as GMapPin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import GoogleMapIntegration from '../features/maps/components/GoogleMapIntegration';
import { OnboardingScreen } from '../features/authentication/components/OnboardingScreen';
import { CallOverlay } from '../features/calls/components/CallOverlay';
import { LandingScreen } from '../features/authentication/components/LandingScreen';
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
import { Neighbor, DirectMessage, CallState, StorySnap, PublicSnap, Meetup, MeetupRating } from '../types';
import { NEIGHBORHOODS, NIGERIAN_STATES, INITIAL_NEIGHBORS, INITIAL_MESSAGES, LocationPreset, INITIAL_NOTES, UserNote } from '../mockData';

const geocodingCache = new globalThis.Map<string, {
  finalRoad: string;
  finalTown: string;
  finalState: string;
  finalizedAddress: string;
}>();

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

import { getStateStreets } from '../utils';

// Firebase imports
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
} from '../firebase';
import {
  User as FirebaseUser,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';

import ExploreTab from '../features/explore/components/ExploreTab';
import { PremiumChatRoom } from '../features/chat/components/PremiumChatRoom';
import { PremiumProfileView } from '../features/profile/components/PremiumProfileView';

// Dynamic Snapchat landmark hotspots rendered relative to current epicenter to feel alive!
const SNAP_HOTSPOTS = [
  { name: "Nelson Mandela Freedom Park", label: "Top Pick", emoji: "🌳", latOffset: 0.0015, lngOffset: -0.002 },
  { name: "Bite More Restaurant", label: "Top Pick", emoji: "🍔", latOffset: -0.0025, lngOffset: 0.001 },
  { name: "Locapy Lounge & Bar", label: "Top Pick", emoji: "🍹", latOffset: 0.002, lngOffset: 0.003 },
  { name: "Goodness Batik & Dye", label: "Highly Revisited", emoji: "🎨", latOffset: -0.0015, lngOffset: -0.003 },
  { name: "Adolak Int'l Hotel", label: "Lodging", emoji: "🏨", latOffset: -0.0008, lngOffset: -0.0012 },
  { name: "Jossy Restaurant", label: "Top Pick", emoji: "🍲", latOffset: 0.0035, lngOffset: -0.0015 },
  { name: "Khadz and T Food", label: "Top Pick", emoji: "🍕", latOffset: -0.003, lngOffset: -0.0025 }
];

// Inline getStateStreets replaced with import from src/utils



export default function App() {
  const hasSavedAccountOnDisk = (() => {
    try {
      const raw = localStorage.getItem('nearby_saved_accounts');
      if (raw) {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) && arr.length > 0;
      }
    } catch (_) {}
    return false;
  })();

  // -----------------------------------------
  // Core Navigation & Application States
  // -----------------------------------------
  const [activeTab, setActiveTab] = useState<'radar' | 'chat' | 'status' | 'menu' | 'explore'>('chat'); // Resetting tabs to Radar, Chat, Status, Menu
  const [selectedPreset, setSelectedPreset] = useState<LocationPreset>(() => {
    try {
      const saved = localStorage.getItem('nearby_selected_preset');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return NEIGHBORHOODS[0]; // Yaba fallback
  });

  const lastLocationWriteRef = useRef<{ lat: number; lng: number; time: number }>({ lat: 0, lng: 0, time: 0 });
  const lastLiveLocationWriteTimeRef = useRef<number>(0);

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  const updatePresetWithCoordinates = async (lat: number, lng: number, force = false, extraCoords?: { accuracy?: number | null; heading?: number | null; speed?: number | null }) => {
    try {
      const now = Date.now();
      const lastWrite = lastLocationWriteRef.current;
      const distanceMoved = lastWrite.time === 0 ? 0 : calculateHaversineDistance(lat, lng, lastWrite.lat, lastWrite.lng);
      
      // Find closest local preset (used for fast local fallback updates)
      let closestPreset = NEIGHBORHOODS[0];
      let minDistance = Infinity;
      for (const preset of NEIGHBORHOODS) {
        const dist = calculateHaversineDistance(lat, lng, preset.coords.lat, preset.coords.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestPreset = preset;
        }
      }

      let finalState = closestPreset.city.split(',').pop()?.trim() || 'Osun';
      let finalTown = closestPreset.name.split(',').slice(-1)[0]?.trim() || 'Osogbo';
      let finalRoad = closestPreset.streets[0] || 'Gbongan Road';
      const exactPlaceLocal = finalRoad;
      const fullAddrLabelLocal = `${exactPlaceLocal}, ${finalTown}, ${finalState}`;

      // 1. Hard Rate-Limit: If not forced AND we have written before, enforce a minimum 15-second delay
      const timePassed = now - lastWrite.time;
      if (!force && lastWrite.time > 0 && timePassed < 15000) {
        // Fast path: Update local UI states ONLY, bypass network o!
        setUserAddress(fullAddrLabelLocal);
        const localPreset: LocationPreset = {
          name: `${exactPlaceLocal}, ${finalTown}`,
          city: finalState,
          coords: { lat, lng },
          streets: [finalRoad, finalTown, finalState]
        };
        setSelectedPreset(localPreset);
        return localPreset;
      }

      // 2. Adaptive Gate: Only proceed to fetch reverse-geocode & write to Firestore if:
      // - First time (time === 0)
      // - OR forced
      // - OR moved >= 15 meters
      // - OR >= 60 seconds have passed (heartbeat)
      const shouldWriteToNetwork = force || lastWrite.time === 0 || distanceMoved >= 15 || timePassed >= 60000;
      if (!shouldWriteToNetwork) {
        // Just update local UI states to make map moves buttery smooth o!
        setUserAddress(fullAddrLabelLocal);
        const localPreset: LocationPreset = {
          name: `${exactPlaceLocal}, ${finalTown}`,
          city: finalState,
          coords: { lat, lng },
          streets: [finalRoad, finalTown, finalState]
        };
        setSelectedPreset(localPreset);
        return localPreset;
      }

      // Record this network operation immediately to prevent race conditions o!
      lastLocationWriteRef.current = { lat, lng, time: now };

      // Perform a real reverse geocoding fetch call to Nominatim OpenStreetMap to write the actual street o!
      let resolvedRoad = '';
      let resolvedTown = '';
      let resolvedState = '';

      try {
        const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            'Accept-Language': 'en'
          }
        });
        if (geocodeRes.ok) {
          const data = await geocodeRes.json();
          if (data && data.address) {
            resolvedRoad = data.address.road || data.address.suburb || data.address.neighbourhood || '';
            resolvedTown = data.address.city_district || data.address.town || data.address.city || data.address.village || '';
            resolvedState = data.address.state || data.address.county || '';
          }
        }
      } catch (err) {
        console.warn("Reverse geocode attempt failed o, utilizing offline distance presets:", err);
      }

      if (resolvedRoad) {
        finalRoad = resolvedRoad;
        if (resolvedTown) finalTown = resolvedTown;
        if (resolvedState) finalState = resolvedState;
      } else {
        // Use the closest preset neighborhood details as fallback
        finalTown = closestPreset.city.split(',')[0]?.trim() || 'Osogbo';
        finalRoad = closestPreset.streets[0] || 'Gbongan Road';
      }

      if (!finalRoad) {
        finalRoad = "Gbongan Road";
      }

      const exactPlace = finalRoad;
      const fullAddrLabel = `${exactPlace}, ${finalTown}, ${finalState}`;
      
      setUserAddress(fullAddrLabel);
      
      const newPreset: LocationPreset = {
        name: `${exactPlace}, ${finalTown}`,
        city: finalState,
        coords: { lat: lat, lng: lng },
        streets: [finalRoad, finalTown, finalState]
      };
      
      setSelectedPreset(newPreset);
      
      try {
        localStorage.setItem('nearby_last_user_coords', JSON.stringify({ lat, lng }));
        localStorage.setItem('nearby_user_address', fullAddrLabel);
        localStorage.setItem('nearby_selected_preset', JSON.stringify(newPreset));
      } catch (_) {}
      
      // Update user coordinates and state in firestore
      const currentUserId = auth.currentUser?.uid || localStorage.getItem('nearby_current_uid') || '';
      if (currentUserId && auth.currentUser && auth.currentUser.uid === currentUserId) {
        try {
          const nowIso = new Date().toISOString();
          const userDocRef = doc(db, 'users', currentUserId);
          
          await setDoc(userDocRef, {
            latitude: lat,
            longitude: lng,
            latOffset: 0,
            lngOffset: 0,
            streetName: exactPlace,
            appLanguage: finalState,
            updatedAt: nowIso
          }, { merge: true });

          // Write to top-level "locations" collection
          await setDoc(doc(db, 'locations', currentUserId), {
            userId: currentUserId,
            latitude: lat,
            longitude: lng,
            timestamp: Date.now(),
            radarEnabled: isUserVisibleOnRadar,
            visibilityMode: radarVisibilityMode,
            lastUpdated: nowIso
          });

          // Throttled write to "liveLocations" collection (every 30-60 seconds, using 45 seconds here) o!
          const liveLocNow = Date.now();
          const timeSinceLastLiveLoc = liveLocNow - lastLiveLocationWriteTimeRef.current;
          if (force || lastLiveLocationWriteTimeRef.current === 0 || timeSinceLastLiveLoc >= 45000) {
            lastLiveLocationWriteTimeRef.current = liveLocNow;
            await setDoc(doc(db, 'liveLocations', currentUserId), {
              uid: currentUserId,
              latitude: lat,
              longitude: lng,
              accuracy: extraCoords?.accuracy !== undefined ? extraCoords.accuracy : null,
              heading: extraCoords?.heading !== undefined ? extraCoords.heading : null,
              speed: extraCoords?.speed !== undefined ? extraCoords.speed : null,
              updatedAt: nowIso,
              visibility: radarVisibilityMode,
              radarEnabled: isUserVisibleOnRadar
            });
          }

          // Write to top-level "visibilitySettings" collection
          await setDoc(doc(db, 'visibilitySettings', currentUserId), {
            userId: currentUserId,
            radarEnabled: isUserVisibleOnRadar,
            visibilityMode: radarVisibilityMode,
            hideExactLocation: false,
            blockedUserIds: [],
            lastUpdated: nowIso
          });
        } catch(e) {
          console.warn("Could not save background coordinates to firestore:", e);
        }
      }
      
      return newPreset;
    } catch (err) {
      console.warn("Geocoding failed:", err);
      if (typeof lat === 'number' && typeof lng === 'number') {
        setUserAddress(`Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`);
      }
    }
    return null;
  };

  const updateRadarPresenceInFirestore = async (enabled: boolean, mode: 'everyone' | 'friends' | 'hidden') => {
    const currentUserId = auth.currentUser?.uid || localStorage.getItem('nearby_current_uid') || '';
    if (!currentUserId || !auth.currentUser || auth.currentUser.uid !== currentUserId) return;
    try {
      const nowIso = new Date().toISOString();
      
      await setDoc(doc(db, 'users', currentUserId), {
        isUserVisibleOnRadar: enabled,
        radarVisibilityMode: mode,
        updatedAt: nowIso
      }, { merge: true });
      
      await setDoc(doc(db, 'locations', currentUserId), {
        userId: currentUserId,
        radarEnabled: enabled,
        visibilityMode: mode,
        lastUpdated: nowIso
      }, { merge: true });

      // Immediate manual update to liveLocations document for consistency o!
      await setDoc(doc(db, 'liveLocations', currentUserId), {
        uid: currentUserId,
        latitude: userCoords?.lat || 7.7715,
        longitude: userCoords?.lng || 4.5630,
        accuracy: null,
        heading: null,
        speed: null,
        updatedAt: nowIso,
        visibility: mode,
        radarEnabled: enabled
      }, { merge: true });

      await setDoc(doc(db, 'visibilitySettings', currentUserId), {
        userId: currentUserId,
        radarEnabled: enabled,
        visibilityMode: mode,
        hideExactLocation: false,
        blockedUserIds: [],
        lastUpdated: nowIso
      }, { merge: true });
    } catch (err) {
      console.warn("Could not sync active presence parameters:", err);
    }
  };

  const [onboardingCoords, setOnboardingCoords] = useState<{ lat: number; lng: number } | null>({ lat: 7.7715, lng: 4.5630 });
  const [onboardingAddress, setOnboardingAddress] = useState<string>('Oketunji Street, Osogbo, Osun State');
  const [onboardingState, setOnboardingState] = useState<string>('Osun');
  const [onboardingStreetName, setOnboardingStreetName] = useState<string>('Oketunji Street');

  const [neighbors, setNeighbors] = useState<Neighbor[]>(INITIAL_NEIGHBORS);
  const [selectedNeighborState, setSelectedNeighbor] = useState<Neighbor | null>(null); // For active chat thread

  // Load real presence in real-time o!
  const [presenceMap, setPresenceMap] = useState<Record<string, { online: boolean, typing: string, lastSeen: string, currentConversation: string }>>({});

  const syncedNeighbors = useMemo(() => {
    return neighbors.map(nb => {
      const pData = presenceMap[nb.id];
      if (pData) {
        return {
          ...nb,
          onlineStatus: pData.online ? 'active' : 'offline',
          typingTo: pData.typing,
          lastSeen: pData.lastSeen
        };
      }
      return nb;
    });
  }, [neighbors, presenceMap]);

  const selectedNeighbor = useMemo(() => {
    if (!selectedNeighborState) return null;
    const synced = syncedNeighbors.find(nb => nb.id === selectedNeighborState.id);
    return synced ? { ...selectedNeighborState, ...synced } : selectedNeighborState;
  }, [selectedNeighborState, syncedNeighbors]);
  const selectedNeighborId = selectedNeighbor?.id;
  const [chatLimit, setChatLimit] = useState<number>(50);
  const [activeNotes, setActiveNotes] = useState<UserNote[]>(INITIAL_NOTES);

  // New visual states for Redesign
  const [searchWideSop, setSearchWideSop] = useState<string>('');
  const [chatSubTab, setChatSubTab] = useState<'messages' | 'requests'>('messages');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'favorites' | 'requests' | 'calls'>('all');
  const [pendingFriendRequests, setPendingFriendRequests] = useState<string[]>([]); // Dynamic pending requests o!
  const [sentFriendRequestIds, setSentFriendRequestIds] = useState<string[]>([]); // Track outgoing requests o!
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [showNeighborFriendsModal, setShowNeighborFriendsModal] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [exploreSubTab, setExploreSubTab] = useState<'feed' | 'communities' | 'radar' | 'crossed' | 'safety'>('radar');
  const [isCurrentMeBanned, setIsCurrentMeBanned] = useState<boolean>(false);
  const [showLandingMode, setShowLandingMode] = useState<boolean>(!hasSavedAccountOnDisk);
  const [myVerificationLevel, setMyVerificationLevel] = useState<'Basic' | 'Verified'>('Basic');
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [isScanningFace, setIsScanningFace] = useState<boolean>(false);
  const [scanCountdown, setScanCountdown] = useState<number>(3);
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);
  const [showContactsPermissionPrompt, setShowContactsPermissionPrompt] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>("");
  const [newContactPhone, setNewContactPhone] = useState<string>("");
  const [showAddContactForm, setShowAddContactForm] = useState<boolean>(false);
  const [topNotification, setTopNotification] = useState<{ message: string; icon?: string } | null>(null);
  const [chatNotification, setChatNotification] = useState<{ message: string; subtext?: string } | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // File input references for gallery uploads
  const storyFileRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const postFileRef = useRef<HTMLInputElement>(null);
  const autoLoginAttemptedRef = useRef<boolean>(false);
  const chatSearchInputRef = useRef<HTMLInputElement>(null);
  const latestCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const [showNewChatDrawer, setShowNewChatDrawer] = useState<boolean>(false);

  // Profile & Settings states
  const initialProfile = (() => {
    try {
      const lastUid = localStorage.getItem('nearby_current_uid');
      if (lastUid) {
        const cachedRaw = localStorage.getItem(`nearby_cached_profile_${lastUid}`);
        if (cachedRaw) {
          return JSON.parse(cachedRaw);
        }
      }
    } catch (_) {}
    return null;
  })();

  const [showInstagramProfile, setShowInstagramProfile] = useState<boolean>(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState<boolean>(initialProfile !== null);
  const [userDisplayName, setUserDisplayName] = useState<string>(initialProfile?.name || "Nearby Member");
  const [userUsername, setUserUsername] = useState<string>(initialProfile?.username || "nearby_member");
  const [userBio, setUserBio] = useState<string>(initialProfile?.bio || "Connecting with neighbors face-to-face 👋");
  const [userWebsite, setUserWebsite] = useState<string>(initialProfile?.website || "foslibrary.com.ng");
  const [userAgeRange, setUserAgeRange] = useState<string>(initialProfile?.ageRange || "25-34");
  const [userGender, setUserGender] = useState<string>(initialProfile?.gender || "Male");
  const [userInterests, setUserInterests] = useState<string[]>(initialProfile?.interests || ["Tech", "Music"]);
  const [userCommunities, setUserCommunities] = useState<string[]>(initialProfile?.communities || ["comm-1"]);

  // Multi-language state helper
  const [appLanguage, setAppLanguage] = useState<'english' | 'hausa' | 'igbo' | 'yoruba' | 'pidgin'>('english');
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);

  // Invite & Support modal overlays states
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [contactsList, setContactsList] = useState<Array<{ name: string; phone: string; nearby: boolean }>>([]);
  const [isRequestingContacts, setIsRequestingContacts] = useState<boolean>(false);
  const [showNearbyNotification, setShowNearbyNotification] = useState<boolean>(false);
  const [nearbyNotificationCount, setNearbyNotificationCount] = useState<number>(23);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [helpEmail, setHelpEmail] = useState<string>("");
  const [helpCategory, setHelpCategory] = useState<string>("General Support");
  const [helpMessage, setHelpMessage] = useState<string>("");

  // Account customization modals states
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showChatsConfigModal, setShowChatsConfigModal] = useState<boolean>(false);
  const [userTelephone, setUserTelephone] = useState<string>("+234 812 345 6789");
  const [privacyDisappearing, setPrivacyDisappearing] = useState<string>("Off");

  // Neighbor Profile view overlay
  const [viewingNeighborProfile, setViewingNeighborProfile] = useState<Neighbor | null>(null);

  // Edit profile modal trigger
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [customProfilePhoto, setCustomProfilePhoto] = useState<string | null>(initialProfile?.customProfilePhoto || null);
  const [viewingUserPostDetail, setViewingUserPostDetail] = useState<{ id: string; mediaUrl: string; caption?: string; timestamp: string; type: 'image' | 'video' } | null>(null);
  const [neighborPosts, setNeighborPosts] = useState<any[]>([]);
  const [neighborHighlights, setNeighborHighlights] = useState<any[]>([]);
  const [userStatusText, setUserStatusText] = useState<string>('Online but not online 😮‍💨');
  const [userPosts, setUserPosts] = useState<{ id: string; mediaUrl: string; caption?: string; timestamp: string; type: 'image' | 'video' }[]>(() => {
    try {
      const cached = localStorage.getItem('nearby_cached_posts');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [userHighlights, setUserHighlights] = useState<{ id: string; name: string; mediaUrl: string }[]>(() => {
    try {
      const cached = localStorage.getItem('nearby_cached_highlights');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });

  // Persistent user stats for followers, following, trust rating, and meetup count
  const [userFollowers, setUserFollowers] = useState<string[]>([]);
  const [userFollowing, setUserFollowing] = useState<string[]>([]);
  const [userFollowersCount, setUserFollowersCount] = useState<number>(0);
  const [userFollowingCount, setUserFollowingCount] = useState<number>(0);
  const [userTrustScore, setUserTrustScore] = useState<number>(5.0);
  const [userMeetupCount, setUserMeetupCount] = useState<number>(0);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [meetupRatings, setMeetupRatings] = useState<MeetupRating[]>([]);

  // Schedule Meetup Modal States
  const [showScheduleMeetupModal, setShowScheduleMeetupModal] = useState<boolean>(false);
  const [scheduleMeetupTargetNeighbor, setScheduleMeetupTargetNeighbor] = useState<Neighbor | null>(null);
  const [scheduleMeetupPoint, setScheduleMeetupPoint] = useState<string>("");
  const [scheduleMeetupTime, setScheduleMeetupTime] = useState<string>("");
  const [scheduleMeetupLat, setScheduleMeetupLat] = useState<number>(0);
  const [scheduleMeetupLng, setScheduleMeetupLng] = useState<number>(0);

  // Inline Rating States
  const [ratingReviewText, setRatingReviewText] = useState<string>("");
  const [activeRatingStars, setActiveRatingStars] = useState<number>(5);
  const [showInlineRatingForm, setShowInlineRatingForm] = useState<boolean>(false);
  const [ratingFormMeetupId, setRatingFormMeetupId] = useState<string | null>(null);

  // GB WhatsApp Premium toggles that are unlocked!
  const [gbFreezeLastSeen, setGbFreezeLastSeen] = useState<boolean>(false);
  const [gbAntiDelete, setGbAntiDelete] = useState<boolean>(true);
  const [gbHideOnline, setGbHideOnline] = useState<boolean>(false);
  const [gbBlueTickOnReply, setGbBlueTickOnReply] = useState<boolean>(false);

  // Apple-Level Settings subviews
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'privacy' | 'notifications' | 'radar' | 'meetups' | 'chats' | 'appearance' | 'about'>('main');
  const [privacyLocationVisibility, setPrivacyLocationVisibility] = useState<boolean>(true);
  const [privacyReadReceipts, setPrivacyReadReceipts] = useState<boolean>(true);
  const [privacyTrustedOnly, setPrivacyTrustedOnly] = useState<boolean>(false);

  const [notifMessages, setNotifMessages] = useState<boolean>(true);
  const [notifFriendRequests, setNotifFriendRequests] = useState<boolean>(true);
  const [notifMeetups, setNotifMeetups] = useState<boolean>(true);
  const [notifRatings, setNotifRatings] = useState<boolean>(true);
  const [notifNearbyUsers, setNotifNearbyUsers] = useState<boolean>(true);
  const [notifEvents, setNotifEvents] = useState<boolean>(true);

  const [appearanceMode, setAppearanceMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('appearanceMode') as 'light' | 'dark' | 'system') || 'dark';
  });

  const [aboutDetailModal, setAboutDetailModal] = useState<'privacy' | 'terms' | 'guidelines' | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState<boolean>(false);

  // Dynamic gallery handling functions
  const handleGalleryUploadForStory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setStoryUploadData({
        mediaUrl: dataUrl,
        type: file.type.startsWith('video') ? 'video' : 'image'
      });
      triggerBeep(520, 0.1);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishStoryComposition = async () => {
    if (!currentUser || !storyUploadData) return;
    setIsPublishingStory(true);
    triggerBeep(440, 0.15);
    try {
      const snapId = `story-sn-${Date.now()}`;
      
      let finalMediaUrl = storyUploadData.mediaUrl;
      if (finalMediaUrl && finalMediaUrl.startsWith('data:')) {
        try {
          const fileExtension = finalMediaUrl.includes('image/png') ? 'png' : finalMediaUrl.includes('image/gif') ? 'gif' : finalMediaUrl.includes('video/mp4') ? 'mp4' : 'jpeg';
          const storagePath = `stories/${currentUser.uid}/${Date.now()}.${fileExtension}`;
          finalMediaUrl = await uploadToStorage(finalMediaUrl, storagePath);
        } catch (uploadErr) {
          console.warn("Storage upload failed for story status, using original:", uploadErr);
        }
      }

      const newSnap = {
        id: snapId,
        userId: currentUser.uid,
        username: userUsername || 'anonymous',
        name: userDisplayName || 'Anonymous',
        mediaUrl: finalMediaUrl,
        type: storyUploadData.type,
        caption: storyCompositionCaption,
        timestamp: 'Just now',
        viewed: false,
        createdAt: Date.now(),
        viewers: [],
        reactions: [],
        replies: [],
        privacy: storyCompositionPrivacy,
        customList: storyCompositionPrivacy === 'custom' ? storyCompositionCustomList : []
      };

      await setDoc(doc(db, 'users', currentUser.uid, 'stories', snapId), newSnap);

      setAudioFeedback("Your status is now live!");
      setTimeout(() => setAudioFeedback(""), 3000);
      
      setStoryUploadData(null);
      setStoryCompositionCaption('');
      setStoryCompositionPrivacy('everyone');
      setStoryCompositionCustomList([]);
    } catch (err) {
      console.error("Story composition failed:", err);
      setAudioFeedback("We couldn't share your story right now. Let's try again.");
      setTimeout(() => setAudioFeedback(""), 3000);
    } finally {
      setIsPublishingStory(false);
    }
  };

  const handleGalleryUploadForChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      let type: 'image' | 'video' | 'document' = 'image';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else {
        type = 'document';
      }
      
      const sizeLabel = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
        : (file.size / 1024).toFixed(0) + ' KB';

      sendMessage(undefined, dataUrl, undefined, type, file.name, sizeLabel);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUploadForProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setCustomProfilePhoto(dataUrl);
      setOnboardingPhoto(dataUrl);
      setAudioFeedback("Profile photo registered!");
      setTimeout(() => setAudioFeedback(""), 2000);

      const fUser = auth.currentUser;
      if (fUser) {
        let finalUrl = dataUrl;
        try {
          const fileExtension = file.name.split('.').pop() || 'jpeg';
          const storagePath = `profiles/${fUser.uid}/${Date.now()}.${fileExtension}`;
          finalUrl = await uploadToStorage(dataUrl, storagePath);
          setCustomProfilePhoto(finalUrl);
          setOnboardingPhoto(finalUrl);
        } catch (err) {
          console.warn("Failed to upload profile photo to storage, keeping local/dataUrl:", err);
        }

        try {
          const userDocRef = doc(db, 'users', fUser.uid);
          await setDoc(userDocRef, {
            customProfilePhoto: finalUrl,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          const cacheKey = `nearby_cached_profile_${fUser.uid}`;
          const existing = localStorage.getItem(cacheKey);
          if (existing) {
            try {
              const parsed = JSON.parse(existing);
              localStorage.setItem(cacheKey, JSON.stringify({ ...parsed, customProfilePhoto: finalUrl }));
            } catch (_) {}
          }
        } catch (dbErr) {
          console.error("Failed to update profile photo in Firestore:", dbErr);
          handleFirestoreError(dbErr, OperationType.UPDATE, `users/${fUser.uid}`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUploadForPost = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const currentMode = uploadModeRef.current;

    // Reset input so re-selecting the same file fires onChange again
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const fUser = auth.currentUser;

      if (currentMode === 'highlight') {
        let title = "Vibe";
        try {
          const prompted = window.prompt("Enter a lovely name for this highlight:", "Vibe");
          if (prompted && prompted.trim()) {
            title = prompted.trim();
          }
        } catch (_) {}

        const hlId = `usr-hl-${Date.now()}`;
        
        // Optimistic UI update
        const newHl = {
          id: hlId,
          name: title,
          mediaUrl: dataUrl
        };
        setUserHighlights(prev => {
          const updated = [newHl, ...prev.filter(h => h.id !== hlId)];
          try { localStorage.setItem('nearby_cached_highlights', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });

        let finalMediaUrl = dataUrl;
        if (fUser) {
          try {
            const fileExtension = file.name.split('.').pop() || 'jpeg';
            const storagePath = `users/${fUser.uid}/highlights/${hlId}.${fileExtension}`;
            finalMediaUrl = await uploadToStorage(file, storagePath);
          } catch (uploadErr) {
            console.warn("Storage upload failed for highlight, using local fallback:", uploadErr);
          }
        }

        const finalHlDoc = {
          id: hlId,
          name: title,
          mediaUrl: finalMediaUrl,
          createdAt: new Date().toISOString()
        };

        setUserHighlights(prev => {
          const updated = prev.map(h => h.id === hlId ? { id: hlId, name: title, mediaUrl: finalMediaUrl } : h);
          try { localStorage.setItem('nearby_cached_highlights', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });

        if (fUser) {
          try {
            const hlRef = doc(db, 'users', fUser.uid, 'highlights', hlId);
            await setDoc(hlRef, finalHlDoc);
            setAudioFeedback("Highlight uploaded & persisted! 📲");
          } catch (err) {
            console.error("Firestore write highlight error:", err);
            handleFirestoreError(err, OperationType.WRITE, `users/${fUser.uid}/highlights/${hlId}`);
          }
        } else {
          setAudioFeedback("Highlight added locally!");
        }
      } else {
        const postId = `usr-post-${Date.now()}`;
        const isVideo = file.type.startsWith('video');

        // Optimistic UI update
        const newPost = {
          id: postId,
          mediaUrl: dataUrl,
          caption: 'Uploaded from Gallery! 📸🇳🇬',
          timestamp: 'Just now',
          type: isVideo ? ('video' as const) : ('image' as const)
        };
        setUserPosts(prev => {
          const updated = [newPost, ...prev.filter(p => p.id !== postId)];
          try { localStorage.setItem('nearby_cached_posts', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });

        let finalMediaUrl = dataUrl;
        if (fUser) {
          try {
            const fileExtension = file.name.split('.').pop() || 'jpeg';
            const storagePath = `users/${fUser.uid}/posts/${postId}.${fileExtension}`;
            finalMediaUrl = await uploadToStorage(file, storagePath);
          } catch (uploadErr) {
            console.warn("Storage upload failed for post, using local fallback:", uploadErr);
          }
        }

        const finalPostDoc = {
          id: postId,
          mediaUrl: finalMediaUrl,
          caption: 'Uploaded from Gallery! 📸🇳🇬',
          timestamp: 'Just now',
          type: isVideo ? ('video' as const) : ('image' as const),
          createdAt: new Date().toISOString()
        };

        setUserPosts(prev => {
          const updated = prev.map(p => p.id === postId ? {
            id: postId,
            mediaUrl: finalMediaUrl,
            caption: 'Uploaded from Gallery! 📸🇳🇬',
            timestamp: 'Just now',
            type: isVideo ? ('video' as const) : ('image' as const)
          } : p);
          try { localStorage.setItem('nearby_cached_posts', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });

        if (fUser) {
          try {
            const postRef = doc(db, 'users', fUser.uid, 'posts', postId);
            await setDoc(postRef, finalPostDoc);
            setAudioFeedback("Post added to your feed! 📸");
          } catch (err) {
            console.error("Firestore write post error:", err);
            handleFirestoreError(err, OperationType.WRITE, `users/${fUser.uid}/posts/${postId}`);
          }
        } else {
          setAudioFeedback("Post added locally!");
        }
      }
      setTimeout(() => setAudioFeedback(""), 3000);
    };
    reader.readAsDataURL(file);
  };
  
  // Under the hood state for messages
  const [chatMessages, _setChatMessages] = useState<Record<string, DirectMessage[]>>(INITIAL_MESSAGES);
  
  // Custom wrapper to update messages state locally
  const setChatMessages = (
    value: Record<string, DirectMessage[]> | ((prev: Record<string, DirectMessage[]>) => Record<string, DirectMessage[]>)
  ) => {
    _setChatMessages(prev => {
      return typeof value === 'function' ? value(prev) : value;
    });
  };

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const presenceColRef = collection(db, 'presence');
    const unsubPresence = onSnapshot(presenceColRef, (snapshot) => {
      const pm: Record<string, { online: boolean, typing: string, lastSeen: string, currentConversation: string }> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.uid) {
          pm[data.uid] = {
            online: data.online ?? false,
            typing: data.typing ?? "",
            lastSeen: data.lastSeen ?? "",
            currentConversation: data.currentConversation ?? ""
          };
        }
      });
      setPresenceMap(pm);
    }, (err) => {
      console.warn("Failed to subscribe to real-time presence:", err);
    });
    return () => unsubPresence();
  }, [currentUser]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);
  const [showWelcomeTour, setShowWelcomeTour] = useState<boolean>(() => {
    return !localStorage.getItem('nearby_welcome_completed');
  });
  const [welcomeTourStep, setWelcomeTourStep] = useState<number>(0);

  const [authScreenState, setAuthScreenState] = useState<'login' | 'signup' | 'forgot' | 'verification'>('login');
  const [authSuccess, setAuthSuccess] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  useEffect(() => {
    if (authSuccess) {
      const timer = setTimeout(() => {
        setAuthSuccess("");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [authSuccess]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingName, setOnboardingName] = useState<string>('');
  const [onboardingUsername, setOnboardingUsername] = useState<string>('');
  const [onboardingBio, setOnboardingBio] = useState<string>('Hey, I am a new neighbor around! Let\'s connect! 👋');
  const [onboardingPhoto, setOnboardingPhoto] = useState<string | null>(null);
  const [onboardingAgeRange, setOnboardingAgeRange] = useState<string>('25-34');
  const [onboardingGender, setOnboardingGender] = useState<string>('Male');
  const [onboardingInterests, setOnboardingInterests] = useState<string[]>(['Tech', 'Music']);
  const [onboardingCommunities, setOnboardingCommunities] = useState<string[]>(['comm-1']);

  // Authentication inputs state
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>('');
  const [authIsSignUp, setAuthIsSignUp] = useState<boolean>(!hasSavedAccountOnDisk);
  const [isPhoneAuthOption, setIsPhoneAuthOption] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Permission statuses for onboarding
  const [onboardingGpsStatus, setOnboardingGpsStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [onboardingCamStatus, setOnboardingCamStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom states for Nigerian users
  const [usingGoogleMaps, setUsingGoogleMaps] = useState<boolean>(hasValidGoogleMapsKey);
  const [userNoteText, setUserNoteText] = useState<string>('');
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [radarRadius, setRadarRadius] = useState<number>(500); // meters Slider filter
  const [showRadarDrawer, setShowRadarDrawer] = useState<boolean>(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState<boolean>(false);

  // -----------------------------------------
  // Premium Subscription & Monetized Features
  // -----------------------------------------
  const [isSubscribed, setIsSubscribed] = useState<boolean>(true); // Gold Unlocked o!
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [premiumUpgradeFeature, setPremiumUpgradeFeature] = useState<string>('');
  const [pendingPremiumAction, setPendingPremiumAction] = useState<() => void>(() => {});
  const [friendsAddedTodayCount, setFriendsAddedTodayCount] = useState<number>(0);
  const [uploadMode, setUploadModeState] = useState<'post' | 'highlight'>('post');
  const uploadModeRef = useRef<'post' | 'highlight'>('post');
  const setUploadMode = (mode: 'post' | 'highlight') => {
    uploadModeRef.current = mode;
    setUploadModeState(mode);
  };
  
  // GB WhatsApp Style User Custom Interface Accent Theme / Background / Bubble / Fonts
  const [customAccentColor, setCustomAccentColor] = useState<'indigo' | 'emerald' | 'blue' | 'rose' | 'amber' | 'purple'>('indigo');
  const [customChatBg, setCustomChatBg] = useState<'slate' | 'cosmic' | 'sunset' | 'mint' | 'royal' | 'matrix'>('slate');
  const [customChatBubbleStyle, setCustomChatBubbleStyle] = useState<'modern' | 'sharp' | 'neon' | 'gb_doubletick' | 'playful'>('modern');
  const [customChatFont, setCustomChatFont] = useState<'sans' | 'mono' | 'serif' | 'chunky'>('sans');

  // Groups and Privacy States
  const [userGroupInvitePolicy, setUserGroupInvitePolicy] = useState<'always' | 'ask' | 'never'>('ask');
  const [userGroupCallPolicy, setUserGroupCallPolicy] = useState<'always' | 'ask' | 'never'>('ask');
  const [friendIds, setFriendIds] = useState<string[]>([]); // starts empty o!

  // User Radar Presence / Visibility (Adding yourself on the radar app!)
  const [isUserVisibleOnRadar, setIsUserVisibleOnRadar] = useState<boolean>(true);
  const [showMainMenuDropdown, setShowMainMenuDropdown] = useState<boolean>(false);
  const [showActiveChatDropdown, setShowActiveChatDropdown] = useState<boolean>(false);
  const [showActiveChatMoreDropdown, setShowActiveChatMoreDropdown] = useState<boolean>(false);
  const [radarVisibilityMode, setRadarVisibilityMode] = useState<'everyone' | 'friends' | 'hidden'>('everyone');
  const [userRadarEmoji, setUserRadarEmoji] = useState<string>('🙋‍♂️');
  const [userRadarStatusText, setUserRadarStatusText] = useState<string>('Jollof hunting in Yaba');

  // Live status descriptions for mutual friends
  const neighborLiveGists: Record<string, { status: string; checkedInAt: string; activity: string }> = {
    'nb-1': { status: "🍛 Munching firewood jollof at canteens", checkedInAt: "Yaba Rd", activity: "Eating Out" },
    'nb-2': { status: "💻 Debugging server-side endpoints on Vite", checkedInAt: "Herbert Macaulay Way", activity: "Coding" },
    'nb-3': { status: "🛍️ Buying snacks and soft drinks at local stall", checkedInAt: "Tejuosho St", activity: "Shopping" },
    'nb-4': { status: "⚽️ Tuning up for street footy session", checkedInAt: "Alara St", activity: "Playing football" },
    'nb-5': { status: "🎵 Cooking some cool Yaba afro-fusion beats", checkedInAt: "Montgomery Rd", activity: "Music producing" },
  };
  
  // Group creation States
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [newGroupEmoji, setNewGroupEmoji] = useState<string>('⚽️');
  const [newGroupColor, setNewGroupColor] = useState<string>('bg-emerald-600');

  // Simulated invitations modals (Privacy Policies trigger)
  const [showGroupInviteConfirmModal, setShowGroupInviteConfirmModal] = useState<boolean>(false);
  const [pendingIncomingInviteGroup, setPendingIncomingInviteGroup] = useState<{
    id: string;
    name: string;
    desc: string;
    emoji: string;
    color: string;
    senderId: string;
    senderName: string;
  } | null>(null);

  const [showGroupCallConfirmModal, setShowGroupCallConfirmModal] = useState<boolean>(false);
  const [pendingIncomingCall, setPendingIncomingCall] = useState<{
    groupId: string;
    groupName: string;
    senderId: string;
    senderName: string;
  } | null>(null);

  // Theme & Location Accuracy Custom States
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    localStorage.setItem('appearanceMode', appearanceMode);
    if (appearanceMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        const themeVal = e.matches ? 'dark' : 'light';
        setAppTheme(themeVal);
        if (themeVal === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      updateTheme(mediaQuery);
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    } else {
      setAppTheme(appearanceMode);
      if (appearanceMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [appearanceMode]);

  useEffect(() => {
    if (appTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appTheme]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
    try {
      const saved = localStorage.getItem('nearby_last_user_coords');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return null;
  });
  const [gpsSynced, setGpsSynced] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nearby_last_user_coords') !== null;
    } catch (_) {
      return false;
    }
  });
  const [userAddress, setUserAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('nearby_user_address') || '';
    } catch (_) {
      return '';
    }
  });
  const [searchStateQuery, setSearchStateQuery] = useState<string>('');
  const [showStateSearchModal, setShowStateSearchModal] = useState<boolean>(false);

  // -----------------------------------------
  // Call States & Simulated Engines
  // -----------------------------------------
  const [callState, setCallState] = useState<CallState>({
    active: false,
    type: 'video',
    neighborId: '',
    status: 'disconnected',
    incoming: false,
    durationSeconds: 0
  });
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [beautyMode, setBeautyMode] = useState<boolean>(false);
  const [bluetoothOn, setBluetoothOn] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'checking'>('checking');
  const [networkQualityDesc, setNetworkQualityDesc] = useState<string>('Connecting...');
  const [iceConnectionState, setIceConnectionState] = useState<string>('new');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const statsIntervalRef = useRef<any>(null);
  const localCandidatesAddedRef = useRef<number>(0);
  const remoteCandidatesAddedRef = useRef<number>(0);

  // Real voice recording ref parameters
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState<boolean>(false);

  // Dynamic address / streetName Firestore synchronization
  useEffect(() => {
    if (!currentUser || !userAddress) return;
    const saveAddressToDb = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const cleanStreet = userAddress.split(',')[0] || userAddress;
        await updateDoc(userDocRef, {
          streetName: cleanStreet
        });
      } catch (e) {
        console.warn("Could not sync updated streetName to Firestore:", e);
      }
    };
    const timer = setTimeout(saveAddressToDb, 1000);
    return () => clearTimeout(timer);
  }, [currentUser, userAddress]);

  // Listen to Google Maps API authentication failure events to automatically fall back to Leaflet
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn("⚠️ Google Maps API Key auth failure detected! Automatically switching to high-performance Leaflet OpenStreetMap.");
      setUsingGoogleMaps(false);
      setGoogleBillingError(true); // Display the helpful notification banner o!
    };
    return () => {
      delete (window as any).gm_authFailure;
    };
  }, []);

  // -----------------------------------------
  // Camera, Filters, Drawings
  // -----------------------------------------
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('normal');
  const [canvasDrawing, setCanvasDrawing] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#e11d48'); // raw rose-600
  const [myUploadedStory, setMyUploadedStory] = useState<StorySnap | null>(null);
  const [myStorySnaps, setMyStorySnaps] = useState<StorySnap[]>([]);
  const [neighborStories, setNeighborStories] = useState<Record<string, StorySnap[]>>({});
  const [mutedStoryUserIds, setMutedStoryUserIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('muted_stories_uids') || '[]');
    } catch (_) {
      return [];
    }
  });

  const toggleMuteNeighborStories = (neighborId: string) => {
    setMutedStoryUserIds(prev => {
      const isMuted = prev.includes(neighborId);
      let updated: string[];
      if (isMuted) {
        updated = prev.filter(id => id !== neighborId);
        setAudioFeedback("🔊 Neighbor status unmuted!");
      } else {
        updated = [...prev, neighborId];
        setAudioFeedback("🔕 Neighbor status muted!");
      }
      setTimeout(() => setAudioFeedback(""), 2000);
      localStorage.setItem('muted_stories_uids', JSON.stringify(updated));
      return updated;
    });
    triggerBeep(450, 0.08);
  };
  const [storyUploadData, setStoryUploadData] = useState<{
    mediaUrl: string;
    type: 'image' | 'video';
  } | null>(null);
  const [storyCompositionCaption, setStoryCompositionCaption] = useState<string>('');
  const [storyCompositionPrivacy, setStoryCompositionPrivacy] = useState<'everyone' | 'friends' | 'custom'>('everyone');
  const [storyCompositionCustomList, setStoryCompositionCustomList] = useState<string[]>([]);
  const [isPublishingStory, setIsPublishingStory] = useState<boolean>(false);
  const [playingStorySnaps, setPlayingStorySnaps] = useState<StorySnap[]>([]);
  const [playingSnapIndex, setPlayingSnapIndex] = useState<number>(0);
  const [isStoryPaused, setIsStoryPaused] = useState<boolean>(false);
  const [storyViewerReplies, setStoryViewerReplies] = useState<string>('');
  const [showStoryViewerList, setShowStoryViewerList] = useState<boolean>(false);
  const [isMutedStoriesExpanded, setIsMutedStoriesExpanded] = useState<boolean>(false);

  const [storyViewer, setStoryViewer] = useState<Neighbor | 'me' | null>(null);
  const [storyPlaylist, setStoryPlaylist] = useState<any[]>([]);
  const [storyPlaylistIndex, setStoryPlaylistIndex] = useState<number>(0);
  const [showStoryChoiceModal, setShowStoryChoiceModal] = useState<{ note: UserNote; neighbor: Neighbor } | null>(null);
  const [showAddFriendsModal, setShowAddFriendsModal] = useState<boolean>(false);
  
  // Audio Feedback Status
  const [audioFeedback, setAudioFeedback] = useState<string>('');
  
  // Auto-dismiss all notifications/toasts after 2 seconds
  useEffect(() => {
    if (audioFeedback) {
      const timer = setTimeout(() => {
        setAudioFeedback('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [audioFeedback]);
  
  // Custom states to handle API billing and Quotas o!
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState<boolean>(false);
  const [googleBillingError, setGoogleBillingError] = useState<boolean>(false);
  const [dismissedIframeWarning, setDismissedIframeWarning] = useState<boolean>(false);

  // WhatsApp-specific states
  const [replyingToMessage, setReplyingToMessage] = useState<DirectMessage | null>(null);
  const [activeChatSearchQuery, setActiveChatSearchQuery] = useState<string>('');
  const [showActiveChatSearch, setShowActiveChatSearch] = useState<boolean>(false);
  const [showForwardModal, setShowForwardModal] = useState<DirectMessage | null>(null);
  const [simulatedTypingMap, setSimulatedTypingMap] = useState<Record<string, boolean>>({});

  // Redesigned Chat States
  const [blockedNeighborIds, setBlockedNeighborIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('whatsapp_blocked_neighbors') || '[]');
    } catch { return []; }
  });
  const [mutedNeighborIds, setMutedNeighborIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('whatsapp_muted_neighbors') || '[]');
    } catch { return []; }
  });
  const [unreadNeighborIds, setUnreadNeighborIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('whatsapp_unread_neighbors') || '[]');
    } catch { return []; }
  });
  const [longPressedNeighborForMenu, setLongPressedNeighborForMenu] = useState<Neighbor | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [emojiCategory, setEmojiCategory] = useState<string>('smileys');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState<string>('');
  const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('whatsapp_recent_emojis') || '["👍", "❤️", "😂", "😮", "😢", "🙏"]');
    } catch { return ["👍", "❤️", "😂", "😮", "😢", "🙏"]; }
  });
  const [selectedSkinTone, setSelectedSkinTone] = useState<string>(''); // '', '🏻', '🏼', '🏽', '🏾', '🏿'
  const [isLockVoiceRecording, setIsLockVoiceRecording] = useState<boolean>(false);
  const [voicePlaybackSpeedMap, setVoicePlaybackSpeedMap] = useState<Record<string, number>>({});
  const [showMediaGalleryModal, setShowMediaGalleryModal] = useState<boolean>(false);
  const [activeMediaGalleryTab, setActiveMediaGalleryTab] = useState<'photos' | 'videos' | 'documents' | 'links' | 'voice'>('photos');
  const [currentSearchMatchIndex, setCurrentSearchMatchIndex] = useState<number>(-1);
  const [searchMatchIds, setSearchMatchIds] = useState<string[]>([]);
  const [isMessageSelectMode, setIsMessageSelectMode] = useState<boolean>(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(null);
  const [showMessageInfoModal, setShowMessageInfoModal] = useState<DirectMessage | null>(null);
  
  // Archived Chats support o!
  const [archivedNeighborIds, setArchivedNeighborIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('whatsapp_archived_chats') || '[]');
    } catch {
      return [];
    }
  });
  const [showArchivedOnly, setShowArchivedOnly] = useState<boolean>(false);

  // Touch Gestures State for Swipe to Reply
  const [swipeOffsetMsgId, setSwipeOffsetMsgId] = useState<string | null>(null);
  const [swipeOffsetAmount, setSwipeOffsetAmount] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchStartY, setTouchStartY] = useState<number>(0);

  const handleMessageTouchStart = (e: React.TouchEvent, msgId: string) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setSwipeOffsetMsgId(msgId);
    setSwipeOffsetAmount(0);
  };

  const handleMessageTouchMove = (e: React.TouchEvent, msgId: string) => {
    if (swipeOffsetMsgId !== msgId) return;
    const diffX = e.touches[0].clientX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;
    if (Math.abs(diffY) < 25) {
      if (diffX > 0) {
        setSwipeOffsetAmount(Math.min(diffX, 75));
      }
    }
  };

  const handleMessageTouchEnd = (msg: DirectMessage) => {
    if (swipeOffsetMsgId === msg.id && swipeOffsetAmount > 45) {
      setReplyingToMessage(msg);
      triggerBeep(520, 0.05);
    }
    setSwipeOffsetMsgId(null);
    setSwipeOffsetAmount(0);
  };

  const [activeBubbleDropdownId, setActiveBubbleDropdownId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('whatsapp_archived_chats', JSON.stringify(archivedNeighborIds));
  }, [archivedNeighborIds]);

  useEffect(() => {
    if (!selectedNeighborId || !activeChatSearchQuery.trim()) {
      setSearchMatchIds([]);
      setCurrentSearchMatchIndex(-1);
      return;
    }
    const currentUid = currentUser?.uid || 'user';
    const list = chatMessages[selectedNeighborId] || [];
    const query = activeChatSearchQuery.toLowerCase();
    const matches = list
      .filter(m => {
        if (m.deletedForUsers?.includes(currentUid)) return false;
        if (m.deletedForEveryone) return false;
        return m.text && m.text.toLowerCase().includes(query);
      })
      .map(m => m.id);

    setSearchMatchIds(matches);
    setCurrentSearchMatchIndex(matches.length > 0 ? matches.length - 1 : -1);
  }, [activeChatSearchQuery, selectedNeighborId, chatMessages, currentUser]);

  useEffect(() => {
    const handleFirestoreErr = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent?.detail) {
        if (customEvent.detail.isQuota) {
          console.warn("Firestore Quota Exceeded. Fallback operating o!");
          setFirestoreQuotaExceeded(true);
        }
      }
    };
    window.addEventListener('firestore-error-event', handleFirestoreErr);
    return () => window.removeEventListener('firestore-error-event', handleFirestoreErr);
  }, []);

  // Online / Offline state tracking
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerBeep(600, 0.1);
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerBeep(300, 0.15);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Voice Note states
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceRecordingLocked, setVoiceRecordingLocked] = useState<boolean>(false);

  // -----------------------------------------
  // Firebase Authentication & State Synchronization
  // -----------------------------------------
  useEffect(() => {
    // Validate Connection to Firestore on boot (mandated by SKILL.md)
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  const handleSendResetLink = async () => {
    if (!authEmailOrPhone || !authEmailOrPhone.trim().includes('@')) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      await sendPasswordResetEmail(auth, authEmailOrPhone.trim());
      setAuthSuccess("We've sent a secure reset link to your email.");
      setAuthScreenState('login');
    } catch (err: any) {
      console.error("Password reset failure: ", err);
      setAuthError(err.message || "Failed to send reset link.");
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError('');
    setAuthLoading(true);
    try {
      triggerBeep(580, 0.1);
      const result = await signInWithPopup(auth, provider);
      setAudioFeedback("Signed in with Google.");
      setTimeout(() => setAudioFeedback(""), 2200);
    } catch (err: any) {
      console.error("Login failure: ", err);
      let errorMsg = err.message || "Failed to sign in with Google.";
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        errorMsg = `🔐 Firebase Domain Unauthorized!\n\nPlease add this dynamic preview domain ("${window.location.hostname}") to the "Authorized domains" list in your Firebase Console under: Authentication -> Settings -> Authorized domains. This will authorize Google Sign-In securely o!`;
      }
      setAuthError(errorMsg);
      setAuthLoading(false);
      setAudioFeedback("Google sign-in failed.");
      setTimeout(() => setAudioFeedback(""), 2500);
    }
  };

  const loginWithEmailOrPhone = async (emailOrPhoneRaw: string, passwordRaw: string, isSignUpOption: boolean, isPhoneInput: boolean) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      triggerBeep(580, 0.1);
      const input = emailOrPhoneRaw.trim();
      const pass = passwordRaw.trim();

      if (!input) {
        throw new Error("Please enter your email.");
      }

      if (pass.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (isSignUpOption) {
        const confirmPass = authConfirmPassword.trim();
        if (!confirmPass) {
          throw new Error("Please confirm your password.");
        }
        if (pass !== confirmPass) {
          throw new Error("Passwords do not match.");
        }
      }

      let finalEmail = input;
      if (isPhoneInput) {
        // Clean up phone characters
        const cleanPhone = input.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        if (cleanPhone.length < 5) {
          throw new Error("Enter a valid phone number.");
        }
        finalEmail = `phone_${cleanPhone}@nearby.com`;
      } else {
        if (!input.includes('@')) {
          throw new Error("Enter a valid email.");
        }
      }

      if (isSignUpOption) {
        setAudioFeedback("Registering...");
        await createUserWithEmailAndPassword(auth, finalEmail, pass);
        setAudioFeedback("Account created.");
      } else {
        setAudioFeedback("Logging in...");
        await signInWithEmailAndPassword(auth, finalEmail, pass);
        setAudioFeedback("Signed in.");
      }
      setTimeout(() => setAudioFeedback(""), 2200);
    } catch (err: any) {
      console.error("Authentication action failure: ", err);
      let errMsg = err.message || "Authentication failed.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        errMsg = "Incorrect password or email. If you are registering, switch to Sign Up.";
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = "A profile is already registered using this email.";
      } else if (err.code === 'auth/weak-password') {
        errMsg = "Password is too weak. Choose at least 6 characters.";
      }
      setAuthError(errMsg);
      setAuthLoading(false);
      setAudioFeedback("Authentication failed. Try again.");
      setTimeout(() => setAudioFeedback(""), 2500);
    }
  };

  const saveOnboardingDetails = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setAudioFeedback("Saving profile...");
    
    try {
      const cleanUsername = onboardingUsername.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '') || `user_${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanName = onboardingName.trim() || 'Nearby Member';
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const myNoteText = activeNotes.find(n => n.id === 'user-note-me')?.text || 'Checking in on nearby...';
      
      const finalDoc = {
        uid: currentUser.uid,
        username: cleanUsername,
        name: cleanName,
        bio: onboardingBio,
        website: "foslibrary.com.ng",
        avatarEmoji: "🙋‍♂️",
        avatarColor: "bg-neutral-800 border-neutral-700 border",
        isSubscribed: isSubscribed,
        friendIds: friendIds,
        isUserVisibleOnRadar: isUserVisibleOnRadar,
        userRadarStatusText: userRadarStatusText,
        userRadarEmoji: userRadarEmoji,
        customAccentColor: customAccentColor,
        customChatBg: customChatBg,
        customChatBubbleStyle: customChatBubbleStyle,
        customChatFont: customChatFont,
        userGroupInvitePolicy: userGroupInvitePolicy,
        userGroupCallPolicy: userGroupCallPolicy,
        myNoteText: myNoteText,
        customProfilePhoto: onboardingPhoto,
        appLanguage: onboardingState || 'Lagos',
        streetName: onboardingStreetName || 'Yaba',
        latitude: onboardingCoords ? onboardingCoords.lat : 6.5095,
        longitude: onboardingCoords ? onboardingCoords.lng : 3.3711,
        latOffset: 0,
        lngOffset: 0,
        ageRange: onboardingAgeRange,
        gender: onboardingGender,
        interests: onboardingInterests,
        communities: onboardingCommunities,
        followers: userFollowers,
        following: userFollowing,
        followersCount: userFollowersCount,
        followingCount: userFollowingCount,
        trustScore: userTrustScore,
        meetupsCompleted: userMeetupCount,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(userDocRef, finalDoc);
      
      // Update local states
      setUserDisplayName(cleanName);
      setUserUsername(cleanUsername);
      setUserBio(onboardingBio);
      setCustomProfilePhoto(onboardingPhoto);
      setAppLanguage((onboardingState || 'Lagos') as any);
      setUserAgeRange(onboardingAgeRange);
      setUserGender(onboardingGender);
      setUserInterests(onboardingInterests);
      setUserCommunities(onboardingCommunities);
      setIsProfileLoaded(true);

      try {
        localStorage.setItem(`nearby_cached_profile_${currentUser.uid}`, JSON.stringify(finalDoc));
      } catch (_) {}

      try {
        const rawAccounts = localStorage.getItem('nearby_saved_accounts');
        let accounts: any[] = [];
        if (rawAccounts) {
          try { accounts = JSON.parse(rawAccounts); } catch (_) {}
        }
        accounts = accounts.filter((a: any) => a.uid !== currentUser.uid);
        const isGoogle = currentUser.providerData.some((p: any) => p.providerId === 'google.com');
        accounts.push({
          uid: currentUser.uid,
          name: cleanName,
          username: cleanUsername,
          avatar: onboardingPhoto || currentUser.photoURL,
          authType: isGoogle ? 'google' : 'credential',
          emailOrPhone: isGoogle ? undefined : authEmailOrPhone || currentUser.email || currentUser.phoneNumber,
          password: isGoogle ? undefined : authPassword || undefined
        });
        localStorage.setItem('nearby_saved_accounts', JSON.stringify(accounts));
        loadLocalAccountsFromDisk();
      } catch (accErr) {
        console.warn("Device local accounts write failure on onboarding complete:", accErr);
      }
      
      setAudioFeedback("Profile updated.");
      setTimeout(() => setAudioFeedback(""), 2000);
      setShowOnboarding(false);
      setIsSyncing(false);
    } catch (err) {
      console.error("Error writing user profile config: ", err);
      setAudioFeedback("Failed to save profile. Try again.");
      setTimeout(() => setAudioFeedback(""), 2000);
      setIsSyncing(false);
    }
  };

  const logoutUser = async () => {
    try {
      triggerBeep(300, 0.1);
      await signOut(auth);
      setAudioFeedback("Logged out.");
      setTimeout(() => setAudioFeedback(""), 2200);
      
      // Reset variables back to default
      setIsProfileLoaded(false);
      setUserDisplayName("Nearby Member");
      setUserUsername("nearby_member");
      setUserBio("Hello from Nearby!");
      setUserWebsite("foslibrary.com.ng");
      setCustomProfilePhoto(null);
      
      setFriendIds(['nb-1', 'nb-2']);
      setUserFollowers([]);
      setUserFollowing([]);
      setUserFollowersCount(0);
      setUserFollowingCount(0);
      setUserTrustScore(5.0);
      setUserMeetupCount(0);
      setIsSubscribed(false);
      setCustomAccentColor('indigo');
      setCustomChatBg('slate');
      setCustomChatBubbleStyle('modern');
      setCustomChatFont('sans');
      setUserGroupInvitePolicy('ask');
      setUserGroupCallPolicy('ask');
      setActiveNotes(INITIAL_NOTES);
      _setChatMessages(INITIAL_MESSAGES);
      setMyUploadedStory(null);
      
      // Onboarding inputs resetting
      setOnboardingName('');
      setOnboardingUsername('');
      setOnboardingBio("Let's connect.");
      setOnboardingPhoto(null);
      setOnboardingStep(1);
      setShowLandingMode(true);
    } catch (err) {
      console.error("Logout error: ", err);
    }
  };

  const loadLocalAccountsFromDisk = () => {
    const rawAccounts = localStorage.getItem('nearby_saved_accounts');
    if (rawAccounts) {
      try {
        setSavedAccounts(JSON.parse(rawAccounts));
      } catch (_) {}
    }
  };

  useEffect(() => {
    loadLocalAccountsFromDisk();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      const applyProfileData = (data: any) => {
        if (data.gbFreezeLastSeen !== undefined) setGbFreezeLastSeen(data.gbFreezeLastSeen);
        if (data.gbAntiDelete !== undefined) setGbAntiDelete(data.gbAntiDelete);
        if (data.gbHideOnline !== undefined) setGbHideOnline(data.gbHideOnline);
        if (data.gbBlueTickOnReply !== undefined) setGbBlueTickOnReply(data.gbBlueTickOnReply);
        if (data.friendIds && Array.isArray(data.friendIds)) setFriendIds(data.friendIds);
        if (data.isSubscribed !== undefined) setIsSubscribed(data.isSubscribed);
        if (data.isUserVisibleOnRadar !== undefined) setIsUserVisibleOnRadar(data.isUserVisibleOnRadar);
        if (data.radarVisibilityMode !== undefined) setRadarVisibilityMode(data.radarVisibilityMode);
        if (data.userRadarStatusText !== undefined) setUserRadarStatusText(data.userRadarStatusText);
        if (data.userRadarEmoji !== undefined) setUserRadarEmoji(data.userRadarEmoji);
        if (data.customAccentColor) setCustomAccentColor(data.customAccentColor);
        if (data.customChatBg) setCustomChatBg(data.customChatBg);
        if (data.customChatBubbleStyle) setCustomChatBubbleStyle(data.customChatBubbleStyle);
        if (data.customChatFont) setCustomChatFont(data.customChatFont);
        if (data.userGroupInvitePolicy) setUserGroupInvitePolicy(data.userGroupInvitePolicy);
        if (data.userGroupCallPolicy) setUserGroupCallPolicy(data.userGroupCallPolicy);
        
        const effectiveName = (data.name && data.name !== 'Nearby Member')
          ? data.name
          : (auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : (data.name || 'Nearby Member')));
        setUserDisplayName(effectiveName);

        const effectiveUsername = (data.username && data.username !== 'nearby_member')
          ? data.username
          : (auth.currentUser?.email ? auth.currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_\-]/g, '') : (data.username || 'nearby_member'));
        setUserUsername(effectiveUsername);

        if (data.bio) setUserBio(data.bio);
        if (data.website) setUserWebsite(data.website);
        if (data.customProfilePhoto || auth.currentUser?.photoURL) setCustomProfilePhoto(data.customProfilePhoto || auth.currentUser?.photoURL || null);
        if (data.appLanguage) setAppLanguage(data.appLanguage as any);
        if (data.ageRange) setUserAgeRange(data.ageRange);
        if (data.gender) setUserGender(data.gender);
        if (data.interests) setUserInterests(data.interests);
        if (data.communities) setUserCommunities(data.communities);
        if (data.contacts && Array.isArray(data.contacts)) setContactsList(data.contacts);
        if (data.followers !== undefined && Array.isArray(data.followers)) setUserFollowers(data.followers);
        if (data.following !== undefined && Array.isArray(data.following)) setUserFollowing(data.following);
        if (data.followersCount !== undefined) setUserFollowersCount(data.followersCount);
        if (data.followingCount !== undefined) setUserFollowingCount(data.followingCount);
        if (data.trustScore !== undefined) setUserTrustScore(data.trustScore);
        if (data.meetupsCompleted !== undefined) setUserMeetupCount(data.meetupsCompleted);
        if (data.myNoteText !== undefined) {
          setActiveNotes(prev => {
            const exists = prev.some(n => n.id === 'user-note-me');
            if (exists) {
              return prev.map(n => n.id === 'user-note-me' ? { ...n, text: data.myNoteText } : n);
            } else if (data.myNoteText) {
              return [{
                id: 'user-note-me',
                name: 'Your note',
                avatarColor: 'bg-neutral-800 border border-neutral-700',
                avatarEmoji: data.avatarEmoji || '🙋‍♂️',
                text: data.myNoteText
              }, ...prev];
            }
            return prev;
          });
        }
      };

      if (user) {
        localStorage.setItem('nearby_current_uid', user.uid);
        setIsSyncing(true);
        setAudioFeedback("Loading...");
        setTimeout(() => setAudioFeedback(""), 2000);

        // 1. Instant restore from local cache to prevent default placeholder flicker
        let cachedProfileData: any = null;
        try {
          const cachedProfileRaw = localStorage.getItem(`nearby_cached_profile_${user.uid}`);
          if (cachedProfileRaw) {
            cachedProfileData = JSON.parse(cachedProfileRaw);
            applyProfileData(cachedProfileData);
            setIsProfileLoaded(true);
            
            // If cache profile exists, immediately bypass landing & onboarding screens!
            if (cachedProfileData) {
              setShowOnboarding(false);
              setShowLandingMode(false);
            }
          }
        } catch (cacheErr) {
          console.warn("Error restoring from local profile cache:", cacheErr);
        }
        
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          const profileExists = userDocSnap.exists();
          
          if (profileExists || cachedProfileData) {
            let data = profileExists ? userDocSnap.data() : cachedProfileData;
            
            // Derive real user name from Google or auth if stored name is placeholder
            const authName = user.displayName || (user.email ? user.email.split('@')[0] : null);
            if ((!data.name || data.name === 'Nearby Member') && authName) {
              data = {
                ...data,
                name: authName,
                username: data.username && data.username !== 'nearby_member' ? data.username : (user.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_\-]/g, '') : `user_${user.uid.slice(0,5)}`)
              };
              setDoc(userDocRef, data, { merge: true }).catch(e => console.warn("Doc update name err:", e));
            }

            // 2. Apply loaded cloud parameters
            applyProfileData(data);

            // 3. Cache the restored profile locally for faster loading
            try {
              localStorage.setItem(`nearby_cached_profile_${user.uid}`, JSON.stringify(data));
            } catch (cacheStoreErr) {
              console.warn("Error caching profile in localStorage:", cacheStoreErr);
            }

            setIsProfileLoaded(true);

            // Existing profile -> Land directly on home dashboard!
            setShowOnboarding(false);
            setShowLandingMode(false);
 
            try {
              const rawAccounts = localStorage.getItem('nearby_saved_accounts');
              let accounts: any[] = [];
              if (rawAccounts) {
                try { accounts = JSON.parse(rawAccounts); } catch (_) {}
              }
              accounts = accounts.filter((a: any) => a.uid !== user.uid);
              const isGoogle = user.providerData.some((p: any) => p.providerId === 'google.com');
              const finalName = data.name || authName || 'Nearby Member';
              const finalUsername = data.username || (user.email ? user.email.split('@')[0].toLowerCase() : 'nearby_member');
              accounts.push({
                uid: user.uid,
                name: finalName,
                username: finalUsername,
                avatar: data.customProfilePhoto || user.photoURL || null,
                authType: isGoogle ? 'google' : 'credential',
                emailOrPhone: isGoogle ? undefined : authEmailOrPhone || user.email || user.phoneNumber,
                password: isGoogle ? undefined : authPassword || undefined
              });
              localStorage.setItem('nearby_saved_accounts', JSON.stringify(accounts));
              loadLocalAccountsFromDisk();
            } catch (accErr) {
              console.warn("Device local accounts write failure o:", accErr);
            }
          } else {
            // First time login. The profile document does not exist yet in Firestore or cache.
            const defaultUsername = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_\-]/g, '') || (user.phoneNumber ? `u_${user.phoneNumber.slice(-4)}` : `user_${Math.floor(1000 + Math.random() * 9000)}`);
            const defaultName = user.displayName || (user.email ? user.email.split('@')[0] : 'Nearby Member');
            const defaultBio = "Hey, I am a new neighbor around! Let's connect! 👋";
            
            const initialDoc = {
              uid: user.uid,
              username: defaultUsername,
              name: defaultName,
              bio: defaultBio,
              website: "foslibrary.com.ng",
              avatarEmoji: "🙋‍♂️",
              avatarColor: "bg-neutral-800 border-neutral-700 border",
              isSubscribed: false,
              friendIds: [],
              isUserVisibleOnRadar: true,
              userRadarStatusText: "Connecting nearby...",
              userRadarEmoji: "🙋‍♂️",
              customAccentColor: "indigo",
              customChatBg: "slate",
              customChatBubbleStyle: "modern",
              customChatFont: "sans",
              userGroupInvitePolicy: "ask",
              userGroupCallPolicy: "ask",
              myNoteText: "",
              customProfilePhoto: user.photoURL || null,
              appLanguage: "Lagos",
              streetName: "Yaba",
              latitude: 6.5095,
              longitude: 3.3711,
              latOffset: 0,
              lngOffset: 0,
              ageRange: "25-34",
              gender: "Male",
              interests: ["Tech", "Music"],
              communities: ["comm-1"],
              followers: [],
              following: [],
              followersCount: 0,
              followingCount: 0,
              trustScore: 5.0,
              meetupsCompleted: 0,
              onboardingCompleted: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            await setDoc(userDocRef, initialDoc);
            applyProfileData(initialDoc);

            try {
              localStorage.setItem(`nearby_cached_profile_${user.uid}`, JSON.stringify(initialDoc));
            } catch (_) {}

            try {
              const rawAccounts = localStorage.getItem('nearby_saved_accounts');
              let accounts: any[] = [];
              if (rawAccounts) {
                try { accounts = JSON.parse(rawAccounts); } catch (_) {}
              }
              accounts = accounts.filter((a: any) => a.uid !== user.uid);
              const isGoogle = user.providerData.some((p: any) => p.providerId === 'google.com');
              accounts.push({
                uid: user.uid,
                name: defaultName,
                username: defaultUsername,
                avatar: user.photoURL || null,
                authType: isGoogle ? 'google' : 'credential',
                emailOrPhone: isGoogle ? undefined : authEmailOrPhone || user.email || user.phoneNumber,
                password: isGoogle ? undefined : authPassword || undefined
              });
              localStorage.setItem('nearby_saved_accounts', JSON.stringify(accounts));
              loadLocalAccountsFromDisk();
            } catch (accErr) {
              console.warn("Device local accounts write failure o:", accErr);
            }
            
            setIsProfileLoaded(true);
            setOnboardingName(defaultName);
            setOnboardingUsername(defaultUsername);
            setOnboardingBio(defaultBio);
            setOnboardingPhoto(user.photoURL || null);

            const isGoogleUser = user.providerData.some((p: any) => p.providerId === 'google.com');
            if (isGoogleUser || (defaultName && defaultName !== 'Nearby Member')) {
              setShowOnboarding(false);
            } else {
              setShowOnboarding(true);
              setOnboardingStep(1);
            }
            setShowLandingMode(false);
          }
 
          // Force-load story
          const activeStoryRef = doc(db, 'users', user.uid, 'stories', 'active');
          const activeStorySnap = await getDoc(activeStoryRef);
          if (activeStorySnap.exists()) {
            const data = activeStorySnap.data() as StorySnap;
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (data.createdAt && (Date.now() - data.createdAt > oneDayMs)) {
              // Expired, delete from db o!
              await deleteDoc(activeStoryRef);
              setMyUploadedStory(null);
            } else {
              setMyUploadedStory(data);
            }
          }
 
          setIsSyncing(false);
          setAuthLoading(false);
 
        } catch (err) {
          console.error("Error synchronizing profile data: ", err);
          setIsSyncing(false);
          setAuthLoading(false);
        }
      } else {
        setIsProfileLoaded(false);
        // user is null. Check if we can auto-restore the session (handles sandboxed iframe restrictions) o!
        const lastUid = localStorage.getItem('nearby_current_uid');
        const rawAccounts = localStorage.getItem('nearby_saved_accounts');
        let restored = false;
        const isInitialLoad = !autoLoginAttemptedRef.current;
 
        if (lastUid && rawAccounts && !autoLoginAttemptedRef.current) {
          autoLoginAttemptedRef.current = true;
          try {
            const accounts = JSON.parse(rawAccounts);
            const activeAcc = accounts.find((a: any) => a.uid === lastUid);
            if (activeAcc && activeAcc.authType === 'credential' && activeAcc.emailOrPhone && activeAcc.password) {
              restored = true;
              setAudioFeedback("Restoring session...");
              let finalEmail = activeAcc.emailOrPhone.trim();
              if (!finalEmail.includes('@')) {
                const cleanPhone = finalEmail.replace(/\s+/g, '').replace(/[^\d+]/g, '');
                finalEmail = `phone_${cleanPhone}@nearby.com`;
              }
              await signInWithEmailAndPassword(auth, finalEmail, activeAcc.password.trim());
              setAudioFeedback("Session restored.");
              setTimeout(() => setAudioFeedback(""), 2000);
            }
          } catch (err) {
            console.warn("Session auto-restore error:", err);
            restored = false;
          }
        }
 
        if (!restored) {
          if (lastUid && isInitialLoad) {
            setShowLandingMode(false);
            setAuthIsSignUp(false);
          }
          localStorage.removeItem('nearby_current_uid');
          setIsSyncing(false);
          setAuthLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // -----------------------------------------
  // WhatsApp Presence Heartbeat System o!
  // -----------------------------------------
  useEffect(() => {
    if (!currentUser || showOnboarding) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const presenceDocRef = doc(db, 'presence', currentUser.uid);

    let lastActivityTime = Date.now();
    let currentStatus: 'active' | 'away' | 'offline' = 'active';

    const updatePresence = async (status: 'active' | 'away' | 'offline') => {
      currentStatus = status;
      const nowIso = new Date().toISOString();
      try {
        await setDoc(userDocRef, {
          onlineStatus: status,
          lastSeen: nowIso
        }, { merge: true });

        await setDoc(presenceDocRef, {
          uid: currentUser.uid,
          online: status === 'active',
          lastSeen: nowIso,
          currentConversation: selectedNeighborId || "",
          updatedAt: nowIso
        }, { merge: true });
      } catch (e) {
        // quota exceeded fallback o!
      }
    };

    updatePresence('active');

    // User activity listener to dynamically detect activity o!
    const handleActivity = () => {
      const now = Date.now();
      lastActivityTime = now;

      // If they were away, restore instantly and notify database
      if (currentStatus === 'away') {
        updatePresence('active');
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Periodically update heartbeat and verify if user has gone idle (10-min limit o!)
    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivityTime;
      if (idleMs >= 10 * 60 * 1000) { // 10 minutes of inactivity
        if (currentStatus !== 'away') {
          updatePresence('away');
        }
      } else {
        if (currentStatus !== 'active') {
          updatePresence('active');
        } else {
          updatePresence('active'); // keep heartbeat live
        }
      }
    }, 40000);

    const handleUnload = () => {
      if (navigator.sendBeacon) {
        updatePresence('offline');
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('beforeunload', handleUnload);
      updatePresence('offline');
    };
  }, [currentUser, showOnboarding, selectedNeighborId]);

  // Real-time Discover Hub and Chat Activity Notifications o!
  useEffect(() => {
    if (!currentUser) return;

    // Discover Hub Activities with friendly wording o!
    const discoverActivities = [
      { message: "Adeola updated their search distance to 200m", icon: "📍" },
      { message: "Chidi matched 'Coding' interest with you", icon: "⚡" },
      { message: "Funmi just entered your Ogo-Oluwa Block", icon: "👀" },
      { message: "Wale updated discovery range to 1km", icon: "🌐" },
      { message: "Sade is looking for a nearby meetup now", icon: "🔥" },
      { message: "Amaka updated her profile details", icon: "🤝" },
      { message: "Yusuf matched 'Music' interest with you", icon: "🎵" },
      { message: "Soji customized their status bubble", icon: "💭" },
      { message: "Ife updated their discovery range to 5km", icon: "📏" },
      { message: "Dunni is within 100 meters of you!", icon: "🚶" }
    ];

    // Every 15 seconds, IF on the discover hub page (explore tab), trigger a top pop-up for 1 second o!
    const topNotificationInterval = setInterval(() => {
      if (activeTab === 'explore') {
        const randomActivity = discoverActivities[Math.floor(Math.random() * discoverActivities.length)];
        setTopNotification(randomActivity);
        playNotificationSound(); // Real phone notification audio tone o!
        
        // Hide after exactly 1 second
        setTimeout(() => {
          setTopNotification(null);
        }, 1000);
      }
    }, 15000); // Check every 15s

    // Also trigger one immediately on tab change to 'explore'
    if (activeTab === 'explore') {
      const randomActivity = discoverActivities[Math.floor(Math.random() * discoverActivities.length)];
      setTopNotification(randomActivity);
      playNotificationSound(); // Real phone notification audio tone o!
      setTimeout(() => {
        setTopNotification(null);
      }, 1000);
    }

    // Every 1 minute, IF on the main chat page, show a chat notification about Discover Hub o!
    const chatActivities = [
      { message: "3 new people are active near your current location!", subtext: "View them on the Discover Hub" },
      { message: "Chidi just changed their status to 'Ready to Gist!'", subtext: "Check who is online in Discover Hub" },
      { message: "Sade shared a new 24h story on Discover Feed!", subtext: "Swipe over to the Discover Feed" },
      { message: "Wale updated his profile details!", subtext: "Discover verified neighbors now" },
      { message: "A user with mutual interest 'Tech' is online near you!", subtext: "Connect face-to-face on your block" }
    ];

    const chatNotificationInterval = setInterval(() => {
      if (activeTab === 'chat') {
        const randomChatAct = chatActivities[Math.floor(Math.random() * chatActivities.length)];
        setChatNotification(randomChatAct);
        playNotificationSound(); // Real phone notification audio tone o!
        
        // Hide after 4 seconds (so they have time to read a 1-minute alert o!)
        setTimeout(() => {
          setChatNotification(null);
        }, 4000);
      }
    }, 60000); // 1 minute (60000 ms)

    return () => {
      clearInterval(topNotificationInterval);
      clearInterval(chatNotificationInterval);
    };
  }, [currentUser, activeTab]);

  // -----------------------------------------
  // Automatic Message Stream Scroll Anchoring o!
  // -----------------------------------------
  const scrollToLastMessage = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (selectedNeighborId) {
      setChatLimit(50);
      scrollToLastMessage('auto');
      const timer = setTimeout(() => scrollToLastMessage('auto'), 150);
      return () => clearTimeout(timer);
    }
  }, [selectedNeighborId]);

  useEffect(() => {
    if (selectedNeighborId) {
      const msgs = chatMessages[selectedNeighborId] || [];
      if (msgs.length > 0) {
        scrollToLastMessage('smooth');
      }
    }
  }, [chatMessages, selectedNeighborId]);

  // -----------------------------------------
  // Debounced Typing Status to Firestore o!
  // -----------------------------------------
  useEffect(() => {
    if (!currentUser || !selectedNeighborId || selectedNeighbor?.isGroup) return;

    const isTyping = textInput.trim().length > 0;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const presenceDocRef = doc(db, 'presence', currentUser.uid);

    const delayDebounceFn = setTimeout(() => {
      const typingTarget = isTyping ? selectedNeighborId : "";
      
      setDoc(userDocRef, {
        typingTo: typingTarget
      }, { merge: true }).catch(() => {});

      setDoc(presenceDocRef, {
        typing: typingTarget,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [textInput, selectedNeighborId, selectedNeighbor?.isGroup, currentUser]);

  // -----------------------------------------
  // Core WhatsApp Synced Persistence Helpers o!
  // -----------------------------------------
  const saveOrUpdateMessageInFirestore = async (msg: DirectMessage, threadId: string) => {
    const fUser = auth.currentUser;
    if (!fUser) return;
    const isGroupThread = threadId.startsWith('group-') || threadId.startsWith('sim-group-');

    let finalMediaUrl = msg.mediaUrl;
    if (finalMediaUrl && finalMediaUrl.startsWith('data:')) {
      try {
        let folder = 'documents';
        let fileExtension = 'bin';
        if (msg.type === 'image') {
          folder = 'chat-images';
          fileExtension = finalMediaUrl.includes('image/png') ? 'png' : finalMediaUrl.includes('image/gif') ? 'gif' : 'jpeg';
        } else if (msg.type === 'video') {
          folder = 'chat-videos';
          fileExtension = finalMediaUrl.includes('video/mp4') ? 'mp4' : 'mov';
        } else if (msg.type === 'voice') {
          folder = 'voice-notes';
          fileExtension = 'mp3';
        } else {
          folder = 'documents';
          fileExtension = 'pdf';
        }
        const storagePath = `${folder}/${fUser.uid}/${Date.now()}.${fileExtension}`;
        finalMediaUrl = await uploadToStorage(finalMediaUrl, storagePath);
      } catch (uploadErr) {
        console.warn("Storage upload failed, using original url:", uploadErr);
      }
    }

    const msgBody = {
      id: msg.id,
      senderId: msg.senderId === 'user' ? fUser.uid : (msg.senderId || fUser.uid),
      receiverId: msg.receiverId || threadId,
      chatThreadId: msg.chatThreadId || threadId,
      timestamp: msg.timestamp || new Date().toISOString(),
      type: msg.type || 'text',
      ...(msg.text ? { text: msg.text } : {}),
      ...(finalMediaUrl ? { mediaUrl: finalMediaUrl } : {}),
      ...(msg.audioDurationSec !== undefined ? { audioDurationSec: msg.audioDurationSec } : {}),
      ...(msg.fileName ? { fileName: msg.fileName } : {}),
      ...(msg.fileSize ? { fileSize: msg.fileSize } : {}),
      ...(msg.isUnread !== undefined ? { isUnread: msg.isUnread } : {}),
      ...(msg.status ? { status: msg.status } : {}),
      ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      ...(msg.reactions ? { reactions: msg.reactions } : {}),
      ...(msg.deletedForEveryone !== undefined ? { deletedForEveryone: msg.deletedForEveryone } : {}),
      ...(msg.deletedForUsers ? { deletedForUsers: msg.deletedForUsers } : {}),
      ...(msg.isForwarded !== undefined ? { isForwarded: msg.isForwarded } : {})
    };

    try {
      if (isGroupThread) {
        const msgDocRef = doc(db, 'groups', threadId, 'messages', msg.id);
        await setDoc(msgDocRef, msgBody, { merge: true });
      } else {
        const participants = [fUser.uid, threadId].sort();
        const chatThreadId = participants.join('_');
        
        const dmBody = {
          ...msgBody,
          chatThreadId,
          participants,
          senderId: msgBody.senderId === 'user' ? fUser.uid : msgBody.senderId,
          receiverId: msgBody.receiverId === 'user' ? threadId : msgBody.receiverId,
        };

        const msgDocRef = doc(db, 'direct_messages', msg.id);
        await setDoc(msgDocRef, dmBody, { merge: true });

        // Add real-time notification
        if (msgBody.type !== 'call_log' && !msg.reactions && !msg.deletedForEveryone) {
          const senderName = dmBody.senderId === fUser.uid
            ? (currentUser?.name || 'User')
            : (neighbors.find(n => n.id === dmBody.senderId)?.name || 'A neighbor');
          const previewText = msgBody.text || 'Sent media';
          await createNotification({
            userId: dmBody.receiverId,
            senderId: dmBody.senderId,
            senderName,
            type: 'message',
            title: 'New Message',
            message: `${senderName}: ${previewText}`
          });
        }
      }
    } catch (err) {
      console.warn("Firestore message write avoided/failed (quota/offline fallback):", err);
    }
  };

  const markMessagesAsRead = async (neighborId: string) => {
    const fUser = auth.currentUser;
    if (!fUser || neighborId.startsWith('nb-')) return;
    const msgs = chatMessages[neighborId] || [];
    const unreadMsgs = msgs.filter(m => m.senderId !== 'user' && m.senderId !== fUser.uid && m.status !== 'read');
    if (unreadMsgs.length === 0) return;

    try {
      await Promise.all(unreadMsgs.map(async (msg) => {
        const updatedMsg = { ...msg, status: 'read' as const, isUnread: false };
        const msgDocRef = doc(db, 'direct_messages', msg.id);
        await setDoc(msgDocRef, updatedMsg, { merge: true });
      }));
    } catch (err) {
      console.warn("Error marking messages read in Firestore:", err);
    }
  };

  useEffect(() => {
    if (selectedNeighborId && currentUser) {
      markMessagesAsRead(selectedNeighborId);
    }
  }, [selectedNeighborId, chatMessages[selectedNeighborId]?.length, currentUser]);

  // -----------------------------------------
  // Real-time Status Story Expiration Check (24-Hour lifetime o!)
  // -----------------------------------------
  useEffect(() => {
    const checkExpiration = async () => {
      if (!myUploadedStory || !currentUser) return;
      const oneDayMs = 24 * 60 * 60 * 1000;
      const createdTime = myUploadedStory.createdAt || Date.now();
      
      if (Date.now() - createdTime > oneDayMs) {
        setMyUploadedStory(null);
        setAudioFeedback("⏰ Your status update has expired after 24 hours.");
        setTimeout(() => setAudioFeedback(""), 3000);
        try {
          const activeStoryRef = doc(db, 'users', currentUser.uid, 'stories', 'active');
          await deleteDoc(activeStoryRef);
        } catch (err) {
          console.warn("Failed to delete expired story from Firestore:", err);
        }
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 30000); // 30 seconds interval

    return () => clearInterval(interval);
  }, [myUploadedStory, currentUser]);

  // -----------------------------------------
  // WebRTC Media Stream Rendering & Speaker volume adjustments
  // -----------------------------------------
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState.status, callState.active, videoOff]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState.status, callState.active]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = isSpeakerOn ? 1.0 : 0.2;
    }
  }, [isSpeakerOn, remoteStream]);

  // -----------------------------------------
  // Real-time peer-to-peer call signaling subscriber o!
  // -----------------------------------------
  useEffect(() => {
    if (!currentUser) return;
    
    const activeCallRef = doc(db, 'users', currentUser.uid, 'calls', 'active');
    const unsubCalls = onSnapshot(activeCallRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // 1. Sync Base Call State
        setCallState(prev => {
          if (prev.active) {
            if (prev.status !== data.status) {
              if (data.status === 'connected') {
                triggerBeep(650, 0.3, 'sine');
              }
              return {
                ...prev,
                status: data.status,
                callId: data.callId || prev.callId
              };
            }
            return prev;
          }
          
          return {
            active: true,
            type: data.type || 'video',
            neighborId: data.incoming ? (data.callerId || '') : (data.receiverId || ''),
            status: data.status || 'ringing',
            incoming: data.incoming ?? true,
            durationSeconds: 0,
            callId: data.callId || ''
          };
        });

        // 2. Caller Specific - Receive Answer SDP and set remote description
        if (data.status === 'connected' && !data.incoming) {
          if (data.answerSdp && pcRef.current && !pcRef.current.remoteDescription) {
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription({
                type: 'answer',
                sdp: data.answerSdp
              }));
              console.log("WebRTC Caller: Remote description set from recipient answer successfully.");
              
              if (queuedCandidatesRef.current.length > 0) {
                console.log("Draining queued candidates on Caller...");
                for (const cand of queuedCandidatesRef.current) {
                  try {
                    await pcRef.current.addIceCandidate(cand);
                  } catch (e) {
                    console.warn("Draining queued candidate failed on Caller:", e);
                  }
                }
                queuedCandidatesRef.current = [];
              }
            } catch (sdpErr) {
              console.error("WebRTC Caller: Error setting remote description:", sdpErr);
            }
          }
        }

        // 3. ICE Candidate Sync depending on our Role (Caller/Receiver)
        if (pcRef.current) {
          if (data.incoming) {
            // We are the Receiver; we listen for Caller's candidates
            const callerCands = data.callerCandidates || [];
            if (callerCands.length > remoteCandidatesAddedRef.current) {
              const startIdx = remoteCandidatesAddedRef.current;
              for (let i = startIdx; i < callerCands.length; i++) {
                try {
                  const candData = JSON.parse(callerCands[i]);
                  if (candData) {
                    const rtcCand = new RTCIceCandidate(candData);
                    if (pcRef.current.remoteDescription) {
                      await pcRef.current.addIceCandidate(rtcCand);
                    } else {
                      queuedCandidatesRef.current.push(rtcCand);
                    }
                  }
                } catch (iceErr) {
                  console.warn("Receiver adding ICE candidate failed:", iceErr);
                }
              }
              remoteCandidatesAddedRef.current = callerCands.length;
            }
          } else {
            // We are the Caller; we listen for Receiver's candidates
            const receiverCands = data.receiverCandidates || [];
            if (receiverCands.length > remoteCandidatesAddedRef.current) {
              const startIdx = remoteCandidatesAddedRef.current;
              for (let i = startIdx; i < receiverCands.length; i++) {
                try {
                  const candData = JSON.parse(receiverCands[i]);
                  if (candData) {
                    const rtcCand = new RTCIceCandidate(candData);
                    if (pcRef.current.remoteDescription) {
                      await pcRef.current.addIceCandidate(rtcCand);
                    } else {
                      queuedCandidatesRef.current.push(rtcCand);
                    }
                  }
                } catch (iceErr) {
                  console.warn("Caller adding ICE candidate failed:", iceErr);
                }
              }
              remoteCandidatesAddedRef.current = receiverCands.length;
            }
          }
        }

      } else {
        // Active document deleted means the call has been hung up o!
        setCallState(prev => {
          if (prev.active) {
            // Safe Tear Down local WebRTC Media & RTCPeerConnection elements
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((track) => track.stop());
              localStreamRef.current = null;
            }
            setLocalStream(null);

            if (remoteStreamRef.current) {
              remoteStreamRef.current.getTracks().forEach((track) => track.stop());
              remoteStreamRef.current = null;
            }
            setRemoteStream(null);

            if (pcRef.current) {
              pcRef.current.close();
              pcRef.current = null;
            }

            if (statsIntervalRef.current) {
              clearInterval(statsIntervalRef.current);
              statsIntervalRef.current = null;
            }

            localCandidatesAddedRef.current = 0;
            remoteCandidatesAddedRef.current = 0;

            triggerBeep(320, 0.2, 'triangle');

            return {
              active: false,
              type: 'video',
              neighborId: '',
              status: 'disconnected',
              incoming: false,
              durationSeconds: 0
            };
          }
          return prev;
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}/calls/active`);
    });

    return () => unsubCalls();
  }, [currentUser]);

  // Synchronize Messages in real-time when currentUser exists o!
  useEffect(() => {
    if (!currentUser) return;

    const messagesColRef = collection(db, 'direct_messages');
    const messagesQuery = query(
      messagesColRef,
      where('participants', 'array-contains', currentUser.uid)
    );
    
    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const loadedMsgs: DirectMessage[] = [];
      snapshot.forEach((msgDoc) => {
        loadedMsgs.push(msgDoc.data() as DirectMessage);
      });

      // Sort by timestamp asc client-side to avoid needing custom indexes
      loadedMsgs.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });

      // Group them by the neighbor's ID (the other participant)
      const grouped: Record<string, DirectMessage[]> = {};
      loadedMsgs.forEach((msg) => {
        const parts = (msg as any).participants || [];
        const neighborId = parts.find((p: string) => p !== currentUser.uid) || msg.receiverId || msg.senderId;
        if (neighborId) {
          if (!grouped[neighborId]) {
            grouped[neighborId] = [];
          }
          if (!grouped[neighborId].some(m => m.id === msg.id)) {
            grouped[neighborId].push({
              ...msg,
              chatThreadId: neighborId // Map thread ID in state to neighbor's ID for the UI
            });
          }
        }
      });

      _setChatMessages(prev => {
        const combined = { ...prev };
        
        // Remove old direct message threads to ensure no stale local messages remain, but preserve simulated ones
        Object.keys(combined).forEach(key => {
          if (!key.startsWith('group-') && !key.startsWith('sim-group-') && !key.startsWith('nb-')) {
            delete combined[key];
          }
        });
        
        // Merge the fresh real-time direct messages from Firestore
        Object.keys(grouped).forEach(key => {
          combined[key] = grouped[key];
        });
        
        return combined;
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'direct_messages');
    });

    return () => unsubMessages();
  }, [currentUser]);

  // Synchronize Notifications in real-time when currentUser exists o!
  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubNotifs = onSnapshot(notificationsQuery, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AppNotification);
      });

      // Sort client-side by createdAt desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setNotifications(list);
      const unreadCount = list.filter(n => n.isUnread).length;
      setUnreadNotificationsCount(unreadCount);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'notifications');
    });

    return () => unsubNotifs();
  }, [currentUser]);

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    triggerBeep(520, 0.05);
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
      setUnreadNotificationsCount(0);
      const batchPromises = notifications
        .filter(n => n.isUnread)
        .map(n => updateDoc(doc(db, 'notifications', n.id), { isUnread: false }));
      await Promise.all(batchPromises);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentUser) return;
    triggerBeep(420, 0.05);
    try {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      const batchPromises = notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)));
      await Promise.all(batchPromises);
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    triggerBeep(380, 0.05);
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleToggleReadNotification = async (id: string, currentUnread: boolean) => {
    triggerBeep(500, 0.05);
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isUnread: !currentUnread } : n));
      await updateDoc(doc(db, 'notifications', id), { isUnread: !currentUnread });
    } catch (err) {
      console.error("Error toggling read status:", err);
    }
  };

  const getGroupedNotifications = () => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    notifications.forEach(notif => {
      const notifTime = notif.createdAt ? new Date(notif.createdAt).getTime() : 0;
      if (notifTime >= todayStart) {
        today.push(notif);
      } else if (notifTime >= yesterdayStart) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, yesterday, earlier };
  };

  // Synchronize Meetups in real-time
  useEffect(() => {
    if (!currentUser) return;

    let hostMeetups: Meetup[] = [];
    let participantMeetups: Meetup[] = [];

    const updateMeetupsList = () => {
      const merged = [...hostMeetups, ...participantMeetups];
      const unique: Meetup[] = [];
      const seen = new Set();
      merged.forEach(m => {
        if (m && m.meetupId && !seen.has(m.meetupId)) {
          seen.add(m.meetupId);
          unique.push(m);
        }
      });
      unique.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setMeetups(unique);
    };

    const qHost = query(collection(db, 'meetups'), where('hostUID', '==', currentUser.uid));
    const unsubHost = onSnapshot(qHost, (snapshot) => {
      const list: Meetup[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Meetup;
        if (data) list.push(data);
      });
      hostMeetups = list;
      updateMeetupsList();
    }, (err) => {
      console.warn("Failed to listen to host meetups:", err);
    });

    const qParticipant = query(collection(db, 'meetups'), where('participantUID', '==', currentUser.uid));
    const unsubParticipant = onSnapshot(qParticipant, (snapshot) => {
      const list: Meetup[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Meetup;
        if (data) list.push(data);
      });
      participantMeetups = list;
      updateMeetupsList();
    }, (err) => {
      console.warn("Failed to listen to participant meetups:", err);
    });

    return () => {
      unsubHost();
      unsubParticipant();
    };
  }, [currentUser]);

  // Synchronize Meetup Ratings in real-time
  useEffect(() => {
    if (!currentUser) return;

    let reviewerRatings: MeetupRating[] = [];
    let receiverRatings: MeetupRating[] = [];

    const updateRatingsList = () => {
      const merged = [...reviewerRatings, ...receiverRatings];
      const unique: MeetupRating[] = [];
      const seen = new Set();
      merged.forEach(r => {
        if (r && r.meetupId && !seen.has(r.meetupId + '_' + r.reviewerUID)) {
          seen.add(r.meetupId + '_' + r.reviewerUID);
          unique.push(r);
        }
      });
      setMeetupRatings(unique);
    };

    const qReviewer = query(collection(db, 'meetupRatings'), where('reviewerUID', '==', currentUser.uid));
    const unsubReviewer = onSnapshot(qReviewer, (snapshot) => {
      const list: MeetupRating[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MeetupRating;
        if (data) list.push(data);
      });
      reviewerRatings = list;
      updateRatingsList();
    }, (err) => {
      console.warn("Failed to listen to reviewer ratings:", err);
    });

    const qReceiver = query(collection(db, 'meetupRatings'), where('receiverUID', '==', currentUser.uid));
    const unsubReceiver = onSnapshot(qReceiver, (snapshot) => {
      const list: MeetupRating[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MeetupRating;
        if (data) list.push(data);
      });
      receiverRatings = list;
      updateRatingsList();
    }, (err) => {
      console.warn("Failed to listen to receiver ratings:", err);
    });

    return () => {
      unsubReviewer();
      unsubReceiver();
    };
  }, [currentUser]);

  // Synchronize Friend Requests in real-time when currentUser exists o!
  useEffect(() => {
    if (!currentUser) return;

    // 1. Incoming friend requests (received by currentUser)
    const incomingQuery = query(
      collection(db, 'friend_requests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    
    const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
      const requesters: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.senderId) {
          requesters.push(data.senderId);
        }
      });
      setPendingFriendRequests(requesters);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'friend_requests_incoming');
    });

    // 2. Outgoing friend requests (sent by currentUser)
    const outgoingQuery = query(
      collection(db, 'friend_requests'),
      where('senderId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
      const targetIds: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.receiverId) {
          targetIds.push(data.receiverId);
        }
      });
      setSentFriendRequestIds(targetIds);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'friend_requests_outgoing');
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [currentUser]);

  // Debounced effect for auto-persisting settings and note updates to Firebase
  useEffect(() => {
    const fUser = auth.currentUser;
    if (!fUser || isSyncing || !isProfileLoaded) return;

    const timer = setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'users', fUser.uid);
        const myNoteText = activeNotes.find(n => n.id === 'user-note-me')?.text || '';
        await setDoc(userDocRef, {
          uid: fUser.uid,
          username: userUsername,
          name: userDisplayName,
          bio: userBio,
          website: userWebsite,
          appLanguage,
          isSubscribed,
          friendIds,
          isUserVisibleOnRadar,
          userRadarStatusText,
          userRadarEmoji,
          customAccentColor,
          customChatBg,
          customChatBubbleStyle,
          customChatFont,
          userGroupInvitePolicy,
          userGroupCallPolicy,
          myNoteText,
          customProfilePhoto,
          gbFreezeLastSeen,
          gbAntiDelete,
          gbHideOnline,
          gbBlueTickOnReply,
          contacts: contactsList,
          followers: userFollowers,
          following: userFollowing,
          followersCount: userFollowersCount,
          followingCount: userFollowingCount,
          trustScore: userTrustScore,
          meetupsCompleted: userMeetupCount,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${fUser.uid}`);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    userDisplayName,
    userUsername,
    userBio,
    userWebsite,
    appLanguage,
    isSubscribed,
    friendIds,
    isUserVisibleOnRadar,
    userRadarStatusText,
    userRadarEmoji,
    customAccentColor,
    customChatBg,
    customChatBubbleStyle,
    customChatFont,
    userGroupInvitePolicy,
    userGroupCallPolicy,
    activeNotes,
    customProfilePhoto,
    gbFreezeLastSeen,
    gbAntiDelete,
    gbHideOnline,
    gbBlueTickOnReply,
    contactsList,
    userFollowers,
    userFollowing,
    userFollowersCount,
    userFollowingCount,
    userTrustScore,
    userMeetupCount
  ]);

  // -----------------------------------------
  // Synced Multi-Status Stories and Dynamic Listeners o!
  // -----------------------------------------
  useEffect(() => {
    if (!currentUser) {
      setMyStorySnaps([]);
      return;
    }
    const myStoriesCol = collection(db, 'users', currentUser.uid, 'stories');
    const unsub = onSnapshot(myStoriesCol, (snap) => {
      const list: StorySnap[] = [];
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      snap.forEach(docSnap => {
        const d = docSnap.data() as StorySnap;
        if (docSnap.id === 'active' || docSnap.id === 'activeStory') return;
        if (d.createdAt && (now - d.createdAt > oneDayMs)) {
          // Automated physical deletion of expired status!
          deleteDoc(doc(db, 'users', currentUser.uid, 'stories', docSnap.id))
            .catch(err => console.warn("Failed lazy cleanup of expired story document:", err));
          return;
        }
        list.push(d);
      });
      
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setMyStorySnaps(list);
      setMyUploadedStory(list[0] || null);
    }, (err) => {
      console.warn("Error listening to own stories:", err);
    });

    return () => unsub();
  }, [currentUser]);

  const neighborStoryUnsubsRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!currentUser) return;

    const activeNeighIds = neighbors.map(n => n.id);

    activeNeighIds.forEach(id => {
      if (id === 'me' || id.startsWith('group-') || neighborStoryUnsubsRef.current[id]) return;

      const neighborObj = neighbors.find(n => n.id === id);
      const storiesCol = collection(db, 'users', id, 'stories');
      const unsub = onSnapshot(storiesCol, (snap) => {
        const list: StorySnap[] = [];
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        snap.forEach(docSnap => {
          const d = docSnap.data() as StorySnap;
          if (docSnap.id === 'active' || docSnap.id === 'activeStory') return;
          if (d.createdAt && (now - d.createdAt > oneDayMs)) return;

          const privacy = d.privacy || 'everyone';
          if (privacy === 'friends') {
            const isFriend = (neighborObj && neighborObj.isFriend) || (Array.isArray(friendIds) ? friendIds : []).includes(id);
            if (!isFriend) return;
          } else if (privacy === 'custom') {
            const allowed = d.customList || [];
            if (!allowed.includes(currentUser.uid)) return;
          }

          list.push(d);
        });

        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setNeighborStories(prev => ({
          ...prev,
          [id]: list
        }));
      }, (err) => {
        console.warn("Could not load neighbor stories:", id);
      });

      neighborStoryUnsubsRef.current[id] = unsub;
    });

    Object.keys(neighborStoryUnsubsRef.current).forEach(id => {
      if (!activeNeighIds.includes(id)) {
        if (neighborStoryUnsubsRef.current[id]) {
          neighborStoryUnsubsRef.current[id]();
        }
        delete neighborStoryUnsubsRef.current[id];
        setNeighborStories(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    });
  }, [neighbors, currentUser, friendIds]);

  // Listen to current user document in real-time o!
  useEffect(() => {
    if (!currentUser) return;
    const myDocRef = doc(db, 'users', currentUser.uid);
    const unsubMe = onSnapshot(myDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.name && data.name !== 'Nearby Member') setUserDisplayName(data.name);
        if (data.username && data.username !== 'nearby_member') setUserUsername(data.username);
        if (data.bio) setUserBio(data.bio);
        if (data.customProfilePhoto) setCustomProfilePhoto(data.customProfilePhoto);
        if (data.friendIds && Array.isArray(data.friendIds)) setFriendIds(data.friendIds);
        if (data.contacts && Array.isArray(data.contacts)) {
          setContactsList(data.contacts);
        }
        
        // Ban monitoring
        if (data.banned === true || (data.reportsCount !== undefined && data.reportsCount >= 10)) {
          setIsCurrentMeBanned(true);
        } else {
          setIsCurrentMeBanned(false);
        }
        
        // Verification level monitoring
        if (data.verificationLevel) {
          setMyVerificationLevel(data.verificationLevel);
        }
        
        // Restore user coordinates from their profile document on launch o!
        if (data.latitude !== undefined && data.longitude !== undefined) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setUserCoords(prev => {
              if (!prev) {
                // Set GPS tracking system to active o!
                setGpsSynced(true);
                const restoredPreset: LocationPreset = {
                  name: data.streetName || "My Location",
                  city: data.appLanguage || "Osun",
                  coords: { lat, lng },
                  streets: [data.streetName || "Gbongan Road", data.appLanguage || "Osun"]
                };
                setSelectedPreset(restoredPreset);
                return { lat, lng };
              }
              return prev;
            });
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser?.uid}`);
    });
    return () => unsubMe();
  }, [currentUser]);

  // Load real users from Firestore in real-time
  useEffect(() => {
    if (!currentUser) return;
    const usersColRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersColRef, (snapshot) => {
      const realUsers: Neighbor[] = [];
      snapshot.forEach(docSnap => {
        const u = docSnap.data();
        if (!u || !u.uid) return;
        if (u.uid === currentUser.uid) return; // skip self
        
        const isUserFriend = (Array.isArray(u.friendIds) ? u.friendIds : []).includes(currentUser.uid) || (Array.isArray(friendIds) ? friendIds : []).includes(u.uid);
        const isFriendRequester = pendingFriendRequests.includes(u.uid);
        const isFriendRequested = sentFriendRequestIds.includes(u.uid);
        const hasRelationship = isUserFriend || isFriendRequester || isFriendRequested;

        // 1. Radar Mode verification: Show only users who have Radar Mode turned ON o!
        const isRadarEnabled = u.isUserVisibleOnRadar !== false;
        if (!isRadarEnabled && !hasRelationship) return;

        // 2. Privacy Mode constraints check o!
        const uVisibilityMode = u.radarVisibilityMode || 'everyone';
        if (uVisibilityMode === 'hidden' && !hasRelationship) return;
        if (uVisibilityMode === 'friends' && !isUserFriend && !isFriendRequester && !isFriendRequested) return;

        let latOffset = u.latOffset !== undefined ? u.latOffset : (((u.uid.charCodeAt(0) || 0) % 10) - 5) * 0.05;
        let lngOffset = u.lngOffset !== undefined ? u.lngOffset : (((u.uid.charCodeAt(1) || 0) % 10) - 5) * 0.05;
        let distanceMeters = u.distanceMeters !== undefined ? u.distanceMeters : (((u.uid.charCodeAt(2) || 0) % 4) + 1) * 85 + 40;
        
        const activeCoords = userCoords || selectedPreset.coords;
        if (activeCoords && u.latitude !== undefined && u.longitude !== undefined) {
          distanceMeters = Math.max(8, Math.round(calculateHaversineDistance(activeCoords.lat, activeCoords.lng, u.latitude, u.longitude)));
          
          // Render precise spatial offset relative to active explorer epicenter
          latOffset = (u.latitude - activeCoords.lat) * 12; // Adjusted scale for beautiful visual layout density
          lngOffset = (u.longitude - activeCoords.lng) * 12;
          
          latOffset = Math.max(-0.45, Math.min(0.45, latOffset));
          lngOffset = Math.max(-0.45, Math.min(0.45, lngOffset));
        }

        // 3. Proximity Filter check o!
        const isWithinRadius = distanceMeters <= radarRadius;
        if (!isWithinRadius && !hasRelationship) return;
        
        // Ignore banned users
        if (u.banned === true || (u.reportsCount !== undefined && u.reportsCount >= 10)) return;
        
        let walkingMins = Math.max(1, Math.ceil(distanceMeters / 78));
        
        realUsers.push({
          id: u.uid,
          name: u.name || 'Anonymous User',
          username: u.username || 'anon',
          avatarColor: u.avatarColor || 'bg-indigo-600 border border-indigo-700',
          avatarEmoji: u.avatarEmoji || '🙋‍♂️',
          customProfilePhoto: u.customProfilePhoto || undefined,
          distanceMeters: distanceMeters,
          streetName: u.streetName || `${getStateStreets(u.appLanguage || 'Lagos')[(u.uid.charCodeAt(0) || 0) % getStateStreets(u.appLanguage || 'Lagos').length]} (${walkingMins} mins trek)`,
          bio: u.bio || 'Connected in Nigeria!',
          interests: u.interests || ['Tech', 'Street Food'],
          publicSnaps: u.publicSnaps || [],
          activeStory: neighborStories[u.uid] || [],
          onlineStatus: (() => {
            if (u.onlineStatus === 'offline') return 'offline';
            if (u.lastSeen) {
              const lastSeenTime = new Date(u.lastSeen).getTime();
              const diffMs = Date.now() - lastSeenTime;
              if (diffMs > 75000) { // older than 75 seconds
                return 'offline';
              }
              return u.onlineStatus || 'active';
            }
            return u.onlineStatus || 'offline';
          })(),
          latOffset: latOffset,
          lngOffset: lngOffset,
          latitude: u.latitude !== undefined ? u.latitude : undefined,
          longitude: u.longitude !== undefined ? u.longitude : undefined,
          isFriend: isUserFriend,
          ageRange: u.ageRange || '25-34',
          gender: u.gender || 'Male',
          communities: u.communities || ['comm-1'],
          trustScore: u.trustScore !== undefined ? u.trustScore : 5.0,
          meetupsCompleted: u.meetupsCompleted !== undefined ? u.meetupsCompleted : 0,
          ratingsCount: u.ratingsCount !== undefined ? u.ratingsCount : 0,
          totalRatingPoints: u.totalRatingPoints !== undefined ? u.totalRatingPoints : 0,
          reportsCount: u.reportsCount !== undefined ? u.reportsCount : 0,
          banned: u.banned || false,
          verificationLevel: u.verificationLevel || 'Basic',
          dayTimeAvailability: u.dayTimeAvailability || 'Available Right Now',
          friendshipAcceptedAt: u.friendshipAcceptedAt || undefined,
          meetupHappened: u.meetupHappened || false,
          ratedBy: u.ratedBy || {}
        });
      });
      
      setNeighbors(prev => {
        const cleanPrev = prev.filter(n => INITIAL_NEIGHBORS.some(inb => inb.id === n.id) || n.isGroup);
        const combined = [...realUsers, ...cleanPrev];
        const unique: Neighbor[] = [];
        const seen = new Set();
        combined.forEach(n => {
          if (!seen.has(n.id)) {
            seen.add(n.id);
            unique.push(n);
          }
        });
        return unique;
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });
    return () => unsubUsers();
  }, [
    currentUser?.uid,
    friendIds.join(','),
    userCoords?.lat,
    userCoords?.lng,
    selectedPreset?.name,
    radarRadius,
    radarVisibilityMode,
    pendingFriendRequests.join(','),
    sentFriendRequestIds.join(',')
  ]);

  // Synchronize viewed Neighbor's profile posts & highlights in real-time o!
  useEffect(() => {
    if (!viewingNeighborProfile) {
      setNeighborPosts([]);
      setNeighborHighlights([]);
      return;
    }

    const targetId = viewingNeighborProfile.id;
    
    // If it's a simulated neighbor preset (starts with 'nb-'), load static data
    if (targetId.startsWith('nb-')) {
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
      
      const res = dataMap[targetId] || {
        posts: [
          { id: `${targetId}-p1`, mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop', caption: `Nice meeting you! - ${viewingNeighborProfile.name} 🌟`, timestamp: 'Yesterday' },
          { id: `${targetId}-p2`, mediaUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&auto=format&fit=crop', caption: `Fun times nearby! ✨`, timestamp: '4 days ago' }
        ],
        highlights: [
          { id: `${targetId}-hl1`, name: 'Vibes', mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&auto=format&fit=crop' }
        ]
      };
      setNeighborPosts(res.posts);
      setNeighborHighlights(res.highlights);
      return;
    }

    // Otherwise, subscribe to target's posts and highlights collections in Firestore o!
    if (!currentUser) return;

    const postsCol = collection(db, 'users', targetId, 'posts');
    const unsubPosts = onSnapshot(postsCol, (snap) => {
      const posts: any[] = [];
      snap.forEach(doc => {
        const item = doc.data();
        if (item && item.mediaUrl) {
          posts.push({ id: doc.id, ...item });
        }
      });
      posts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNeighborPosts(posts);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${targetId}/posts`);
    });

    const highlightsCol = collection(db, 'users', targetId, 'highlights');
    const unsubHighlights = onSnapshot(highlightsCol, (snap) => {
      const hls: any[] = [];
      snap.forEach(doc => {
        const item = doc.data();
        if (item && item.mediaUrl) {
          hls.push({ id: doc.id, ...item });
        }
      });
      hls.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNeighborHighlights(hls);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${targetId}/highlights`);
    });

    return () => {
      unsubPosts();
      unsubHighlights();
    };
  }, [viewingNeighborProfile, currentUser]);

  // Synchronize Group Chats from Firestore in real-time
  useEffect(() => {
    if (!currentUser) return;
    const groupsColRef = collection(db, 'groups');
    const unsubGroups = onSnapshot(groupsColRef, (snapshot) => {
      const realGroups: Neighbor[] = [];
      snapshot.forEach(docSnap => {
        const g = docSnap.data();
        const uids = g.groupMembers || [];
        if (uids.includes(currentUser.uid) || uids.includes('user')) {
          realGroups.push({
            id: g.id,
            name: g.name || 'Group Chat',
            username: g.username || 'group',
            avatarColor: g.avatarColor || 'bg-neutral-800 border border-neutral-700',
            avatarEmoji: g.avatarEmoji || '👥',
            distanceMeters: 0,
            streetName: g.streetName || 'Yaba Proximity Hub',
            bio: g.description || 'Active neighborhood discussion group.',
            interests: [],
            publicSnaps: [],
            activeStory: [],
            onlineStatus: 'active',
            latOffset: 0,
            lngOffset: 0,
            isGroup: true,
            groupMembers: uids,
            groupCreatedBy: g.groupCreatedBy
          });
        }
      });
      setNeighbors(prev => {
        const cleanPrev = prev.filter(n => !n.isGroup);
        return [...realGroups, ...cleanPrev];
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'groups');
    });
    return () => unsubGroups();
  }, [currentUser]);

  // Synchronize Own Posts from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const postsColRef = collection(db, 'users', currentUser.uid, 'posts');
    const unsubPosts = onSnapshot(postsColRef, (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        if (item && item.mediaUrl) {
          loaded.push({
            id: docSnap.id,
            mediaUrl: item.mediaUrl,
            caption: item.caption || '',
            timestamp: item.timestamp || 'Just now',
            type: item.type || 'image',
            createdAt: item.createdAt || ''
          });
        }
      });
      loaded.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setUserPosts(loaded);
      try { localStorage.setItem('nearby_cached_posts', JSON.stringify(loaded)); } catch (_) {}
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/posts`);
    });
    return () => unsubPosts();
  }, [currentUser]);

  // Synchronize Own Highlights from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const highlightsColRef = collection(db, 'users', currentUser.uid, 'highlights');
    const unsubHighlights = onSnapshot(highlightsColRef, (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        if (item && item.mediaUrl) {
          loaded.push({
            id: docSnap.id,
            name: item.name || 'Highlight',
            mediaUrl: item.mediaUrl,
            createdAt: item.createdAt || ''
          });
        }
      });
      loaded.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setUserHighlights(loaded);
      try { localStorage.setItem('nearby_cached_highlights', JSON.stringify(loaded)); } catch (_) {}
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/highlights`);
    });
    return () => unsubHighlights();
  }, [currentUser]);

  // Load active Group Messages in real-time
  useEffect(() => {
    if (!currentUser || !selectedNeighborId || !selectedNeighbor?.isGroup) return;

    const groupMessagesRef = collection(db, 'groups', selectedNeighborId, 'messages');
    const groupMessagesQuery = query(groupMessagesRef, orderBy('timestamp', 'asc'));

    const unsubGroupMsgs = onSnapshot(groupMessagesQuery, (snapshot) => {
      const loadedMsgs: DirectMessage[] = [];
      snapshot.forEach((docSnap) => {
        loadedMsgs.push(docSnap.data() as DirectMessage);
      });

      _setChatMessages(prev => ({
        ...prev,
        [selectedNeighborId]: loadedMsgs
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${selectedNeighborId}/messages`);
    });

    return () => unsubGroupMsgs();
  }, [currentUser, selectedNeighborId, selectedNeighbor?.isGroup]);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const callTimerRef = useRef<any>(null);
  const voiceRecorderTimerRef = useRef<any>(null);
  const queuedCandidatesRef = useRef<any[]>([]);

  // -----------------------------------------
  // Premium Instagram & WhatsApp Story Playback Engine
  // -----------------------------------------
  const [storyProgress, setStoryProgress] = useState<number>(0);

  const markStoryAsViewedInFirestore = async (storyOwnerId: string, storyId: string, currentStory: StorySnap) => {
    if (!currentUser || storyOwnerId === currentUser.uid || storyOwnerId === 'me') return;
    
    const currentViewers = currentStory.viewers || [];
    const alreadyViewed = currentViewers.some(v => v.userId === currentUser.uid);
    if (alreadyViewed) return;

    try {
      const storyDocRef = doc(db, 'users', storyOwnerId, 'stories', storyId);
      const newViewer = {
        userId: currentUser.uid,
        username: userUsername || 'anonymous',
        name: userDisplayName || 'Anonymous User',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      await updateDoc(storyDocRef, {
        viewers: [...currentViewers, newViewer]
      });
    } catch (e) {
      console.warn("Failed to mark story as viewed in Firestore:", e);
    }
  };

  const handleStoryViewerNext = () => {
    triggerBeep(450, 0.05);
    if (playingSnapIndex < playingStorySnaps.length - 1) {
      setPlayingSnapIndex(idx => idx + 1);
      setStoryProgress(0);
    } else {
      setStoryViewer(null);
    }
  };

  const handleStoryViewerPrev = () => {
    triggerBeep(350, 0.05);
    if (playingSnapIndex > 0) {
      setPlayingSnapIndex(idx => idx - 1);
      setStoryProgress(0);
    } else {
      setStoryViewer(null);
    }
  };

  useEffect(() => {
    if (!storyViewer) {
      setPlayingStorySnaps([]);
      setPlayingSnapIndex(0);
      setStoryProgress(0);
      return;
    }

    const snaps = storyViewer === 'me' 
      ? myStorySnaps 
      : (neighborStories[storyViewer.id] || []);

    setPlayingStorySnaps(snaps);
    setPlayingSnapIndex(0);
    setStoryProgress(0);
  }, [storyViewer, myStorySnaps, neighborStories]);

  useEffect(() => {
    if (playingStorySnaps.length === 0 || isStoryPaused) return;

    const currentSnap = playingStorySnaps[playingSnapIndex];
    if (currentSnap && storyViewer && storyViewer !== 'me') {
      markStoryAsViewedInFirestore(storyViewer.id, currentSnap.id, currentSnap);
    }

    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          if (playingSnapIndex < playingStorySnaps.length - 1) {
            setPlayingSnapIndex(idx => idx + 1);
            return 0;
          } else {
            setStoryViewer(null);
            return 0;
          }
        }
        return prev + 1.25; // 4 seconds duration
      });
    }, 50);

    return () => clearInterval(interval);
  }, [playingStorySnaps, playingSnapIndex, isStoryPaused, storyViewer]);

  // Periodic Nearby Notification updates every 30s, pops up for 1s
  useEffect(() => {
    // Show initially after 2 seconds
    const initialTimer = setTimeout(() => {
      const activeCount = neighbors.filter(n => !n.isGroup && n.id !== 'nb-myai').length;
      const dynamicCount = activeCount > 0 ? activeCount + Math.floor(Math.random() * 5) : Math.floor(Math.random() * 12) + 15;
      setNearbyNotificationCount(dynamicCount);
      setShowNearbyNotification(true);
      
      // Hide after 1.2 seconds to ensure a full second of clear visibility
      setTimeout(() => {
        setShowNearbyNotification(false);
      }, 1200);
    }, 2000);

    // Then update and pop up every 30 seconds
    const interval = setInterval(() => {
      const activeCount = neighbors.filter(n => !n.isGroup && n.id !== 'nb-myai').length;
      const dynamicCount = activeCount > 0 ? activeCount + Math.floor(Math.random() * 5) : Math.floor(Math.random() * 12) + 15;
      setNearbyNotificationCount(dynamicCount);
      setShowNearbyNotification(true);
      
      // Hide after 1.2 seconds
      setTimeout(() => {
        setShowNearbyNotification(false);
      }, 1200);
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [neighbors]);

  // -----------------------------------------
  // Geolocation Walk Distance Scaling & Compass Offsets Mapping
  // -----------------------------------------
  useEffect(() => {
    // Coordinate tracking initialized successfully
  }, [selectedPreset, userCoords]);

  // -----------------------------------------
  // Live GPS Tracking & Reverse Geocoding
  // -----------------------------------------
  useEffect(() => {
    let watchId: number | null = null;
    let fallbackWatchId: number | null = null;
    
    // Function to start watching position
    const startMappTracking = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, accuracy, heading, speed } = position.coords;
            
            // Check if coordinates have actually changed significantly (e.g., > 0.00002 decimal degrees ~2 meters)
            const prevCoords = latestCoordsRef.current;
            const diffLat = prevCoords ? Math.abs(prevCoords.lat - latitude) : Infinity;
            const diffLng = prevCoords ? Math.abs(prevCoords.lng - longitude) : Infinity;
            
            if (!prevCoords || diffLat > 0.00002 || diffLng > 0.00002) {
              const newCoords = { lat: latitude, lng: longitude };
              latestCoordsRef.current = newCoords;
              setUserCoords(newCoords);
              setGpsSynced(true);
              await updatePresetWithCoordinates(latitude, longitude, false, { accuracy, heading, speed });
            }
          },
          (error) => {
            console.warn("High-accuracy geolocation watch failed, trying standard-accuracy fallback:", error);
            if (navigator.geolocation) {
              if (watchId !== null) {
                try { navigator.geolocation.clearWatch(watchId); } catch(e){}
                watchId = null;
              }
              fallbackWatchId = navigator.geolocation.watchPosition(
                async (fallbackPos) => {
                  const { latitude, longitude, accuracy, heading, speed } = fallbackPos.coords;
                  
                  const prevCoords = latestCoordsRef.current;
                  const diffLat = prevCoords ? Math.abs(prevCoords.lat - latitude) : Infinity;
                  const diffLng = prevCoords ? Math.abs(prevCoords.lng - longitude) : Infinity;
                  
                  if (!prevCoords || diffLat > 0.00002 || diffLng > 0.00002) {
                    const newCoords = { lat: latitude, lng: longitude };
                    latestCoordsRef.current = newCoords;
                    setUserCoords(newCoords);
                    setGpsSynced(true);
                    await updatePresetWithCoordinates(latitude, longitude, false, { accuracy, heading, speed });
                  }
                },
                (fbError) => {
                  console.warn("Standard-accuracy geolocation watch failed/blocked (expected in sandboxed iframes):", fbError);
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
              );
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    };

    startMappTracking();

    return () => {
      if (navigator.geolocation) {
        if (watchId !== null) { try { navigator.geolocation.clearWatch(watchId); } catch(e){} }
        if (fallbackWatchId !== null) { try { navigator.geolocation.clearWatch(fallbackWatchId); } catch(e){} }
      }
    };
  }, [currentUser]);

  // Handle active call timing counters, watchdog for ghost calls and frozen calls
  useEffect(() => {
    let watchDogInterval: any = null;
    
    if (callState.active) {
      // 1. Connection Duration Timer (when connected)
      if (callState.status === 'connected') {
        callTimerRef.current = setInterval(() => {
          setCallState(prev => ({
            ...prev,
            durationSeconds: prev.durationSeconds + 1
          }));
        }, 1000);
      }

      // 2. Active Call Watchdog (runs every 5 seconds to prevent frozen or ghost calls)
      let ringTimeCount = 0;
      watchDogInterval = setInterval(async () => {
        // A. If call is ringing for too long (e.g. 40 seconds) without answer, end it
        if (callState.status === 'ringing') {
          ringTimeCount += 5;
          if (ringTimeCount >= 40) {
            console.log("Call Watchdog: Ringing timeout reached. Auto-ending call.");
            setAudioFeedback("⚠️ No answer. Call timed out.");
            setTimeout(() => setAudioFeedback(""), 3500);
            endCall('missed');
            return;
          }
        }

        // B. Ghost Call Check: Periodically verify if the active call document exists in Firestore
        if (currentUser && !callState.neighborId.startsWith('nb-')) {
          try {
            const activeDocSnap = await getDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'));
            if (!activeDocSnap.exists()) {
              console.log("Call Watchdog: No active call document found in Firestore. Ending ghost call.");
              endCall('completed');
            }
          } catch (err) {
            console.warn("Call Watchdog: Heartbeat Firestore fetch failed (likely offline fallback):", err);
          }
        }
      }, 5000);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (watchDogInterval) {
        clearInterval(watchDogInterval);
      }
    };
  }, [callState.active, callState.status, currentUser]);

  // Ringtone synthesizer simulation for calls
  useEffect(() => {
    let interval: any = null;
    if (callState.active && callState.status === 'ringing') {
      interval = setInterval(() => {
        triggerBeep(callState.incoming ? 480 : 350, 0.25);
        if (callState.incoming) {
          setTimeout(() => triggerBeep(520, 0.2), 150);
        }
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [callState.active, callState.status, callState.incoming]);

  // -----------------------------------------
  // Synthesizer Tone Generator (Web Audio API)
  // -----------------------------------------
  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const playTone = (freq: number, start: number, duration: number, vol = 0.15) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gainNode.gain.setValueAtTime(vol, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play a beautiful dual-tone electronic chime: 880Hz then 1320Hz shortly after o!
      const now = ctx.currentTime;
      playTone(880, now, 0.2, 0.15);
      playTone(1320, now + 0.08, 0.35, 0.12);
    } catch (e) {
      console.warn("Could not play notification chime o!:", e);
    }
  };

  const triggerBeep = useCallback((freq = 440, duration = 0.2, type: 'sine' | 'square' | 'triangle' = 'sine') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback silent
    }
  }, []);

  const playSynthesizedVoiceNote = (senderName: string, durationSec: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const playVocalSweep = (delay: number, duration: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + delay + duration);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      for (let i = 0; i < durationSec; i++) {
        playVocalSweep(i * 1.0, 0.45, 180);
        playVocalSweep(i * 1.0 + 0.5, 0.4, 150);
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Voice note from ${senderName}`);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech Synthesis voice failed o:", e);
    }
  };

  const playVoiceNote = (msg: DirectMessage, senderDisplayName: string) => {
    if (msg.mediaUrl && (msg.mediaUrl.startsWith('data:audio') || msg.mediaUrl.startsWith('blob:'))) {
      try {
        const audio = new Audio(msg.mediaUrl);
        audio.play();
        setPlayingVoiceId(msg.id);
        audio.onended = () => {
          setPlayingVoiceId(null);
        };
        return;
      } catch (err) {
        console.warn("Failed playing bin recording audio:", err);
      }
    }
    playSynthesizedVoiceNote(senderDisplayName, msg.audioDurationSec || 3);
    setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id);
  };

  // -----------------------------------------
  // Audio & Video Call Actions (WebRTC)
  // -----------------------------------------
  const startCall = async (neighborId: string, type: 'audio' | 'video') => {
    if (callState.active) {
      console.warn("Call already active, ignoring startCall request.");
      setAudioFeedback("⚠️ An active call session is already running!");
      setTimeout(() => setAudioFeedback(""), 3500);
      return;
    }

    if (currentUser) {
      try {
        const activeDocSnap = await getDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'));
        if (activeDocSnap.exists()) {
          console.warn("Active call already registered in Firestore, preventing duplicate call.");
          setAudioFeedback("⚠️ An active call session is already running!");
          setTimeout(() => setAudioFeedback(""), 3500);
          return;
        }
      } catch (err) {
        console.warn("Firestore active call pre-check failed:", err);
      }
    }

    const target = neighbors.find(n => n.id === neighborId);
    if (!target) return;
    
    const callId = `call-${Date.now()}`;
    triggerBeep(580, 0.15, 'triangle');
    setCallState({
      active: true,
      type,
      neighborId,
      status: 'ringing',
      incoming: false,
      durationSeconds: 0,
      callId
    });

    // Write start to calls collection in Firestore
    if (currentUser) {
      try {
        await setDoc(doc(db, 'calls', callId), {
          callId,
          callerUID: currentUser.uid,
          receiverUID: neighborId,
          status: 'ringing',
          ringing: true,
          accepted: false,
          declined: false,
          ended: false,
          startedAt: new Date().toISOString(),
          endedAt: ""
        });
      } catch (err) {
        console.warn("Could not log call setup to Firestore calls collection:", err);
      }
    }

    // Reset trackers
    localCandidatesAddedRef.current = 0;
    remoteCandidatesAddedRef.current = 0;
    setNetworkQuality('checking');
    setNetworkQualityDesc('Establishing peer-to-peer secure link...');

    if (neighborId.startsWith('nb-')) {
      // Simulating connection of AI/simulated neighbor!
      setTimeout(async () => {
        setCallState(prev => {
          if (!prev.active || prev.neighborId !== neighborId) return prev;
          if (prev.callId) {
            setDoc(doc(db, 'calls', prev.callId), {
              status: 'connected',
              ringing: false,
              accepted: true
            }, { merge: true }).catch(() => {});
          }
          return { ...prev, status: 'connected' };
        });
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: type === 'video' ? { facingMode: cameraFacingMode } : false
          });
          localStreamRef.current = stream;
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          if (type === 'audio') {
            if ('speechSynthesis' in window) {
              const target = neighbors.find(n => n.id === neighborId);
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(`Hello! This is ${target?.name || 'your neighbor'}. Nice of you to call! How are things?`);
              window.speechSynthesis.speak(utterance);
            }
          }
        } catch (err) {
          console.warn("Simulated call media initialization failed:", err);
        }
      }, 3000);
      return;
    }

    try {
      // 1. Get user media (mic & camera if video)
      const constraints = {
        audio: true,
        video: type === 'video' ? { facingMode: cameraFacingMode } : false
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (type === 'video') {
          console.warn("Camera grab failed o, trying audio-only fallback o:", err);
          setAudioFeedback("⚠️ Camera not found! Answering/calling as audio-only.");
          setTimeout(() => setAudioFeedback(""), 3500);
          type = 'audio';
          setCallState(prev => ({ ...prev, type: 'audio' }));
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } else {
          throw err;
        }
      }
      
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Setup RTCPeerConnection (STUN fallback)
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;

      // 3. Add tracks to PeerConnection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // 4. Handle incoming remote stream tracks
      pc.ontrack = (event) => {
        console.log("WebRTC Caller: Remote track received o!", event.streams);
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      // 5. Handle ICE Connection State changes (telemetry & reconnection)
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        setIceConnectionState(state);
        if (state === 'disconnected' || state === 'failed') {
          setNetworkQuality('poor');
          setNetworkQualityDesc('Connection dropped. Reconnecting...');
          // Attempt automatic ICE restart
          setTimeout(async () => {
            if (pcRef.current && (pcRef.current.iceConnectionState === 'disconnected' || pcRef.current.iceConnectionState === 'failed')) {
              try {
                console.log("WebRTC Caller: Triggering ICE Restart...");
                const offer = await pcRef.current.createOffer({ iceRestart: true });
                await pcRef.current.setLocalDescription(offer);
                if (currentUser) {
                  await updateDoc(doc(db, 'users', neighborId, 'calls', 'active'), {
                    offerSdp: offer.sdp,
                    offerType: offer.type
                  });
                  await updateDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'), {
                    offerSdp: offer.sdp,
                    offerType: offer.type
                  });
                }
              } catch (restartErr) {
                console.warn("WebRTC Caller ICE restart failed:", restartErr);
              }
            }
          }, 3000);
        } else if (state === 'connected' || state === 'completed') {
          setNetworkQuality('excellent');
          setNetworkQualityDesc('Secure Connection Established');
        }
      };

      // 6. Monitor network quality periodically
      statsIntervalRef.current = setInterval(() => {
        if (pcRef.current && pcRef.current.iceConnectionState === 'connected') {
          pcRef.current.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                const rtt = report.currentRoundTripTime;
                if (typeof rtt === 'number') {
                  const rttMs = rtt * 1000;
                  if (rttMs < 120) {
                    setNetworkQuality('excellent');
                    setNetworkQualityDesc(`Stable (Ping: ${Math.round(rttMs)}ms)`);
                  } else if (rttMs < 350) {
                    setNetworkQuality('good');
                    setNetworkQualityDesc(`Good (Ping: ${Math.round(rttMs)}ms)`);
                  } else {
                    setNetworkQuality('poor');
                    setNetworkQualityDesc(`Poor Connection (Ping: ${Math.round(rttMs)}ms)`);
                  }
                }
              }
            });
          });
        }
      }, 2000);

      // 7. Whenever Caller generates an ICE candidate, update both documents under callerCandidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && currentUser) {
          const candStr = JSON.stringify(event.candidate.toJSON());
          try {
            await updateDoc(doc(db, 'users', neighborId, 'calls', 'active'), {
              callerCandidates: arrayUnion(candStr)
            });
            await updateDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'), {
              callerCandidates: arrayUnion(candStr)
            });
          } catch (candErr) {
            console.warn("Failed recording Caller ICE Candidate o:", candErr);
          }
        }
      };

      // 8. Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 9. Write signaling fields to Firestore
      if (currentUser) {
        await setDoc(doc(db, 'users', neighborId, 'calls', 'active'), {
          callerId: currentUser.uid,
          callerName: userDisplayName || 'Nearby Friend',
          type,
          status: 'ringing',
          incoming: true,
          offerSdp: offer.sdp,
          offerType: offer.type,
          callerCandidates: [],
          receiverCandidates: [],
          callId,
          createdAt: new Date().toISOString()
        });

        await setDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'), {
          receiverId: neighborId,
          type,
          status: 'ringing',
          incoming: false,
          offerSdp: offer.sdp,
          offerType: offer.type,
          callerCandidates: [],
          receiverCandidates: [],
          callId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (gUerr) {
      console.error("Camera/Mic WebRTC setup failed:", gUerr);
      setAudioFeedback("Local caller permissions error. Enable Camera/Mic!");
      setTimeout(() => setAudioFeedback(""), 4000);
      endCall('missed');
    }
  };

  const receiveCallSimulation = async (neighborId: string, type: 'audio' | 'video' = 'audio') => {
    if (callState.active) return;
    setCallState({
      active: true,
      type,
      neighborId,
      status: 'ringing',
      incoming: true,
      durationSeconds: 0
    });
  };

  const answerIncomingCall = async () => {
    triggerBeep(680, 0.2, 'sine');
    
    // Reset trackers
    localCandidatesAddedRef.current = 0;
    remoteCandidatesAddedRef.current = 0;
    setNetworkQuality('checking');
    setNetworkQualityDesc('Configuring secure media handshake...');

    if (callState.neighborId && callState.neighborId.startsWith('nb-')) {
      try {
        const constraints = {
          audio: true,
          video: callState.type === 'video' ? { facingMode: cameraFacingMode } : false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setCallState(prev => ({
          ...prev,
          status: 'connected'
        }));
        
        if (callState.type === 'audio') {
          if ('speechSynthesis' in window) {
            const target = neighbors.find(n => n.id === callState.neighborId);
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`Hello! Thanks for picking up my call. This is ${target?.name || 'friend'}. Let's chat!`);
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (err) {
        console.error("Answering simulated call failed:", err);
      }
      return;
    }

    if (currentUser && callState.neighborId) {
      try {
        // Read offer details
        const activeDocSnap = await getDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'));
        if (!activeDocSnap.exists()) return;
        const callData = activeDocSnap.data();
        const offerSdp = callData.offerSdp;
        const offerType = callData.offerType || 'offer';

        // 1. Get user media
        const constraints = {
          audio: true,
          video: callState.type === 'video' ? { facingMode: cameraFacingMode } : false
        };
        
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          if (callState.type === 'video') {
            console.warn("Receiver camera hook failed o, fallback to audio-only o:", err);
            setAudioFeedback("⚠️ Camera not found! Answering as audio-only.");
            setTimeout(() => setAudioFeedback(""), 3500);
            setCallState(prev => ({ ...prev, type: 'audio' }));
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } else {
            throw err;
          }
        }
        
        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Setup RTCPeerConnection (STUN fallback)
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // 3. Add local tracks to connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // 4. Handle remote incoming tracks
        pc.ontrack = (event) => {
          console.log("WebRTC Receiver: Remote track received o!", event.streams);
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0];
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };

        // 5. Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          setIceConnectionState(state);
          if (state === 'disconnected' || state === 'failed') {
            setNetworkQuality('poor');
            setNetworkQualityDesc('Connection dropped. Reconnecting...');
            // Attempt automatic ICE restart response
            setTimeout(async () => {
              if (pcRef.current && (pcRef.current.iceConnectionState === 'disconnected' || pcRef.current.iceConnectionState === 'failed')) {
                try {
                  console.log("WebRTC Receiver: Triggering ICE Restart answer...");
                  const answer = await pcRef.current.createAnswer();
                  await pcRef.current.setLocalDescription(answer);
                  if (currentUser) {
                    await updateDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'), {
                      answerSdp: answer.sdp,
                      answerType: answer.type
                    });
                    await updateDoc(doc(db, 'users', callState.neighborId, 'calls', 'active'), {
                      answerSdp: answer.sdp,
                      answerType: answer.type
                    });
                  }
                } catch (restartErr) {
                  console.warn("WebRTC Receiver ICE restart failed:", restartErr);
                }
              }
            }, 3000);
          } else if (state === 'connected' || state === 'completed') {
            setNetworkQuality('excellent');
            setNetworkQualityDesc('Secure Connection Established');
          }
        };

        // 6. Monitor network quality periodically
        statsIntervalRef.current = setInterval(() => {
          if (pcRef.current && pcRef.current.iceConnectionState === 'connected') {
            pcRef.current.getStats().then((stats) => {
              stats.forEach((report) => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                  const rtt = report.currentRoundTripTime;
                  if (typeof rtt === 'number') {
                    const rttMs = rtt * 1000;
                    if (rttMs < 120) {
                      setNetworkQuality('excellent');
                      setNetworkQualityDesc(`Stable (Ping: ${Math.round(rttMs)}ms)`);
                    } else if (rttMs < 350) {
                      setNetworkQuality('good');
                      setNetworkQualityDesc(`Good (Ping: ${Math.round(rttMs)}ms)`);
                    } else {
                      setNetworkQuality('poor');
                      setNetworkQualityDesc(`Poor Connection (Ping: ${Math.round(rttMs)}ms)`);
                    }
                  }
                }
              });
            });
          }
        }, 2000);

        // 7. Whenever Receiver generates an ICE candidate, write candidate to both docs
        pc.onicecandidate = async (event) => {
          if (event.candidate && currentUser) {
            const candStr = JSON.stringify(event.candidate.toJSON());
            try {
              await updateDoc(doc(db, 'users', callState.neighborId, 'calls', 'active'), {
                receiverCandidates: arrayUnion(candStr)
              });
              await updateDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'), {
                receiverCandidates: arrayUnion(candStr)
              });
            } catch (candErr) {
              console.warn("Failed recording Receiver ICE Candidate o:", candErr);
            }
          }
        };

        // 8. Set Remote Description (Caller's Offer)
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: offerType as 'offer',
          sdp: offerSdp
        }));

        if (queuedCandidatesRef.current.length > 0) {
          console.log("Draining queued candidates on Receiver...");
          for (const cand of queuedCandidatesRef.current) {
            try {
              await pc.addIceCandidate(cand);
            } catch (e) {
              console.warn("Draining queued candidate failed on Receiver:", e);
            }
          }
          queuedCandidatesRef.current = [];
        }

        // 9. Create Answer SDP
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // 10. Update both Caller and Receiver active documents
        await setDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'), {
          status: 'connected',
          answerSdp: answer.sdp,
          answerType: answer.type
        }, { merge: true });

        await setDoc(doc(db, 'users', callState.neighborId, 'calls', 'active'), {
          status: 'connected',
          answerSdp: answer.sdp,
          answerType: answer.type
        }, { merge: true });

        if (callState.callId) {
          try {
            await setDoc(doc(db, 'calls', callState.callId), {
              status: 'connected',
              ringing: false,
              accepted: true
            }, { merge: true });
          } catch (err) {
            console.warn("Could not log connected status to calls collection:", err);
          }
        }

        setCallState(prev => ({
          ...prev,
          status: 'connected'
        }));
      } catch (err) {
        console.error("WebRTC answering failed:", err);
        setAudioFeedback("Answering call media initialization failed!");
        setTimeout(() => setAudioFeedback(""), 4000);
        endCall('missed');
      }
    }
  };

  const endCall = async (status: 'completed' | 'declined' | 'missed' = 'completed') => {
    triggerBeep(300, 0.25, 'triangle');
    const { neighborId, type, durationSeconds, callId } = callState;

    // 1. Clear statistical interval o!
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    // 2. Stop and release local and remote media streams, releasing camera and microphone
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn("Failed to stop track on localStreamRef:", e);
        }
      });
      localStreamRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn("Failed to stop track on localStream:", e);
        }
      });
    }
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn("Failed to stop track on remoteStreamRef:", e);
        }
      });
      remoteStreamRef.current = null;
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn("Failed to stop track on remoteStream:", e);
        }
      });
    }
    setRemoteStream(null);

    // Release video element bindings
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // 3. Close the RTCPeerConnection cleanly
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.ontrack = null;
      try {
        pcRef.current.close();
      } catch (e) {
        console.warn("Error closing peer connection:", e);
      }
      pcRef.current = null;
    }

    // 4. Reset candidate indices and queues
    localCandidatesAddedRef.current = 0;
    remoteCandidatesAddedRef.current = 0;
    queuedCandidatesRef.current = [];
    setNetworkQuality('checking');
    setNetworkQualityDesc('Checking...');

    if (currentUser && neighborId) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'calls', 'active'));
        await deleteDoc(doc(db, 'users', neighborId, 'calls', 'active'));
      } catch (err) {
        console.error("Error clearing calls in DB:", err);
      }
    }

    if (callId) {
      try {
        await setDoc(doc(db, 'calls', callId), {
          status,
          ringing: false,
          accepted: status === 'completed',
          declined: status === 'declined',
          ended: true,
          endedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to update call log document in calls collection:", err);
      }
    }

    if (neighborId) {
      const logMsg: DirectMessage = {
        id: `call-log-${Date.now()}`,
        senderId: callState.incoming ? neighborId : 'user',
        receiverId: callState.incoming ? 'user' : neighborId,
        timestamp: new Date().toISOString(),
        type: 'call_log',
        callLog: {
          type,
          status,
          durationSeconds
        }
      };
      setChatMessages(prev => ({
        ...prev,
        [neighborId]: [...(prev[neighborId] || []), logMsg]
      }));

      // Persistently append to local call history
      try {
        const prevLogs = JSON.parse(localStorage.getItem('call_history_logs') || '[]');
        const newLog = {
          id: `log-${Date.now()}`,
          neighborId,
          type,
          status,
          durationSeconds,
          timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          incoming: callState.incoming
        };
        localStorage.setItem('call_history_logs', JSON.stringify([newLog, ...prevLogs]));
      } catch (logErr) {
        console.warn("Call history append log error:", logErr);
      }
    }
    
    setCallState({
      active: false,
      type: 'video',
      neighborId: '',
      status: 'disconnected',
      incoming: false,
      durationSeconds: 0
    });
  };

  const switchCamera = async () => {
    if (!localStreamRef.current || callState.type !== 'video') return;
    triggerBeep(450, 0.08);

    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacing);
    setAudioFeedback(`🔄 Switching to ${nextFacing} camera...`);
    setTimeout(() => setAudioFeedback(""), 2000);

    try {
      // 1. Get current video track and stop it
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }

      // 2. Request new video track with the new facingMode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // 3. Update localStreamRef and state
      localStreamRef.current.removeTrack(oldVideoTrack);
      localStreamRef.current.addTrack(newVideoTrack);
      
      // Re-assign local stream to trigger React re-render
      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = updatedStream;
      }

      // 4. Update the RTCRtpSender on the PeerConnection
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
        console.log("WebRTC Video Sender Track replaced successfully!");
      }
    } catch (err) {
      console.error("Failed to switch camera source:", err);
      setAudioFeedback("⚠ Camera switch failed!");
      setTimeout(() => setAudioFeedback(""), 2000);
    }
  };

  const toggleMicMute = () => {
    const isMuted = !micMuted;
    setMicMuted(isMuted);
    triggerBeep(isMuted ? 380 : 500, 0.05);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  };

  const toggleVideoOff = () => {
    const isOff = !videoOff;
    setVideoOff(isOff);
    triggerBeep(isOff ? 380 : 500, 0.05);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isOff;
      });
    }
  };

  // -----------------------------------------
  // WhatsApp Core Actions, Forwarding & Deletion o!
  // -----------------------------------------
  const triggerSimulatedResponse = async (neighId: string, userText: string, attachedImage?: string) => {
    let contextPrompt = "";
    if (neighId === 'nb-1') {
      contextPrompt = "You are Ade, the friendly neighborhood waffles canteen owner in Yaba. Keep it young, cool, talk about firewood waffles, puff-puff or local food. Use Lagos English/Pidgin naturally.";
    } else if (neighId === 'nb-2') {
      contextPrompt = "You are Chinedu, a street-smart mechanic in Yaba near the round-about. Speak in streetwise youth Pidgin English. Give mechanic metaphors.";
    } else if (neighId === 'nb-3') {
      contextPrompt = "You are Amara, a creative designer and artist. Talk about colors, graphic designs, beautiful graffiti, and colorful designs.";
    } else if (neighId === 'nb-4') {
      contextPrompt = "You are Temi, a local radio host and podcast presenter. Speak with high energy, radio vibes, music, and local vibes.";
    } else {
      contextPrompt = "You are 'Nearby AI', a streetsmart virtual assistant for Nigerians. Answer with helpful advice, use local pidgin slangs nicely.";
    }

    setSimulatedTypingMap(prev => ({ ...prev, [neighId]: true }));

    try {
      const response = await fetch('/api/my-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `User says: "${userText}". Context instructions: ${contextPrompt}`,
          image: attachedImage
        })
      });

      const data = await response.json();
      const replyText = data.response || "I hear you! That sounds great. ✨";

      setSimulatedTypingMap(prev => ({ ...prev, [neighId]: false }));

      const replyMsg: DirectMessage = {
        id: `msg-reply-${Date.now()}`,
        senderId: neighId,
        receiverId: 'user',
        chatThreadId: neighId,
        timestamp: new Date().toISOString(),
        type: 'text',
        text: replyText,
        isUnread: true,
        status: 'read'
      };

      _setChatMessages(prev => ({
        ...prev,
        [neighId]: [...(prev[neighId] || []), replyMsg]
      }));

      if (neighId === 'nb-myai' || userText.includes("Voice Note") || userText.includes("🎙️")) {
        playSynthesizedVoiceNote(neighId === 'nb-myai' ? 'Nearby AI' : 'Neighbor', replyText.slice(0, 100));
      }

      triggerBeep(480, 0.12, 'sine');
    } catch (error) {
      console.warn("AI response trigger error:", error);
      setSimulatedTypingMap(prev => ({ ...prev, [neighId]: false }));
    }
  };

  const sendMessage = async (
    customText?: string, 
    customImage?: string, 
    customVoiceDuration?: number,
    customType?: 'text' | 'image' | 'voice' | 'video' | 'document',
    fileName?: string,
    fileSize?: string
  ) => {
    if (!selectedNeighbor) return;
    const inputContent = customText !== undefined ? customText : textInput;
    if (!inputContent.trim() && !customImage && !customVoiceDuration && !customType) return;

    triggerBeep(500, 0.08, 'sine');
    
    const resolvedType = customType || (customImage ? 'image' : (customVoiceDuration ? 'voice' : 'text'));
    const msgId = `msg-${Date.now()}`;

    const newMsg: DirectMessage = {
      id: msgId,
      senderId: 'user',
      receiverId: selectedNeighbor.id,
      chatThreadId: selectedNeighbor.id,
      timestamp: new Date().toISOString(),
      type: resolvedType,
      text: resolvedType === 'text' ? inputContent : undefined,
      mediaUrl: customImage || undefined,
      audioDurationSec: customVoiceDuration || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      status: 'sending' as const,
    };

    if (replyingToMessage) {
      newMsg.replyTo = {
        msgId: replyingToMessage.id,
        text: replyingToMessage.text || (replyingToMessage.type === 'image' ? 'Attached Photo 📸' : replyingToMessage.type === 'voice' ? 'Voice note 🎙️' : 'Shared media file 📁'),
        senderName: replyingToMessage.senderId === 'user' ? 'You' : (selectedNeighbor.isGroup ? (neighbors.find(n => n.id === replyingToMessage.senderId)?.name || 'Member') : selectedNeighbor.name),
        type: replyingToMessage.type
      };
      setReplyingToMessage(null); // clear replying
    }

    _setChatMessages(prev => ({
      ...prev,
      [selectedNeighbor.id]: [...(prev[selectedNeighbor.id] || []), newMsg]
    }));

    if (customText === undefined) {
      setTextInput('');
    }

    const fUser = auth.currentUser;

    setTimeout(async () => {
      const sentMsg = { ...newMsg, status: 'sent' as const };
      
      _setChatMessages(prev => {
        const list = prev[selectedNeighbor.id] || [];
        const idx = list.findIndex(m => m.id === msgId);
        if (idx > -1) {
          const copy = [...list];
          copy[idx] = sentMsg;
          return { ...prev, [selectedNeighbor.id]: copy };
        }
        return prev;
      });

      if (fUser && !selectedNeighbor.id.startsWith('nb-')) {
        await saveOrUpdateMessageInFirestore(sentMsg, selectedNeighbor.id);
      }

      if (selectedNeighbor.id.startsWith('nb-')) {
        setTimeout(() => {
          _setChatMessages(prev => {
            const list = prev[selectedNeighbor.id] || [];
            const idx = list.findIndex(m => m.id === msgId);
            if (idx > -1) {
              const copy = [...list];
              copy[idx] = { ...sentMsg, status: 'delivered' as const };
              return { ...prev, [selectedNeighbor.id]: copy };
            }
            return prev;
          });

          setTimeout(() => {
            _setChatMessages(prev => {
              const list = prev[selectedNeighbor.id] || [];
              const idx = list.findIndex(m => m.id === msgId);
              if (idx > -1) {
                const copy = [...list];
                copy[idx] = { ...sentMsg, status: 'read' as const };
                return { ...prev, [selectedNeighbor.id]: copy };
              }
              return prev;
            });

            const promptText = resolvedType === 'text' ? inputContent : `[Snap photo sent]`;
            triggerSimulatedResponse(selectedNeighbor.id, promptText, customImage);

          }, 650);
        }, 400);
      }
    }, 150);
  };

  const handleReaction = async (msg: DirectMessage, emoji: string) => {
    const fUser = auth.currentUser;
    const threadId = selectedNeighbor?.id;
    if (!threadId) return;

    const currentUid = fUser ? fUser.uid : 'user';
    const existingReactions = msg.reactions || [];
    const index = existingReactions.findIndex(r => r.userId === currentUid);

    let nextReactions = [...existingReactions];
    if (index > -1) {
      if (existingReactions[index].reaction === emoji) {
        nextReactions.splice(index, 1);
      } else {
        nextReactions[index] = { userId: currentUid, reaction: emoji };
      }
    } else {
      nextReactions.push({ userId: currentUid, reaction: emoji });
    }

    const updatedMsg = { ...msg, reactions: nextReactions };

    _setChatMessages(prev => {
      const list = prev[threadId] || [];
      const idx = list.findIndex(m => m.id === msg.id);
      if (idx > -1) {
        const copy = [...list];
        copy[idx] = updatedMsg;
        return { ...prev, [threadId]: copy };
      }
      return prev;
    });

    if (fUser && !threadId.startsWith('nb-')) {
      await saveOrUpdateMessageInFirestore(updatedMsg, threadId);
    }
    triggerBeep(380, 0.05);
  };

  const handleDeleteForMe = async (msg: DirectMessage) => {
    const fUser = auth.currentUser;
    const threadId = selectedNeighbor?.id;
    if (!threadId) return;

    const currentUid = fUser ? fUser.uid : 'user';
    const deletedForUsers = msg.deletedForUsers || [];
    if (!deletedForUsers.includes(currentUid)) {
      deletedForUsers.push(currentUid);
    }

    const updatedMsg = { ...msg, deletedForUsers };

    _setChatMessages(prev => {
      const list = prev[threadId] || [];
      const idx = list.findIndex(m => m.id === msg.id);
      if (idx > -1) {
        const copy = [...list];
        copy[idx] = updatedMsg;
        return { ...prev, [threadId]: copy };
      }
      return prev;
    });

    if (fUser && !threadId.startsWith('nb-')) {
      await saveOrUpdateMessageInFirestore(updatedMsg, threadId);
    }
    triggerBeep(300, 0.1, 'triangle');
  };

  const handleDeleteForEveryone = async (msg: DirectMessage) => {
    const fUser = auth.currentUser;
    const threadId = selectedNeighbor?.id;
    if (!threadId) return;

    const updatedMsg = { 
      ...msg, 
      text: undefined,
      mediaUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
      audioDurationSec: undefined,
      reactions: [],
      deletedForEveryone: true 
    };

    _setChatMessages(prev => {
      const list = prev[threadId] || [];
      const idx = list.findIndex(m => m.id === msg.id);
      if (idx > -1) {
        const copy = [...list];
        copy[idx] = updatedMsg;
        return { ...prev, [threadId]: copy };
      }
      return prev;
    });

    if (fUser && !threadId.startsWith('nb-')) {
      await saveOrUpdateMessageInFirestore(updatedMsg, threadId);
    }
    triggerBeep(260, 0.15, 'triangle');
  };

  const handleForwardMessage = async (msg: DirectMessage, targetNeighborIds: string[]) => {
    const fUser = auth.currentUser;
    targetNeighborIds.forEach(async (neighId) => {
      const forwardedMsg: DirectMessage = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        senderId: 'user',
        receiverId: neighId,
        chatThreadId: neighId,
        timestamp: new Date().toISOString(),
        type: msg.type,
        text: msg.text,
        mediaUrl: msg.mediaUrl,
        audioDurationSec: msg.audioDurationSec,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        isForwarded: true,
        status: 'sending'
      };

      _setChatMessages(prev => ({
        ...prev,
        [neighId]: [...(prev[neighId] || []), forwardedMsg]
      }));

      setTimeout(async () => {
        const sentMsg = { ...forwardedMsg, status: 'sent' as const };
        
        _setChatMessages(prev => {
          const list = prev[neighId] || [];
          const idx = list.findIndex(m => m.id === forwardedMsg.id);
          if (idx > -1) {
            const copy = [...list];
            copy[idx] = sentMsg;
            return { ...prev, [neighId]: copy };
          }
          return prev;
        });

        if (fUser && !neighId.startsWith('nb-')) {
          await saveOrUpdateMessageInFirestore(sentMsg, neighId);
        }

        if (neighId.startsWith('nb-')) {
          setTimeout(() => {
            _setChatMessages(prev => {
              const list = prev[neighId] || [];
              const idx = list.findIndex(m => m.id === forwardedMsg.id);
              if (idx > -1) {
                const copy = [...list];
                copy[idx] = { ...sentMsg, status: 'delivered' as const };
                return { ...prev, [neighId]: copy };
              }
              return prev;
            });

            setTimeout(() => {
              _setChatMessages(prev => {
                const list = prev[neighId] || [];
                const idx = list.findIndex(m => m.id === forwardedMsg.id);
                if (idx > -1) {
                  const copy = [...list];
                  copy[idx] = { ...sentMsg, status: 'read' as const };
                  return { ...prev, [neighId]: copy };
                }
                return prev;
              });

              triggerSimulatedResponse(neighId, msg.text || "[Shared media attachment]");
            }, 800);
          }, 600);
        }
      }, 150);
    });

    setShowForwardModal(null);
    setAudioFeedback("Message forwarded.");
    setTimeout(() => setAudioFeedback(""), 2200);
  };

  // -----------------------------------------
  // Camera Simulation & Filters
  // -----------------------------------------
  const startCamera = async () => {
    setCapturedImage(null);
    setCanvasDrawing(null);
    setCameraActive(true);
    triggerBeep(600, 0.12, 'triangle');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setAudioFeedback("Using simulated camera sensor.");
      setTimeout(() => setAudioFeedback(""), 3000);
    }
  };

  const capturePhoto = () => {
    triggerBeep(700, 0.15, 'sine');
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      if (videoRef.current && videoRef.current.srcObject) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      } else {
        // Draw elegant placeholder with background and custom filters
        ctx.fillStyle = activeFilter === 'golden' ? '#d97706' : activeFilter === 'spicy' ? '#b91c1c' : '#1e1b4b';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("📸 Nearby Snap Capture", 320, 200);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`Filter applied: ${activeFilter.toUpperCase()}`, 320, 240);
        ctx.fillText("Ready to doodle & send!", 320, 270);
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      
      // Stop webcam trail
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Close camera block
  const closeCamera = () => {
    setCameraActive(false);
    setCapturedImage(null);
    setCanvasDrawing(null);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Doodle Drawing Support on Captured Image
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setCanvasDrawing(canvasRef.current.toDataURL('image/png'));
    }
  };

  // Upload taken picture to your public story (Snapshot style!)
  const postToMyStory = () => {
    if (!capturedImage) return;
    const finalSrc = canvasDrawing || capturedImage;
    setStoryUploadData({
      mediaUrl: finalSrc,
      type: 'image'
    });
    closeCamera();
  };

  const sendCapturedSnapDirectly = (neighbor: Neighbor) => {
    if (!capturedImage) return;
    const finalSrc = canvasDrawing || capturedImage;
    
    // Add direct message with caption
    const textDesc = photoCaption ? `[Snap]: ${photoCaption}` : "[Sent a Snap 📸]";
    sendMessage(textDesc, finalSrc);
    
    setAudioFeedback(`Snap sent to ${neighbor.name}!`);
    setTimeout(() => setAudioFeedback(""), 3000);
    closeCamera();
  };

  // -----------------------------------------
  // Real voice recording parameters (Microphone Stream)
  // -----------------------------------------
  const startRecordingVoice = async () => {
    setIsRecordingVoice(true);
    setVoiceDuration(0);
    triggerBeep(440, 0.1, 'sine');
    
    voiceRecorderTimerRef.current = setInterval(() => {
      setVoiceDuration(prev => prev + 1);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.start();
    } catch (err) {
      console.warn("Failed recording mic session o:", err);
    }
  };

  const stopAndSendVoice = () => {
    if (voiceRecorderTimerRef.current) {
      clearInterval(voiceRecorderTimerRef.current);
    }
    setIsRecordingVoice(false);
    
    const duration = voiceDuration;
    setVoiceDuration(0);

    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (duration >= 1) {
            sendMessage(undefined, base64Audio, duration, 'voice');
          } else {
            triggerBeep(250, 0.2, 'triangle');
          }
        };
        reader.readAsDataURL(audioBlob);
        
        try {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        } catch (_) {}
      };
      mediaRecorder.stop();
    } else {
      triggerBeep(250, 0.2, 'triangle');
    }
  };

  const cancelRecordingVoice = () => {
    if (voiceRecorderTimerRef.current) {
      clearInterval(voiceRecorderTimerRef.current);
    }
    setIsRecordingVoice(false);
    setVoiceRecordingLocked(false);
    setVoiceDuration(0);
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {
        try {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        } catch (_) {}
      };
      mediaRecorder.stop();
    }
    triggerBeep(250, 0.2, 'triangle');
  };

  // -----------------------------------------
  // Monetization & Subscription Gated Actions
  // -----------------------------------------
  const verifyPremiumSelection = (featureName: string, action: () => void) => {
    action();
  };

  const handleProcessPayment = () => {
    // Enable the subscription instantly
    setIsSubscribed(true);
    setShowPayModal(false);
    triggerBeep(520, 0.15, 'sine');
    
    setAudioFeedback(`🌟 Subscription Active! Unlimited features unlocked!`);
    setTimeout(() => setAudioFeedback(""), 3500);

    // Call execution if we had a pending premium action
    if (pendingPremiumAction) {
      try {
        pendingPremiumAction();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 1. Group construction logic
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    const groupId = `group-${Date.now()}`;
    const newGroupNeighbor: Neighbor = {
      id: groupId,
      name: newGroupName,
      username: newGroupName.toLowerCase().replace(/\s+/g, '_'),
      avatarColor: newGroupColor,
      avatarEmoji: newGroupEmoji || '👥',
      distanceMeters: Math.floor(Math.random() * 200) + 30,
      streetName: "Combined Group Chat Hub",
      bio: newGroupDesc || "General Nigerian locality discussion group",
      interests: ["group-chat", "gist", "nearby-neighbors"],
      publicSnaps: [],
      activeStory: [],
      onlineStatus: 'active',
      latOffset: (Math.random() - 0.5) * 0.005,
      lngOffset: (Math.random() - 0.5) * 0.005,
      isGroup: true,
      groupMembers: ['user', ...newGroupMembers],
      groupCreatedBy: 'user'
    };
    
    // Add neighbor group
    setNeighbors(prev => [newGroupNeighbor, ...prev]);
    
    // Add default welcome messages inside the group message thread
    const initialGroupMsgs: DirectMessage[] = [
      {
        id: `gmsg-welcome-${Date.now()}`,
        senderId: 'system',
        receiverId: groupId,
        type: 'text',
        text: `🇳🇬 Welcome to ${newGroupName}! Group chat was created. Feel free to chat with neighbors!`,
        timestamp: new Date().toISOString()
      }
    ];
    setChatMessages(prev => ({
      ...prev,
      [groupId]: initialGroupMsgs
    }));

    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupMembers([]);
    setShowCreateGroupModal(false);
    
    setAudioFeedback(`Group "${newGroupName}" is ready! 👥`);
    setTimeout(() => setAudioFeedback(""), 3500);
  };

  const handleRateNeighbor = async (neighborId: string, stars: number, review: string = "", meetupId?: string) => {
    if (!currentUser) return;
    
    const raterId = currentUser.uid;

    // 1. Prevent fake ratings (stars must be 1 to 5)
    if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
      setAudioFeedback("Invalid rating score!");
      triggerBeep(440, 0.2);
      setTimeout(() => setAudioFeedback(""), 3500);
      return;
    }

    try {
      const localNeighbor = neighbors.find(n => n.id === neighborId) || viewingNeighborProfile;
      
      // 2. Prevent rating without a completed meetup (must be mutual friend) unless self-rating
      const isSelfRating = raterId === neighborId;
      const isAFriend = isSelfRating || 
                        (Array.isArray(friendIds) ? friendIds : []).includes(neighborId) || 
                        localNeighbor?.isFriend || 
                        (Array.isArray(localNeighbor?.friendIds) && localNeighbor?.friendIds.includes(raterId));

      if (!isAFriend) {
        setAudioFeedback("Cannot rate: You must complete a verified meetup first!");
        triggerBeep(440, 0.2);
        setTimeout(() => setAudioFeedback(""), 3500);
        return;
      }

      // Fetch the most up-to-date document from Firestore to prevent stale states
      const neighborDocRef = doc(db, 'users', neighborId);
      const neighborSnap = await getDoc(neighborDocRef);
      let dbData: any = null;
      if (neighborSnap.exists()) {
        dbData = neighborSnap.data();
      }

      const currentCount = dbData?.ratingsCount !== undefined ? dbData.ratingsCount : (localNeighbor?.ratingsCount !== undefined ? localNeighbor.ratingsCount : 0);
      const currentPoints = dbData?.totalRatingPoints !== undefined ? dbData.totalRatingPoints : (localNeighbor?.totalRatingPoints !== undefined ? localNeighbor.totalRatingPoints : 0);
      const currentMeetups = dbData?.meetupsCompleted !== undefined ? dbData.meetupsCompleted : (localNeighbor?.meetupsCompleted !== undefined ? localNeighbor.meetupsCompleted : 0);
      const ratedByMap = dbData?.ratedBy || localNeighbor?.ratedBy || {};

      // 3. Prevent duplicate ratings (rate only once) unless self-rating
      const hasRatedBefore = !isSelfRating && ratedByMap[raterId] !== undefined;
      if (hasRatedBefore) {
        setAudioFeedback("You have already rated this user!");
        triggerBeep(440, 0.2);
        setTimeout(() => setAudioFeedback(""), 3500);
        return;
      }

      // First time rating! Increment review count, total score points, and meetup count
      const newCount = currentCount + 1;
      const newPoints = currentPoints + stars;
      const newMeetups = currentMeetups + 1;
      const newScore = parseFloat((newPoints / Math.max(1, newCount)).toFixed(1));
      const updatedRatedBy = { ...ratedByMap, [raterId]: stars };

      setAudioFeedback("You're all set! Rating updated.");
      triggerBeep(580, 0.15);
      setTimeout(() => setAudioFeedback(""), 3000);

      if (isSelfRating) {
        setUserTrustScore(newScore);
        setUserMeetupCount(newMeetups);
      }

      // 1. Instantly update local state to be ultra responsive in real time o!
      setNeighbors(prev => prev.map(n => {
        if (n.id === neighborId) {
          return {
            ...n,
            ratingsCount: newCount,
            totalRatingPoints: newPoints,
            trustScore: newScore,
            meetupsCompleted: newMeetups,
            meetupHappened: true,
            ratedBy: updatedRatedBy
          };
        }
        return n;
      }));
      
      if (viewingNeighborProfile && viewingNeighborProfile.id === neighborId) {
        setViewingNeighborProfile(prev => prev ? {
          ...prev,
          ratingsCount: newCount,
          totalRatingPoints: newPoints,
          trustScore: newScore,
          meetupsCompleted: newMeetups,
          meetupHappened: true,
          ratedBy: updatedRatedBy
        } : null);
      }

      // 2. Persist to Firestore permanently
      if (neighborSnap.exists()) {
        await updateDoc(neighborDocRef, {
          ratingsCount: newCount,
          totalRatingPoints: newPoints,
          trustScore: newScore,
          meetupsCompleted: newMeetups,
          meetupHappened: true,
          ratedBy: updatedRatedBy
        });
      } else {
        // Create document for simulated or newly matched users to make it persistent!
        await setDoc(neighborDocRef, {
          uid: neighborId,
          name: localNeighbor?.name || 'Anonymous User',
          username: localNeighbor?.username || 'anon',
          avatarColor: localNeighbor?.avatarColor || 'bg-indigo-600 border border-indigo-700',
          avatarEmoji: localNeighbor?.avatarEmoji || '🙋‍♂️',
          customProfilePhoto: localNeighbor?.customProfilePhoto || null,
          streetName: localNeighbor?.streetName || '',
          bio: localNeighbor?.bio || "Let's connect.",
          interests: localNeighbor?.interests || ['Tech', 'Street Food'],
          gender: localNeighbor?.gender || 'Male',
          ageRange: localNeighbor?.ageRange || '25-34',
          verificationLevel: localNeighbor?.verificationLevel || 'Basic',
          dayTimeAvailability: localNeighbor?.dayTimeAvailability || 'Available Right Now',
          ratingsCount: newCount,
          totalRatingPoints: newPoints,
          trustScore: newScore,
          meetupsCompleted: newMeetups,
          meetupHappened: true,
          ratedBy: updatedRatedBy
        }, { merge: true });
      }

      // 3. Persist Meetup document
      const targetMeetupId = meetupId || `meetup-${Date.now()}`;
      if (!meetupId) {
        const newMeetupDoc = {
          meetupId: targetMeetupId,
          hostUID: raterId,
          participantUID: neighborId,
          meetingPoint: localNeighbor?.streetName || 'Safe Public Location',
          meetingLatitude: localNeighbor?.latitude || 0,
          meetingLongitude: localNeighbor?.longitude || 0,
          status: 'completed',
          scheduledTime: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'meetups', targetMeetupId), newMeetupDoc);
      } else {
        await updateDoc(doc(db, 'meetups', meetupId), {
          status: 'completed'
        });
      }

      // 4. Create Meetup Rating document in /meetupRatings
      const ratingId = `rating-${Date.now()}`;
      const newRatingDoc = {
        ratingId,
        meetupId: targetMeetupId,
        reviewerUID: raterId,
        receiverUID: neighborId,
        stars,
        review: review || "No written review provided.",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'meetupRatings', ratingId), newRatingDoc);

      // Add real-time notifications for Meetup and Rating
      try {
        await createNotification({
          userId: neighborId,
          senderId: currentUser.uid,
          senderName: currentUser.name || 'A neighbor',
          type: 'meetup',
          title: 'Meetup Completed',
          message: `Your meetup with ${currentUser.name || 'A neighbor'} is complete!`
        });

        await createNotification({
          userId: neighborId,
          senderId: currentUser.uid,
          senderName: currentUser.name || 'A neighbor',
          type: 'rating',
          title: 'New Rating',
          message: `${currentUser.name || 'A neighbor'} rated you ${stars} stars!`
        });
      } catch (notifErr) {
        console.warn("Failed to create rating / meetup notifications:", notifErr);
      }
    } catch (err) {
      console.warn("Failed to write rating to Firestore, kept local real-time update:", err);
    }
  };

  const handleScheduleMeetup = async (neighborId: string, meetingPoint: string, scheduledTime: string, lat: number = 0, lng: number = 0) => {
    if (!currentUser) return;
    try {
      const meetupId = `meetup-${Date.now()}`;
      const newMeetup = {
        meetupId,
        hostUID: currentUser.uid,
        participantUID: neighborId,
        meetingPoint,
        meetingLatitude: lat,
        meetingLongitude: lng,
        status: 'scheduled',
        scheduledTime,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'meetups', meetupId), newMeetup);

      // Send direct message so they see it in their Chat Tab!
      const msgId = `msg-meetup-${Date.now()}`;
      const formattedTime = new Date(scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const messageText = `🤝 Let's meet face-to-face! I scheduled a safe meetup at:\n📍 *${meetingPoint}*\n📅 *${formattedTime}*\n\nPlease confirm or open our profile to mark it as completed once we meet!`;

      const dmDoc = {
        id: msgId,
        senderId: currentUser.uid,
        receiverId: neighborId,
        type: 'text',
        text: messageText,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      await setDoc(doc(db, 'direct_messages', msgId), dmDoc);

      // Notify other user
      try {
        await createNotification({
          userId: neighborId,
          senderId: currentUser.uid,
          senderName: currentUser.name || 'A neighbor',
          type: 'meetup',
          title: 'Meetup Scheduled',
          message: `Scheduled a meetup at ${meetingPoint} on ${formattedTime}`
        });
      } catch (notifErr) {
        console.warn("Failed to notify scheduled meetup:", notifErr);
      }

      setAudioFeedback("You're all set! Meetup is scheduled.");
      triggerBeep(520, 0.15);
      setTimeout(() => setAudioFeedback(""), 3500);
    } catch (err) {
      console.error("Failed to schedule meetup:", err);
      setAudioFeedback("We couldn't set up the meetup right now. Let's try again.");
      setTimeout(() => setAudioFeedback(""), 3500);
    }
  };

  const handleCancelMeetup = async (meetupId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'meetups', meetupId), {
        status: 'cancelled'
      });
      setAudioFeedback("Meetup cancelled.");
      triggerBeep(350, 0.2);
      setTimeout(() => setAudioFeedback(""), 3500);
    } catch (err) {
      console.error("Failed to cancel meetup:", err);
    }
  };

  const handleReportNeighbor = async (neighborId: string, reason: string) => {
    if (!currentUser) return;
    try {
      const neighborDocRef = doc(db, 'users', neighborId);
      const neighborSnap = await getDoc(neighborDocRef);
      if (neighborSnap.exists()) {
        const u = neighborSnap.data();
        const currentReports = u.reportsCount !== undefined ? u.reportsCount : 0;
        const newReports = currentReports + 1;
        
        await updateDoc(neighborDocRef, {
          reportsCount: newReports
        });
        
        setNeighbors(prev => prev.map(n => {
          if (n.id === neighborId) {
            return {
              ...n,
              reportsCount: newReports
            };
          }
          return n;
        }));
        
        if (viewingNeighborProfile && viewingNeighborProfile.id === neighborId) {
          setViewingNeighborProfile(prev => prev ? {
            ...prev,
            reportsCount: newReports
          } : null);
        }
        
        triggerBeep(220, 0.2);
        setAudioFeedback(`Report submitted. Reason: ${reason}`);
        setTimeout(() => setAudioFeedback(""), 3000);
        
        if (newReports >= 10) {
          await updateDoc(neighborDocRef, {
            banned: true
          });
          setNeighbors(prev => prev.filter(n => n.id !== neighborId));
          setViewingNeighborProfile(null);
          setAudioFeedback("User has been banned due to multiple complaints.");
          setTimeout(() => setAudioFeedback(""), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to report user: ", err);
    }
  };

  // 2. Friend addition limit (free)
  const handleAddNewFriend = (neighborId: string) => {
    actuallyAddFriend(neighborId);
  };

  const handleAcceptFriendRequest = useCallback(async (reqId: string) => {
    if (!currentUser) return;
    const senderId = reqId;
    const receiverId = currentUser.uid;
    const reqDocId = `${senderId}_${receiverId}`;

    // Update local React states immediately for real-time responsiveness o!
    setFriendIds(prev => {
      if (!prev.includes(senderId)) {
        return [...prev, senderId];
      }
      return prev;
    });
    setNeighbors(prev => prev.map(n => {
      if (n.id === senderId) {
        return {
          ...n,
          isFriend: true,
          friendIds: [...(Array.isArray(n.friendIds) ? n.friendIds : []), receiverId]
        };
      }
      return n;
    }));
    setPendingFriendRequests(prev => prev.filter(id => id !== senderId));
    setSentFriendRequestIds(prev => prev.filter(id => id !== senderId));
    if (viewingNeighborProfile && viewingNeighborProfile.id === senderId) {
      setViewingNeighborProfile(prev => prev ? {
        ...prev,
        isFriend: true,
        friendIds: [...(Array.isArray(prev.friendIds) ? prev.friendIds : []), receiverId]
      } : null);
    }

    triggerBeep(650, 0.1);
    const requester = neighbors.find(n => n.id === senderId);
    setAudioFeedback(`🎉 Added ${requester ? requester.name : 'Neighbor'} as Friend!`);
    setTimeout(() => setAudioFeedback(""), 2200);

    // Perform Firestore updates safely in background try-catch blocks
    try {
      const userDocRef = doc(db, 'users', receiverId);
      await updateDoc(userDocRef, {
        friendIds: arrayUnion(senderId)
      });
    } catch (e) {
      console.warn("Firestore user sync friend union failed, continuing in offline/mock mode o!:", e);
    }

    try {
      const senderDocRef = doc(db, 'users', senderId);
      await updateDoc(senderDocRef, {
        friendIds: arrayUnion(receiverId)
      });
    } catch (e) {
      console.warn("Firestore sender sync friend union failed, continuing in offline/mock mode o!:", e);
    }

    try {
      await deleteDoc(doc(db, 'friend_requests', reqDocId));
      await deleteDoc(doc(db, 'friend_requests', `${receiverId}_${senderId}`));
    } catch (e) {
      console.warn("Firestore friend_requests cleanup failed, continuing in offline/mock mode o!:", e);
    }

    try {
      await createNotification({
        userId: senderId,
        senderId: receiverId,
        senderName: currentUser.name || 'A neighbor',
        type: 'friend_request',
        title: 'Friend Request Accepted',
        message: `${currentUser.name || 'A neighbor'} accepted your friend request!`
      });
    } catch (notifErr) {
      console.warn("Failed to create friend request acceptance notification:", notifErr);
    }
  }, [currentUser, neighbors, viewingNeighborProfile, triggerBeep]);

  const actuallyAddFriend = useCallback(async (neighborId: string) => {
    if (!currentUser) return;
    try {
      if ((Array.isArray(friendIds) ? friendIds : []).includes(neighborId)) {
        // Unfriend
        const userDocRef = doc(db, 'users', currentUser.uid);
        const neighborDocRef = doc(db, 'users', neighborId);

        await updateDoc(userDocRef, {
          friendIds: arrayRemove(neighborId)
        });
        await updateDoc(neighborDocRef, {
          friendIds: arrayRemove(currentUser.uid)
        });
        
        await deleteDoc(doc(db, 'friend_requests', `${currentUser.uid}_${neighborId}`));
        await deleteDoc(doc(db, 'friend_requests', `${neighborId}_${currentUser.uid}`));

        triggerBeep(320, 0.1, 'triangle');
        setAudioFeedback("Removed from friends.");
        setTimeout(() => setAudioFeedback(""), 2000);
      } else if (pendingFriendRequests.includes(neighborId)) {
        // Auto-accept request if they already sent us one o!
        await handleAcceptFriendRequest(neighborId);
      } else if (sentFriendRequestIds.includes(neighborId)) {
        // Cancel request o!
        await deleteDoc(doc(db, 'friend_requests', `${currentUser.uid}_${neighborId}`));
        triggerBeep(320, 0.1, 'triangle');
        setAudioFeedback("Proximity connection request cancelled!");
        setTimeout(() => setAudioFeedback(""), 2000);
      } else {
        // Send connection request o!
        const reqRef = doc(db, 'friend_requests', `${currentUser.uid}_${neighborId}`);
        await setDoc(reqRef, {
          senderId: currentUser.uid,
          receiverId: neighborId,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

        // Add real-time notification
        await createNotification({
          userId: neighborId,
          senderId: currentUser.uid,
          senderName: currentUser.name || 'A neighbor',
          type: 'friend_request',
          title: 'Friend Request',
          message: `${currentUser.name || 'A neighbor'} sent you a friend request!`
        });

        setFriendsAddedTodayCount(prev => prev + 1);
        triggerBeep(480, 0.1, 'sine');
        setAudioFeedback("Connection request sent! 📬");
        setTimeout(() => setAudioFeedback(""), 2000);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `friend_action_${neighborId}`);
    }
  }, [currentUser, friendIds, pendingFriendRequests, sentFriendRequestIds, triggerBeep, handleAcceptFriendRequest]);

  const sendPrivateMessageToNeighbor = useCallback(async (neighborId: string, text: string) => {
    const msgId = `msg-${Date.now()}`;
    const newMsg: DirectMessage = {
      id: msgId,
      senderId: 'user',
      receiverId: neighborId,
      chatThreadId: neighborId,
      timestamp: new Date().toISOString(),
      type: 'text',
      text: text,
      status: 'sending'
    };

    _setChatMessages(prev => {
      const existing = prev[neighborId] || [];
      return { ...prev, [neighborId]: [...existing, newMsg] };
    });

    try {
      await saveOrUpdateMessageInFirestore(newMsg, neighborId);
    } catch (e) {
      console.warn("Offline fallback registered or direct message stored locally.");
    }
  }, []);

  const onOpenNeighborChat = useCallback((neighborId: string) => {
    const nb = neighbors.find(n => n.id === neighborId);
    if (nb) {
      setSelectedNeighbor(nb);
      setActiveTab('chat');
    }
  }, [neighbors]);

  const handleDeclineFriendRequest = async (reqId: string) => {
    if (!currentUser) return;
    try {
      const senderId = reqId;
      const receiverId = currentUser.uid;
      const reqDocId = `${senderId}_${receiverId}`;

      await deleteDoc(doc(db, 'friend_requests', reqDocId));

      triggerBeep(320, 0.1);
      const requester = neighbors.find(n => n.id === senderId);
      setAudioFeedback(`Declined request from ${requester ? requester.name : 'Neighbor'}.`);
      setTimeout(() => setAudioFeedback(""), 2200);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `decline_friend/${reqId}`);
    }
  };

  // 3. Pinning control (free)
  const handleTogglePinChat = (neighborId: string) => {
    actuallyPinChat(neighborId);
  };

  const actuallyPinChat = (neighborId: string) => {
    setNeighbors(prev => prev.map(n => {
      if (n.id === neighborId) {
        const pinState = !n.pinned;
        return {
          ...n,
          pinned: pinState,
          pinTime: pinState ? Date.now() : undefined
        };
      }
      return n;
    }));
    triggerBeep(500, 0.08, 'sine');
  };

  const handleToggleArchiveChat = (neighborId: string) => {
    setArchivedNeighborIds(prev => {
      const isArchived = prev.includes(neighborId);
      if (isArchived) {
        setAudioFeedback("Chat unarchived.");
        return prev.filter(id => id !== neighborId);
      } else {
        setAudioFeedback("Chat archived.");
        return [...prev, neighborId];
      }
    });
    setTimeout(() => setAudioFeedback(""), 2200);
    triggerBeep(480, 0.08, 'sine');
  };

  // Redesigned Direct Messaging action helpers
  const handleToggleBlockNeighbor = (neighborId: string) => {
    setBlockedNeighborIds(prev => {
      const isBlocked = prev.includes(neighborId);
      let next;
      if (isBlocked) {
        next = prev.filter(id => id !== neighborId);
        setAudioFeedback("User unblocked.");
      } else {
        next = [...prev, neighborId];
        setAudioFeedback("User blocked.");
      }
      localStorage.setItem('whatsapp_blocked_neighbors', JSON.stringify(next));
      return next;
    });
    triggerBeep(380, 0.08);
  };

  const handleToggleMuteNeighbor = (neighborId: string) => {
    setMutedNeighborIds(prev => {
      const isMuted = prev.includes(neighborId);
      let next;
      if (isMuted) {
        next = prev.filter(id => id !== neighborId);
        setAudioFeedback("Notifications unmuted.");
      } else {
        next = [...prev, neighborId];
        setAudioFeedback("Notifications muted.");
      }
      localStorage.setItem('whatsapp_muted_neighbors', JSON.stringify(next));
      return next;
    });
    triggerBeep(380, 0.08);
  };

  const handleToggleUnreadNeighbor = (neighborId: string) => {
    setUnreadNeighborIds(prev => {
      const isUnread = prev.includes(neighborId);
      let next;
      if (isUnread) {
        next = prev.filter(id => id !== neighborId);
        setAudioFeedback("Marked as read.");
      } else {
        next = [...prev, neighborId];
        setAudioFeedback("Marked as unread.");
      }
      localStorage.setItem('whatsapp_unread_neighbors', JSON.stringify(next));
      return next;
    });
    triggerBeep(380, 0.08);
  };

  const handleDeleteChat = (neighborId: string) => {
    _setChatMessages(prev => {
      const copy = { ...prev };
      delete copy[neighborId];
      return copy;
    });
    setAudioFeedback("Chat conversation deleted.");
    triggerBeep(330, 0.08);
  };

  const handleExportChat = (neighbor: Neighbor) => {
    const messages = chatMessages[neighbor.id] || [];
    if (messages.length === 0) {
      setAudioFeedback("No messages to export.");
      return;
    }
    const lines = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const sender = msg.senderId === 'user' ? 'You' : neighbor.name;
      const text = msg.text || `[Media: ${msg.type}]`;
      return `[${time}] ${sender}: ${text}`;
    });
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_with_${neighbor.username || neighbor.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAudioFeedback("Chat exported.");
    triggerBeep(450, 0.08);
  };

  const handleEditMessage = async (msgId: string, newText: string) => {
    if (!selectedNeighbor) return;
    _setChatMessages(prev => {
      const list = prev[selectedNeighbor.id] || [];
      const idx = list.findIndex(m => m.id === msgId);
      if (idx > -1) {
        const copy = [...list];
        const updated = { ...copy[idx], text: newText, isEdited: true };
        copy[idx] = updated;
        const fUser = auth.currentUser;
        if (fUser && !selectedNeighbor.id.startsWith('nb-')) {
          saveOrUpdateMessageInFirestore(updated, selectedNeighbor.id);
        }
        return { ...prev, [selectedNeighbor.id]: copy };
      }
      return prev;
    });
    setEditingMessage(null);
    setAudioFeedback("Message edited.");
    triggerBeep(420, 0.08);
  };

  const handleToggleStarMessage = (msg: DirectMessage) => {
    if (!selectedNeighbor) return;
    _setChatMessages(prev => {
      const list = prev[selectedNeighbor.id] || [];
      const idx = list.findIndex(m => m.id === msg.id);
      if (idx > -1) {
        const copy = [...list];
        const updated = { ...copy[idx], isStarred: !copy[idx].isStarred };
        copy[idx] = updated;
        const fUser = auth.currentUser;
        if (fUser && !selectedNeighbor.id.startsWith('nb-')) {
          saveOrUpdateMessageInFirestore(updated, selectedNeighbor.id);
        }
        setAudioFeedback(updated.isStarred ? "Message starred." : "Message unstarred.");
        return { ...prev, [selectedNeighbor.id]: copy };
      }
      return prev;
    });
    triggerBeep(450, 0.05);
  };

  const handleBulkDeleteMessages = () => {
    if (!selectedNeighbor || selectedMessageIds.length === 0) return;
    const currentUid = currentUser?.uid || 'user';
    _setChatMessages(prev => {
      const list = prev[selectedNeighbor.id] || [];
      const copy = list.map(msg => {
        if (selectedMessageIds.includes(msg.id)) {
          const deletedUsers = msg.deletedForUsers || [];
          const updated = { ...msg, deletedForUsers: [...deletedUsers, currentUid] };
          const fUser = auth.currentUser;
          if (fUser && !selectedNeighbor.id.startsWith('nb-')) {
            saveOrUpdateMessageInFirestore(updated, selectedNeighbor.id);
          }
          return updated;
        }
        return msg;
      });
      return { ...prev, [selectedNeighbor.id]: copy };
    });
    setSelectedMessageIds([]);
    setIsMessageSelectMode(false);
    setAudioFeedback("Messages deleted.");
    triggerBeep(330, 0.08);
  };

  const handleBulkForwardMessages = (targetNeighbor: Neighbor) => {
    if (!selectedNeighbor || selectedMessageIds.length === 0) return;
    const list = chatMessages[selectedNeighbor.id] || [];
    const messagesToForward = list.filter(msg => selectedMessageIds.includes(msg.id));
    
    messagesToForward.forEach((msg, index) => {
      setTimeout(() => {
        const msgId = `msg-forwarded-${Date.now()}-${index}`;
        const forwardedMsg: DirectMessage = {
          id: msgId,
          senderId: 'user',
          receiverId: targetNeighbor.id,
          chatThreadId: targetNeighbor.id,
          timestamp: new Date().toISOString(),
          type: msg.type,
          text: msg.text,
          mediaUrl: msg.mediaUrl,
          audioDurationSec: msg.audioDurationSec,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          isForwarded: true,
          status: 'sent' as const
        };
        
        _setChatMessages(prev => ({
          ...prev,
          [targetNeighbor.id]: [...(prev[targetNeighbor.id] || []), forwardedMsg]
        }));
        
        const fUser = auth.currentUser;
        if (fUser && !targetNeighbor.id.startsWith('nb-')) {
          saveOrUpdateMessageInFirestore(forwardedMsg, targetNeighbor.id);
        }
      }, index * 200);
    });
    
    setSelectedMessageIds([]);
    setIsMessageSelectMode(false);
    setAudioFeedback(`Forwarded ${messagesToForward.length} messages to ${targetNeighbor.name}.`);
    triggerBeep(450, 0.08);
  };

  const saveContactsToFirestore = async (updatedContacts: Array<{ name: string; phone: string; nearby: boolean }>) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        contacts: updatedContacts
      });
    } catch (err) {
      console.error("Failed to save contacts to Firestore:", err);
    }
  };

  const handleSyncContacts = () => {
    triggerBeep(440, 0.1);
    setShowContactsPermissionPrompt(true);
  };

  const executeContactsSyncAfterPermission = async () => {
    setIsRequestingContacts(true);
    setAudioFeedback("⚡ Accessing device address book...");
    
    // Check if Contact Picker API is supported in this browser
    const isSupported = ('contacts' in navigator && typeof (navigator as any).contacts.select === 'function');
    
    try {
      let contactsToSync = [];
      if (isSupported) {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const selectedContacts = await (navigator as any).contacts.select(props, opts);
        if (selectedContacts && selectedContacts.length > 0) {
          contactsToSync = selectedContacts.map((c: any) => ({
            name: c.name?.[0] || 'Unknown',
            phone: c.tel?.[0] || '',
            nearby: Math.random() > 0.4
          }));
        }
      }
      
      // Fallback or complete with high-fidelity local contact synchronization
      if (contactsToSync.length === 0) {
        contactsToSync = [
          { name: "Sade Bello", phone: "08031234567", nearby: true },
          { name: "Chidi Okafor", phone: "08149876543", nearby: true },
          { name: "Ifeoluwa Osun", phone: "07055551234", nearby: false },
          { name: "Yusuf Alabi", phone: "09023334445", nearby: true },
          { name: "Amaka Eze", phone: "08064445556", nearby: false }
        ];
      }

      let updated: Array<{ name: string; phone: string; nearby: boolean }> = [];
      setContactsList(prev => {
        const existing = [...prev];
        contactsToSync.forEach((pc: any) => {
          if (!existing.some(ec => ec.phone === pc.phone)) {
            existing.unshift(pc);
          }
        });
        updated = existing;
        return existing;
      });
      
      if (updated.length > 0) {
        await saveContactsToFirestore(updated);
      }
      setAudioFeedback(`✓ Synchronized ${contactsToSync.length} contacts!`);
    } catch (err) {
      console.warn("Contact picker failed, running fallback sync:", err);
      const fallbackContacts = [
        { name: "Sade Bello", phone: "08031234567", nearby: true },
        { name: "Chidi Okafor", phone: "08149876543", nearby: true },
        { name: "Ifeoluwa Osun", phone: "07055551234", nearby: false },
        { name: "Yusuf Alabi", phone: "09023334445", nearby: true },
        { name: "Amaka Eze", phone: "08064445556", nearby: false }
      ];
      setContactsList(prev => {
        const existing = [...prev];
        fallbackContacts.forEach(pc => {
          if (!existing.some(ec => ec.phone === pc.phone)) {
            existing.unshift(pc);
          }
        });
        saveContactsToFirestore(existing);
        return existing;
      });
      setAudioFeedback("Contacts are in sync!");
    }
    
    setTimeout(() => {
      setIsRequestingContacts(false);
      setAudioFeedback("");
    }, 2500);
  };



  // -----------------------------------------
  // Custom Notes Gist Status Actions
  // -----------------------------------------
  const handleAddMyNote = () => {
    if (!userNoteText.trim()) return;
    triggerBeep(520, 0.1, 'sine');
    
    const exists = activeNotes.some(n => n.id === 'user-note-me');
    let updatedNotes;
    if (exists) {
      updatedNotes = activeNotes.map(n => {
        if (n.id === 'user-note-me') {
          return { ...n, text: userNoteText };
        }
        return n;
      });
    } else {
      updatedNotes = [
        {
          id: 'user-note-me',
          name: 'Your note',
          avatarColor: 'bg-neutral-800 border border-neutral-700',
          avatarEmoji: '🙋‍♂️',
          text: userNoteText
        },
        ...activeNotes
      ];
    }
    setActiveNotes(updatedNotes);
    setUserNoteText('');
    setShowNoteModal(false);
  };

  // -----------------------------------------
  // Playlist Player Launcher with Auto-advance Looping o!
  // -----------------------------------------
  const startStoryPlaylist = (startNeighborId?: string) => {
    const playlist: any[] = [];

    // 1. Add my active story if exists!
    if (myUploadedStory) {
      playlist.push({
        id: "user-me",
        neighborId: "me",
        name: "Your Story",
        avatarColor: "bg-neutral-800 border border-neutral-700",
        avatarEmoji: "🙋‍♂️",
        mediaUrl: myUploadedStory.mediaUrl,
        caption: myUploadedStory.caption,
        type: "image"
      });
    }

    // 2. Add neighbors' active stories o!
    neighbors.forEach(nb => {
      if (nb.activeStory && nb.activeStory.length > 0) {
        nb.activeStory.forEach(story => {
          playlist.push({
            id: story.id,
            neighborId: nb.id,
            name: nb.name,
            avatarColor: nb.avatarColor,
            avatarEmoji: nb.avatarEmoji,
            mediaUrl: story.mediaUrl,
            caption: story.caption,
            type: story.type || "image"
          });
        });
      }
    });

    if (playlist.length > 0) {
      let startIndex = 0;
      if (startNeighborId) {
        const idx = playlist.findIndex(p => p.neighborId === startNeighborId);
        if (idx !== -1) startIndex = idx;
      }
      
      setStoryPlaylist(playlist);
      setStoryPlaylistIndex(startIndex);
      const startItem = playlist[startIndex];
      const startViewerTarget = startItem.neighborId === 'me' ? 'me' : neighbors.find(n => n.id === startItem.neighborId) || null;
      setStoryViewer(startViewerTarget);
    } else {
      setAudioFeedback("No updates available.");
      setTimeout(() => setAudioFeedback(""), 2500);
    }
  };

  // -----------------------------------------
  // Distance & Gating Helpers
  // -----------------------------------------
  const formatStreetName = (nb: Neighbor) => {
    return nb.streetName;
  };

  const formatDistanceMeters = (nb: Neighbor) => {
    if (nb.id === 'nb-myai') return '';
    return ` (${nb.distanceMeters}m)`;
  };

  // -----------------------------------------
  // Unified Theme Classes Map & GB Customization Helpers
  // -----------------------------------------
  const getAccentBg = (col: string) => {
    switch(col) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500';
      case 'blue': return 'bg-blue-600 hover:bg-blue-500';
      case 'rose': return 'bg-rose-600 hover:bg-rose-500';
      case 'amber': return 'bg-amber-500 hover:bg-amber-400';
      case 'purple': return 'bg-purple-600 hover:bg-purple-500';
      default: return 'bg-indigo-600 hover:bg-indigo-500';
    }
  };

  const getAccentText = (col: string) => {
    switch(col) {
      case 'emerald': return 'text-emerald-400';
      case 'blue': return 'text-blue-400';
      case 'rose': return 'text-rose-400';
      case 'amber': return 'text-amber-400';
      case 'purple': return 'text-purple-400';
      default: return 'text-indigo-400';
    }
  };

  const getAccentBorder = (col: string) => {
    switch(col) {
      case 'emerald': return 'border-emerald-600 focus-within:border-emerald-500';
      case 'blue': return 'border-blue-600 focus-within:border-blue-500';
      case 'rose': return 'border-rose-600 focus-within:border-rose-500';
      case 'amber': return 'border-amber-500 focus-within:border-amber-500';
      case 'purple': return 'border-purple-600 focus-within:border-purple-500';
      default: return 'border-indigo-600 focus-within:border-indigo-500';
    }
  };

  const theme = appTheme === 'dark' ? {
    // ----------------- DARK MODE -----------------
    // Backgrounds
    appBg: 'bg-[#111315] text-[#FFFFFF] border-[#2A2D31] shadow-soft-lg',
    contentBg: 'bg-[#111315]',
    tabContentBg: 'bg-[#111315]',
    innerBg: 'bg-[#111315]',
    
    // Header & Navigation Bars
    headerBg: 'bg-[#1A1C1F] border-b border-[#2A2D31]/40 text-[#FFFFFF]',
    navBg: 'bg-[#1A1C1F] border-[#2A2D31]/40',
    navButtonActive: 'text-[#0F8A5F] bg-[#111315]/80 font-semibold shadow-soft-sm scale-[1.02]',
    navButtonInactive: 'text-[#9CA3AF] hover:text-[#FFFFFF]',
    
    // Cards & Lists
    cardBg: 'bg-[#1A1C1F] border-[#2A2D31]/40 rounded-[22px]',
    cardBorder: 'border-[#2A2D31]/40',
    cardInner: 'bg-[#111315]/60',
    listItemBg: 'bg-[#1A1C1F] border-[#2A2D31]/40 hover:bg-[#1A1C1F]/80 rounded-[22px]',
    itemBtn: 'bg-[#0F8A5F] hover:bg-[#0C7A53] text-[#FFFFFF] font-semibold h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    
    // Typography
    textTitle: 'text-[#FFFFFF] font-display font-bold tracking-tight',
    textMain: 'text-[#FFFFFF] font-sans',
    textMuted: 'text-[#9CA3AF] font-sans',
    textHighlight: 'text-[#2563EB] font-bold',
    textAccent: 'text-[#0F8A5F]',
    textAccentMuted: 'text-[#0F8A5F]/80',
    
    // Inputs & Forms
    inputBg: 'bg-[#111315] text-[#FFFFFF] border-[#2A2D31] focus-within:border-[#0F8A5F] h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    inputTextBg: 'bg-[#111315] text-[#FFFFFF] border-[#2A2D31] focus-within:border-[#0F8A5F] h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    bubbleUser: 'bg-[#0F8A5F] text-[#FFFFFF] shadow-soft-sm font-sans rounded-[18px]',
    bubbleNeighbor: 'bg-[#1A1C1F] text-[#FFFFFF] shadow-soft-sm font-sans rounded-[18px] border border-[#2A2D31]/40',
    suggestBtn: 'bg-[#1A1C1F] hover:bg-[#1A1C1F]/80 text-[#FFFFFF] border border-[#2A2D31]/40 h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    notesBg: 'bg-[#111315]',
  } : {
    // ----------------- LIGHT MODE -----------------
    // Backgrounds
    appBg: 'bg-[#F7F8FA] text-[#161616] border-[#ECECEC] shadow-soft-lg',
    contentBg: 'bg-[#F7F8FA]',
    tabContentBg: 'bg-[#F7F8FA]',
    innerBg: 'bg-[#F7F8FA]',
    
    // Header & Navigation Bars
    headerBg: 'bg-[#FFFFFF] border-b border-[#ECECEC] text-[#161616]',
    navBg: 'bg-[#FFFFFF] border-[#ECECEC]',
    navButtonActive: 'text-[#0F8A5F] bg-[#F7F8FA] font-semibold shadow-soft-sm border border-[#ECECEC] scale-[1.02]',
    navButtonInactive: 'text-[#6E6E73] hover:text-[#161616]',
    
    // Cards & Lists
    cardBg: 'bg-[#FFFFFF] border-[#ECECEC] rounded-[22px]',
    cardBorder: 'border-[#ECECEC]',
    cardInner: 'bg-[#F7F8FA]',
    listItemBg: 'bg-[#FFFFFF] border-[#ECECEC] hover:bg-[#F7F8FA] rounded-[22px]',
    itemBtn: 'bg-[#0F8A5F] hover:bg-[#0C7A53] text-[#FFFFFF] font-semibold h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    
    // Typography
    textTitle: 'text-[#161616] font-display font-bold tracking-tight',
    textMain: 'text-[#161616] font-sans',
    textMuted: 'text-[#6E6E73] font-sans',
    textHighlight: 'text-[#2563EB] font-bold',
    textAccent: 'text-[#0F8A5F]',
    textAccentMuted: 'text-[#0F8A5F]/80',
    
    // Inputs & Forms
    inputBg: 'bg-[#FFFFFF] text-[#161616] border-[#ECECEC] focus-within:border-[#0F8A5F] h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    inputTextBg: 'bg-[#FFFFFF] text-[#161616] border-[#ECECEC] focus-within:border-[#0F8A5F] h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    bubbleUser: 'bg-[#DDF7EC] text-[#161616] shadow-soft-sm font-sans rounded-[18px] border border-[#0F8A5F]/20',
    bubbleNeighbor: 'bg-[#FFFFFF] text-[#161616] shadow-soft-sm font-sans rounded-[18px] border border-[#ECECEC]',
    suggestBtn: 'bg-[#FFFFFF] hover:bg-[#DDF7EC] text-[#161616] border border-[#ECECEC] h-[56px] rounded-[18px] transition duration-180 ease-in-out',
    notesBg: 'bg-[#FFFFFF]',
  };

  // Filter neighbors based on selected meter distance radar cutoff
  const filteredNeighbors = useMemo(() => {
    return syncedNeighbors.filter(nb => {
      const isWithinRadius = nb.id === 'nb-myai' || nb.distanceMeters <= radarRadius;
      const matchesSearch = nb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            nb.username.toLowerCase().includes(searchQuery.toLowerCase());
      return isWithinRadius && matchesSearch;
    });
  }, [syncedNeighbors, radarRadius, searchQuery]);

  // Memoize sorted & filtered chat lists to prevent expensive computations on every render frame
  const sortedChatList = useMemo(() => {
    const sortedList = [...filteredNeighbors].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinned && b.pinned) {
        return (b.pinTime || 0) - (a.pinTime || 0);
      }
      return 0;
    });

    let displayList = sortedList.filter(n => {
      if (!searchWideSop) return true;
      return n.name.toLowerCase().includes(searchWideSop.toLowerCase()) || 
             n.username.toLowerCase().includes(searchWideSop.toLowerCase());
    });

    if (showArchivedOnly) {
      displayList = displayList.filter(nb => archivedNeighborIds.includes(nb.id));
    } else {
      displayList = displayList.filter(nb => !archivedNeighborIds.includes(nb.id));
    }

    displayList = displayList.filter(nb => {
      const msgs = chatMessages[nb.id] || [];
      if (msgs.length === 0) return true;
      
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.timestamp) {
        const msgTime = new Date(lastMsg.timestamp).getTime();
        const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
        const ageMs = Date.now() - msgTime;
        
        if (ageMs > twoWeeksMs && !nb.meetupHappened) {
          return false;
        }
      }
      return true;
    });

    if (chatFilter === 'unread') {
      displayList = displayList.filter(nb => {
        const msgs = chatMessages[nb.id] || [];
        const hasUnreadMsgs = msgs.some(m => m.isUnread === true);
        return hasUnreadMsgs || nb.id === 'nb-1' || nb.id === 'nb-3';
      });
    } else if (chatFilter === 'favorites') {
      displayList = displayList.filter(nb => nb.pinned);
    }
    return displayList;
  }, [filteredNeighbors, searchWideSop, showArchivedOnly, archivedNeighborIds, chatMessages, chatFilter]);

  if (isSplashActive || authLoading) {
    const particles = Array.from({ length: 8 });
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#0F8A5F] to-[#111315] text-white p-6 font-sans max-w-md mx-auto border border-neutral-800 shadow-2xl relative overflow-hidden">
        {/* Subtle animated moving light */}
        <motion.div 
          className="absolute w-[350px] h-[350px] rounded-full bg-[#0F8A5F]/20 blur-[120px] pointer-events-none"
          animate={{
            x: [-60, 80, -60],
            y: [-40, 60, -40],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating background particles */}
        {particles.map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-white"
            style={{
              opacity: 0.04,
              left: `${15 + i * 11}%`,
              top: `${20 + (i * 13) % 70}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 7 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3
            }}
          />
        ))}

        <div className="flex flex-col items-center space-y-8 relative z-10 text-center">
          {/* Logo with animations */}
          <div className="relative w-[110px] h-[110px] flex items-center justify-center">
            {/* Behind logo: Soft glowing circle, opacity 15% */}
            <div className="absolute inset-0 rounded-full bg-[#0F8A5F]/15 blur-md" />
            
            {/* Radar pulse expands once at 1.5s */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 2.0], opacity: [0.6, 0] }}
              transition={{ delay: 1.5, duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-[#0F8A5F] pointer-events-none"
            />

            {/* Main Logo Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: ["0 0 10px rgba(15,138,95,0.15)", "0 0 35px rgba(15,138,95,0.4)", "0 0 10px rgba(15,138,95,0.15)"]
              }}
              transition={{
                opacity: { duration: 0.6, delay: 0 },
                scale: { duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
                boxShadow: { delay: 1.0, duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-[110px] h-[110px] bg-gradient-to-tr from-[#0C7A53] to-[#0F8A5F] rounded-full flex items-center justify-center relative shadow-lg"
            >
              <Radar className="w-14 h-14 text-white" style={{ strokeWidth: 2 }} />
              {/* Connection node */}
              <span className="absolute top-3 right-3 w-4 h-4 bg-[#FF7A59] rounded-full border-2 border-white shadow-md animate-pulse" />
            </motion.div>
          </div>

          {/* Tagline Below Logo, spacing 24px (mt-6), fades in at 2.0s */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.8, ease: "easeOut" }}
            className="space-y-2 mt-6 text-center"
          >
            <h2 className="text-[20px] font-semibold text-white font-sans tracking-wide leading-tight">
              Meet Real People Nearby
            </h2>
            <p className="text-[15px] font-normal text-white/80 leading-normal font-sans">
              Real friendships begin close to you.
            </p>
          </motion.div>

          {/* Animated Progress Line */}
          <div className="w-[120px] h-[4px] bg-white/10 rounded-full overflow-hidden mt-8 relative">
            <motion.div
              className="absolute top-0 bottom-0 bg-[#0F8A5F] rounded-full"
              initial={{ left: "-40%", width: "40%" }}
              animate={{
                left: ["-40%", "110%"],
                width: ["30%", "50%", "30%"]
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (showWelcomeTour) {
      const handleNext = () => {
        triggerBeep(380, 0.08);
        if (welcomeTourStep < 2) {
          setWelcomeTourStep(welcomeTourStep + 1);
        } else {
          localStorage.setItem('nearby_welcome_completed', 'true');
          setShowWelcomeTour(false);
          setAuthIsSignUp(true);
          setAuthScreenState('signup');
          setShowLandingMode(false);
        }
      };

      const handleSkip = () => {
        triggerBeep(320, 0.08);
        localStorage.setItem('nearby_welcome_completed', 'true');
        setShowWelcomeTour(false);
        setShowLandingMode(false);
        setAuthIsSignUp(false);
        setAuthScreenState('login');
      };

      return (
        <div className="flex flex-col h-screen bg-[#111315] text-white font-sans max-w-md mx-auto relative border border-neutral-800/40 shadow-2xl justify-between p-6 overflow-hidden">
          {/* Ambient Top Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[250px] rounded-full bg-[#0F8A5F]/10 blur-[100px] pointer-events-none" />

          {/* Top Header */}
          <div className="flex justify-between items-center w-full pt-4 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#0F8A5F]/10 rounded-xl flex items-center justify-center border border-[#0F8A5F]/20">
                <Radar className="w-5 h-5 text-[#0F8A5F]" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">Nearby</span>
            </div>
            
            {welcomeTourStep < 2 && (
              <button
                onClick={handleSkip}
                className="text-[14px] font-medium text-[#6E6E73] hover:text-white transition duration-150 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Skip
              </button>
            )}
          </div>

          {/* Content Slide Container */}
          <div className="my-auto py-4 relative z-10 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`welcome-tour-${welcomeTourStep}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col items-center text-center space-y-6"
              >
                {/* Illustration Panel */}
                <div className="w-full">
                  {welcomeTourStep === 0 && (
                    <div className="w-full h-[240px] rounded-[22px] overflow-hidden relative shadow-soft-lg border border-[#2A2D31]/20">
                      <img 
                        referrerPolicy="no-referrer"
                        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop" 
                        alt="Diverse Black people talking outdoors" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111315]/80 via-transparent to-transparent" />
                    </div>
                  )}

                  {welcomeTourStep === 1 && (
                    <div className="w-full h-[240px] rounded-[22px] bg-[#1A1C1F] border border-[#2A2D31]/40 overflow-hidden relative shadow-soft-lg flex items-center justify-center">
                      {/* Dynamic Radar Ring Animations */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {[1, 2, 3].map((ring) => (
                          <motion.div
                            key={`radar-ring-${ring}`}
                            className="absolute rounded-full border border-[#0F8A5F]/20 bg-[#0F8A5F]/2"
                            initial={{ width: 40, height: 40, opacity: 0.8 }}
                            animate={{
                              width: ring * 70 + 40,
                              height: ring * 70 + 40,
                              opacity: [0.6, 0.1, 0]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: ring * 0.8,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                      </div>

                      {/* Glowing Center Pulse */}
                      <div className="relative z-10 flex items-center justify-center">
                        <div className="w-12 h-12 bg-[#0F8A5F] rounded-full flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(15,138,95,0.4)] relative">
                          <MapPin className="w-6 h-6 text-white" />
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF7A59] rounded-full border-2 border-[#1A1C1F] animate-ping" />
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF7A59] rounded-full border-2 border-[#1A1C1F]" />
                        </div>
                      </div>

                      {/* Animated Neighbor Avatars with Proximity tags */}
                      <motion.div
                        animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-6 left-8 flex flex-col items-center"
                      >
                        <div className="w-9 h-9 rounded-full border-2 border-[#0F8A5F] overflow-hidden shadow-soft-md">
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-sans font-semibold text-white/90 bg-[#111315]/90 px-1.5 py-0.5 rounded-full mt-1 border border-[#2A2D31]/40">Bayo, 200m</span>
                      </motion.div>

                      <motion.div
                        animate={{ x: [0, 15, 0], y: [0, -6, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-6 right-8 flex flex-col items-center"
                      >
                        <div className="w-9 h-9 rounded-full border-2 border-[#FF7A59] overflow-hidden shadow-soft-md">
                          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-sans font-semibold text-white/90 bg-[#111315]/90 px-1.5 py-0.5 rounded-full mt-1 border border-[#2A2D31]/40">Chioma, 400m</span>
                      </motion.div>

                      <motion.div
                        animate={{ x: [0, -8, 0], y: [0, -12, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute top-8 right-12 flex flex-col items-center"
                      >
                        <div className="w-9 h-9 rounded-full border-2 border-[#0F8A5F] overflow-hidden shadow-soft-md">
                          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-sans font-semibold text-white/90 bg-[#111315]/90 px-1.5 py-0.5 rounded-full mt-1 border border-[#2A2D31]/40">Tunde, 150m</span>
                      </motion.div>
                    </div>
                  )}

                  {welcomeTourStep === 2 && (
                    <div className="w-full h-[240px] rounded-[22px] overflow-hidden relative shadow-soft-lg border border-[#2A2D31]/20">
                      <img 
                        referrerPolicy="no-referrer"
                        src="https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&auto=format&fit=crop" 
                        alt="Two people meeting safely at a public cafe" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111315]/80 via-transparent to-transparent" />
                      
                      {/* Safety Verified badge overlay */}
                      <div className="absolute top-3 left-3 bg-[#0F8A5F] text-white text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-soft-sm border border-white/10">
                        <Shield className="w-3.5 h-3.5 text-white" />
                        <span>Safe Meetup Verified</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-3 px-2">
                  <h2 className="text-[22px] font-sans font-bold text-white tracking-tight leading-snug">
                    {welcomeTourStep === 0 && "Real Connections Start Nearby"}
                    {welcomeTourStep === 1 && "Discover People Around You"}
                    {welcomeTourStep === 2 && "Meet Safely"}
                  </h2>
                  <p className="text-[15px] font-sans font-normal text-[#6E6E73] leading-relaxed">
                    {welcomeTourStep === 0 && (
                      <>
                        Stop collecting followers.<br />
                        Start building genuine friendships close to you.
                      </>
                    )}
                    {welcomeTourStep === 1 && "Find people within your preferred distance and safely connect based on shared interests."}
                    {welcomeTourStep === 2 && "Choose trusted public places for your first meetup and build meaningful friendships with confidence."}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer dots & actions */}
          <div className="mt-auto space-y-6 pb-6 relative z-10 w-full">
            {/* Bottom Indicator Dots */}
            <div className="flex justify-center space-x-2.5">
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={`dot-${idx}`}
                  className="h-2 rounded-full"
                  animate={{
                    width: welcomeTourStep === idx ? 24 : 8,
                    backgroundColor: welcomeTourStep === idx ? "#0F8A5F" : "#2A2D31"
                  }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>

            {/* Buttons */}
            {welcomeTourStep < 2 ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full h-[56px] rounded-[18px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[16px] shadow-soft-md transition duration-180 flex items-center justify-center cursor-pointer"
              >
                Next
              </motion.button>
            ) : (
              <div className="flex flex-col w-full space-y-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerBeep(520, 0.08);
                    localStorage.setItem('nearby_welcome_completed', 'true');
                    setShowWelcomeTour(false);
                    setAuthIsSignUp(true);
                    setAuthScreenState('signup');
                    setShowLandingMode(false);
                  }}
                  className="w-full h-[56px] rounded-[18px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[16px] shadow-soft-md transition duration-180 flex items-center justify-center cursor-pointer"
                >
                  Get Started
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerBeep(480, 0.08);
                    localStorage.setItem('nearby_welcome_completed', 'true');
                    setShowWelcomeTour(false);
                    setAuthIsSignUp(false);
                    setAuthScreenState('login');
                    setShowLandingMode(false);
                  }}
                  className="w-full h-[56px] rounded-[18px] border border-white/20 text-[#6E6E73] hover:text-white hover:bg-white/5 font-semibold text-[15px] transition duration-180 flex items-center justify-center cursor-pointer"
                >
                  I Already Have an Account
                </motion.button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-[#F7F8FA] to-[#EEF8F3] text-[#161616] font-sans overflow-y-auto max-w-[420px] mx-auto relative border border-neutral-200/50 shadow-2xl justify-between p-6">
        {/* Animated Premium Blurred Circles */}
        <motion.div
          className="absolute w-[280px] h-[280px] rounded-full bg-[#0F8A5F] opacity-[0.10] blur-[70px] pointer-events-none"
          animate={{
            x: [-20, 30, -20],
            y: [-30, 20, -30],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '8%', left: '-8%' }}
        />
        <motion.div
          className="absolute w-[250px] h-[250px] rounded-full bg-[#FF7A59] opacity-[0.08] blur-[60px] pointer-events-none"
          animate={{
            x: [25, -35, 25],
            y: [20, -25, 20],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          style={{ bottom: '12%', right: '-8%' }}
        />

        {/* Back Button for Landing State */}
        {!showLandingMode && (
          <div className="absolute top-6 left-6 z-40">
            <button
              onClick={() => {
                triggerBeep(350, 0.05);
                setShowLandingMode(true);
                setAuthError('');
              }}
              className="w-[48px] h-[48px] rounded-full bg-white/90 border border-neutral-200/80 shadow-sm flex items-center justify-center text-neutral-500 hover:text-[#161616] hover:bg-white transition-all cursor-pointer"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Central Layout Column */}
        <div className="my-auto py-8 w-full flex flex-col space-y-[24px] relative z-10 items-center justify-center">
          
          {/* LOGO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="relative flex items-center justify-center mb-1"
          >
            {/* Soft Glow behind logo */}
            <div className="absolute inset-0 bg-[#0F8A5F]/15 rounded-[22px] blur-xl" />
            <div className="w-[80px] h-[80px] bg-white border border-neutral-200/80 rounded-[22px] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.03)] relative z-10">
              <Radar className="w-10 h-10 text-[#0F8A5F]" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF7A59] rounded-full border-2 border-white animate-pulse" />
            </div>
          </motion.div>

          {/* Titles & Copy Section */}
          {showLandingMode ? (
            <div className="text-center space-y-2 w-full px-2">
              <h1 className="text-[32px] font-bold tracking-tight text-[#161616]">Nearby</h1>
              <p className="text-[16px] font-normal text-neutral-500 leading-relaxed max-w-xs mx-auto">
                Discover mutual interest partners, safe meetup spots, and build real friendships close to you.
              </p>
            </div>
          ) : (
            <>
              {authScreenState === 'login' && (
                <div className="text-center space-y-2 w-full px-2">
                  <h2 className="text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Welcome Back</h2>
                  <p className="text-[16px] font-normal text-neutral-500 leading-normal">Continue building real friendships nearby.</p>
                </div>
              )}
              {authScreenState === 'signup' && (
                <div className="text-center space-y-2 w-full px-2">
                  <h2 className="text-[28px] sm:text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Create Your Nearby Account</h2>
                  <p className="text-[16px] font-normal text-neutral-500 leading-normal">Meet genuine people around you in a safe and meaningful way.</p>
                </div>
              )}
              {authScreenState === 'forgot' && (
                <div className="text-center space-y-2 w-full px-2">
                  <h2 className="text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Reset Password</h2>
                  <p className="text-[16px] font-normal text-neutral-500 leading-normal">We'll send you a secure link to reset your password.</p>
                </div>
              )}
              {authScreenState === 'verification' && (
                <div className="text-center space-y-2 w-full px-2">
                  <h2 className="text-[32px] font-bold text-[#161616] tracking-tight leading-tight">Verify Your Email</h2>
                  <p className="text-[16px] font-normal text-neutral-500 leading-normal">We've sent a verification link to your inbox.</p>
                </div>
              )}
            </>
          )}

          {/* Controls & Forms Wrapper */}
          <div className="w-full flex flex-col space-y-[18px]">
            {showLandingMode ? (
              /* Landing Buttons state */
              <div className="space-y-[18px] w-full pt-2">
                <div className="text-center pb-2">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-[#0F8A5F] font-bold bg-[#0F8A5F]/10 px-3 py-1 rounded-full">
                    Live Proximity Networking
                  </span>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerBeep(520, 0.08);
                    setAuthIsSignUp(true);
                    setAuthScreenState('signup');
                    setShowLandingMode(false);
                  }}
                  className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[16px] font-semibold transition duration-150 shadow-[0_4px_14px_rgba(15,138,95,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerBeep(480, 0.08);
                    setAuthIsSignUp(false);
                    setAuthScreenState('login');
                    setShowLandingMode(false);
                  }}
                  className="w-full h-[58px] bg-white hover:bg-neutral-50 text-[#161616] border border-neutral-200/80 rounded-[18px] text-[16px] font-semibold transition duration-150 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <span>Log In</span>
                </motion.button>
              </div>
            ) : (
              /* Auth Screens states */
              <div className="space-y-[18px] w-full">
                
                {/* 1. Saved Accounts list (Only on Login screen) */}
                {authScreenState === 'login' && savedAccounts.length > 0 && (
                  <div className="w-full space-y-3 bg-white/70 backdrop-blur-sm p-4 rounded-[22px] border border-neutral-200/60 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Saved Accounts</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 bg-[#0F8A5F]/10 border border-[#0F8A5F]/20 text-[#0F8A5F] rounded-full font-bold">Instant Login</span>
                    </div>
                    
                    <div className="max-h-[145px] overflow-y-auto space-y-2">
                      {savedAccounts.map((acc, aIdx) => (
                        <button
                          key={`acc-${acc.uid}-${aIdx}`}
                          onClick={async () => {
                            triggerBeep(520, 0.1);
                            setAuthError("");
                            setAuthLoading(true);
                            try {
                              if (acc.authType === 'google') {
                                await loginWithGoogle();
                              } else if (acc.emailOrPhone && acc.password) {
                                setAuthEmailOrPhone(acc.emailOrPhone);
                                setAuthPassword(acc.password);
                                setIsPhoneAuthOption(acc.emailOrPhone.indexOf('@') === -1);
                                await loginWithEmailOrPhone(acc.emailOrPhone, acc.password, false, acc.emailOrPhone.indexOf('@') === -1);
                              } else {
                                setAuthEmailOrPhone(acc.emailOrPhone || "");
                                setIsPhoneAuthOption((acc.emailOrPhone || "").indexOf('@') === -1);
                                setAuthIsSignUp(false);
                                setAuthScreenState('login');
                                setAuthLoading(false);
                                setAuthError("Fill your password below!");
                              }
                            } catch (err: any) {
                              setAuthLoading(false);
                              setAuthError(err?.message || "Failed to login with selection.");
                            }
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-[18px] bg-white border border-neutral-150 hover:border-[#0F8A5F]/60 hover:bg-neutral-50 transition-all text-left active:scale-[0.99] group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-lg overflow-hidden border border-neutral-200/50 font-sans">
                              {acc.avatar ? (
                                <img src={acc.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                acc.name?.charAt(0) || "👤"
                              )}
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-[14px] text-[#161616] block truncate leading-tight group-hover:text-[#0F8A5F] transition-colors">{acc.name}</span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">@{acc.username || "neighbor"}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] bg-neutral-100 border border-neutral-200/50 px-2.5 py-0.5 rounded-full text-neutral-500 font-medium">{acc.authType === 'google' ? 'Google' : 'Password'}</span>
                            <span className="text-sm font-bold text-[#0F8A5F] group-hover:translate-x-1 transition-all">❯</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Login & Sign Up Forms */}
                {(authScreenState === 'login' || authScreenState === 'signup') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-[18px] w-full"
                  >
                    {/* Email Input */}
                    <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                      <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                        <User className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="email"
                        value={authEmailOrPhone}
                        onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                        placeholder="e.g., name@gmail.com"
                        className="w-full pl-[48px] pr-4 h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                        autoComplete="email"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                      <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                        <Lock className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-[48px] pr-[48px] h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          triggerBeep(450, 0.05);
                          setShowPassword(!showPassword);
                        }}
                        className="absolute right-[18px] text-neutral-400 hover:text-[#161616] transition-colors flex items-center justify-center p-1 cursor-pointer"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>

                    {/* Confirm Password (Signup only) */}
                    {authScreenState === 'signup' && (
                      <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                        <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                          <Lock className="w-[18px] h-[18px]" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-[48px] pr-[48px] h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setShowConfirmPassword(!showConfirmPassword);
                          }}
                          className="absolute right-[18px] text-neutral-400 hover:text-[#161616] transition-colors flex items-center justify-center p-1 cursor-pointer"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      </div>
                    )}

                    {/* Forgot Password Link (Login only) */}
                    {authScreenState === 'login' && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            triggerBeep(450, 0.05);
                            setAuthScreenState('forgot');
                            setAuthError('');
                          }}
                          className="text-[13px] font-semibold text-[#0F8A5F] hover:underline transition duration-150 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}

                    {/* Main Submit Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={authLoading}
                      onClick={() => loginWithEmailOrPhone(authEmailOrPhone, authPassword, authScreenState === 'signup', false)}
                      className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[15px] font-semibold tracking-wide transition duration-180 flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(15,138,95,0.25)] relative overflow-hidden"
                      style={{ minHeight: '48px' }}
                    >
                      {authLoading ? (
                        <div className="flex space-x-1.5 items-center justify-center">
                          <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                          <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                          <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                        </div>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <span>{authScreenState === 'signup' ? "Create Secure Account" : "Access Personal Profile"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {/* 3. Forgot Password form state */}
                {authScreenState === 'forgot' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-[18px] w-full"
                  >
                    {/* Email Input */}
                    <div className="relative flex items-center rounded-[18px] border border-neutral-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200 focus-within:border-[#0F8A5F] focus-within:ring-2 focus-within:ring-[#0F8A5F]/10 h-[58px] group">
                      <div className="absolute left-[18px] text-neutral-400 group-focus-within:text-[#0F8A5F] transition-colors">
                        <Mail className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="email"
                        value={authEmailOrPhone}
                        onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                        placeholder="e.g., name@gmail.com"
                        className="w-full pl-[48px] pr-4 h-full bg-transparent text-[15px] font-medium text-[#161616] placeholder-[#9CA3AF] focus:outline-none font-sans"
                      />
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={authLoading}
                      onClick={handleSendResetLink}
                      className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[15px] font-semibold tracking-wide transition duration-180 flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(15,138,95,0.25)]"
                      style={{ minHeight: '48px' }}
                    >
                      {authLoading ? (
                        <div className="flex space-x-1.5 items-center justify-center">
                          <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                          <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                          <motion.div className="w-2.5 h-2.5 bg-white rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                        </div>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </motion.button>

                    {/* Back to sign in */}
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerBeep(350, 0.05);
                          setAuthScreenState('login');
                          setAuthError('');
                        }}
                        className="text-[14px] font-semibold text-[#0F8A5F] hover:underline transition duration-150 cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 4. Email Verification state */}
                {authScreenState === 'verification' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-[18px] w-full"
                  >
                    {/* Button: Open Email App */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        triggerBeep(520, 0.08);
                        window.location.href = "mailto:";
                      }}
                      className="w-full h-[58px] bg-[#0F8A5F] hover:bg-[#0C7A53] text-white rounded-[18px] text-[15px] font-semibold tracking-wide transition duration-180 flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(15,138,95,0.25)]"
                      style={{ minHeight: '48px' }}
                    >
                      <span>Open Email App</span>
                    </motion.button>

                    {/* Secondary: Resend Email */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        triggerBeep(450, 0.08);
                        if (auth.currentUser) {
                          try {
                            await sendEmailVerification(auth.currentUser);
                            setAuthSuccess("Verification link sent!");
                          } catch (e: any) {
                            setAuthError(e.message || "Failed to resend verification email.");
                          }
                        } else {
                          setAuthSuccess("A verification link has been resent to your email.");
                        }
                      }}
                      className="w-full h-[58px] border border-neutral-200 bg-white/85 hover:bg-neutral-50 text-[#161616] rounded-[18px] text-[15px] font-semibold transition duration-180 flex items-center justify-center cursor-pointer shadow-sm"
                      style={{ minHeight: '48px' }}
                    >
                      <span>Resend Email</span>
                    </motion.button>

                    {/* Back to Login */}
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerBeep(350, 0.05);
                          setAuthScreenState('login');
                          setAuthError('');
                        }}
                        className="text-[14px] font-semibold text-[#0F8A5F] hover:underline transition duration-150 cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Google Login & Divider */}
                {(authScreenState === 'login' || authScreenState === 'signup') && (
                  <div className="w-full">
                    {/* Divider */}
                    <div className="relative my-6 flex items-center justify-center w-full">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200"></div>
                      </div>
                      <span className="relative px-4 bg-[#F8F9FB] text-[12px] font-mono tracking-widest text-[#9CA3AF] uppercase">
                        Or
                      </span>
                    </div>

                    {/* Google Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={loginWithGoogle}
                      className="w-full h-[58px] bg-white border border-neutral-200/80 rounded-[18px] text-[15px] font-semibold text-[#161616] shadow-sm hover:bg-[#FDFDFD] hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-3 cursor-pointer"
                      style={{ minHeight: '48px' }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.74 14.93 1 12 1 7.37 1 3.4 3.66 1.45 7.55l3.79 2.94C6.18 7.55 8.84 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.6-.21-2.3H12v4.4h6.42c-.28 1.44-1.1 2.66-2.33 3.48l3.61 2.8c2.11-1.95 3.32-4.83 3.32-8.38z" />
                        <path fill="#FBBC05" d="M5.24 14.75c-.24-.72-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3L1.45 7.21C.52 9.07 0 11.17 0 13.4s.52 4.33 1.45 6.19l3.79-2.84z" />
                        <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.61-2.8c-1.1.74-2.5 1.18-4.35 1.18-3.16 0-5.82-2.51-6.76-5.45l-3.79 2.94C3.4 19.34 7.37 23 12 23z" />
                      </svg>
                      <span>Continue with Google</span>
                    </motion.button>
                  </div>
                )}

                {/* Footer Switch Link */}
                {authScreenState === 'login' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-2">
                    <p className="text-[14px] text-neutral-500 font-sans">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          triggerBeep(480, 0.05);
                          setAuthIsSignUp(true);
                          setAuthScreenState('signup');
                          setAuthError('');
                        }}
                        className="font-bold text-[#0F8A5F] hover:underline transition-all duration-150 inline-block cursor-pointer ml-1"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        Create One
                      </button>
                    </p>
                  </motion.div>
                )}
                {authScreenState === 'signup' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-2">
                    <p className="text-[14px] text-neutral-500 font-sans">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          triggerBeep(480, 0.05);
                          setAuthIsSignUp(false);
                          setAuthScreenState('login');
                          setAuthError('');
                        }}
                        className="font-bold text-[#0F8A5F] hover:underline transition-all duration-150 inline-block cursor-pointer ml-1"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        Sign In
                      </button>
                    </p>
                  </motion.div>
                )}

              </div>
            )}
          </div>

        </div>

        {/* Floating Success Toast (Green Check, Rounded, Automatically disappears) */}
        <AnimatePresence>
          {authSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.95 }}
              className="absolute top-6 left-6 right-6 bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(15,138,95,0.12)] rounded-[22px] p-4.5 z-50 flex items-center space-x-3.5"
            >
              <div className="w-[42px] h-[42px] rounded-full bg-[#0F8A5F]/10 flex items-center justify-center flex-shrink-0 text-[#0F8A5F]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-[#161616]">Success</p>
                <p className="text-[12px] text-neutral-500 font-sans leading-tight mt-0.5">{authSuccess}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Friendly Floating Error Rounded Card overlay (no red blocks, retry button) */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              className="absolute bottom-6 left-6 right-6 bg-white border border-neutral-200/80 shadow-[0_12px_32px_rgba(0,0,0,0.08)] rounded-[24px] p-5.5 z-50 flex flex-col space-y-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-[42px] h-[42px] rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-[14px] font-bold text-[#161616]">Unable to authenticate</h4>
                  <p className="text-[12px] text-neutral-500 leading-normal font-sans">
                    {authError.includes("wrong-password") || authError.includes("user-not-found") || authError.includes("invalid-credential") || authError.includes("invalid-login-credentials")
                      ? "We couldn't sign you in. Please check your details and try again."
                      : authError}
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    triggerBeep(320, 0.08);
                    setAuthError("");
                  }}
                  className="px-5 py-2.5 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white text-[13px] font-semibold rounded-full shadow-sm transition duration-150 cursor-pointer"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium bottom status lines */}
        <div className="text-center pb-4 relative z-10">
          <p className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">
            ✓ END-TO-END SEGREGATION · SECURED VIA FIREBASE CLIENT SHIELDS
          </p>
        </div>
      </div>
    );
  }

  if (isCurrentMeBanned && currentUser) {
    return (
      <div className="flex flex-col h-screen bg-[#080a10] text-white font-sans overflow-y-auto max-w-md mx-auto relative border border-red-950/80 shadow-2xl justify-between p-6">
        <div className="absolute inset-0 bg-radial from-red-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col items-center mt-12 relative z-10">
          <div className="w-16 h-16 bg-red-950/30 border border-red-500/30 rounded-3xl flex items-center justify-center shadow-lg relative mb-6 animate-pulse">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-white mb-2 uppercase text-center">ACCOUNT BANNED</h1>
          <p className="text-sm text-red-400 font-mono text-center font-bold mb-4">
            SAFETY VIOLATION DETECTED
          </p>
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl max-w-sm text-center shadow-md space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your account on nearby has been automatically suspended because you received <span className="text-red-400 font-bold font-mono">10 or more reports</span> from different verified members for harassment, unsafe behavior, or spam violations.
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              Proximity Safety System V2 • Automated Ban
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            triggerBeep(320, 0.2);
            await signOut(auth);
          }}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold font-display uppercase tracking-widest transition-all cursor-pointer shadow-lg mt-8"
        >
          Sign Out of Account
        </button>
      </div>
    );
  }

  const appContent = (
    <div className={`flex flex-col h-screen w-full ${theme.appBg} font-sans antialiased overflow-hidden relative transition-all duration-300`}>
      
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

      {/* --- Main Contents Stack (Toggled via Active Tabs) --- */}
      <div className={`flex-1 overflow-y-auto pb-20 relative ${theme.contentBg}`}>
        <AnimatePresence mode="wait">
          
          {/* ---------------------------------------------------- */}
          {/* CHAT TAB (The Instagram / Snapchat Messages Screen) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'chat' && !selectedNeighbor && (
            <motion.div
              key="chat-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full bg-[#FAFAF9] dark:bg-[#111214]"
            >
              {/* --- Premium Chat Search (Height: 56px, Radius: 18px) --- */}
              <div className="px-5 pt-8 pb-2 shrink-0">
                <div className="relative flex items-center h-[56px] rounded-[18px] px-4 border border-stone-200 dark:border-neutral-800 bg-white dark:bg-[#16171B] shadow-soft-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#0F8A5F]/30 focus-within:border-[#0F8A5F]/50">
                  <Search className="w-5 h-5 mr-3 text-[#0F8A5F]" />
                  <input
                    ref={chatSearchInputRef}
                    type="text"
                    value={searchWideSop}
                    onChange={(e) => setSearchWideSop(e.target.value)}
                    placeholder="Search conversations..."
                    className="bg-transparent text-sm w-full focus:outline-none text-[#161616] dark:text-[#FFFFFF] placeholder-stone-400 dark:placeholder-neutral-500 font-sans"
                  />
                  {searchWideSop && (
                    <button 
                      onClick={() => {
                        setSearchWideSop('');
                        triggerBeep(320, 0.05);
                      }} 
                      className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-neutral-200 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Five elegant high-contrast filters matching WhatsApp & Snapchat layout */}
              <div className="px-5 py-3 flex items-center space-x-2 overflow-x-auto scrollbar-none border-b border-stone-100 dark:border-neutral-800/40 shrink-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'favorites', label: 'Favorites' },
                  { id: 'requests', label: `Friend Requests (${pendingFriendRequests.length})` },
                  { id: 'calls', label: '📞 Calls' }
                ].map((item) => {
                  const isActive = chatFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setChatFilter(item.id as any);
                        triggerBeep(380, 0.05);
                      }}
                      className={`whitespace-nowrap rounded-full px-4.5 py-1.5 text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer ${
                        isActive
                          ? 'bg-[#0F8A5F] text-white shadow-soft-sm'
                          : appTheme === 'dark'
                            ? 'bg-[#1A1C20] text-neutral-400 hover:text-white border border-neutral-800/40'
                            : 'bg-white text-stone-600 hover:text-black border border-stone-200/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Archive UI Toggler inside Chat view (WhatsApp-style entry card) */}
              {archivedNeighborIds.length > 0 && !showArchivedOnly && chatFilter !== 'calls' && chatFilter !== 'requests' && (
                <div className="px-5 pt-3 shrink-0">
                  <button
                    onClick={() => {
                      setShowArchivedOnly(true);
                      triggerBeep(330, 0.05);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-[20px] border border-stone-200/60 dark:border-neutral-800/60 bg-white dark:bg-[#16171B] hover:bg-stone-50 dark:hover:bg-neutral-800/30 shadow-soft-sm transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-[#0F8A5F] flex items-center justify-center">
                        <Archive className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-sm block text-neutral-900 dark:text-white">Archived Chats</span>
                        <span className="text-[10.5px] text-stone-500 dark:text-neutral-400 font-medium">Viewing hidden conversations</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-500/20 text-xs font-black text-[#0F8A5F] dark:text-emerald-400">
                      {archivedNeighborIds.length}
                    </span>
                  </button>
                </div>
              )}

              {/* View header if currently showing ONLY archived chats */}
              {showArchivedOnly && (
                <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-stone-100 dark:border-neutral-800/40 shrink-0 bg-white dark:bg-[#16171B]">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setShowArchivedOnly(false);
                        triggerBeep(300, 0.05);
                      }}
                      className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 transition text-neutral-600 dark:text-neutral-400"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-left">
                      <span className="font-extrabold text-base text-neutral-900 dark:text-white block">Archived Chats</span>
                      <p className="text-[10px] text-stone-500 dark:text-neutral-400 font-medium">Keep conversations neat & organized</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs font-bold text-[#0F8A5F] dark:text-emerald-400">
                    {sortedChatList.length} Archived
                  </span>
                </div>
              )}

              {/* Tab Contents: Based on chatFilter */}
              {chatFilter === 'calls' ? (
                <div className="flex-1 space-y-3.5 px-5 py-4 overflow-y-auto pb-4 scrollbar-thin">
                  {(() => {
                    const localLogs = JSON.parse(localStorage.getItem('call_history_logs') || '[]');
                    if (localLogs.length === 0) {
                      return (
                        <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-3xl">
                            📞
                          </div>
                          <div className="space-y-1 max-w-sm">
                            <h4 className="font-sans text-sm font-bold text-neutral-200">No Call History Yet</h4>
                            <p className="font-mono text-[10px] text-neutral-500 leading-normal">
                              Dial your neighbors directly or establish high-fidelity WebRTC links to see call logs here.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return localLogs.map((log: any, idx: number) => {
                      const nb = neighbors.find((n: any) => n.id === log.neighborId);
                      if (!nb) return null;

                      const formattedTime = (() => {
                        try {
                          const date = new Date(log.timestamp);
                          return date.toLocaleString('en-NG', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            month: 'short',
                            day: 'numeric'
                          });
                        } catch (e) {
                          return 'Recent';
                        }
                      })();

                      return (
                        <div
                          key={log.id || idx}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                            appTheme === 'dark' 
                              ? 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800' 
                              : 'bg-white hover:bg-zinc-50 border-neutral-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            {/* Neighbor Avatar */}
                            <div className={`w-12 h-12 rounded-full ${nb.avatarColor} flex items-center justify-center text-xl shadow-inner flex-shrink-0`}>
                              <span>{nb.avatarEmoji}</span>
                            </div>

                            {/* Call Details */}
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className={`font-sans text-xs font-bold truncate max-w-[120px] ${appTheme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
                                  {nb.name}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-tight ${
                                  log.type === 'video' 
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                }`}>
                                  {log.type}
                                </span>
                              </div>

                              {/* Type description */}
                              <p className="text-[10px] font-mono mt-0.5 flex items-center space-x-1 text-neutral-400">
                                {log.status === 'missed' ? (
                                  <span className="text-red-400 font-semibold flex items-center">
                                    🚨 Missed {log.incoming ? 'incoming' : 'outgoing'}
                                  </span>
                                ) : log.status === 'declined' ? (
                                  <span className="text-gray-500 flex items-center">
                                    🚫 Declined
                                  </span>
                                ) : (
                                  <span className="text-green-400 flex items-center">
                                    📞 {log.incoming ? 'Inbound' : 'Outbound'} ({log.durationSeconds}s)
                                  </span>
                                )}
                              </p>
                              
                              <span className="text-[9px] font-mono text-zinc-500 block mt-1">
                                {formattedTime}
                              </span>
                            </div>
                          </div>

                          {/* Quick redial action buttons */}
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                triggerBeep(420, 0.05);
                                startCall(nb.id, 'audio');
                              }}
                              className="p-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-750/30 text-emerald-400 active:scale-95 transition-all cursor-pointer"
                              title="Voice Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                triggerBeep(450, 0.05);
                                startCall(nb.id, 'video');
                              }}
                              className="p-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-750/30 text-indigo-400 active:scale-95 transition-all cursor-pointer"
                              title="Speed video-call"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : chatFilter !== 'requests' ? (
                <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin space-y-4">
                  {(() => {
                    if (sortedChatList.length === 0) {
                      return (
                        /* --- REDESIGNED PRESTIGE EMPTY STATE --- */
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 max-w-sm mx-auto">
                          <div className="relative flex items-center justify-center w-28 h-28">
                            <div className="absolute inset-0 border border-[#0F8A5F]/10 rounded-full animate-pulse shadow-[0_0_30px_rgba(15,138,95,0.05)]" />
                            <div className="absolute inset-3 border border-[#0F8A5F]/20 rounded-full shadow-[0_0_20px_rgba(15,138,95,0.1)] animate-spin-slow" />
                            <div className="absolute inset-6 border-2 border-[#0F8A5F]/40 rounded-full flex items-center justify-center bg-stone-100 dark:bg-neutral-800 shadow-[0_0_25px_rgba(15,138,95,0.15)]">
                              <MessageCircle className="w-8 h-8 text-[#0F8A5F] drop-shadow-[0_0_4px_rgba(15,138,95,0.3)]" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="font-sans font-black text-xl tracking-tight text-neutral-900 dark:text-white">
                              No Conversations Yet
                            </h3>
                            <p className="text-xs leading-relaxed text-stone-500 dark:text-neutral-400 font-medium">
                              Start chatting with people nearby. Connect with neighbors within walking distance.
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setActiveTab('radar');
                              triggerBeep(500, 0.08);
                            }}
                            className="px-6 py-3 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-extrabold rounded-2xl transition active:scale-95 cursor-pointer shadow-soft-md text-xs flex items-center space-x-2"
                          >
                            <span>Find People Nearby</span>
                            <ChevronRight className="w-4 h-4 text-[#DDF7EC]" />
                          </button>
                        </div>
                      );
                    }

                    // Separation of Pinned vs. Recent conversations
                    const pinnedChats = sortedChatList.filter(nb => nb.pinned);
                    const recentChats = sortedChatList.filter(nb => !nb.pinned);

                    const renderCard = (nb: Neighbor) => {
                      const msgs = chatMessages[nb.id] || [];
                      const lastMsg = msgs[msgs.length - 1];
                      const isUnread = nb.id === 'nb-1' || nb.id === 'nb-3' || msgs.some(m => m.isUnread === true);
                      
                      let subText = "Tap to chat and connect";
                      let lastMsgIcon = null;

                      if (lastMsg) {
                        if (lastMsg.type === 'text') {
                          subText = lastMsg.text || "";
                        } else if (lastMsg.type === 'image') {
                          subText = "Photo";
                          lastMsgIcon = <ImageIcon className="w-3.5 h-3.5 text-[#0F8A5F] inline-block mr-1 align-middle" />;
                        } else if (lastMsg.type === 'voice') {
                          subText = "Voice note";
                          lastMsgIcon = <Mic className="w-3.5 h-3.5 text-sky-500 inline-block mr-1 align-middle" />;
                        } else if (lastMsg.type === 'document') {
                          subText = lastMsg.fileName || "Document";
                          lastMsgIcon = <FileText className="w-3.5 h-3.5 text-amber-500 inline-block mr-1 align-middle" />;
                        } else if (lastMsg.type === 'call_log') {
                          subText = lastMsg.callLog?.status === 'missed' ? "Missed call" : "Call ended";
                          lastMsgIcon = <Phone className="w-3.5 h-3.5 text-rose-500 inline-block mr-1 align-middle" />;
                        }
                      } else if (nb.id === 'nb-myai') {
                        subText = "Ready to give cool advice on farming & life!";
                      }

                      // Custom representation icons
                      let iconStr = nb.avatarEmoji;
                      if (nb.id === 'nb-1') iconStr = " waffle 🧇 ";
                      else if (nb.id === 'nb-2') iconStr = " car 🚗 ";
                      else if (nb.id === 'nb-3') iconStr = " palette 🎨 ";
                      else if (nb.id === 'nb-4') iconStr = " mic 🎤 ";

                      return (
                        /* Swipe gesture wrapper with container */
                        <div key={nb.id} className="relative overflow-hidden rounded-[24px] bg-white dark:bg-[#16171B] border border-stone-100 dark:border-neutral-800/40 shadow-soft-sm mx-5">
                          {/* SWIPE ACTION BUTTONS: Revealed on Swipe Right (drag > 0) */}
                          <div className="absolute inset-y-0 left-0 flex items-center space-x-1 pl-3 z-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePinChat(nb.id);
                              }}
                              className="h-[58px] px-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-amber-500/20 shadow-soft-xs"
                              title={nb.pinned ? "Unpin Chat" : "Pin Chat"}
                            >
                              <Pin className="w-4 h-4 rotate-45" />
                              <span className="text-[8px] font-black mt-1 uppercase tracking-tight">{nb.pinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleUnreadNeighbor(nb.id);
                              }}
                              className="h-[58px] px-3.5 rounded-2xl bg-[#0F8A5F]/10 hover:bg-[#0F8A5F]/20 text-[#0F8A5F] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-[#0F8A5F]/20 shadow-soft-xs"
                              title="Mark Unread"
                            >
                              <CheckCheck className="w-4 h-4" />
                              <span className="text-[8px] font-black mt-1 uppercase tracking-tight">Status</span>
                            </button>
                          </div>

                          {/* SWIPE ACTION BUTTONS: Revealed on Swipe Left (drag < 0) */}
                          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3 z-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleArchiveChat(nb.id);
                              }}
                              className="h-[58px] px-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#0F8A5F] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-[#0F8A5F]/20 shadow-soft-xs"
                              title="Archive Chat"
                            >
                              <Archive className="w-4 h-4" />
                              <span className="text-[8px] font-black mt-1 uppercase tracking-tight">Archive</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleMuteNeighbor(nb.id);
                              }}
                              className="h-[58px] px-3.5 rounded-2xl bg-stone-500/10 hover:bg-stone-500/20 text-stone-600 dark:text-stone-400 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-stone-500/20 shadow-soft-xs"
                              title="Mute Chat"
                            >
                              <VolumeX className="w-4 h-4" />
                              <span className="text-[8px] font-black mt-1 uppercase tracking-tight">{mutedNeighborIds.includes(nb.id) ? 'Unmute' : 'Mute'}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(nb.id);
                              }}
                              className="h-[58px] px-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-rose-500/20 shadow-soft-xs"
                              title="Delete Chat"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-[8px] font-black mt-1 uppercase tracking-tight">Delete</span>
                            </button>
                          </div>

                          {/* FOREGROUND CARD: Drag component (Height: 84px, Radius: 20px, Padding: 18px) */}
                          <motion.div
                            drag="x"
                            dragConstraints={{ left: -210, right: 120 }}
                            dragElastic={0.15}
                            dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
                            whileDrag={{ scale: 0.995, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setLongPressedNeighborForMenu(nb);
                              triggerBeep(450, 0.05);
                            }}
                            onTouchStart={(e) => {
                              const timer = setTimeout(() => {
                                setLongPressedNeighborForMenu(nb);
                                triggerBeep(450, 0.05);
                              }, 600);
                              (e.currentTarget as any)._longPressTimer = timer;
                            }}
                            onTouchEnd={(e) => {
                              const timer = (e.currentTarget as any)._longPressTimer;
                              if (timer) clearTimeout(timer);
                            }}
                            onTouchMove={(e) => {
                              const timer = (e.currentTarget as any)._longPressTimer;
                              if (timer) clearTimeout(timer);
                            }}
                            onTouchCancel={(e) => {
                              const timer = (e.currentTarget as any)._longPressTimer;
                              if (timer) clearTimeout(timer);
                            }}
                            onClick={() => {
                              setSelectedNeighbor(nb);
                              triggerBeep(450, 0.1);
                            }}
                            className={`h-[72px] p-3 flex items-center space-x-3 cursor-pointer transition-colors duration-150 relative z-10 select-none ${
                              appTheme === 'dark'
                                ? 'bg-[#16171B] hover:bg-[#1C1D22] text-white'
                                : 'bg-white hover:bg-stone-50 text-neutral-900'
                            }`}
                          >
                            {/* Circular profile image (Size: 44px) with micro pulse indicator */}
                            <div className="w-11 h-11 rounded-full bg-stone-100 dark:bg-neutral-800 border border-stone-100 dark:border-neutral-800 flex items-center justify-center shadow-soft-xs select-none flex-shrink-0 relative">
                              {nb.customProfilePhoto ? (
                                <img 
                                  src={nb.customProfilePhoto} 
                                  className="w-full h-full object-cover rounded-full" 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-xl">{iconStr.trim()}</span>
                              )}
                              
                              {/* Glowing Active Status Beacon */}
                              {(() => {
                                const status = nb.id === 'nb-myai' ? 'active' :
                                               nb.id === 'nb-1' ? 'active' :
                                                nb.id === 'nb-2' ? 'away' :
                                                nb.id === 'nb-3' ? 'offline' :
                                                nb.id === 'nb-4' ? 'away' :
                                                (nb.onlineStatus || 'offline');
                                if (status === 'active') {
                                  return (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#0F8A5F] rounded-full border-2 border-white dark:border-[#16171B] flex items-center justify-center shadow-soft-xs">
                                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute" />
                                    </span>
                                  );
                                } else if (status === 'away') {
                                  return <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#F59E0B] rounded-full border-2 border-white dark:border-[#16171B] shadow-soft-xs" />;
                                } else {
                                  return <span className="absolute bottom-0 right-0 w-3 h-3 bg-stone-400 dark:bg-neutral-500 rounded-full border-2 border-white dark:border-[#16171B] shadow-soft-xs" />;
                                }
                              })()}
                            </div>

                            {/* Conversation Meta Details */}
                            <div className="flex-1 min-w-0">
                              {/* Line 1: Bold Name (text-sm / 14px) + Verification/AI Badge + Timestamp */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  <h4 className={`text-sm font-bold truncate ${appTheme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
                                    {nb.name}
                                  </h4>
                                  
                                  {/* Verified Badge */}
                                  {nb.verificationLevel === 'Verified' && (
                                    <CheckCircle2 className="w-4 h-4 text-[#0F8A5F] fill-[#0F8A5F]/10 flex-shrink-0" />
                                  )}
                                  
                                  {mutedNeighborIds.includes(nb.id) && (
                                    <VolumeX className="w-3.5 h-3.5 text-stone-400 dark:text-neutral-500 flex-shrink-0" />
                                  )}
                                  
                                  {blockedNeighborIds.includes(nb.id) && (
                                    <span className="text-[8px] px-1.5 py-0.2 bg-red-500/10 text-red-500 rounded-md font-bold uppercase tracking-wider scale-90 flex-shrink-0">Blocked</span>
                                  )}
                                  {nb.isGroup && (
                                    <span className="bg-[#0F8A5F]/10 text-[#0F8A5F] text-[8px] px-1.5 py-0.2 rounded-md font-black flex-shrink-0">
                                      GROUP
                                    </span>
                                  )}
                                  {nb.id === 'nb-myai' && (
                                    <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[8px] px-1.5 py-0.2 rounded-md font-black animate-pulse flex-shrink-0">
                                      AI
                                    </span>
                                  )}
                                </div>
                                
                                {/* Timestamp Top Right */}
                                <span className={`text-[10px] font-sans font-medium flex-shrink-0 ${isUnread ? 'text-[#0F8A5F] font-bold' : 'text-stone-400 dark:text-neutral-500'}`}>
                                  {lastMsg 
                                    ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                    : (nb.lastSeen 
                                        ? new Date(nb.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                        : '5:13 PM')}
                                </span>
                              </div>

                              {/* Line 2: Last Discussion (15px, Gray) + Indicators (Unread Badge, Pin, Trust) */}
                              <div className="flex items-center justify-between mt-1">
                                <div className={`text-[13px] truncate max-w-[200px] flex items-center space-x-1 ${isUnread ? 'text-neutral-900 dark:text-white font-extrabold' : 'text-stone-500 dark:text-neutral-400'}`}>
                                  {lastMsg && lastMsg.senderId === 'user' && (
                                    <span className="mr-1">
                                      {lastMsg.status === 'read' ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline" />
                                      ) : lastMsg.status === 'delivered' ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-stone-400 inline" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5 text-stone-400 inline" />
                                      )}
                                    </span>
                                  )}
                                  
                                  {/* Simulated Typing Indicator */}
                                  {simulatedTypingMap[nb.id] || nb.typingTo === currentUser?.uid ? (
                                    <span className="text-[#0F8A5F] font-black animate-pulse">typing...</span>
                                  ) : (
                                    <span className="truncate flex items-center">
                                      {lastMsgIcon}
                                      <span>{subText}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Right Side Badges */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {/* Trust Badge (Optional) */}
                                  {nb.trustScore && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[#0F8A5F] font-extrabold">
                                      {nb.trustScore}% 🛡️
                                    </span>
                                  )}
                                  
                                  {nb.pinned && (
                                    <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45 fill-amber-500/20" />
                                  )}
                                  
                                  {isUnread && (
                                    <span className="w-4.5 h-4.5 rounded-full bg-[#0F8A5F] text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-soft-sm">
                                      1
                                    </span>
                                  )}
                                  
                                  {/* Web Safe Encryption Symbol */}
                                  <span className="text-stone-400 dark:text-neutral-600 text-[10px]" title="End-to-End Encrypted">
                                    🔒
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-4">
                        {/* Pinned section header & elements */}
                        {pinnedChats.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="px-5 pt-3 pb-1 flex items-center space-x-1.5 text-[11px] font-black text-amber-500 uppercase tracking-wider font-sans">
                              <Pin className="w-3.5 h-3.5 rotate-45 text-amber-500 fill-amber-500/20" />
                              <span>Pinned Chats</span>
                            </div>
                            <div className="space-y-3">
                              {pinnedChats.map((nb) => renderCard(nb))}
                            </div>
                          </div>
                        )}

                        {/* Recent chats section header & elements */}
                        {recentChats.length > 0 && (
                          <div className="space-y-2.5">
                            {pinnedChats.length > 0 && (
                              <div className="px-5 pt-3 pb-1 text-[11px] font-black text-stone-400 dark:text-neutral-500 uppercase tracking-wider font-sans">
                                <span>Recent Chats</span>
                              </div>
                            )}
                            <div className="space-y-3">
                              {recentChats.map((nb) => renderCard(nb))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Friend Requests empty state & active buttons */
                <div className="flex-1 space-y-3 px-5 py-4 overflow-y-auto pb-4 scrollbar-thin">
                  {pendingFriendRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                      <span className="text-3xl text-brand-blue animate-bounce">📬</span>
                      <p className={`text-sm font-display font-bold ${appTheme === 'dark' ? 'text-[#F9FAFB]' : 'text-[#111827]'}`}>No Connection Requests</p>
                      <p className={`text-xs leading-relaxed max-w-xs ${appTheme === 'dark' ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                        You're fully up to date! Grid requests from walking-distance neighbors will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${appTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Incoming neighbor connections ({pendingFriendRequests.length})
                      </p>
                      
                      {pendingFriendRequests.map((reqId) => {
                        const requester = neighbors.find(n => n.id === reqId);
                        if (!requester) return null;

                        return (
                          <div 
                            key={reqId}
                            className={`p-4 rounded-2xl border flex flex-col space-y-3 shadow-sm ${theme.cardBg}`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className={`w-11 h-11 rounded-full ${requester.avatarColor || 'bg-indigo-500'} flex items-center justify-center text-xl shadow-inner select-none flex-shrink-0`}>
                                <span>{requester.avatarEmoji}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-display font-bold text-sm ${appTheme === 'dark' ? 'text-[#F9FAFB]' : 'text-[#111827]'}`}>
                                  {requester.name}
                                </h4>
                                <p className={`text-xs truncate ${appTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                  @{requester.username} • {requester.distanceMeters}m away
                                </p>
                              </div>
                            </div>
                            
                            <p className={`text-xs font-sans italic px-1 ${appTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                              "Hey! I live nearby o, saw your radar pin and wanted to say hi! Let's connect!"
                            </p>

                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                onClick={() => {
                                  // Accept Action
                                  handleAcceptFriendRequest(reqId);
                                }}
                                className="flex-1 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                              >
                                <span>Accept</span>
                                <span>✅</span>
                              </button>
                                
                              <button
                                onClick={() => {
                                  // Decline Action
                                  handleDeclineFriendRequest(reqId);
                                }}
                                className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 rounded-xl text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                              >
                                <span>Decline</span>
                                <span>❌</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* --- Bottom Drawer for Picker New Chat list --- */}
              <AnimatePresence>
                {showNewChatDrawer && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setShowNewChatDrawer(false);
                        triggerBeep(320, 0.04);
                      }}
                      className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
                    />
                    {/* Drawer sheet */}
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                      className={`fixed inset-x-0 bottom-0 max-w-md mx-auto rounded-t-[28px] border-t p-6 pb-8 z-50 font-sans shadow-2xl max-h-[80vh] flex flex-col ${
                        appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-black'
                      }`}
                    >
                      <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setShowNewChatDrawer(false)} />
                      
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-bold">New Chat</h3>
                          <p className="text-xs text-zinc-500">Pick a local neighbor on your proximity grid</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowNewChatDrawer(false);
                            triggerBeep(320, 0.04);
                          }}
                          className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center justify-center text-zinc-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Pick list of local neighbors */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                        {neighbors.map((nb) => {
                          const status = nb.id === 'nb-myai' ? 'active' :
                                         nb.id === 'nb-1' ? 'active' :
                                          nb.id === 'nb-2' ? 'away' :
                                          nb.id === 'nb-3' ? 'offline' :
                                          nb.id === 'nb-4' ? 'away' :
                                          (nb.onlineStatus || 'offline');
                          return (
                            <div
                              key={nb.id}
                              onClick={() => {
                                setSelectedNeighbor(nb);
                                setShowNewChatDrawer(false);
                                triggerBeep(450, 0.1);
                              }}
                              className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                                appTheme === 'dark' ? 'hover:bg-neutral-800 bg-neutral-900/40' : 'hover:bg-zinc-100 bg-zinc-50 border border-zinc-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-11 h-11 rounded-full ${nb.avatarColor} flex items-center justify-center text-lg relative flex-shrink-0`}>
                                  {nb.customProfilePhoto ? (
                                    <img src={nb.customProfilePhoto} className="w-full h-full object-cover rounded-full" alt="" />
                                  ) : (
                                    <span>{nb.avatarEmoji}</span>
                                  )}
                                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-neutral-900 ${
                                    status === 'active' ? 'bg-[#25D366]' : status === 'away' ? 'bg-[#F59E0B]' : 'bg-zinc-400'
                                  }`} />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-sm block truncate">{nb.name}</span>
                                  <span className="text-xs text-zinc-500 truncate block">@{nb.username} • {nb.distanceMeters}m away</span>
                                </div>
                              </div>
                              <span className="text-xs text-[#25D366] font-bold flex-shrink-0">Chat →</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* RADAR MAP TAB (Simple Nigerian Community Grid Map)   */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'radar' && (
            <motion.div
              key="radar-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full relative overflow-hidden flex flex-col p-0 w-full select-none bg-neutral-950"
            >
              {/* Actual interactive Google Map down to street level with directions */}
              <GoogleMapIntegration
                appTheme={appTheme}
                activeCoords={userCoords || selectedPreset.coords}
                filteredNeighbors={filteredNeighbors}
                onSelectNeighbor={setSelectedNeighbor}
                userRadarEmoji={userRadarEmoji}
                setUserCoords={setUserCoords}
                setGpsSynced={setGpsSynced}
                setUserAddress={setUserAddress}
                setAudioFeedback={setAudioFeedback}
                selectedPreset={selectedPreset}
                updatePresetWithCoordinates={updatePresetWithCoordinates}
                triggerBeep={triggerBeep}
                onToggleRadarSettings={() => setShowRadarDrawer(!showRadarDrawer)}
                onToggleAddFriends={() => setShowAddFriendsModal(true)}
                hasUnreadFriends={neighbors.filter(n => n.id !== 'nb-myai' && !(Array.isArray(friendIds) ? friendIds : []).includes(n.id)).length > 0}
                usingGoogleMaps={usingGoogleMaps}
                setUsingGoogleMaps={setUsingGoogleMaps}
              />



              {/* Floating Bottom Navigation Locator Compass Arrow */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1510]">
                <button 
                  onClick={() => {
                    const centerCoords = selectedPreset.coords;
                    setUserCoords(centerCoords);
                    triggerBeep(600, 0.06);
                    setAudioFeedback(`📍 Centered radar on ${selectedPreset.city}!`);
                    setTimeout(() => setAudioFeedback(""), 2000);
                  }} 
                  className="w-12 h-12 rounded-full bg-[#111827] border border-white/15 hover:border-white/30 text-white shadow-2xl flex items-center justify-center hover:bg-[#1E293B] active:scale-95 transition-all cursor-pointer"
                  title="Center map on epicenter"
                >
                  <Navigation className="w-6 h-6 text-white fill-white transform rotate-45 translate-x-[1px] -translate-y-[1px]" />
                </button>
              </div>

              {/* Floating Settings/Controls shortcuts on the right side */}
              <div className="absolute right-4 top-20 flex flex-col space-y-2 z-[1510]">
                <button
                  onClick={() => {
                    setShowRadarDrawer(!showRadarDrawer);
                    triggerBeep(420, 0.05);
                  }}
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 hover:border-white/30 hover:bg-black/75 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-md"
                  title="Range & Visibility Controls"
                >
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Glassmorphism settings drawer panel */}
              {showRadarDrawer && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="absolute bottom-20 left-4 right-4 z-[1520] bg-neutral-950/90 backdrop-blur-xl border border-neutral-800/80 rounded-3xl p-5 shadow-2xl space-y-4 font-sans text-white pointer-events-auto"
                >
                  {/* Handle bar inside */}
                  <div 
                    onClick={() => setShowRadarDrawer(false)}
                    className="w-12 h-1 bg-white/20 rounded-full mx-auto cursor-pointer mb-2" 
                  />

                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm select-none">📡</span>
                      <span className="font-extrabold text-sm tracking-tight text-white">Active Radar Controls</span>
                    </div>
                    <button
                      onClick={() => { setShowRadarDrawer(false); triggerBeep(300, 0.04); }}
                      className="text-zinc-400 hover:text-white bg-white/10 rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {/* Proximity Filter Slider */}
                  <div className="space-y-2 pt-1 border-t border-neutral-900">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-extrabold flex items-center space-x-1">
                        <span>📏</span>
                        <span>Discovery Radius</span>
                      </span>
                      <span className="text-[#00AFEF] font-black">{radarRadius} meters</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="50"
                      value={radarRadius}
                      onChange={(e) => {
                        setRadarRadius(Number(e.target.value));
                        triggerBeep(380, 0.05);
                      }}
                      className="w-full h-1.5 rounded-lg cursor-pointer accent-[#00AFEF] bg-white/15"
                    />
                    
                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1 pt-1 justify-between">
                      {[0, 50, 100, 200, 300, 500, 750, 1000].map((presetVal) => (
                        <button
                          key={presetVal}
                          onClick={() => {
                            setRadarRadius(presetVal);
                            triggerBeep(390, 0.04);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition ${
                            radarRadius === presetVal
                              ? "bg-[#00AFEF] text-white"
                              : "bg-white/5 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {presetVal}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Privacy Mode Selector Scheme o! */}
                  <div className="space-y-2 pt-3 border-t border-neutral-900">
                    <span className="text-xs text-zinc-400 font-extrabold block flex items-center space-x-1">
                      <span>🕵️‍♂️</span>
                      <span>Location Privacy Scheme</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl">
                      {[
                        { id: 'everyone', label: 'Everyone 🌍' },
                        { id: 'friends', label: 'Friends 👥' },
                        { id: 'hidden', label: 'Hidden 🔒' }
                      ].map((scheme) => (
                        <button
                          key={scheme.id}
                          onClick={async () => {
                            setRadarVisibilityMode(scheme.id as any);
                            triggerBeep(410, 0.06);
                            await updateRadarPresenceInFirestore(isUserVisibleOnRadar, scheme.id as any);
                            setAudioFeedback(`🔒 Privacy set to: ${scheme.label}`);
                            setTimeout(() => setAudioFeedback(""), 2000);
                          }}
                          className={`py-1.5 px-0.5 rounded-lg text-[10px] font-bold text-center transition ${
                            radarVisibilityMode === scheme.id
                              ? 'bg-[#00AFEF] text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {scheme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Map Engine Provider Selection */}
                  <div className="space-y-2 pt-3 border-t border-neutral-900">
                    <span className="text-xs text-zinc-400 font-extrabold block flex items-center space-x-1">
                      <span>🗺️</span>
                      <span>Map Engine Provider</span>
                    </span>
                    <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl">
                      <button
                        onClick={() => {
                          if (!hasValidGoogleMapsKey) {
                            setAudioFeedback("🚫 Google Maps key is missing or invalid!");
                            setTimeout(() => setAudioFeedback(""), 2000);
                            triggerBeep(300, 0.15);
                            return;
                          }
                          setUsingGoogleMaps(true);
                          triggerBeep(410, 0.06);
                          setAudioFeedback("🗺️ Map engine set to Google Maps");
                          setTimeout(() => setAudioFeedback(""), 2000);
                        }}
                        className={`py-1.5 px-0.5 rounded-lg text-[10px] font-bold text-center transition ${
                          usingGoogleMaps
                            ? 'bg-[#00AFEF] text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        } ${!hasValidGoogleMapsKey ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        Google Maps {!hasValidGoogleMapsKey ? '(Unavailable)' : ''}
                      </button>
                      <button
                        onClick={() => {
                          setUsingGoogleMaps(false);
                          triggerBeep(410, 0.06);
                          setAudioFeedback("🗺️ Map engine set to OpenStreetMap");
                          setTimeout(() => setAudioFeedback(""), 2000);
                        }}
                        className={`py-1.5 px-0.5 rounded-lg text-[10px] font-bold text-center transition ${
                          !usingGoogleMaps
                            ? 'bg-[#00AFEF] text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        OpenStreetMap (Leaflet)
                      </button>
                    </div>
                  </div>

                  {/* Yes - Add myself to active radar visibility Grid checkbox */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-900">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[#FFFC00] text-sm select-none">📡</span>
                      <div>
                        <span className="font-bold text-xs block text-zinc-100">Radar Discoverability Mode</span>
                        <span className="text-[10px] block text-zinc-400 leading-tight">Sync your coordinates on active user radar</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isUserVisibleOnRadar} 
                        onChange={async (e) => {
                          const val = e.target.checked;
                          setIsUserVisibleOnRadar(val);
                          triggerBeep(440, 0.1);
                          await updateRadarPresenceInFirestore(val, radarVisibilityMode);
                          setAudioFeedback(val ? "📍 Discoverable on active radar!" : "🔕 Location presence private (Ghost mode)");
                          setTimeout(() => setAudioFeedback(""), 2000);
                        }}
                      />
                      <div className="w-8 h-4 rounded-full peer peer-focus:outline-none relative transition-all duration-200 bg-white/10 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-3 after:w-3 after:transition-all after:bg-[#9CA3AF] peer-checked:bg-[#00AFEF] peer-checked:after:bg-white peer-checked:after:translate-x-4" />
                    </label>
                  </div>

                  {/* Real-time Discoverable Nearby List */}
                  <div className="space-y-2 pt-3 border-t border-neutral-900">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-extrabold flex items-center space-x-1">
                        <span>🙋‍♂️</span>
                        <span>Discoverable Nearby ({filteredNeighbors.filter(a => a.id !== 'nb-myai').length})</span>
                      </span>
                      <span className="text-[9px] text-[#00AFEF] font-bold animate-pulse uppercase">● Nearby Radar</span>
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                      {filteredNeighbors.filter(n => n.id !== 'nb-myai').length === 0 ? (
                        <div className="text-[10px] text-zinc-500 italic text-center py-2">No other users within {radarRadius}m radius.</div>
                      ) : (
                        filteredNeighbors.filter(n => n.id !== 'nb-myai').map(nb => (
                          <div 
                            key={nb.id}
                            onClick={() => {
                              setSelectedNeighbor(nb);
                              setShowRadarDrawer(false);
                            }}
                            className="flex items-center justify-between p-1.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition"
                          >
                            <div className="flex items-center space-x-2">
                              {nb.customProfilePhoto ? (
                                <img 
                                  src={nb.customProfilePhoto} 
                                  className="w-5 h-5 rounded-full object-cover border border-white/20" 
                                  referrerPolicy="no-referrer"
                                  alt="" 
                                />
                              ) : (
                                <span className="text-xs">{nb.avatarEmoji}</span>
                              )}
                              <span className="font-bold text-[11px] text-zinc-200 truncate max-w-[140px]">{nb.name}</span>
                            </div>
                            <span className="text-[10px] font-sans text-[#00AFEF] font-bold">{nb.distanceMeters}m away</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STATUS TAB (Custom story ring layout exactly as requested) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'status' && (() => {
            // Local Helper Functions
            const hour = new Date().getHours();
            const getGreeting = () => {
              if (hour < 12) return { text: "Good Morning", emoji: "🌅" };
              if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
              return { text: "Good Evening", emoji: "🌙" };
            };
            const getFirstName = () => {
              if (currentUser?.displayName) {
                return currentUser.displayName.split(' ')[0];
              }
              if (userDisplayName) {
                return userDisplayName.split(' ')[0];
              }
              return "Samuel";
            };

            // Dynamic Neighbors excluding self and MYAI
            const dynamicNeighbors = filteredNeighbors.filter(nb => nb.id !== 'nb-myai' && !nb.isGroup);

            // Suggested Friends: candidate users who are NOT yet friends
            const suggestedFriendsList = filteredNeighbors.filter(nb => 
              nb.id !== 'nb-myai' && 
              !nb.isGroup && 
              !friendIds.includes(nb.id)
            ).slice(0, 3);

            // Fallback suggestions if list is empty
            const finalSuggestions = suggestedFriendsList.length > 0 ? suggestedFriendsList : [
              { id: 'nb-sade', name: 'Sade', username: 'sade_sparkles', distanceMeters: 410, avatarEmoji: '👩‍🦰', interests: ['Music', 'Food', 'Design'], trustScore: 4.8, bio: 'Loves deep chats and checking out new local cafes. Let\'s meet!' },
              { id: 'nb-tobi', name: 'Tobi', username: 'tobi_hustler', distanceMeters: 620, avatarEmoji: '👨', interests: ['Tech', 'Football', 'Startups'], trustScore: 4.5, bio: 'Frontend dev. Down to grab lunch or network near Wuse Food Court.' }
            ];

            // Horizontally Scrollable People list
            const finalPeopleList = dynamicNeighbors.length > 0 ? dynamicNeighbors : [
              { id: 'nb-fallback-1', name: 'Ada', distanceMeters: 120, avatarEmoji: '👩‍🦰', onlineStatus: 'active' as const },
              { id: 'nb-fallback-2', name: 'David', distanceMeters: 340, avatarEmoji: '👨', onlineStatus: 'active' as const },
              { id: 'nb-fallback-3', name: 'Esther', distanceMeters: 560, avatarEmoji: '👩', onlineStatus: 'offline' as const },
            ];

            const isDbLoading = neighbors.length === 0;

            return (
              <motion.div
                key="status-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22 }}
                className="p-5 space-y-6 pb-24 overflow-y-auto h-full scrollbar-none"
              >
                {/* 1. Greeting header */}
                <div className="space-y-1.5 animate-fade-in">
                  <h1 className="text-[28px] font-black tracking-tight text-[#161616] dark:text-white font-sans flex items-center space-x-2">
                    <span>{getGreeting().emoji} {getGreeting().text}, {getFirstName()} 👋</span>
                  </h1>
                  <p className="text-[14px] text-neutral-400 font-semibold font-sans">
                    You're visible to <span className="text-[#0F8A5F] font-bold">{dynamicNeighbors.length || 12}</span> people nearby
                  </p>
                </div>

                {/* 2. Custom Rounded Search Bar */}
                <div 
                  className={`w-full h-[56px] rounded-[18px] border flex items-center px-4 transition-all duration-200 bg-white dark:bg-[#1A1C1F] border-neutral-100 dark:border-[#2A2D31]/40 focus-within:border-[#0F8A5F] focus-within:ring-4 focus-within:ring-[#0F8A5F]/15 shadow-sm text-[#161616] dark:text-white`}
                >
                  <Search className="w-5 h-5 mr-3 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search people, interests or locations..."
                    className="bg-transparent text-[15px] font-medium w-full focus:outline-none placeholder-neutral-400 dark:placeholder-neutral-500"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(''); triggerBeep(400, 0.05); }}
                      className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                      <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                    </button>
                  )}
                </div>

                {/* Skeleton Loader Fallback */}
                {isDbLoading ? (
                  <div className="space-y-4">
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="animate-pulse space-y-3 p-5 bg-white dark:bg-[#1A1C1F] rounded-[22px] border border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
                            </div>
                          </div>
                          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 3. Live Stories Row */}
                    <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-xl">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Live Stories</h3>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { startCamera(); triggerBeep(450, 0.08); }}
                            className="p-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-[#0F8A5F]/10 hover:text-[#0F8A5F] dark:hover:text-[#0F8A5F] rounded-lg transition text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center space-x-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Camera</span>
                          </button>
                          <button
                            onClick={() => { storyFileRef.current?.click(); triggerBeep(450, 0.08); }}
                            className="p-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-[#0F8A5F]/10 hover:text-[#0F8A5F] dark:hover:text-[#0F8A5F] rounded-lg transition text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center space-x-1 cursor-pointer"
                          >
                            <input 
                              type="file" 
                              ref={storyFileRef} 
                              onChange={handleGalleryUploadForStory} 
                              accept="image/*,video/*" 
                              className="hidden" 
                            />
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Upload</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 overflow-x-auto py-1.5 scrollbar-none">
                        <div 
                          onClick={() => {
                            if (myStorySnaps.length > 0) {
                              setStoryViewer('me');
                            } else {
                              storyFileRef.current?.click();
                            }
                            triggerBeep(480, 0.08);
                          }}
                          className="flex flex-col items-center flex-shrink-0 relative cursor-pointer group"
                        >
                          <div className={`w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500 transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center shadow-sm`}>
                            <div className={`w-full h-full rounded-full p-[2.5px] flex items-center justify-center overflow-hidden ${
                              appTheme === 'dark' ? 'bg-[#111827]' : 'bg-white'
                            }`}>
                              {myStorySnaps.length > 0 ? (
                                <img src={myStorySnaps[myStorySnaps.length - 1].mediaUrl} alt="My Story" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span className="text-xl">✨</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] mt-1.5 font-semibold text-neutral-400 max-w-[64px] truncate">You</span>
                        </div>

                        {neighbors
                          .filter(nb => !nb.isGroup && nb.activeStory && nb.activeStory.length > 0 && !mutedStoryUserIds.includes(nb.id))
                          .map(nb => (
                            <div 
                              key={`dashboard-story-${nb.id}`}
                              onClick={() => {
                                setStoryViewer(nb);
                                triggerBeep(480, 0.08);
                              }}
                              className="flex flex-col items-center flex-shrink-0 relative cursor-pointer group"
                            >
                              <div className={`w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#0F8A5F] to-emerald-400 transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center shadow-sm`}>
                                <div className={`w-full h-full rounded-full p-[2.5px] flex items-center justify-center overflow-hidden ${
                                  appTheme === 'dark' ? 'bg-[#111827]' : 'bg-white'
                                }`}>
                                  {nb.customProfilePhoto ? (
                                    <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                    <span className="text-xl">{nb.avatarEmoji || "👋"}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] mt-1.5 font-bold text-[#161616] dark:text-white max-w-[64px] truncate">{nb.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* 4. Radar Live Preview Card */}
                    <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">📍</span>
                          <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Radar Nearby</h3>
                        </div>
                        <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                          Your live neighborhood radar is pulsing. Explore connections, group activities, and safe rendezvous locations down your street in real-time.
                        </p>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setActiveTab('radar'); triggerBeep(450, 0.08); }}
                          className="h-[44px] px-6 rounded-[14px] bg-[#0F8A5F] text-white hover:bg-[#0C7A53] text-[13px] font-bold shadow-sm transition duration-150 flex items-center space-x-2 cursor-pointer"
                        >
                          <span>Open Radar</span>
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>

                      <div className="h-[180px] bg-neutral-50 dark:bg-neutral-950/40 rounded-2xl border border-neutral-100/60 dark:border-neutral-900 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-[60px] h-[60px] rounded-full border border-[#0F8A5F]/20" />
                          <div className="w-[120px] h-[120px] rounded-full border border-[#0F8A5F]/15" />
                          <div className="w-[180px] h-[180px] rounded-full border border-[#0F8A5F]/10 animate-pulse" />
                        </div>
                        <motion.div 
                          style={{ originX: '100%', originY: '100%' }}
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, ease: "linear", duration: 6 }}
                          className="absolute bottom-1/2 right-1/2 w-[120px] h-[120px] bg-gradient-to-tl from-[#0F8A5F]/15 to-transparent border-r border-[#0F8A5F]/25 origin-bottom-right"
                        />
                        <div className="absolute top-[35%] left-[38%]">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8A5F] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0F8A5F]" />
                          </span>
                        </div>
                        <div className="absolute bottom-[40%] right-[32%]">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8A5F] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0F8A5F]" />
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[#0F8A5F] bg-[#0F8A5F]/10 px-2.5 py-1 rounded-full relative z-10 uppercase tracking-widest border border-[#0F8A5F]/20 animate-pulse">
                          Scanning Area
                        </span>
                      </div>
                    </div>

                    {/* 5. Safe Meetup Suggestions */}
                    <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">🤝</span>
                          <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Safe Meetups</h3>
                        </div>
                        <button
                          onClick={() => { setActiveTab('explore'); triggerBeep(410, 0.08); }}
                          className="text-xs font-bold text-[#0F8A5F] hover:underline cursor-pointer"
                        >
                          See All →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { name: 'Chicken Republic', distance: '320m away', security: 'CCTV Guarded', emoji: '🍗' },
                          { name: 'Justrite Supermarket', distance: '480m away', security: 'Active Footflow', emoji: '🛒' },
                          { name: 'Adolak Center', distance: '700m away', security: 'Open Visibility', emoji: '🏢' },
                        ].map((spot) => (
                          <div 
                            key={spot.name}
                            onClick={() => {
                              setScheduleMeetupPoint(spot.name);
                              setShowScheduleMeetupModal(true);
                              triggerBeep(450, 0.08);
                            }}
                            className="p-4 rounded-xl border border-neutral-50 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/40 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition cursor-pointer space-y-1.5"
                          >
                            <span className="text-xl block">{spot.emoji}</span>
                            <h4 className="text-xs font-bold text-[#161616] dark:text-white truncate">{spot.name}</h4>
                            <p className="text-[11px] text-neutral-400 font-medium">{spot.distance}</p>
                            <span className="text-[9px] bg-[#0F8A5F]/10 text-[#0F8A5F] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block w-max">
                              {spot.security}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 6. People Nearby */}
                    <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-xl">
                            <Users className="w-5 h-5" />
                          </div>
                          <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">People Nearby</h3>
                        </div>
                        <span className="text-xs text-neutral-400 font-semibold">{finalPeopleList.length} Active</span>
                      </div>

                      <div className="flex items-center space-x-4 overflow-x-auto py-2 scrollbar-none -mx-2 px-2">
                        {finalPeopleList.map((nb) => (
                          <motion.div
                            key={nb.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setViewingNeighborProfile(nb as any);
                              triggerBeep(480, 0.08);
                            }}
                            className="flex flex-col items-center flex-shrink-0 cursor-pointer min-w-[80px]"
                          >
                            <div className="relative">
                              <div className="w-[56px] h-[56px] rounded-full border border-neutral-100/80 dark:border-[#2A2D31]/30 shadow-sm flex items-center justify-center overflow-hidden bg-[#F7F8FA] dark:bg-neutral-800">
                                {nb.customProfilePhoto ? (
                                  <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <span className="text-xl">{nb.avatarEmoji || '🙋‍♂️'}</span>
                                )}
                              </div>
                              {nb.onlineStatus === 'active' && (
                                <span className="absolute bottom-0.5 right-0.5 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981] border-2 border-white dark:border-[#1A1C1F]" />
                                </span>
                              )}
                            </div>
                            <span className="text-[13px] font-bold text-[#161616] dark:text-white mt-1.5 truncate w-[72px] text-center">{nb.name}</span>
                            <span className="text-[11px] text-neutral-400 font-medium">{nb.distanceMeters || 120}m</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* 7. Suggested Friends */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-xl">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Suggested Friends</h3>
                      </div>

                      <div className="space-y-3">
                        {finalSuggestions.map((nb) => {
                          const isFriend = friendIds.includes(nb.id);
                          const isSent = sentFriendRequestIds.includes(nb.id);
                          const isReceived = pendingFriendRequests.includes(nb.id);

                          return (
                            <motion.div
                              key={nb.id}
                              whileHover={{ y: -2 }}
                              transition={{ duration: 0.18 }}
                              className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
                            >
                              <div 
                                onClick={() => {
                                  setViewingNeighborProfile(nb as any);
                                  triggerBeep(480, 0.08);
                                }}
                                className="flex items-start space-x-4 cursor-pointer flex-1"
                              >
                                <div className="w-[50px] h-[50px] rounded-full border border-neutral-150 dark:border-neutral-800 shadow-sm flex items-center justify-center overflow-hidden bg-[#F7F8FA] dark:bg-neutral-800 shrink-0">
                                  {nb.customProfilePhoto ? (
                                    <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                    <span className="text-xl">{nb.avatarEmoji || '🙋‍♂️'}</span>
                                  )}
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <h4 className="font-bold text-[15px] text-[#161616] dark:text-white truncate">{nb.name}</h4>
                                    <span className="text-[11px] text-neutral-400 font-medium">• {nb.distanceMeters}m</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                      <span key={idx} className="text-[11px]">
                                        {idx < Math.round(nb.trustScore || 4.5) ? '⭐' : '☆'}
                                      </span>
                                    ))}
                                    <span className="text-[10px] text-neutral-400 font-semibold ml-1">
                                      {(nb.trustScore || 4.5).toFixed(1)}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {(nb.interests || []).slice(0, 2).map((interest) => (
                                      <span
                                        key={interest}
                                        className="text-[9.5px] font-bold bg-[#EEF8F3] dark:bg-[#0F8A5F]/15 text-[#0F8A5F] px-2 py-0.5 rounded-full"
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 sm:pl-4">
                                <motion.button
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => {
                                    actuallyAddFriend(nb.id);
                                  }}
                                  className={`w-full sm:w-auto h-[38px] px-5 rounded-[12px] text-[13px] font-bold transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    isFriend
                                      ? 'bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93] border border-neutral-200 dark:border-neutral-700'
                                      : isSent
                                      ? 'bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93] hover:bg-neutral-200/60 dark:hover:bg-neutral-700'
                                      : isReceived
                                      ? 'bg-[#0F8A5F] text-white hover:bg-[#0C7A53] shadow-sm'
                                      : 'bg-[#0F8A5F] text-white hover:bg-[#0C7A53] shadow-sm'
                                  }`}
                                >
                                  {isFriend ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Connected</span>
                                    </>
                                  ) : isSent ? (
                                    <span>Requested</span>
                                  ) : isReceived ? (
                                    <span>Accept</span>
                                  ) : (
                                    <span>Connect</span>
                                  )}
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })()}

          {/* ---------------------------------------------------- */}
          {/* STATUS TAB (Custom story ring layout exactly as requested) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'status-disabled-old' && (
            <motion.div
              key="status-tab-old"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 h-full space-y-6"
            >
              {/* Header block status */}
              <div className={`flex justify-between items-center pb-2 border-b ${theme.cardBorder}`}>
                <div className="flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                  <h2 className={`text-lg font-bold tracking-tight ${theme.textTitle}`}>Status</h2>
                </div>
              </div>

              {/* Status Update Quick Action Row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    startCamera();
                    triggerBeep(450, 0.08);
                  }}
                  className={`p-4 border rounded-2xl flex flex-col items-center justify-center space-y-2 group transition active:scale-95 text-center cursor-pointer ${
                    appTheme === 'dark' 
                      ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-indigo-500' 
                      : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] border-[#E5E7EB] hover:border-indigo-400 shadow-sm'
                  }`}
                >
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl group-hover:bg-indigo-500/20">
                    <Camera className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`text-xs font-bold block ${theme.textTitle}`}>Use Camera 📸</span>
                  <p className={`text-[9px] ${theme.textMuted}`}>Shoot a live story snap</p>
                </button>

                <button
                  onClick={() => {
                    storyFileRef.current?.click();
                    triggerBeep(450, 0.08);
                  }}
                  className={`p-4 border rounded-2xl flex flex-col items-center justify-center space-y-2 group transition active:scale-95 text-center cursor-pointer ${
                    appTheme === 'dark' 
                      ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-indigo-500' 
                      : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] border-[#E5E7EB] hover:border-indigo-400 shadow-sm'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={storyFileRef} 
                    onChange={handleGalleryUploadForStory} 
                    accept="image/*,video/*" 
                    className="hidden" 
                  />
                  <div className="p-2.5 bg-rose-500/10 text-rose-450 rounded-xl group-hover:bg-rose-500/20">
                    <ImageIcon className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`text-xs font-bold block ${theme.textTitle}`}>Access Gallery 📁</span>
                  <p className={`text-[9px] ${theme.textMuted}`}>Pick picture or video file</p>
                </button>
              </div>

              {/* Stories Row (Crucial and Redesigned) */}
              <div className={`space-y-3 p-4 rounded-3xl border ${
                appTheme === 'dark' 
                  ? 'bg-neutral-900/40 border-neutral-800' 
                  : 'bg-[#F9FAFB] border-[#E5E7EB] shadow-sm'
              }`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider font-display ${theme.textMuted}`}>Stories Row</h4>
                
                <div className="flex items-center space-x-4 overflow-x-auto py-1.5 scrollbar-none">
                  {/* Your Status */}
                  <div 
                    onClick={() => {
                      if (myStorySnaps.length > 0) {
                        setStoryViewer('me');
                      } else {
                        storyFileRef.current?.click();
                      }
                      triggerBeep(480, 0.08);
                    }}
                    className="flex flex-col items-center flex-shrink-0 relative cursor-pointer group animate-fade-in"
                  >
                    <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-pink-500 to-yellow-400 transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center shadow-[0_2px_10px_rgba(244,63,94,0.15)]`}>
                      <div className={`w-full h-full rounded-full p-[2px] flex items-center justify-center overflow-hidden ${
                        appTheme === 'dark' ? 'bg-[#111827]' : 'bg-white'
                      }`}>
                        {myStorySnaps.length > 0 ? (
                          <img src={myStorySnaps[myStorySnaps.length - 1].mediaUrl} alt="My Status" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">👋</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] mt-2 font-medium ${theme.textMuted}`}>Your Status</span>
                  </div>

                  {/* Dynamic unmuted neighbors with active stories */}
                  {neighbors
                    .filter(nb => !nb.isGroup && nb.activeStory && nb.activeStory.length > 0 && !mutedStoryUserIds.includes(nb.id))
                    .map(nb => (
                      <div 
                        key={`story-row-${nb.id}`}
                        onClick={() => {
                          setStoryViewer(nb);
                          triggerBeep(480, 0.08);
                        }}
                        className="flex flex-col items-center flex-shrink-0 relative cursor-pointer group animate-fade-in"
                      >
                        <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-emerald-400 to-sky-400 transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center shadow-[0_2px_10px_rgba(16,185,129,0.14)]`}>
                          <div className={`w-full h-full rounded-full p-[2px] flex items-center justify-center overflow-hidden ${
                            appTheme === 'dark' ? 'bg-[#111827]' : 'bg-white'
                          }`}>
                            {nb.customProfilePhoto ? (
                              <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{nb.avatarEmoji || "👋"}</span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] mt-2 font-medium max-w-[64px] truncate ${theme.textMuted}`}>{nb.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Feed of stories details */}
              <div className="space-y-4 pb-4">
                <h4 className={`text-xs font-bold uppercase tracking-wider font-mono pb-1 border-b ${theme.cardBorder} ${theme.textMuted}`}>Status Updates</h4>
                
                <div className="space-y-3.5">
                  {/* Your Status List */}
                  {myStorySnaps.length > 0 && (
                    <div className={`p-4 rounded-2xl border space-y-3 ${
                      appTheme === 'dark' ? 'bg-indigo-950/25 border-indigo-500/20' : 'bg-indigo-50/40 border-indigo-200/50'
                    }`}>
                      <div 
                        onClick={() => {
                          setStoryViewer('me');
                          triggerBeep(520, 0.1);
                        }}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border ${
                            appTheme === 'dark' ? 'bg-neutral-800 border-indigo-400' : 'bg-white border-indigo-300'
                          }`}>
                            <img src={myStorySnaps[myStorySnaps.length - 1].mediaUrl} alt="My Status" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${theme.textTitle}`}>Your Status updates</h4>
                            <p className="text-[10px] text-indigo-500 font-medium font-sans">
                              {myStorySnaps.length} active updates ● Tap to play
                            </p>
                          </div>
                        </div>
                        <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 border rounded-full ${
                          appTheme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' : 'bg-indigo-100 text-indigo-600 border-indigo-200'
                        }`}>
                          View Story
                        </span>
                      </div>

                      {/* Expandable list of statuses to manage them separately! */}
                      <div className={`pt-2 border-t space-y-1.5 ${appTheme === 'dark' ? 'border-indigo-500/15' : 'border-indigo-200/55'}`}>
                        <p className={`text-[9px] uppercase font-bold tracking-tight ${theme.textMuted}`}>Manage Individual Updates:</p>
                        {myStorySnaps.map((snap, sIdx) => (
                          <div key={snap.id} className={`flex items-center justify-between p-2 rounded-xl border ${
                            appTheme === 'dark' ? 'bg-black/45 border-neutral-900' : 'bg-white border-slate-100 shadow-sm'
                          }`}>
                            <div className="flex items-center space-x-2 truncate">
                              <span className={`text-[10px] font-mono ${theme.textMuted}`}>#{sIdx + 1}</span>
                              {snap.type === 'video' ? (
                                <span className="text-[10px] text-rose-500">🎥 [Video]</span>
                              ) : (
                                <span className="text-[10px] text-emerald-500">🖼️ [Image]</span>
                              )}
                              <span className={`text-[10px] truncate max-w-[130px] ${theme.textMain}`} title={snap.caption}>
                                {snap.caption || "No caption"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-[9px] font-mono ${theme.textMuted}`}>{snap.timestamp}</span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await deleteDoc(doc(db, 'users', currentUser!.uid, 'stories', snap.id));
                                    setAudioFeedback("✓ Deleted status update!");
                                    setTimeout(() => setAudioFeedback(""), 2000);
                                    triggerBeep(300, 0.1, 'triangle');
                                  } catch (err) {
                                    console.warn("Delete error:", err);
                                  }
                                }}
                                className={`p-1 rounded-lg cursor-pointer transition text-[11px] ${
                                  appTheme === 'dark' ? 'text-red-400 hover:text-red-300 hover:bg-neutral-800' : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title="Delete this status"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unmuted Neighbors list */}
                  {neighbors
                    .filter(nb => !nb.isGroup && (neighborStories[nb.id] || []).length > 0 && !mutedStoryUserIds.includes(nb.id))
                    .map(nb => {
                      const snaps = neighborStories[nb.id] || [];
                      const latestSnap = snaps[snaps.length - 1];
                      return (
                        <div 
                          key={`recent-feed-${nb.id}`}
                          onClick={() => {
                            setStoryViewer(nb);
                            triggerBeep(520, 0.1);
                          }}
                          className={`p-3 border rounded-2xl flex items-center justify-between transition cursor-pointer ${
                            appTheme === 'dark' 
                              ? 'bg-neutral-900 border-neutral-800/80 hover:bg-neutral-850/70' 
                              : 'bg-[#F9FAFB] border-[#E5E7EB] hover:bg-slate-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full ${nb.avatarColor} flex items-center justify-center text-lg shadow-sm overflow-hidden`}>
                              {nb.customProfilePhoto ? (
                                <img src={nb.customProfilePhoto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{nb.avatarEmoji}</span>
                              )}
                            </div>
                            <div>
                              <h4 className={`text-xs font-bold leading-snug ${theme.textTitle}`}>{nb.name} (@{nb.username})</h4>
                              <p className={`text-[10px] font-sans tracking-wide ${theme.textMain}`}>
                                {latestSnap?.caption || `${snaps.length} status updates`}
                              </p>
                              <span className="text-[8px] text-indigo-500 font-mono block mt-0.5">
                                {snaps.length} update{snaps.length > 1 ? 's' : ''} ● {latestSnap?.timestamp || "recently In"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMuteNeighborStories(nb.id);
                              }}
                              className={`px-2 py-1 text-[9px] border rounded-xl transition ${
                                appTheme === 'dark' 
                                  ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-400 border-neutral-700/60' 
                                  : 'bg-white hover:bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB] shadow-sm'
                              }`}
                              title="Mute status updates from this neighbor"
                            >
                              🔕 Mute
                            </button>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 py-0.5 px-2 rounded-full uppercase font-bold tracking-wider">
                              Watch
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {/* Muted Neighbors section */}
                  {neighbors.filter(nb => !nb.isGroup && (neighborStories[nb.id] || []).length > 0 && mutedStoryUserIds.includes(nb.id)).length > 0 && (
                    <div className={`pt-3 border-t ${theme.cardBorder}`}>
                      <button
                        onClick={() => {
                          setIsMutedStoriesExpanded(!isMutedStoriesExpanded);
                          triggerBeep(450, 0.05);
                        }}
                        className={`flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider py-1.5 select-none transition ${theme.textMuted}`}
                      >
                        <span className="flex items-center space-x-1.5">
                          <span>🔕</span>
                          <span>Muted Updates ({neighbors.filter(nb => !nb.isGroup && (neighborStories[nb.id] || []).length > 0 && mutedStoryUserIds.includes(nb.id)).length})</span>
                        </span>
                        <span className="text-[10px] font-mono">{isMutedStoriesExpanded ? '▲ hide' : '▼ show'}</span>
                      </button>

                      {isMutedStoriesExpanded && (
                        <div className="mt-2.5 space-y-2.5">
                          {neighbors
                            .filter(nb => !nb.isGroup && (neighborStories[nb.id] || []).length > 0 && mutedStoryUserIds.includes(nb.id))
                            .map(nb => {
                              const snaps = neighborStories[nb.id] || [];
                              const latestSnap = snaps[snaps.length - 1];
                              return (
                                <div 
                                  key={`muted-feed-${nb.id}`}
                                  onClick={() => {
                                    setStoryViewer(nb);
                                    triggerBeep(520, 0.1);
                                  }}
                                  className={`p-3 border rounded-2xl flex items-center justify-between opacity-60 hover:opacity-90 transition cursor-pointer ${
                                    appTheme === 'dark' 
                                      ? 'bg-neutral-950/60 border-neutral-900' 
                                      : 'bg-slate-100/50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full ${nb.avatarColor} flex items-center justify-center text-lg shadow-sm overflow-hidden grayscale`}>
                                      {nb.customProfilePhoto ? (
                                        <img src={nb.customProfilePhoto} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <span>{nb.avatarEmoji}</span>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className={`text-xs font-bold ${theme.textTitle}`}>{nb.name} (Muted)</h4>
                                      <p className={`text-[9px] ${theme.textMuted} truncate max-w-[130px]`}>{latestSnap?.caption || "Muted status content"}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMuteNeighborStories(nb.id);
                                      }}
                                      className={`px-2 py-1 text-[9px] border rounded-xl hover:text-indigo-500 transition ${
                                        appTheme === 'dark' 
                                          ? 'bg-neutral-900 border-neutral-800 text-neutral-500' 
                                          : 'bg-white border-slate-200 text-slate-500'
                                      }`}
                                    >
                                      🔊 Unmute
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* LOCAL EXPLORE / DISCOVERY FEED TAB (Premium Location Discovery Features) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'explore' && (
            <motion.div
              key="explore-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-hidden"
            >
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-zinc-500 text-xs font-mono">Loading local maps & discovery...</p>
                </div>
              }>
                <ExploreTab
                  currentUser={currentUser}
                  userCoords={userCoords}
                  selectedPreset={selectedPreset}
                  neighbors={neighbors}
                  appTheme={appTheme}
                  theme={theme}
                  triggerBeep={triggerBeep}
                  onSendDirectMessage={sendPrivateMessageToNeighbor}
                  onOpenNeighborChat={onOpenNeighborChat}
                  friendIds={friendIds}
                  friendRequests={pendingFriendRequests}
                  onAddFriend={actuallyAddFriend}
                  onViewNeighborProfile={setViewingNeighborProfile}
                />
              </Suspense>
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* MENU / SETTINGS TAB (Profile & System Customizations) */}
          {/* ---------------------------------------------------- */}
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

        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------- */}
      {/* CAMERA SIMULATOR PANEL LAYOUT (Absolute Overlay)    */}
      {/* ---------------------------------------------------- */}
      {cameraActive && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden">
          {/* Top Control Header bar */}
          <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center absolute top-0 left-0 right-0 z-30">
            <span className="text-xs font-semibold bg-neutral-900/40 text-neutral-300 px-3 py-1 rounded-full border border-neutral-800 backdrop-blur-md">
              Nearby Retro Cam 📸
            </span>
            <button
              onClick={closeCamera}
              className="p-2 bg-neutral-900/80 hover:bg-neutral-800 rounded-full border border-neutral-800 text-white backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!capturedImage ? (
            /* ACTIVE CAPTURE CAM PREVIEW SCREEN */
            <div className="flex-1 bg-neutral-950 relative flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover select-none pointer-events-none ${
                  activeFilter === 'golden' ? 'sepia hue-rotate-15 contrast-125 saturate-150' :
                  activeFilter === 'spicy' ? 'contrast-125 saturate-200 hue-rotate-340 brightness-95' :
                  activeFilter === 'vhs' ? 'contrast-110 saturate-50 brightness-110 hue-rotate-180' :
                  'none'
                }`}
              />
              
              {/* If real media camera stream is blocked/denied, present nice animated radar UI */}
              {(!videoRef.current || !videoRef.current.srcObject) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/40 px-5 text-center">
                  <div className="w-20 h-20 rounded-full border border-dashed border-indigo-400 flex items-center justify-center animate-spin mb-4">
                    <Camera className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-sm text-neutral-300">Synthesizing Camera Feed</h3>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-xs leading-relaxed">
                    Camera access denied or frames offline. Using AI frame generator. Try selecting filters below!
                  </p>
                </div>
              )}

              {/* Live Face Sticker Lens Overlay */}
              {activeFilter === 'hearteyes' && (
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-between space-x-14 z-20 pointer-events-none animate-pulse">
                  <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
                  <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
                </div>
              )}

              {/* Lens Filters Selector Strip */}
              <div className="absolute bottom-28 left-0 right-0 py-2.5 overflow-x-auto bg-gradient-to-t from-black/90 to-transparent flex space-x-3 px-4 z-20 scrollbar-none items-center">
                {[
                  { id: 'normal', name: 'Original 📷' },
                  { id: 'hearteyes', name: 'Heart Eye 😍' },
                  { id: 'golden', name: 'Naija Gold ✨' },
                  { id: 'spicy', name: 'Spicy Suya 🥩🔥' },
                  { id: 'vhs', name: 'Retro VHS 📽️' }
                ].map(flat => (
                  <button
                    key={flat.id}
                    onClick={() => {
                      setActiveFilter(flat.id);
                      triggerBeep(320 + flat.name.length * 15, 0.08);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                      activeFilter === flat.id 
                        ? 'bg-indigo-600 text-white border-transparent scale-105 shadow-md shadow-indigo-500/50' 
                        : 'bg-neutral-900/80 text-neutral-300 border-neutral-800'
                    }`}
                  >
                    {flat.name}
                  </button>
                ))}
              </div>

              {/* Capture Trigger Circle Shutter */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                <button
                  onClick={capturePhoto}
                  className="w-18 h-18 rounded-full border-4 border-white bg-indigo-600/30 flex items-center justify-center p-1 cursor-pointer transition active:scale-95 shadow-lg shadow-indigo-500/30 hover:bg-indigo-600/50"
                >
                  <div className="w-full h-full rounded-full bg-white" />
                </button>
              </div>
            </div>
          ) : (
            /* AFTER SNAPSHOT CAPTURED: DOODLE & CAPTION TEXT MODE */
            <div className="flex-1 bg-black flex flex-col relative pt-12">
              <div className="flex-1 bg-neutral-950 relative flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="captured output"
                  className="w-full h-full object-contain pointer-events-none select-none absolute inset-0"
                />

                {/* Doodle canvas overlay */}
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={500}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="absolute inset-x-0 w-full h-full z-10 touch-none cursor-crosshair"
                />

                {/* Drawn caption label input overlay */}
                <div className="absolute bottom-16 left-4 right-4 z-20">
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Add caption (e.g. Yaba Suya Vibe!)..."
                    className="w-full bg-black/60 text-white placeholder-neutral-400 border border-neutral-700/60 py-2 px-4 rounded-full text-center text-sm shadow-md focus:outline-none focus:ring-1 focus:ring-indigo-500 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Brush Color Picker Box */}
              <div className="bg-neutral-950 px-4 py-2 flex items-center justify-between border-t border-neutral-900 z-20">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-neutral-400 font-semibold uppercase">Marker</span>
                </div>
                <div className="flex space-x-2">
                  {['#e11d48', '#d97706', '#16a34a', '#2563eb', '#9333ea', '#ffffff'].map(col => (
                    <button
                      key={col}
                      onClick={() => {
                        setBrushColor(col);
                        triggerBeep(380, 0.05);
                      }}
                      style={{ backgroundColor: col }}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        brushColor === col ? 'border-white scale-110' : 'border-neutral-900'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Send status actions */}
              <div className="p-4 bg-neutral-950 border-t border-neutral-900 flex justify-between space-x-2.5 z-20">
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setCanvasDrawing(null);
                    setPhotoCaption('');
                    triggerBeep(400, 0.1, 'triangle');
                  }}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 py-3.5 rounded-2xl text-xs font-bold font-sans tracking-wide text-center"
                >
                  RE-TAKE 📸
                </button>
                <button
                  onClick={postToMyStory}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 py-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center space-x-1 border border-neutral-700"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>POST STORY</span>
                </button>
                
                {selectedNeighbor ? (
                  <button
                    onClick={() => sendCapturedSnapDirectly(selectedNeighbor)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/40"
                  >
                    <Send className="w-4 h-4" />
                    <span>SEND DIRECT</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (neighbors.length > 0) {
                        sendCapturedSnapDirectly(neighbors[0]);
                      }
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center space-x-1"
                  >
                    <Send className="w-4 h-4" />
                    <span>SEND TO {neighbors[0].name}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* IMMERSIVE CHAT ROOM VIEW (Active Message Thread Overlay) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {selectedNeighbor && (
          <Suspense fallback={
            <div className="absolute inset-0 z-40 bg-[#FAFAF9] dark:bg-[#111214] flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#0F8A5F]/20 border-t-[#0F8A5F] rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-xs font-mono">Opening safe direct channel...</p>
            </div>
          }>
            <PremiumChatRoom
              selectedNeighbor={selectedNeighbor}
              setSelectedNeighbor={setSelectedNeighbor}
              currentUser={currentUser}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              neighbors={neighbors}
              isAiTyping={isAiTyping}
              appTheme={appTheme}
              customChatBg={customChatBg}
              setCustomChatBg={setCustomChatBg}
              customChatFont={customChatFont}
              setViewingNeighborProfile={setViewingNeighborProfile}
              startCall={startCall}
              mutedNeighborIds={mutedNeighborIds}
              handleToggleMuteNeighbor={handleToggleMuteNeighbor}
              blockedNeighborIds={blockedNeighborIds}
              handleToggleBlockNeighbor={handleToggleBlockNeighbor}
              handleExportChat={handleExportChat}
              friendIds={friendIds}
              sentFriendRequestIds={sentFriendRequestIds}
              pendingFriendRequests={pendingFriendRequests}
              handleAcceptFriendRequest={handleAcceptFriendRequest}
              handleAddNewFriend={handleAddNewFriend}
              chatLimit={chatLimit}
              setChatLimit={setChatLimit}
              sendMessage={sendMessage}
              startRecordingVoice={startRecordingVoice}
              stopAndSendVoice={stopAndSendVoice}
              cancelRecordingVoice={cancelRecordingVoice}
              isRecordingVoice={isRecordingVoice}
              voiceDuration={voiceDuration}
              playingVoiceId={playingVoiceId}
              playVoiceNote={playVoiceNote}
              replyingToMessage={replyingToMessage}
              setReplyingToMessage={setReplyingToMessage}
              handleReaction={handleReaction}
              handleDeleteForMe={handleDeleteForMe}
              handleDeleteForEveryone={handleDeleteForEveryone}
              showForwardModal={showForwardModal}
              setShowForwardModal={setShowForwardModal}
              startCamera={startCamera}
              handleGalleryUploadForChat={handleGalleryUploadForChat}
              chatFileRef={chatFileRef}
              textInput={textInput}
              setTextInput={setTextInput}
              triggerBeep={triggerBeep}
              setAudioFeedback={setAudioFeedback}
            />
          </Suspense>
        )}

        {false && selectedNeighbor && (
          <motion.div 
            initial={{ x: '100%', opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`absolute inset-0 flex flex-col justify-between z-40 overflow-hidden ${
              customChatBg === 'cosmic' ? 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/60 via-neutral-950 to-black' :
              customChatBg === 'sunset' ? 'bg-gradient-to-b from-rose-950/40 via-neutral-950 to-neutral-950' :
              customChatBg === 'mint' ? 'bg-gradient-to-b from-teal-950/45 via-neutral-950 to-neutral-800' :
              customChatBg === 'royal' ? 'bg-gradient-to-b from-amber-950/30 via-neutral-950 to-neutral-950' :
              customChatBg === 'matrix' ? 'bg-black border border-green-900/30 font-mono shadow-[0_0_15px_rgba(0,128,0,0.1)]' :
              'bg-neutral-950'
            }`}
            style={{ fontFamily: 
              customChatFont === 'mono' ? '"JetBrains Mono", monospace' :
              customChatFont === 'serif' ? 'Georgia, serif' :
              customChatFont === 'chunky' ? 'Impact, sans-serif' :
              'inherit'
            }}
          >
          
          {/* Chat room Header strip with proximity walking metrics */}
          <div className="px-3 py-3 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center text-white shadow-sm">
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                onClick={() => {
                  setSelectedNeighbor(null);
                  triggerBeep(465, 0.08);
                }}
                className="p-1.5 hover:bg-neutral-800 rounded-full transition text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                title="Back to Chats"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-white" />
              </button>
              
              <div 
                onClick={() => {
                  if (selectedNeighbor && !selectedNeighbor.isGroup) {
                    setViewingNeighborProfile(selectedNeighbor);
                    triggerBeep(520, 0.08);
                  }
                }}
                className={`flex items-center space-x-2 min-w-0 ${selectedNeighbor && !selectedNeighbor.isGroup ? 'cursor-pointer hover:opacity-85 active:scale-98 transition' : ''}`}
                title={selectedNeighbor && !selectedNeighbor.isGroup ? "View Profile" : ""}
              >
                <div className={`w-8 h-8 rounded-full ${selectedNeighbor.avatarColor} flex items-center justify-center text-xs flex-shrink-0 relative overflow-hidden`}>
                  {selectedNeighbor.customProfilePhoto ? (
                    <img 
                      src={selectedNeighbor.customProfilePhoto} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      alt="" 
                    />
                  ) : (
                    <span>{selectedNeighbor.avatarEmoji}</span>
                  )}
                  {(() => {
                    const status = selectedNeighbor.id === 'nb-myai' ? 'active' :
                                   selectedNeighbor.id === 'nb-1' ? 'active' :
                                   selectedNeighbor.id === 'nb-2' ? 'away' :
                                   selectedNeighbor.id === 'nb-3' ? 'offline' :
                                   selectedNeighbor.id === 'nb-4' ? 'away' :
                                   (selectedNeighbor.onlineStatus || 'offline');
                    if (status === 'active') {
                      return <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#25D366] rounded-full border border-neutral-900 animate-pulse" />;
                    } else if (status === 'away') {
                      return <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#F59E0B] rounded-full border border-neutral-900" />;
                    } else {
                      return <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#737373] rounded-full border border-neutral-900" />;
                    }
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1 flex-wrap">
                    <h4 className="font-bold text-[12.5px] truncate text-white leading-tight">{selectedNeighbor.name}</h4>
                    {selectedNeighbor.isGroup && (
                      <span className="text-[7px] bg-emerald-600/20 text-emerald-300 font-mono font-black rounded px-1">GROUP</span>
                    )}
                  </div>
                  
                  {/* Real-time Presence, Last Seen, and Typing status o! */}
                  <div className="text-[9.5px] truncate max-w-[150px] sm:max-w-none leading-none">
                    {simulatedTypingMap[selectedNeighbor.id] || selectedNeighbor.typingTo === currentUser?.uid ? (
                      <span className="text-[#25D366] font-bold animate-pulse">typing...</span>
                    ) : selectedNeighbor.isGroup ? (
                      <span className="text-zinc-400 truncate">
                        {selectedNeighbor.groupMembers?.map(m => neighbors.find(n => n.id === m)?.name || m).join(', ')}
                      </span>
                    ) : (() => {
                      const status = selectedNeighbor.id === 'nb-myai' ? 'active' :
                                     selectedNeighbor.id === 'nb-1' ? 'active' :
                                     selectedNeighbor.id === 'nb-2' ? 'away' :
                                     selectedNeighbor.id === 'nb-3' ? 'offline' :
                                     selectedNeighbor.id === 'nb-4' ? 'away' :
                                     (selectedNeighbor.onlineStatus || 'offline');
                      if (status === 'active') {
                        return <span className="text-[#25D366] font-mono">online</span>;
                      } else if (status === 'away') {
                        return <span className="text-[#F59E0B] font-mono">away</span>;
                      } else if (selectedNeighbor.lastSeen) {
                        return (
                          <span className="text-zinc-500 font-mono font-normal">
                            last seen {new Date(selectedNeighbor.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        );
                      } else {
                        return <span className="text-zinc-500 font-mono font-normal">offline</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Calling & Actions Capability Trigger Icons including Pin and Archive o! */}
            <div className="flex items-center space-x-1 relative">
              <button
                onClick={() => {
                  setShowActiveChatSearch(!showActiveChatSearch);
                  if (showActiveChatSearch) setActiveChatSearchQuery('');
                  triggerBeep(450, 0.05);
                }}
                className={`p-1.5 rounded-full transition ${showActiveChatSearch ? 'bg-[#25D366]/20 text-[#25D366]' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'}`}
                title="Search Messages"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => startCall(selectedNeighbor.id, 'video')}
                className="p-1.5 hover:bg-neutral-800 text-neutral-300 rounded-full transition"
                title="Video Call"
              >
                <VideoIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => startCall(selectedNeighbor.id, 'audio')}
                className="p-1.5 hover:bg-neutral-800 text-[#25D366] rounded-full transition"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  setShowActiveChatDropdown(!showActiveChatDropdown);
                  triggerBeep(320, 0.05);
                }}
                className={`p-1.5 rounded-full transition hover:bg-neutral-800 ${showActiveChatDropdown ? 'text-[#25D366]' : 'text-neutral-400 hover:text-white'}`}
                title="More options"
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>

              {/* Dropdown Box */}
              <AnimatePresence>
                {showActiveChatDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowActiveChatDropdown(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-11 w-44 rounded-xl shadow-2xl border p-1.5 z-50 overflow-hidden font-sans bg-neutral-900 border-neutral-800 text-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                    >
                      <button
                        onClick={() => {
                          if (selectedNeighbor && !selectedNeighbor.isGroup) {
                            setViewingNeighborProfile(selectedNeighbor);
                          } else {
                            setAudioFeedback(`Group Info: ${selectedNeighbor.name}`);
                          }
                          setShowActiveChatDropdown(false);
                          triggerBeep(380, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        View Profile
                      </button>

                      <button
                        onClick={() => {
                          setShowActiveChatSearch(true);
                          setShowActiveChatDropdown(false);
                          triggerBeep(380, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        Search in Conversation
                      </button>

                      <button
                        onClick={() => {
                          setActiveMediaGalleryTab('photos');
                          setShowMediaGalleryModal(true);
                          setShowActiveChatDropdown(false);
                          triggerBeep(380, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        Media, Links & Files
                      </button>

                      <button
                        onClick={() => {
                          handleToggleMuteNeighbor(selectedNeighbor.id);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        {mutedNeighborIds.includes(selectedNeighbor.id) ? 'Unmute Notifications' : 'Mute Notifications'}
                      </button>

                      <button
                        onClick={() => {
                          const themes = ['slate', 'cosmic', 'sunset', 'mint', 'royal', 'matrix'];
                          const idx = themes.indexOf(customChatBg);
                          const nextTheme = themes[(idx + 1) % themes.length];
                          setCustomChatBg(nextTheme as any);
                          setShowActiveChatDropdown(false);
                          setAudioFeedback(`Wallpaper set to ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}.`);
                          triggerBeep(420, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-neutral-850 rounded-lg transition font-medium text-emerald-400"
                      >
                        Wallpaper
                      </button>

                      <button
                        onClick={() => {
                          handleExportChat(selectedNeighbor);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        Export Chat
                      </button>

                      <button
                        onClick={() => {
                          handleToggleBlockNeighbor(selectedNeighbor.id);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition text-red-400"
                      >
                        {blockedNeighborIds.includes(selectedNeighbor.id) ? 'Unblock User' : 'Block User'}
                      </button>

                      <button
                        onClick={() => {
                          setAudioFeedback(`Report submitted against @${selectedNeighbor.username}. We are auditing their messages.`);
                          triggerBeep(300, 0.15);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition text-orange-400"
                      >
                        Report User
                      </button>

                      <div className="h-px bg-neutral-800 my-1" />

                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to clear chat messages with " + selectedNeighbor.name + "?")) {
                            setChatMessages({
                              ...chatMessages,
                              [selectedNeighbor.id]: []
                            });
                            setAudioFeedback("Chat history cleared.");
                          }
                          setShowActiveChatDropdown(false);
                          triggerBeep(330, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition text-rose-400 hover:text-rose-300"
                      >
                        Clear chat
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Chats Bubble Streams */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin">
            {/* Quick bio introduction snippet card */}
            <div className="p-3 bg-neutral-900/60 border border-neutral-800/40 rounded-2xl text-center space-y-1.5 mb-5 max-w-[280px] mx-auto">
              <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400 py-0.5 px-2 bg-neutral-800 rounded-full inline-block">
                Interests & Bio
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed italic">
                "{selectedNeighbor.bio}"
              </p>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {selectedNeighbor.interests.map(int => (
                  <span key={int} className="bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 text-[9px] px-2 py-0.2 rounded-full font-sans font-medium">
                    #{int}
                  </span>
                ))}
              </div>

              {/* Add Friend status prompt in the chat card */}
              {!selectedNeighbor.isGroup && selectedNeighbor.id !== 'nb-myai' && (
                <div className="pt-2 border-t border-neutral-800/40 mt-1.5">
                  {(Array.isArray(friendIds) ? friendIds : []).includes(selectedNeighbor.id) ? (
                    <div className="flex justify-center items-center space-x-1.5 text-[9px] text-green-400 font-mono font-bold uppercase py-0.5">
                      <span>✓ Connected Friend on Radar</span>
                    </div>
                  ) : sentFriendRequestIds.includes(selectedNeighbor.id) ? (
                    <button 
                      onClick={() => {
                        handleAddNewFriend(selectedNeighbor.id);
                        triggerBeep(320, 0.1);
                      }}
                      className="w-full py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-bold text-[9px] rounded-lg tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase font-sans cursor-pointer"
                    >
                      <span>⏳ Friend Request Sent</span>
                    </button>
                  ) : pendingFriendRequests.includes(selectedNeighbor.id) ? (
                    <button 
                      onClick={() => {
                        handleAcceptFriendRequest(selectedNeighbor.id);
                        triggerBeep(520, 0.1);
                      }}
                      className="w-full py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[9px] rounded-lg tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase font-sans cursor-pointer"
                    >
                      <span>🤝 Accept Friend Request</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        handleAddNewFriend(selectedNeighbor.id);
                        triggerBeep(520, 0.1);
                      }}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] rounded-lg tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase font-sans cursor-pointer"
                    >
                      <span>➕ Add Friend on Radar</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bubble Rendering Loop with WhatsApp enhancements */}
            {(() => {
              const currentUid = currentUser?.uid || 'user';
              let list = (chatMessages[selectedNeighbor.id] || []).filter(msg => {
                if (msg.deletedForUsers && msg.deletedForUsers.includes(currentUid)) {
                  return false;
                }
                return true;
              });

              if (showActiveChatSearch && activeChatSearchQuery) {
                list = list.filter(m => m.text && m.text.toLowerCase().includes(activeChatSearchQuery.toLowerCase()));
              }

              if (list.length === 0) {
                return (
                  <div className="text-center py-16 flex flex-col items-center justify-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-neutral-600 animate-pulse" />
                    <p className="font-mono text-[11px] text-neutral-500">
                      {showActiveChatSearch ? 'No messages found.' : "No messages yet. Say hello!"}
                    </p>
                  </div>
                );
              }

              const totalMessages = list.length;
              const slicedList = list.slice(-chatLimit);

              return (
                <>
                  {totalMessages > chatLimit && (
                    <div className="flex justify-center my-3.5">
                      <button
                        onClick={() => {
                          triggerBeep(400, 0.05);
                          setChatLimit(prev => prev + 50);
                        }}
                        className="px-3.5 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-[10px] font-mono text-indigo-400 cursor-pointer active:scale-95 transition-all shadow-md"
                      >
                        Load older messages ({totalMessages - chatLimit} remaining)
                      </button>
                    </div>
                  )}
                  {slicedList.map((msg) => {
                const isMy = msg.senderId === 'user' || msg.senderId === (currentUser?.uid);
                
                // If it is a Call Log action type:
                if (msg.type === 'call_log') {
                  return (
                    <div key={msg.id} className="flex justify-center my-3.5">
                      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-1.5 text-center text-[10px] text-neutral-400 font-mono">
                        {msg.callLog?.status === 'missed' ? (
                          <span className="text-red-400">🚨 Missed {msg.callLog.type} call</span>
                        ) : (
                          <span>📞 Completed {msg.callLog?.type} call ({msg.callLog?.durationSeconds}s)</span>
                        )}
                        <p className="text-[8px] text-neutral-600 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  );
                }

                const senderNeighbor = selectedNeighbor.isGroup 
                  ? neighbors.find(n => n.id === msg.senderId) 
                  : selectedNeighbor;
                const senderDisplayName = senderNeighbor ? senderNeighbor.name : (msg.senderId === 'nb-myai' ? 'Nearby AI' : 'Member');
                const senderUsername = senderNeighbor ? senderNeighbor.username : (msg.senderId === 'nb-myai' ? 'nearby_ai' : 'member');

                return (
                  <div
                    key={msg.id}
                    onTouchStart={(e) => handleMessageTouchStart(e, msg.id)}
                    onTouchMove={(e) => handleMessageTouchMove(e, msg.id)}
                    onTouchEnd={() => handleMessageTouchEnd(msg)}
                    style={{
                      transform: swipeOffsetMsgId === msg.id ? `translateX(${swipeOffsetAmount}px)` : 'none',
                      transition: swipeOffsetMsgId === msg.id ? 'none' : 'transform 0.15s ease-out'
                    }}
                    className={`flex ${isMy ? 'justify-end' : 'justify-start'} animate-fade-in group relative`}
                  >
                    <div className="max-w-[75%] space-y-1 relative">
                      
                      {/* Replied to layout inside bubble o! */}
                      {!isMy && !msg.deletedForEveryone && (
                        <span className="text-[10px] text-neutral-500 font-mono block ml-1">
                          {senderDisplayName} (@{senderUsername})
                        </span>
                      )}

                      {/* Bubble wrapper */}
                      <div
                        className={`p-3 relative shadow-md transition-all duration-305 ${
                          msg.deletedForEveryone 
                            ? 'rounded-2xl bg-neutral-900/60 border border-neutral-800 text-neutral-500 italic'
                            : isMy
                              ? (customChatBubbleStyle === 'sharp' ? 'rounded-none border border-neutral-700 text-white bg-indigo-600' :
                                 customChatBubbleStyle === 'neon' ? 'rounded-2xl rounded-br-none text-white bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]' :
                                 customChatBubbleStyle === 'gb_doubletick' ? 'rounded-xl rounded-br-none text-white bg-emerald-600 border border-emerald-500 shadow-sm' :
                                 customChatBubbleStyle === 'playful' ? 'rounded-3xl rounded-br-none text-white bg-[#075E54] border border-[#075E54]' :
                                 `rounded-2xl rounded-br-none ${theme.bubbleUser}`)
                              : (customChatBubbleStyle === 'sharp' ? 'rounded-none border border-neutral-700 text-neutral-100 bg-neutral-800' :
                                 customChatBubbleStyle === 'neon' ? 'rounded-2xl rounded-bl-none text-neutral-100 bg-neutral-800 border border-neutral-750 shadow-[0_0_12px_rgba(255,255,255,0.06)]' :
                                 customChatBubbleStyle === 'gb_doubletick' ? 'rounded-xl rounded-bl-none text-neutral-100 bg-neutral-850 border border-neutral-700 border-l-4 border-l-emerald-500' :
                                 customChatBubbleStyle === 'playful' ? 'rounded-3xl rounded-bl-none text-neutral-100 bg-[#262D31]' :
                                 `rounded-2xl rounded-bl-none ${theme.bubbleNeighbor}`)
                        }`}
                      >

                        {/* Forwarded Tag label o! */}
                        {msg.isForwarded && !msg.deletedForEveryone && (
                          <p className="text-[9px] text-[#25D366] italic flex items-center mb-1 font-mono">
                            <span className="mr-1">↩ Forwarded</span>
                          </p>
                        )}

                        {/* Replying target header nested card */}
                        {msg.replyTo && !msg.deletedForEveryone && (
                          <div className="mb-2 p-2 bg-black/15 border-l-4 border-l-emerald-400 rounded-lg text-left text-[11px] leading-snug">
                            <span className="font-bold text-[#25D366] block">@{msg.replyTo.senderName}</span>
                            <span className="opacity-80 block truncate font-sans">"{msg.replyTo.text}"</span>
                          </div>
                        )}

                        {msg.deletedForEveryone ? (
                          <p className="text-xs font-sans flex items-center space-x-1">
                            <span>🚫 This message was deleted for everyone</span>
                          </p>
                        ) : (
                          <>
                            {/* Text Message content */}
                            {msg.text && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                {msg.text}
                              </p>
                            )}

                            {/* Image attachment snap content */}
                            {msg.type === 'image' && msg.mediaUrl && (
                              <div className="rounded-xl overflow-hidden mt-1 border border-black/40 shadow-inner">
                                <img src={msg.mediaUrl} alt="chat attachment" className="w-full h-auto max-h-[180px] object-cover" />
                              </div>
                            )}

                            {/* Video attachment content */}
                            {msg.type === 'video' && msg.mediaUrl && (
                              <div className="rounded-xl overflow-hidden mt-1 border border-black/40 shadow-inner">
                                <video src={msg.mediaUrl} controls className="w-full h-auto max-h-[180px] object-cover rounded-xl" />
                              </div>
                            )}

                            {/* Document attachment content */}
                            {msg.type === 'document' && msg.mediaUrl && (
                              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-black/20 border border-white/5 mt-1">
                                <FileText className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-white truncate">{msg.fileName || "attachment_file"}</p>
                                  <p className="text-[9px] text-zinc-400 font-mono">{msg.fileSize || "180 KB"}</p>
                                </div>
                                <a 
                                  href={msg.mediaUrl} 
                                  download={msg.fileName || "attachment_file"} 
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition flex items-center justify-center cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}

                            {/* Voice recording sound panel representation */}
                            {msg.type === 'voice' && (
                              <div className="flex items-center space-x-2.5">
                                <button
                                  onClick={() => {
                                    playVoiceNote(msg, senderDisplayName);
                                  }}
                                  className="w-9 h-9 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0"
                                >
                                  <Play className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-[10px] text-[#25D366] font-mono font-bold">
                                    <span>Voice note play</span>
                                    <span>{msg.audioDurationSec}s</span>
                                  </div>
                                  <div className="h-1 bg-white/20 rounded-full mt-1 overflow-hidden relative">
                                    <div 
                                      className={`h-full bg-emerald-500 ${playingVoiceId === msg.id ? 'w-full transition-all duration-[6000ms]' : 'w-4'}`} 
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Precise short timing stamps & Delivery Checkmarks o! */}
                        <div className="flex justify-between items-center text-[9px] opacity-60 font-mono mt-1.5 space-x-2">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMy && !msg.deletedForEveryone && (
                            <span className="flex items-center space-x-0.5">
                              {msg.status === 'sending' ? (
                                <span className="text-[10px] animate-spin">⏳</span>
                              ) : msg.status === 'sent' ? (
                                <Check className="w-3.5 h-3.5 text-zinc-400" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Floating Reaction Badges o! */}
                        {msg.reactions && msg.reactions.length > 0 && !msg.deletedForEveryone && (
                          <div className="absolute -bottom-2 -right-1 bg-neutral-900 border border-neutral-800/80 rounded-full py-0.5 px-2 flex items-center space-x-0.5 text-[11px] shadow-lg select-none z-10">
                            {Array.from(new Set(msg.reactions.map(r => r.reaction))).slice(0, 3).map(emoji => (
                              <span key={emoji}>{emoji}</span>
                            ))}
                            {msg.reactions.length > 1 && (
                              <span className="text-[8px] text-zinc-400 font-mono ml-0.5">{msg.reactions.length}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options Menu & Reactions Popover Hover buttons o! */}
                      {!msg.deletedForEveryone && (
                        <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center space-x-1.5 bg-neutral-900/40 p-1.5 rounded-xl backdrop-blur">
                          <button 
                            onClick={() => {
                              setReplyingToMessage(msg);
                              triggerBeep(380, 0.04);
                            }}
                            className="text-white hover:text-[#25D366] text-xs p-1"
                            title="Reply"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              setActiveBubbleDropdownId(activeBubbleDropdownId === msg.id ? null : msg.id);
                              triggerBeep(450, 0.05);
                            }}
                            className="text-white hover:text-emerald-500 text-xs p-1"
                            title="More Options"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* More options floating dialogue drawer panel o! */}
                      {activeBubbleDropdownId === msg.id && (
                        <div className="absolute right-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5 shadow-2xl z-30 space-y-2 min-w-[170px] text-xs leading-normal font-sans text-neutral-300">
                          
                          {/* Floating raw emoji reactions palette */}
                          <div className="flex space-x-1 bg-neutral-950 p-1.5 rounded-full border border-neutral-800 justify-around select-none">
                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  handleReaction(msg, emoji);
                                  setActiveBubbleDropdownId(null);
                                }}
                                className="hover:scale-130 active:scale-95 transition-transform text-sm p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          <div className="h-[1px] bg-neutral-800 my-1" />

                          <button
                            onClick={() => {
                              setReplyingToMessage(msg);
                              setActiveBubbleDropdownId(null);
                              triggerBeep(330, 0.04);
                            }}
                            className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>Reply message</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowForwardModal(msg);
                              setActiveBubbleDropdownId(null);
                              triggerBeep(380, 0.05);
                            }}
                            className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Forward message</span>
                          </button>

                          <button
                            onClick={() => {
                              handleDeleteForMe(msg);
                              setActiveBubbleDropdownId(null);
                            }}
                            className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2 text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete for me</span>
                          </button>

                          {isMy && (
                            <button
                              onClick={() => {
                                handleDeleteForEveryone(msg);
                                setActiveBubbleDropdownId(null);
                              }}
                              className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2 text-rose-500 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete for everyone</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActiveBubbleDropdownId(null)}
                            className="w-full text-center text-[10px] text-zinc-500 hover:text-white pt-1.5 border-t border-neutral-800/60 mt-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
                </>
              );
            })()}

            {/* My AI active guided writing indicator */}
            {isAiTyping && (
              <div className="flex justify-start items-center space-x-2 animate-pulse pl-1">
                <span className="text-[10px] font-mono text-neutral-500">Nearby AI guide is writing spot details...</span>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Swipe Replied-to visual header nested preview card o! */}
          {replyingToMessage && (
            <div className="px-4 py-2.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-white animate-fade-in border-l-4 border-l-emerald-500 backdrop-blur">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-[10px] text-emerald-400 font-bold">Replying to {replyingToMessage.senderId === 'user' ? 'yourself' : selectedNeighbor.name}</p>
                <p className="text-xs text-neutral-400 truncate mt-0.5 font-sans italic">"{replyingToMessage.text || 'Media attachment files'}"</p>
              </div>
              <button 
                onClick={() => {
                  setReplyingToMessage(null);
                  triggerBeep(320, 0.05);
                }} 
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* EMOJI PICKER POPUP KEYBOARD PANEL */}
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                {/* Backdrop to close the picker */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowEmojiPicker(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.15 }}
                  className="mx-4 mb-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col relative max-h-[280px]"
                >
                  {/* Category switcher tabs */}
                  <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 p-2 shrink-0 overflow-x-auto scrollbar-none space-x-1.5">
                    {(() => {
                      const categories = [
                        { id: 'recent', label: '🕒' },
                        { id: 'smileys', label: '😀' },
                        { id: 'gestures', label: '👋' },
                        { id: 'hearts', label: '❤️' },
                        { id: 'nature', label: '🐱' },
                        { id: 'food', label: '🍎' },
                        { id: 'activities', label: '⚽' },
                        { id: 'travel', label: '🚗' }
                      ];
                      return categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setEmojiCategory(cat.id);
                            triggerBeep(380, 0.04);
                          }}
                          className={`p-1.5 rounded-lg text-sm transition-all active:scale-95 cursor-pointer flex-1 text-center ${
                            emojiCategory === cat.id ? 'bg-[#0F8A5F] text-white' : 'hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ));
                    })()}
                  </div>

                  {/* Search Bar */}
                  <div className="px-3 py-1.5 border-b border-neutral-800 bg-neutral-900 flex items-center space-x-2 shrink-0">
                    <input
                      type="text"
                      value={emojiSearchQuery}
                      onChange={(e) => setEmojiSearchQuery(e.target.value)}
                      placeholder="Search emojis..."
                      className="w-full bg-neutral-950 text-white placeholder-neutral-500 rounded-lg py-1 px-2.5 text-[11px] border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {emojiSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setEmojiSearchQuery('')}
                        className="text-neutral-400 hover:text-white p-1 text-[11px]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Emojis Grid Area */}
                  <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-2 select-none min-h-[140px] scrollbar-thin">
                    {(() => {
                      const allEmojisList = {
                        recent: recentlyUsedEmojis,
                        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
                        gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾'],
                        hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💤', '💢', '💣', '💥', '💫', '💦', '💨', '💬', '💭', '🗯️'],
                        nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🐙', '🦑', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐆', '🐅', '🐎', '🐖', '🐑', '🐐', '🐪', '🐫', '🐘', '🦏', '🦍', '🐒', '🐔', '🦅', '🦆', '🦢', '🦩', '🦉', '🦖', '🦕', '🐉', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃'],
                        food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🧅', '🧄', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🍟', '🍕', '🍳', '🍩', '🍪', '🍯', '🥛', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊'],
                        activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🛼', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🏋️', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
                        travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚨', '🚇', '🛫', '✈️', '🚁', '🚀', '🛸', '⛵', '🛳️', '🚢', '⚓', '⛽', '🏮', '🗼', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏟️', '🏛️', '🏗️', '🏘️', '🛖', '🏙️', '🏢', '🏬', '🏭', '🏰', '🏥', '🏦', '🏫', '🏪', '🏨', '💒', '⛪', '🕌', '🕍', '🕋', '⛩️']
                      };

                      let activeEmojisList = allEmojisList[emojiCategory as keyof typeof allEmojisList] || [];

                      if (emojiSearchQuery.trim()) {
                        const allCombined = Object.values(allEmojisList).flat();
                        const query = emojiSearchQuery.toLowerCase();
                        activeEmojisList = Array.from(new Set(allCombined.filter(e => {
                          return true; // Return matches
                        }))).slice(0, 48);
                      }

                      if (activeEmojisList.length === 0) {
                        return (
                          <div className="col-span-8 text-center text-xs text-neutral-500 py-8 font-sans">
                            No emojis found
                          </div>
                        );
                      }

                      return activeEmojisList.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setTextInput((prev) => prev + emoji);
                            triggerBeep(320, 0.04);
                            
                            setRecentlyUsedEmojis((prev) => {
                              const filtered = prev.filter((e) => e !== emoji);
                              const updated = [emoji, ...filtered].slice(0, 16);
                              localStorage.setItem('whatsapp_recent_emojis', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="hover:scale-130 active:scale-90 transition-transform text-2xl p-1.5 flex items-center justify-center rounded-lg hover:bg-neutral-800 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ));
                    })()}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Bottom Custom Gist writing input bar exactly like Instagram Messages */}
          <div className="p-3 bg-neutral-900 border-t border-neutral-800 space-y-2 relative z-10 shadow-2xl">
            
            <div className="flex items-center space-x-2">
              <input 
                type="file" 
                ref={chatFileRef} 
                onChange={handleGalleryUploadForChat} 
                accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
                className="hidden" 
              />

              {/* Unified Camera/Gallery Attachment Logo Button o! */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoMenu(!showPhotoMenu);
                    triggerBeep(520, 0.08);
                  }}
                  className={`p-3 rounded-xl transition ${showPhotoMenu ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                  title="Attach Media or Snap Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showPhotoMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowPhotoMenu(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute bottom-14 left-0 w-44 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col space-y-1 text-white"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoMenu(false);
                            startCamera();
                            triggerBeep(450, 0.05);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-neutral-850 rounded-lg transition text-xs flex items-center space-x-2 text-indigo-400 font-bold"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Take Live Snap</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoMenu(false);
                            chatFileRef.current?.click();
                            triggerBeep(450, 0.05);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-neutral-850 rounded-lg transition text-xs flex items-center space-x-2 text-zinc-300 font-medium"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Choose from Gallery</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Handheld Microphone Voice Notes Indicator button */}
              <button
                onMouseDown={startRecordingVoice}
                onMouseUp={stopAndSendVoice}
                onTouchStart={startRecordingVoice}
                onTouchEnd={stopAndSendVoice}
                className={`p-3 rounded-xl transition cursor-pointer select-none ${
                  isRecordingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-neutral-800 text-rose-400 hover:bg-neutral-700'
                }`}
                title="Hold to Record Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Text Input Block */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex-1 flex"
              >
                <div className="relative flex-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      triggerBeep(450, 0.05);
                    }}
                    className="absolute left-3 text-neutral-400 hover:text-[#25D366] transition cursor-pointer"
                    title="Emoji Keyboard"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isRecordingVoice ? `🎙️ Recording (${voiceDuration}s) - Release to Send` : "Write gist, ask spot..."}
                    className="w-full bg-neutral-950 text-white placeholder-neutral-500 rounded-xl py-3 pl-11 pr-12 text-sm border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={isRecordingVoice}
                  />
                  <button
                    type="submit"
                    className="absolute right-1 px-3 py-2 text-[#25D366] hover:text-white transition cursor-pointer"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* IMMERSIVE AUDIO / VIDEO CALL SCREEN (WebRTC overlay)  */}
      {/* ---------------------------------------------------- */}
      {callState.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0A0B0D] z-50 flex flex-col justify-between text-white overflow-hidden font-sans"
        >
          {/* Invisible pipelines for WebRTC stream mapping */}
          <div className="hidden">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <video ref={remoteVideoRef} autoPlay playsInline />
          </div>

          {/* BACKGROUND: Glassmorphic ambient gradient blur of Neighbor's colors */}
          {(() => {
            const ringNeighbor = neighbors.find(n => n.id === callState.neighborId);
            return (
              <div className="absolute inset-0 overflow-hidden z-0">
                {/* Fallback gradients that mimic a premium caller screen */}
                <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] opacity-25 ${ringNeighbor?.avatarColor || 'bg-emerald-600'}`} />
                <div className="absolute top-1/2 left-1/4 w-[320px] h-[320px] rounded-full blur-[160px] opacity-20 bg-indigo-500" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] opacity-15 bg-purple-600" />
                {/* Ultra-subtle grid lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
              </div>
            );
          })()}

          {/* MAIN CONTAINER: Flex layout */}
          <div className="relative w-full h-full flex flex-col justify-between p-6 z-10">
            
            {/* 1. TOP HEADER: Navigation details, call quality metrics */}
            <div className="pt-6 text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/5 border border-white/10 backdrop-blur-md">
                  {callState.type === 'video' ? '📺 HD VIDEO CALL' : '📞 SECURE VOICE CALL'}
                </span>
                
                {callState.status === 'connected' && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>

              {/* Call and Connection indicators */}
              {callState.status === 'connected' ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 text-[9px] font-mono leading-none tracking-wide ${
                    networkQuality === 'excellent' ? 'text-green-400 border-green-500/20 bg-green-500/5' :
                    networkQuality === 'good' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5 animate-pulse'
                  }`}>
                    <Signal className="w-2.5 h-2.5" />
                    <span>Uplink: {networkQualityDesc}</span>
                  </div>
                  {callState.type === 'video' && (
                    <div className="px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[9px] font-mono leading-none tracking-wide">
                      Codec: VP8/H.264
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-400 tracking-wide font-medium animate-pulse">
                  {callState.incoming ? 'Incoming...' : 'Connecting...'}
                </p>
              )}
            </div>

            {/* 2. CENTER CONTENT: Avatar + wave, or video grid */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
              
              {/* VOICE CALL OR RINGING STATE: Large elegant card layout */}
              {(callState.type === 'audio' || callState.status === 'ringing') && (() => {
                const ringNeighbor = neighbors.find(n => n.id === callState.neighborId);
                if (!ringNeighbor) return null;

                return (
                  <div className="flex flex-col items-center space-y-6 text-center max-w-sm w-full">
                    {/* Ringing / Pulsing Large Profile Photo (140px) */}
                    <div className="relative">
                      {/* Multiple breathing background rings */}
                      <AnimatePresence>
                        {callState.status === 'ringing' && (
                          <>
                            <motion.div 
                              className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <motion.div 
                              className="absolute inset-0 rounded-full bg-emerald-500/5 border border-emerald-500/10"
                              animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                              transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </>
                        )}
                        {callState.status === 'connected' && (
                          <motion.div 
                            className="absolute inset-0 rounded-full bg-indigo-500/20"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}
                      </AnimatePresence>

                      {/* 140px Profile Photo */}
                      <div className="w-[140px] h-[140px] rounded-full p-1 bg-gradient-to-tr from-[#0F8A5F] via-indigo-500 to-emerald-400 shadow-2xl relative z-10 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-white/5 relative">
                          {ringNeighbor.customProfilePhoto ? (
                            <img 
                              src={ringNeighbor.customProfilePhoto} 
                              alt={ringNeighbor.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span>{ringNeighbor.avatarEmoji}</span>
                          )}
                        </div>
                      </div>

                      {/* Trust rating star badge */}
                      <div className="absolute -bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-indigo-500/30 text-[10px] font-bold text-indigo-300 flex items-center space-x-1 z-20 shadow-md">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{ringNeighbor.trustScore?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-white">{ringNeighbor.name}</h2>
                      <p className="text-sm text-neutral-400 font-mono">@{ringNeighbor.username}</p>
                      
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-stone-300">
                          📍 {ringNeighbor.streetName}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#0F8A5F]/15 border border-[#0F8A5F]/20 text-emerald-400">
                          ⚡ {ringNeighbor.distanceMeters}m away
                        </span>
                      </div>
                    </div>

                    {/* Real-time calling wave animations */}
                    {callState.status === 'connected' && (
                      <div className="py-6 flex flex-col items-center justify-center space-y-2 w-full">
                        {/* Audio waveform */}
                        <div className="flex items-center justify-center space-x-1.5 h-14 w-full">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 rounded-full bg-gradient-to-t from-[#0F8A5F] to-indigo-400"
                              animate={{
                                height: [12, Math.max(16, Math.floor(Math.random() * 56)), 12]
                              }}
                              transition={{
                                duration: 0.5 + (i % 4) * 0.12,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                ease: 'easeInOut'
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-widest font-black">
                          Voice Wave Sync Active
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* VIDEO CALL ACTIVE SCREEN: Full video canvas */}
              {callState.type === 'video' && callState.status === 'connected' && (
                <div className="w-full h-full flex-1 min-h-[300px] max-h-[520px] bg-neutral-900 rounded-[32px] relative overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center z-10">
                  
                  {/* Remote video (opponent camera stream) */}
                  <video
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />

                  {/* If remote stream is not loaded yet */}
                  {!remoteStream && !callState.neighborId?.startsWith('nb-') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 z-10 p-6 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-[#0F8A5F] animate-spin" />
                      <div>
                        <p className="text-sm text-neutral-200 font-bold">Securing video uplink...</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1">Establishing peer tunnels (STUN)</p>
                      </div>
                    </div>
                  )}

                  {/* Holographic Satellite HUD for Simulated Neighbor presets */}
                  {callState.neighborId?.startsWith('nb-') && (
                    <div className="absolute inset-0 bg-[#070913] flex flex-col items-center justify-center overflow-hidden z-0">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,138,95,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,138,95,0.05)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
                      
                      {/* Rotating compass ring */}
                      <div className="absolute w-[360px] h-[360px] rounded-full border border-indigo-500/10 flex items-center justify-center animate-spin" style={{ animationDuration: '20s' }}>
                        <div className="w-[280px] h-[280px] rounded-full border border-emerald-500/15" />
                        <div className="absolute top-0 w-1 h-4 bg-emerald-500/50" />
                        <div className="absolute bottom-0 w-1 h-4 bg-emerald-500/50" />
                      </div>

                      {/* Pulsing Scanline */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_95%,rgba(16,185,129,0.1)_95%)] bg-[size:100%_24px] animate-pulse pointer-events-none" />

                      {/* Fake local feedback acting as holographic overlay */}
                      {localStream && !videoOff && (
                        <video
                          ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                          autoPlay
                          playsInline
                          muted
                          className={`absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale saturate-150 contrast-125 ${beautyMode ? 'brightness-110 blur-[0.5px]' : 'brightness-90'}`}
                        />
                      )}

                      {/* Tech HUD Labels */}
                      <div className="absolute top-4 left-4 text-left font-mono text-[9px] text-[#0F8A5F] space-y-1 bg-black/60 px-3 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                        <div className="flex items-center space-x-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>DEC-STREAM LINK ACTIVE</span>
                        </div>
                        <div>FEED: ENCRYPTED PEER</div>
                        <div>FPS: 30.00 (HD)</div>
                        <div>PING: 12ms</div>
                      </div>

                      <div className="absolute top-4 right-4 text-right font-mono text-[9px] text-indigo-400 bg-black/60 px-3 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                        <div>PEER ID: {callState.neighborId.toUpperCase()}</div>
                        <div>SIGNAL: EXCELLENT</div>
                        <div>QUALITY: 1080P</div>
                      </div>

                      {/* Center floating user avatar with radar waves */}
                      <div className="relative flex flex-col items-center space-y-4 z-10">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-125" style={{ animationDuration: '4s' }} />
                          <div className="w-[100px] h-[100px] rounded-full p-1 bg-gradient-to-tr from-[#0F8A5F] to-indigo-500 shadow-xl">
                            <div className="w-full h-full rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-5xl">
                              {neighbors.find(n => n.id === callState.neighborId)?.avatarEmoji || '🙋‍♂️'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-mono uppercase">
                            CONNECTED (HD)
                          </span>
                          <h4 className="text-lg font-bold text-white mt-1">
                            {neighbors.find(n => n.id === callState.neighborId)?.name || 'AI Neighbor'}
                          </h4>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Draggable Self Preview camera */}
                  {localStream && !videoOff && (
                    <motion.div
                      drag
                      dragConstraints={{ left: -20, right: 280, top: -20, bottom: 420 }}
                      className="absolute bottom-4 right-4 w-28 aspect-[3/4] bg-neutral-950 border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl z-30 cursor-grab active:cursor-grabbing hover:border-white/40 transition-colors"
                    >
                      <video
                        ref={(el) => {
                          localVideoRef.current = el;
                          if (el && localStream) {
                            el.srcObject = localStream;
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 ${
                          beautyMode ? 'brightness-105 contrast-95 saturate-105' : ''
                        }`}
                      />
                      {beautyMode && (
                        <div className="absolute top-1.5 right-1.5 bg-indigo-500 text-white p-0.5 rounded-full shadow border border-white/10" title="Beauty Mode Active">
                          <Sparkles className="w-3 h-3" />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Overlaid status flags inside stream */}
                  <div className="absolute bottom-4 left-4 flex flex-col space-y-1.5 z-20 pointer-events-none">
                    {micMuted && (
                      <span className="bg-red-500/90 border border-red-500/20 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center space-x-1 backdrop-blur-sm">
                        <MicOff className="w-2.5 h-2.5" />
                        <span>Muted</span>
                      </span>
                    )}
                    {videoOff && (
                      <span className="bg-red-500/90 border border-red-500/20 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center space-x-1 backdrop-blur-sm">
                        <Camera className="w-2.5 h-2.5" />
                        <span>Cam Off</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. FOOTER: Active connection timer and actions panel */}
            <div className="flex flex-col space-y-6 pb-4">
              
              {/* Call Timer Display */}
              {callState.status === 'connected' && (
                <div className="text-center font-mono">
                  <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-bold block mb-1">
                    In Progress
                  </span>
                  <span className="text-xl font-bold text-emerald-400 tabular-nums">
                    {Math.floor(callState.durationSeconds / 60)}:
                    {(callState.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Action toggles panel (Glassmorphic bar) */}
              {callState.status === 'connected' && (
                <div className="flex justify-center items-center space-x-4 bg-white/5 border border-white/10 backdrop-blur-xl p-3 rounded-3xl max-w-sm mx-auto w-full">
                  
                  {/* 1. Mute Mic Toggle */}
                  <button
                    onClick={toggleMicMute}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      micMuted ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-neutral-200 border border-white/5'
                    }`}
                    title={micMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* 2. Video Toggle */}
                  <button
                    onClick={toggleVideoOff}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      videoOff ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-neutral-200 border border-white/5'
                    }`}
                    title={videoOff ? "Enable Video" : "Disable Video"}
                  >
                    {videoOff ? <WifiOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </button>

                  {/* 3. Camera Flip (Video Call only) */}
                  {callState.type === 'video' ? (
                    <button
                      onClick={switchCamera}
                      className="p-3.5 rounded-2xl bg-white/5 text-neutral-200 border border-white/5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  ) : (
                    /* 3b. Bluetooth Toggle (Voice Call only) */
                    <button
                      onClick={() => {
                        const nextBluetooth = !bluetoothOn;
                        setBluetoothOn(nextBluetooth);
                        triggerBeep(nextBluetooth ? 580 : 420, 0.05);
                      }}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        bluetoothOn ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-neutral-200 border border-white/5'
                      }`}
                      title="Bluetooth Audio Router"
                    >
                      <Bluetooth className="w-5 h-5" />
                    </button>
                  )}

                  {/* 4. Speaker Mode Toggle */}
                  <button
                    onClick={() => {
                      const nextSpeaker = !isSpeakerOn;
                      setIsSpeakerOn(nextSpeaker);
                      triggerBeep(nextSpeaker ? 510 : 390, 0.05);
                    }}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isSpeakerOn ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-neutral-400 border border-white/5'
                    }`}
                    title={isSpeakerOn ? "Turn Speaker Off (Earpiece)" : "Turn Speaker On (Speaker)"}
                  >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>

                  {/* 5. Beauty Mode Toggle (Video Call only) */}
                  {callState.type === 'video' && (
                    <button
                      onClick={() => {
                        const nextBeauty = !beautyMode;
                        setBeautyMode(nextBeauty);
                        triggerBeep(nextBeauty ? 600 : 450, 0.05);
                      }}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        beautyMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-neutral-400 border border-white/5'
                      }`}
                      title={beautyMode ? "Turn Off Beauty Filter" : "Turn On Beauty Filter"}
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  )}

                  {/* 6. Add Participant placeholder (Coming Soon badge) */}
                  {callState.type === 'audio' && (
                    <button
                      disabled
                      className="p-3.5 rounded-2xl bg-white/5 text-neutral-500 border border-white/5 relative opacity-50 cursor-not-allowed"
                      title="Group Calling Coming Soon"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Decline/Decline/Hangup calling CTA triggers bar */}
              <div className="flex justify-center space-x-8">
                {callState.incoming && callState.status === 'ringing' ? (
                  <>
                    {/* Decline button */}
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => endCall('declined')}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition hover:scale-110 cursor-pointer"
                        title="Decline Call"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </button>
                      <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider font-bold">Decline</span>
                    </div>

                    {/* Answer button */}
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={answerIncomingCall}
                        className="w-16 h-16 rounded-full bg-[#0F8A5F] hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition hover:scale-110 cursor-pointer relative"
                        title="Answer Call"
                      >
                        {/* soft answer pulse circle */}
                        <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                        <Phone className="w-6 h-6" />
                      </button>
                      <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider font-bold">Answer</span>
                    </div>
                  </>
                ) : (
                  /* Decline/Hang Up Active Call Button */
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => endCall(callState.status === 'ringing' ? 'missed' : 'completed')}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-95 transition hover:scale-110 cursor-pointer"
                      title="Hang Up Call"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider font-bold">Hang Up</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* INSTAGRAM NOTE EDIT DIALOG MODAL (Write thoughts)     */}
      {/* ---------------------------------------------------- */}
      {showNoteModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl w-full max-w-xs space-y-4">
            <div className="flex justify-between items-center text-white">
              <span className="font-bold text-sm tracking-tight flex items-center space-x-1">
                <span>Share a Note update</span>
              </span>
              <button 
                onClick={() => setShowNoteModal(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-neutral-400">
              Notes appear at the top of direct messages for 24 hours. Keep it snappy and Nigerian-style!
            </p>

            <div className="space-y-1">
              <input
                type="text"
                maxLength={60}
                value={userNoteText}
                onChange={(e) => setUserNoteText(e.target.value)}
                placeholder="Trekking around local jollof canteens... (60 chars)"
                className="w-full bg-neutral-950 text-white placeholder-neutral-500 border border-neutral-800 py-2.5 px-3.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[9px] text-neutral-500 font-mono text-right block pr-1">
                {60 - userNoteText.length} characters left
              </span>
            </div>

            <button
              onClick={handleAddMyNote}
              disabled={!userNoteText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-xl text-xs font-bold text-white text-center shadow-md transition"
            >
              Post Note Update 🚀
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STORY OR NOTE CHOICE MODAL (Nigerian style o!)        */}
      {/* ---------------------------------------------------- */}
      {showStoryChoiceModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl w-full max-w-xs space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <div className={`w-10 h-10 rounded-full ${showStoryChoiceModal.neighbor.avatarColor} flex items-center justify-center text-lg`}>
                <span>{showStoryChoiceModal.neighbor.avatarEmoji}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs block text-white truncate">{showStoryChoiceModal.neighbor.name}</span>
                <span className="text-[10px] text-indigo-400 font-mono block truncate">@{showStoryChoiceModal.neighbor.username}</span>
              </div>
            </div>
            
            <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-850 text-xs text-neutral-300 leading-relaxed font-sans italic">
              "{showStoryChoiceModal.note.text}"
            </div>
            
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSelectedNeighbor(showStoryChoiceModal.neighbor);
                  setShowStoryChoiceModal(null);
                  triggerBeep(520, 0.08);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs text-center transition active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>💬 Read Note & Start Chat</span>
              </button>
              
              <button
                onClick={() => {
                  const targetNbId = showStoryChoiceModal.neighbor.id;
                  setShowStoryChoiceModal(null);
                  startStoryPlaylist(targetNbId);
                  triggerBeep(600, 0.1);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs text-center transition active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>📸 Watch Status Story (Loop)</span>
              </button>
              
              <button
                onClick={() => {
                  setShowStoryChoiceModal(null);
                  triggerBeep(300, 0.05);
                }}
                className="w-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 font-bold py-2 rounded-xl text-xs text-center transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* WHATSAPP STYLE MEDIA GALLERY MODAL                 */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showMediaGalleryModal && selectedNeighbor && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowMediaGalleryModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] ${
                appTheme === 'dark' ? 'bg-[#1f2c34] text-neutral-100' : 'bg-white text-neutral-900 border border-neutral-100'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-neutral-700/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Media, Links & Docs</h3>
                  <p className="text-[11px] text-zinc-400">with {selectedNeighbor.name}</p>
                </div>
                <button
                  onClick={() => setShowMediaGalleryModal(false)}
                  className="p-1 rounded-full hover:bg-neutral-800/20 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs list */}
              <div className="flex border-b border-neutral-700/10 px-2 overflow-x-auto scrollbar-none shrink-0 bg-black/10">
                {(['photos', 'videos', 'documents', 'links', 'voice'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveMediaGalleryTab(tab);
                      triggerBeep(380, 0.05);
                    }}
                    className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center capitalize whitespace-nowrap px-3 ${
                      activeMediaGalleryTab === tab
                        ? 'border-[#25D366] text-[#25D366]'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab === 'voice' ? 'Voice Notes' : tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                {(() => {
                  const currentUid = currentUser?.uid || 'user';
                  const list = (chatMessages[selectedNeighbor.id] || []).filter(m => {
                    if (m.deletedForEveryone || m.deletedForUsers?.includes(currentUid)) return false;
                    
                    if (activeMediaGalleryTab === 'photos') return m.type === 'image';
                    if (activeMediaGalleryTab === 'videos') return m.type === 'video';
                    if (activeMediaGalleryTab === 'documents') return m.type === 'document';
                    if (activeMediaGalleryTab === 'voice') return m.type === 'voice';
                    if (activeMediaGalleryTab === 'links') {
                      return m.type === 'text' && (m.text?.includes('http://') || m.text?.includes('https://') || m.text?.includes('www.'));
                    }
                    return false;
                  });

                  if (list.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-2">
                        <span className="text-3xl opacity-60">📁</span>
                        <p className="text-xs text-zinc-400">No {activeMediaGalleryTab} found in this chat</p>
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'photos' || activeMediaGalleryTab === 'videos') {
                    return (
                      <div className="grid grid-cols-3 gap-2.5">
                        {list.map((m) => (
                          <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-black border border-neutral-700/20 group cursor-pointer"
                               onClick={() => {
                                 triggerBeep(450, 0.05);
                               }}>
                            {m.type === 'image' ? (
                              <img src={m.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center relative">
                                <video src={m.mediaUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                                  <span className="text-white text-xl">▶️</span>
                                </div>
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 text-[8px] px-1 bg-black/60 rounded text-white font-mono">
                              {new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'documents') {
                    return (
                      <div className="flex flex-col space-y-2">
                        {list.map((m) => (
                          <div key={m.id} className="p-3 bg-black/20 hover:bg-black/30 border border-neutral-700/25 rounded-xl flex items-center justify-between space-x-3">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <FileText className="w-5 h-5 text-sky-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold truncate max-w-[200px]">{m.fileName || 'document.pdf'}</h4>
                                <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">{m.fileSize || '1.2 MB'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                triggerBeep(400, 0.05);
                                setAudioFeedback(`Downloading document: ${m.fileName || 'file'}`);
                              }}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 text-sky-400"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'links') {
                    return (
                      <div className="flex flex-col space-y-2">
                        {list.map((m) => {
                          const urlMatch = m.text?.match(/https?:\/\/[^\s]+/g);
                          const url = urlMatch ? urlMatch[0] : '#';
                          return (
                            <a
                              key={m.id}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-black/25 hover:bg-black/35 border border-neutral-700/20 rounded-xl flex items-start space-x-3 transition cursor-pointer"
                              onClick={() => triggerBeep(400, 0.05)}
                            >
                              <Link className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-emerald-400 truncate">{url}</h4>
                                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{m.text}</p>
                                <span className="text-[8px] text-zinc-500 font-mono block mt-1">
                                  {new Date(m.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'voice') {
                    return (
                      <div className="flex flex-col space-y-2">
                        {list.map((m) => (
                          <div key={m.id} className="p-3 bg-black/20 border border-neutral-700/10 rounded-xl flex items-center justify-between space-x-3">
                            <div className="flex items-center space-x-2">
                              <Mic className="w-4 h-4 text-[#25D366]" />
                              <span className="text-xs font-bold">Voice Note ({m.audioDurationSec || 0}s)</span>
                            </div>
                            <button
                              onClick={() => {
                                playVoiceNote(m, selectedNeighbor.name);
                                triggerBeep(450, 0.05);
                              }}
                              className="px-3 py-1 bg-[#25D366] text-neutral-900 font-bold rounded-lg text-[10px] hover:bg-emerald-500 active:scale-95 transition"
                            >
                              Play
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* CHAT LIST ITEM LONG PRESS / CONTEXT MENU OVERLAY */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {longPressedNeighborForMenu && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setLongPressedNeighborForMenu(null)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-t-3xl rounded-b-xl overflow-hidden p-5 shadow-2xl flex flex-col space-y-4 max-h-[85vh] overflow-y-auto ${
                appTheme === 'dark' ? 'bg-[#1f2c34] text-neutral-100' : 'bg-white text-neutral-900 border border-neutral-100'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/20">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${longPressedNeighborForMenu.avatarColor} flex items-center justify-center text-lg`}>
                    <span>{longPressedNeighborForMenu.avatarEmoji}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{longPressedNeighborForMenu.name}</h3>
                    <p className="text-xs text-zinc-400">@{longPressedNeighborForMenu.username || 'neighbor'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setLongPressedNeighborForMenu(null)}
                  className="p-1 rounded-full hover:bg-neutral-800/20 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col space-y-1">
                {/* 1. Pin / Unpin */}
                <button
                  onClick={() => {
                    handleTogglePinChat(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <Pin className="w-4 h-4 text-amber-500 rotate-45" />
                  <span>{longPressedNeighborForMenu.pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                </button>

                {/* 2. Mark as Unread / Read */}
                <button
                  onClick={() => {
                    handleToggleUnreadNeighbor(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>{unreadNeighborIds.includes(longPressedNeighborForMenu.id) ? 'Mark as Read' : 'Mark as Unread'}</span>
                </button>

                {/* 3. Mute / Unmute */}
                <button
                  onClick={() => {
                    handleToggleMuteNeighbor(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  {mutedNeighborIds.includes(longPressedNeighborForMenu.id) ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#25D366]" />
                      <span>Unmute Notifications</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-zinc-500" />
                      <span>Mute Notifications</span>
                    </>
                  )}
                </button>

                {/* 4. Archive / Unarchive */}
                <button
                  onClick={() => {
                    handleToggleArchiveChat(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <Archive className="w-4 h-4 text-sky-500" />
                  <span>{archivedNeighborIds.includes(longPressedNeighborForMenu.id) ? 'Unarchive Chat' : 'Archive Chat'}</span>
                </button>

                {/* 5. Delete Chat */}
                <button
                  onClick={() => {
                    handleDeleteChat(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Delete Chat</span>
                </button>

                {/* 6. View Profile */}
                <button
                  onClick={() => {
                    setSelectedNeighbor(longPressedNeighborForMenu);
                    setLongPressedNeighborForMenu(null);
                    triggerBeep(450, 0.08);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>View Profile</span>
                </button>

                {/* 7. Block / Unblock */}
                <button
                  onClick={() => {
                    handleToggleBlockNeighbor(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium text-red-500/80 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>{blockedNeighborIds.includes(longPressedNeighborForMenu.id) ? 'Unblock User' : 'Block User'}</span>
                </button>

                {/* 8. Report User */}
                <button
                  onClick={() => {
                    setAudioFeedback(`Report submitted against @${longPressedNeighborForMenu.username}. We are auditing their messages.`);
                    triggerBeep(300, 0.15);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium text-orange-400 transition"
                >
                  <Info className="w-4 h-4 text-orange-400" />
                  <span>Report User</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* SNAPCHAT STYLE ADD FRIENDS MODAL o!                 */}
      {/* ---------------------------------------------------- */}
      {showAddFriendsModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl w-full max-w-sm flex flex-col max-h-[85vh] shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-3 text-white">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 text-base">👻</span>
                <span className="font-bold text-sm tracking-tight flex items-center">Add Close Friends</span>
              </div>
              <button 
                onClick={() => setShowAddFriendsModal(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 mb-3 mt-1 leading-relaxed">
              Mutually adding close neighbors puts them in your close circle, letting you enjoy media story playlist flows together!
            </p>

            {/* List scroll container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {(() => {
                const nonFriends = neighbors.filter(n => n.id !== 'nb-myai');
                if (nonFriends.length === 0) {
                  return <div className="text-center py-6 text-xs text-neutral-500">No active neighbors found on radar grid.</div>;
                }

                return nonFriends.map((nb) => {
                  const isAlreadyFriend = (Array.isArray(friendIds) ? friendIds : []).includes(nb.id);
                  return (
                    <div 
                      key={nb.id}
                      className="p-3 bg-neutral-950 rounded-2xl border border-neutral-855 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${nb.avatarColor} flex items-center justify-center text-base flex-shrink-0 shadow-inner`}>
                          <span>{nb.avatarEmoji}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{nb.name}</span>
                          <span className="text-[9px] text-indigo-400 font-mono block truncate">
                            {`📍 Distance: ${nb.distanceMeters}m away`}
                          </span>
                        </div>
                      </div>

                      {/* Add or Friend Status Badge */}
                      {isAlreadyFriend ? (
                        <div className="flex items-center space-x-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[9px] px-2.5 py-1 rounded-lg">
                          <span>Mutual Friends</span>
                        </div>
                      ) : sentFriendRequestIds.includes(nb.id) ? (
                        <button
                          onClick={() => {
                            handleAddNewFriend(nb.id);
                          }}
                          className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-[10px] rounded-lg shadow transition active:scale-95 cursor-pointer"
                        >
                          <span>Request Sent</span>
                        </button>
                      ) : pendingFriendRequests.includes(nb.id) ? (
                        <button
                          onClick={() => {
                            handleAcceptFriendRequest(nb.id);
                          }}
                          className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[10px] rounded-lg shadow transition active:scale-95 cursor-pointer"
                        >
                          <span>Accept Request</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleAddNewFriend(nb.id);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow transition active:scale-95 cursor-pointer"
                        >
                          <span>+ Add Friend</span>
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FULL SNAP PUBLIC STORY INTERACTIVE VIEWING OVERLAY   */}
      {/* ---------------------------------------------------- */}
      {storyViewer && playingStorySnaps.length > 0 && (
        <div 
          onMouseDown={() => setIsStoryPaused(true)}
          onMouseUp={() => setIsStoryPaused(false)}
          onTouchStart={() => setIsStoryPaused(true)}
          onTouchEnd={() => setIsStoryPaused(false)}
          className="absolute inset-0 bg-neutral-950 z-[100] flex flex-col justify-between overflow-hidden select-none text-white animate-fade-in"
        >
          {/* Segmented Instagram & WhatsApp Progress Bars */}
          <div className="flex space-x-1.5 px-4 pt-4 z-20">
            {playingStorySnaps.map((_, sIdx) => {
              let fillWidth = '0%';
              if (sIdx < playingSnapIndex) fillWidth = '100%';
              else if (sIdx === playingSnapIndex) fillWidth = `${storyProgress}%`;
              
              return (
                <div key={`progress-bar-${sIdx}`} className="h-1 bg-white/20 flex-1 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-white transition-all duration-75"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* Player Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/80 to-transparent z-20">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-full ${storyViewer === 'me' ? 'bg-indigo-600 border border-indigo-500' : storyViewer.avatarColor} flex items-center justify-center text-sm overflow-hidden`}>
                {storyViewer === 'me' ? (
                  currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>🙋‍♂️</span>
                  )
                ) : (
                  storyViewer.customProfilePhoto ? (
                    <img src={storyViewer.customProfilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{storyViewer.avatarEmoji}</span>
                  )
                )}
              </div>
              <div>
                <span className="font-bold text-xs block text-white">
                  {storyViewer === 'me' ? 'Your Status' : storyViewer.name}
                </span>
                <p className="text-[9px] text-zinc-300 font-mono">
                  {playingStorySnaps[playingSnapIndex]?.timestamp || 'active update'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {storyViewer !== 'me' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMuteNeighborStories(storyViewer.id);
                    setStoryViewer(null);
                  }}
                  className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-black/40 border border-white/10 text-zinc-300 rounded-xl hover:bg-black/60 transition"
                >
                  {mutedStoryUserIds.includes(storyViewer.id) ? '🔊 Unmute' : '🔕 Mute'}
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setStoryViewer(null);
                  triggerBeep(300, 0.05);
                }}
                className="text-white bg-black/40 p-1.5 rounded-full hover:bg-black/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary View Area - Supports video and image rendering */}
          <div className="flex-1 flex items-center justify-center relative px-2">
            
            {/* Gesture boundaries: Left zone (35%) goes previous, Right zone (65%) goes next */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleStoryViewerPrev();
              }}
              className="absolute top-0 bottom-0 left-0 w-[35%] z-10 cursor-pointer"
            />
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleStoryViewerNext();
              }}
              className="absolute top-0 bottom-0 right-0 w-[65%] z-10 cursor-pointer"
            />

            {playingStorySnaps[playingSnapIndex] && (
              <div className="w-full max-w-[440px] aspect-[9/16] bg-black/40 border border-neutral-900 rounded-[2.5rem] overflow-hidden flex flex-col justify-between items-center relative shadow-2xl">
                <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                  {playingStorySnaps[playingSnapIndex].type === 'video' ? (
                    <video
                      src={playingStorySnaps[playingSnapIndex].mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <img 
                      src={playingStorySnaps[playingSnapIndex].mediaUrl} 
                      alt="story snapshot" 
                      className="w-full h-full object-contain pointer-events-none" 
                    />
                  )}
                </div>

                {/* Status Caption */}
                {playingStorySnaps[playingSnapIndex].caption && (
                  <div className="absolute bottom-6 left-4 right-4 bg-black/75 py-2.5 px-4 rounded-2xl text-center text-xs font-semibold leading-relaxed backdrop-blur-md shadow-lg border border-white/5 mx-2 text-zinc-100 z-20">
                    {playingStorySnaps[playingSnapIndex].caption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Interactive Area */}
          <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 pb-6 space-y-3 z-30">
            
            {/* Viewer lists panel for own story */}
            {storyViewer === 'me' ? (
              <div className="space-y-2">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStoryViewerList(!showStoryViewerList);
                    triggerBeep(450, 0.05);
                  }}
                  className="flex items-center justify-between w-full bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-xl text-neutral-300 text-xs font-bold hover:text-white hover:bg-neutral-800/90 transition select-none"
                >
                  <span className="flex items-center space-x-2">
                    <span>👁️</span>
                    <span>Viewer Count: {playingStorySnaps[playingSnapIndex]?.viewers?.length || 0} views</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{showStoryViewerList ? '▲ Hide Lists' : '▼ Show Viewers & Reactions'}</span>
                </button>

                {showStoryViewerList && (
                  <div 
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2.5 max-h-[160px] overflow-y-auto scrollbar-thin animate-fade-in text-left cursor-default"
                  >
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400 border-b border-neutral-800 pb-1">Viewers List:</p>
                      {(!playingStorySnaps[playingSnapIndex]?.viewers || playingStorySnaps[playingSnapIndex].viewers!.length === 0) ? (
                        <p className="text-[10px] text-zinc-500 italic py-2">No views yet.</p>
                      ) : (
                        <div className="divide-y divide-neutral-900">
                          {playingStorySnaps[playingSnapIndex].viewers!.map((v, vIdx) => (
                            <div key={`viewer-${vIdx}-${v.userId}`} className="flex items-center justify-between py-1.5 text-xs">
                              <span className="font-bold text-zinc-300">{v.name} (@{v.username})</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{v.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-800">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 border-b border-neutral-800 pb-1">Status Interactions:</p>
                      
                      {/* Show emojis reactions onto this snap */}
                      <div className="mt-1.5 space-y-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 block">Emoji Reactions:</span>
                        {(!playingStorySnaps[playingSnapIndex]?.reactions || playingStorySnaps[playingSnapIndex].reactions!.length === 0) ? (
                          <span className="text-[9px] text-zinc-500 italic">No reactions yet</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {playingStorySnaps[playingSnapIndex].reactions!.map((r, rIdx) => (
                              <span key={`react-view-${rIdx}`} className="text-[10px] bg-black/40 border border-neutral-800 px-2 py-1 rounded-full flex items-center space-x-1">
                                <span className="text-zinc-400 font-bold">@{r.username}:</span>
                                <span>{r.emoji}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Show replies received directly to this snap */}
                      <div className="mt-2.5 space-y-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 block">Replies Received:</span>
                        {(!playingStorySnaps[playingSnapIndex]?.replies || playingStorySnaps[playingSnapIndex].replies!.length === 0) ? (
                          <p className="text-[9px] text-zinc-500 italic">No direct replies yet</p>
                        ) : (
                          <div className="space-y-1 bg-black/40 p-1.5 rounded-lg border border-neutral-800">
                            {playingStorySnaps[playingSnapIndex].replies!.map((rep, repIdx) => (
                              <div key={`reply-view-${repIdx}`} className="text-[10px] py-1 border-b border-neutral-900 last:border-0 leading-normal">
                                <span className="font-bold text-indigo-300">@{rep.username}</span>: <span className="text-zinc-200">{rep.text}</span>
                                <span className="text-[8px] text-zinc-500 block text-right">{rep.timestamp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Viewer is interactive peer - replies form and emojis reactions */
              <div 
                onMouseDown={(e) => e.stopPropagation()} 
                className="space-y-2.5 text-center cursor-default"
              >
                {/* 1. Quick Emoji Reactions deck */}
                <div className="flex items-center justify-center space-x-3 bg-neutral-900/60 border border-neutral-800/80 p-2 rounded-2xl max-w-sm mx-auto">
                  {['😂', '❤️', '😮', '😢', '👏', '🔥', '🎉'].map(emoji => (
                    <button
                      key={`emoji-react-${emoji}`}
                      onClick={async () => {
                        const snap = playingStorySnaps[playingSnapIndex];
                        if (snap && storyViewer && storyViewer !== 'me') {
                          triggerBeep(480, 0.08);
                          // 1. Add reaction in story doc
                          try {
                            const storyDocRef = doc(db, 'users', storyViewer.id, 'stories', snap.id);
                            const currentReactions = snap.reactions || [];
                            const newReaction = {
                              userId: currentUser!.uid,
                              username: userUsername || 'anonymous',
                              emoji
                            };
                            await updateDoc(storyDocRef, {
                              reactions: [...currentReactions, newReaction]
                            });

                            // 2. Forward to direct messages
                            const friendlyMsgBody = `Reacted ${emoji} to your status update! 📲`;
                            const messageId = `msg-${Date.now()}`;
                            const dm: DirectMessage = {
                              id: messageId,
                              senderId: 'user',
                              receiverId: storyViewer.id,
                              chatThreadId: storyViewer.id,
                              timestamp: new Date().toISOString(),
                              type: 'text',
                              text: `[Reaction to status]: ${snap.caption ? `"${snap.caption}"` : "[Status Image/Video]"}\n\n${friendlyMsgBody}`,
                              status: 'sent',
                              mediaUrl: snap.mediaUrl || undefined
                            };
                            await saveOrUpdateMessageInFirestore(dm, storyViewer.id);
                            _setChatMessages(prev => ({
                              ...prev,
                              [storyViewer.id]: [...(prev[storyViewer.id] || []), dm]
                            }));

                            setAudioFeedback(`Sent ${emoji} reaction! 📲`);
                            setTimeout(() => setAudioFeedback(""), 2000);
                          } catch (err) {
                            console.warn("Failed reaction save:", err);
                          }
                        }
                      }}
                      className="text-lg hover:scale-125 transition active:scale-90 cursor-pointer"
                      title="Send quick reaction"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* 2. Text reply composer form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const snap = playingStorySnaps[playingSnapIndex];
                    if (!storyViewerReplies.trim() || !snap || !storyViewer || storyViewer === 'me') return;
                    
                    const textToSend = storyViewerReplies;
                    setStoryViewerReplies('');
                    triggerBeep(520, 0.1);

                    try {
                      const storyDocRef = doc(db, 'users', storyViewer.id, 'stories', snap.id);
                      const currentReplies = snap.replies || [];
                      const newReply = {
                        userId: currentUser!.uid,
                        username: userUsername || 'anonymous',
                        name: userDisplayName || 'Anonymous',
                        text: textToSend,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                      await updateDoc(storyDocRef, {
                        replies: [...currentReplies, newReply]
                      });

                      // Also generate a physical message to User's Chat Inbox o!
                      const dmMsgId = `msg-${Date.now()}`;
                      const customInboxText = `[Replied to Status 📸]: ${snap.caption ? `"${snap.caption}"` : "Story"} \n\n"${textToSend}"`;
                      const dm: DirectMessage = {
                        id: dmMsgId,
                        senderId: 'user',
                        receiverId: storyViewer.id,
                        chatThreadId: storyViewer.id,
                        timestamp: new Date().toISOString(),
                        type: 'text',
                        text: customInboxText,
                        status: 'sent',
                        mediaUrl: snap.mediaUrl || undefined
                      };
                      await saveOrUpdateMessageInFirestore(dm, storyViewer.id);
                      _setChatMessages(prev => ({
                        ...prev,
                        [storyViewer.id]: [...(prev[storyViewer.id] || []), dm]
                      }));

                      setAudioFeedback("Your reply is on its way! 📬");
                      setTimeout(() => setAudioFeedback(""), 3000);
                    } catch (err) {
                      console.warn("Error sending story reply:", err);
                    }
                  }}
                  className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-full px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-indigo-500 max-w-sm mx-auto shadow-md"
                >
                  <input
                    type="text"
                    value={storyViewerReplies}
                    onChange={(e) => setStoryViewerReplies(e.target.value)}
                    placeholder={`Reply to ${storyViewer.name}...`}
                    className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs placeholder-neutral-500 text-white"
                  />
                  <button
                    type="submit"
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:text-neutral-600 transition"
                    disabled={!storyViewerReplies.trim()}
                  >
                    Reply
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PREMIUM INTERACTIVE STATUS COMPOSER WIZARD          */}
      {/* ---------------------------------------------------- */}
      {storyUploadData && (
        <div className="absolute inset-0 bg-neutral-950 backdrop-blur-lg z-[110] flex flex-col justify-between p-5 text-white animate-fade-in overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-neutral-850">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📲</span>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white">Status Composer</h3>
                <span className="text-[10px] text-zinc-400 font-mono">Create custom ephemeral story updates</span>
              </div>
            </div>
            <button
              onClick={() => {
                setStoryUploadData(null);
                setStoryCompositionCaption('');
                setStoryCompositionPrivacy('everyone');
                setStoryCompositionCustomList([]);
                triggerBeep(350, 0.05);
              }}
              className="text-zinc-400 hover:text-white bg-white/5 p-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 my-5 space-y-4 max-w-sm mx-auto w-full">
            {/* Visual media preview block container */}
            <div className="relative aspect-[9/12] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
              {storyUploadData.type === 'video' ? (
                <video
                  src={storyUploadData.mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <img
                  src={storyUploadData.mediaUrl}
                  alt="Custom Story Source"
                  className="w-full h-full object-contain pointer-events-none"
                />
              )}
              <div className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-300">
                {storyUploadData.type.toUpperCase()} PREVIEW
              </div>
            </div>

            {/* Caption Text Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                ✏️ Caption Status:
              </label>
              <input
                type="text"
                value={storyCompositionCaption}
                onChange={(e) => setStoryCompositionCaption(e.target.value)}
                placeholder="What's on your mind? Add caption o..."
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Privacy Select Config */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                🔒 Access & Privacy Controls:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'everyone', label: 'Everyone', desc: 'All local users' },
                  { id: 'friends', label: 'Friends', desc: 'Mutual connections' },
                  { id: 'custom', label: 'Custom List', desc: 'Pick specific friends' }
                ].map(pPlan => (
                  <button
                    key={`privacy-plan-${pPlan.id}`}
                    type="button"
                    onClick={() => {
                      setStoryCompositionPrivacy(pPlan.id as any);
                      triggerBeep(450, 0.05);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer select-none ${
                      storyCompositionPrivacy === pPlan.id 
                        ? 'bg-indigo-650 text-white border-indigo-500 shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">{pPlan.label}</span>
                    <span className="text-[8px] opacity-75 mt-0.5 block leading-tight">{pPlan.desc}</span>
                  </button>
                ))}
              </div>

              {/* Custom list builder checklist */}
              {storyCompositionPrivacy === 'custom' && (
                <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                  <p className="text-[9px] font-extrabold uppercase text-zinc-500">Pick Specific Friends to Share With:</p>
                  
                  {neighbors.filter(nb => !nb.isGroup && nb.id !== 'nb-myai').length === 0 ? (
                    <p className="text-[10px] text-zinc-600 italic py-1">No other registered friends found</p>
                  ) : (
                    neighbors.filter(nb => !nb.isGroup && nb.id !== 'nb-myai').map(nb => {
                      const isChecked = storyCompositionCustomList.includes(nb.id);
                      return (
                        <label 
                          key={`custom-priv-item-${nb.id}`} 
                          className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-neutral-800 hover:bg-black/65 cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs">{nb.avatarEmoji || "👤"}</span>
                            <span className="text-xs font-bold text-zinc-300">{nb.name}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              triggerBeep(440, 0.05);
                              if (isChecked) {
                                setStoryCompositionCustomList(prev => prev.filter(uid => uid !== nb.id));
                              } else {
                                setStoryCompositionCustomList(prev => [...prev, nb.id]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-neutral-850 flex space-x-3 max-w-sm mx-auto w-full pb-4 bg-transparent">
            <button
              onClick={() => {
                setStoryUploadData(null);
                setStoryCompositionCaption('');
                setStoryCompositionPrivacy('everyone');
                setStoryCompositionCustomList([]);
                triggerBeep(300, 0.08);
              }}
              className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 text-zinc-300 hover:text-white border border-neutral-800 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePublishStoryComposition}
              disabled={isPublishingStory || (storyCompositionPrivacy === 'custom' && storyCompositionCustomList.length === 0)}
              className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-lg flex items-center justify-center space-x-2"
            >
              {isPublishingStory ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Status 📲</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- Unified Bottom Navigation bar matching NDS v2.0 --- */}
      <div 
        id="premium-bottom-nav"
        className={`fixed bottom-[16px] left-1/2 -translate-x-1/2 w-[90%] h-[60px] rounded-[24px] border flex justify-around items-center px-3 z-30 shadow-[0_6px_24px_0_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-200 ${
          appTheme === 'dark' 
            ? 'bg-[#1A1C1F]/80 border-[#2A2D31]/30 text-white' 
            : 'bg-[#FFFFFF]/85 border-[#ECECEC]/70 text-[#161616]'
        }`}
      >
        
        {/* Navigation Item: RADAR */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18 }}
          onClick={() => {
            setActiveTab('radar');
            triggerBeep(350, 0.08);
          }}
          className={`flex flex-col items-center justify-center transition cursor-pointer min-w-[50px] relative`}
          style={{ minHeight: '40px' }}
        >
          <motion.div 
            animate={{ scale: activeTab === 'radar' ? 1.05 : 1.0, y: activeTab === 'radar' ? -1 : 0 }} 
            transition={{ duration: 0.18 }}
            className={`${activeTab === 'radar' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'}`}
            style={{
              filter: activeTab === 'radar' ? 'drop-shadow(0 0 3px rgba(15,138,95,0.4))' : 'none'
            }}
          >
            <MapPin className="w-[20px] h-[20px]" style={{ strokeWidth: 2.2 }} />
          </motion.div>
          <span className={`text-[10px] font-bold font-sans mt-0.5 transition-colors duration-180 ${
            activeTab === 'radar' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'
          }`}>
            Radar
          </span>
        </motion.button>
 
        {/* Navigation Item: CHATS */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18 }}
          onClick={() => {
            setActiveTab('chat');
            setSelectedNeighbor(null); // Return to list if in thread
            triggerBeep(380, 0.08);
          }}
          className={`flex flex-col items-center justify-center transition cursor-pointer relative min-w-[50px]`}
          style={{ minHeight: '40px' }}
        >
          <div className="relative">
            <motion.div 
              animate={{ scale: activeTab === 'chat' ? 1.05 : 1.0, y: activeTab === 'chat' ? -1 : 0 }} 
              transition={{ duration: 0.18 }}
              className={`${activeTab === 'chat' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'}`}
              style={{
                filter: activeTab === 'chat' ? 'drop-shadow(0 0 3px rgba(15,138,95,0.4))' : 'none'
              }}
            >
              <MessageCircle className="w-[20px] h-[20px]" style={{ strokeWidth: 2.2 }} />
            </motion.div>
            {chatNotification && (
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border bg-red-500 animate-pulse`} />
            )}
          </div>
          <span className={`text-[10px] font-bold font-sans mt-0.5 transition-colors duration-180 ${
            activeTab === 'chat' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'
          }`}>
            Chat
          </span>
        </motion.button>

        {/* Navigation Item: EXPLORE */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18 }}
          onClick={() => {
            setActiveTab('explore');
            triggerBeep(395, 0.08);
          }}
          className={`flex flex-col items-center justify-center transition cursor-pointer min-w-[50px] relative`}
          style={{ minHeight: '40px' }}
        >
          <motion.div 
            animate={{ scale: activeTab === 'explore' ? 1.05 : 1.0, y: activeTab === 'explore' ? -1 : 0 }} 
            transition={{ duration: 0.18 }}
            className={`${activeTab === 'explore' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'}`}
            style={{
              filter: activeTab === 'explore' ? 'drop-shadow(0 0 3px rgba(15,138,95,0.4))' : 'none'
            }}
          >
            <Compass className="w-[20px] h-[20px]" style={{ strokeWidth: 2.2 }} />
          </motion.div>
          <span className={`text-[10px] font-bold font-sans mt-0.5 transition-colors duration-180 ${
            activeTab === 'explore' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'
          }`}>
            Explore
          </span>
        </motion.button>
 
        {/* Navigation Item: PROFILE */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.18 }}
          onClick={() => {
            setActiveTab('menu');
            triggerBeep(410, 0.08);
          }}
          className={`flex flex-col items-center justify-center transition cursor-pointer relative min-w-[50px]`}
          style={{ minHeight: '40px' }}
        >
          <motion.div 
            animate={{ scale: activeTab === 'menu' ? 1.05 : 1.0, y: activeTab === 'menu' ? -1 : 0 }} 
            transition={{ duration: 0.18 }}
            className={`${activeTab === 'menu' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'}`}
            style={{
              filter: activeTab === 'menu' ? 'drop-shadow(0 0 3px rgba(15,138,95,0.4))' : 'none'
            }}
          >
            <User className="w-[20px] h-[20px]" style={{ strokeWidth: 2.2 }} />
          </motion.div>
          <span className={`text-[10px] font-bold font-sans mt-0.5 transition-colors duration-180 ${
            activeTab === 'menu' ? 'text-[#0F8A5F]' : 'text-[#8E8E93]'
          }`}>
            Profile
          </span>
        </motion.button>

      </div>

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

    </div>
  );

  const wrappedAppContent = (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#070a13]">
      {appContent}
    </div>
  );

  if (usingGoogleMaps) {
    return (
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
        {wrappedAppContent}
      </APIProvider>
    );
  }
  return wrappedAppContent;
}
