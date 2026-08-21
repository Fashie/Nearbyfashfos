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

export default function BannedScreen() {
  const {
  triggerBeep,
} = useNearbyRuntime();

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
}
