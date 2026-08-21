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

export default function BottomNav() {
  const {
    activeTab,
    setActiveTab,
    setSelectedNeighbor,
    chatNotification,
    appTheme,
    triggerBeep,
  } = useNearbyRuntime();

  return (
    <>
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

    </>
  );
}
