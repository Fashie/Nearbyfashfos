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

export default function RadarTab() {
  const {
    activeTab,
    selectedPreset,
    updatePresetWithCoordinates,
    updateRadarPresenceInFirestore,
    neighbors,
    setSelectedNeighbor,
    customProfilePhoto,
    usingGoogleMaps,
    setUsingGoogleMaps,
    hasValidGoogleMapsKey,
    radarRadius,
    setRadarRadius,
    showRadarDrawer,
    setShowRadarDrawer,
    friendIds,
    isUserVisibleOnRadar,
    setIsUserVisibleOnRadar,
    radarVisibilityMode,
    setRadarVisibilityMode,
    userRadarEmoji,
    appTheme,
    userCoords,
    setUserCoords,
    setGpsSynced,
    setUserAddress,
    setShowAddFriendsModal,
    setAudioFeedback,
    triggerBeep,
    filteredNeighbors,
  } = useNearbyRuntime();

  return (
    <>
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
    </>
  );
}
