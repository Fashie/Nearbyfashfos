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

export default function CallScreenOverlay() {
  const {
    neighbors,
    customProfilePhoto,
    callState,
    micMuted,
    videoOff,
    isSpeakerOn,
    setIsSpeakerOn,
    beautyMode,
    setBeautyMode,
    bluetoothOn,
    setBluetoothOn,
    networkQuality,
    networkQualityDesc,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    triggerBeep,
    answerIncomingCall,
    endCall,
    switchCamera,
    toggleMicMute,
    toggleVideoOff,
  } = useNearbyRuntime();

  return (
    <>
      {/* IMMERSIVE AUDIO / VIDEO CALL SCREEN (WebRTC overlay)  */}
      {/* ---------------------------------------------------- */}
      {callState.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0A0B0D] z-50 flex flex-col justify-between text-white overflow-hidden font-sans"
        >
          {/* Invisible pipelines for WebRTC stream mapping */}
          <div className="hidden">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <video ref={remoteVideoRef} autoPlay playsInline />
          </div>

          {/* BACKGROUND: Glassmorphic ambient gradient blur of Neighbor's colors */}
          {(() => {
            const ringNeighbor = neighbors.find(n => n.id === callState.neighborId);
            return (
              <div className="absolute inset-0 overflow-hidden z-0">
                {/* Fallback gradients that mimic a premium caller screen */}
                <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] opacity-25 ${ringNeighbor?.avatarColor || 'bg-emerald-600'}`} />
                <div className="absolute top-1/2 left-1/4 w-[320px] h-[320px] rounded-full blur-[160px] opacity-20 bg-indigo-500" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] opacity-15 bg-purple-600" />
                {/* Ultra-subtle grid lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
              </div>
            );
          })()}

          {/* MAIN CONTAINER: Flex layout */}
          <div className="relative w-full h-full flex flex-col justify-between p-6 z-10">
            
            {/* 1. TOP HEADER: Navigation details, call quality metrics */}
            <div className="pt-6 text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/5 border border-white/10 backdrop-blur-md">
                  {callState.type === 'video' ? '📺 HD VIDEO CALL' : '📞 SECURE VOICE CALL'}
                </span>
                
                {callState.status === 'connected' && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>

              {/* Call and Connection indicators */}
              {callState.status === 'connected' ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className={`px-2.5 py-0.5 rounded-full border flex items-center space-x-1 text-[9px] font-mono leading-none tracking-wide ${
                    networkQuality === 'excellent' ? 'text-green-400 border-green-500/20 bg-green-500/5' :
                    networkQuality === 'good' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5 animate-pulse'
                  }`}>
                    <Signal className="w-2.5 h-2.5" />
                    <span>Uplink: {networkQualityDesc}</span>
                  </div>
                  {callState.type === 'video' && (
                    <div className="px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[9px] font-mono leading-none tracking-wide">
                      Codec: VP8/H.264
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-400 tracking-wide font-medium animate-pulse">
                  {callState.incoming ? 'Incoming...' : 'Connecting...'}
                </p>
              )}
            </div>

            {/* 2. CENTER CONTENT: Avatar + wave, or video grid */}
            <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
              
              {/* VOICE CALL OR RINGING STATE: Large elegant card layout */}
              {(callState.type === 'audio' || callState.status === 'ringing') && (() => {
                const ringNeighbor = neighbors.find(n => n.id === callState.neighborId);
                if (!ringNeighbor) return null;

                return (
                  <div className="flex flex-col items-center space-y-6 text-center max-w-sm w-full">
                    {/* Ringing / Pulsing Large Profile Photo (140px) */}
                    <div className="relative">
                      {/* Multiple breathing background rings */}
                      <AnimatePresence>
                        {callState.status === 'ringing' && (
                          <>
                            <motion.div 
                              className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <motion.div 
                              className="absolute inset-0 rounded-full bg-emerald-500/5 border border-emerald-500/10"
                              animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                              transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </>
                        )}
                        {callState.status === 'connected' && (
                          <motion.div 
                            className="absolute inset-0 rounded-full bg-indigo-500/20"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}
                      </AnimatePresence>

                      {/* 140px Profile Photo */}
                      <div className="w-[140px] h-[140px] rounded-full p-1 bg-gradient-to-tr from-[#0F8A5F] via-indigo-500 to-emerald-400 shadow-2xl relative z-10 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-6xl shadow-inner overflow-hidden border border-white/5 relative">
                          {ringNeighbor.customProfilePhoto ? (
                            <img 
                              src={ringNeighbor.customProfilePhoto} 
                              alt={ringNeighbor.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span>{ringNeighbor.avatarEmoji}</span>
                          )}
                        </div>
                      </div>

                      {/* Trust rating star badge */}
                      <div className="absolute -bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-indigo-500/30 text-[10px] font-bold text-indigo-300 flex items-center space-x-1 z-20 shadow-md">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{ringNeighbor.trustScore?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tight text-white">{ringNeighbor.name}</h2>
                      <p className="text-sm text-neutral-400 font-mono">@{ringNeighbor.username}</p>
                      
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-stone-300">
                          📍 {ringNeighbor.streetName}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#0F8A5F]/15 border border-[#0F8A5F]/20 text-emerald-400">
                          ⚡ {ringNeighbor.distanceMeters !== undefined ? `${ringNeighbor.distanceMeters}m away` : 'Nearby'}
                        </span>
                      </div>
                    </div>

                    {/* Real-time calling wave animations */}
                    {callState.status === 'connected' && (
                      <div className="py-6 flex flex-col items-center justify-center space-y-2 w-full">
                        {/* Audio waveform */}
                        <div className="flex items-center justify-center space-x-1.5 h-14 w-full">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 rounded-full bg-gradient-to-t from-[#0F8A5F] to-indigo-400"
                              animate={{
                                height: [12, Math.max(16, Math.floor(Math.random() * 56)), 12]
                              }}
                              transition={{
                                duration: 0.5 + (i % 4) * 0.12,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                ease: 'easeInOut'
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-widest font-black">
                          Voice Wave Sync Active
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* VIDEO CALL ACTIVE SCREEN: Full video canvas */}
              {callState.type === 'video' && callState.status === 'connected' && (
                <div className="w-full h-full flex-1 min-h-[300px] max-h-[520px] bg-neutral-900 rounded-[32px] relative overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center z-10">
                  
                  {/* Remote video (opponent camera stream) */}
                  <video
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />

                  {/* If remote stream is not loaded yet */}
                  {!remoteStream && !callState.neighborId?.startsWith('nb-') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 z-10 p-6 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-[#0F8A5F] animate-spin" />
                      <div>
                        <p className="text-sm text-neutral-200 font-bold">Securing video uplink...</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1">Establishing peer tunnels (STUN)</p>
                      </div>
                    </div>
                  )}

                  {/* Holographic Satellite HUD for Simulated Neighbor presets */}
                  {callState.neighborId?.startsWith('nb-') && (
                    <div className="absolute inset-0 bg-[#070913] flex flex-col items-center justify-center overflow-hidden z-0">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,138,95,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,138,95,0.05)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
                      
                      {/* Rotating compass ring */}
                      <div className="absolute w-[360px] h-[360px] rounded-full border border-indigo-500/10 flex items-center justify-center animate-spin" style={{ animationDuration: '20s' }}>
                        <div className="w-[280px] h-[280px] rounded-full border border-emerald-500/15" />
                        <div className="absolute top-0 w-1 h-4 bg-emerald-500/50" />
                        <div className="absolute bottom-0 w-1 h-4 bg-emerald-500/50" />
                      </div>

                      {/* Pulsing Scanline */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_95%,rgba(16,185,129,0.1)_95%)] bg-[size:100%_24px] animate-pulse pointer-events-none" />

                      {/* Fake local feedback acting as holographic overlay */}
                      {localStream && !videoOff && (
                        <video
                          ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
                          autoPlay
                          playsInline
                          muted
                          className={`absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale saturate-150 contrast-125 ${beautyMode ? 'brightness-110 blur-[0.5px]' : 'brightness-90'}`}
                        />
                      )}

                      {/* Tech HUD Labels */}
                      <div className="absolute top-4 left-4 text-left font-mono text-[9px] text-[#0F8A5F] space-y-1 bg-black/60 px-3 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                        <div className="flex items-center space-x-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>DEC-STREAM LINK ACTIVE</span>
                        </div>
                        <div>FEED: ENCRYPTED PEER</div>
                        <div>FPS: 30.00 (HD)</div>
                        <div>PING: 12ms</div>
                      </div>

                      <div className="absolute top-4 right-4 text-right font-mono text-[9px] text-indigo-400 bg-black/60 px-3 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                        <div>PEER ID: {callState.neighborId.toUpperCase()}</div>
                        <div>SIGNAL: EXCELLENT</div>
                        <div>QUALITY: 1080P</div>
                      </div>

                      {/* Center floating user avatar with radar waves */}
                      <div className="relative flex flex-col items-center space-y-4 z-10">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-125" style={{ animationDuration: '4s' }} />
                          <div className="w-[100px] h-[100px] rounded-full p-1 bg-gradient-to-tr from-[#0F8A5F] to-indigo-500 shadow-xl">
                            <div className="w-full h-full rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-5xl">
                              {neighbors.find(n => n.id === callState.neighborId)?.avatarEmoji || '🙋‍♂️'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-mono uppercase">
                            CONNECTED (HD)
                          </span>
                          <h4 className="text-lg font-bold text-white mt-1">
                            {neighbors.find(n => n.id === callState.neighborId)?.name || 'AI Neighbor'}
                          </h4>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Draggable Self Preview camera */}
                  {localStream && !videoOff && (
                    <motion.div
                      drag
                      dragConstraints={{ left: -20, right: 280, top: -20, bottom: 420 }}
                      className="absolute bottom-4 right-4 w-28 aspect-[3/4] bg-neutral-950 border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl z-30 cursor-grab active:cursor-grabbing hover:border-white/40 transition-colors"
                    >
                      <video
                        ref={(el) => {
                          localVideoRef.current = el;
                          if (el && localStream) {
                            el.srcObject = localStream;
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 ${
                          beautyMode ? 'brightness-105 contrast-95 saturate-105' : ''
                        }`}
                      />
                      {beautyMode && (
                        <div className="absolute top-1.5 right-1.5 bg-indigo-500 text-white p-0.5 rounded-full shadow border border-white/10" title="Beauty Mode Active">
                          <Sparkles className="w-3 h-3" />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Overlaid status flags inside stream */}
                  <div className="absolute bottom-4 left-4 flex flex-col space-y-1.5 z-20 pointer-events-none">
                    {micMuted && (
                      <span className="bg-red-500/90 border border-red-500/20 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center space-x-1 backdrop-blur-sm">
                        <MicOff className="w-2.5 h-2.5" />
                        <span>Muted</span>
                      </span>
                    )}
                    {videoOff && (
                      <span className="bg-red-500/90 border border-red-500/20 text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center space-x-1 backdrop-blur-sm">
                        <Camera className="w-2.5 h-2.5" />
                        <span>Cam Off</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. FOOTER: Active connection timer and actions panel */}
            <div className="flex flex-col space-y-6 pb-4">
              
              {/* Call Timer Display */}
              {callState.status === 'connected' && (
                <div className="text-center font-mono">
                  <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-bold block mb-1">
                    In Progress
                  </span>
                  <span className="text-xl font-bold text-emerald-400 tabular-nums">
                    {Math.floor(callState.durationSeconds / 60)}:
                    {(callState.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Action toggles panel (Glassmorphic bar) */}
              {callState.status === 'connected' && (
                <div className="flex justify-center items-center space-x-4 bg-white/5 border border-white/10 backdrop-blur-xl p-3 rounded-3xl max-w-sm mx-auto w-full">
                  
                  {/* 1. Mute Mic Toggle */}
                  <button
                    onClick={toggleMicMute}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      micMuted ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-neutral-200 border border-white/5'
                    }`}
                    title={micMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* 2. Video Toggle */}
                  <button
                    onClick={toggleVideoOff}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      videoOff ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-neutral-200 border border-white/5'
                    }`}
                    title={videoOff ? "Enable Video" : "Disable Video"}
                  >
                    {videoOff ? <WifiOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </button>

                  {/* 3. Camera Flip (Video Call only) */}
                  {callState.type === 'video' ? (
                    <button
                      onClick={switchCamera}
                      className="p-3.5 rounded-2xl bg-white/5 text-neutral-200 border border-white/5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  ) : (
                    /* 3b. Bluetooth Toggle (Voice Call only) */
                    <button
                      onClick={() => {
                        const nextBluetooth = !bluetoothOn;
                        setBluetoothOn(nextBluetooth);
                        triggerBeep(nextBluetooth ? 580 : 420, 0.05);
                      }}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        bluetoothOn ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-neutral-200 border border-white/5'
                      }`}
                      title="Bluetooth Audio Router"
                    >
                      <Bluetooth className="w-5 h-5" />
                    </button>
                  )}

                  {/* 4. Speaker Mode Toggle */}
                  <button
                    onClick={() => {
                      const nextSpeaker = !isSpeakerOn;
                      setIsSpeakerOn(nextSpeaker);
                      triggerBeep(nextSpeaker ? 510 : 390, 0.05);
                    }}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isSpeakerOn ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-neutral-400 border border-white/5'
                    }`}
                    title={isSpeakerOn ? "Turn Speaker Off (Earpiece)" : "Turn Speaker On (Speaker)"}
                  >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>

                  {/* 5. Beauty Mode Toggle (Video Call only) */}
                  {callState.type === 'video' && (
                    <button
                      onClick={() => {
                        const nextBeauty = !beautyMode;
                        setBeautyMode(nextBeauty);
                        triggerBeep(nextBeauty ? 600 : 450, 0.05);
                      }}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        beautyMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-neutral-400 border border-white/5'
                      }`}
                      title={beautyMode ? "Turn Off Beauty Filter" : "Turn On Beauty Filter"}
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  )}

                  {/* 6. Add Participant placeholder (Coming Soon badge) */}
                  {callState.type === 'audio' && (
                    <button
                      disabled
                      className="p-3.5 rounded-2xl bg-white/5 text-neutral-500 border border-white/5 relative opacity-50 cursor-not-allowed"
                      title="Group Calling Coming Soon"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Decline/Decline/Hangup calling CTA triggers bar */}
              <div className="flex justify-center space-x-8">
                {callState.incoming && callState.status === 'ringing' ? (
                  <>
                    {/* Decline button */}
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => endCall('declined')}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition hover:scale-110 cursor-pointer"
                        title="Decline Call"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </button>
                      <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider font-bold">Decline</span>
                    </div>

                    {/* Answer button */}
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={answerIncomingCall}
                        className="w-16 h-16 rounded-full bg-[#0F8A5F] hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition hover:scale-110 cursor-pointer relative"
                        title="Answer Call"
                      >
                        {/* soft answer pulse circle */}
                        <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                        <Phone className="w-6 h-6" />
                      </button>
                      <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider font-bold">Answer</span>
                    </div>
                  </>
                ) : (
                  /* Decline/Hang Up Active Call Button */
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => endCall(callState.status === 'ringing' ? 'missed' : 'completed')}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-95 transition hover:scale-110 cursor-pointer"
                      title="Hang Up Call"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider font-bold">Hang Up</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </>
  );
}
