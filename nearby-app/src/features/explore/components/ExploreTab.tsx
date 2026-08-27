import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  MapPin, 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Plus, 
  X, 
  Sparkles, 
  Users, 
  ShieldAlert, 
  EyeOff, 
  Check, 
  Clock, 
  Flame, 
  CheckCheck,
  Send,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  Megaphone,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import { db, auth, collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc, uploadToStorage, createNotification } from '../../../firebase';
import { Neighbor } from '../../../types';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  authorColor: string;
  type: 'post' | 'event' | 'community_update';
  content: string;
  mediaUrl?: string;
  likes: string[]; // User IDs
  saves: string[]; // User IDs
  comments: Array<{
    id: string;
    authorName: string;
    authorEmoji: string;
    text: string;
    timestamp: string;
  }>;
  distanceMeters: number;
  streetName: string;
  timestamp: string;
  communityId?: string;
}

interface Community {
  id: string;
  name: string;
  category: 'campus' | 'neighborhood' | 'estate' | 'professional' | 'professional' | 'general';
  description: string;
  memberCount: number;
  locationName: string;
  image: string;
  moderator: string;
  isCustom?: boolean;
}

interface CrossedPath {
  id: string;
  neighborId: string;
  neighborName: string;
  neighborEmoji: string;
  neighborColor: string;
  locationName: string;
  timestamp: string;
}

interface ExploreTabProps {
  currentUser: any;
  userCoords: { lat: number; lng: number } | null;
  selectedPreset: any;
  neighbors: Neighbor[];
  appTheme: 'dark' | 'light';
  theme: any;
  triggerBeep: (freq: number, duration: number) => void;
  onSendDirectMessage: (neighborId: string, text: string) => void;
  onOpenNeighborChat: (neighborId: string) => void;
  friendIds: string[];
  friendRequests: string[];
  onAddFriend: (neighborId: string) => void;
  onViewNeighborProfile?: (neighbor: Neighbor) => void;
}

const ExploreTab = React.memo(function ExploreTab({
  currentUser,
  userCoords,
  selectedPreset,
  neighbors,
  appTheme,
  theme,
  triggerBeep,
  onSendDirectMessage,
  onOpenNeighborChat,
  friendIds,
  friendRequests,
  onAddFriend,
  onViewNeighborProfile
}: ExploreTabProps) {
  // Navigation inside Explore
  const [exploreSubTab, setExploreSubTab] = useState<'proximity' | 'meetups' | 'crossed' | 'safety'>('proximity');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Proximity filter search');
  const [showAdvancedSafety, setShowAdvancedSafety] = useState(false);



  // --- STATE FOR DISCOVERY FEED ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostType, setNewPostType] = useState<'post' | 'event' | 'community_update'>('post');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [feedDistance, setFeedDistance] = useState<number>(1500); // meters slider filter
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postIdForSharing, setPostIdForSharing] = useState<string | null>(null);

  // --- STATE FOR COMMUNITIES ---
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>(['comm-1', 'comm-3']);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [communityAnnouncment, setCommunityAnnouncement] = useState('');
  const [communityDiscussions, setCommunityDiscussions] = useState<Record<string, Array<{id: string, authorName: string, text: string, time: string}>>>({
    'comm-1': [
      { id: 'cd-1', authorName: 'Tunde Yaba', text: 'Does anyone know if the local market is open today?', time: '2 hours ago' },
      { id: 'cd-2', authorName: 'Chidi Lekki', text: 'Yes, it is open until 6pm.', time: '1 hour ago' }
    ]
  });
  const [newCommunityDiscussionText, setNewCommunityDiscussionText] = useState('');

  // --- STATE FOR AI ICEBREAKER ---
  const [generatingIcebreakerForNeighbor, setGeneratingIcebreakerForNeighbor] = useState<Neighbor | null>(null);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [loadingIcebreakers, setLoadingIcebreakers] = useState(false);
  const [customStarterText, setCustomStarterText] = useState('');

  // --- STATE FOR TRUST AND SAFETY ---
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isFriendsOnly, setIsFriendsOnly] = useState(false);
  const [isEmergencyHide, setIsEmergencyHide] = useState(false);
  const [reportedUser, setReportedUser] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [privacyBlockCrossed, setPrivacyBlockCrossed] = useState(false);
  const [privacyFuzzyLocation, setPrivacyFuzzyLocation] = useState(false);

  // --- COMPONENT LEVEL FEEDBACK ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- GOOGLE MAPS PLACES API MEETUP SYSTEM ---
  interface MeetupSpot {
    id: string;
    name: string;
    desc: string;
    address: string;
    distanceMeters: number;
    rating: number;
    userRatingCount: number;
    type: string;
    img: string;
    openNow?: string | null;
    lat: number;
    lng: number;
    sec: string;
  }

  const placesLib = useMapsLibrary('places');
  const [liveMeetupSpots, setLiveMeetupSpots] = useState<MeetupSpot[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(false);
  const [placesApiError, setPlacesApiError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const generateDynamicLocalMeetups = (center: { lat: number; lng: number }): MeetupSpot[] => {
    const getStreetName = (index: number) => {
      if (selectedPreset?.streets && selectedPreset.streets.length > 0) {
        return selectedPreset.streets[index % selectedPreset.streets.length];
      }
      const fallbackStreets = ["Ahmadu Bello Way", "Airport Road", "Herbert Macaulay Way", "Murtala Mohammed Highway", "Marina Crescent", "Commercial Avenue", "Ziks Avenue", "Marian Road", "Azikiwe Road"];
      return fallbackStreets[index % fallbackStreets.length];
    };

    const cityName = selectedPreset?.city || "Local Area";

    const templates = [
      {
        id: 'fb-cafe-1',
        name: `${getStreetName(0)} Cafe & Workspace`,
        type: 'Café',
        desc: 'Café near you. Active, highly visible public space with professional security.',
        sec: '🛡️ Active Security & Bright Indoor Lighting',
        rating: 4.8,
        userRatingCount: 242,
        img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop',
        latOffset: 0.0022,
        lngOffset: -0.0018
      },
      {
        id: 'fb-mall-1',
        name: `${cityName} Central Plaza`,
        type: 'Shopping Mall',
        desc: 'Shopping Mall near you. Active, highly visible public space with mall security and CCTV.',
        sec: '🛡️ 24/7 CCTV & Mall Guards',
        rating: 4.6,
        userRatingCount: 410,
        img: 'https://images.unsplash.com/photo-1560684352-8497838a2229?w=400&auto=format&fit=crop',
        latOffset: -0.0035,
        lngOffset: 0.0028
      },
      {
        id: 'fb-rest-1',
        name: `${getStreetName(1)} Bistro & Grill`,
        type: 'Restaurant',
        desc: 'Restaurant near you. Active, highly visible public space with bright lighting.',
        sec: '🛡️ Active Security & Bright Indoor Lighting',
        rating: 4.5,
        userRatingCount: 189,
        img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop',
        latOffset: 0.0048,
        lngOffset: 0.0051
      },
      {
        id: 'fb-park-1',
        name: `${cityName} Recreation Park`,
        type: 'Public Park',
        desc: 'Public Park near you. Active, highly visible public space with ranger patrols.',
        sec: '🛡️ Community Presence & Ranger Patrols',
        rating: 4.4,
        userRatingCount: 95,
        img: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=400&auto=format&fit=crop',
        latOffset: -0.0015,
        lngOffset: -0.0042
      },
      {
        id: 'fb-univ-1',
        name: `${cityName} Campus Study Atrium`,
        type: 'University',
        desc: 'University space near you. Active, highly visible campus space with campus patrols.',
        sec: '🛡️ Campus Patrols & Public Access',
        rating: 4.3,
        userRatingCount: 78,
        img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop',
        latOffset: 0.0062,
        lngOffset: -0.0035
      },
      {
        id: 'fb-lib-1',
        name: `${getStreetName(2)} Public Library`,
        type: 'Library',
        desc: 'Library space near you. Quiet, monitored, highly secure public study space.',
        sec: '🛡️ Monitored Access & Public Security',
        rating: 4.5,
        userRatingCount: 156,
        img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&auto=format&fit=crop',
        latOffset: -0.0052,
        lngOffset: -0.0012
      },
      {
        id: 'fb-comm-1',
        name: `${getStreetName(3)} Community Civic Hall`,
        type: 'Community Center',
        desc: 'Community Center near you. Monitored public venue for local neighborhood gatherings.',
        sec: '🛡️ Local Community Patrols & Support',
        rating: 4.2,
        userRatingCount: 43,
        img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&auto=format&fit=crop',
        latOffset: 0.0011,
        lngOffset: 0.0068
      }
    ];

    return templates.map((t, idx) => {
      const spotLat = center.lat + t.latOffset;
      const spotLng = center.lng + t.lngOffset;
      const distance = getDistance(center.lat, center.lng, spotLat, spotLng);
      return {
        id: t.id,
        name: t.name,
        desc: t.desc,
        address: `${getStreetName(idx)}, ${cityName}`,
        distanceMeters: Math.round(distance),
        rating: t.rating,
        userRatingCount: t.userRatingCount,
        type: t.type,
        img: t.img,
        openNow: 'Open Now',
        lat: spotLat,
        lng: spotLng,
        sec: t.sec
      };
    });
  };

  // User's current live GPS coordinates obtained directly from the device
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [liveGpsError, setLiveGpsError] = useState<string | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState<boolean>(false);
  const placesRetryCount = React.useRef<number>(0);

  const fetchLiveGpsCoords = () => {
    if (!navigator.geolocation) {
      if (userCoords && userCoords.lat && userCoords.lng) {
        setLiveGpsCoords({ lat: userCoords.lat, lng: userCoords.lng });
        setLiveGpsError(null);
      } else {
        setLiveGpsError("Unable to determine your current location. Please enable GPS and try again.");
      }
      return;
    }
    setIsFetchingGps(true);
    setLiveGpsError(null);

    const onGpsSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      if (latitude && longitude) {
        setLiveGpsCoords({ lat: latitude, lng: longitude });
        setLiveGpsError(null);
      } else {
        if (userCoords && userCoords.lat && userCoords.lng) {
          setLiveGpsCoords({ lat: userCoords.lat, lng: userCoords.lng });
          setLiveGpsError(null);
        } else {
          setLiveGpsError("Unable to determine your current location. Please enable GPS and try again.");
        }
      }
      setIsFetchingGps(false);
    };

    navigator.geolocation.getCurrentPosition(
      onGpsSuccess,
      (error) => {
        console.warn("High-accuracy GPS fetch failed, trying standard-accuracy backup...", error);
        navigator.geolocation.getCurrentPosition(
          onGpsSuccess,
          (fbError) => {
            console.warn("Safe Meetups GPS fetch note (handled):", fbError);
            if (userCoords && userCoords.lat && userCoords.lng) {
              setLiveGpsCoords({ lat: userCoords.lat, lng: userCoords.lng });
              setLiveGpsError(null);
            } else {
              setLiveGpsError("Unable to determine your current location. Please enable GPS and try again.");
            }
            setIsFetchingGps(false);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
    );
  };

  const centerCoords = liveGpsCoords;

  // Synchronize activeCategory with exploreSubTab
  useEffect(() => {
    if (activeCategory === 'Proximity filter search') {
      setExploreSubTab('proximity');
    } else if (activeCategory === 'MeetUps' || activeCategory === 'Meetups') {
      setExploreSubTab('meetups');
    } else if (activeCategory === 'Crossed Paths') {
      setExploreSubTab('crossed');
    } else if (activeCategory === 'Safety & Privacy') {
      setExploreSubTab('safety');
    }
  }, [activeCategory]);

  useEffect(() => {
    if (exploreSubTab === 'meetups') {
      fetchLiveGpsCoords();

      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (latitude && longitude) {
              setLiveGpsCoords((prev) => {
                if (!prev) {
                  return { lat: latitude, lng: longitude };
                }
                const dist = getDistance(prev.lat, prev.lng, latitude, longitude);
                if (dist > 50) {
                  // User's location changed significantly (> 50m)
                  return { lat: latitude, lng: longitude };
                }
                return prev;
              });
              setLiveGpsError(null);
            }
          },
          (error) => {
            console.warn("GPS watch position error in meetups:", error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );

        return () => {
          navigator.geolocation.clearWatch(watchId);
        };
      }
    }
  }, [exploreSubTab]);

  useEffect(() => {
    if (!centerCoords) return;

    let active = true;

    const fetchPlacesWithCaching = async () => {
      setLoadingPlaces(true);
      setPlacesApiError(null);

      // 1. Try Firestore Cache First
      try {
        const safeMeetupsSnapshot = await getDocs(collection(db, 'safeMeetups'));
        const cachedSpots: MeetupSpot[] = [];
        
        if (safeMeetupsSnapshot && safeMeetupsSnapshot.docs) {
          for (const docSnap of safeMeetupsSnapshot.docs) {
            const data = docSnap.data();
            if (data && data.placeId && data.latitude && data.longitude) {
              const distance = getDistance(centerCoords.lat, centerCoords.lng, data.latitude, data.longitude);
              if (distance <= feedDistance) {
                cachedSpots.push({
                  id: data.placeId,
                  name: data.name || 'Safe Meetup Spot',
                  desc: `${data.type || 'Public Spot'} near you. Active, highly visible public space.`,
                  address: data.address || 'Nearby Area',
                  distanceMeters: Math.round(distance),
                  rating: data.rating || 4.5,
                  userRatingCount: 15,
                  type: data.type || 'Public Spot',
                  img: data.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop',
                  openNow: 'Open Now',
                  lat: data.latitude,
                  lng: data.longitude,
                  sec: data.type === 'Café' ? '🛡️ Active Security & Bright Indoor Lighting' :
                       data.type === 'Shopping Mall' ? '🛡️ 24/7 CCTV & Mall Guards' :
                       data.type === 'Public Park' ? '🛡️ Community Presence & Ranger Patrols' :
                       data.type === 'University' || data.type === 'School' ? '🛡️ Campus Patrols & Public Access' :
                       data.type === 'Library' ? '🛡️ Campus Patrols & Public Access' :
                       data.type === 'Community Center' ? '🛡️ Local Community Patrols & Support' :
                       '🛡️ Active Public Street Visibility'
                });
              }
            }
          }
        }

        if (active && cachedSpots.length >= 3) {
          cachedSpots.sort((a, b) => a.distanceMeters - b.distanceMeters);
          console.log(`Found ${cachedSpots.length} safe meetup spots cached in Firestore! Skipping Google Places API call.`);
          setLiveMeetupSpots(cachedSpots);
          setLoadingPlaces(false);
          setIsFallbackMode(false);
          return;
        }
      } catch (e) {
        console.warn("Failed to load cached safe meetups from Firestore, falling back to Google Places API:", e);
      }

      // 2. If placesLib is not ready, use dynamic fallback generator
      if (!placesLib) {
        if (active) {
          const fallbackSpots = generateDynamicLocalMeetups(centerCoords);
          setLiveMeetupSpots(fallbackSpots);
          setIsFallbackMode(true);
          setLoadingPlaces(false);
        }
        return;
      }

      // 3. Query Google Places API
      try {
        const centerLatLng = new google.maps.LatLng(centerCoords.lat, centerCoords.lng);
        const searchTypes = [
          'restaurant',
          'cafe',
          'shopping_mall',
          'park',
          'university',
          'library',
          'community_center'
        ];

        const promises = searchTypes.map((type) => {
          return placesLib.Place.searchNearby({
            locationRestriction: {
              center: centerLatLng,
              radius: 5000
            },
            includedTypes: [type],
            fields: [
              'id',
              'displayName',
              'location',
              'formattedAddress',
              'rating',
              'userRatingCount',
              'photos',
              'types'
            ],
            maxResultCount: 15
          }).then(({ places }) => places || [])
            .catch((err) => {
              console.error(`Places search failed for type ${type}:`, err);
              const errMsg = err?.message || String(err);
              if (
                errMsg.includes('PERMISSION_DENIED') || 
                errMsg.includes('disabled') || 
                errMsg.includes('blocked') || 
                errMsg.includes('not been used in project') || 
                errMsg.includes('SearchNearby are blocked')
              ) {
                setPlacesApiError(errMsg);
              } else if (
                errMsg.includes('Quota exceeded') ||
                errMsg.includes('RESOURCE_EXHAUSTED') ||
                errMsg.includes('quota') ||
                errMsg.includes('limit')
              ) {
                setPlacesApiError("QUOTA_EXHAUSTED");
              }
              return [];
            });
        });

        const resultsArray = await Promise.all(promises);
        if (!active) return;

        const spots: MeetupSpot[] = [];
        const seenIds = new Set<string>();

        const acceptedTypes = new Set([
          'restaurant',
          'cafe',
          'shopping_mall',
          'park',
          'university',
          'library',
          'community_center',
          'school',
          'book_store',
          'supermarket',
          'shopping'
        ]);

        for (const list of resultsArray) {
          if (!list) continue;
          for (const place of list) {
            if (place && place.id && !seenIds.has(place.id)) {
              const placeTypes = place.types || [];
              const isSuitablePublic = placeTypes.some(t => acceptedTypes.has(t));
              if (!isSuitablePublic) continue;

              seenIds.add(place.id);

              const loc = place.location;
              const placeLat = loc ? loc.lat() : centerCoords.lat;
              const placeLng = loc ? loc.lng() : centerCoords.lng;
              const distance = getDistance(centerCoords.lat, centerCoords.lng, placeLat, placeLng);

              let readableType = 'Public Spot';
              let secFeature = '🛡️ Active Public Street Visibility';
              
              if (placeTypes.includes('restaurant')) {
                readableType = 'Restaurant';
                secFeature = '🛡️ Active Security & Bright Indoor Lighting';
              } else if (placeTypes.includes('cafe')) {
                readableType = 'Café';
                secFeature = '🛡️ Active Security & Bright Indoor Lighting';
              } else if (placeTypes.includes('shopping_mall')) {
                readableType = 'Shopping Mall';
                secFeature = '🛡️ 24/7 CCTV & Mall Guards';
              } else if (placeTypes.includes('park')) {
                readableType = 'Public Park';
                secFeature = '🛡️ Community Presence & Ranger Patrols';
              } else if (placeTypes.includes('university') || placeTypes.includes('school')) {
                readableType = 'University';
                secFeature = '🛡️ Campus Patrols & Public Access';
              } else if (placeTypes.includes('library')) {
                readableType = 'Library';
                secFeature = '🛡️ Campus Patrols & Public Access';
              } else if (placeTypes.includes('community_center')) {
                readableType = 'Community Center';
                secFeature = '🛡️ Local Community Patrols & Support';
              }

              let imgUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop';
              if (place.photos && place.photos.length > 0) {
                try {
                  imgUrl = place.photos[0].getURI({ maxWidth: 400 });
                } catch (e) {
                  console.warn('Error getting place photo URL:', e);
                }
              } else {
                if (readableType === 'Café') {
                  imgUrl = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop';
                } else if (readableType === 'Public Park') {
                  imgUrl = 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=400&auto=format&fit=crop';
                } else if (readableType === 'Restaurant') {
                  imgUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop';
                } else if (readableType === 'Shopping Mall') {
                  imgUrl = 'https://images.unsplash.com/photo-1560684352-8497838a2229?w=400&auto=format&fit=crop';
                } else if (readableType === 'University') {
                  imgUrl = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop';
                } else if (readableType === 'Library') {
                  imgUrl = 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&auto=format&fit=crop';
                } else if (readableType === 'Community Center') {
                  imgUrl = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&auto=format&fit=crop';
                }
              }

              // Cache the spot in Firestore safeMeetups
              const parts = (place.formattedAddress || '').split(',').map(s => s.trim());
              const country = parts.length > 0 ? parts[parts.length - 1] : "Nigeria";
              const state = parts.length > 1 ? parts[parts.length - 2] : "Lagos";
              const city = parts.length > 2 ? parts[parts.length - 3] : "Lagos";

              try {
                setDoc(doc(db, 'safeMeetups', place.id), {
                  placeId: place.id,
                  name: place.displayName || 'Safe Meetup Spot',
                  latitude: placeLat,
                  longitude: placeLng,
                  type: readableType,
                  address: place.formattedAddress || 'Nearby Area',
                  rating: place.rating || 4.5,
                  photo: imgUrl,
                  city,
                  state,
                  country
                });
              } catch (err) {
                console.warn("Failed to write safe meetup cache doc:", err);
              }

              spots.push({
                id: place.id,
                name: place.displayName || 'Safe Meetup Spot',
                desc: `${readableType} near you. Active, highly visible public space.`,
                address: place.formattedAddress || 'Nearby Area',
                distanceMeters: Math.round(distance),
                rating: place.rating || 4.5,
                userRatingCount: place.userRatingCount || 12,
                type: readableType,
                img: imgUrl,
                openNow: 'Open Now',
                lat: placeLat,
                lng: placeLng,
                sec: secFeature
              });
            }
          }
        }

        spots.sort((a, b) => a.distanceMeters - b.distanceMeters);
        const validSpots = spots.filter(spot => spot.distanceMeters <= feedDistance);

        if (spots.length === 0) {
          console.log("No spots returned from Google Places API. Triggering dynamic safe meetup fallback generator.");
          const fallbackSpots = generateDynamicLocalMeetups(centerCoords);
          setLiveMeetupSpots(fallbackSpots);
          setIsFallbackMode(true);
        } else if (validSpots.length === 0) {
          console.warn("Google returned places, but they are all too distant from current GPS coords!");
          setLiveMeetupSpots([]);
          if (placesRetryCount.current < 2) {
            placesRetryCount.current += 1;
            fetchLiveGpsCoords();
          }
        } else {
          placesRetryCount.current = 0;
          setLiveMeetupSpots(validSpots);
          setIsFallbackMode(false);
        }
      } catch (err) {
        console.error("Error fetching places:", err);
        const fallbackSpots = generateDynamicLocalMeetups(centerCoords);
        setLiveMeetupSpots(fallbackSpots);
        setIsFallbackMode(true);
      } finally {
        if (active) {
          setLoadingPlaces(false);
        }
      }
    };

    fetchPlacesWithCaching();

    return () => {
      active = false;
    };
  }, [placesLib, centerCoords?.lat, centerCoords?.lng]);

  const getMeetupsToDisplay = (): MeetupSpot[] => {
    // Only return live meetup spots geographically close to user's live location (within configured search radius).
    // Never return default, demo, or placeholder locations from other cities.
    if (!liveGpsCoords) return [];
    return (liveMeetupSpots || []).filter(spot => spot.distanceMeters <= feedDistance);
  };

  const getRankedSpots = (): MeetupSpot[] => {
    const spots = getMeetupsToDisplay();
    return [...spots].sort((a, b) => {
      // 1. Public Accessibility Score (High suitability for meetups)
      const getAccessibility = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('park') || t.includes('cafe') || t.includes('library') || t.includes('community')) return 10;
        if (t.includes('restaurant') || t.includes('shopping')) return 8;
        if (t.includes('university') || t.includes('school')) return 5;
        return 6;
      };
      
      const accessA = getAccessibility(a.type);
      const accessB = getAccessibility(b.type);

      // 2. User Ratings Score (rating)
      const ratingA = a.rating || 4.0;
      const ratingB = b.rating || 4.0;

      // 3. Popularity Score (userRatingCount)
      const popA = Math.min(50, Math.log10((a.userRatingCount || 0) + 1) * 15);
      const popB = Math.min(50, Math.log10((b.userRatingCount || 0) + 1) * 15);

      // 4. Distance Penalty (closer is better, penalize by 1 point per 50 meters)
      const distPenA = a.distanceMeters / 50;
      const distPenB = b.distanceMeters / 50;

      // Combine into final score
      const scoreA = (accessA * 5) + (ratingA * 10) + popA - distPenA;
      const scoreB = (accessB * 5) + (ratingB * 10) + popB - distPenB;

      return scoreB - scoreA;
    });
  };

  // --- STATE FOR DYNAMIC LOCAL COMMUNITIES ---
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommCategory, setNewCommCategory] = useState<'campus' | 'neighborhood' | 'estate' | 'professional' | 'general'>('general');
  const [newCommDescription, setNewCommDescription] = useState('');
  const [newCommImage, setNewCommImage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    triggerBeep(520, 0.08);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- RECONSTRUCTING NEIGHBORHOOD COMMUNITIES ---
  const defaultCommunities: Community[] = [];

  const [communities, setCommunities] = useState<Community[]>(() => {
    const saved = localStorage.getItem('explore_p2p_communities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Safe to ignore, fallback
      }
    }
    return defaultCommunities;
  });

  // --- GENERATING CROSSED PATHS SIMULATION ---
  const currentPresetName = selectedPreset?.name || 'Local';
  const crossedPathsData: CrossedPath[] = privacyBlockCrossed
    ? []
    : (neighbors || [])
        .filter(n => n.id !== 'user' && n.id !== 'nb-myai')
        .slice(0, 4)
        .map((n, idx) => {
          const locations = ["Central Plaza Mall", "Main Tech Café", "Bistro & Grill", "Recreation Park", "City Public Library"];
          const times = ["2 hours ago", "5 hours ago", "Yesterday", "3 days ago"];
          return {
            id: `cp-${n.id}-${idx}`,
            neighborId: n.id,
            neighborName: n.name,
            neighborEmoji: n.avatarEmoji || '👤',
            neighborColor: n.avatarColor || 'bg-brand-blue',
            locationName: locations[idx % locations.length],
            timestamp: times[idx % times.length]
          };
        });

  // --- FRIEND RADAR STATE & FILTERING ---
  const [radarFilterInterest, setRadarFilterInterest] = useState<string>('all');
  const [radarFilterAvailability, setRadarFilterAvailability] = useState<string>('all');
  const [radarFilterGender, setRadarFilterGender] = useState<string>('all');
  const [radarFilterAgeRange, setRadarFilterAgeRange] = useState<string>('all');

  // Extract all unique interests from neighbors
  const allInterests = Array.from(new Set([
    '📚 Study Partner',
    '🏃 Stroll Buddy',
    '💼 Business Networking',
    '🏋️ Gym Partner',
    '🎮 Gaming Buddy',
    '🙏 Christian Faith Discussion',
    '🙏 Muslim Faith Discussion',
    '🎨 Creative Collaboration',
    '🍲 Food Hangout',
    '🌍 New In Town',
    ...neighbors.flatMap(n => n.interests || [])
  ]));

  // Filter neighbors dynamically based on criteria
  const discoverableNeighbors = neighbors.filter(neighbor => {
    // Exclude myself
    if (neighbor.id === 'user' || neighbor.id === currentUser?.uid) return false;
    // Exclude blocked list
    if (blockedUsers.includes(neighbor.id)) return false;
    // Exclude My AI if looking for physical people
    if (neighbor.id === 'nb-myai') return false;
    
    // Check Radar Settings / Privacy modes in neighbors (Simulation)
    if (isEmergencyHide) return false;
    
    // Distance check
    if (neighbor.distanceMeters > feedDistance) return false;

    // Filters
    if (radarFilterInterest !== 'all' && !neighbor.interests?.includes(radarFilterInterest)) return false;
    
    // Filter by Gender
    if (radarFilterGender !== 'all') {
      const g = neighbor.gender || 'Male';
      if (g.toLowerCase() !== radarFilterGender.toLowerCase()) return false;
    }

    // Filter by Age Range
    if (radarFilterAgeRange !== 'all') {
      const a = neighbor.ageRange || '25-34';
      if (a !== radarFilterAgeRange) return false;
    }

    // Filter by Day/Time Availability
    if (radarFilterAvailability !== 'all') {
      const avail = neighbor.dayTimeAvailability || 'Available Right Now';
      if (radarFilterAvailability === 'now' && avail !== 'Available Right Now') return false;
      if (radarFilterAvailability === 'today' && avail !== 'Today') return false;
      if (radarFilterAvailability === 'tomorrow' && avail !== 'Tomorrow') return false;
      if (radarFilterAvailability === 'weekend' && avail !== 'This Weekend') return false;
    }
    
    // Location state coords safety
    return true;
  });

  // Prioritize nearby users with the most mutual interests, followed by general users
  const sortedDiscoverableNeighbors = [...discoverableNeighbors].sort((a, b) => {
    const myInterests = ['☕ Chat', '🎨 Creative Collaboration', '🍲 Food Hangout', '🌍 New In Town'];
    const aMutualCount = (a.interests || []).filter(interest => myInterests.includes(interest)).length;
    const bMutualCount = (b.interests || []).filter(interest => myInterests.includes(interest)).length;
    
    if (bMutualCount !== aMutualCount) {
      return bMutualCount - aMutualCount;
    }
    return a.distanceMeters - b.distanceMeters;
  });

  // --- FETCH / LOAD POSTS ---
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    try {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      unsubscribeFirestore = onSnapshot(postsQuery, (snapshot) => {
        const firestorePosts: Post[] = [];
        snapshot.forEach((doc) => {
          firestorePosts.push({ id: doc.id, ...doc.data() } as Post);
        });
        setPosts(firestorePosts);
      }, (err) => {
        console.warn("Firestore onSnapshot error on posts collection:", err);
        setPosts([]);
      });
    } catch (e) {
      console.warn("Firebase post collection listener setup failed.", e);
      setPosts([]);
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const loadLocalFallbackPosts = () => {
    setPosts([]);
  };

  const getSeedPosts = (): Post[] => {
    return [];
  };

  // --- ACTIONS ON FEED ---
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showToast('Please enter some text.');
      return;
    }

    const currentUid = currentUser?.uid || auth.currentUser?.uid || 'user';
    let finalMediaUrl = newPostMedia;
    if (newPostMedia && newPostMedia.startsWith('data:')) {
      try {
        const fileExtension = newPostMedia.includes('image/png') ? 'png' : newPostMedia.includes('image/gif') ? 'gif' : 'jpeg';
        const storagePath = `posts/${currentUid}/${Date.now()}.${fileExtension}`;
        finalMediaUrl = await uploadToStorage(newPostMedia, storagePath);
      } catch (uploadErr) {
        console.error("Storage upload failed for post image:", uploadErr);
        showToast('Image upload failed. Please check your connection and try again.');
        return;
      }
    }

    const newPost: Omit<Post, 'id'> = {
      authorId: currentUid,
      authorName: currentUser?.name || 'My Profile',
      authorEmoji: currentUser?.avatarEmoji || '🌟',
      authorColor: currentUser?.avatarColor || 'bg-brand-blue',
      type: newPostType,
      content: newPostContent,
      mediaUrl: finalMediaUrl || undefined,
      likes: [],
      saves: [],
      comments: [],
      distanceMeters: 10, // Always close
      streetName: selectedPreset?.streets[0] || 'Epicenter St',
      timestamp: 'Just now'
    };

    try {
      await addDoc(collection(db, 'posts'), {
        ...newPost,
        createdAt: new Date().toISOString()
      });
      showToast('Post published.');
    } catch (e) {
      console.error("Could not publish post to Firestore:", e);
      showToast('Failed to publish post.');
    }

    setNewPostContent('');
    setNewPostMedia('');
    setShowNewPostModal(false);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      showToast('Post deleted.');
    } catch (e) {
      console.error("Failed to delete post from Firestore:", e);
      showToast('Failed to delete post.');
    }
  };

  const handleCreateCommunity = () => {
    if (!newCommName.trim() || !newCommDescription.trim()) {
      showToast('Please enter a community name and description.');
      return;
    }
    const newCommId = 'comm-' + Date.now();
    const newComm: Community = {
      id: newCommId,
      name: newCommName,
      category: newCommCategory,
      description: newCommDescription,
      memberCount: 1, // Created by current user
      locationName: selectedPreset?.city || 'Lagos',
      image: newCommImage || 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400&auto=format&fit=crop',
      moderator: currentUser?.name || 'Administrator',
      isCustom: true
    };

    const updated = [newComm, ...communities];
    setCommunities(updated);
    localStorage.setItem('explore_p2p_communities', JSON.stringify(updated));
    setJoinedCommunityIds([...joinedCommunityIds, newCommId]);

    // Clear form fields
    setNewCommName('');
    setNewCommDescription('');
    setNewCommImage('');
    setShowCreateCommunityModal(false);
    showToast(`Created ${newCommName}.`);
  };

  const handleDeleteCommunity = (commId: string) => {
    const updated = communities.filter(c => c.id !== commId);
    setCommunities(updated);
    localStorage.setItem('explore_p2p_communities', JSON.stringify(updated));
    showToast('Community deleted.');
    if (selectedCommunityId === commId) {
      setSelectedCommunityId(null);
    }
  };

  const handleLikePost = async (postId: string) => {
    const userUid = auth.currentUser?.uid || 'user';
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    let newLikes = [...post.likes];
    if (newLikes.includes(userUid)) {
      newLikes = newLikes.filter(id => id !== userUid);
      triggerBeep(320, 0.05);
    } else {
      newLikes.push(userUid);
      triggerBeep(450, 0.05);
    }

    const updatedPosts = [...posts];
    updatedPosts[postIndex] = { ...post, likes: newLikes };
    setPosts(updatedPosts);

    const isLiking = !post.likes.includes(userUid);

    // Async try update Firestore
    try {
      const pDoc = doc(db, 'posts', postId);
      await updateDoc(pDoc, { likes: newLikes });

      if (isLiking && post.authorId && post.authorId !== userUid) {
        let likerName = 'A neighbor';
        if (auth.currentUser) {
          try {
            const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userSnap.exists()) {
              likerName = userSnap.data().name || 'A neighbor';
            }
          } catch (err) {
            console.warn("Failed to get user name for like notification:", err);
          }
        }
        await createNotification({
          userId: post.authorId,
          senderId: userUid,
          senderName: likerName,
          type: 'post_like',
          title: 'Post Liked',
          message: `${likerName} liked your post!`
        });
      }
    } catch (err) {
      console.log("Firestore update failed for likes.");
    }
  };

  const handleSavePost = (postId: string) => {
    const userUid = auth.currentUser?.uid || 'user';
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    let newSaves = [...post.saves];
    if (newSaves.includes(userUid)) {
      newSaves = newSaves.filter(id => id !== userUid);
      showToast('Removed from saved list! 📂');
    } else {
      newSaves.push(userUid);
      showToast('Discovery post saved securely to shelf! 📁');
    }

    const updatedPosts = [...posts];
    updatedPosts[postIndex] = { ...post, saves: newSaves };
    setPosts(updatedPosts);

    // Try Firestore
    try {
      const pDoc = doc(db, 'posts', postId);
      updateDoc(pDoc, { saves: newSaves });
    } catch (err) {}
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;

    const userUid = auth.currentUser?.uid || 'user';
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const newComment = {
      id: 'comment-' + Date.now(),
      authorName: currentUser?.name || 'Local User',
      authorEmoji: currentUser?.avatarEmoji || '🌟',
      text: commentText,
      timestamp: 'Just now'
    };

    const newComments = [...post.comments, newComment];
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = { ...post, comments: newComments };
    
    setPosts(updatedPosts);
    setCommentText('');
    setCommentingPostId(null);
    showToast('Comment published! 💬');

    try {
      const pDoc = doc(db, 'posts', postId);
      await updateDoc(pDoc, { comments: newComments });
    } catch (err) {}
  };

  // --- GENERATING ICEBREAKERS ONLINE/FALLBACK ---
  const handleOpenIcebreaker = async (neighbor: Neighbor) => {
    setGeneratingIcebreakerForNeighbor(neighbor);
    setLoadingIcebreakers(true);
    setIcebreakers([]);
    triggerBeep(450, 0.1);

    try {
      // Fast call to our backend Gemini API
      const response = await fetch('/api/ai-icebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            name: currentUser?.name || 'Physical Neighbor',
            interests: currentUser?.interests || ['football', 'agriculture', 'music', 'tech'],
            streetName: selectedPreset?.streets[0] || 'Linden Street'
          },
          neighborProfile: {
            name: neighbor.name,
            interests: neighbor.interests || [],
            streetName: neighbor.streetName || 'Walking distance'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIcebreakers(data.starters || []);
      } else {
        throw new Error("Icebreaker API error");
      }
    } catch (e) {
      // Local high quality rule matching fallback
      setTimeout(() => {
        const fallback = [
          `How far ${neighbor.name}! 🇳🇬 I noticed you live around here and are interested in ${neighbor.interests[0] || 'local things'}. Let's chat!`,
          `No wahala neighbor! Saw your profile and noticed we both share a lot in common. What's the latest at ${selectedPreset?.name}?`,
          `Nice meeting you on the radar, ${neighbor.name}! Saw you enjoy agriculture. Let's talk crops & farming! 🌾`
        ];
        setIcebreakers(fallback);
      }, 800);
    } finally {
      setLoadingIcebreakers(false);
    }
  };

  const handleSendIcebreakerMessage = (text: string) => {
    if (!generatingIcebreakerForNeighbor) return;
    onSendDirectMessage(generatingIcebreakerForNeighbor.id, text);
    triggerBeep(520, 0.08);
    setGeneratingIcebreakerForNeighbor(null);
    onOpenNeighborChat(generatingIcebreakerForNeighbor.id);
  };

  // --- TOGGLING VISIBILITY & SAFETY ---
  const handleToggleEmergencyHide = () => {
    const nextState = !isEmergencyHide;
    setIsEmergencyHide(nextState);
    if (nextState) {
      setIsGhostMode(true);
      showToast('⚠️ Emergency Hide Mode enabled! You are fully off the grid!');
    } else {
      showToast('Emergency Hide unlocked. Proximity radar connected! 📡');
    }
  };

  const handleAddCommunityDiscussion = () => {
    if (!selectedCommunityId || !newCommunityDiscussionText.trim()) return;
    const discussions = communityDiscussions[selectedCommunityId] || [];
    const newDisc = {
      id: 'cd-' + Date.now(),
      authorName: currentUser?.name || 'Anonymous Neighbor',
      text: newCommunityDiscussionText,
      time: 'Just now'
    };
    setCommunityDiscussions({
      ...communityDiscussions,
      [selectedCommunityId]: [...discussions, newDisc]
    });
    setNewCommunityDiscussionText('');
    triggerBeep(450, 0.05);
    showToast('Discussion thread started!');
  };

  // --- DETAILED DISCOVERY FILTERING ENGINE ---
  const activeCategoryLower = activeCategory.toLowerCase();

  // 1. Filter Neighbors
  const filteredNeighbors = sortedDiscoverableNeighbors.filter(nb => {
    const matchesQuery = !searchQuery || 
      nb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      nb.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      nb.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (nb.bio && nb.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === 'All' || activeCategory === 'People' || activeCategory === 'Proximity filter search' ||
      nb.interests.some(i => i.toLowerCase() === activeCategoryLower);

    return matchesQuery && matchesCategory;
  });

  // 2. Filter Events (Posts of type 'event')
  const filteredEvents = posts.filter(post => {
    if (post.type !== 'event') return false;

    const matchesQuery = !searchQuery || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || activeCategory === 'Meetups' || activeCategory === 'MeetUps' ||
      post.content.toLowerCase().includes(activeCategoryLower) ||
      activeCategoryLower === 'meetup' ||
      (post.saves && post.saves.includes(auth.currentUser?.uid || 'user') && activeCategory === 'Saved');

    return matchesQuery && matchesCategory;
  });

  // 3. Filter Safe Meetup Spots (Google Places API / fallbacks)
  const filteredPlaces = getRankedSpots().filter(spot => {
    const matchesQuery = !searchQuery || 
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      spot.desc.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || activeCategory === 'Meetups' || activeCategory === 'MeetUps' ||
      spot.type.toLowerCase().includes(activeCategoryLower) || 
      spot.desc.toLowerCase().includes(activeCategoryLower);

    return matchesQuery && matchesCategory;
  });

  // 4. Filter Communities
  const filteredCommunities = communities.filter(comm => {
    const matchesQuery = !searchQuery || 
      comm.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      comm.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || activeCategory === 'Meetups' || activeCategory === 'MeetUps' ||
      comm.name.toLowerCase().includes(activeCategoryLower) || 
      comm.description.toLowerCase().includes(activeCategoryLower);

    return matchesQuery && matchesCategory;
  });

  const hasSomeContent = activeCategory === 'Safety & Privacy' || activeCategory === 'Crossed Paths' || activeCategory === 'MeetUps' || activeCategory === 'Meetups' || activeCategory === 'Proximity filter search' || 
    filteredNeighbors.length > 0 || filteredEvents.length > 0 || filteredPlaces.length > 0 || filteredCommunities.length > 0;

  return (
    <div className={`h-full flex flex-col font-sans transition-all pb-16 overflow-hidden ${
      appTheme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-slate-50 text-neutral-900'
    }`}>
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-50 bg-[#9654EE] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold border border-white/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ======================================= */}
      {/*     PREMIUM SIGNATURE DISCOVERY HUB     */}
      {/* ======================================= */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-24 scroll-smooth" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        
        {/* Top Safe Area & Greeting (32px top padding) */}
        <div className="pt-8 px-5 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <h1 className={`text-3xl font-black tracking-tight font-sans ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                Discover Around You
              </h1>
              <p className={`text-xs font-semibold ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-500'}`}>
                Find people and experiences that match your interests.
              </p>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center space-x-1.5 bg-[#0F8A5F]/10 text-[#0F8A5F] px-2.5 py-1 rounded-full text-[10px] font-black border border-[#0F8A5F]/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F8A5F]"></span>
              <span>GPS Connected</span>
            </div>
          </div>

          {/* Large Premium Search Bar (height 58px, radius 20px) */}
          <div className={`relative flex items-center h-[58px] rounded-[20px] px-4 border transition-all duration-300 shadow-sm focus-within:ring-4 focus-within:ring-[#0F8A5F]/15 focus-within:border-[#0F8A5F] ${
            appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150'
          }`}>
            <span className="text-zinc-400 mr-3">
              <Compass className="w-5.5 h-5.5 text-zinc-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, hobbies, places..."
              className={`w-full bg-transparent border-none outline-none text-xs font-semibold placeholder-zinc-400 font-sans ${
                appTheme === 'dark' ? 'text-white' : 'text-neutral-900'
              }`}
            />
            <button
              onClick={() => {
                setActiveCategory('Safety & Privacy');
                triggerBeep(450, 0.05);
              }}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer flex items-center justify-center"
              title="Safety & Privacy Settings"
            >
              <SlidersHorizontal className="w-5 h-5 text-[#0F8A5F]" />
            </button>
          </div>

          {/* Category Chips Horizontal Scroll (height 42px) */}
          <div className="flex space-x-1.5 md:space-x-3 overflow-x-auto scrollbar-none py-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {['Proximity filter search', 'MeetUps', 'Crossed Paths', 'Safety & Privacy'].map((cat) => {
              const isActive = activeCategory === cat;
              // Shorten labels on mobile
              const shortLabel = cat === 'Proximity filter search' ? 'Proximity' :
                                 cat === 'Crossed Paths' ? 'Crossed' :
                                 cat === 'Safety & Privacy' ? 'Safety' :
                                 cat === 'MeetUps' ? 'Meetups' : cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    triggerBeep(400, 0.04);
                  }}
                  className={`h-9 md:h-[42px] px-3.5 md:px-5 rounded-full text-[11px] md:text-xs font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center select-none ${
                    isActive
                      ? 'bg-[#0F8A5F] text-white shadow-md shadow-[#0F8A5F]/20 hover:bg-[#0c734f]'
                      : appTheme === 'dark'
                        ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800'
                  }`}
                >
                  <span className="md:hidden">{shortLabel}</span>
                  <span className="hidden md:inline">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================== */}
        {/*   COMMUNITY DETAIL VIEW (WITH DISCUSSION ROOM) */}
        {/* ============================================== */}
        {selectedCommunityId ? (() => {
          const comm = communities.find(c => c.id === selectedCommunityId);
          if (!comm) return null;
          const discussions = communityDiscussions[selectedCommunityId] || [];
          
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-5 space-y-5"
            >
              {/* Back Header */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedCommunityId(null)}
                  className="p-1.5 rounded-full bg-zinc-100 dark:bg-neutral-900 text-zinc-500 dark:text-neutral-400 hover:text-zinc-800 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#0F8A5F]">Community Discussion Board</h2>
                  <span className="text-[10px] text-zinc-400 font-mono">Residing in {comm.locationName}</span>
                </div>
              </div>

              {/* Cover Banner */}
              <div className="h-40 rounded-[24px] overflow-hidden relative bg-neutral-900 shadow-sm border border-neutral-800">
                <img src={comm.image} alt={comm.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-base font-black truncate">{comm.name}</h3>
                  <p className="text-zinc-300 text-[10px] mt-0.5 line-clamp-1">{comm.description}</p>
                </div>
              </div>

              {/* Member stats */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-500">🟢 {comm.memberCount} Physical neighbors active</span>
                <button
                  onClick={() => {
                    setJoinedCommunityIds(joinedCommunityIds.filter(id => id !== comm.id));
                    setSelectedCommunityId(null);
                    showToast(`Left ${comm.name}`);
                  }}
                  className="text-red-500 text-[10px] font-black uppercase hover:underline"
                >
                  Leave Board
                </button>
              </div>

              {/* Discussions Lists */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-black block">Discussions Logs</span>
                <div className="space-y-3">
                  {discussions.map((disc) => (
                    <div key={disc.id} className={`p-4 rounded-[20px] border space-y-1.5 ${
                      appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150 shadow-sm'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">@{disc.authorName}</span>
                        <span className="text-[9px] text-zinc-400 font-mono">{disc.time}</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">{disc.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussion Compose typing */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-200/50 dark:border-neutral-800/40">
                <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Start new discussion thread</label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={newCommunityDiscussionText}
                    onChange={(e) => setNewCommunityDiscussionText(e.target.value)}
                    placeholder="Write details or ask neighbors warm questions..."
                    className={`flex-1 text-xs border rounded-xl px-3 py-2 outline-none h-10 ${
                      appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    onClick={handleAddCommunityDiscussion}
                    className="h-10 px-4 bg-[#0F8A5F] hover:bg-[#0c734f] text-white text-xs font-bold rounded-xl transition active:scale-95"
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })() : (
          
          /* ============================================== */
          /*          DISCOVERY MAGAZINE MAIN FEED          */
          /* ============================================== */
          <div className="p-5 space-y-8">
            
            {/* 1. SKELETON LOADING SHIMMER STATE (No spinners!) */}
            {(isFetchingGps || loadingPlaces) ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-6 bg-zinc-200 dark:bg-neutral-850 rounded w-1/4" />
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {[1, 2].map(n => (
                    <div key={n} className="w-64 h-48 bg-zinc-200 dark:bg-neutral-850 rounded-[24px] shrink-0" />
                  ))}
                </div>
                <div className="space-y-4">
                  {[1, 2].map(n => (
                    <div key={n} className="p-5 bg-zinc-200 dark:bg-neutral-850 rounded-[24px] h-32" />
                  ))}
                </div>
              </div>
            ) : !hasSomeContent ? (
              
              /* 2. PREMIUM EMPTY STATE */
              <div className="py-12">
                <div className="text-center py-16 px-5 flex flex-col items-center justify-center space-y-4 bg-white dark:bg-neutral-900 rounded-[24px] border border-zinc-100 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.01)] max-w-md mx-auto">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-3xl">
                    🔍
                  </div>
                  <div className="space-y-1.5">
                    <h3 className={`font-black text-lg font-sans ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                      Nothing New Yet
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                      Try adjusting your interests or expanding your search distance.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                      setFeedDistance(1500);
                      setRadarFilterInterest('all');
                      setRadarFilterGender('all');
                      setRadarFilterAgeRange('all');
                      setRadarFilterAvailability('all');
                      triggerBeep(520, 0.08);
                      showToast('Filters reset successfully!');
                    }}
                    className="px-5 py-2.5 bg-[#0F8A5F] hover:bg-[#0c734f] text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
                  >
                    Refresh Recommendations
                  </button>
                </div>
              </div>
            ) : (
              
              /* 3. MAGAZINE CONTENTS CONTAINER */
              <div className="space-y-10">
                
                {/* A. TRENDING NEARBY SECTION */}
                {(activeCategory === 'All' || activeCategory === 'MeetUps') && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-400'}`}>
                        🔥 Trending Nearby
                      </h2>
                      <button
                        onClick={() => {
                          setShowNewPostModal(true);
                          triggerBeep(450, 0.08);
                        }}
                        className="text-[11px] font-black text-[#0F8A5F] hover:underline"
                      >
                        + Post Vibe
                      </button>
                    </div>

                    <div className="flex space-x-4 overflow-x-auto scrollbar-none pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                      {[
                        {
                          id: 'trend-1',
                          title: `${selectedPreset?.name || 'Local'} Tech & Ideas Café`,
                          distance: '350m away',
                          participants: 12,
                          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop',
                          type: 'Meetup'
                        },
                        {
                          id: 'trend-2',
                          title: `Weekend Board Games Club`,
                          distance: '600m away',
                          participants: 8,
                          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop',
                          type: 'Activity'
                        },
                        {
                          id: 'trend-3',
                          title: `Sunrise Running Collective`,
                          distance: '1.2km away',
                          participants: 15,
                          image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&auto=format&fit=crop',
                          type: 'Sports'
                        }
                      ].map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ y: -4 }}
                          className="w-72 shrink-0 rounded-[24px] overflow-hidden bg-neutral-900 border border-neutral-800 shadow-md relative group snap-start"
                        >
                          <div className="h-44 bg-zinc-800 relative">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            
                            <span className="absolute top-3 left-3 text-[9px] bg-black/60 text-white font-black px-2 py-1 rounded-md uppercase tracking-wider">
                              ⚡ {item.type}
                            </span>
                            <span className="absolute bottom-3 left-3 text-[10px] text-white font-black flex items-center">
                              <MapPin className="w-3.5 h-3.5 text-[#0F8A5F] mr-0.5 animate-pulse" />
                              {item.distance}
                            </span>
                          </div>

                          <div className="p-4 space-y-3 text-white">
                            <h3 className="font-extrabold text-xs line-clamp-1 leading-tight">{item.title}</h3>
                            <div className="flex justify-between items-center text-[10px] pt-1">
                              <span className="text-zinc-400 font-medium">🙋‍♂️ {item.participants} neighbors active</span>
                              <button
                                onClick={() => {
                                  showToast(`Explored: "${item.title}"`);
                                  triggerBeep(520, 0.05);
                                }}
                                className="px-3 py-1.5 bg-[#0F8A5F] hover:bg-[#0c734f] text-white text-[10px] font-black rounded-lg transition active:scale-95"
                              >
                                Explore
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ADVANCED PROXIMITY FILTER CONTROLS */}
                {activeCategory === 'Proximity filter search' && (
                  <div className={`p-5 rounded-[24px] border space-y-4 ${
                    appTheme === 'dark' ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-zinc-150 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#0F8A5F]">
                      <Filter className="w-4 h-4" />
                      <span>Advanced Proximity Filters</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Interest Select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-450 font-bold block uppercase">By Interest / Goal</label>
                        <select
                          value={radarFilterInterest}
                          onChange={(e) => {
                            setRadarFilterInterest(e.target.value);
                            triggerBeep(420, 0.05);
                          }}
                          className={`w-full text-xs h-9 px-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8A5F] border ${
                            appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="all">🔍 All Interests</option>
                          {allInterests.map((interest, i) => (
                            <option key={i} value={interest}>{interest}</option>
                          ))}
                        </select>
                      </div>

                      {/* Availability Select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-450 font-bold block uppercase">Availability</label>
                        <select
                          value={radarFilterAvailability}
                          onChange={(e) => {
                            setRadarFilterAvailability(e.target.value);
                            triggerBeep(420, 0.05);
                          }}
                          className={`w-full text-xs h-9 px-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8A5F] border ${
                            appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="all">📅 Any Time</option>
                          <option value="now">⚡ Available Now</option>
                          <option value="today">Today</option>
                          <option value="tomorrow">Tomorrow</option>
                          <option value="weekend">This Weekend</option>
                        </select>
                      </div>

                      {/* Gender Select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-450 font-bold block uppercase">Gender</label>
                        <select
                          value={radarFilterGender}
                          onChange={(e) => {
                            setRadarFilterGender(e.target.value);
                            triggerBeep(420, 0.05);
                          }}
                          className={`w-full text-xs h-9 px-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8A5F] border ${
                            appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="all">👫 All Genders</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      {/* Age Range Select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-450 font-bold block uppercase">Age Range</label>
                        <select
                          value={radarFilterAgeRange}
                          onChange={(e) => {
                            setRadarFilterAgeRange(e.target.value);
                            triggerBeep(420, 0.05);
                          }}
                          className={`w-full text-xs h-9 px-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F8A5F] border ${
                            appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="all">Any Age</option>
                          <option value="18-24">18-24 years</option>
                          <option value="25-34">25-34 years</option>
                          <option value="35-44">35-44 years</option>
                          <option value="45+">45+ years</option>
                        </select>
                      </div>
                    </div>

                    {/* Distance Slider Filter */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-zinc-450 font-bold block uppercase">Maximum Distance</span>
                        <span className="text-xs font-mono font-bold text-[#0F8A5F]">{feedDistance} meters ({Math.round(feedDistance / 1000 * 10) / 10} km)</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="5000"
                        step="100"
                        value={feedDistance}
                        onChange={(e) => {
                          setFeedDistance(parseInt(e.target.value));
                        }}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#0F8A5F]"
                      />
                    </div>
                  </div>
                )}

                {/* B. PEOPLE YOU MAY LIKE (Vertical cards - spacing 24px) */}
                {(activeCategory === 'All' || activeCategory === 'Proximity filter search') && filteredNeighbors.length > 0 && (
                  <section className="space-y-4">
                    <h2 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-400'}`}>
                      👥 People You May Like
                    </h2>
                    
                    <div className="space-y-6">
                      {filteredNeighbors.map((nb) => {
                        const alreadyRequested = friendRequests.includes(nb.id);
                        const isFriend = (Array.isArray(friendIds) ? friendIds : []).includes(nb.id);
                        const mutualsCount = nb.interests?.filter(i => currentUser?.interests?.includes(i)).length || 0;
                        
                        return (
                          <motion.div
                            key={nb.id}
                            whileHover={{ y: -4 }}
                            className={`p-5 rounded-[24px] border transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.01)] ${
                              appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150'
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              {/* Profile Photo 72px */}
                              <div className="relative w-[72px] h-[72px] shrink-0 cursor-pointer" onClick={() => onViewNeighborProfile?.(nb)}>
                                {nb.customProfilePhoto ? (
                                  <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full rounded-full object-cover border-2 border-[#0F8A5F]" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className={`w-full h-full rounded-full ${nb.avatarColor || 'bg-zinc-200'} flex items-center justify-center text-3xl shadow-sm`}>
                                    {nb.avatarEmoji || '👤'}
                                  </div>
                                )}
                                {nb.verificationLevel === 'Verified' && (
                                  <span className="absolute -bottom-1 -right-1 bg-[#0F8A5F] text-white p-1 rounded-full border-2 border-white dark:border-neutral-900 shadow">
                                    <Check className="w-3 h-3" strokeWidth={3} />
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="font-extrabold text-sm truncate leading-tight cursor-pointer hover:text-[#0F8A5F] transition" onClick={() => onViewNeighborProfile?.(nb)}>
                                    {nb.name}
                                  </h3>
                                  <span className="text-[9px] font-black text-[#0F8A5F] bg-[#0F8A5F]/10 px-2 py-0.5 rounded-md border border-[#0F8A5F]/15 shrink-0">
                                    ⭐ {nb.trustScore || 96}% Trust
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">@{nb.username}</p>
                                
                                <div className="flex items-center space-x-2 mt-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                  <span className="flex items-center text-[#0F8A5F]">
                                    <MapPin className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
                                    {privacyFuzzyLocation 
                                      ? `~${Math.round(nb.distanceMeters / 100) * 100}m away (Fuzzed)` 
                                      : `${nb.distanceMeters}m away`
                                    }
                                  </span>
                                  <span>•</span>
                                  <span className="truncate">{nb.streetName || 'Nearby'}</span>
                                </div>
                              </div>
                            </div>

                            {nb.bio && (
                              <p className={`text-xs mt-3.5 leading-relaxed font-sans ${appTheme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                {nb.bio}
                              </p>
                            )}

                            {/* Interests tags */}
                            <div className="mt-4 space-y-2">
                              {mutualsCount > 0 && (
                                <p className="text-[10px] font-extrabold text-[#0F8A5F] flex items-center">
                                  <Sparkles className="w-3 h-3 mr-1 animate-spin-slow" />
                                  <span>{mutualsCount} Mutual Connections / Shared Interests</span>
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {nb.interests?.slice(0, 4).map((interest, i) => (
                                  <span key={i} className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${
                                    appTheme === 'dark'
                                      ? 'bg-neutral-950 border-neutral-800 text-neutral-400'
                                      : 'bg-zinc-50 border-zinc-150 text-zinc-600'
                                  }`}>
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions buttons */}
                            <div className="flex items-center space-x-3.5 mt-4.5 pt-3.5 border-t border-zinc-100 dark:border-neutral-800/60">
                              <button
                                onClick={() => {
                                  onOpenNeighborChat(nb.id);
                                  triggerBeep(450, 0.05);
                                }}
                                className={`flex-1 h-11 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer border ${
                                  appTheme === 'dark' 
                                    ? 'bg-neutral-950 border-neutral-800 hover:bg-neutral-850 text-zinc-300' 
                                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                <MessageSquare className="w-4 h-4 text-zinc-400" />
                                <span>Message</span>
                              </button>

                              {alreadyRequested ? (
                                <button className="flex-1 h-11 bg-zinc-100/50 dark:bg-neutral-900/50 text-zinc-400 text-xs font-black rounded-xl border border-dashed border-zinc-200 dark:border-neutral-800 cursor-not-allowed flex items-center justify-center space-x-1.5">
                                  <CheckCheck className="w-3.5 h-3.5 text-[#0F8A5F]" />
                                  <span>Pending...</span>
                                </button>
                              ) : isFriend ? (
                                <button className="flex-1 h-11 bg-[#0F8A5F]/10 text-[#0F8A5F] text-xs font-black rounded-xl flex items-center justify-center space-x-1 cursor-default border border-[#0F8A5F]/15">
                                  <span>Connected 🤝</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    onAddFriend(nb.id);
                                    triggerBeep(520, 0.08);
                                    showToast(`Connect requested to ${nb.name}`);
                                  }}
                                  className="flex-1 h-11 bg-[#0F8A5F] hover:bg-[#0c734f] text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95 shadow shadow-[#0F8A5F]/10"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Connect</span>
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* C. LOCAL EVENTS SECTION */}
                {(activeCategory === 'All' || activeCategory === 'MeetUps') && filteredEvents.length > 0 && (
                  <section className="space-y-4">
                    <h2 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-400'}`}>
                      📅 Local Activities & Events
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredEvents.map((post) => {
                        const hasSaved = post.saves?.includes(auth.currentUser?.uid || 'user') || false;
                        return (
                          <motion.div
                            key={post.id}
                            whileHover={{ y: -4 }}
                            className={`rounded-[24px] overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                              appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150'
                            }`}
                          >
                            <div className="h-44 relative bg-zinc-200">
                              <img src={post.mediaUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop'} alt="Banner" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"></div>
                              
                              <button
                                onClick={() => {
                                  handleSavePost(post.id);
                                  triggerBeep(420, 0.05);
                                }}
                                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/10"
                              >
                                <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              </button>
                              <span className="absolute bottom-3 left-3 text-[9px] bg-[#0F8A5F] text-white font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                📅 Activities
                              </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <h3 className={`font-extrabold text-sm leading-snug line-clamp-2 ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                                  {post.content}
                                </h3>
                                <div className="flex items-center space-x-3 text-[10px] font-bold text-zinc-400">
                                  <span className="flex items-center text-[#0F8A5F]">
                                    <MapPin className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
                                    {post.streetName}
                                  </span>
                                  <span>•</span>
                                  <span>{post.timestamp || 'Today'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-neutral-800/60">
                                <span className="text-[10px] font-extrabold text-zinc-500">🙋‍♂️ Dynamic local meetup</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`Meetup invitation: ${post.content} at ${post.streetName}`);
                                    showToast("Event details copied to clipboard!");
                                    triggerBeep(520, 0.05);
                                  }}
                                  className="h-8 px-4 bg-[#0F8A5F] hover:bg-[#0c734f] text-white rounded-lg text-xs font-black transition active:scale-95"
                                >
                                  Meetup
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* D. POPULAR PLACES SECTION */}
                {(activeCategory === 'All' || activeCategory === 'MeetUps') && filteredPlaces.length > 0 && (
                  <section className="space-y-4">
                    <h2 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-400'}`}>
                      📍 Popular Places & Meetup Spots
                    </h2>

                    <div className="flex space-x-4 overflow-x-auto scrollbar-none pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                      {filteredPlaces.map((spot) => (
                        <motion.div
                          key={spot.id}
                          whileHover={{ y: -4 }}
                          className={`w-72 shrink-0 rounded-[24px] overflow-hidden border flex flex-col justify-between snap-start ${
                            appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150'
                          }`}
                        >
                          <div className="h-36 relative bg-zinc-200">
                            <img src={spot.img} alt={spot.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
                            
                            <span className="absolute top-3 left-3 text-[9px] bg-white text-zinc-800 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow border border-zinc-100">
                              ☕ {spot.type}
                            </span>
                            <span className="absolute bottom-3 left-3 text-[10px] text-white font-black flex items-center">
                              <MapPin className="w-3.5 h-3.5 text-[#0F8A5F] mr-0.5 animate-pulse" />
                              {spot.distanceMeters}m away
                            </span>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                            <div>
                              <div className="flex items-start justify-between gap-1.5">
                                <h4 className={`font-extrabold text-xs truncate leading-tight flex-1 ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                                  {spot.name}
                                </h4>
                                <div className="flex items-center space-x-0.5 bg-amber-500/15 px-1.5 py-0.5 rounded text-amber-500 text-[9px] font-black shrink-0">
                                  <span>⭐</span>
                                  <span>{spot.rating.toFixed(1)}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                {spot.desc}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-neutral-800/60 text-[10px]">
                              <span className="font-extrabold text-[#0F8A5F]">🟢 {spot.openNow}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`Let's meet at ${spot.name}, address: ${spot.address}`);
                                  showToast(`Suggested "${spot.name}" as safe meetup spot!`);
                                  triggerBeep(480, 0.05);
                                }}
                                className="py-1.5 px-3 bg-[#0F8A5F]/15 hover:bg-[#0F8A5F]/25 text-[#0F8A5F] font-black rounded-lg transition active:scale-95"
                              >
                                Meet Here
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* E. BASED ON YOUR INTERESTS SECTION */}
                {(activeCategory === 'All' || activeCategory === 'MeetUps') && (
                  <section className="space-y-4">
                    <h2 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-400'}`}>
                      ✨ Based On Your Interests
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCommunities.slice(0, 4).map((comm) => {
                        const isJoined = joinedCommunityIds.includes(comm.id);
                        return (
                          <div key={comm.id} className={`p-4 rounded-[24px] border flex items-center space-x-3.5 ${
                            appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150'
                          }`}>
                            <div className="w-13 h-13 rounded-2xl overflow-hidden bg-neutral-950 shrink-0">
                              <img src={comm.image} alt={comm.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-extrabold text-xs truncate ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{comm.name}</h4>
                              <p className="text-[10px] text-zinc-400 truncate mt-0.5">{comm.description}</p>
                              <span className="text-[9px] font-black text-[#0F8A5F] block mt-1 uppercase tracking-wider">{comm.memberCount} members active</span>
                            </div>
                            {isJoined ? (
                              <button
                                onClick={() => {
                                  setSelectedCommunityId(comm.id);
                                  triggerBeep(400, 0.05);
                                }}
                                className="p-2 bg-[#0F8A5F]/10 hover:bg-[#0F8A5F]/15 text-[#0F8A5F] rounded-xl text-[10px] font-black transition cursor-pointer"
                              >
                                View Chat
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setJoinedCommunityIds([...joinedCommunityIds, comm.id]);
                                  showToast(`Joined ${comm.name}!`);
                                  triggerBeep(450, 0.05);
                                }}
                                className="p-2 bg-[#0F8A5F] hover:bg-[#0c734f] text-white rounded-xl transition cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* -------------------------------------------------- */}
                {/* CROSSED PATHS TAB */}
                {/* -------------------------------------------------- */}
                {activeCategory === 'Crossed Paths' && (
                  <section className="space-y-6">
                    {(() => {
                      const currentCellName = selectedPreset?.name || "your active GPS area";
                      return (
                        <>
                          <div className="space-y-2">
                            <h2 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-400'}`}>
                              📍 Venue Logs & Crossed Paths
                            </h2>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                              These are the real physical spots where you and active neighbors were within 50m of each other around the {currentCellName} grid.
                            </p>
                          </div>

                          {crossedPathsData.length === 0 ? (
                            <div className="text-center py-16 px-5 flex flex-col items-center justify-center space-y-4 bg-white dark:bg-neutral-900 rounded-[24px] border border-dashed border-zinc-200 dark:border-neutral-800">
                              <div className="text-3xl">📡</div>
                              <h3 className="font-extrabold text-sm">No Crossed Paths Logged</h3>
                              <p className="text-xs text-zinc-500 max-w-xs leading-normal">
                                Go out and walk around {currentCellName} to cross paths with neighbors offline! Your phone logs connections securely.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {crossedPathsData.map((cp) => (
                                <motion.div
                                  key={cp.id}
                                  whileHover={{ scale: 1.01 }}
                                  className={`p-4.5 rounded-[24px] border flex items-center justify-between transition ${
                                    appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150 shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3.5 min-w-0">
                                    <div className={`w-11 h-11 rounded-full ${cp.neighborColor} flex items-center justify-center text-xl shrink-0`}>
                                      {cp.neighborEmoji}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className={`font-extrabold text-xs truncate ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                                        Crossed paths with {cp.neighborName}
                                      </h4>
                                      <p className="text-[10px] text-zinc-450 font-sans mt-0.5 flex items-center">
                                        <MapPin className="w-3 h-3 text-[#0F8A5F] mr-0.5 animate-pulse" />
                                        at <span className="font-semibold text-zinc-500 ml-1 truncate">{cp.locationName}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="text-[9.5px] font-mono text-zinc-450 block">{cp.timestamp}</span>
                                    <button
                                      onClick={() => {
                                        onOpenNeighborChat(cp.neighborId);
                                        triggerBeep(450, 0.05);
                                      }}
                                      className="mt-1 text-[10px] font-black uppercase text-[#0F8A5F] hover:underline"
                                    >
                                      Chat
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </section>
                )}

                {/* -------------------------------------------------- */}
                {/* SAFETY & PRIVACY TAB */}
                {/* -------------------------------------------------- */}
                {activeCategory === 'Safety & Privacy' && (
                  <section className="space-y-6">
                    <div className="space-y-1.5">
                      <h2 className={`text-sm font-black uppercase tracking-widest ${appTheme === 'dark' ? 'text-neutral-400' : 'text-zinc-400'}`}>
                        🛡️ Safety, Ghost Mode & Privacy
                      </h2>
                      <p className="text-xs text-zinc-400 leading-normal font-sans">
                        Manage your proximity visibility, exact coordinates, and trust parameters instantly.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Ghost Mode Card */}
                      <div className={`p-5 rounded-[24px] border flex items-start justify-between space-x-4 ${
                        appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150 shadow-sm'
                      }`}>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">👻</span>
                            <span className={`text-xs font-black ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Ghost Mode Proximity</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                            Your profile will be completely hidden from all neighbor radars, and you won't show up in any proximity filter searches.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsGhostMode(!isGhostMode);
                            triggerBeep(450, 0.06);
                            showToast(isGhostMode ? 'Ghost mode turned OFF' : 'Ghost mode active! You are now hidden 👻');
                          }}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${
                            isGhostMode ? 'bg-emerald-500' : 'bg-zinc-350 dark:bg-neutral-800'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow ${
                            isGhostMode ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Fuzzy Location Card */}
                      <div className={`p-5 rounded-[24px] border flex items-start justify-between space-x-4 ${
                        appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150 shadow-sm'
                      }`}>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">📍</span>
                            <span className={`text-xs font-black ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Fuzzy Coordinates (~100m)</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                            Instead of exposing your precise street number, your coordinate location is randomized within a ~100m radius to preserve home privacy.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPrivacyFuzzyLocation(!privacyFuzzyLocation);
                            triggerBeep(450, 0.06);
                            showToast(privacyFuzzyLocation ? 'Precise location active' : 'Fuzzy coordinates active 📍');
                          }}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${
                            privacyFuzzyLocation ? 'bg-emerald-500' : 'bg-zinc-350 dark:bg-neutral-800'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow ${
                            privacyFuzzyLocation ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Block Crossed Paths */}
                      <div className={`p-5 rounded-[24px] border flex items-start justify-between space-x-4 ${
                        appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150 shadow-sm'
                      }`}>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">🚷</span>
                            <span className={`text-xs font-black ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Block Crossed Paths log</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                            Prevent neighbors from seeing if you have crossed paths with them at local spots. Clears crossed history log immediately.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPrivacyBlockCrossed(!privacyBlockCrossed);
                            triggerBeep(450, 0.06);
                            showToast(privacyBlockCrossed ? 'Crossed paths enabled' : 'Crossed paths log blocked');
                          }}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${
                            privacyBlockCrossed ? 'bg-emerald-500' : 'bg-zinc-350 dark:bg-neutral-800'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow ${
                            privacyBlockCrossed ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Friends Only Messaging */}
                      <div className={`p-5 rounded-[24px] border flex items-start justify-between space-x-4 ${
                        appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-zinc-150 shadow-sm'
                      }`}>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">🔒</span>
                            <span className={`text-xs font-black ${appTheme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Friends Only Connection</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                            Only verified friends and people with connections in common can send direct chat messages or see your profile bio tags.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsFriendsOnly(!isFriendsOnly);
                            triggerBeep(450, 0.06);
                            showToast(isFriendsOnly ? 'Open messages active' : 'Friends-only connections enforced');
                          }}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${
                            isFriendsOnly ? 'bg-emerald-500' : 'bg-zinc-350 dark:bg-neutral-800'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow ${
                            isFriendsOnly ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* SOS Emergency Lock (Red Alert Card) */}
                      <div className="p-5 rounded-[24px] border border-red-950/40 bg-red-950/15 flex items-start justify-between space-x-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-1.5 text-red-550 dark:text-red-500">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-xs font-black">SOS Emergency Hide Mode</span>
                          </div>
                          <p className="text-[10px] text-red-650 dark:text-red-400 leading-relaxed font-sans">
                            CRITICAL SAFETY SHIELD: Instantly turns off GPS transmission, blanks out your profile on nearby devices, and enforces complete stealth.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            handleToggleEmergencyHide();
                            triggerBeep(700, 0.15);
                          }}
                          className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${
                            isEmergencyHide ? 'bg-red-600' : 'bg-zinc-350 dark:bg-neutral-800'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow ${
                            isEmergencyHide ? 'right-0.5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </section>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* ================================== */}
      {/* MODAL WINDOW: PUBLISH NEW BOARD POST */}
      {/* ================================== */}
      <AnimatePresence>
        {showNewPostModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-[28px] p-6 space-y-5 border text-xs leading-normal relative ${
                appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-zinc-150 text-neutral-900'
              }`}
            >
              <div className="flex justify-between items-center border-b border-zinc-200/50 dark:border-neutral-800/40 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#0F8A5F]">Share a local post vibe</span>
                <button onClick={() => setShowNewPostModal(false)} className="text-zinc-400 hover:text-white text-base">×</button>
              </div>

              {/* Text Area */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 font-bold block uppercase">Details Content</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's going on around this neighborhood block? Meetups, garage sales, or lost pets..."
                  className="w-full h-24 bg-neutral-950 border border-neutral-850 rounded-2xl p-3 focus:outline-none focus:border-[#0F8A5F] text-xs font-sans text-white resize-none"
                />
              </div>

              {/* Type Select */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 font-bold block uppercase mb-1">Post Type</label>
                  <select
                    value={newPostType}
                    onChange={(e) => setNewPostType(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="general">💬 General Post</option>
                    <option value="activity">🏃 Activity Link</option>
                    <option value="event">📅 Event Invitation</option>
                    <option value="community_update">⚠️ Local Alert</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 font-bold block uppercase mb-1">Photo Attachment Link</label>
                  <input
                    type="text"
                    value={newPostMedia}
                    onChange={(e) => setNewPostMedia(e.target.value)}
                    placeholder="Optional image URL..."
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Publish button */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="flex-1 py-2 text-center text-xs bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 py-2 text-center text-xs bg-[#0F8A5F] hover:bg-[#0c734f] text-white font-black rounded-xl shadow shadow-[#0F8A5F]/20"
                >
                  Publish Vibe
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================== */}
      {/* MODAL WINDOW: AI ICEBREAKER RESULT */}
      {/* ================================== */}
      <AnimatePresence>
        {generatingIcebreakerForNeighbor && icebreakers.length > 0 && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-[28px] p-6 space-y-4 border text-xs leading-normal relative ${
                appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-zinc-150 text-neutral-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-[#0F8A5F] flex items-center">
                  <Sparkles className="w-4 h-4 text-yellow-400 mr-1 animate-pulse" />
                  AI Icebreaker Crafted
                </span>
                <button onClick={() => setGeneratingIcebreakerForNeighbor(null)} className="text-zinc-400 hover:text-white text-base">×</button>
              </div>

              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-850 relative">
                <p className="text-zinc-300 font-sans italic text-xs leading-relaxed">
                  "{icebreakers[0]}"
                </p>
              </div>

              <div className="flex pt-1 space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(icebreakers[0]);
                    showToast("Icebreaker copied to clipboard!");
                  }}
                  className="flex-1 py-2 text-center text-xs bg-neutral-950 border border-neutral-800 text-zinc-300 hover:text-white rounded-xl"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => handleSendIcebreakerMessage(icebreakers[0])}
                  className="flex-1 py-2 text-center text-xs bg-[#0F8A5F] hover:bg-[#0c734f] text-white font-black rounded-xl shadow shadow-[#0F8A5F]/20"
                >
                  Start Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================== */}
      {/* MODAL WINDOW: CREATE NEW COMMUNITY */}
      {/* ================================== */}
      <AnimatePresence>
        {showCreateCommunityModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-[28px] p-6 space-y-4 border text-xs leading-normal relative ${
                appTheme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-zinc-150 text-neutral-900'
              }`}
            >
              <div className="flex justify-between items-center border-b border-zinc-200/50 dark:border-neutral-800/40 pb-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#0F8A5F]">Establish a neighborhood board</span>
                <button onClick={() => setShowCreateCommunityModal(false)} className="text-zinc-400 hover:text-white text-base">×</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block mb-1">Board Name</label>
                  <input
                    type="text"
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    placeholder="e.g. Surulere Chess Club, Ikeja Photographers..."
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0F8A5F] text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block mb-1">Category Theme</label>
                  <select
                    value={newCommCategory}
                    onChange={(e) => setNewCommCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-2.5 py-1.5 focus:outline-none text-white text-xs"
                  >
                    <option value="Study">📚 Study Group</option>
                    <option value="Sports">🏃 Sports / Fitness</option>
                    <option value="Business">💼 Professional Networking</option>
                    <option value="Music">🎸 Music / Art</option>
                    <option value="Faith">🙏 Faith discussion</option>
                    <option value="Food">🍲 Food / Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block mb-1">Brief Description</label>
                  <textarea
                    value={newCommDescription}
                    onChange={(e) => setNewCommDescription(e.target.value)}
                    placeholder="What is this community board for?"
                    className="w-full h-16 bg-neutral-950 border border-neutral-850 rounded-xl p-2.5 focus:outline-none focus:border-[#0F8A5F] text-white text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block mb-1">Cover Image Link URL (optional)</label>
                  <input
                    type="text"
                    value={newCommImage}
                    onChange={(e) => setNewCommImage(e.target.value)}
                    placeholder="Paste optional photo link..."
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0F8A5F] text-white text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex pt-1 space-x-2">
                <button
                  onClick={() => setShowCreateCommunityModal(false)}
                  className="flex-1 py-1.5 text-center text-xs bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCommunity}
                  className="flex-1 py-1.5 text-center text-xs bg-[#0F8A5F] hover:bg-[#0c734f] text-white font-black rounded-xl shadow shadow-[#0F8A5F]/20"
                >
                  Establish Board
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});

export default ExploreTab;
