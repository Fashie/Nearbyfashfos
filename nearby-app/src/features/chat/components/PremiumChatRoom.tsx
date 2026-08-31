import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Phone, Video as VideoIcon, MoreVertical, CheckCircle2, 
  MessageSquare, Smile, Paperclip, Send, Mic, Trash2, Camera, Image as ImageIcon, 
  FileText, MapPin, User, Music, Crown, X, Pin, Play, Download, Check, CheckCheck, 
  Reply, Share2, ShieldAlert, Globe 
} from 'lucide-react';

export interface PremiumChatRoomProps {
  selectedNeighbor: any;
  setSelectedNeighbor: (val: any) => void;
  currentUser: any;
  chatMessages: Record<string, any[]>;
  setChatMessages: (val: any) => void;
  neighbors: any[];
  isAiTyping: boolean;
  appTheme: string;
  customChatBg: string;
  setCustomChatBg: (val: any) => void;
  customChatFont: string;
  setViewingNeighborProfile: (val: any) => void;
  startCall: (id: string, type: 'audio' | 'video') => void;
  mutedNeighborIds: string[];
  handleToggleMuteNeighbor: (id: string) => void;
  blockedNeighborIds: string[];
  handleToggleBlockNeighbor: (id: string) => void;
  handleExportChat: (neighbor: any) => void;
  friendIds: string[];
  sentFriendRequestIds: string[];
  pendingFriendRequests: string[];
  handleAcceptFriendRequest: (id: string) => void;
  handleAddNewFriend: (id: string) => void;
  chatLimit: number;
  setChatLimit: any;
  sendMessage: (text?: string, mediaUrl?: string, audioDuration?: number, type?: string) => void;
  startRecordingVoice: () => void;
  stopAndSendVoice: () => void;
  cancelRecordingVoice: () => void;
  isRecordingVoice: boolean;
  voiceDuration: number;
  playingVoiceId: string | null;
  playVoiceNote: (msg: any, senderName: string) => void;
  replyingToMessage: any;
  setReplyingToMessage: (val: any) => void;
  handleReaction: (msg: any, emoji: string) => void;
  handleDeleteForMe: (msg: any) => void;
  handleDeleteForEveryone: (msg: any) => void;
  showForwardModal: any;
  setShowForwardModal: (val: any) => void;
  startCamera: () => void;
  handleGalleryUploadForChat: (e: React.ChangeEvent<HTMLInputElement>) => void;
  chatFileRef: any;
  textInput: string;
  setTextInput: (val: string) => void;
  triggerBeep: (freq: number, duration: number, type?: string) => void;
  setAudioFeedback: (msg: string) => void;
}

const detectUrls = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex);
};

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Feelings',
    emojis: [
      { char: '😀', tags: 'smile happy laugh face grinning' },
      { char: '😃', tags: 'smile happy laugh face grinning' },
      { char: '😄', tags: 'smile happy laugh face' },
      { char: '😁', tags: 'smile happy grin face' },
      { char: '😆', tags: 'laugh happy face grinning' },
      { char: '😅', tags: 'laugh sweat happy face' },
      { char: '😂', tags: 'laugh tear lol happy cry face' },
      { char: '🤣', tags: 'laugh lol roll face' },
      { char: '😊', tags: 'smile blush happy face' },
      { char: '😇', tags: 'angel innocent face' },
      { char: '🙂', tags: 'smile slight face' },
      { char: '🙃', tags: 'upside down face' },
      { char: '😉', tags: 'wink face' },
      { char: '😌', tags: 'relieved calm face' },
      { char: '😍', tags: 'heart eyes love happy face' },
      { char: '🥰', tags: 'hearts love warm face' },
      { char: '😘', tags: 'kiss love face' },
      { char: '😋', tags: 'yum delicious food face' },
      { char: '😛', tags: 'tongue play face' },
      { char: '😜', tags: 'wink tongue play face' },
      { char: '🤪', tags: 'crazy silly face' },
      { char: '😎', tags: 'cool sunglasses face' },
      { char: '🥳', tags: 'party celebrate face' },
      { char: '😏', tags: 'smirk sly face' },
      { char: '😒', tags: 'unamused meh face' },
      { char: '😔', tags: 'sad pensive face' },
      { char: '🥺', tags: 'pleading beg eyes face' },
      { char: '😢', tags: 'cry sad tear face' },
      { char: '😭', tags: 'cry loud sad sob face' },
      { char: '😤', tags: 'angry mad steam face' },
      { char: '😠', tags: 'angry mad face' },
      { char: '😡', tags: 'angry mad red pout face' },
      { char: '🤬', tags: 'curse swear angry face' },
      { char: '🤯', tags: 'explode mind blow head face' },
      { char: '😳', tags: 'blush flush shocked face' },
      { char: '🥵', tags: 'hot heat red face' },
      { char: '🥶', tags: 'cold ice blue face' },
      { char: '😱', tags: 'scream fear shocked face' },
      { char: '🥱', tags: 'yawn tired sleepy' },
      { char: '😴', tags: 'sleep tired face' },
      { char: '🤔', tags: 'think ponder face' },
      { char: '🫣', tags: 'peek look eye face' },
      { char: '🤭', tags: 'giggle hand face' },
      { char: '🤫', tags: 'shh quiet silence face' },
      { char: '🫠', tags: 'melt warm face' },
      { char: '😐', tags: 'neutral meh flat face' },
      { char: '😑', tags: 'expressionless meh face' },
      { char: '😬', tags: 'grimace face' },
      { char: '🙄', tags: 'roll eyes meh face' },
      { char: '💩', tags: 'poop turd brown' },
      { char: 'ghost', tags: 'ghost spook white halloween' },
      { char: '💀', tags: 'skull bone dead' },
      { char: '👽', tags: 'alien space green ufo' },
      { char: '👾', tags: 'game space invader retro' },
      { char: '🤖', tags: 'robot bot metal' }
    ]
  },
  {
    name: 'Gestures & Hearts',
    emojis: [
      { char: '👍', tags: 'thumbs up like good yes ok' },
      { char: '👎', tags: 'thumbs down dislike bad no' },
      { char: '👊', tags: 'fist punch hit' },
      { char: '✊', tags: 'fist power raise' },
      { char: '🤛', tags: 'fist left punch' },
      { char: '🤜', tags: 'fist right punch' },
      { char: '👏', tags: 'clap applaud hands' },
      { char: '🙌', tags: 'hands praise celebrate' },
      { char: '👐', tags: 'open hands' },
      { char: '🤲', tags: 'cupped hands pray' },
      { char: '🤝', tags: 'handshake meet agree friend' },
      { char: '🙏', tags: 'pray thank please hands' },
      { char: '👋', tags: 'wave hello goodbye hi' },
      { char: '🤚', tags: 'backhand raise' },
      { char: '🖐️', tags: 'fingers splay open' },
      { char: '✋', tags: 'stop high five' },
      { char: '🖖', tags: 'vulcan spock' },
      { char: '👌', tags: 'ok fine good' },
      { char: '🤌', tags: 'italian fingers pinch' },
      { char: '🤏', tags: 'pinch small little' },
      { char: '✌️', tags: 'victory peace sign' },
      { char: '🤞', tags: 'fingers crossed luck' },
      { char: '🫰', tags: 'finger heart love' },
      { char: '🤟', tags: 'love you sign' },
      { char: '🤘', tags: 'rock on metal horns' },
      { char: '🤙', tags: 'call me phone' },
      { char: '👈', tags: 'point left' },
      { char: '👉', tags: 'point right' },
      { char: '👆', tags: 'point up' },
      { char: '👇', tags: 'point down' },
      { char: '❤️', tags: 'heart love red' },
      { char: '🩷', tags: 'heart love pink' },
      { char: '🧡', tags: 'heart love orange' },
      { char: '💛', tags: 'heart love yellow' },
      { char: '💚', tags: 'heart love green' },
      { char: '💙', tags: 'heart love blue' },
      { char: '🩵', tags: 'heart love cyan' },
      { char: '💜', tags: 'heart love purple' },
      { char: '🖤', tags: 'heart love black' },
      { char: '🩶', tags: 'heart love grey' },
      { char: '🤍', tags: 'heart love white' },
      { char: '🤎', tags: 'heart love brown' },
      { char: '💔', tags: 'broken heart sad split' },
      { char: '🔥', tags: 'fire hot lit trend' },
      { char: '✨', tags: 'sparkles shine magic clean' },
      { char: '🌟', tags: 'star yellow shine gold' },
      { char: '🎉', tags: 'party celebrate popper' },
      { char: '🎈', tags: 'balloon party red' }
    ]
  },
  {
    name: 'Activities & Food',
    emojis: [
      { char: '⚽', tags: 'soccer football ball sports' },
      { char: '🏀', tags: 'basketball ball sports' },
      { char: '🏈', tags: 'football ball sports' },
      { char: '🎾', tags: 'tennis ball sports' },
      { char: '🏐', tags: 'volleyball ball sports' },
      { char: '🎱', tags: 'pool billiard ball sports' },
      { char: '🎮', tags: 'game controller xbox playstation switch' },
      { char: '🎨', tags: 'art paint draw creative' },
      { char: '🎤', tags: 'mic sing karaoke music' },
      { char: '🎧', tags: 'headphones music listen sound' },
      { char: '🎹', tags: 'piano music key keyboard' },
      { char: '🥁', tags: 'drum music play instrument' },
      { char: '🎸', tags: 'guitar music play instrument' },
      { char: '☕', tags: 'coffee tea hot drink morning cafe' },
      { char: '🍵', tags: 'greentea tea green' },
      { char: '🍻', tags: 'beer cheers drink alcohol' },
      { char: '🍷', tags: 'wine cheers drink alcohol' },
      { char: '🍹', tags: 'cocktail drink juice summer bar' },
      { char: '🍕', tags: 'pizza food cheese slice fastfood' },
      { char: '🍔', tags: 'burger food meat fastfood' },
      { char: '🍟', tags: 'fries food potato fastfood' },
      { char: '🌭', tags: 'hotdog food meat fastfood' },
      { char: '🥪', tags: 'sandwich food lunch bread' },
      { char: '🌮', tags: 'taco food mexican' },
      { char: '🥗', tags: 'salad food green healthy' },
      { char: '🍜', tags: 'noodles food ramen soup' },
      { char: '🍛', tags: 'curry food rice' },
      { char: '🍣', tags: 'sushi food fish japanese' },
      { char: '🍦', tags: 'icecream sweet dessert cold' },
      { char: '🍩', tags: 'donut sweet dessert' },
      { char: '🎂', tags: 'cake birthday sweet celebration' }
    ]
  }
];

export const PremiumChatRoom = React.memo(function PremiumChatRoom({
  selectedNeighbor,
  setSelectedNeighbor,
  currentUser,
  chatMessages,
  setChatMessages,
  neighbors,
  isAiTyping,
  appTheme,
  customChatBg,
  setCustomChatBg,
  customChatFont,
  setViewingNeighborProfile,
  startCall,
  mutedNeighborIds,
  handleToggleMuteNeighbor,
  blockedNeighborIds,
  handleToggleBlockNeighbor,
  handleExportChat,
  friendIds,
  sentFriendRequestIds,
  pendingFriendRequests,
  handleAcceptFriendRequest,
  handleAddNewFriend,
  chatLimit,
  setChatLimit,
  sendMessage,
  startRecordingVoice,
  stopAndSendVoice,
  cancelRecordingVoice,
  isRecordingVoice,
  voiceDuration,
  playingVoiceId,
  playVoiceNote,
  replyingToMessage,
  setReplyingToMessage,
  handleReaction,
  handleDeleteForMe,
  handleDeleteForEveryone,
  showForwardModal,
  setShowForwardModal,
  startCamera,
  handleGalleryUploadForChat,
  chatFileRef,
  textInput,
  setTextInput,
  triggerBeep,
  setAudioFeedback,
}: PremiumChatRoomProps) {
  
  // Local premium chat states
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; caption?: string } | null>(null);
  const [voicePlaybackSpeed, setVoicePlaybackSpeed] = useState<Record<string, number>>({}); // msgId -> speed
  const [showAttachmentSheet, setShowAttachmentSheet] = useState<boolean>(false);
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<any | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Record<string, any>>({}); // neighborId -> msg
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const [showActiveChatSearch, setShowActiveChatSearch] = useState<boolean>(false);
  const [activeChatSearchQuery, setActiveChatSearchQuery] = useState<string>('');
  const [showActiveChatDropdown, setShowActiveChatDropdown] = useState<boolean>(false);
  const [voiceRecordingLocked, setVoiceRecordingLocked] = useState<boolean>(false);
  const [showEmojiPickerLocal, setShowEmojiPickerLocal] = useState<boolean>(false);
  const [emojiSearch, setEmojiSearch] = useState<string>('');
  
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Swipe to reply tracking
  const [swipeMsgId, setSwipeMsgId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartXRef = useRef<number>(0);

  const currentUid = currentUser?.uid || 'user';

  // Auto scroll to bottom when neighbor or message list updates
  useEffect(() => {
    scrollToBottom();
  }, [selectedNeighbor?.id, chatMessages[selectedNeighbor?.id]?.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatMessageTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const str = String(timestamp);
    if (str.includes('PM') || str.includes('AM') || str.toLowerCase() === 'just now' || str.toLowerCase() === 'yesterday') {
      return str;
    }
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      return str;
    }
    try {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return str;
    }
  };

  const getMessageDateGroup = (timestampStr: string) => {
    if (!timestampStr) return 'Today';
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) {
      const lower = timestampStr.toLowerCase();
      if (lower.includes('yesterday')) return 'Yesterday';
      if (lower.includes('today')) return 'Today';
      return 'Recent';
    }
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    try {
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return 'Recent';
    }
  };

  // Touch handlers for swipe to reply
  const handleMessageTouchStart = (e: React.TouchEvent, msgId: string) => {
    touchStartXRef.current = e.touches[0].clientX;
    setSwipeMsgId(msgId);
    setSwipeOffset(0);
  };

  const handleMessageTouchMove = (e: React.TouchEvent) => {
    if (!swipeMsgId) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartXRef.current;
    
    // Swipe right only up to 80px limit
    if (diff > 0 && diff < 85) {
      setSwipeOffset(diff);
    }
  };

  const handleMessageTouchEnd = (msg: any) => {
    if (swipeOffset > 50) {
      setReplyingToMessage(msg);
      triggerBeep(380, 0.05);
    }
    setSwipeMsgId(null);
    setSwipeOffset(0);
  };

  // Get and filter messages
  let list = (chatMessages[selectedNeighbor.id] || []).filter(msg => {
    if (msg.deletedForUsers && msg.deletedForUsers.includes(currentUid)) {
      return false;
    }
    return true;
  });

  if (showActiveChatSearch && activeChatSearchQuery) {
    list = list.filter(m => m.text && m.text.toLowerCase().includes(activeChatSearchQuery.toLowerCase()));
  }

  const totalMessages = list.length;
  const slicedList = list.slice(-chatLimit);

  // Proximity details
  const distanceStr = selectedNeighbor.distanceMeters
    ? (selectedNeighbor.distanceMeters < 1000 ? `${selectedNeighbor.distanceMeters}m Away` : `${(selectedNeighbor.distanceMeters/1000).toFixed(1)}km Away`)
    : '320m Away';

  const getTrustStars = (score?: number) => {
    if (selectedNeighbor.id === 'nb-myai') return '⭐⭐⭐⭐⭐';
    const val = score ? Math.round(score / 20) : 4;
    return '⭐'.repeat(val) + '☆'.repeat(5 - val);
  };

  const pinnedMessage = pinnedMessages[selectedNeighbor.id];

  return (
    <div 
      className="absolute inset-0 flex flex-col justify-between z-40 overflow-hidden bg-stone-100 dark:bg-[#111315]"
      style={{ 
        fontFamily: 
          customChatFont === 'mono' ? '"JetBrains Mono", monospace' :
          customChatFont === 'serif' ? 'Georgia, serif' :
          customChatFont === 'chunky' ? 'Impact, sans-serif' :
          'inherit'
      }}
    >
      {/* Subtle Textured Gradient Background */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div 
          className={`absolute inset-0 transition-colors duration-300 ${
            appTheme === 'dark' 
              ? 'bg-gradient-to-tr from-[#111215] via-[#16181C] to-[#1F2125]' 
              : 'bg-gradient-to-tr from-[#FAFAF9] via-[#F5F5F4] to-[#F1F1F0]'
          }`} 
        />
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><path d="M0 30 Q25 15 50 30 T100 30 M0 70 Q25 55 50 70 T100 70" fill="none" stroke="${appTheme === 'dark' ? '%23FFFFFF' : '%231C1917'}" stroke-width="0.75"/></svg>')`,
            backgroundSize: '180px 180px'
          }}
        />
      </div>

      {/* 1. GLASSMORPHIC HEADER (Height: 72px) */}
      <div className="h-[72px] px-3 bg-white/95 dark:bg-[#1A1C1F]/95 border-b border-neutral-200/40 dark:border-neutral-800/40 flex justify-between items-center backdrop-blur-lg z-30 relative shrink-0 shadow-sm">
        <div className="flex items-center space-x-2 min-w-0">
          <button
            onClick={() => {
              setSelectedNeighbor(null);
              triggerBeep(465, 0.08);
            }}
            className="p-1.5 rounded-full text-[#0F8A5F] dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-all active:scale-95 duration-100"
          >
            <ArrowLeft className="w-[22px] h-[22px]" />
          </button>
          
          <div 
            onClick={() => {
              if (!selectedNeighbor.isGroup) {
                setViewingNeighborProfile(selectedNeighbor);
                triggerBeep(520, 0.08);
              }
            }}
            className={`flex items-center space-x-2.5 min-w-0 ${!selectedNeighbor.isGroup ? 'cursor-pointer hover:opacity-85 active:scale-98 transition' : ''}`}
          >
            <div className={`w-11 h-11 rounded-full ${selectedNeighbor.avatarColor} flex items-center justify-center text-xl flex-shrink-0 relative overflow-hidden shadow-sm border border-neutral-200/10`}>
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
                  return <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1A1C1F] animate-pulse" />;
                } else if (status === 'away') {
                  return <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-[#1A1C1F]" />;
                } else {
                  return <span className="absolute bottom-0 right-0 w-3 h-3 bg-neutral-400 rounded-full border-2 border-white dark:border-[#1A1C1F]" />;
                }
              })()}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center space-x-1">
                <h4 className="font-bold text-[16px] leading-tight truncate text-neutral-900 dark:text-neutral-50">{selectedNeighbor.name}</h4>
                {selectedNeighbor.isGroup && (
                  <span className="text-[8px] bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold rounded px-1.5 py-0.2">GROUP</span>
                )}
              </div>
              
              <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">
                <span className="text-emerald-500 dark:text-emerald-400 font-semibold">
                  {selectedNeighbor.onlineStatus === 'active' || selectedNeighbor.id === 'nb-myai' || selectedNeighbor.id === 'nb-1' ? 'online' : 'offline'}
                </span>
                <span>•</span>
                <span>{distanceStr}</span>
                <span>•</span>
                <span className="text-amber-500 dark:text-amber-400 font-bold">
                  🛡️ {selectedNeighbor.trustScore || selectedNeighbor.trustRating || 95}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Triggers in unified theme and exact same color */}
        <div className="flex items-center space-x-0.5 shrink-0">
          <button
            onClick={() => {
              setShowActiveChatSearch(!showActiveChatSearch);
              if (showActiveChatSearch) setActiveChatSearchQuery('');
              triggerBeep(450, 0.05);
            }}
            className={`p-2 rounded-full transition-all duration-100 active:scale-95 ${showActiveChatSearch ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' : 'text-[#0F8A5F] dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            title="Search Messages"
          >
            <Search className="w-[21px] h-[21px]" />
          </button>
          
          <button
            onClick={() => startCall(selectedNeighbor.id, 'audio')}
            className="p-2 text-[#0F8A5F] dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-100 active:scale-95"
            title="Voice Call"
          >
            <Phone className="w-[21px] h-[21px]" />
          </button>
          
          <button
            onClick={() => startCall(selectedNeighbor.id, 'video')}
            className="p-2 text-[#0F8A5F] dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all duration-100 active:scale-95"
            title="Video Call"
          >
            <VideoIcon className="w-[21px] h-[21px]" />
          </button>

          <button
            onClick={() => {
              setShowActiveChatDropdown(!showActiveChatDropdown);
              triggerBeep(320, 0.05);
            }}
            className={`p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-100 active:scale-95 ${showActiveChatDropdown ? 'text-emerald-600' : 'text-[#0F8A5F] dark:text-emerald-400'}`}
            title="More options"
          >
            <MoreVertical className="w-[21px] h-[21px]" />
          </button>

          {/* Kebab Dropdown Menu */}
          <AnimatePresence>
            {showActiveChatDropdown && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowActiveChatDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-13 w-52 rounded-2xl shadow-xl border p-1.5 z-50 overflow-hidden bg-white dark:bg-[#1A1C1F] border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100"
                >
                  <button
                    onClick={() => {
                      if (!selectedNeighbor.isGroup) {
                        setViewingNeighborProfile(selectedNeighbor);
                      } else {
                        setAudioFeedback(`Group: ${selectedNeighbor.name}`);
                      }
                      setShowActiveChatDropdown(false);
                      triggerBeep(380, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
                  >
                    View Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowActiveChatSearch(true);
                      setShowActiveChatDropdown(false);
                      triggerBeep(380, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
                  >
                    Search Conversation
                  </button>

                  <button
                    onClick={() => {
                      handleToggleMuteNeighbor(selectedNeighbor.id);
                      setShowActiveChatDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
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
                      setAudioFeedback(`Wallpaper: ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}`);
                      triggerBeep(420, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    Change Wallpaper
                  </button>

                  <button
                    onClick={() => {
                      handleExportChat(selectedNeighbor);
                      setShowActiveChatDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
                  >
                    Export Chat
                  </button>

                  <button
                    onClick={() => {
                      handleToggleBlockNeighbor(selectedNeighbor.id);
                      setShowActiveChatDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition text-rose-500 font-semibold"
                  >
                    {blockedNeighborIds.includes(selectedNeighbor.id) ? 'Unblock User' : 'Block User'}
                  </button>

                  <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                  <button
                    onClick={() => {
                      if (confirm("Clear chat history with " + selectedNeighbor.name + "?")) {
                        setChatMessages({
                          ...chatMessages,
                          [selectedNeighbor.id]: []
                        });
                        setAudioFeedback("Chat history cleared.");
                      }
                      setShowActiveChatDropdown(false);
                      triggerBeep(330, 0.05);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition text-rose-600 font-semibold"
                  >
                    Clear Chat History
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* TYPING INDICATOR - Floating */}
      {(() => {
        const isTyping = isAiTyping || selectedNeighbor.typingTo === currentUid;
        if (!isTyping) return null;
        return (
          <div className="absolute top-[96px] left-4 bg-white/90 dark:bg-[#1A1C1F]/90 border border-neutral-200/50 dark:border-neutral-800/50 py-1.5 px-3 rounded-full text-xs text-[#0F8A5F] flex items-center space-x-2 shadow-sm backdrop-blur-md z-20 animate-fade-in font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{selectedNeighbor.name} is typing</span>
            <span className="flex space-x-0.5 items-center pb-0.5">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-100" />
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-200" />
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-300" />
            </span>
          </div>
        );
      })()}

      {/* SEARCH BAR ROW */}
      <AnimatePresence>
        {showActiveChatSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/80 dark:bg-[#1A1C1F]/80 border-b border-neutral-100 dark:border-neutral-800 backdrop-blur-md px-4 py-2 flex items-center space-x-2 z-20 relative overflow-hidden"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={activeChatSearchQuery}
              onChange={(e) => setActiveChatSearchQuery(e.target.value)}
              placeholder="Search messages in this thread..."
              className="bg-transparent text-sm w-full focus:outline-none text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
            />
            {activeChatSearchQuery && (
              <button 
                onClick={() => setActiveChatSearchQuery('')} 
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PINNED MESSAGE CARD */}
      {pinnedMessage && (
        <div className="px-4 pt-2.5 z-10 relative">
          <div 
            onClick={() => {
              const element = document.getElementById(`msg-${pinnedMessage.id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-amber-400', 'transition-all');
                setTimeout(() => {
                  element.classList.remove('ring-2', 'ring-amber-400');
                }, 2000);
              }
              triggerBeep(450, 0.05);
            }}
            className="p-2.5 bg-white/90 dark:bg-[#1A1C1F]/90 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all backdrop-blur-md"
          >
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block leading-none">Pinned Message</span>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate mt-1 font-sans">
                  {pinnedMessage.text || '📷 Attachment file'}
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPinnedMessages(prev => {
                  const copy = { ...prev };
                  delete copy[selectedNeighbor.id];
                  return copy;
                });
                setAudioFeedback("Message unpinned");
                triggerBeep(320, 0.05);
              }}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN MESSAGE STREAM SCROLL CONTAINER */}
      <div 
        ref={chatScrollContainerRef}
        onScroll={(e) => {
          const target = e.currentTarget;
          const isUp = target.scrollHeight - target.scrollTop - target.clientHeight > 350;
          setShowScrollToBottom(isUp);
        }}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin relative z-10"
      >
        <div className="p-4 bg-white/60 dark:bg-neutral-900/60 border border-neutral-200/40 dark:border-neutral-800/40 rounded-3xl text-center space-y-2 mb-6 max-w-[300px] mx-auto shadow-sm backdrop-blur-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 py-0.5 px-2 rounded-full inline-block">
            Bio & Interests
          </span>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
            "{selectedNeighbor.bio || "No bio description set yet."}"
          </p>
          <div className="flex flex-wrap gap-1 justify-center pt-1">
            {selectedNeighbor.interests?.map((int: string) => (
              <span key={int} className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 text-[9px] px-2 py-0.5 rounded-full font-medium">
                #{int}
              </span>
            )) || <span className="text-[9px] text-zinc-400">#friendly #nearby</span>}
          </div>

          {!selectedNeighbor.isGroup && selectedNeighbor.id !== 'nb-myai' && (
            <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 mt-2">
              {(Array.isArray(friendIds) ? friendIds : []).includes(selectedNeighbor.id) ? (
                <div className="flex justify-center items-center space-x-1.5 text-[10px] text-emerald-500 font-bold uppercase py-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Friends on Radar</span>
                </div>
              ) : sentFriendRequestIds.includes(selectedNeighbor.id) ? (
                <div className="text-[10px] text-neutral-400 font-semibold uppercase">
                  ⏳ Request pending approval
                </div>
              ) : pendingFriendRequests.includes(selectedNeighbor.id) ? (
                <button 
                  onClick={() => {
                    handleAcceptFriendRequest(selectedNeighbor.id);
                    triggerBeep(520, 0.1);
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-xl tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase cursor-pointer"
                >
                  <span>🤝 Accept Friend Request</span>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    handleAddNewFriend(selectedNeighbor.id);
                    triggerBeep(520, 0.1);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-xl tracking-wider transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm uppercase cursor-pointer"
                >
                  <span>➕ Add Friend on Radar</span>
                </button>
              )}
            </div>
          )}
        </div>

        {slicedList.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center space-y-3.5">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center animate-pulse text-indigo-500">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base">Start Your Conversation</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Every great friendship starts with a simple hello. Ask about local spots, or write a casual gist outside!
              </p>
            </div>
          </div>
        ) : (
          <>
            {totalMessages > chatLimit && (
              <div className="flex justify-center my-3.5">
                <button
                  onClick={() => {
                    triggerBeep(400, 0.05);
                    setChatLimit((prev: number) => prev + 50);
                  }}
                  className="px-3.5 py-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer active:scale-95 transition shadow-sm"
                >
                  Load older messages ({totalMessages - chatLimit} remaining)
                </button>
              </div>
            )}

            {(() => {
              let lastDateGroup = '';
              return slicedList.map((msg: any) => {
                const isMy = msg.senderId === 'user' || msg.senderId === currentUid;
                
                if (msg.type === 'call_log') {
                  return (
                    <div key={msg.id} className="flex justify-center my-4 animate-fade-in">
                      <div className="bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/40 dark:border-neutral-800/40 rounded-2xl px-4 py-2 text-center text-[10px] text-neutral-500 dark:text-neutral-400 font-medium shadow-sm max-w-xs flex items-center space-x-2">
                        <span className="p-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
                          {msg.callLog?.status === 'missed' ? '🚨' : '📞'}
                        </span>
                        <div>
                          {msg.callLog?.status === 'missed' ? (
                            <span className="text-rose-500 font-bold">Missed {msg.callLog.type} call</span>
                          ) : (
                            <span>Completed {msg.callLog?.type} call ({msg.callLog?.durationSeconds}s)</span>
                          )}
                          <p className="text-[8px] text-neutral-400 mt-0.5">{formatMessageTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const senderNeighbor = selectedNeighbor.isGroup 
                  ? neighbors.find(n => n.id === msg.senderId) 
                  : selectedNeighbor;
                const senderDisplayName = senderNeighbor ? senderNeighbor.name : (msg.senderId === 'nb-myai' ? 'Nearby AI' : 'Member');
                const senderUsername = senderNeighbor ? senderNeighbor.username : (msg.senderId === 'nb-myai' ? 'nearby_ai' : 'member');

                const currentDateGroup = getMessageDateGroup(msg.timestamp);
                const showDateDivider = currentDateGroup !== lastDateGroup;
                lastDateGroup = currentDateGroup;

                const hasUrl = msg.text ? detectUrls(msg.text) : null;
                const firstUrl = hasUrl ? hasUrl[0] : null;

                return (
                  <div key={msg.id} id={`msg-${msg.id}`} className="space-y-1.5">
                    {showDateDivider && (
                      <div className="flex justify-center my-4 animate-fade-in">
                        <span className="px-3.5 py-1 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-full text-[10px] text-neutral-600 dark:text-neutral-400 font-bold tracking-wide">
                          {currentDateGroup}
                        </span>
                      </div>
                    )}

                    <div
                      onTouchStart={(e) => handleMessageTouchStart(e, msg.id)}
                      onTouchMove={handleMessageTouchMove}
                      onTouchEnd={() => handleMessageTouchEnd(msg)}
                      style={{
                        transform: swipeMsgId === msg.id ? `translateX(${swipeOffset}px)` : 'none',
                        transition: swipeMsgId === msg.id ? 'none' : 'transform 0.15s ease-out'
                      }}
                      className={`flex ${isMy ? 'justify-end' : 'justify-start'} animate-fade-in group relative`}
                    >
                      <div className="max-w-[78%] space-y-1 relative">
                        {!isMy && selectedNeighbor.isGroup && !msg.deletedForEveryone && (
                          <span className="text-[10px] text-neutral-500 font-semibold block ml-2">
                            {senderDisplayName} (@{senderUsername})
                          </span>
                        )}

                        <div
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedMessageForMenu(msg);
                            triggerBeep(450, 0.05);
                          }}
                          className={`p-3.5 relative shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 select-all ${
                            msg.deletedForEveryone 
                              ? 'rounded-2xl bg-neutral-200/50 dark:bg-neutral-900/50 text-neutral-400 dark:text-neutral-500 italic'
                              : isMy
                                ? 'rounded-[22px] rounded-br-[4px] text-white bg-[#0F8A5F]'
                                : 'rounded-[22px] rounded-bl-[4px] text-neutral-900 dark:text-neutral-100 bg-white dark:bg-[#1E1F22] border border-neutral-200/20 dark:border-neutral-800/20'
                          }`}
                        >
                          {msg.isForwarded && !msg.deletedForEveryone && (
                            <p className="text-[10px] text-neutral-400 italic flex items-center mb-1 font-sans">
                              <span className="mr-1">↩ Forwarded</span>
                            </p>
                          )}

                          {msg.replyTo && !msg.deletedForEveryone && (
                            <div className="mb-2 p-2 bg-black/10 dark:bg-white/10 border-l-4 border-l-emerald-400 rounded-xl text-left text-[11px] leading-snug">
                              <span className="font-bold text-emerald-400 block">@{msg.replyTo.senderName || 'user'}</span>
                              <span className="opacity-80 block truncate font-sans">"{msg.replyTo.text}"</span>
                            </div>
                          )}

                          {msg.deletedForEveryone ? (
                            <p className="text-xs font-sans flex items-center space-x-1.5">
                              <span>🚫 This message was deleted</span>
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {msg.text && (
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-sans">
                                  {msg.text}
                                </p>
                              )}

                              {firstUrl && (
                                <div className="mt-2 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 overflow-hidden text-left shadow-sm">
                                  <div className="h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/15 flex items-center justify-center relative">
                                    <Globe className="w-8 h-8 text-emerald-500/40" />
                                    <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-mono uppercase tracking-wider">Web Link</span>
                                  </div>
                                  <div className="p-2.5 space-y-1">
                                    <p className="text-xs font-bold truncate text-neutral-800 dark:text-neutral-100">{firstUrl.replace('https://', '').replace('http://', '').split('/')[0]}</p>
                                    <p className="text-[11px] opacity-70 line-clamp-2 leading-tight">Explore the neighborhood, nearby safe meetups, and real-time radar mapping on Nearby!</p>
                                    <a 
                                      href={firstUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 hover:underline pt-1"
                                    >
                                      <span>Open Link</span>
                                    </a>
                                  </div>
                                </div>
                              )}

                              {msg.type === 'image' && msg.mediaUrl && (
                                <div 
                                  onClick={() => {
                                    setFullscreenImage({ url: msg.mediaUrl || '', caption: msg.text });
                                    triggerBeep(450, 0.05);
                                  }}
                                  className="rounded-[18px] overflow-hidden border border-black/10 dark:border-white/10 shadow-inner cursor-pointer hover:opacity-95 transition-all duration-200"
                                >
                                  <img src={msg.mediaUrl} alt="" className="w-full h-auto max-h-[220px] object-cover" />
                                </div>
                              )}

                              {msg.type === 'video' && msg.mediaUrl && (
                                <div className="rounded-[18px] overflow-hidden border border-black/10 dark:border-white/10 shadow-inner relative group">
                                  <video src={msg.mediaUrl} controls className="w-full h-auto max-h-[220px] object-cover" />
                                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded-full text-[9px] text-white font-bold tracking-wide">
                                    0:12
                                  </div>
                                </div>
                              )}

                              {msg.type === 'document' && msg.mediaUrl && (
                                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-black/5 dark:bg-black/25 border border-white/5 mt-1">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold truncate">{msg.fileName || "attachment_document.pdf"}</p>
                                    <p className="text-[10px] opacity-60 font-mono">{msg.fileSize || "142 KB"}</p>
                                  </div>
                                  <a 
                                    href={msg.mediaUrl} 
                                    download={msg.fileName || "attachment_file"} 
                                    className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-700 dark:text-neutral-200 transition flex items-center justify-center cursor-pointer"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              )}

                              {msg.type === 'voice' && (
                                <div className="flex items-center space-x-3 bg-black/5 dark:bg-black/20 p-2.5 rounded-2xl">
                                  <button
                                    onClick={() => {
                                      playVoiceNote(msg, senderDisplayName);
                                    }}
                                    className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                  >
                                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                                      <span>Voice Note</span>
                                      <span>{msg.audioDurationSec || 6}s</span>
                                    </div>
                                    <div className="flex items-center space-x-[2px] h-6 mt-1.5 relative overflow-hidden">
                                      {[4, 12, 8, 16, 24, 14, 8, 18, 28, 20, 10, 16, 24, 12, 6, 14, 10, 4].map((barHeight, idx) => (
                                        <div 
                                          key={idx}
                                          style={{ height: `${barHeight}px` }}
                                          className={`w-[3px] rounded-full transition-all duration-150 ${
                                            playingVoiceId === msg.id 
                                              ? 'bg-emerald-400 animate-pulse' 
                                              : 'bg-neutral-300 dark:bg-neutral-700'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const speedMap = { ...voicePlaybackSpeed };
                                      const currentSp = speedMap[msg.id] || 1;
                                      const nextSp = currentSp === 1 ? 1.5 : currentSp === 1.5 ? 2 : 1;
                                      speedMap[msg.id] = nextSp;
                                      setVoicePlaybackSpeed(speedMap);
                                      setAudioFeedback(`Speed: ${nextSp}x`);
                                      triggerBeep(380 + nextSp * 100, 0.05);
                                    }}
                                    className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded-lg text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300 hover:bg-black/20 dark:hover:bg-white/20"
                                  >
                                    {voicePlaybackSpeed[msg.id] || 1}x
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] opacity-75 font-medium mt-1.5 space-x-2">
                            <span>{formatMessageTime(msg.timestamp)}</span>
                            {isMy && !msg.deletedForEveryone && (
                              <span className="flex items-center">
                                {msg.status === 'sending' ? (
                                  <span className="text-[11px] animate-spin">⏳</span>
                                ) : msg.status === 'sent' ? (
                                  <Check className="w-[14px] h-[14px] text-neutral-300" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-[14px] h-[14px] text-neutral-300 animate-fade-in" />
                                ) : (
                                  <motion.span 
                                    initial={{ scale: 0.8 }} 
                                    animate={{ scale: 1 }} 
                                    className="text-[#34B7F1]"
                                  >
                                    <CheckCheck className="w-[14px] h-[14px] text-[#34B7F1]" />
                                  </motion.span>
                                )}
                              </span>
                            )}
                          </div>

                          {msg.reactions && msg.reactions.length > 0 && !msg.deletedForEveryone && (
                            <div className="absolute -bottom-2 -right-1 bg-white dark:bg-[#1A1C1F] border border-neutral-200/40 dark:border-neutral-800/40 rounded-full py-0.5 px-2 flex items-center space-x-0.5 text-xs shadow-md select-none z-10 animate-fade-in">
                              {Array.from(new Set(msg.reactions.map((r: any) => r.reaction))).slice(0, 3).map((emoji: any) => (
                                <span key={emoji} className="scale-100 hover:scale-125 transition-transform">{emoji}</span>
                              ))}
                              {msg.reactions.length > 1 && (
                                <span className="text-[9px] text-neutral-500 font-bold ml-1">{msg.reactions.length}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {!msg.deletedForEveryone && (
                          <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center space-x-1">
                            <button 
                              onClick={() => {
                                setReplyingToMessage(msg);
                                triggerBeep(380, 0.04);
                              }}
                              className="p-1.5 bg-white dark:bg-[#1A1C1F] border border-neutral-200/60 dark:border-neutral-800/60 rounded-full hover:text-[#0F8A5F] shadow-sm text-neutral-500"
                              title="Reply"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedMessageForMenu(msg);
                                triggerBeep(450, 0.05);
                              }}
                              className="p-1.5 bg-white dark:bg-[#1A1C1F] border border-neutral-200/60 dark:border-neutral-800/60 rounded-full hover:text-indigo-500 shadow-sm text-neutral-500"
                              title="More Options"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </>
        )}

        {isAiTyping && (
          <div className="flex justify-start items-center space-x-2 animate-pulse pl-2 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Nearby AI helper is writing...</span>
          </div>
        )}
        <div ref={chatMessagesEndRef} />
      </div>

      {/* FLOATING SCROLL TO BOTTOM */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 w-11 h-11 bg-white dark:bg-[#1A1C1F] border border-neutral-200/60 dark:border-neutral-800/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-20"
        >
          <ArrowLeft className="w-5 h-5 -rotate-90" />
        </button>
      )}

      {/* REPLY PREVIEW BAR */}
      {replyingToMessage && (
        <div className="px-4 py-3 bg-white/95 dark:bg-[#1A1C1F]/95 border-t border-neutral-200/40 dark:border-neutral-800/40 flex items-center justify-between text-neutral-800 dark:text-neutral-200 border-l-4 border-l-[#0F8A5F] rounded-t-2xl shadow-inner backdrop-blur-md z-20 relative">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-[11px] text-[#0F8A5F] font-bold uppercase tracking-wider">Replying to {replyingToMessage.senderId === 'user' ? 'yourself' : selectedNeighbor.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1 italic font-sans">"{replyingToMessage.text || 'Media attachment files'}"</p>
          </div>
          <button 
            onClick={() => {
              setReplyingToMessage(null);
              triggerBeep(320, 0.05);
            }} 
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 rounded-full transition flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. PREMIUM FLOATING CHAT COMPOSER BAR */}
      <div className="p-4 bg-transparent border-t border-neutral-200/10 shrink-0 z-20 relative">
        {isRecordingVoice && (
          <div className="absolute top-[-44px] left-4 right-4 bg-rose-500/90 text-white rounded-full py-2 px-4 flex items-center justify-between text-xs font-semibold shadow-lg backdrop-blur-sm animate-bounce z-20">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
              <span>Recording: {voiceDuration}s</span>
            </div>
            <span>{voiceRecordingLocked ? '🔒 locked hands-free' : 'Swipe left to cancel 👈'}</span>
          </div>
        )}

        {showEmojiPickerLocal && (
          <div className="absolute bottom-[80px] left-4 z-50 w-[300px] h-[320px] bg-white dark:bg-[#1C1E22] border border-neutral-200 dark:border-neutral-800 rounded-[24px] shadow-2xl p-3.5 flex flex-col space-y-2 animate-fade-in text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Choose Emoji</span>
              <button 
                type="button"
                onClick={() => {
                  setShowEmojiPickerLocal(false);
                  triggerBeep(320, 0.05);
                }}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition cursor-pointer border-none outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Search Input */}
            <input 
              type="text"
              value={emojiSearch}
              onChange={(e) => setEmojiSearch(e.target.value)}
              placeholder="Search emojis..."
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-150 dark:border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
            />

            {/* Scrollable grid area */}
            <div className="flex-1 overflow-y-auto scrollbar-none pr-1 space-y-3.5">
              {(() => {
                const queryStr = emojiSearch.trim().toLowerCase();
                if (queryStr) {
                  // Flattened search match
                  const matched: any[] = [];
                  EMOJI_CATEGORIES.forEach(cat => {
                    cat.emojis.forEach(e => {
                      if (e.tags.includes(queryStr) || e.char === queryStr) {
                        matched.push(e);
                      }
                    });
                  });
                  if (matched.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs text-neutral-400">
                        Nothing here yet.
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-6 gap-2 pt-1">
                      {matched.map((e, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTextInput(textInput + e.char);
                            triggerBeep(450, 0.03);
                          }}
                          className="text-2xl p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:scale-90 text-center cursor-pointer border-none outline-none"
                        >
                          {e.char}
                        </button>
                      ))}
                    </div>
                  );
                }

                // Normal category view
                return EMOJI_CATEGORIES.map((category, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 block pt-1 font-mono">
                      {category.name}
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {category.emojis.map((e, eIdx) => (
                        <button
                          key={eIdx}
                          type="button"
                          onClick={() => {
                            setTextInput(textInput + e.char);
                            triggerBeep(450, 0.03);
                          }}
                          className="text-2xl p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:scale-90 text-center cursor-pointer border-none outline-none"
                        >
                          {e.char}
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        <div className="relative flex flex-col w-full bg-white/95 dark:bg-[#1A1C1F]/95 rounded-[32px] shadow-lg border border-neutral-100 dark:border-neutral-800/50 backdrop-blur animate-fade-in">
          <div className="h-16 px-4 flex items-center justify-between">
            <input 
              type="file" 
              ref={chatFileRef} 
              onChange={handleGalleryUploadForChat} 
              className="hidden" 
            />

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPickerLocal(!showEmojiPickerLocal);
                  triggerBeep(450, 0.05);
                }}
                className={`p-2 rounded-full transition ${showEmojiPickerLocal ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                title="Add Emoji"
              >
                <Smile className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAttachmentSheet(!showAttachmentSheet);
                  triggerBeep(450, 0.05);
                }}
                className={`p-2 rounded-full transition ${showAttachmentSheet ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                title="Attachment Menu"
              >
                <Paperclip className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex-1 flex mx-2 relative"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-2xl py-2 px-4 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                disabled={isRecordingVoice && !voiceRecordingLocked}
              />
            </form>

            <div className="shrink-0 flex items-center">
              {textInput.trim() || voiceRecordingLocked ? (
                <button
                  onClick={() => {
                    if (voiceRecordingLocked) {
                      stopAndSendVoice();
                      setVoiceRecordingLocked(false);
                    } else {
                      sendMessage();
                    }
                    triggerBeep(520, 0.05);
                  }}
                  className="p-2 bg-[#0F8A5F] hover:bg-[#0c7551] text-white rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    startRecordingVoice();
                  }}
                  onMouseUp={() => {
                    if (!voiceRecordingLocked) {
                      stopAndSendVoice();
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startRecordingVoice();
                  }}
                  onTouchEnd={() => {
                    if (!voiceRecordingLocked) {
                      stopAndSendVoice();
                    }
                  }}
                  className={`p-2.5 rounded-full shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                    isRecordingVoice ? 'bg-rose-500 text-white animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                  title="Hold to record voice"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {voiceRecordingLocked && (
          <div className="flex justify-between items-center px-4 pt-2">
            <button 
              onClick={() => {
                cancelRecordingVoice();
              }}
              className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Discard recording</span>
            </button>
            <span className="text-[10px] text-neutral-400">Locked Mic is active...</span>
          </div>
        )}
      </div>

      {/* 5. ATTACHMENT MENU BOTTOM SHEET */}
      <AnimatePresence>
        {showAttachmentSheet && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAttachmentSheet(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1C1F] border-t border-neutral-200 dark:border-neutral-800 rounded-t-[32px] p-6 z-50 text-neutral-800 dark:text-neutral-100 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] select-none"
            >
              <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-6" />
              <h3 className="text-center font-bold text-base mb-6">Select Attachment</h3>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center max-w-md mx-auto">
                <button
                  onClick={() => {
                    setShowAttachmentSheet(false);
                    startCamera();
                    triggerBeep(450, 0.05);
                  }}
                  className="flex flex-col items-center space-y-1.5 active:scale-95 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Camera</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentSheet(false);
                    chatFileRef.current?.click();
                    triggerBeep(450, 0.05);
                  }}
                  className="flex flex-col items-center space-y-1.5 active:scale-95 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-blue-500 text-white flex items-center justify-center shadow-md">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Gallery</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentSheet(false);
                    chatFileRef.current?.click();
                    triggerBeep(450, 0.05);
                  }}
                  className="flex flex-col items-center space-y-1.5 active:scale-95 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Document</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentSheet(false);
                    setAudioFeedback("Attaching location Presets...");
                    triggerBeep(450, 0.05);
                  }}
                  className="flex flex-col items-center space-y-1.5 active:scale-95 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-green-500 text-white flex items-center justify-center shadow-md">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Location</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentSheet(false);
                    setAudioFeedback("Contact attached.");
                    triggerBeep(450, 0.05);
                  }}
                  className="flex flex-col items-center space-y-1.5 active:scale-95 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Contact</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentSheet(false);
                    setAudioFeedback("Attaching audio note tracks...");
                    triggerBeep(450, 0.05);
                  }}
                  className="flex flex-col items-center space-y-1.5 active:scale-95 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-md">
                    <Music className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Audio</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttachmentSheet(false);
                    setAudioFeedback("Synthesizing Meetup Invite card...");
                    triggerBeep(450, 0.05);
                  }}
                  className="flex flex-col items-center space-y-1.5 active:scale-95 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
                    <Crown className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Invite</span>
                </button>
              </div>

              <button
                onClick={() => setShowAttachmentSheet(false)}
                className="w-full mt-6 py-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-2xl transition text-center cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. MESSAGE OPTIONS BOTTOM SHEET */}
      <AnimatePresence>
        {selectedMessageForMenu && (
          <>
            <div className="fixed inset-0 bg-black/60 z-45 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMessageForMenu(null)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1C1F] border-t border-neutral-200 dark:border-neutral-800 rounded-t-[32px] p-6 z-50 text-neutral-800 dark:text-neutral-100 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] select-none"
            >
              <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-5" />
              
              {/* Reactions popup */}
              <div className="flex space-x-2 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-2xl justify-around select-none mb-4 shadow-inner max-w-sm mx-auto">
                {['❤️', '😂', '👍', '🔥', '😮', '😢'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReaction(selectedMessageForMenu, emoji);
                      setSelectedMessageForMenu(null);
                    }}
                    className="hover:scale-130 active:scale-95 transition-transform text-2xl p-1 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto font-sans">
                <button
                  onClick={() => {
                    setReplyingToMessage(selectedMessageForMenu);
                    setSelectedMessageForMenu(null);
                    triggerBeep(330, 0.04);
                  }}
                  className="w-full text-left p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center space-x-3 transition font-medium cursor-pointer"
                >
                  <Reply className="w-5 h-5 text-indigo-500" />
                  <span>Reply Message</span>
                </button>

                <button
                  onClick={() => {
                    setShowForwardModal(selectedMessageForMenu);
                    setSelectedMessageForMenu(null);
                    triggerBeep(380, 0.05);
                  }}
                  className="w-full text-left p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center space-x-3 transition font-medium cursor-pointer"
                >
                  <Share2 className="w-5 h-5 text-sky-500" />
                  <span>Forward Message</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedMessageForMenu.text) {
                      navigator.clipboard.writeText(selectedMessageForMenu.text);
                      setAudioFeedback("✓ Message text copied to clipboard");
                    } else {
                      setAudioFeedback("Nothing to copy!");
                    }
                    setSelectedMessageForMenu(null);
                    triggerBeep(380, 0.05);
                  }}
                  className="w-full text-left p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center space-x-3 transition font-medium cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>Copy Text Content</span>
                </button>

                <button
                  onClick={() => {
                    setPinnedMessages((prev: any) => ({
                      ...prev,
                      [selectedNeighbor.id]: selectedMessageForMenu
                    }));
                    setAudioFeedback("Message pinned to chat room");
                    setSelectedMessageForMenu(null);
                    triggerBeep(520, 0.08);
                  }}
                  className="w-full text-left p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center space-x-3 transition font-medium cursor-pointer"
                >
                  <Pin className="w-5 h-5 text-yellow-500" />
                  <span>Pin to Conversation</span>
                </button>

                <button
                  onClick={() => {
                    handleDeleteForMe(selectedMessageForMenu);
                    setSelectedMessageForMenu(null);
                  }}
                  className="w-full text-left p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center space-x-3 transition font-medium text-rose-500 cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete For Me</span>
                </button>

                {selectedMessageForMenu.senderId === 'user' && (
                  <button
                    onClick={() => {
                      handleDeleteForEveryone(selectedMessageForMenu);
                      setSelectedMessageForMenu(null);
                    }}
                    className="w-full text-left p-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl flex items-center space-x-3 transition font-bold text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete For Everyone</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setAudioFeedback("Thank you. We've received your report.");
                    setSelectedMessageForMenu(null);
                    triggerBeep(300, 0.15);
                  }}
                  className="w-full text-left p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center space-x-3 transition font-medium text-orange-500 cursor-pointer"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Report Message</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedMessageForMenu(null)}
                className="w-full mt-4 py-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-2xl transition text-center cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 7. FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {fullscreenImage && (
          <div className="fixed inset-0 bg-black/95 z-55 flex flex-col justify-between p-4 animate-fade-in text-white overflow-hidden">
            <div className="flex justify-end p-4 z-20">
              <button
                onClick={() => setFullscreenImage(null)}
                className="p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-full text-white backdrop-blur-md transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center relative p-4 select-none z-10">
              <motion.img 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                src={fullscreenImage.url} 
                alt="Zoom Preview" 
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl" 
              />
            </div>

            <div className="text-center pb-12 z-20 space-y-1.5 px-6 max-w-md mx-auto">
              {fullscreenImage.caption && (
                <p className="text-sm text-neutral-100 leading-relaxed font-medium bg-neutral-900/80 py-2.5 px-5 rounded-2xl shadow-md border border-neutral-800/40 inline-block">
                  {fullscreenImage.caption}
                </p>
              )}
              <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase select-none">Tap close to exit fullscreen</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
