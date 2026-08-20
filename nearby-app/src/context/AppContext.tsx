import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ActiveTabType, LocationPreset, Neighbor, Meetup } from '../types';
import { NEIGHBORHOODS, SNAP_HOTSPOTS } from '../utils/constants';
import { geocodingService } from '../services/location/GeocodingService';
import { triggerAudioBeep } from '../utils/helpers';

interface AppContextValue {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  userCoords: { lat: number; lng: number };
  setUserCoords: (coords: { lat: number; lng: number }) => void;
  selectedPreset: LocationPreset;
  setSelectedPreset: (preset: LocationPreset) => void;
  currentAddress: string;
  setCurrentAddress: (addr: string) => void;
  selectedRadiusMeters: number;
  setSelectedRadiusMeters: (r: number) => void;
  isMapLoaded: boolean;
  setIsMapLoaded: (loaded: boolean) => void;
  mapError: string | null;
  setMapError: (err: string | null) => void;
  audioFeedback: string;
  setAudioFeedback: (msg: string) => void;
  triggerBeep: (freq?: number, duration?: number) => void;
  
  // Modals & Overlays
  showPremiumModal: boolean;
  setShowPremiumModal: (s: boolean) => void;
  showFriendsModal: boolean;
  setShowFriendsModal: (s: boolean) => void;
  showHelpModal: boolean;
  setShowHelpModal: (s: boolean) => void;
  showInviteModal: boolean;
  setShowInviteModal: (s: boolean) => void;
  showLanguageModal: boolean;
  setShowLanguageModal: (s: boolean) => void;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (s: boolean) => void;
  showScheduleMeetupModal: boolean;
  setShowScheduleMeetupModal: (s: boolean) => void;
  scheduleMeetupTargetNeighbor: Neighbor | null;
  setScheduleMeetupTargetNeighbor: (nb: Neighbor | null) => void;
  selectedNeighborForProfile: Neighbor | null;
  setSelectedNeighborForProfile: (nb: Neighbor | null) => void;
  
  // High Priority System Banners
  isIframe: boolean;
  isQuotaExceeded: boolean;
  setIsQuotaExceeded: (b: boolean) => void;
  appLanguage: string;
  setAppLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('radar');
  const [selectedPreset, setSelectedPreset] = useState<LocationPreset>(NEIGHBORHOODS[0]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(NEIGHBORHOODS[0].coords);
  const [currentAddress, setCurrentAddress] = useState<string>('Ogo-Oluwa, Osogbo, Osun State');
  const [selectedRadiusMeters, setSelectedRadiusMeters] = useState<number>(500);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [audioFeedback, setAudioFeedback] = useState<string>('');
  
  // Modals
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showScheduleMeetupModal, setShowScheduleMeetupModal] = useState<boolean>(false);
  const [scheduleMeetupTargetNeighbor, setScheduleMeetupTargetNeighbor] = useState<Neighbor | null>(null);
  const [selectedNeighborForProfile, setSelectedNeighborForProfile] = useState<Neighbor | null>(null);
  
  // Banners
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [appLanguage, setAppLanguage] = useState<string>('english');

  // Watch for firestore errors
  useEffect(() => {
    const handleFirestoreErrorEvent = (e: any) => {
      if (e.detail?.isQuota) {
        setIsQuotaExceeded(true);
      }
    };
    window.addEventListener('firestore-error-event', handleFirestoreErrorEvent);
    return () => window.removeEventListener('firestore-error-event', handleFirestoreErrorEvent);
  }, []);

  const triggerBeep = (freq = 440, duration = 0.1) => {
    triggerAudioBeep(freq, duration);
  };

  const value = useMemo(() => ({
    activeTab,
    setActiveTab,
    userCoords,
    setUserCoords,
    selectedPreset,
    setSelectedPreset,
    currentAddress,
    setCurrentAddress,
    selectedRadiusMeters,
    setSelectedRadiusMeters,
    isMapLoaded,
    setIsMapLoaded,
    mapError,
    setMapError,
    audioFeedback,
    setAudioFeedback,
    triggerBeep,
    showPremiumModal,
    setShowPremiumModal,
    showFriendsModal,
    setShowFriendsModal,
    showHelpModal,
    setShowHelpModal,
    showInviteModal,
    setShowInviteModal,
    showLanguageModal,
    setShowLanguageModal,
    showNotificationsModal,
    setShowNotificationsModal,
    showScheduleMeetupModal,
    setShowScheduleMeetupModal,
    scheduleMeetupTargetNeighbor,
    setScheduleMeetupTargetNeighbor,
    selectedNeighborForProfile,
    setSelectedNeighborForProfile,
    isIframe,
    isQuotaExceeded,
    setIsQuotaExceeded,
    appLanguage,
    setAppLanguage
  }), [
    activeTab,
    userCoords,
    selectedPreset,
    currentAddress,
    selectedRadiusMeters,
    isMapLoaded,
    mapError,
    audioFeedback,
    showPremiumModal,
    showFriendsModal,
    showHelpModal,
    showInviteModal,
    showLanguageModal,
    showNotificationsModal,
    showScheduleMeetupModal,
    scheduleMeetupTargetNeighbor,
    selectedNeighborForProfile,
    isIframe,
    isQuotaExceeded,
    appLanguage
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
