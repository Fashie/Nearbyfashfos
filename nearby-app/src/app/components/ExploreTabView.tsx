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

export default function ExploreTabView() {
  const {
    activeTab,
    selectedPreset,
    neighbors,
    pendingFriendRequests,
    setViewingNeighborProfile,
    currentUser,
    friendIds,
    appTheme,
    userCoords,
    triggerBeep,
    actuallyAddFriend,
    sendPrivateMessageToNeighbor,
    onOpenNeighborChat,
    theme,
  } = useNearbyRuntime();

  return (
    <>
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
    </>
  );
}
