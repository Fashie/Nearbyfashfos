import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Archive, ArrowLeft, Phone, Camera, MessageCircle, 
  ChevronRight, ImageIcon, Mic, FileText, Pin, CheckCheck, 
  VolumeX, Trash2, Check, CheckCircle2 
} from 'lucide-react';
import { Neighbor, DirectMessage } from '../../../types';

interface ChatListTabProps {
  neighbors: Neighbor[];
  chatMessages: Record<string, DirectMessage[]>;
  pendingFriendRequests: string[];
  archivedNeighborIds: string[];
  mutedNeighborIds: string[];
  blockedNeighborIds: string[];
  chatFilter: 'all' | 'unread' | 'favorites' | 'requests' | 'calls';
  setChatFilter: (val: 'all' | 'unread' | 'favorites' | 'requests' | 'calls') => void;
  searchWideSop: string;
  setSearchWideSop: (val: string) => void;
  showArchivedOnly: boolean;
  setShowArchivedOnly: (val: boolean) => void;
  appTheme: 'light' | 'dark';
  theme: any;
  simulatedTypingMap: Record<string, boolean>;
  currentUser: any;
  showNewChatDrawer: boolean;
  setShowNewChatDrawer: (val: boolean) => void;
  chatSearchInputRef: React.RefObject<HTMLInputElement | null>;
  sortedChatList: Neighbor[];
  setActiveTab: (tab: 'radar' | 'chat' | 'status' | 'menu' | 'explore') => void;
  
  // Handlers
  triggerBeep: (freq: number, duration: number, type?: string) => void;
  handleTogglePinChat: (id: string) => void;
  handleToggleUnreadNeighbor: (id: string) => void;
  handleToggleArchiveChat: (id: string) => void;
  handleToggleMuteNeighbor: (id: string) => void;
  handleDeleteChat: (id: string) => void;
  setSelectedNeighbor: (nb: Neighbor | null) => void;
  startCall: (id: string, type: 'audio' | 'video') => void;
  handleAcceptFriendRequest: (id: string) => void;
  handleDeclineFriendRequest: (id: string) => void;
  setLongPressedNeighborForMenu: (nb: Neighbor | null) => void;
}

const safeFormatTime = (timestamp: any): string => {
  if (!timestamp) return '5:13 PM';
  const str = String(timestamp);
  if (str.includes('PM') || str.includes('AM') || str.toLowerCase() === 'just now' || str.toLowerCase() === 'yesterday') {
    return str;
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return str;
  }
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return str;
  }
};

export const ChatListTab = React.memo(function ChatListTab({
  neighbors,
  chatMessages,
  pendingFriendRequests,
  archivedNeighborIds,
  mutedNeighborIds,
  blockedNeighborIds,
  chatFilter,
  setChatFilter,
  searchWideSop,
  setSearchWideSop,
  showArchivedOnly,
  setShowArchivedOnly,
  appTheme,
  theme,
  simulatedTypingMap,
  currentUser,
  showNewChatDrawer,
  setShowNewChatDrawer,
  chatSearchInputRef,
  sortedChatList,
  setActiveTab,
  
  triggerBeep,
  handleTogglePinChat,
  handleToggleUnreadNeighbor,
  handleToggleArchiveChat,
  handleToggleMuteNeighbor,
  handleDeleteChat,
  setSelectedNeighbor,
  startCall,
  handleAcceptFriendRequest,
  handleDeclineFriendRequest,
  setLongPressedNeighborForMenu,
}: ChatListTabProps) {
  return (
    <motion.div
      key="chat-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full bg-[#FAFAF9] dark:bg-[#111214]"
    >
      {/* --- Premium Chat Search (Height: 56px, Radius: 18px) --- */}
      <div className="px-5 pt-8 pb-2 shrink-0">
        <div className="relative flex items-center h-[56px] rounded-[18px] px-4 border border-stone-200 dark:border-neutral-800 bg-white dark:bg-[#16171B] shadow-soft-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#0F8A5F]/30 focus-within:border-[#0F8A5F]/50">
          <Search className="w-5 h-5 mr-3 text-[#0F8A5F]" />
          <input
            ref={chatSearchInputRef}
            type="text"
            value={searchWideSop}
            onChange={(e) => setSearchWideSop(e.target.value)}
            placeholder="Search conversations..."
            className="bg-transparent text-sm w-full focus:outline-none text-[#161616] dark:text-[#FFFFFF] placeholder-stone-400 dark:placeholder-neutral-500 font-sans border-none"
          />
          {searchWideSop && (
            <button 
              onClick={() => {
                setSearchWideSop('');
                triggerBeep(320, 0.05);
              }} 
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-neutral-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Five elegant high-contrast filters matching WhatsApp & Snapchat layout */}
      <div className="px-5 py-2 flex items-center space-x-1.5 overflow-x-auto scrollbar-none border-b border-stone-100 dark:border-neutral-800/40 shrink-0">
        {[
          { id: 'all', label: 'All', shortLabel: 'All' },
          { id: 'unread', label: 'Unread', shortLabel: 'Unread' },
          { id: 'favorites', label: 'Favorites', shortLabel: 'Favs' },
          { id: 'requests', label: `Friend Requests (${pendingFriendRequests.length})`, shortLabel: `Requests (${pendingFriendRequests.length})` },
          { id: 'calls', label: '📞 Calls', shortLabel: 'Calls' }
        ].map((item) => {
          const isActive = chatFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setChatFilter(item.id as any);
                triggerBeep(380, 0.05);
              }}
              className={`whitespace-nowrap rounded-full px-3 py-1 md:px-4.5 md:py-1.5 text-[11px] md:text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer border-none outline-none ${
                isActive
                  ? 'bg-[#0F8A5F] text-white shadow-soft-sm'
                  : appTheme === 'dark'
                    ? 'bg-[#1A1C20] text-neutral-400 hover:text-white border border-neutral-800/40'
                    : 'bg-white text-stone-600 hover:text-black border border-stone-200/50'
              }`}
            >
              <span className="md:hidden">{item.shortLabel}</span>
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Archive UI Toggler inside Chat view (WhatsApp-style entry card) */}
      {archivedNeighborIds.length > 0 && !showArchivedOnly && chatFilter !== 'calls' && chatFilter !== 'requests' && (
        <div className="px-5 pt-3 shrink-0">
          <button
            onClick={() => {
              setShowArchivedOnly(true);
              triggerBeep(330, 0.05);
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-[20px] border border-stone-200/60 dark:border-neutral-800/60 bg-white dark:bg-[#16171B] hover:bg-stone-50 dark:hover:bg-neutral-800/30 shadow-soft-sm transition-all cursor-pointer text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-[#0F8A5F] flex items-center justify-center">
                <Archive className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-sm block text-neutral-900 dark:text-white">Archived Chats</span>
                <span className="text-[10.5px] text-stone-500 dark:text-neutral-400 font-medium">Viewing hidden conversations</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-500/20 text-xs font-black text-[#0F8A5F] dark:text-emerald-400">
              {archivedNeighborIds.length}
            </span>
          </button>
        </div>
      )}

      {/* View header if currently showing ONLY archived chats */}
      {showArchivedOnly && (
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-stone-100 dark:border-neutral-800/40 shrink-0 bg-white dark:bg-[#16171B]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowArchivedOnly(false);
                triggerBeep(300, 0.05);
              }}
              className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 transition text-neutral-600 dark:text-neutral-400 cursor-pointer border-none outline-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-left">
              <span className="font-extrabold text-base text-neutral-900 dark:text-white block">Archived Chats</span>
              <p className="text-[10px] text-stone-500 dark:text-neutral-400 font-medium">Keep conversations neat & organized</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs font-bold text-[#0F8A5F] dark:text-emerald-400">
            {sortedChatList.length} Archived
          </span>
        </div>
      )}

      {/* Tab Contents: Based on chatFilter */}
      {chatFilter === 'calls' ? (
        <div className="flex-1 space-y-3.5 px-5 py-4 overflow-y-auto pb-4 scrollbar-thin">
          {(() => {
            const localLogs = JSON.parse(localStorage.getItem('call_history_logs') || '[]');
            if (localLogs.length === 0) {
              return (
                <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-3xl">
                    📞
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-sans text-sm font-bold text-neutral-850 dark:text-neutral-200">No Call History Yet</h4>
                    <p className="font-mono text-[10px] text-neutral-500 leading-normal">
                      Dial your neighbors directly or establish high-fidelity WebRTC links to see call logs here.
                    </p>
                  </div>
                </div>
              );
            }

            return localLogs.map((log: any, idx: number) => {
              const nb = neighbors.find((n: any) => n.id === log.neighborId);
              if (!nb) return null;

              const formattedTime = (() => {
                try {
                  const date = new Date(log.timestamp);
                  return date.toLocaleString('en-NG', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    month: 'short',
                    day: 'numeric'
                  });
                } catch (e) {
                  return 'Recent';
                }
              })();

              return (
                <div
                  key={log.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    appTheme === 'dark' 
                      ? 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800' 
                      : 'bg-white hover:bg-zinc-50 border-neutral-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`w-12 h-12 rounded-full ${nb.avatarColor} flex items-center justify-center text-xl shadow-inner flex-shrink-0`}>
                      <span>{nb.avatarEmoji}</span>
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className={`font-sans text-xs font-bold truncate max-w-[120px] ${appTheme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
                          {nb.name}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-tight ${
                          log.type === 'video' 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        }`}>
                          {log.type}
                        </span>
                      </div>

                      <p className="text-[10px] font-mono mt-0.5 flex items-center space-x-1 text-neutral-400">
                        {log.status === 'missed' ? (
                          <span className="text-red-400 font-semibold flex items-center">
                            🚨 Missed {log.incoming ? 'incoming' : 'outgoing'}
                          </span>
                        ) : log.status === 'declined' ? (
                          <span className="text-gray-500 flex items-center">
                            🚫 Declined
                          </span>
                        ) : (
                          <span className="text-green-400 flex items-center">
                            📞 {log.incoming ? 'Inbound' : 'Outbound'} ({log.durationSeconds}s)
                          </span>
                        )}
                      </p>
                      
                      <span className="text-[9px] font-mono text-zinc-500 block mt-1">
                        {formattedTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        triggerBeep(420, 0.05);
                        startCall(nb.id, 'audio');
                      }}
                      className="p-2 rounded-xl bg-neutral-850/40 hover:bg-neutral-800 border border-neutral-750/30 text-emerald-400 active:scale-95 transition-all cursor-pointer"
                      title="Voice Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        triggerBeep(450, 0.05);
                        startCall(nb.id, 'video');
                      }}
                      className="p-2 rounded-xl bg-neutral-850/40 hover:bg-neutral-800 border border-neutral-750/30 text-indigo-400 active:scale-95 transition-all cursor-pointer"
                      title="Speed video-call"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : chatFilter !== 'requests' ? (
        <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin space-y-4">
          {(() => {
            if (sortedChatList.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 max-w-sm mx-auto">
                  <div className="relative flex items-center justify-center w-28 h-28">
                    <div className="absolute inset-0 border border-[#0F8A5F]/10 rounded-full animate-pulse shadow-[0_0_30px_rgba(15,138,95,0.05)]" />
                    <div className="absolute inset-3 border border-[#0F8A5F]/20 rounded-full shadow-[0_0_20px_rgba(15,138,95,0.1)] animate-spin-slow" />
                    <div className="absolute inset-6 border-2 border-[#0F8A5F]/40 rounded-full flex items-center justify-center bg-stone-100 dark:bg-neutral-800 shadow-[0_0_25px_rgba(15,138,95,0.15)]">
                      <MessageCircle className="w-8 h-8 text-[#0F8A5F] drop-shadow-[0_0_4px_rgba(15,138,95,0.3)]" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-sans font-black text-xl tracking-tight text-neutral-900 dark:text-white">
                      No Conversations Yet
                    </h3>
                    <p className="text-xs leading-relaxed text-stone-500 dark:text-neutral-400 font-medium">
                      Start chatting with people nearby. Connect with neighbors within walking distance.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('radar');
                      triggerBeep(500, 0.08);
                    }}
                    className="px-6 py-3 bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-extrabold rounded-2xl transition active:scale-95 cursor-pointer shadow-soft-md text-xs flex items-center space-x-2 border-none outline-none"
                  >
                    <span>Find People Nearby</span>
                    <ChevronRight className="w-4 h-4 text-[#DDF7EC]" />
                  </button>
                </div>
              );
            }

            const pinnedChats = sortedChatList.filter(nb => nb.pinned);
            const recentChats = sortedChatList.filter(nb => !nb.pinned);

            const renderCard = (nb: Neighbor) => {
              const msgs = chatMessages[nb.id] || [];
              const lastMsg = msgs[msgs.length - 1];
              const isUnread = nb.id === 'nb-1' || nb.id === 'nb-3' || msgs.some(m => m.isUnread === true);
              
              let subText = "Tap to chat and connect";
              let lastMsgIcon = null;

              if (lastMsg) {
                if (lastMsg.type === 'text') {
                  subText = lastMsg.text || "";
                } else if (lastMsg.type === 'image') {
                  subText = "Photo";
                  lastMsgIcon = <ImageIcon className="w-3.5 h-3.5 text-[#0F8A5F] inline-block mr-1 align-middle" />;
                } else if (lastMsg.type === 'voice') {
                  subText = "Voice note";
                  lastMsgIcon = <Mic className="w-3.5 h-3.5 text-sky-500 inline-block mr-1 align-middle" />;
                } else if (lastMsg.type === 'document') {
                  subText = lastMsg.fileName || "Document";
                  lastMsgIcon = <FileText className="w-3.5 h-3.5 text-amber-500 inline-block mr-1 align-middle" />;
                } else if (lastMsg.type === 'call_log') {
                  subText = lastMsg.callLog?.status === 'missed' ? "Missed call" : "Call ended";
                  lastMsgIcon = <Phone className="w-3.5 h-3.5 text-rose-500 inline-block mr-1 align-middle" />;
                }
              } else if (nb.id === 'nb-myai') {
                subText = "Ready to give cool advice on farming & life!";
              }

              let iconStr = nb.avatarEmoji;
              if (nb.id === 'nb-1') iconStr = " 🧇 ";
              else if (nb.id === 'nb-2') iconStr = " 🚗 ";
              else if (nb.id === 'nb-3') iconStr = " 🎨 ";
              else if (nb.id === 'nb-4') iconStr = " 🎤 ";

              return (
                <div key={nb.id} className="relative overflow-hidden rounded-[24px] bg-white dark:bg-[#16171B] border border-stone-100 dark:border-neutral-800/40 shadow-soft-sm mx-5">
                  <div className="absolute inset-y-0 left-0 flex items-center space-x-1 pl-3 z-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePinChat(nb.id);
                      }}
                      className="h-[58px] px-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-amber-500/20 shadow-soft-xs"
                      title={nb.pinned ? "Unpin Chat" : "Pin Chat"}
                    >
                      <Pin className="w-4 h-4 rotate-45" />
                      <span className="text-[8px] font-black mt-1 uppercase tracking-tight">{nb.pinned ? 'Unpin' : 'Pin'}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUnreadNeighbor(nb.id);
                      }}
                      className="h-[58px] px-3.5 rounded-2xl bg-[#0F8A5F]/10 hover:bg-[#0F8A5F]/20 text-[#0F8A5F] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-[#0F8A5F]/20 shadow-soft-xs"
                      title="Mark Unread"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="text-[8px] font-black mt-1 uppercase tracking-tight">Status</span>
                    </button>
                  </div>

                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3 z-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleArchiveChat(nb.id);
                      }}
                      className="h-[58px] px-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#0F8A5F] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-[#0F8A5F]/20 shadow-soft-xs"
                      title="Archive Chat"
                    >
                      <Archive className="w-4 h-4" />
                      <span className="text-[8px] font-black mt-1 uppercase tracking-tight">Archive</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMuteNeighbor(nb.id);
                      }}
                      className="h-[58px] px-3.5 rounded-2xl bg-stone-500/10 hover:bg-stone-500/20 text-stone-600 dark:text-stone-400 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-stone-500/20 shadow-soft-xs"
                      title="Mute Chat"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span className="text-[8px] font-black mt-1 uppercase tracking-tight">{mutedNeighborIds.includes(nb.id) ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(nb.id);
                      }}
                      className="h-[58px] px-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border border-rose-500/20 shadow-soft-xs"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[8px] font-black mt-1 uppercase tracking-tight">Delete</span>
                    </button>
                  </div>

                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -210, right: 120 }}
                    dragElastic={0.15}
                    dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
                    whileDrag={{ scale: 0.995, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setLongPressedNeighborForMenu(nb);
                      triggerBeep(450, 0.05);
                    }}
                    onTouchStart={(e) => {
                      const timer = setTimeout(() => {
                        setLongPressedNeighborForMenu(nb);
                        triggerBeep(450, 0.05);
                      }, 600);
                      (e.currentTarget as any)._longPressTimer = timer;
                    }}
                    onTouchEnd={(e) => {
                      const timer = (e.currentTarget as any)._longPressTimer;
                      if (timer) clearTimeout(timer);
                    }}
                    onTouchMove={(e) => {
                      const timer = (e.currentTarget as any)._longPressTimer;
                      if (timer) clearTimeout(timer);
                    }}
                    onTouchCancel={(e) => {
                      const timer = (e.currentTarget as any)._longPressTimer;
                      if (timer) clearTimeout(timer);
                    }}
                    onClick={() => {
                      setSelectedNeighbor(nb);
                      triggerBeep(450, 0.1);
                    }}
                    className={`h-[72px] p-3 flex items-center space-x-3 cursor-pointer transition-colors duration-150 relative z-10 select-none ${
                      appTheme === 'dark'
                        ? 'bg-[#16171B] hover:bg-[#1C1D22] text-white'
                        : 'bg-white hover:bg-stone-50 text-neutral-900'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-stone-100 dark:bg-neutral-800 border border-stone-100 dark:border-neutral-800 flex items-center justify-center shadow-soft-xs select-none flex-shrink-0 relative">
                      {nb.customProfilePhoto ? (
                        <img 
                          src={nb.customProfilePhoto} 
                          className="w-full h-full object-cover rounded-full" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xl">{iconStr.trim()}</span>
                      )}
                      
                      {(() => {
                        const status = nb.id === 'nb-myai' ? 'active' :
                                       nb.id === 'nb-1' ? 'active' :
                                        nb.id === 'nb-2' ? 'away' :
                                        nb.id === 'nb-3' ? 'offline' :
                                        nb.id === 'nb-4' ? 'away' :
                                        (nb.onlineStatus || 'offline');
                        if (status === 'active') {
                          return (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#0F8A5F] rounded-full border-2 border-white dark:border-[#16171B] flex items-center justify-center shadow-soft-xs">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute" />
                            </span>
                          );
                        } else if (status === 'away') {
                          return <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#F59E0B] rounded-full border-2 border-white dark:border-[#16171B] shadow-soft-xs" />;
                        } else {
                          return <span className="absolute bottom-0 right-0 w-3 h-3 bg-stone-400 dark:bg-neutral-500 rounded-full border-2 border-white dark:border-[#16171B] shadow-soft-xs" />;
                        }
                      })()}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <h4 className={`text-sm font-bold truncate ${appTheme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
                            {nb.name}
                          </h4>
                          
                          {nb.verificationLevel === 'Verified' && (
                            <CheckCircle2 className="w-4 h-4 text-[#0F8A5F] fill-[#0F8A5F]/10 flex-shrink-0" />
                          )}
                          
                          {mutedNeighborIds.includes(nb.id) && (
                            <VolumeX className="w-3.5 h-3.5 text-stone-400 dark:text-neutral-500 flex-shrink-0" />
                          )}
                          
                          {blockedNeighborIds.includes(nb.id) && (
                            <span className="text-[8px] px-1.5 py-0.2 bg-red-500/10 text-red-500 rounded-md font-bold uppercase tracking-wider scale-90 flex-shrink-0">Blocked</span>
                          )}
                          {nb.isGroup && (
                            <span className="bg-[#0F8A5F]/10 text-[#0F8A5F] text-[8px] px-1.5 py-0.2 rounded-md font-black flex-shrink-0">
                              GROUP
                            </span>
                          )}
                          {nb.id === 'nb-myai' && (
                            <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[8px] px-1.5 py-0.2 rounded-md font-black animate-pulse flex-shrink-0">
                              AI
                            </span>
                          )}
                        </div>
                        
                        <span className={`text-[10px] font-sans font-medium flex-shrink-0 ${isUnread ? 'text-[#0F8A5F] font-bold' : 'text-stone-400 dark:text-neutral-500'}`}>
                          {lastMsg 
                            ? safeFormatTime(lastMsg.timestamp) 
                            : (nb.lastSeen 
                                ? safeFormatTime(nb.lastSeen) 
                                : '5:13 PM')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className={`text-[13px] truncate max-w-[200px] flex items-center space-x-1 ${isUnread ? 'text-neutral-900 dark:text-white font-extrabold' : 'text-stone-500 dark:text-neutral-400'}`}>
                          {lastMsg && lastMsg.senderId === 'user' && (
                            <span className="mr-1">
                              {lastMsg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline" />
                              ) : lastMsg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-stone-400 inline" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-stone-400 inline" />
                              )}
                            </span>
                          )}
                          
                          {simulatedTypingMap[nb.id] || nb.typingTo === currentUser?.uid ? (
                            <span className="text-[#0F8A5F] font-black animate-pulse">typing...</span>
                          ) : (
                            <span className="truncate flex items-center">
                              {lastMsgIcon}
                              <span>{subText}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {nb.trustScore && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[#0F8A5F] font-extrabold">
                              {nb.trustScore}% 🛡️
                            </span>
                          )}
                          
                          {nb.pinned && (
                            <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45 fill-amber-500/20" />
                          )}
                          
                          {isUnread && (
                            <span className="w-4.5 h-4.5 rounded-full bg-[#0F8A5F] text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-soft-sm">
                              1
                            </span>
                          )}
                          
                          <span className="text-stone-400 dark:text-neutral-600 text-[10px]" title="End-to-End Encrypted">
                            🔒
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {pinnedChats.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="px-5 pt-3 pb-1 flex items-center space-x-1.5 text-[11px] font-black text-amber-500 uppercase tracking-wider font-sans">
                      <Pin className="w-3.5 h-3.5 rotate-45 text-amber-500 fill-amber-500/20" />
                      <span>Pinned Chats</span>
                    </div>
                    <div className="space-y-3">
                      {pinnedChats.map((nb) => renderCard(nb))}
                    </div>
                  </div>
                )}

                {recentChats.length > 0 && (
                  <div className="space-y-2.5">
                    {pinnedChats.length > 0 && (
                      <div className="px-5 pt-3 pb-1 text-[11px] font-black text-stone-400 dark:text-neutral-500 uppercase tracking-wider font-sans text-left">
                        <span>Recent Chats</span>
                      </div>
                    )}
                    <div className="space-y-3">
                      {recentChats.map((nb) => renderCard(nb))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="flex-1 space-y-3 px-5 py-4 overflow-y-auto pb-4 scrollbar-thin">
          {pendingFriendRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
              <span className="text-3xl text-brand-blue animate-bounce">📬</span>
              <p className={`text-sm font-display font-bold ${appTheme === 'dark' ? 'text-[#F9FAFB]' : 'text-[#111827]'}`}>No Connection Requests</p>
              <p className={`text-xs leading-relaxed max-w-xs ${appTheme === 'dark' ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                You're fully up to date! Grid requests from walking-distance neighbors will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${appTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} text-left`}>
                Incoming neighbor connections ({pendingFriendRequests.length})
              </p>
              
              {pendingFriendRequests.map((reqId) => {
                const requester = neighbors.find(n => n.id === reqId);
                if (!requester) return null;

                return (
                  <div 
                    key={reqId}
                    className={`p-4 rounded-2xl border flex flex-col space-y-3 shadow-sm ${theme.cardBg}`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-11 h-11 rounded-full ${requester.avatarColor || 'bg-indigo-500'} flex items-center justify-center text-xl shadow-inner select-none flex-shrink-0`}>
                        <span>{requester.avatarEmoji}</span>
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className={`font-display font-bold text-sm ${appTheme === 'dark' ? 'text-[#F9FAFB]' : 'text-[#111827]'}`}>
                          {requester.name}
                        </h4>
                        <p className={`text-xs truncate ${appTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          @{requester.username}{requester.distanceMeters !== undefined ? ` • ${requester.distanceMeters}m away` : ''}
                        </p>
                      </div>
                    </div>
                    
                    <p className={`text-xs font-sans italic px-1 text-left ${appTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      "Hey! I live nearby o, saw your radar pin and wanted to say hi! Let's connect!"
                    </p>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => {
                          handleAcceptFriendRequest(reqId);
                        }}
                        className="flex-1 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1 border-none outline-none"
                      >
                        <span>Accept</span>
                        <span>✅</span>
                      </button>
                        
                      <button
                        onClick={() => {
                          handleDeclineFriendRequest(reqId);
                        }}
                        className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 rounded-xl text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1 outline-none"
                      >
                        <span>Decline</span>
                        <span>❌</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Bottom Drawer for Picker New Chat list --- */}
      <AnimatePresence>
        {showNewChatDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowNewChatDrawer(false);
                triggerBeep(320, 0.04);
              }}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className={`fixed inset-x-0 bottom-0 max-w-md mx-auto rounded-t-[28px] border-t p-6 pb-8 z-50 font-sans shadow-2xl max-h-[80vh] flex flex-col ${
                appTheme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-black'
              }`}
            >
              <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setShowNewChatDrawer(false)} />
              
              <div className="flex justify-between items-center mb-4 text-left">
                <div>
                  <h3 className="text-lg font-bold">New Chat</h3>
                  <p className="text-xs text-zinc-500">Pick a local neighbor on your proximity grid</p>
                </div>
                <button
                  onClick={() => {
                    setShowNewChatDrawer(false);
                    triggerBeep(320, 0.04);
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center justify-center text-zinc-500 border-none outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin text-left">
                {neighbors.map((nb) => {
                  const status = nb.id === 'nb-myai' ? 'active' :
                                 nb.id === 'nb-1' ? 'active' :
                                  nb.id === 'nb-2' ? 'away' :
                                  nb.id === 'nb-3' ? 'offline' :
                                  nb.id === 'nb-4' ? 'away' :
                                  (nb.onlineStatus || 'offline');
                  return (
                    <div
                      key={nb.id}
                      onClick={() => {
                        setSelectedNeighbor(nb);
                        setShowNewChatDrawer(false);
                        triggerBeep(450, 0.1);
                      }}
                      className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                        appTheme === 'dark' ? 'hover:bg-neutral-800 bg-neutral-900/40' : 'hover:bg-zinc-100 bg-zinc-50 border border-zinc-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-11 h-11 rounded-full ${nb.avatarColor} flex items-center justify-center text-lg relative flex-shrink-0`}>
                          {nb.customProfilePhoto ? (
                            <img src={nb.customProfilePhoto} className="w-full h-full object-cover rounded-full" alt="" />
                          ) : (
                            <span>{nb.avatarEmoji}</span>
                          )}
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-neutral-900 ${
                            status === 'active' ? 'bg-[#25D366]' : status === 'away' ? 'bg-[#F59E0B]' : 'bg-zinc-400'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm block truncate">{nb.name}</span>
                          <span className="text-xs text-zinc-500 truncate block">@{nb.username}{nb.distanceMeters !== undefined ? ` • ${nb.distanceMeters}m away` : ''}</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#25D366] font-bold flex-shrink-0">Chat →</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
