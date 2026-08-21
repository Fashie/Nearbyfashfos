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

export default function SplashScreen() {
  const {
  authLoading,
  isSplashActive,
} = useNearbyRuntime();

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

}
