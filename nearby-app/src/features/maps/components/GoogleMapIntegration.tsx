import React, { useState, useEffect, useRef, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Compass, 
  Navigation, 
  Search, 
  Settings, 
  X, 
  SlidersHorizontal, 
  Sparkles, 
  MessageSquare, 
  User,
  RefreshCw
} from 'lucide-react';
import { Neighbor } from '../../../types';
import { NEIGHBORHOODS, LocationPreset } from '../../../mockData';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

const getDynamicHotspots = (presetCity: string, streets: string[]) => {
  const city = presetCity?.split(',')[0] || "Local";
  const st = (streets && streets.length > 0) ? streets : ["Central", "Market", "Safe Plaza", "Main", "Community"];
  return [
    { name: `${st[0]} Central Park`, label: "Top Pick", emoji: "🌳", latOffset: 0.0015, lngOffset: -0.002 },
    { name: `${st[1] || "Bite More"} Diner & Restaurant`, label: "Top Pick", emoji: "🍔", latOffset: -0.0025, lngOffset: 0.001 },
    { name: `${city} Chill & Lounge Bar`, label: "Top Pick", emoji: "🍹", latOffset: 0.002, lngOffset: 0.003 },
    { name: `${st[2] || "Creative"} Hub & Arts`, label: "Highly Revisited", emoji: "🎨", latOffset: -0.0015, lngOffset: -0.003 },
    { name: `${city} Safe Meetup Hotel`, label: "Lodging", emoji: "🏨", latOffset: -0.0008, lngOffset: -0.0012 },
    { name: `${st[3] || "Main"} Food Spot`, label: "Top Pick", emoji: "🍲", latOffset: 0.0035, lngOffset: -0.0015 },
    { name: `${st[4] || "Corner"} Fast Food`, label: "Top Pick", emoji: "🍕", latOffset: -0.003, lngOffset: -0.0025 }
  ];
};

export interface GoogleMapIntegrationProps {
  appTheme: 'dark' | 'light';
  activeCoords: { lat: number; lng: number };
  filteredNeighbors: Neighbor[];
  onSelectNeighbor: (nb: Neighbor) => void;
  userRadarEmoji: string;
  setUserCoords: (coords: { lat: number; lng: number } | null) => void;
  setGpsSynced: (sync: boolean) => void;
  setUserAddress: (addr: string) => void;
  setAudioFeedback: (msg: string) => void;
  selectedPreset: LocationPreset;
  updatePresetWithCoordinates: (lat: number, lng: number, force?: boolean, extraCoords?: { accuracy?: number | null; heading?: number | null; speed?: number | null }) => Promise<any>;
  triggerBeep: (freq?: number, duration?: number, type?: 'sine' | 'square' | 'triangle') => void;
  onToggleRadarSettings: () => void;
  onToggleAddFriends: () => void;
  hasUnreadFriends?: boolean;
  usingGoogleMaps: boolean;
  setUsingGoogleMaps: (val: boolean) => void;
  setActiveTab?: (tab: 'radar' | 'chat' | 'status' | 'menu' | 'explore') => void;
  onScheduleMeetup?: (nb: Neighbor) => void;
  onViewProfile?: (nb: Neighbor) => void;
}

// Custom Helper Components
function CustomPolyline({
  path,
  color = '#00afef'
}: {
  path: Array<{ lat: number; lng: number }>;
  color?: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2) return;
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.85,
      strokeWeight: 5,
      map
    });
    return () => polyline.setMap(null);
  }, [map, path, color]);
  return null;
}

function DirectionsRendererComponent({
  origin,
  destination,
  onRouteCalculated
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onRouteCalculated: (routeInfo: { distance: string; duration: string; path: Array<{ lat: number; lng: number }> }) => void;
}) {
  const map = useMap();
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);

  useEffect(() => {
    if (!map) return;
    setDirectionsService(new google.maps.DirectionsService());
  }, [map]);

  useEffect(() => {
    if (!directionsService || !origin || !destination) return;
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING
      },
      (result, status) => {
        if (status === 'OK' && result) {
          const route = result.routes[0];
          const leg = route.legs[0];
          if (leg) {
            const points = route.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
            onRouteCalculated({
              distance: leg.distance?.text || 'Distance computed',
              duration: leg.duration?.text || 'Trek minutes computed',
              path: points
            });
          }
        } else {
          console.warn('Google maps directions failed, using direct fallback line:', status);
          onRouteCalculated({
            distance: 'Straight distance',
            duration: 'A few mins walk',
            path: [origin, destination]
          });
        }
      }
    );
  }, [directionsService, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  return null;
}

function MapEventsHelper({ onMapLoaded }: { onMapLoaded: (map: google.maps.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      onMapLoaded(map);
    }
  }, [map]);
  return null;
}

const lightMapStyle = [
  { "featureType": "all", "elementType": "geometry", "stylers": [{ "color": "#F4F5F7" }] },
  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#4A4A4A" }] },
  { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#F4F5F7" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#EAECEF" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#D3E9D9" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#FFFFFF" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#E0E3E8" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#C9E2F2" }] }
];

const darkMapStyle = [
  { "featureType": "all", "elementType": "geometry", "stylers": [{ "color": "#12141C" }] },
  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#7F8C9D" }] },
  { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#12141C" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#1C1F2B" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#152C22" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1E2235" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#282E48" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0F1A24" }] }
];

const GoogleMapIntegration = React.memo(function GoogleMapIntegration({
  appTheme,
  activeCoords,
  filteredNeighbors,
  onSelectNeighbor,
  userRadarEmoji,
  setUserCoords,
  setGpsSynced,
  setUserAddress,
  setAudioFeedback,
  selectedPreset,
  updatePresetWithCoordinates,
  triggerBeep,
  onToggleRadarSettings,
  onToggleAddFriends,
  hasUnreadFriends,
  usingGoogleMaps,
  setUsingGoogleMaps,
  setActiveTab,
  onScheduleMeetup,
  onViewProfile
}: GoogleMapIntegrationProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapSearchInput, setMapSearchInput] = useState<string>('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [selectedNeighborForRoute, setSelectedNeighborForRoute] = useState<Neighbor | null>(null);
  const [computedRoute, setComputedRoute] = useState<{
    distance: string;
    duration: string;
    path: Array<{ lat: number; lng: number }>;
  } | null>(null);
  const [isMapLocked, setIsMapLocked] = useState<boolean>(true);

  // Redesign States
  const [showFiltersSheet, setShowFiltersSheet] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(true);

  // Filter local states
  const [filterDistance, setFilterDistance] = useState<number>(1000);
  const [filterAge, setFilterAge] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterInterest, setFilterInterest] = useState<string>('All');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);
  const [filterHighlyTrustedOnly, setFilterHighlyTrustedOnly] = useState<boolean>(false);
  const [filterAvailableToMeet, setFilterAvailableToMeet] = useState<boolean>(false);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState<boolean>(false);

  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const leafletPolylineRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Loading timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Filter neighbors locally based on the 8 criteria
  const mapFilteredNeighbors = useMemo(() => {
    return filteredNeighbors.filter(nb => {
      // Unknown distance (no fresh GPS for that user) must not crash or silently
      // drop them - `undefined > n` is false but `undefined` then flows into the
      // marker render below and blows up on .toFixed()/arithmetic.
      if (nb.distanceMeters !== undefined && nb.distanceMeters > filterDistance) return false;
      if (filterAge !== 'All' && nb.ageRange && nb.ageRange !== filterAge) return false;
      if (filterGender !== 'All' && nb.gender && nb.gender !== filterGender) return false;
      if (filterInterest !== 'All' && nb.interests && !nb.interests.includes(filterInterest)) return false;
      if (filterVerifiedOnly && nb.verificationLevel !== 'Verified') return false;
      if (filterHighlyTrustedOnly && nb.trustScore !== undefined && nb.trustScore < 4.0) return false;
      if (filterAvailableToMeet && nb.dayTimeAvailability !== 'Available Right Now') return false;
      
      if (filterOnlineOnly) {
        const status = nb.id === 'nb-myai' ? 'active' :
                       nb.id === 'nb-1' ? 'active' :
                       nb.id === 'nb-2' ? 'away' :
                       nb.id === 'nb-3' ? 'offline' :
                       nb.id === 'nb-4' ? 'away' :
                       (nb.onlineStatus || 'offline');
        if (status !== 'active') return false;
      }
      
      return true;
    });
  }, [filteredNeighbors, filterDistance, filterAge, filterGender, filterInterest, filterVerifiedOnly, filterHighlyTrustedOnly, filterAvailableToMeet, filterOnlineOnly]);

  // Load Leaflet dynamically if Google Maps API key is not available or failed
  useEffect(() => {
    if (usingGoogleMaps) return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.id = 'leaflet-css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.id = 'leaflet-js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, [usingGoogleMaps]);

  // 1. Initialise Leaflet map object
  useEffect(() => {
    if (usingGoogleMaps || !leafletLoaded || !leafletContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const mapObj = L.map(leafletContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.1,
        easeLinearity: 0.15
      }).setView([activeCoords.lat, activeCoords.lng], 16);

      leafletMapRef.current = mapObj;
      L.control.zoom({ position: 'bottomright' }).addTo(mapObj);

      mapObj.on('dragstart', () => {
        setIsMapLocked(false);
      });
      mapObj.on('zoomstart', () => {
        setIsMapLocked(false);
      });
    }
  }, [leafletLoaded, usingGoogleMaps]);

  // 2. Pan Leaflet camera when GPS updates
  useEffect(() => {
    if (usingGoogleMaps || !leafletLoaded || !leafletMapRef.current) return;
    if (isMapLocked) {
      leafletMapRef.current.panTo([activeCoords.lat, activeCoords.lng], {
        animate: true,
        duration: 0.8
      });
    }
  }, [leafletLoaded, activeCoords, isMapLocked, usingGoogleMaps]);

  // 3. Draw Leaflet Markers, Hotspots and Base Tiles
  useEffect(() => {
    if (usingGoogleMaps || !leafletLoaded || !leafletMapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const mapInst = leafletMapRef.current;

    mapInst.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        mapInst.removeLayer(layer);
      }
    });

    const tileUrl = mapType === 'roadmap'
      ? (appTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png')
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(tileUrl, { 
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(mapInst);

    leafletMarkersRef.current.forEach(m => mapInst.removeLayer(m));
    leafletMarkersRef.current = [];

    if (leafletPolylineRef.current) {
      mapInst.removeLayer(leafletPolylineRef.current);
      leafletPolylineRef.current = null;
    }

    // A) User Pin
    const userMarkerIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-24 h-24 rounded-full bg-[#00AFEF]/15 border border-[#00AFEF]/30 pointer-events-none"></div>
          <div class="absolute w-12 h-12 rounded-full bg-[#00AFEF]/40 animate-ping" style="animation-duration: 3s;"></div>
          <div class="relative w-6 h-6 bg-[#00AFEF] rounded-full border-4 border-white shadow-[0_0_15px_rgba(0,175,239,0.8)] flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      className: 'custom-leaflet-marker-user',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker([activeCoords.lat, activeCoords.lng], { icon: userMarkerIcon }).addTo(mapInst);
    leafletMarkersRef.current.push(userMarker);

    // B) Neighbor Pins
    mapFilteredNeighbors.forEach((nb) => {
      if (nb.id === 'nb-myai') return;
      
      const pos = getNeighborCoords(nb);
      const isOnline = nb.onlineStatus === 'active' || nb.id === 'nb-1';
      const ringColor = isOnline ? 'ring-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'ring-neutral-400';
      const badgeColor = isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400';

      const neighborMarkerIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center cursor-pointer select-none relative" style="transform: translate(0, -12px); filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15));">
            <div class="w-14 h-14 rounded-full border-4 border-white p-0.5 flex items-center justify-center shadow-lg ring-2 ${ringColor} ring-offset-2 ring-offset-transparent relative bg-white">
              <div class="w-full h-full ${nb.avatarColor} rounded-full flex items-center justify-center text-lg overflow-hidden">
                ${nb.customProfilePhoto ? `<img src="${nb.customProfilePhoto}" referrerPolicy="no-referrer" class="w-full h-full object-cover rounded-full" alt="profile" />` : `<span>${nb.avatarEmoji}</span>`}
              </div>
              <span class="absolute -top-1 -right-1 w-3.5 h-3.5 ${badgeColor} rounded-full border-2 border-white"></span>
            </div>
            <div class="mt-2 flex flex-col items-center">
              <span class="text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-md bg-neutral-900/95 text-white border border-neutral-800 whitespace-nowrap leading-none">
                ${nb.name}
              </span>
            </div>
          </div>
        `,
        className: 'custom-leaflet-marker-neighbor',
        iconSize: [56, 56],
        iconAnchor: [28, 28]
      });

      const neighborMarker = L.marker([pos.lat, pos.lng], { icon: neighborMarkerIcon }).addTo(mapInst);
      
      neighborMarker.on('click', () => {
        handleSelectNeighbor(nb);
      });

      leafletMarkersRef.current.push(neighborMarker);
    });

  }, [leafletLoaded, activeCoords, mapFilteredNeighbors, appTheme, userRadarEmoji, selectedNeighborForRoute, mapType]);

  // Leaflet Routing handler
  useEffect(() => {
    if (usingGoogleMaps || !leafletLoaded || !leafletMapRef.current || !selectedNeighborForRoute) return;

    const L = (window as any).L;
    if (!L) return;

    const dest = getNeighborCoords(selectedNeighborForRoute);
    const origin = activeCoords;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/walking/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }));
            const durationMin = Math.round(route.duration / 60);
            const distMeters = route.distance;
            const distText = distMeters >= 1000 ? `${(distMeters / 1000).toFixed(1)} km` : `${Math.round(distMeters)} m`;

            setComputedRoute({
              distance: distText,
              duration: `${durationMin} min walk`,
              path: coordinates
            });

            if (leafletPolylineRef.current) {
              leafletMapRef.current.removeLayer(leafletPolylineRef.current);
            }

            const points = coordinates.map((p: any) => [p.lat, p.lng]);
            const polyline = L.polyline(points, {
              color: '#00afef',
              weight: 5,
              opacity: 0.85,
              dashArray: '5, 8'
            }).addTo(leafletMapRef.current);

            leafletPolylineRef.current = polyline;
            leafletMapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          }
        }
      } catch (e) {
        console.warn("Leaflet route fetch failed:", e);
        const coordinates = [origin, dest];
        setComputedRoute({
          distance: "Direct line",
          duration: "A short trek",
          path: coordinates
        });

        if (leafletPolylineRef.current) {
          leafletMapRef.current.removeLayer(leafletPolylineRef.current);
        }

        const points = [[origin.lat, origin.lng], [dest.lat, dest.lng]];
        const polyline = L.polyline(points, {
          color: '#ef4444',
          weight: 4,
          opacity: 0.7,
          dashArray: '6, 6'
        }).addTo(leafletMapRef.current);

        leafletPolylineRef.current = polyline;
      }
    };

    fetchRoute();
  }, [leafletLoaded, usingGoogleMaps, selectedNeighborForRoute?.id, activeCoords?.lat, activeCoords?.lng]);

  // Clean map on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Google Map: listen to drag & zoom events to unlock camera
  useEffect(() => {
    if (!map) return;
    
    const dragListener = map.addListener('dragstart', () => {
      setIsMapLocked(false);
    });
    
    const zoomListener = map.addListener('zoom_changed', () => {
      setIsMapLocked(false);
    });
    
    return () => {
      if (dragListener) dragListener.remove();
      if (zoomListener) zoomListener.remove();
    };
  }, [map]);

  // Focus effect: Pan Google map smoothly to coordinates when center epicenter shifts and is locked
  useEffect(() => {
    if (map && activeCoords && isMapLocked) {
      map.panTo(activeCoords);
    }
  }, [map, activeCoords, isMapLocked]);

  const handleSelectNeighbor = (nb: Neighbor) => {
    onSelectNeighbor(nb);
    setSelectedNeighborForRoute(nb);
    setComputedRoute(null);
    
    if (map) {
      const pos = getNeighborCoords(nb);
      map.setZoom(18);
      map.panTo(pos);
    }
  };

  const handleAddressSearch = async () => {
    if (!mapSearchInput.trim()) return;
    setAudioFeedback("🔍 Geolocating street down to compound...");
    try {
      const searchLower = mapSearchInput.toLowerCase().trim();
      
      let matchedCoords: { lat: number, lng: number } | null = null;
      let matchedAddressName = "";
      
      for (const preset of NEIGHBORHOODS) {
        if (searchLower === preset.name.toLowerCase() || searchLower === preset.city.toLowerCase()) {
          matchedCoords = { ...preset.coords };
          matchedAddressName = `${preset.name}, ${preset.city}, Nigeria`;
          break;
        }
        for (const st of preset.streets) {
          if (searchLower.includes(st.toLowerCase()) || st.toLowerCase().includes(searchLower)) {
            const offsetLat = (((st || '').length % 5) - 2) * 0.001;
            const offsetLng = (((st || '').charCodeAt(0) || 0) % 5 - 2) * 0.001;
            matchedCoords = { lat: preset.coords.lat + offsetLat, lng: preset.coords.lng + offsetLng };
            matchedAddressName = `${st}, ${preset.city}, Nigeria`;
            break;
          }
        }
        if (matchedCoords) break;
      }
      
      if (matchedCoords) {
        setIsMapLocked(true);
        setUserCoords(matchedCoords);
        setGpsSynced(true);
        setUserAddress(matchedAddressName);
        
        const shortName = matchedAddressName.split(',')[0];
        setAudioFeedback(`🟢 PINPOINTED: ${shortName}!`);
        setTimeout(() => setAudioFeedback(""), 4000);
        
        if (map) {
          map.setZoom(16);
          map.panTo(matchedCoords);
        }
        if (leafletMapRef.current) {
          leafletMapRef.current.setZoom(16);
          leafletMapRef.current.setView([matchedCoords.lat, matchedCoords.lng]);
        }
        return;
      }
      
      const fallbackCityName = selectedPreset?.city || "Osogbo, Osun State";
      const cityNameClean = fallbackCityName.split(',')[0].trim();
      const queryStr = mapSearchInput.toLowerCase().includes(cityNameClean.toLowerCase())
        ? mapSearchInput
        : `${mapSearchInput}, ${fallbackCityName}, Nigeria`;
        
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          
          setIsMapLocked(true);
          setUserCoords({ lat: latitude, lng: longitude });
          setGpsSynced(true);
          
          const shortName = display_name.split(',')[0];
          setUserAddress(display_name);
          setAudioFeedback(`🟢 PINPOINTED: ${shortName}!`);
          setTimeout(() => setAudioFeedback(""), 4000);
          
          if (map) {
            map.setZoom(16);
            map.panTo({ lat: latitude, lng: longitude });
          }
          if (leafletMapRef.current) {
            leafletMapRef.current.setZoom(16);
            leafletMapRef.current.setView([latitude, longitude]);
          }
        } else {
          const activeEpicenter = selectedPreset.coords;
          const hashVal = mapSearchInput.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const pseudoLatOffset = ((hashVal % 11) - 5) * 0.0012;
          const pseudoLngOffset = (((hashVal * 7) % 11) - 5) * 0.0012;
          
          const fallbackLat = activeEpicenter.lat + pseudoLatOffset;
          const fallbackLng = activeEpicenter.lng + pseudoLngOffset;
          const fallbackCoords = { lat: fallbackLat, lng: fallbackLng };
          const formattedAddress = `${mapSearchInput}, ${fallbackCityName}, Nigeria`;
          
          setIsMapLocked(true);
          setUserCoords(fallbackCoords);
          setGpsSynced(true);
          setUserAddress(formattedAddress);
          
          setAudioFeedback(`🟢 PINPOINTED: ${mapSearchInput}!`);
          setTimeout(() => setAudioFeedback(""), 4000);
          
          if (map) {
            map.setZoom(16);
            map.panTo(fallbackCoords);
          }
          if (leafletMapRef.current) {
            leafletMapRef.current.setZoom(16);
            leafletMapRef.current.setView([fallbackLat, fallbackLng]);
          }
        }
      }
    } catch (err) {
      console.warn("Manual Nominatim lookup failed:", err);
      const activeEpicenter = selectedPreset.coords;
      const hashVal = mapSearchInput.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fallbackLat = activeEpicenter.lat + (((hashVal % 9) - 4) * 0.001);
      const fallbackLng = activeEpicenter.lng + ((((hashVal * 3) % 9) - 4) * 0.001);
      const fallbackCoords = { lat: fallbackLat, lng: fallbackLng };
      
      setIsMapLocked(true);
      setUserCoords(fallbackCoords);
      setGpsSynced(true);
      setUserAddress(`${mapSearchInput}, ${selectedPreset?.city || "Osogbo, Osun State"}, Nigeria`);
      
      setAudioFeedback(`🟢 PINPOINTED: ${mapSearchInput}!`);
      setTimeout(() => setAudioFeedback(""), 4000);
      
      if (map) {
        map.setZoom(16);
        map.panTo(fallbackCoords);
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.setZoom(16);
        leafletMapRef.current.setView([fallbackLat, fallbackLng]);
      }
    }
  };

  const getNeighborCoords = (nb: Neighbor) => {
    const lat = nb.latitude !== undefined ? nb.latitude : (activeCoords.lat + (nb.latOffset || 0) * 0.002);
    const lng = nb.longitude !== undefined ? nb.longitude : (activeCoords.lng + (nb.lngOffset || 0) * 0.002);
    return { lat, lng };
  };

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden flex flex-col bg-[#070a13] font-sans">
      
      {/* 1. Map Canvas Layer */}
      {usingGoogleMaps ? (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
          <div className="w-full h-full absolute inset-0 z-0">
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={activeCoords}
              defaultZoom={17}
              gestureHandling="greedy"
              disableDefaultUI={true}
              styles={appTheme === 'dark' ? darkMapStyle : lightMapStyle}
              style={{ width: '100%', height: '100%' }}
              mapTypeId={mapType}
            >
              <MapEventsHelper onMapLoaded={setMap} />

              {/* User Location Pin */}
              <AdvancedMarker position={activeCoords} title="Your Location">
                <div className="relative flex items-center justify-center pointer-events-none">
                  <div className="absolute w-24 h-24 rounded-full bg-[#00AFEF]/15 border border-[#00AFEF]/25 animate-pulse" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-12 h-12 rounded-full bg-[#00AFEF]/30 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="relative w-6 h-6 bg-[#00AFEF] rounded-full border-4 border-white dark:border-zinc-800 shadow-[0_0_15px_rgba(0,175,239,0.85)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </AdvancedMarker>

              {/* Neighbors Pins */}
              {mapFilteredNeighbors.map((nb) => {
                if (nb.id === 'nb-myai') return null;
                const pos = getNeighborCoords(nb);
                const isOnline = nb.onlineStatus === 'active' || nb.id === 'nb-1';
                const ringColor = isOnline ? 'ring-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'ring-neutral-400';
                const badgeColor = isOnline ? 'bg-emerald-500' : 'bg-neutral-400';

                return (
                  <AdvancedMarker
                    key={nb.id}
                    position={pos}
                    title={nb.name}
                    onClick={() => handleSelectNeighbor(nb)}
                  >
                    <motion.div
                      animate={{
                        y: [0, -4, 0],
                        scale: [1, 1.02, 1]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut"
                      }}
                      className="flex flex-col items-center cursor-pointer select-none relative"
                      style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))" }}
                    >
                      <div className={`w-14 h-14 rounded-full border-4 border-white dark:border-zinc-800 p-0.5 flex items-center justify-center shadow-lg ring-2 ${ringColor} ring-offset-2 ring-offset-transparent bg-white dark:bg-zinc-800 relative`}>
                        <div className={`w-full h-full ${nb.avatarColor} rounded-full flex items-center justify-center text-lg overflow-hidden`}>
                          {nb.customProfilePhoto ? (
                            <img src={nb.customProfilePhoto} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-full" alt={nb.name} />
                          ) : (
                            <span>{nb.avatarEmoji}</span>
                          )}
                        </div>
                        <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 ${badgeColor} rounded-full border-2 border-white dark:border-zinc-800`} />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-md bg-neutral-900/95 text-white border border-neutral-800/80 whitespace-nowrap leading-none">
                          {nb.name}
                        </span>
                      </div>
                    </motion.div>
                  </AdvancedMarker>
                );
              })}



              {/* Directions Polyline Renderer */}
              {selectedNeighborForRoute && (
                <DirectionsRendererComponent
                  origin={activeCoords}
                  destination={getNeighborCoords(selectedNeighborForRoute)}
                  onRouteCalculated={setComputedRoute}
                />
              )}

              {/* Polyline */}
              {selectedNeighborForRoute && computedRoute && computedRoute.path.length > 0 && (
                <CustomPolyline path={computedRoute.path} color="#00AFEF" />
              )}
            </Map>
          </div>
        </APIProvider>
      ) : (
        <div className="w-full h-full absolute inset-0 z-0">
          <div 
            ref={leafletContainerRef} 
            className={`w-full h-full ${appTheme === 'dark' ? 'dark-map-style' : ''}`}
            style={{ minHeight: '100%', height: '100%', zIndex: 1 }}
          />
        </div>
      )}

      {/* 2. Top Header Floating Glass Card */}
      <div className="absolute top-4 left-4 right-4 z-40 bg-white/70 dark:bg-black/60 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-grow">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search street, preset, landmark..."
              value={mapSearchInput}
              onChange={(e) => setMapSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddressSearch();
              }}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl h-9 pl-9 pr-3 text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#00AFEF] transition-all"
            />
          </div>

          <button
            onClick={handleAddressSearch}
            className="px-4.5 h-9 bg-[#00AFEF] hover:bg-[#00AFEF]/90 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Go
          </button>

          <button
            onClick={() => {
              triggerBeep(480, 0.05);
              setAudioFeedback("🔄 Refreshing active cells...");
              setTimeout(() => setAudioFeedback(""), 1200);
            }}
            className="w-9 h-9 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer text-neutral-600 dark:text-neutral-300"
            title="Refresh radar cells"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Floating Filter Button */}
      <div className="absolute bottom-4 left-4 z-40">
        <button
          onClick={() => {
            setShowFiltersSheet(true);
            triggerBeep(420, 0.05);
          }}
          className="p-3 px-5 bg-white/80 dark:bg-black/60 backdrop-blur-md hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white rounded-full shadow-lg transition-all active:scale-95 flex items-center space-x-2 border border-white/20 dark:border-white/10 font-sans text-xs font-bold cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#00AFEF]" />
          <span>Filters</span>
          {(filterDistance !== 1000 || filterAge !== 'All' || filterGender !== 'All' || filterInterest !== 'All' || filterVerifiedOnly || filterHighlyTrustedOnly || filterAvailableToMeet || filterOnlineOnly) && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#00AFEF]" />
          )}
        </button>
      </div>

      {/* 4. Floating Action Buttons (Bottom-Right Group) */}
      <div className="absolute bottom-20 right-4 z-40 flex flex-col space-y-3">
        <button
          onClick={() => {
            const nextType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
            setMapType(nextType);
            triggerBeep(380, 0.05);
            setAudioFeedback(nextType === 'roadmap' ? "🗺️ Street View Enabled" : "📡 Satellite View Enabled");
            setTimeout(() => setAudioFeedback(""), 2000);
          }}
          className="w-12 h-12 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white flex items-center justify-center cursor-pointer transition shadow-lg hover:scale-105 active:scale-95"
          title="Toggle Map Satellite"
        >
          {mapType === 'roadmap' ? "📡" : "🗺️"}
        </button>

        <button
          onClick={() => {
            triggerBeep(450, 0.05);
            if (map) {
              map.setHeading(0);
              map.setTilt(0);
            }
            setAudioFeedback("🧭 Compass Reset");
            setTimeout(() => setAudioFeedback(""), 2000);
          }}
          className="w-12 h-12 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white flex items-center justify-center cursor-pointer transition shadow-lg hover:scale-105 active:scale-95"
          title="Reset Compass"
        >
          <Compass className="w-5 h-5 text-[#00AFEF]" />
        </button>

        <button
          onClick={() => {
            onToggleRadarSettings();
            triggerBeep(420, 0.05);
          }}
          className="w-12 h-12 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white flex items-center justify-center cursor-pointer transition shadow-lg hover:scale-105 active:scale-95"
          title="Radar settings"
        >
          <Settings className="w-5 h-5 text-[#00AFEF]" />
        </button>

        <button
          onClick={() => {
            setIsMapLocked(true);
            triggerBeep(640, 0.08);
            if (map) {
              map.panTo(activeCoords);
              map.setZoom(17.5);
            }
            if (leafletMapRef.current) {
              leafletMapRef.current.setView([activeCoords.lat, activeCoords.lng], 16, { animate: true });
            }
            setAudioFeedback("🎯 Map Centered");
            setTimeout(() => setAudioFeedback(""), 2000);
          }}
          className="w-12 h-12 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white flex items-center justify-center cursor-pointer transition shadow-lg hover:scale-105 active:scale-95"
          title="Center Map"
        >
          <Navigation className="w-5 h-5 text-[#00AFEF] fill-[#00AFEF] transform rotate-45 translate-x-[1px] -translate-y-[1px]" />
        </button>

        <button
          onClick={async () => {
            triggerBeep(500, 0.05);
            setAudioFeedback("🛰️ Running high-accuracy GPS sync...");
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                async (p) => {
                  const { latitude, longitude } = p.coords;
                  setUserCoords({ lat: latitude, lng: longitude });
                  setGpsSynced(true);
                  setIsMapLocked(true);
                  const newP = await updatePresetWithCoordinates(latitude, longitude, true);
                  setAudioFeedback(newP ? `🛰️ GPS Scan Hooked: ${newP.name}` : "🛰️ GPS Position center enabled!");
                  setTimeout(() => setAudioFeedback(""), 3000);
                  if (map) {
                    map.setZoom(17.5);
                    map.panTo({ lat: latitude, lng: longitude });
                  }
                  if (leafletMapRef.current) {
                    leafletMapRef.current.setView([latitude, longitude], 16, { animate: true });
                  }
                },
                (err) => {
                  console.error("GPS re-scan err:", err);
                  setAudioFeedback("⚠️ GPS query blocked or unavailable");
                  setTimeout(() => setAudioFeedback(""), 3000);
                },
                { enableHighAccuracy: true, timeout: 10000 }
              );
            } else {
              setAudioFeedback("⚠️ Geolocation API not supported");
              setTimeout(() => setAudioFeedback(""), 2000);
            }
          }}
          className="w-12 h-12 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white flex items-center justify-center cursor-pointer transition shadow-lg hover:scale-105 active:scale-95"
          title="Sync GPS location"
        >
          <MapPin className="w-5 h-5 text-[#00AFEF]" />
        </button>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 bg-white/60 dark:bg-black/50 border border-white/10 px-3 py-1 rounded-full text-[9px] text-neutral-600 dark:text-neutral-400 font-mono backdrop-blur pointer-events-none">
        {mapFilteredNeighbors.length} people nearby • 100% Secure
      </div>

      {/* Selected Neighbor Premium Bottom Sheet */}
      <AnimatePresence>
        {selectedNeighborForRoute && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="absolute bottom-0 left-0 right-0 z-[1500] h-[55%] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-white/20 dark:border-white/10 rounded-t-[32px] p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.2)] flex flex-col justify-between"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/10 dark:bg-white/20 rounded-full" />
            
            <button
              onClick={() => {
                setSelectedNeighborForRoute(null);
                setComputedRoute(null);
                triggerBeep(300, 0.04);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition active:scale-95 text-neutral-800 dark:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mt-4 flex flex-col space-y-4 overflow-y-auto max-h-[85%] pr-1">
              <div className="flex items-center space-x-4">
                <div className="relative flex-shrink-0">
                  <div className={`w-[88px] h-[88px] rounded-full ${selectedNeighborForRoute.avatarColor} p-1 border-4 border-white dark:border-zinc-800 shadow-lg flex items-center justify-center overflow-hidden`}>
                    {selectedNeighborForRoute.customProfilePhoto ? (
                      <img
                        src={selectedNeighborForRoute.customProfilePhoto}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full"
                        alt={selectedNeighborForRoute.name}
                      />
                    ) : (
                      <span className="text-4xl">{selectedNeighborForRoute.avatarEmoji}</span>
                    )}
                  </div>
                  <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-800 ${
                    selectedNeighborForRoute.onlineStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[22px] font-black leading-tight text-neutral-900 dark:text-white truncate">
                    {selectedNeighborForRoute.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    @{selectedNeighborForRoute.username} • {selectedNeighborForRoute.ageRange || '23'} yrs
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    <span className="text-xs font-bold text-[#00AFEF] bg-[#00AFEF]/10 px-2.5 py-0.5 rounded-full">
                      📍 {selectedNeighborForRoute.distanceMeters === undefined
                        ? 'Distance unknown'
                        : `${selectedNeighborForRoute.distanceMeters >= 1000
                            ? `${(selectedNeighborForRoute.distanceMeters / 1000).toFixed(1)} km`
                            : `${selectedNeighborForRoute.distanceMeters}m`} Away`}
                    </span>
                    
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      <span>⭐</span>
                      <span className="ml-1 text-neutral-800 dark:text-white font-mono">
                        {selectedNeighborForRoute.trustScore !== undefined 
                          ? selectedNeighborForRoute.trustScore.toFixed(1) 
                          : "4.8"}
                      </span>
                      <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">
                        ({selectedNeighborForRoute.ratingsCount || 12})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-black block">About</span>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/5 dark:border-white/5">
                  "{selectedNeighborForRoute.bio || "Hi! I am using Nearby to discover new friends and safe hangouts."}"
                </p>
              </div>

              {selectedNeighborForRoute.interests && selectedNeighborForRoute.interests.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-black block">Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNeighborForRoute.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => {
                  triggerBeep(520, 0.08);
                  onSelectNeighbor(selectedNeighborForRoute);
                  if (setActiveTab) {
                    setActiveTab('chat');
                  }
                }}
                className="py-3 px-1 bg-[#00AFEF] hover:bg-[#00AFEF]/90 text-white rounded-2xl font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Message</span>
              </button>

              <button
                onClick={() => {
                  triggerBeep(580, 0.08);
                  if (onScheduleMeetup) {
                    onScheduleMeetup(selectedNeighborForRoute);
                  }
                }}
                className="py-3 px-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-2xl font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Navigation className="w-4.5 h-4.5" />
                <span>Meet Up</span>
              </button>

              <button
                onClick={() => {
                  triggerBeep(640, 0.08);
                  if (onViewProfile) {
                    onViewProfile(selectedNeighborForRoute);
                  }
                }}
                className="py-3 px-1 bg-neutral-100 dark:bg-neutral-850 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <User className="w-4.5 h-4.5" />
                <span>Profile</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Filters Bottom Sheet */}
      <AnimatePresence>
        {showFiltersSheet && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="absolute bottom-0 left-0 right-0 z-[1500] h-[65%] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-t border-white/20 dark:border-white/10 rounded-t-[32px] p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.2)] flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-black/10 dark:bg-white/20 rounded-full" />
            
            <button
              onClick={() => {
                setShowFiltersSheet(false);
                triggerBeep(300, 0.04);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition active:scale-95 text-neutral-800 dark:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mt-4 flex flex-col space-y-4 overflow-y-auto max-h-[80%] pr-1">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                Discovery Filters
              </h3>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-neutral-500 dark:text-neutral-400">Radius Slider</span>
                  <span className="font-black text-[#00AFEF]">{filterDistance} meters</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={filterDistance}
                  onChange={(e) => {
                    setFilterDistance(Number(e.target.value));
                    triggerBeep(380, 0.02);
                  }}
                  className="w-full h-1.5 rounded-lg cursor-pointer accent-[#00AFEF] bg-black/10 dark:bg-white/20"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block">Age Range</span>
                <div className="grid grid-cols-4 gap-2">
                  {['All', '18-24', '25-34', '35+'].map((age) => (
                    <button
                      key={age}
                      onClick={() => {
                        setFilterAge(age);
                        triggerBeep(390, 0.03);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold transition ${
                        filterAge === age
                          ? 'bg-[#00AFEF] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-350 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-800 dark:text-zinc-300'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block">Gender</span>
                <div className="grid grid-cols-4 gap-2">
                  {['All', 'Male', 'Female', 'Non-binary'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => {
                        setFilterGender(gender);
                        triggerBeep(390, 0.03);
                      }}
                      className={`py-1.5 rounded-xl text-[11px] font-bold transition truncate ${
                        filterGender === gender
                          ? 'bg-[#00AFEF] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-350 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-800 dark:text-zinc-300'
                      }`}
                    >
                      {gender === 'Non-binary' ? 'Other' : gender}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block">Interests</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {['All', 'Tech', 'Music', 'Food', 'Design'].map((interest) => (
                    <button
                      key={interest}
                      onClick={() => {
                        setFilterInterest(interest);
                        triggerBeep(390, 0.03);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold transition ${
                        filterInterest === interest
                          ? 'bg-[#00AFEF] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-350 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-800 dark:text-zinc-300'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                <label className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Verified Only</span>
                  <input
                    type="checkbox"
                    checked={filterVerifiedOnly}
                    onChange={(e) => {
                      setFilterVerifiedOnly(e.target.checked);
                      triggerBeep(410, 0.05);
                    }}
                    className="w-4 h-4 rounded text-[#00AFEF] focus:ring-[#00AFEF] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Highly Trusted</span>
                  <input
                    type="checkbox"
                    checked={filterHighlyTrustedOnly}
                    onChange={(e) => {
                      setFilterHighlyTrustedOnly(e.target.checked);
                      triggerBeep(410, 0.05);
                    }}
                    className="w-4 h-4 rounded text-[#00AFEF] focus:ring-[#00AFEF] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Available Now</span>
                  <input
                    type="checkbox"
                    checked={filterAvailableToMeet}
                    onChange={(e) => {
                      setFilterAvailableToMeet(e.target.checked);
                      triggerBeep(410, 0.05);
                    }}
                    className="w-4 h-4 rounded text-[#00AFEF] focus:ring-[#00AFEF] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Online Only</span>
                  <input
                    type="checkbox"
                    checked={filterOnlineOnly}
                    onChange={(e) => {
                      setFilterOnlineOnly(e.target.checked);
                      triggerBeep(410, 0.05);
                    }}
                    className="w-4 h-4 rounded text-[#00AFEF] focus:ring-[#00AFEF] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => {
                setShowFiltersSheet(false);
                triggerBeep(450, 0.08);
              }}
              className="py-3.5 bg-[#00AFEF] hover:bg-[#00AFEF]/90 text-white font-bold rounded-2xl text-sm transition active:scale-95 shadow-md flex items-center justify-center cursor-pointer mt-4"
            >
              Apply Filters ({mapFilteredNeighbors.length} found)
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      {/* 8. Loading Skeleton Overlay */}
      {mapLoading && (
        <div className="absolute inset-0 z-[2000] bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between p-6 overflow-hidden">
          <div className="space-y-6 animate-pulse flex-grow flex flex-col">
            <div className="h-16 bg-neutral-200 dark:bg-neutral-850 rounded-2xl w-full" />
            
            <div className="flex-grow flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-neutral-200 dark:bg-neutral-850 opacity-50" />
            </div>

            <div className="absolute right-6 bottom-32 flex flex-col space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-850" />
              <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-850" />
              <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-850" />
            </div>

            <div className="h-44 bg-neutral-200 dark:bg-neutral-850 rounded-t-[32px] w-full mt-auto" />
          </div>
        </div>
      )}

    </div>
  );
});

export default GoogleMapIntegration;
