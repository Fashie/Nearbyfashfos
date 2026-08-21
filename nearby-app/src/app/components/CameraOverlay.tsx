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

export default function CameraOverlay() {
  const {
    neighbors,
    selectedNeighbor,
    cameraActive,
    capturedImage,
    setCapturedImage,
    activeFilter,
    setActiveFilter,
    setCanvasDrawing,
    photoCaption,
    setPhotoCaption,
    brushColor,
    setBrushColor,
    videoRef,
    canvasRef,
    triggerBeep,
    capturePhoto,
    closeCamera,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    postToMyStory,
    sendCapturedSnapDirectly,
  } = useNearbyRuntime();

  return (
    <>
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

    </>
  );
}
