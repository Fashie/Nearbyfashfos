import React from 'react';
import { motion } from 'motion/react';
import { Search, X, Sparkles, Camera, ImageIcon, ChevronRight, Users, Check } from 'lucide-react';
import { Neighbor, StorySnap } from '../../../types';

interface StatusTabProps {
  filteredNeighbors: Neighbor[];
  friendIds: string[];
  currentUser: any;
  userDisplayName: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  myStorySnaps: StorySnap[];
  mutedStoryUserIds: string[];
  sentFriendRequestIds: string[];
  pendingFriendRequests: string[];
  appTheme: 'light' | 'dark';
  theme: any;
  neighbors: Neighbor[];
  radarRadius: number;
  triggerBeep: (freq: number, duration: number, type?: string) => void;
  startCamera: () => void;
  storyFileRef: React.RefObject<HTMLInputElement | null>;
  handleGalleryUploadForStory: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setStoryViewer: (val: any) => void;
  setScheduleMeetupPoint: (val: string) => void;
  setShowScheduleMeetupModal: (val: boolean) => void;
  setViewingNeighborProfile: (val: Neighbor) => void;
  actuallyAddFriend: (id: string) => void;
  setActiveTab: (tab: 'radar' | 'chat' | 'status' | 'menu' | 'explore') => void;
}

export const StatusTab = React.memo(function StatusTab({
  filteredNeighbors,
  friendIds,
  currentUser,
  userDisplayName,
  searchQuery,
  setSearchQuery,
  myStorySnaps,
  mutedStoryUserIds,
  sentFriendRequestIds,
  pendingFriendRequests,
  appTheme,
  theme,
  neighbors,
  radarRadius,
  triggerBeep,
  startCamera,
  storyFileRef,
  handleGalleryUploadForStory,
  setStoryViewer,
  setScheduleMeetupPoint,
  setShowScheduleMeetupModal,
  setViewingNeighborProfile,
  actuallyAddFriend,
  setActiveTab,
}: StatusTabProps) {
  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour < 12) return { text: "Good Morning", emoji: "🌅" };
    if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
    return { text: "Good Evening", emoji: "🌙" };
  };
  const getFirstName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName.split(' ')[0];
    }
    if (userDisplayName) {
      return userDisplayName.split(' ')[0];
    }
    return "Samuel";
  };

  // Dynamic Neighbors excluding self and MYAI
  const dynamicNeighbors = filteredNeighbors.filter(nb => nb.id !== 'nb-myai' && !nb.isGroup);

  // Suggested Friends: candidate users who are NOT yet friends o!
  const suggestedFriendsList = filteredNeighbors.filter(nb => 
    nb.id !== 'nb-myai' && 
    !nb.isGroup && 
    !friendIds.includes(nb.id)
  ).slice(0, 3);

  // Fallback suggestions if list is empty (using only Firestore for production, empty state fallback)
  const finalSuggestions = suggestedFriendsList;

  // Horizontally Scrollable People list o!
  const finalPeopleList = dynamicNeighbors;

  const isDbLoading = neighbors.length === 0;

  return (
    <motion.div
      key="status-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.22 }}
      className="p-5 space-y-6 pb-24 overflow-y-auto h-full scrollbar-none"
    >
      {/* 1. Greeting header */}
      <div className="space-y-1.5 animate-fade-in text-left">
        <h1 className="text-[28px] font-black tracking-tight text-[#161616] dark:text-white font-sans flex items-center space-x-2">
          <span>{getGreeting().emoji} {getGreeting().text}, {getFirstName()} 👋</span>
        </h1>
        <p className="text-[14px] text-neutral-400 font-semibold font-sans">
          You're visible to <span className="text-[#0F8A5F] font-bold">{dynamicNeighbors.length}</span> people nearby
        </p>
      </div>

      {/* 2. Custom Rounded Search Bar */}
      <div 
        className="w-full h-[56px] rounded-[18px] border flex items-center px-4 transition-all duration-200 bg-white dark:bg-[#1A1C1F] border-neutral-100 dark:border-[#2A2D31]/40 focus-within:border-[#0F8A5F] focus-within:ring-4 focus-within:ring-[#0F8A5F]/15 shadow-sm text-[#161616] dark:text-white"
      >
        <Search className="w-5 h-5 mr-3 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people, interests or locations..."
          className="bg-transparent text-[15px] font-medium w-full focus:outline-none placeholder-neutral-400 dark:placeholder-neutral-500 border-none"
        />
        {searchQuery && (
          <button 
            onClick={() => { setSearchQuery(''); triggerBeep(400, 0.05); }}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer border-none outline-none"
          >
            <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
          </button>
        )}
      </div>

      {/* Skeleton Loader Fallback */}
      {isDbLoading ? (
        <div className="space-y-4">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse space-y-3 p-5 bg-white dark:bg-[#1A1C1F] rounded-[22px] border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-2 flex-1 text-left">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 3. Live Stories Row */}
          <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Live Stories</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => { startCamera(); triggerBeep(450, 0.08); }}
                  className="p-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-[#0F8A5F]/10 hover:text-[#0F8A5F] dark:hover:text-[#0F8A5F] rounded-lg transition text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center space-x-1 cursor-pointer border-none outline-none"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Camera</span>
                </button>
                <button
                  onClick={() => { storyFileRef.current?.click(); triggerBeep(450, 0.08); }}
                  className="p-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-[#0F8A5F]/10 hover:text-[#0F8A5F] dark:hover:text-[#0F8A5F] rounded-lg transition text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center space-x-1 cursor-pointer border-none outline-none"
                >
                  <input 
                    type="file" 
                    ref={storyFileRef} 
                    onChange={handleGalleryUploadForStory} 
                    accept="image/*,video/*" 
                    className="hidden" 
                  />
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 overflow-x-auto py-1.5 scrollbar-none">
              <div 
                onClick={() => {
                  if (myStorySnaps.length > 0) {
                    setStoryViewer('me');
                  } else {
                    storyFileRef.current?.click();
                  }
                  triggerBeep(480, 0.08);
                }}
                className="flex flex-col items-center flex-shrink-0 relative cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500 transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center shadow-sm">
                  <div className={`w-full h-full rounded-full p-[2.5px] flex items-center justify-center overflow-hidden ${
                    appTheme === 'dark' ? 'bg-[#111827]' : 'bg-white'
                  }`}>
                    {myStorySnaps.length > 0 ? (
                      <img src={myStorySnaps[myStorySnaps.length - 1].mediaUrl} alt="My Story" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-xl">✨</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] mt-1.5 font-semibold text-neutral-400 max-w-[64px] truncate">You</span>
              </div>

              {neighbors
                .filter(nb => !nb.isGroup && nb.activeStory && nb.activeStory.length > 0 && !mutedStoryUserIds.includes(nb.id))
                .map(nb => (
                  <div 
                    key={`dashboard-story-${nb.id}`}
                    onClick={() => {
                      setStoryViewer(nb);
                      triggerBeep(480, 0.08);
                    }}
                    className="flex flex-col items-center flex-shrink-0 relative cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#0F8A5F] to-emerald-400 transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center shadow-sm">
                      <div className={`w-full h-full rounded-full p-[2.5px] flex items-center justify-center overflow-hidden ${
                        appTheme === 'dark' ? 'bg-[#111827]' : 'bg-white'
                      }`}>
                        {nb.customProfilePhoto ? (
                          <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-xl">{nb.avatarEmoji || "👋"}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] mt-1.5 font-bold text-[#161616] dark:text-white max-w-[64px] truncate">{nb.name}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* 4. Radar Live Preview Card */}
          <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📍</span>
                <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Radar Nearby</h3>
              </div>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                Your live neighborhood radar is pulsing. Explore connections, group activities, and safe rendezvous locations down your street in real-time.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveTab('radar'); triggerBeep(450, 0.08); }}
                className="h-[44px] px-6 rounded-[14px] bg-[#0F8A5F] text-white hover:bg-[#0C7A53] text-[13px] font-bold shadow-sm transition duration-150 flex items-center space-x-2 cursor-pointer border-none outline-none"
              >
                <span>Open Radar</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="h-[180px] bg-neutral-50 dark:bg-neutral-950/40 rounded-2xl border border-neutral-100/60 dark:border-neutral-900 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[60px] h-[60px] rounded-full border border-[#0F8A5F]/20" />
                <div className="w-[120px] h-[120px] rounded-full border border-[#0F8A5F]/15" />
                <div className="w-[180px] h-[180px] rounded-full border border-[#0F8A5F]/10 animate-pulse" />
              </div>
              <motion.div 
                style={{ originX: '100%', originY: '100%' }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: "linear", duration: 6 }}
                className="absolute bottom-1/2 right-1/2 w-[120px] h-[120px] bg-gradient-to-tl from-[#0F8A5F]/15 to-transparent border-r border-[#0F8A5F]/25 origin-bottom-right"
              />
              <div className="absolute top-[35%] left-[38%]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8A5F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0F8A5F]" />
                </span>
              </div>
              <div className="absolute bottom-[40%] right-[32%]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8A5F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0F8A5F]" />
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#0F8A5F] bg-[#0F8A5F]/10 px-2.5 py-1 rounded-full relative z-10 uppercase tracking-widest border border-[#0F8A5F]/20 animate-pulse">
                Scanning Area
              </span>
            </div>
          </div>

          {/* 5. Safe Meetup Suggestions */}
          <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🤝</span>
                <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Safe Meetups</h3>
              </div>
              <button
                onClick={() => { setActiveTab('explore'); triggerBeep(410, 0.08); }}
                className="text-xs font-bold text-[#0F8A5F] hover:underline cursor-pointer border-none bg-transparent"
              >
                See All →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Chicken Republic', distance: '320m away', security: 'CCTV Guarded', emoji: '🍗' },
                { name: 'Justrite Supermarket', distance: '480m away', security: 'Active Footflow', emoji: '🛒' },
                { name: 'Adolak Center', distance: '700m away', security: 'Open Visibility', emoji: '🏢' },
              ].map((spot) => (
                <div 
                  key={spot.name}
                  onClick={() => {
                    setScheduleMeetupPoint(spot.name);
                    setShowScheduleMeetupModal(true);
                    triggerBeep(450, 0.08);
                  }}
                  className="p-4 rounded-xl border border-neutral-50 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/40 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition cursor-pointer space-y-1.5 text-left"
                >
                  <span className="text-xl block">{spot.emoji}</span>
                  <h4 className="text-xs font-bold text-[#161616] dark:text-white truncate">{spot.name}</h4>
                  <p className="text-[11px] text-neutral-400 font-medium">{spot.distance}</p>
                  <span className="text-[9px] bg-[#0F8A5F]/10 text-[#0F8A5F] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block w-max">
                    {spot.security}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. People Nearby */}
          <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">People Nearby</h3>
              </div>
              <span className="text-xs text-neutral-400 font-semibold">{finalPeopleList.length} Active</span>
            </div>

            <div className="flex items-center space-x-4 overflow-x-auto py-2 scrollbar-none -mx-2 px-2">
              {finalPeopleList.length === 0 ? (
                <div className="text-[12px] text-zinc-500 italic text-center w-full py-4 font-medium">
                  No other users found on the proximity radar.
                </div>
              ) : (
                finalPeopleList.map((nb) => (
                  <motion.div
                    key={nb.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setViewingNeighborProfile(nb);
                      triggerBeep(480, 0.08);
                    }}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer min-w-[80px]"
                  >
                    <div className="relative">
                      <div className="w-[56px] h-[56px] rounded-full border border-neutral-100/80 dark:border-[#2A2D31]/30 shadow-sm flex items-center justify-center overflow-hidden bg-[#F7F8FA] dark:bg-neutral-800">
                        {nb.customProfilePhoto ? (
                          <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-xl">{nb.avatarEmoji || '🙋‍♂️'}</span>
                        )}
                      </div>
                      {nb.onlineStatus === 'active' && (
                        <span className="absolute bottom-0.5 right-0.5 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981] border-2 border-white dark:border-[#1A1C1F]" />
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-bold text-[#161616] dark:text-white mt-1.5 truncate w-[72px] text-center">{nb.name}</span>
                    <span className="text-[11px] text-neutral-400 font-medium">{nb.distanceMeters || 120}m</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* 7. Suggested Friends */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-left">
              <div className="p-2 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#161616] dark:text-white">Suggested Friends</h3>
            </div>

            <div className="space-y-3">
              {finalSuggestions.length === 0 ? (
                <div className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-6 shadow-sm border border-neutral-100/80 dark:border-[#2A2D31]/30 text-center text-xs text-neutral-400">
                  <span className="text-xl block mb-1">👥</span>
                  No suggestions available. All neighbors connected!
                </div>
              ) : (
                finalSuggestions.map((nb) => {
                  const isFriend = friendIds.includes(nb.id);
                  const isSent = sentFriendRequestIds.includes(nb.id);
                  const isReceived = pendingFriendRequests.includes(nb.id);

                  return (
                    <motion.div
                      key={nb.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18 }}
                      className="bg-white dark:bg-[#1A1C1F] rounded-[22px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-neutral-100/80 dark:border-[#2A2D31]/30 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 text-left"
                    >
                      <div 
                        onClick={() => {
                          setViewingNeighborProfile(nb);
                          triggerBeep(480, 0.08);
                        }}
                        className="flex items-start space-x-4 cursor-pointer flex-1"
                      >
                        <div className="w-[50px] h-[50px] rounded-full border border-neutral-150 dark:border-neutral-800 shadow-sm flex items-center justify-center overflow-hidden bg-[#F7F8FA] dark:bg-neutral-800 shrink-0">
                          {nb.customProfilePhoto ? (
                            <img src={nb.customProfilePhoto} alt={nb.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-xl">{nb.avatarEmoji || '🙋‍♂️'}</span>
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-[15px] text-[#161616] dark:text-white truncate">{nb.name}</h4>
                            <span className="text-[11px] text-neutral-400 font-medium">• {nb.distanceMeters}m</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span key={idx} className="text-[11px]">
                                {idx < Math.round(nb.trustScore || 4.5) ? '⭐' : '☆'}
                              </span>
                            ))}
                            <span className="text-[10px] text-neutral-400 font-semibold ml-1">
                              {(nb.trustScore || 4.5).toFixed(1)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(nb.interests || []).slice(0, 2).map((interest) => (
                              <span
                                key={interest}
                                className="text-[9.5px] font-bold bg-[#EEF8F3] dark:bg-[#0F8A5F]/15 text-[#0F8A5F] px-2 py-0.5 rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 sm:pl-4">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            actuallyAddFriend(nb.id);
                          }}
                          className={`w-full sm:w-auto h-[38px] px-5 rounded-[12px] text-[13px] font-bold transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer border-none outline-none ${
                            isFriend
                              ? 'bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93]'
                              : isSent
                              ? 'bg-neutral-100 dark:bg-neutral-800 text-[#8E8E93] hover:bg-neutral-200/60 dark:hover:bg-neutral-700'
                              : isReceived
                              ? 'bg-[#0F8A5F] text-white hover:bg-[#0C7A53] shadow-sm'
                              : 'bg-[#0F8A5F] text-white hover:bg-[#0C7A53] shadow-sm'
                          }`}
                        >
                          {isFriend ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Connected</span>
                            </>
                          ) : isSent ? (
                            <span>Requested</span>
                          ) : isReceived ? (
                            <span>Accept</span>
                          ) : (
                            <span>Connect</span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
});
