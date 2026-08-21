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

export default function AppModals() {
  const {
    neighbors,
    setSelectedNeighbor,
    selectedNeighbor,
    pendingFriendRequests,
    sentFriendRequestIds,
    userDisplayName,
    userUsername,
    customProfilePhoto,
    handlePublishStoryComposition,
    chatMessages,
    _setChatMessages,
    currentUser,
    userNoteText,
    setUserNoteText,
    showNoteModal,
    setShowNoteModal,
    friendIds,
    appTheme,
    mutedStoryUserIds,
    toggleMuteNeighborStories,
    storyUploadData,
    setStoryUploadData,
    storyCompositionCaption,
    setStoryCompositionCaption,
    storyCompositionPrivacy,
    setStoryCompositionPrivacy,
    storyCompositionCustomList,
    setStoryCompositionCustomList,
    isPublishingStory,
    playingStorySnaps,
    playingSnapIndex,
    setIsStoryPaused,
    storyViewerReplies,
    setStoryViewerReplies,
    showStoryViewerList,
    setShowStoryViewerList,
    storyViewer,
    setStoryViewer,
    showStoryChoiceModal,
    setShowStoryChoiceModal,
    showAddFriendsModal,
    setShowAddFriendsModal,
    setAudioFeedback,
    blockedNeighborIds,
    mutedNeighborIds,
    unreadNeighborIds,
    longPressedNeighborForMenu,
    setLongPressedNeighborForMenu,
    showMediaGalleryModal,
    setShowMediaGalleryModal,
    activeMediaGalleryTab,
    setActiveMediaGalleryTab,
    archivedNeighborIds,
    saveOrUpdateMessageInFirestore,
    storyProgress,
    handleStoryViewerNext,
    handleStoryViewerPrev,
    triggerBeep,
    playVoiceNote,
    handleAddNewFriend,
    handleAcceptFriendRequest,
    handleTogglePinChat,
    handleToggleArchiveChat,
    handleToggleBlockNeighbor,
    handleToggleMuteNeighbor,
    handleToggleUnreadNeighbor,
    handleDeleteChat,
    handleAddMyNote,
    startStoryPlaylist,
  } = useNearbyRuntime();

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* INSTAGRAM NOTE EDIT DIALOG MODAL (Write thoughts)     */}
      {/* ---------------------------------------------------- */}
      {showNoteModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl w-full max-w-xs space-y-4">
            <div className="flex justify-between items-center text-white">
              <span className="font-bold text-sm tracking-tight flex items-center space-x-1">
                <span>Share a Note update</span>
              </span>
              <button 
                onClick={() => setShowNoteModal(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-neutral-400">
              Notes appear at the top of direct messages for 24 hours. Keep it snappy and Nigerian-style!
            </p>

            <div className="space-y-1">
              <input
                type="text"
                maxLength={60}
                value={userNoteText}
                onChange={(e) => setUserNoteText(e.target.value)}
                placeholder="Trekking around local jollof canteens... (60 chars)"
                className="w-full bg-neutral-950 text-white placeholder-neutral-500 border border-neutral-800 py-2.5 px-3.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[9px] text-neutral-500 font-mono text-right block pr-1">
                {60 - userNoteText.length} characters left
              </span>
            </div>

            <button
              onClick={handleAddMyNote}
              disabled={!userNoteText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-xl text-xs font-bold text-white text-center shadow-md transition"
            >
              Post Note Update 🚀
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STORY OR NOTE CHOICE MODAL (Nigerian style o!)        */}
      {/* ---------------------------------------------------- */}
      {showStoryChoiceModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl w-full max-w-xs space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <div className={`w-10 h-10 rounded-full ${showStoryChoiceModal.neighbor.avatarColor} flex items-center justify-center text-lg`}>
                <span>{showStoryChoiceModal.neighbor.avatarEmoji}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs block text-white truncate">{showStoryChoiceModal.neighbor.name}</span>
                <span className="text-[10px] text-indigo-400 font-mono block truncate">@{showStoryChoiceModal.neighbor.username}</span>
              </div>
            </div>
            
            <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-850 text-xs text-neutral-300 leading-relaxed font-sans italic">
              "{showStoryChoiceModal.note.text}"
            </div>
            
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSelectedNeighbor(showStoryChoiceModal.neighbor);
                  setShowStoryChoiceModal(null);
                  triggerBeep(520, 0.08);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs text-center transition active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>💬 Read Note & Start Chat</span>
              </button>
              
              <button
                onClick={() => {
                  const targetNbId = showStoryChoiceModal.neighbor.id;
                  setShowStoryChoiceModal(null);
                  startStoryPlaylist(targetNbId);
                  triggerBeep(600, 0.1);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs text-center transition active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>📸 Watch Status Story (Loop)</span>
              </button>
              
              <button
                onClick={() => {
                  setShowStoryChoiceModal(null);
                  triggerBeep(300, 0.05);
                }}
                className="w-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 font-bold py-2 rounded-xl text-xs text-center transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* WHATSAPP STYLE MEDIA GALLERY MODAL                 */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showMediaGalleryModal && selectedNeighbor && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowMediaGalleryModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] ${
                appTheme === 'dark' ? 'bg-[#1f2c34] text-neutral-100' : 'bg-white text-neutral-900 border border-neutral-100'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-neutral-700/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Media, Links & Docs</h3>
                  <p className="text-[11px] text-zinc-400">with {selectedNeighbor.name}</p>
                </div>
                <button
                  onClick={() => setShowMediaGalleryModal(false)}
                  className="p-1 rounded-full hover:bg-neutral-800/20 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs list */}
              <div className="flex border-b border-neutral-700/10 px-2 overflow-x-auto scrollbar-none shrink-0 bg-black/10">
                {(['photos', 'videos', 'documents', 'links', 'voice'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveMediaGalleryTab(tab);
                      triggerBeep(380, 0.05);
                    }}
                    className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center capitalize whitespace-nowrap px-3 ${
                      activeMediaGalleryTab === tab
                        ? 'border-[#25D366] text-[#25D366]'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab === 'voice' ? 'Voice Notes' : tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                {(() => {
                  const currentUid = currentUser?.uid || 'user';
                  const list = (chatMessages[selectedNeighbor.id] || []).filter(m => {
                    if (m.deletedForEveryone || m.deletedForUsers?.includes(currentUid)) return false;
                    
                    if (activeMediaGalleryTab === 'photos') return m.type === 'image';
                    if (activeMediaGalleryTab === 'videos') return m.type === 'video';
                    if (activeMediaGalleryTab === 'documents') return m.type === 'document';
                    if (activeMediaGalleryTab === 'voice') return m.type === 'voice';
                    if (activeMediaGalleryTab === 'links') {
                      return m.type === 'text' && (m.text?.includes('http://') || m.text?.includes('https://') || m.text?.includes('www.'));
                    }
                    return false;
                  });

                  if (list.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-2">
                        <span className="text-3xl opacity-60">📁</span>
                        <p className="text-xs text-zinc-400">No {activeMediaGalleryTab} found in this chat</p>
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'photos' || activeMediaGalleryTab === 'videos') {
                    return (
                      <div className="grid grid-cols-3 gap-2.5">
                        {list.map((m) => (
                          <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-black border border-neutral-700/20 group cursor-pointer"
                               onClick={() => {
                                 triggerBeep(450, 0.05);
                               }}>
                            {m.type === 'image' ? (
                              <img src={m.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center relative">
                                <video src={m.mediaUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                                  <span className="text-white text-xl">▶️</span>
                                </div>
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 text-[8px] px-1 bg-black/60 rounded text-white font-mono">
                              {new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'documents') {
                    return (
                      <div className="flex flex-col space-y-2">
                        {list.map((m) => (
                          <div key={m.id} className="p-3 bg-black/20 hover:bg-black/30 border border-neutral-700/25 rounded-xl flex items-center justify-between space-x-3">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <FileText className="w-5 h-5 text-sky-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold truncate max-w-[200px]">{m.fileName || 'document.pdf'}</h4>
                                <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">{m.fileSize || '1.2 MB'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                triggerBeep(400, 0.05);
                                setAudioFeedback(`Downloading document: ${m.fileName || 'file'}`);
                              }}
                              className="p-1.5 rounded-lg hover:bg-neutral-800 text-sky-400"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'links') {
                    return (
                      <div className="flex flex-col space-y-2">
                        {list.map((m) => {
                          const urlMatch = m.text?.match(/https?:\/\/[^\s]+/g);
                          const url = urlMatch ? urlMatch[0] : '#';
                          return (
                            <a
                              key={m.id}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-black/25 hover:bg-black/35 border border-neutral-700/20 rounded-xl flex items-start space-x-3 transition cursor-pointer"
                              onClick={() => triggerBeep(400, 0.05)}
                            >
                              <Link className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-emerald-400 truncate">{url}</h4>
                                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{m.text}</p>
                                <span className="text-[8px] text-zinc-500 font-mono block mt-1">
                                  {new Date(m.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    );
                  }

                  if (activeMediaGalleryTab === 'voice') {
                    return (
                      <div className="flex flex-col space-y-2">
                        {list.map((m) => (
                          <div key={m.id} className="p-3 bg-black/20 border border-neutral-700/10 rounded-xl flex items-center justify-between space-x-3">
                            <div className="flex items-center space-x-2">
                              <Mic className="w-4 h-4 text-[#25D366]" />
                              <span className="text-xs font-bold">Voice Note ({m.audioDurationSec || 0}s)</span>
                            </div>
                            <button
                              onClick={() => {
                                playVoiceNote(m, selectedNeighbor.name);
                                triggerBeep(450, 0.05);
                              }}
                              className="px-3 py-1 bg-[#25D366] text-neutral-900 font-bold rounded-lg text-[10px] hover:bg-emerald-500 active:scale-95 transition"
                            >
                              Play
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* CHAT LIST ITEM LONG PRESS / CONTEXT MENU OVERLAY */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {longPressedNeighborForMenu && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setLongPressedNeighborForMenu(null)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-t-3xl rounded-b-xl overflow-hidden p-5 shadow-2xl flex flex-col space-y-4 max-h-[85vh] overflow-y-auto ${
                appTheme === 'dark' ? 'bg-[#1f2c34] text-neutral-100' : 'bg-white text-neutral-900 border border-neutral-100'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/20">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${longPressedNeighborForMenu.avatarColor} flex items-center justify-center text-lg`}>
                    <span>{longPressedNeighborForMenu.avatarEmoji}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{longPressedNeighborForMenu.name}</h3>
                    <p className="text-xs text-zinc-400">@{longPressedNeighborForMenu.username || 'neighbor'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setLongPressedNeighborForMenu(null)}
                  className="p-1 rounded-full hover:bg-neutral-800/20 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col space-y-1">
                {/* 1. Pin / Unpin */}
                <button
                  onClick={() => {
                    handleTogglePinChat(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <Pin className="w-4 h-4 text-amber-500 rotate-45" />
                  <span>{longPressedNeighborForMenu.pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                </button>

                {/* 2. Mark as Unread / Read */}
                <button
                  onClick={() => {
                    handleToggleUnreadNeighbor(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>{unreadNeighborIds.includes(longPressedNeighborForMenu.id) ? 'Mark as Read' : 'Mark as Unread'}</span>
                </button>

                {/* 3. Mute / Unmute */}
                <button
                  onClick={() => {
                    handleToggleMuteNeighbor(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  {mutedNeighborIds.includes(longPressedNeighborForMenu.id) ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#25D366]" />
                      <span>Unmute Notifications</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-zinc-500" />
                      <span>Mute Notifications</span>
                    </>
                  )}
                </button>

                {/* 4. Archive / Unarchive */}
                <button
                  onClick={() => {
                    handleToggleArchiveChat(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <Archive className="w-4 h-4 text-sky-500" />
                  <span>{archivedNeighborIds.includes(longPressedNeighborForMenu.id) ? 'Unarchive Chat' : 'Archive Chat'}</span>
                </button>

                {/* 5. Delete Chat */}
                <button
                  onClick={() => {
                    handleDeleteChat(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Delete Chat</span>
                </button>

                {/* 6. View Profile */}
                <button
                  onClick={() => {
                    setSelectedNeighbor(longPressedNeighborForMenu);
                    setLongPressedNeighborForMenu(null);
                    triggerBeep(450, 0.08);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium transition"
                >
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>View Profile</span>
                </button>

                {/* 7. Block / Unblock */}
                <button
                  onClick={() => {
                    handleToggleBlockNeighbor(longPressedNeighborForMenu.id);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium text-red-500/80 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>{blockedNeighborIds.includes(longPressedNeighborForMenu.id) ? 'Unblock User' : 'Block User'}</span>
                </button>

                {/* 8. Report User */}
                <button
                  onClick={() => {
                    setAudioFeedback(`Report submitted against @${longPressedNeighborForMenu.username}. We are auditing their messages.`);
                    triggerBeep(300, 0.15);
                    setLongPressedNeighborForMenu(null);
                  }}
                  className="flex items-center space-x-3 w-full p-2.5 rounded-lg hover:bg-neutral-800/10 dark:hover:bg-neutral-800/30 text-left text-sm font-medium text-orange-400 transition"
                >
                  <Info className="w-4 h-4 text-orange-400" />
                  <span>Report User</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* SNAPCHAT STYLE ADD FRIENDS MODAL o!                 */}
      {/* ---------------------------------------------------- */}
      {showAddFriendsModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl w-full max-w-sm flex flex-col max-h-[85vh] shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-3 text-white">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 text-base">👻</span>
                <span className="font-bold text-sm tracking-tight flex items-center">Add Close Friends</span>
              </div>
              <button 
                onClick={() => setShowAddFriendsModal(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 mb-3 mt-1 leading-relaxed">
              Mutually adding close neighbors puts them in your close circle, letting you enjoy media story playlist flows together!
            </p>

            {/* List scroll container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {(() => {
                const nonFriends = neighbors.filter(n => n.id !== 'nb-myai');
                if (nonFriends.length === 0) {
                  return <div className="text-center py-6 text-xs text-neutral-500">No active neighbors found on radar grid.</div>;
                }

                return nonFriends.map((nb) => {
                  const isAlreadyFriend = (Array.isArray(friendIds) ? friendIds : []).includes(nb.id);
                  return (
                    <div 
                      key={nb.id}
                      className="p-3 bg-neutral-950 rounded-2xl border border-neutral-855 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${nb.avatarColor} flex items-center justify-center text-base flex-shrink-0 shadow-inner`}>
                          <span>{nb.avatarEmoji}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{nb.name}</span>
                          <span className="text-[9px] text-indigo-400 font-mono block truncate">
                            {`📍 Distance: ${nb.distanceMeters}m away`}
                          </span>
                        </div>
                      </div>

                      {/* Add or Friend Status Badge */}
                      {isAlreadyFriend ? (
                        <div className="flex items-center space-x-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[9px] px-2.5 py-1 rounded-lg">
                          <span>Mutual Friends</span>
                        </div>
                      ) : sentFriendRequestIds.includes(nb.id) ? (
                        <button
                          onClick={() => {
                            handleAddNewFriend(nb.id);
                          }}
                          className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-[10px] rounded-lg shadow transition active:scale-95 cursor-pointer"
                        >
                          <span>Request Sent</span>
                        </button>
                      ) : pendingFriendRequests.includes(nb.id) ? (
                        <button
                          onClick={() => {
                            handleAcceptFriendRequest(nb.id);
                          }}
                          className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[10px] rounded-lg shadow transition active:scale-95 cursor-pointer"
                        >
                          <span>Accept Request</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleAddNewFriend(nb.id);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow transition active:scale-95 cursor-pointer"
                        >
                          <span>+ Add Friend</span>
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FULL SNAP PUBLIC STORY INTERACTIVE VIEWING OVERLAY   */}
      {/* ---------------------------------------------------- */}
      {storyViewer && playingStorySnaps.length > 0 && (
        <div 
          onMouseDown={() => setIsStoryPaused(true)}
          onMouseUp={() => setIsStoryPaused(false)}
          onTouchStart={() => setIsStoryPaused(true)}
          onTouchEnd={() => setIsStoryPaused(false)}
          className="absolute inset-0 bg-neutral-950 z-[100] flex flex-col justify-between overflow-hidden select-none text-white animate-fade-in"
        >
          {/* Segmented Instagram & WhatsApp Progress Bars */}
          <div className="flex space-x-1.5 px-4 pt-4 z-20">
            {playingStorySnaps.map((_, sIdx) => {
              let fillWidth = '0%';
              if (sIdx < playingSnapIndex) fillWidth = '100%';
              else if (sIdx === playingSnapIndex) fillWidth = `${storyProgress}%`;
              
              return (
                <div key={`progress-bar-${sIdx}`} className="h-1 bg-white/20 flex-1 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-white transition-all duration-75"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* Player Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/80 to-transparent z-20">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-full ${storyViewer === 'me' ? 'bg-indigo-600 border border-indigo-500' : storyViewer.avatarColor} flex items-center justify-center text-sm overflow-hidden`}>
                {storyViewer === 'me' ? (
                  currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>🙋‍♂️</span>
                  )
                ) : (
                  storyViewer.customProfilePhoto ? (
                    <img src={storyViewer.customProfilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{storyViewer.avatarEmoji}</span>
                  )
                )}
              </div>
              <div>
                <span className="font-bold text-xs block text-white">
                  {storyViewer === 'me' ? 'Your Status' : storyViewer.name}
                </span>
                <p className="text-[9px] text-zinc-300 font-mono">
                  {playingStorySnaps[playingSnapIndex]?.timestamp || 'active update'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {storyViewer !== 'me' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMuteNeighborStories(storyViewer.id);
                    setStoryViewer(null);
                  }}
                  className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-black/40 border border-white/10 text-zinc-300 rounded-xl hover:bg-black/60 transition"
                >
                  {mutedStoryUserIds.includes(storyViewer.id) ? '🔊 Unmute' : '🔕 Mute'}
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setStoryViewer(null);
                  triggerBeep(300, 0.05);
                }}
                className="text-white bg-black/40 p-1.5 rounded-full hover:bg-black/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary View Area - Supports video and image rendering */}
          <div className="flex-1 flex items-center justify-center relative px-2">
            
            {/* Gesture boundaries: Left zone (35%) goes previous, Right zone (65%) goes next */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleStoryViewerPrev();
              }}
              className="absolute top-0 bottom-0 left-0 w-[35%] z-10 cursor-pointer"
            />
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleStoryViewerNext();
              }}
              className="absolute top-0 bottom-0 right-0 w-[65%] z-10 cursor-pointer"
            />

            {playingStorySnaps[playingSnapIndex] && (
              <div className="w-full max-w-[440px] aspect-[9/16] bg-black/40 border border-neutral-900 rounded-[2.5rem] overflow-hidden flex flex-col justify-between items-center relative shadow-2xl">
                <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                  {playingStorySnaps[playingSnapIndex].type === 'video' ? (
                    <video
                      src={playingStorySnaps[playingSnapIndex].mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <img 
                      src={playingStorySnaps[playingSnapIndex].mediaUrl} 
                      alt="story snapshot" 
                      className="w-full h-full object-contain pointer-events-none" 
                    />
                  )}
                </div>

                {/* Status Caption */}
                {playingStorySnaps[playingSnapIndex].caption && (
                  <div className="absolute bottom-6 left-4 right-4 bg-black/75 py-2.5 px-4 rounded-2xl text-center text-xs font-semibold leading-relaxed backdrop-blur-md shadow-lg border border-white/5 mx-2 text-zinc-100 z-20">
                    {playingStorySnaps[playingSnapIndex].caption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Interactive Area */}
          <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 pb-6 space-y-3 z-30">
            
            {/* Viewer lists panel for own story */}
            {storyViewer === 'me' ? (
              <div className="space-y-2">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStoryViewerList(!showStoryViewerList);
                    triggerBeep(450, 0.05);
                  }}
                  className="flex items-center justify-between w-full bg-neutral-900/80 border border-neutral-800 p-2.5 rounded-xl text-neutral-300 text-xs font-bold hover:text-white hover:bg-neutral-800/90 transition select-none"
                >
                  <span className="flex items-center space-x-2">
                    <span>👁️</span>
                    <span>Viewer Count: {playingStorySnaps[playingSnapIndex]?.viewers?.length || 0} views</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{showStoryViewerList ? '▲ Hide Lists' : '▼ Show Viewers & Reactions'}</span>
                </button>

                {showStoryViewerList && (
                  <div 
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2.5 max-h-[160px] overflow-y-auto scrollbar-thin animate-fade-in text-left cursor-default"
                  >
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400 border-b border-neutral-800 pb-1">Viewers List:</p>
                      {(!playingStorySnaps[playingSnapIndex]?.viewers || playingStorySnaps[playingSnapIndex].viewers!.length === 0) ? (
                        <p className="text-[10px] text-zinc-500 italic py-2">No views yet.</p>
                      ) : (
                        <div className="divide-y divide-neutral-900">
                          {playingStorySnaps[playingSnapIndex].viewers!.map((v, vIdx) => (
                            <div key={`viewer-${vIdx}-${v.userId}`} className="flex items-center justify-between py-1.5 text-xs">
                              <span className="font-bold text-zinc-300">{v.name} (@{v.username})</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{v.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-800">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 border-b border-neutral-800 pb-1">Status Interactions:</p>
                      
                      {/* Show emojis reactions onto this snap */}
                      <div className="mt-1.5 space-y-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 block">Emoji Reactions:</span>
                        {(!playingStorySnaps[playingSnapIndex]?.reactions || playingStorySnaps[playingSnapIndex].reactions!.length === 0) ? (
                          <span className="text-[9px] text-zinc-500 italic">No reactions yet</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {playingStorySnaps[playingSnapIndex].reactions!.map((r, rIdx) => (
                              <span key={`react-view-${rIdx}`} className="text-[10px] bg-black/40 border border-neutral-800 px-2 py-1 rounded-full flex items-center space-x-1">
                                <span className="text-zinc-400 font-bold">@{r.username}:</span>
                                <span>{r.emoji}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Show replies received directly to this snap */}
                      <div className="mt-2.5 space-y-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 block">Replies Received:</span>
                        {(!playingStorySnaps[playingSnapIndex]?.replies || playingStorySnaps[playingSnapIndex].replies!.length === 0) ? (
                          <p className="text-[9px] text-zinc-500 italic">No direct replies yet</p>
                        ) : (
                          <div className="space-y-1 bg-black/40 p-1.5 rounded-lg border border-neutral-800">
                            {playingStorySnaps[playingSnapIndex].replies!.map((rep, repIdx) => (
                              <div key={`reply-view-${repIdx}`} className="text-[10px] py-1 border-b border-neutral-900 last:border-0 leading-normal">
                                <span className="font-bold text-indigo-300">@{rep.username}</span>: <span className="text-zinc-200">{rep.text}</span>
                                <span className="text-[8px] text-zinc-500 block text-right">{rep.timestamp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Viewer is interactive peer - replies form and emojis reactions */
              <div 
                onMouseDown={(e) => e.stopPropagation()} 
                className="space-y-2.5 text-center cursor-default"
              >
                {/* 1. Quick Emoji Reactions deck */}
                <div className="flex items-center justify-center space-x-3 bg-neutral-900/60 border border-neutral-800/80 p-2 rounded-2xl max-w-sm mx-auto">
                  {['😂', '❤️', '😮', '😢', '👏', '🔥', '🎉'].map(emoji => (
                    <button
                      key={`emoji-react-${emoji}`}
                      onClick={async () => {
                        const snap = playingStorySnaps[playingSnapIndex];
                        if (snap && storyViewer && storyViewer !== 'me') {
                          triggerBeep(480, 0.08);
                          // 1. Add reaction in story doc
                          try {
                            const storyDocRef = doc(db, 'users', storyViewer.id, 'stories', snap.id);
                            const currentReactions = snap.reactions || [];
                            const newReaction = {
                              userId: currentUser!.uid,
                              username: userUsername || 'anonymous',
                              emoji
                            };
                            await updateDoc(storyDocRef, {
                              reactions: [...currentReactions, newReaction]
                            });

                            // 2. Forward to direct messages
                            const friendlyMsgBody = `Reacted ${emoji} to your status update! 📲`;
                            const messageId = `msg-${Date.now()}`;
                            const dm: DirectMessage = {
                              id: messageId,
                              senderId: 'user',
                              receiverId: storyViewer.id,
                              chatThreadId: storyViewer.id,
                              timestamp: new Date().toISOString(),
                              type: 'text',
                              text: `[Reaction to status]: ${snap.caption ? `"${snap.caption}"` : "[Status Image/Video]"}\n\n${friendlyMsgBody}`,
                              status: 'sent',
                              mediaUrl: snap.mediaUrl || undefined
                            };
                            await saveOrUpdateMessageInFirestore(dm, storyViewer.id);
                            _setChatMessages(prev => ({
                              ...prev,
                              [storyViewer.id]: [...(prev[storyViewer.id] || []), dm]
                            }));

                            setAudioFeedback(`Sent ${emoji} reaction! 📲`);
                            setTimeout(() => setAudioFeedback(""), 2000);
                          } catch (err) {
                            console.warn("Failed reaction save:", err);
                          }
                        }
                      }}
                      className="text-lg hover:scale-125 transition active:scale-90 cursor-pointer"
                      title="Send quick reaction"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* 2. Text reply composer form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const snap = playingStorySnaps[playingSnapIndex];
                    if (!storyViewerReplies.trim() || !snap || !storyViewer || storyViewer === 'me') return;
                    
                    const textToSend = storyViewerReplies;
                    setStoryViewerReplies('');
                    triggerBeep(520, 0.1);

                    try {
                      const storyDocRef = doc(db, 'users', storyViewer.id, 'stories', snap.id);
                      const currentReplies = snap.replies || [];
                      const newReply = {
                        userId: currentUser!.uid,
                        username: userUsername || 'anonymous',
                        name: userDisplayName || 'Anonymous',
                        text: textToSend,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                      await updateDoc(storyDocRef, {
                        replies: [...currentReplies, newReply]
                      });

                      // Also generate a physical message to User's Chat Inbox o!
                      const dmMsgId = `msg-${Date.now()}`;
                      const customInboxText = `[Replied to Status 📸]: ${snap.caption ? `"${snap.caption}"` : "Story"} \n\n"${textToSend}"`;
                      const dm: DirectMessage = {
                        id: dmMsgId,
                        senderId: 'user',
                        receiverId: storyViewer.id,
                        chatThreadId: storyViewer.id,
                        timestamp: new Date().toISOString(),
                        type: 'text',
                        text: customInboxText,
                        status: 'sent',
                        mediaUrl: snap.mediaUrl || undefined
                      };
                      await saveOrUpdateMessageInFirestore(dm, storyViewer.id);
                      _setChatMessages(prev => ({
                        ...prev,
                        [storyViewer.id]: [...(prev[storyViewer.id] || []), dm]
                      }));

                      setAudioFeedback("Your reply is on its way! 📬");
                      setTimeout(() => setAudioFeedback(""), 3000);
                    } catch (err) {
                      console.warn("Error sending story reply:", err);
                    }
                  }}
                  className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-full px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-indigo-500 max-w-sm mx-auto shadow-md"
                >
                  <input
                    type="text"
                    value={storyViewerReplies}
                    onChange={(e) => setStoryViewerReplies(e.target.value)}
                    placeholder={`Reply to ${storyViewer.name}...`}
                    className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs placeholder-neutral-500 text-white"
                  />
                  <button
                    type="submit"
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:text-neutral-600 transition"
                    disabled={!storyViewerReplies.trim()}
                  >
                    Reply
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PREMIUM INTERACTIVE STATUS COMPOSER WIZARD          */}
      {/* ---------------------------------------------------- */}
      {storyUploadData && (
        <div className="absolute inset-0 bg-neutral-950 backdrop-blur-lg z-[110] flex flex-col justify-between p-5 text-white animate-fade-in overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-neutral-850">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📲</span>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white">Status Composer</h3>
                <span className="text-[10px] text-zinc-400 font-mono">Create custom ephemeral story updates</span>
              </div>
            </div>
            <button
              onClick={() => {
                setStoryUploadData(null);
                setStoryCompositionCaption('');
                setStoryCompositionPrivacy('everyone');
                setStoryCompositionCustomList([]);
                triggerBeep(350, 0.05);
              }}
              className="text-zinc-400 hover:text-white bg-white/5 p-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 my-5 space-y-4 max-w-sm mx-auto w-full">
            {/* Visual media preview block container */}
            <div className="relative aspect-[9/12] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
              {storyUploadData.type === 'video' ? (
                <video
                  src={storyUploadData.mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <img
                  src={storyUploadData.mediaUrl}
                  alt="Custom Story Source"
                  className="w-full h-full object-contain pointer-events-none"
                />
              )}
              <div className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-300">
                {storyUploadData.type.toUpperCase()} PREVIEW
              </div>
            </div>

            {/* Caption Text Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                ✏️ Caption Status:
              </label>
              <input
                type="text"
                value={storyCompositionCaption}
                onChange={(e) => setStoryCompositionCaption(e.target.value)}
                placeholder="What's on your mind? Add caption o..."
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Privacy Select Config */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                🔒 Access & Privacy Controls:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'everyone', label: 'Everyone', desc: 'All local users' },
                  { id: 'friends', label: 'Friends', desc: 'Mutual connections' },
                  { id: 'custom', label: 'Custom List', desc: 'Pick specific friends' }
                ].map(pPlan => (
                  <button
                    key={`privacy-plan-${pPlan.id}`}
                    type="button"
                    onClick={() => {
                      setStoryCompositionPrivacy(pPlan.id as any);
                      triggerBeep(450, 0.05);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer select-none ${
                      storyCompositionPrivacy === pPlan.id 
                        ? 'bg-indigo-650 text-white border-indigo-500 shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">{pPlan.label}</span>
                    <span className="text-[8px] opacity-75 mt-0.5 block leading-tight">{pPlan.desc}</span>
                  </button>
                ))}
              </div>

              {/* Custom list builder checklist */}
              {storyCompositionPrivacy === 'custom' && (
                <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                  <p className="text-[9px] font-extrabold uppercase text-zinc-500">Pick Specific Friends to Share With:</p>
                  
                  {neighbors.filter(nb => !nb.isGroup && nb.id !== 'nb-myai').length === 0 ? (
                    <p className="text-[10px] text-zinc-600 italic py-1">No other registered friends found</p>
                  ) : (
                    neighbors.filter(nb => !nb.isGroup && nb.id !== 'nb-myai').map(nb => {
                      const isChecked = storyCompositionCustomList.includes(nb.id);
                      return (
                        <label 
                          key={`custom-priv-item-${nb.id}`} 
                          className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-neutral-800 hover:bg-black/65 cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs">{nb.avatarEmoji || "👤"}</span>
                            <span className="text-xs font-bold text-zinc-300">{nb.name}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              triggerBeep(440, 0.05);
                              if (isChecked) {
                                setStoryCompositionCustomList(prev => prev.filter(uid => uid !== nb.id));
                              } else {
                                setStoryCompositionCustomList(prev => [...prev, nb.id]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-neutral-850 flex space-x-3 max-w-sm mx-auto w-full pb-4 bg-transparent">
            <button
              onClick={() => {
                setStoryUploadData(null);
                setStoryCompositionCaption('');
                setStoryCompositionPrivacy('everyone');
                setStoryCompositionCustomList([]);
                triggerBeep(300, 0.08);
              }}
              className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 text-zinc-300 hover:text-white border border-neutral-800 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePublishStoryComposition}
              disabled={isPublishingStory || (storyCompositionPrivacy === 'custom' && storyCompositionCustomList.length === 0)}
              className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-lg flex items-center justify-center space-x-2"
            >
              {isPublishingStory ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Status 📲</span>
              )}
            </button>
          </div>
        </div>
      )}

    </>
  );
}
