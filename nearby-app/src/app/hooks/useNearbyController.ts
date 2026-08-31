import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin as GMapPin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
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


const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

/**
 * Nearby application controller.
 *
 * This hook owns the existing application state, effects, and event handlers.
 * UI composition lives in feature/screen components and consumes this runtime
 * through NearbyRuntimeContext. No application behavior is intentionally changed
 * by this extraction.
 */
export function useNearbyController() {
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

        // Firestore documents cap out around 1MB. If Storage upload silently failed
        // above, finalUrl is still a full base64 data: URL and can blow that limit on
        // its own - refuse early with a clear message instead of a doomed, silent setDoc.
        if (finalUrl.startsWith('data:') && finalUrl.length > 700000) {
          console.error(`Profile photo still base64 after upload attempt (${finalUrl.length} bytes) - Firebase Storage likely isn't working. Check Storage is enabled for this project and its security rules.`);
          setAudioFeedback("⚠️ Photo too large to save without cloud Storage working - upload didn't persist. Check Firebase Storage setup.");
          setTimeout(() => setAudioFeedback(""), 4000);
          return;
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
          const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
          setAudioFeedback(
            errMsg.toLowerCase().includes('longer than') || errMsg.toLowerCase().includes('exceeds')
              ? "⚠️ Photo too large to save. Not persisted."
              : "⚠️ Photo failed to save to the cloud - it will disappear on next login."
          );
          setTimeout(() => setAudioFeedback(""), 4000);
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
        // window.prompt() is a blocking, synchronous browser dialog. In a WebView shell
        // that doesn't implement the native prompt bridge (very common for hybrid/mobile
        // app wrappers), calling it can hang the JS thread forever instead of returning -
        // which would freeze this entire upload with no error and no success message ever
        // firing. Auto-name the highlight instead so the upload can never get stuck here;
        // rename support can be added later as a proper in-app modal if needed.
        const title = `Highlight ${new Date().toLocaleDateString()}`;

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

        // Firestore documents are capped at ~1MB. If Storage upload silently failed above,
        // finalMediaUrl is still a full base64 data: URL, which is often big enough to blow
        // that limit on its own - and setDoc would throw on the write below. Catch it here
        // with a clear message instead of a cryptic Firestore error, and log the real size
        // so we can tell whether Storage is actually the thing failing.
        if (finalMediaUrl.startsWith('data:')) {
          console.warn(`Highlight ${hlId} still a base64 data URL after upload attempt - Storage likely failed. Size: ${finalMediaUrl.length} bytes.`);
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
          if (finalMediaUrl.startsWith('data:') && finalMediaUrl.length > 700000) {
            console.error(`Highlight ${hlId} too large to persist as base64 (${finalMediaUrl.length} bytes) - Firebase Storage likely isn't working.`);
            setAudioFeedback("⚠️ Highlight too large to save without cloud Storage working - it won't persist. Check Firebase Storage setup.");
          } else {
            try {
              const hlRef = doc(db, 'users', fUser.uid, 'highlights', hlId);
              await setDoc(hlRef, finalHlDoc);
              setAudioFeedback("Highlight uploaded & persisted! 📲");
            } catch (err) {
              console.error("Firestore write highlight error:", err);
              handleFirestoreError(err, OperationType.WRITE, `users/${fUser.uid}/highlights/${hlId}`);
              const errMsg = err instanceof Error ? err.message : String(err);
              setAudioFeedback(
                errMsg.toLowerCase().includes('longer than') || errMsg.toLowerCase().includes('exceeds')
                  ? "⚠️ Highlight too large to save (image needs more compression). Not persisted."
                  : "⚠️ Highlight failed to save to the cloud - it will disappear on next login."
              );
            }
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

        if (finalMediaUrl.startsWith('data:')) {
          console.warn(`Post ${postId} still base64 after upload attempt - Storage likely failed. Size: ${finalMediaUrl.length} bytes.`);
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
          if (finalMediaUrl.startsWith('data:') && finalMediaUrl.length > 700000) {
            console.error(`Post ${postId} too large to persist as base64 (${finalMediaUrl.length} bytes) - Firebase Storage likely isn't working.`);
            setAudioFeedback("⚠️ Post too large to save without cloud Storage working - it won't persist. Check Firebase Storage setup.");
          } else {
            try {
              const postRef = doc(db, 'users', fUser.uid, 'posts', postId);
              await setDoc(postRef, finalPostDoc);
              setAudioFeedback("Post added to your feed! 📸");
            } catch (err) {
              console.error("Firestore write post error:", err);
              handleFirestoreError(err, OperationType.WRITE, `users/${fUser.uid}/posts/${postId}`);
              const errMsg = err instanceof Error ? err.message : String(err);
              setAudioFeedback(
                errMsg.toLowerCase().includes('longer than') || errMsg.toLowerCase().includes('exceeds')
                  ? "⚠️ Post too large to save. Not persisted."
                  : "⚠️ Post failed to save to the cloud - it will disappear on next login."
              );
            }
          }
        } else {
          setAudioFeedback("Post added locally!");
        }
      }
      setTimeout(() => setAudioFeedback(""), 4000);
    };
    reader.readAsDataURL(file);
  };
  
  // Under the hood state for messages
  const [chatMessages, _setChatMessages] = useState<Record<string, DirectMessage[]>>(INITIAL_MESSAGES);

  // Kept in sync below purely so the users-listener effect (which builds the `neighbors`
  // list) can check "do I already have a conversation with this person" without needing
  // chatMessages in its dependency array - that list re-subscribes to a Firestore
  // collection listener, and we don't want it tearing down/rebuilding on every message.
  const chatMessagesRef = useRef<Record<string, DirectMessage[]>>(chatMessages);
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);
  
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
      handleFirestoreError(err, OperationType.WRITE, 'direct_messages');
      // Show the real Firestore error text on-screen (not just a generic "check your
      // connection") so this is diagnosable without needing to open devtools - especially
      // important on mobile where the console usually isn't reachable at all.
      const errMsg = err instanceof Error ? err.message : String(err);
      setAudioFeedback(`⚠️ Message failed to send: ${errMsg}`);
      setTimeout(() => setAudioFeedback(""), 6000);
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
        // Don't require "friend" status to keep an existing conversation visible - two
        // people can message each other in this app without being friends first, and if
        // that's the only requirement checked below, the other side quietly disappears
        // from your neighbors/chat list the moment their live distance reads outside your
        // radius, even mid-conversation.
        const hasExistingChat = (chatMessagesRef.current[u.uid]?.length ?? 0) > 0;
        const keepRegardlessOfRadius = hasRelationship || hasExistingChat;

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
        if (!isWithinRadius && !keepRegardlessOfRadius) return;
        
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
        id: `msg-reply-${auth.currentUser?.uid || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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

    // Friends-only messaging: real users (not the simulated "nb-" demo companions) must be
    // mutual friends before a DM can be sent. This is enforced for real in the Firestore
    // rules too (see firestore.rules) - this check just gives an immediate, friendly
    // message instead of letting the send silently fail against the server rule.
    if (!selectedNeighbor.id.startsWith('nb-') && !friendIds.includes(selectedNeighbor.id)) {
      setAudioFeedback(`⚠️ You can only message friends. Add ${selectedNeighbor.name} as a friend first.`);
      setTimeout(() => setAudioFeedback(""), 3500);
      return;
    }

    triggerBeep(500, 0.08, 'sine');
    
    const resolvedType = customType || (customImage ? 'image' : (customVoiceDuration ? 'voice' : 'text'));
    // Message IDs are the actual Firestore document ID in the shared, global
    // direct_messages collection - a bare Date.now() timestamp with no per-sender
    // component can collide between two DIFFERENT people's messages sent in the same
    // millisecond (easy to hit when testing from two devices). A collision means the
    // second write's merge silently blends into the first document, which is how one
    // person's message can end up displaying as sent by someone else. Namespacing by
    // the sender's own uid plus a random suffix makes a collision effectively impossible.
    const msgId = `msg-${auth.currentUser?.uid || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
        id: `msg-${fUser?.uid || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
      const msgId = `msg-meetup-${currentUser.uid}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
      // setDoc(..., {merge:true}) instead of updateDoc: updateDoc THROWS "no document to
      // update" if the target doc doesn't exist for any reason, which would silently abort
      // this whole step with zero feedback. merge:true creates the doc if missing and just
      // updates the field otherwise - strictly safer for a cross-account write like this.
      await setDoc(userDocRef, { friendIds: arrayUnion(senderId) }, { merge: true });
    } catch (e) {
      console.error("Firestore user sync friend union failed:", e);
      handleFirestoreError(e, OperationType.UPDATE, `users/${receiverId}`);
      const errMsg = e instanceof Error ? e.message : String(e);
      setAudioFeedback(`⚠️ Friend sync failed on your side: ${errMsg}`);
      setTimeout(() => setAudioFeedback(""), 6000);
    }

    try {
      const senderDocRef = doc(db, 'users', senderId);
      await setDoc(senderDocRef, { friendIds: arrayUnion(receiverId) }, { merge: true });
    } catch (e) {
      console.error("Firestore sender sync friend union failed:", e);
      handleFirestoreError(e, OperationType.UPDATE, `users/${senderId}`);
      const errMsg = e instanceof Error ? e.message : String(e);
      setAudioFeedback(`⚠️ Friend sync failed on their side: ${errMsg}`);
      setTimeout(() => setAudioFeedback(""), 6000);
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

        // Each write is now independent (own try/catch) instead of one throwing and
        // aborting the rest - previously, if removing yourself from the other person's
        // friendIds failed, the whole function threw and even the friend_requests cleanup
        // below never ran, leaving things in a half-removed state.
        try {
          await setDoc(userDocRef, { friendIds: arrayRemove(neighborId) }, { merge: true });
        } catch (e) {
          console.error("Failed to remove friend from your own list:", e);
          handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
        }
        try {
          await setDoc(neighborDocRef, { friendIds: arrayRemove(currentUser.uid) }, { merge: true });
        } catch (e) {
          console.error("Failed to remove yourself from their friend list:", e);
          handleFirestoreError(e, OperationType.UPDATE, `users/${neighborId}`);
        }

        try {
          await deleteDoc(doc(db, 'friend_requests', `${currentUser.uid}_${neighborId}`));
          await deleteDoc(doc(db, 'friend_requests', `${neighborId}_${currentUser.uid}`));
        } catch (e) {
          console.warn("friend_requests cleanup on unfriend failed (likely already deleted):", e);
        }

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
    if (!neighborId.startsWith('nb-') && !friendIds.includes(neighborId)) {
      setAudioFeedback("⚠️ You can only message friends. Add them as a friend first.");
      setTimeout(() => setAudioFeedback(""), 3500);
      return;
    }

    const msgId = `msg-${auth.currentUser?.uid || 'anon'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  }, [friendIds]);

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
        const msgId = `msg-forwarded-${auth.currentUser?.uid || 'anon'}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
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
      // A conversation you already have should never disappear just because the other
      // person's live GPS distance currently reads outside your radar radius (they closed
      // the app, walked off, or their location simply hasn't refreshed). Without the
      // "already have messages" clause below, this filter was silently hiding entire chat
      // threads from the Chats tab - the messages were still safely in Firestore, they
      // just never rendered, which looked exactly like "replies aren't coming through".
      const hasExistingChat = (chatMessages[nb.id]?.length ?? 0) > 0;
      const isWithinRadius = nb.id === 'nb-myai' || nb.distanceMeters <= radarRadius || hasExistingChat;
      const matchesSearch = nb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            nb.username.toLowerCase().includes(searchQuery.toLowerCase());
      return isWithinRadius && matchesSearch;
    });
  }, [syncedNeighbors, radarRadius, searchQuery, chatMessages]);

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


  return {
    hasSavedAccountOnDisk,
    activeTab,
    setActiveTab,
    selectedPreset,
    setSelectedPreset,
    lastLocationWriteRef,
    lastLiveLocationWriteTimeRef,
    calculateHaversineDistance,
    updatePresetWithCoordinates,
    updateRadarPresenceInFirestore,
    onboardingCoords,
    setOnboardingCoords,
    onboardingAddress,
    setOnboardingAddress,
    onboardingState,
    setOnboardingState,
    onboardingStreetName,
    setOnboardingStreetName,
    neighbors,
    setNeighbors,
    selectedNeighborState,
    setSelectedNeighbor,
    presenceMap,
    setPresenceMap,
    syncedNeighbors,
    selectedNeighbor,
    selectedNeighborId,
    chatLimit,
    setChatLimit,
    activeNotes,
    setActiveNotes,
    searchWideSop,
    setSearchWideSop,
    chatSubTab,
    setChatSubTab,
    chatFilter,
    setChatFilter,
    pendingFriendRequests,
    setPendingFriendRequests,
    sentFriendRequestIds,
    setSentFriendRequestIds,
    showPremiumModal,
    setShowPremiumModal,
    showFriendsModal,
    setShowFriendsModal,
    showNeighborFriendsModal,
    setShowNeighborFriendsModal,
    showNotificationsModal,
    setShowNotificationsModal,
    exploreSubTab,
    setExploreSubTab,
    isCurrentMeBanned,
    setIsCurrentMeBanned,
    showLandingMode,
    setShowLandingMode,
    myVerificationLevel,
    setMyVerificationLevel,
    showVerificationModal,
    setShowVerificationModal,
    isScanningFace,
    setIsScanningFace,
    scanCountdown,
    setScanCountdown,
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
    topNotification,
    setTopNotification,
    chatNotification,
    setChatNotification,
    notifications,
    setNotifications,
    unreadNotificationsCount,
    setUnreadNotificationsCount,
    storyFileRef,
    chatFileRef,
    profileFileRef,
    postFileRef,
    autoLoginAttemptedRef,
    chatSearchInputRef,
    latestCoordsRef,
    showNewChatDrawer,
    setShowNewChatDrawer,
    initialProfile,
    showInstagramProfile,
    setShowInstagramProfile,
    isProfileLoaded,
    setIsProfileLoaded,
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
    setUserCommunities,
    appLanguage,
    setAppLanguage,
    showLanguageModal,
    setShowLanguageModal,
    showInviteModal,
    setShowInviteModal,
    contactsList,
    setContactsList,
    isRequestingContacts,
    setIsRequestingContacts,
    showNearbyNotification,
    setShowNearbyNotification,
    nearbyNotificationCount,
    setNearbyNotificationCount,
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
    setNeighborPosts,
    neighborHighlights,
    setNeighborHighlights,
    userStatusText,
    setUserStatusText,
    userPosts,
    setUserPosts,
    userHighlights,
    setUserHighlights,
    userFollowers,
    setUserFollowers,
    userFollowing,
    setUserFollowing,
    userFollowersCount,
    setUserFollowersCount,
    userFollowingCount,
    setUserFollowingCount,
    userTrustScore,
    setUserTrustScore,
    userMeetupCount,
    setUserMeetupCount,
    meetups,
    setMeetups,
    meetupRatings,
    setMeetupRatings,
    showScheduleMeetupModal,
    setShowScheduleMeetupModal,
    scheduleMeetupTargetNeighbor,
    setScheduleMeetupTargetNeighbor,
    scheduleMeetupPoint,
    setScheduleMeetupPoint,
    scheduleMeetupTime,
    setScheduleMeetupTime,
    scheduleMeetupLat,
    setScheduleMeetupLat,
    scheduleMeetupLng,
    setScheduleMeetupLng,
    ratingReviewText,
    setRatingReviewText,
    activeRatingStars,
    setActiveRatingStars,
    showInlineRatingForm,
    setShowInlineRatingForm,
    ratingFormMeetupId,
    setRatingFormMeetupId,
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
    aboutDetailModal,
    setAboutDetailModal,
    confirmDeleteAccount,
    setConfirmDeleteAccount,
    handleGalleryUploadForStory,
    handlePublishStoryComposition,
    handleGalleryUploadForChat,
    handleGalleryUploadForProfilePic,
    handleGalleryUploadForPost,
    chatMessages,
    _setChatMessages,
    setChatMessages,
    currentUser,
    setCurrentUser,
    authLoading,
    setAuthLoading,
    isSplashActive,
    setIsSplashActive,
    showWelcomeTour,
    setShowWelcomeTour,
    welcomeTourStep,
    setWelcomeTourStep,
    authScreenState,
    setAuthScreenState,
    authSuccess,
    setAuthSuccess,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    showOnboarding,
    setShowOnboarding,
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
    onboardingCommunities,
    setOnboardingCommunities,
    authEmailOrPhone,
    setAuthEmailOrPhone,
    authPassword,
    setAuthPassword,
    authConfirmPassword,
    setAuthConfirmPassword,
    authIsSignUp,
    setAuthIsSignUp,
    isPhoneAuthOption,
    setIsPhoneAuthOption,
    authError,
    setAuthError,
    onboardingGpsStatus,
    setOnboardingGpsStatus,
    onboardingCamStatus,
    setOnboardingCamStatus,
    isSyncing,
    setIsSyncing,
    textInput,
    setTextInput,
    isAiTyping,
    setIsAiTyping,
    searchQuery,
    setSearchQuery,
    usingGoogleMaps,
    setUsingGoogleMaps,
    hasValidGoogleMapsKey,
    userNoteText,
    setUserNoteText,
    showNoteModal,
    setShowNoteModal,
    radarRadius,
    setRadarRadius,
    showRadarDrawer,
    setShowRadarDrawer,
    showFloatingSearch,
    setShowFloatingSearch,
    isSubscribed,
    setIsSubscribed,
    showPayModal,
    setShowPayModal,
    premiumUpgradeFeature,
    setPremiumUpgradeFeature,
    pendingPremiumAction,
    setPendingPremiumAction,
    friendsAddedTodayCount,
    setFriendsAddedTodayCount,
    uploadMode,
    setUploadModeState,
    uploadModeRef,
    setUploadMode,
    customAccentColor,
    setCustomAccentColor,
    customChatBg,
    setCustomChatBg,
    customChatBubbleStyle,
    setCustomChatBubbleStyle,
    customChatFont,
    setCustomChatFont,
    userGroupInvitePolicy,
    setUserGroupInvitePolicy,
    userGroupCallPolicy,
    setUserGroupCallPolicy,
    friendIds,
    setFriendIds,
    isUserVisibleOnRadar,
    setIsUserVisibleOnRadar,
    showMainMenuDropdown,
    setShowMainMenuDropdown,
    showActiveChatDropdown,
    setShowActiveChatDropdown,
    showActiveChatMoreDropdown,
    setShowActiveChatMoreDropdown,
    radarVisibilityMode,
    setRadarVisibilityMode,
    userRadarEmoji,
    setUserRadarEmoji,
    userRadarStatusText,
    setUserRadarStatusText,
    showCreateGroupModal,
    setShowCreateGroupModal,
    newGroupName,
    setNewGroupName,
    newGroupDesc,
    setNewGroupDesc,
    newGroupMembers,
    setNewGroupMembers,
    newGroupEmoji,
    setNewGroupEmoji,
    newGroupColor,
    setNewGroupColor,
    showGroupInviteConfirmModal,
    setShowGroupInviteConfirmModal,
    pendingIncomingInviteGroup,
    setPendingIncomingInviteGroup,
    showGroupCallConfirmModal,
    setShowGroupCallConfirmModal,
    pendingIncomingCall,
    setPendingIncomingCall,
    appTheme,
    setAppTheme,
    userCoords,
    setUserCoords,
    gpsSynced,
    setGpsSynced,
    userAddress,
    setUserAddress,
    searchStateQuery,
    setSearchStateQuery,
    showStateSearchModal,
    setShowStateSearchModal,
    callState,
    setCallState,
    micMuted,
    setMicMuted,
    videoOff,
    setVideoOff,
    isSpeakerOn,
    setIsSpeakerOn,
    beautyMode,
    setBeautyMode,
    bluetoothOn,
    setBluetoothOn,
    cameraFacingMode,
    setCameraFacingMode,
    networkQuality,
    setNetworkQuality,
    networkQualityDesc,
    setNetworkQualityDesc,
    iceConnectionState,
    setIceConnectionState,
    localStream,
    setLocalStream,
    remoteStream,
    setRemoteStream,
    pcRef,
    localStreamRef,
    remoteStreamRef,
    localVideoRef,
    remoteVideoRef,
    statsIntervalRef,
    localCandidatesAddedRef,
    remoteCandidatesAddedRef,
    mediaRecorderRef,
    audioChunksRef,
    savedAccounts,
    setSavedAccounts,
    chatMessagesEndRef,
    showPhotoMenu,
    setShowPhotoMenu,
    cameraActive,
    setCameraActive,
    capturedImage,
    setCapturedImage,
    activeFilter,
    setActiveFilter,
    canvasDrawing,
    setCanvasDrawing,
    photoCaption,
    setPhotoCaption,
    isDrawing,
    setIsDrawing,
    brushColor,
    setBrushColor,
    myUploadedStory,
    setMyUploadedStory,
    myStorySnaps,
    setMyStorySnaps,
    neighborStories,
    setNeighborStories,
    mutedStoryUserIds,
    setMutedStoryUserIds,
    toggleMuteNeighborStories,
    storyUploadData,
    setStoryUploadData,
    storyCompositionCaption,
    setStoryCompositionCaption,
    storyCompositionPrivacy,
    setStoryCompositionPrivacy,
    storyCompositionCustomList,
    setStoryCompositionCustomList,
    isPublishingStory,
    setIsPublishingStory,
    playingStorySnaps,
    setPlayingStorySnaps,
    playingSnapIndex,
    setPlayingSnapIndex,
    isStoryPaused,
    setIsStoryPaused,
    storyViewerReplies,
    setStoryViewerReplies,
    showStoryViewerList,
    setShowStoryViewerList,
    isMutedStoriesExpanded,
    setIsMutedStoriesExpanded,
    storyViewer,
    setStoryViewer,
    storyPlaylist,
    setStoryPlaylist,
    storyPlaylistIndex,
    setStoryPlaylistIndex,
    showStoryChoiceModal,
    setShowStoryChoiceModal,
    showAddFriendsModal,
    setShowAddFriendsModal,
    audioFeedback,
    setAudioFeedback,
    firestoreQuotaExceeded,
    setFirestoreQuotaExceeded,
    googleBillingError,
    setGoogleBillingError,
    dismissedIframeWarning,
    setDismissedIframeWarning,
    replyingToMessage,
    setReplyingToMessage,
    activeChatSearchQuery,
    setActiveChatSearchQuery,
    showActiveChatSearch,
    setShowActiveChatSearch,
    showForwardModal,
    setShowForwardModal,
    simulatedTypingMap,
    setSimulatedTypingMap,
    blockedNeighborIds,
    setBlockedNeighborIds,
    mutedNeighborIds,
    setMutedNeighborIds,
    unreadNeighborIds,
    setUnreadNeighborIds,
    longPressedNeighborForMenu,
    setLongPressedNeighborForMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    emojiCategory,
    setEmojiCategory,
    emojiSearchQuery,
    setEmojiSearchQuery,
    recentlyUsedEmojis,
    setRecentlyUsedEmojis,
    selectedSkinTone,
    setSelectedSkinTone,
    isLockVoiceRecording,
    setIsLockVoiceRecording,
    voicePlaybackSpeedMap,
    setVoicePlaybackSpeedMap,
    showMediaGalleryModal,
    setShowMediaGalleryModal,
    activeMediaGalleryTab,
    setActiveMediaGalleryTab,
    currentSearchMatchIndex,
    setCurrentSearchMatchIndex,
    searchMatchIds,
    setSearchMatchIds,
    isMessageSelectMode,
    setIsMessageSelectMode,
    selectedMessageIds,
    setSelectedMessageIds,
    editingMessage,
    setEditingMessage,
    showMessageInfoModal,
    setShowMessageInfoModal,
    archivedNeighborIds,
    setArchivedNeighborIds,
    showArchivedOnly,
    setShowArchivedOnly,
    swipeOffsetMsgId,
    setSwipeOffsetMsgId,
    swipeOffsetAmount,
    setSwipeOffsetAmount,
    touchStartX,
    setTouchStartX,
    touchStartY,
    setTouchStartY,
    handleMessageTouchStart,
    handleMessageTouchMove,
    handleMessageTouchEnd,
    activeBubbleDropdownId,
    setActiveBubbleDropdownId,
    isOnline,
    setIsOnline,
    isRecordingVoice,
    setIsRecordingVoice,
    voiceDuration,
    setVoiceDuration,
    playingVoiceId,
    setPlayingVoiceId,
    voiceRecordingLocked,
    setVoiceRecordingLocked,
    handleSendResetLink,
    loginWithGoogle,
    loginWithEmailOrPhone,
    saveOnboardingDetails,
    logoutUser,
    loadLocalAccountsFromDisk,
    scrollToLastMessage,
    saveOrUpdateMessageInFirestore,
    markMessagesAsRead,
    handleMarkAllNotificationsRead,
    handleClearAllNotifications,
    handleDeleteNotification,
    handleToggleReadNotification,
    getGroupedNotifications,
    neighborStoryUnsubsRef,
    videoRef,
    canvasRef,
    audioContextRef,
    callTimerRef,
    voiceRecorderTimerRef,
    queuedCandidatesRef,
    storyProgress,
    setStoryProgress,
    markStoryAsViewedInFirestore,
    handleStoryViewerNext,
    handleStoryViewerPrev,
    playNotificationSound,
    triggerBeep,
    playSynthesizedVoiceNote,
    playVoiceNote,
    startCall,
    receiveCallSimulation,
    answerIncomingCall,
    endCall,
    switchCamera,
    toggleMicMute,
    toggleVideoOff,
    triggerSimulatedResponse,
    sendMessage,
    handleReaction,
    handleDeleteForMe,
    handleDeleteForEveryone,
    handleForwardMessage,
    startCamera,
    capturePhoto,
    closeCamera,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    postToMyStory,
    sendCapturedSnapDirectly,
    startRecordingVoice,
    stopAndSendVoice,
    cancelRecordingVoice,
    verifyPremiumSelection,
    handleProcessPayment,
    handleCreateGroup,
    handleRateNeighbor,
    handleScheduleMeetup,
    handleCancelMeetup,
    handleReportNeighbor,
    handleAddNewFriend,
    handleAcceptFriendRequest,
    actuallyAddFriend,
    sendPrivateMessageToNeighbor,
    onOpenNeighborChat,
    handleDeclineFriendRequest,
    handleTogglePinChat,
    actuallyPinChat,
    handleToggleArchiveChat,
    handleToggleBlockNeighbor,
    handleToggleMuteNeighbor,
    handleToggleUnreadNeighbor,
    handleDeleteChat,
    handleExportChat,
    handleEditMessage,
    handleToggleStarMessage,
    handleBulkDeleteMessages,
    handleBulkForwardMessages,
    saveContactsToFirestore,
    handleSyncContacts,
    executeContactsSyncAfterPermission,
    handleAddMyNote,
    startStoryPlaylist,
    formatStreetName,
    formatDistanceMeters,
    getAccentBg,
    getAccentText,
    getAccentBorder,
    theme,
    filteredNeighbors,
    sortedChatList,
  };
}

export type NearbyRuntime = ReturnType<typeof useNearbyController>;
