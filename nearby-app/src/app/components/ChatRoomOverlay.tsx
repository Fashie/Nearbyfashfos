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

export default function ChatRoomOverlay() {
  const {
    neighbors,
    setSelectedNeighbor,
    selectedNeighbor,
    chatLimit,
    setChatLimit,
    pendingFriendRequests,
    sentFriendRequestIds,
    chatFileRef,
    setViewingNeighborProfile,
    customProfilePhoto,
    handleGalleryUploadForChat,
    chatMessages,
    setChatMessages,
    currentUser,
    textInput,
    setTextInput,
    isAiTyping,
    customChatBg,
    setCustomChatBg,
    customChatBubbleStyle,
    customChatFont,
    friendIds,
    showActiveChatDropdown,
    setShowActiveChatDropdown,
    appTheme,
    chatMessagesEndRef,
    showPhotoMenu,
    setShowPhotoMenu,
    setAudioFeedback,
    replyingToMessage,
    setReplyingToMessage,
    activeChatSearchQuery,
    setActiveChatSearchQuery,
    showActiveChatSearch,
    setShowActiveChatSearch,
    showForwardModal,
    setShowForwardModal,
    simulatedTypingMap,
    blockedNeighborIds,
    mutedNeighborIds,
    showEmojiPicker,
    setShowEmojiPicker,
    emojiCategory,
    setEmojiCategory,
    emojiSearchQuery,
    setEmojiSearchQuery,
    recentlyUsedEmojis,
    setRecentlyUsedEmojis,
    setShowMediaGalleryModal,
    setActiveMediaGalleryTab,
    swipeOffsetMsgId,
    swipeOffsetAmount,
    handleMessageTouchStart,
    handleMessageTouchMove,
    handleMessageTouchEnd,
    activeBubbleDropdownId,
    setActiveBubbleDropdownId,
    isRecordingVoice,
    voiceDuration,
    playingVoiceId,
    triggerBeep,
    playVoiceNote,
    startCall,
    sendMessage,
    handleReaction,
    handleDeleteForMe,
    handleDeleteForEveryone,
    startCamera,
    startRecordingVoice,
    stopAndSendVoice,
    cancelRecordingVoice,
    handleAddNewFriend,
    handleAcceptFriendRequest,
    handleToggleBlockNeighbor,
    handleToggleMuteNeighbor,
    handleExportChat,
    theme,
  } = useNearbyRuntime();

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* IMMERSIVE CHAT ROOM VIEW (Active Message Thread Overlay) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {selectedNeighbor && (
          <Suspense fallback={
            <div className="absolute inset-0 z-40 bg-[#FAFAF9] dark:bg-[#111214] flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#0F8A5F]/20 border-t-[#0F8A5F] rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-xs font-mono">Opening safe direct channel...</p>
            </div>
          }>
            <PremiumChatRoom
              selectedNeighbor={selectedNeighbor}
              setSelectedNeighbor={setSelectedNeighbor}
              currentUser={currentUser}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              neighbors={neighbors}
              isAiTyping={isAiTyping}
              appTheme={appTheme}
              customChatBg={customChatBg}
              setCustomChatBg={setCustomChatBg}
              customChatFont={customChatFont}
              setViewingNeighborProfile={setViewingNeighborProfile}
              startCall={startCall}
              mutedNeighborIds={mutedNeighborIds}
              handleToggleMuteNeighbor={handleToggleMuteNeighbor}
              blockedNeighborIds={blockedNeighborIds}
              handleToggleBlockNeighbor={handleToggleBlockNeighbor}
              handleExportChat={handleExportChat}
              friendIds={friendIds}
              sentFriendRequestIds={sentFriendRequestIds}
              pendingFriendRequests={pendingFriendRequests}
              handleAcceptFriendRequest={handleAcceptFriendRequest}
              handleAddNewFriend={handleAddNewFriend}
              chatLimit={chatLimit}
              setChatLimit={setChatLimit}
              sendMessage={sendMessage}
              startRecordingVoice={startRecordingVoice}
              stopAndSendVoice={stopAndSendVoice}
              cancelRecordingVoice={cancelRecordingVoice}
              isRecordingVoice={isRecordingVoice}
              voiceDuration={voiceDuration}
              playingVoiceId={playingVoiceId}
              playVoiceNote={playVoiceNote}
              replyingToMessage={replyingToMessage}
              setReplyingToMessage={setReplyingToMessage}
              handleReaction={handleReaction}
              handleDeleteForMe={handleDeleteForMe}
              handleDeleteForEveryone={handleDeleteForEveryone}
              showForwardModal={showForwardModal}
              setShowForwardModal={setShowForwardModal}
              startCamera={startCamera}
              handleGalleryUploadForChat={handleGalleryUploadForChat}
              chatFileRef={chatFileRef}
              textInput={textInput}
              setTextInput={setTextInput}
              triggerBeep={triggerBeep}
              setAudioFeedback={setAudioFeedback}
            />
          </Suspense>
        )}

        {false && selectedNeighbor && (
          <motion.div 
            initial={{ x: '100%', opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`absolute inset-0 flex flex-col justify-between z-40 overflow-hidden ${
              customChatBg === 'cosmic' ? 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/60 via-neutral-950 to-black' :
              customChatBg === 'sunset' ? 'bg-gradient-to-b from-rose-950/40 via-neutral-950 to-neutral-950' :
              customChatBg === 'mint' ? 'bg-gradient-to-b from-teal-950/45 via-neutral-950 to-neutral-800' :
              customChatBg === 'royal' ? 'bg-gradient-to-b from-amber-950/30 via-neutral-950 to-neutral-950' :
              customChatBg === 'matrix' ? 'bg-black border border-green-900/30 font-mono shadow-[0_0_15px_rgba(0,128,0,0.1)]' :
              'bg-neutral-950'
            }`}
            style={{ fontFamily: 
              customChatFont === 'mono' ? '"JetBrains Mono", monospace' :
              customChatFont === 'serif' ? 'Georgia, serif' :
              customChatFont === 'chunky' ? 'Impact, sans-serif' :
              'inherit'
            }}
          >
          
          {/* Chat room Header strip with proximity walking metrics */}
          <div className="px-3 py-3 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center text-white shadow-sm">
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                onClick={() => {
                  setSelectedNeighbor(null);
                  triggerBeep(465, 0.08);
                }}
                className="p-1.5 hover:bg-neutral-800 rounded-full transition text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
                title="Back to Chats"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-white" />
              </button>
              
              <div 
                onClick={() => {
                  if (selectedNeighbor && !selectedNeighbor.isGroup) {
                    setViewingNeighborProfile(selectedNeighbor);
                    triggerBeep(520, 0.08);
                  }
                }}
                className={`flex items-center space-x-2 min-w-0 ${selectedNeighbor && !selectedNeighbor.isGroup ? 'cursor-pointer hover:opacity-85 active:scale-98 transition' : ''}`}
                title={selectedNeighbor && !selectedNeighbor.isGroup ? "View Profile" : ""}
              >
                <div className={`w-8 h-8 rounded-full ${selectedNeighbor.avatarColor} flex items-center justify-center text-xs flex-shrink-0 relative overflow-hidden`}>
                  {selectedNeighbor.customProfilePhoto ? (
                    <img 
                      src={selectedNeighbor.customProfilePhoto} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      alt="" 
                    />
                  ) : (
                    <span>{selectedNeighbor.avatarEmoji}</span>
                  )}
                  {(() => {
                    const status = selectedNeighbor.id === 'nb-myai' ? 'active' :
                                   selectedNeighbor.id === 'nb-1' ? 'active' :
                                   selectedNeighbor.id === 'nb-2' ? 'away' :
                                   selectedNeighbor.id === 'nb-3' ? 'offline' :
                                   selectedNeighbor.id === 'nb-4' ? 'away' :
                                   (selectedNeighbor.onlineStatus || 'offline');
                    if (status === 'active') {
                      return <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#25D366] rounded-full border border-neutral-900 animate-pulse" />;
                    } else if (status === 'away') {
                      return <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#F59E0B] rounded-full border border-neutral-900" />;
                    } else {
                      return <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#737373] rounded-full border border-neutral-900" />;
                    }
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1 flex-wrap">
                    <h4 className="font-bold text-[12.5px] truncate text-white leading-tight">{selectedNeighbor.name}</h4>
                    {selectedNeighbor.isGroup && (
                      <span className="text-[7px] bg-emerald-600/20 text-emerald-300 font-mono font-black rounded px-1">GROUP</span>
                    )}
                  </div>
                  
                  {/* Real-time Presence, Last Seen, and Typing status o! */}
                  <div className="text-[9.5px] truncate max-w-[150px] sm:max-w-none leading-none">
                    {simulatedTypingMap[selectedNeighbor.id] || selectedNeighbor.typingTo === currentUser?.uid ? (
                      <span className="text-[#25D366] font-bold animate-pulse">typing...</span>
                    ) : selectedNeighbor.isGroup ? (
                      <span className="text-zinc-400 truncate">
                        {selectedNeighbor.groupMembers?.map(m => neighbors.find(n => n.id === m)?.name || m).join(', ')}
                      </span>
                    ) : (() => {
                      const status = selectedNeighbor.id === 'nb-myai' ? 'active' :
                                     selectedNeighbor.id === 'nb-1' ? 'active' :
                                     selectedNeighbor.id === 'nb-2' ? 'away' :
                                     selectedNeighbor.id === 'nb-3' ? 'offline' :
                                     selectedNeighbor.id === 'nb-4' ? 'away' :
                                     (selectedNeighbor.onlineStatus || 'offline');
                      if (status === 'active') {
                        return <span className="text-[#25D366] font-mono">online</span>;
                      } else if (status === 'away') {
                        return <span className="text-[#F59E0B] font-mono">away</span>;
                      } else if (selectedNeighbor.lastSeen) {
                        return (
                          <span className="text-zinc-500 font-mono font-normal">
                            last seen {new Date(selectedNeighbor.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        );
                      } else {
                        return <span className="text-zinc-500 font-mono font-normal">offline</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Calling & Actions Capability Trigger Icons including Pin and Archive o! */}
            <div className="flex items-center space-x-1 relative">
              <button
                onClick={() => {
                  setShowActiveChatSearch(!showActiveChatSearch);
                  if (showActiveChatSearch) setActiveChatSearchQuery('');
                  triggerBeep(450, 0.05);
                }}
                className={`p-1.5 rounded-full transition ${showActiveChatSearch ? 'bg-[#25D366]/20 text-[#25D366]' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'}`}
                title="Search Messages"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => startCall(selectedNeighbor.id, 'video')}
                className="p-1.5 hover:bg-neutral-800 text-neutral-300 rounded-full transition"
                title="Video Call"
              >
                <VideoIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => startCall(selectedNeighbor.id, 'audio')}
                className="p-1.5 hover:bg-neutral-800 text-[#25D366] rounded-full transition"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  setShowActiveChatDropdown(!showActiveChatDropdown);
                  triggerBeep(320, 0.05);
                }}
                className={`p-1.5 rounded-full transition hover:bg-neutral-800 ${showActiveChatDropdown ? 'text-[#25D366]' : 'text-neutral-400 hover:text-white'}`}
                title="More options"
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>

              {/* Dropdown Box */}
              <AnimatePresence>
                {showActiveChatDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowActiveChatDropdown(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-11 w-44 rounded-xl shadow-2xl border p-1.5 z-50 overflow-hidden font-sans bg-neutral-900 border-neutral-800 text-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                    >
                      <button
                        onClick={() => {
                          if (selectedNeighbor && !selectedNeighbor.isGroup) {
                            setViewingNeighborProfile(selectedNeighbor);
                          } else {
                            setAudioFeedback(`Group Info: ${selectedNeighbor.name}`);
                          }
                          setShowActiveChatDropdown(false);
                          triggerBeep(380, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        View Profile
                      </button>

                      <button
                        onClick={() => {
                          setShowActiveChatSearch(true);
                          setShowActiveChatDropdown(false);
                          triggerBeep(380, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        Search in Conversation
                      </button>

                      <button
                        onClick={() => {
                          setActiveMediaGalleryTab('photos');
                          setShowMediaGalleryModal(true);
                          setShowActiveChatDropdown(false);
                          triggerBeep(380, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        Media, Links & Files
                      </button>

                      <button
                        onClick={() => {
                          handleToggleMuteNeighbor(selectedNeighbor.id);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        {mutedNeighborIds.includes(selectedNeighbor.id) ? 'Unmute Notifications' : 'Mute Notifications'}
                      </button>

                      <button
                        onClick={() => {
                          const themes = ['slate', 'cosmic', 'sunset', 'mint', 'royal', 'matrix'];
                          const idx = themes.indexOf(customChatBg);
                          const nextTheme = themes[(idx + 1) % themes.length];
                          setCustomChatBg(nextTheme as any);
                          setShowActiveChatDropdown(false);
                          setAudioFeedback(`Wallpaper set to ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}.`);
                          triggerBeep(420, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-neutral-850 rounded-lg transition font-medium text-emerald-400"
                      >
                        Wallpaper
                      </button>

                      <button
                        onClick={() => {
                          handleExportChat(selectedNeighbor);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition"
                      >
                        Export Chat
                      </button>

                      <button
                        onClick={() => {
                          handleToggleBlockNeighbor(selectedNeighbor.id);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition text-red-400"
                      >
                        {blockedNeighborIds.includes(selectedNeighbor.id) ? 'Unblock User' : 'Block User'}
                      </button>

                      <button
                        onClick={() => {
                          setAudioFeedback(`Report submitted against @${selectedNeighbor.username}. We are auditing their messages.`);
                          triggerBeep(300, 0.15);
                          setShowActiveChatDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition text-orange-400"
                      >
                        Report User
                      </button>

                      <div className="h-px bg-neutral-800 my-1" />

                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to clear chat messages with " + selectedNeighbor.name + "?")) {
                            setChatMessages({
                              ...chatMessages,
                              [selectedNeighbor.id]: []
                            });
                            setAudioFeedback("Chat history cleared.");
                          }
                          setShowActiveChatDropdown(false);
                          triggerBeep(330, 0.05);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-850 rounded-lg transition text-rose-400 hover:text-rose-300"
                      >
                        Clear chat
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Chats Bubble Streams */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin">
            {/* Quick bio introduction snippet card */}
            <div className="p-3 bg-neutral-900/60 border border-neutral-800/40 rounded-2xl text-center space-y-1.5 mb-5 max-w-[280px] mx-auto">
              <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400 py-0.5 px-2 bg-neutral-800 rounded-full inline-block">
                Interests & Bio
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed italic">
                "{selectedNeighbor.bio}"
              </p>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {selectedNeighbor.interests.map(int => (
                  <span key={int} className="bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 text-[9px] px-2 py-0.2 rounded-full font-sans font-medium">
                    #{int}
                  </span>
                ))}
              </div>

              {/* Add Friend status prompt in the chat card */}
              {!selectedNeighbor.isGroup && selectedNeighbor.id !== 'nb-myai' && (
                <div className="pt-2 border-t border-neutral-800/40 mt-1.5">
                  {(Array.isArray(friendIds) ? friendIds : []).includes(selectedNeighbor.id) ? (
                    <div className="flex justify-center items-center space-x-1.5 text-[9px] text-green-400 font-mono font-bold uppercase py-0.5">
                      <span>✓ Connected Friend on Radar</span>
                    </div>
                  ) : sentFriendRequestIds.includes(selectedNeighbor.id) ? (
                    <button 
                      onClick={() => {
                        handleAddNewFriend(selectedNeighbor.id);
                        triggerBeep(320, 0.1);
                      }}
                      className="w-full py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-bold text-[9px] rounded-lg tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase font-sans cursor-pointer"
                    >
                      <span>⏳ Friend Request Sent</span>
                    </button>
                  ) : pendingFriendRequests.includes(selectedNeighbor.id) ? (
                    <button 
                      onClick={() => {
                        handleAcceptFriendRequest(selectedNeighbor.id);
                        triggerBeep(520, 0.1);
                      }}
                      className="w-full py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[9px] rounded-lg tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase font-sans cursor-pointer"
                    >
                      <span>🤝 Accept Friend Request</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        handleAddNewFriend(selectedNeighbor.id);
                        triggerBeep(520, 0.1);
                      }}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] rounded-lg tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase font-sans cursor-pointer"
                    >
                      <span>➕ Add Friend on Radar</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bubble Rendering Loop with WhatsApp enhancements */}
            {(() => {
              const currentUid = currentUser?.uid || 'user';
              let list = (chatMessages[selectedNeighbor.id] || []).filter(msg => {
                if (msg.deletedForUsers && msg.deletedForUsers.includes(currentUid)) {
                  return false;
                }
                return true;
              });

              if (showActiveChatSearch && activeChatSearchQuery) {
                list = list.filter(m => m.text && m.text.toLowerCase().includes(activeChatSearchQuery.toLowerCase()));
              }

              if (list.length === 0) {
                return (
                  <div className="text-center py-16 flex flex-col items-center justify-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-neutral-600 animate-pulse" />
                    <p className="font-mono text-[11px] text-neutral-500">
                      {showActiveChatSearch ? 'No messages found.' : "No messages yet. Say hello!"}
                    </p>
                  </div>
                );
              }

              const totalMessages = list.length;
              const slicedList = list.slice(-chatLimit);

              return (
                <>
                  {totalMessages > chatLimit && (
                    <div className="flex justify-center my-3.5">
                      <button
                        onClick={() => {
                          triggerBeep(400, 0.05);
                          setChatLimit(prev => prev + 50);
                        }}
                        className="px-3.5 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-[10px] font-mono text-indigo-400 cursor-pointer active:scale-95 transition-all shadow-md"
                      >
                        Load older messages ({totalMessages - chatLimit} remaining)
                      </button>
                    </div>
                  )}
                  {slicedList.map((msg) => {
                const isMy = msg.senderId === 'user' || msg.senderId === (currentUser?.uid);
                
                // If it is a Call Log action type:
                if (msg.type === 'call_log') {
                  return (
                    <div key={msg.id} className="flex justify-center my-3.5">
                      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-1.5 text-center text-[10px] text-neutral-400 font-mono">
                        {msg.callLog?.status === 'missed' ? (
                          <span className="text-red-400">🚨 Missed {msg.callLog.type} call</span>
                        ) : (
                          <span>📞 Completed {msg.callLog?.type} call ({msg.callLog?.durationSeconds}s)</span>
                        )}
                        <p className="text-[8px] text-neutral-600 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  );
                }

                const senderNeighbor = selectedNeighbor.isGroup 
                  ? neighbors.find(n => n.id === msg.senderId) 
                  : selectedNeighbor;
                const senderDisplayName = senderNeighbor ? senderNeighbor.name : (msg.senderId === 'nb-myai' ? 'Nearby AI' : 'Member');
                const senderUsername = senderNeighbor ? senderNeighbor.username : (msg.senderId === 'nb-myai' ? 'nearby_ai' : 'member');

                return (
                  <div
                    key={msg.id}
                    onTouchStart={(e) => handleMessageTouchStart(e, msg.id)}
                    onTouchMove={(e) => handleMessageTouchMove(e, msg.id)}
                    onTouchEnd={() => handleMessageTouchEnd(msg)}
                    style={{
                      transform: swipeOffsetMsgId === msg.id ? `translateX(${swipeOffsetAmount}px)` : 'none',
                      transition: swipeOffsetMsgId === msg.id ? 'none' : 'transform 0.15s ease-out'
                    }}
                    className={`flex ${isMy ? 'justify-end' : 'justify-start'} animate-fade-in group relative`}
                  >
                    <div className="max-w-[75%] space-y-1 relative">
                      
                      {/* Replied to layout inside bubble o! */}
                      {!isMy && !msg.deletedForEveryone && (
                        <span className="text-[10px] text-neutral-500 font-mono block ml-1">
                          {senderDisplayName} (@{senderUsername})
                        </span>
                      )}

                      {/* Bubble wrapper */}
                      <div
                        className={`p-3 relative shadow-md transition-all duration-305 ${
                          msg.deletedForEveryone 
                            ? 'rounded-2xl bg-neutral-900/60 border border-neutral-800 text-neutral-500 italic'
                            : isMy
                              ? (customChatBubbleStyle === 'sharp' ? 'rounded-none border border-neutral-700 text-white bg-indigo-600' :
                                 customChatBubbleStyle === 'neon' ? 'rounded-2xl rounded-br-none text-white bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]' :
                                 customChatBubbleStyle === 'gb_doubletick' ? 'rounded-xl rounded-br-none text-white bg-emerald-600 border border-emerald-500 shadow-sm' :
                                 customChatBubbleStyle === 'playful' ? 'rounded-3xl rounded-br-none text-white bg-[#075E54] border border-[#075E54]' :
                                 `rounded-2xl rounded-br-none ${theme.bubbleUser}`)
                              : (customChatBubbleStyle === 'sharp' ? 'rounded-none border border-neutral-700 text-neutral-100 bg-neutral-800' :
                                 customChatBubbleStyle === 'neon' ? 'rounded-2xl rounded-bl-none text-neutral-100 bg-neutral-800 border border-neutral-750 shadow-[0_0_12px_rgba(255,255,255,0.06)]' :
                                 customChatBubbleStyle === 'gb_doubletick' ? 'rounded-xl rounded-bl-none text-neutral-100 bg-neutral-850 border border-neutral-700 border-l-4 border-l-emerald-500' :
                                 customChatBubbleStyle === 'playful' ? 'rounded-3xl rounded-bl-none text-neutral-100 bg-[#262D31]' :
                                 `rounded-2xl rounded-bl-none ${theme.bubbleNeighbor}`)
                        }`}
                      >

                        {/* Forwarded Tag label o! */}
                        {msg.isForwarded && !msg.deletedForEveryone && (
                          <p className="text-[9px] text-[#25D366] italic flex items-center mb-1 font-mono">
                            <span className="mr-1">↩ Forwarded</span>
                          </p>
                        )}

                        {/* Replying target header nested card */}
                        {msg.replyTo && !msg.deletedForEveryone && (
                          <div className="mb-2 p-2 bg-black/15 border-l-4 border-l-emerald-400 rounded-lg text-left text-[11px] leading-snug">
                            <span className="font-bold text-[#25D366] block">@{msg.replyTo.senderName}</span>
                            <span className="opacity-80 block truncate font-sans">"{msg.replyTo.text}"</span>
                          </div>
                        )}

                        {msg.deletedForEveryone ? (
                          <p className="text-xs font-sans flex items-center space-x-1">
                            <span>🚫 This message was deleted for everyone</span>
                          </p>
                        ) : (
                          <>
                            {/* Text Message content */}
                            {msg.text && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                {msg.text}
                              </p>
                            )}

                            {/* Image attachment snap content */}
                            {msg.type === 'image' && msg.mediaUrl && (
                              <div className="rounded-xl overflow-hidden mt-1 border border-black/40 shadow-inner">
                                <img src={msg.mediaUrl} alt="chat attachment" className="w-full h-auto max-h-[180px] object-cover" />
                              </div>
                            )}

                            {/* Video attachment content */}
                            {msg.type === 'video' && msg.mediaUrl && (
                              <div className="rounded-xl overflow-hidden mt-1 border border-black/40 shadow-inner">
                                <video src={msg.mediaUrl} controls className="w-full h-auto max-h-[180px] object-cover rounded-xl" />
                              </div>
                            )}

                            {/* Document attachment content */}
                            {msg.type === 'document' && msg.mediaUrl && (
                              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-black/20 border border-white/5 mt-1">
                                <FileText className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-white truncate">{msg.fileName || "attachment_file"}</p>
                                  <p className="text-[9px] text-zinc-400 font-mono">{msg.fileSize || "180 KB"}</p>
                                </div>
                                <a 
                                  href={msg.mediaUrl} 
                                  download={msg.fileName || "attachment_file"} 
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition flex items-center justify-center cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}

                            {/* Voice recording sound panel representation */}
                            {msg.type === 'voice' && (
                              <div className="flex items-center space-x-2.5">
                                <button
                                  onClick={() => {
                                    playVoiceNote(msg, senderDisplayName);
                                  }}
                                  className="w-9 h-9 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0"
                                >
                                  <Play className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-[10px] text-[#25D366] font-mono font-bold">
                                    <span>Voice note play</span>
                                    <span>{msg.audioDurationSec}s</span>
                                  </div>
                                  <div className="h-1 bg-white/20 rounded-full mt-1 overflow-hidden relative">
                                    <div 
                                      className={`h-full bg-emerald-500 ${playingVoiceId === msg.id ? 'w-full transition-all duration-[6000ms]' : 'w-4'}`} 
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Precise short timing stamps & Delivery Checkmarks o! */}
                        <div className="flex justify-between items-center text-[9px] opacity-60 font-mono mt-1.5 space-x-2">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMy && !msg.deletedForEveryone && (
                            <span className="flex items-center space-x-0.5">
                              {msg.status === 'sending' ? (
                                <span className="text-[10px] animate-spin">⏳</span>
                              ) : msg.status === 'sent' ? (
                                <Check className="w-3.5 h-3.5 text-zinc-400" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Floating Reaction Badges o! */}
                        {msg.reactions && msg.reactions.length > 0 && !msg.deletedForEveryone && (
                          <div className="absolute -bottom-2 -right-1 bg-neutral-900 border border-neutral-800/80 rounded-full py-0.5 px-2 flex items-center space-x-0.5 text-[11px] shadow-lg select-none z-10">
                            {Array.from(new Set(msg.reactions.map(r => r.reaction))).slice(0, 3).map(emoji => (
                              <span key={emoji}>{emoji}</span>
                            ))}
                            {msg.reactions.length > 1 && (
                              <span className="text-[8px] text-zinc-400 font-mono ml-0.5">{msg.reactions.length}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options Menu & Reactions Popover Hover buttons o! */}
                      {!msg.deletedForEveryone && (
                        <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center space-x-1.5 bg-neutral-900/40 p-1.5 rounded-xl backdrop-blur">
                          <button 
                            onClick={() => {
                              setReplyingToMessage(msg);
                              triggerBeep(380, 0.04);
                            }}
                            className="text-white hover:text-[#25D366] text-xs p-1"
                            title="Reply"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              setActiveBubbleDropdownId(activeBubbleDropdownId === msg.id ? null : msg.id);
                              triggerBeep(450, 0.05);
                            }}
                            className="text-white hover:text-emerald-500 text-xs p-1"
                            title="More Options"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* More options floating dialogue drawer panel o! */}
                      {activeBubbleDropdownId === msg.id && (
                        <div className="absolute right-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5 shadow-2xl z-30 space-y-2 min-w-[170px] text-xs leading-normal font-sans text-neutral-300">
                          
                          {/* Floating raw emoji reactions palette */}
                          <div className="flex space-x-1 bg-neutral-950 p-1.5 rounded-full border border-neutral-800 justify-around select-none">
                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  handleReaction(msg, emoji);
                                  setActiveBubbleDropdownId(null);
                                }}
                                className="hover:scale-130 active:scale-95 transition-transform text-sm p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          <div className="h-[1px] bg-neutral-800 my-1" />

                          <button
                            onClick={() => {
                              setReplyingToMessage(msg);
                              setActiveBubbleDropdownId(null);
                              triggerBeep(330, 0.04);
                            }}
                            className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>Reply message</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowForwardModal(msg);
                              setActiveBubbleDropdownId(null);
                              triggerBeep(380, 0.05);
                            }}
                            className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Forward message</span>
                          </button>

                          <button
                            onClick={() => {
                              handleDeleteForMe(msg);
                              setActiveBubbleDropdownId(null);
                            }}
                            className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2 text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete for me</span>
                          </button>

                          {isMy && (
                            <button
                              onClick={() => {
                                handleDeleteForEveryone(msg);
                                setActiveBubbleDropdownId(null);
                              }}
                              className="w-full text-left p-1.5 hover:bg-neutral-800 hover:text-white rounded-lg flex items-center space-x-2 text-rose-500 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete for everyone</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActiveBubbleDropdownId(null)}
                            className="w-full text-center text-[10px] text-zinc-500 hover:text-white pt-1.5 border-t border-neutral-800/60 mt-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
                </>
              );
            })()}

            {/* My AI active guided writing indicator */}
            {isAiTyping && (
              <div className="flex justify-start items-center space-x-2 animate-pulse pl-1">
                <span className="text-[10px] font-mono text-neutral-500">Nearby AI guide is writing spot details...</span>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Swipe Replied-to visual header nested preview card o! */}
          {replyingToMessage && (
            <div className="px-4 py-2.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-white animate-fade-in border-l-4 border-l-emerald-500 backdrop-blur">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-[10px] text-emerald-400 font-bold">Replying to {replyingToMessage.senderId === 'user' ? 'yourself' : selectedNeighbor.name}</p>
                <p className="text-xs text-neutral-400 truncate mt-0.5 font-sans italic">"{replyingToMessage.text || 'Media attachment files'}"</p>
              </div>
              <button 
                onClick={() => {
                  setReplyingToMessage(null);
                  triggerBeep(320, 0.05);
                }} 
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* EMOJI PICKER POPUP KEYBOARD PANEL */}
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                {/* Backdrop to close the picker */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowEmojiPicker(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.15 }}
                  className="mx-4 mb-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col relative max-h-[280px]"
                >
                  {/* Category switcher tabs */}
                  <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 p-2 shrink-0 overflow-x-auto scrollbar-none space-x-1.5">
                    {(() => {
                      const categories = [
                        { id: 'recent', label: '🕒' },
                        { id: 'smileys', label: '😀' },
                        { id: 'gestures', label: '👋' },
                        { id: 'hearts', label: '❤️' },
                        { id: 'nature', label: '🐱' },
                        { id: 'food', label: '🍎' },
                        { id: 'activities', label: '⚽' },
                        { id: 'travel', label: '🚗' }
                      ];
                      return categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setEmojiCategory(cat.id);
                            triggerBeep(380, 0.04);
                          }}
                          className={`p-1.5 rounded-lg text-sm transition-all active:scale-95 cursor-pointer flex-1 text-center ${
                            emojiCategory === cat.id ? 'bg-[#0F8A5F] text-white' : 'hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ));
                    })()}
                  </div>

                  {/* Search Bar */}
                  <div className="px-3 py-1.5 border-b border-neutral-800 bg-neutral-900 flex items-center space-x-2 shrink-0">
                    <input
                      type="text"
                      value={emojiSearchQuery}
                      onChange={(e) => setEmojiSearchQuery(e.target.value)}
                      placeholder="Search emojis..."
                      className="w-full bg-neutral-950 text-white placeholder-neutral-500 rounded-lg py-1 px-2.5 text-[11px] border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {emojiSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setEmojiSearchQuery('')}
                        className="text-neutral-400 hover:text-white p-1 text-[11px]"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Emojis Grid Area */}
                  <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-2 select-none min-h-[140px] scrollbar-thin">
                    {(() => {
                      const allEmojisList = {
                        recent: recentlyUsedEmojis,
                        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
                        gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾'],
                        hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💤', '💢', '💣', '💥', '💫', '💦', '💨', '💬', '💭', '🗯️'],
                        nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🐙', '🦑', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐆', '🐅', '🐎', '🐖', '🐑', '🐐', '🐪', '🐫', '🐘', '🦏', '🦍', '🐒', '🐔', '🦅', '🦆', '🦢', '🦩', '🦉', '🦖', '🦕', '🐉', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃'],
                        food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🧅', '🧄', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🍟', '🍕', '🍳', '🍩', '🍪', '🍯', '🥛', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊'],
                        activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🛼', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🏋️', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
                        travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚨', '🚇', '🛫', '✈️', '🚁', '🚀', '🛸', '⛵', '🛳️', '🚢', '⚓', '⛽', '🏮', '🗼', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏟️', '🏛️', '🏗️', '🏘️', '🛖', '🏙️', '🏢', '🏬', '🏭', '🏰', '🏥', '🏦', '🏫', '🏪', '🏨', '💒', '⛪', '🕌', '🕍', '🕋', '⛩️']
                      };

                      let activeEmojisList = allEmojisList[emojiCategory as keyof typeof allEmojisList] || [];

                      if (emojiSearchQuery.trim()) {
                        const allCombined = Object.values(allEmojisList).flat();
                        const query = emojiSearchQuery.toLowerCase();
                        activeEmojisList = Array.from(new Set(allCombined.filter(e => {
                          return true; // Return matches
                        }))).slice(0, 48);
                      }

                      if (activeEmojisList.length === 0) {
                        return (
                          <div className="col-span-8 text-center text-xs text-neutral-500 py-8 font-sans">
                            No emojis found
                          </div>
                        );
                      }

                      return activeEmojisList.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setTextInput((prev) => prev + emoji);
                            triggerBeep(320, 0.04);
                            
                            setRecentlyUsedEmojis((prev) => {
                              const filtered = prev.filter((e) => e !== emoji);
                              const updated = [emoji, ...filtered].slice(0, 16);
                              localStorage.setItem('whatsapp_recent_emojis', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="hover:scale-130 active:scale-90 transition-transform text-2xl p-1.5 flex items-center justify-center rounded-lg hover:bg-neutral-800 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ));
                    })()}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Bottom Custom Gist writing input bar exactly like Instagram Messages */}
          <div className="p-3 bg-neutral-900 border-t border-neutral-800 space-y-2 relative z-10 shadow-2xl">
            
            <div className="flex items-center space-x-2">
              <input 
                type="file" 
                ref={chatFileRef} 
                onChange={handleGalleryUploadForChat} 
                accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
                className="hidden" 
              />

              {/* Unified Camera/Gallery Attachment Logo Button o! */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoMenu(!showPhotoMenu);
                    triggerBeep(520, 0.08);
                  }}
                  className={`p-3 rounded-xl transition ${showPhotoMenu ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                  title="Attach Media or Snap Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showPhotoMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowPhotoMenu(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute bottom-14 left-0 w-44 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col space-y-1 text-white"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoMenu(false);
                            startCamera();
                            triggerBeep(450, 0.05);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-neutral-850 rounded-lg transition text-xs flex items-center space-x-2 text-indigo-400 font-bold"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Take Live Snap</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoMenu(false);
                            chatFileRef.current?.click();
                            triggerBeep(450, 0.05);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-neutral-850 rounded-lg transition text-xs flex items-center space-x-2 text-zinc-300 font-medium"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Choose from Gallery</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Handheld Microphone Voice Notes Indicator button */}
              <button
                onMouseDown={startRecordingVoice}
                onMouseUp={stopAndSendVoice}
                onTouchStart={startRecordingVoice}
                onTouchEnd={stopAndSendVoice}
                className={`p-3 rounded-xl transition cursor-pointer select-none ${
                  isRecordingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-neutral-800 text-rose-400 hover:bg-neutral-700'
                }`}
                title="Hold to Record Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Text Input Block */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex-1 flex"
              >
                <div className="relative flex-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      triggerBeep(450, 0.05);
                    }}
                    className="absolute left-3 text-neutral-400 hover:text-[#25D366] transition cursor-pointer"
                    title="Emoji Keyboard"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isRecordingVoice ? `🎙️ Recording (${voiceDuration}s) - Release to Send` : "Write gist, ask spot..."}
                    className="w-full bg-neutral-950 text-white placeholder-neutral-500 rounded-xl py-3 pl-11 pr-12 text-sm border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={isRecordingVoice}
                  />
                  <button
                    type="submit"
                    className="absolute right-1 px-3 py-2 text-[#25D366] hover:text-white transition cursor-pointer"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
