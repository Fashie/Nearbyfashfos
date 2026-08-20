import React, { useState } from 'react';
import { Search, Pin, MessageSquarePlus, Filter, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { Neighbor } from '../../../types';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../../auth/hooks/useAuth';
import { useApp } from '../../../context/AppContext';
import { usePresence } from '../../../hooks/usePresence';

interface ChatListProps {
  onSelectNeighbor: (neighbor: Neighbor) => void;
  onOpenNewChatDrawer?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onSelectNeighbor,
  onOpenNewChatDrawer
}) => {
  const { neighbors, messages, friendIds } = useChat();
  const { currentUser } = useAuth();
  const { triggerBeep } = useApp();
  const { presenceMap } = usePresence(currentUser?.uid);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'friends'>('all');

  const filteredNeighbors = neighbors.filter((nb) => {
    const matchesSearch =
      nb.name.toLowerCase().includes(search.toLowerCase()) ||
      nb.streetName.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'friends') {
      return friendIds.includes(nb.id);
    }
    if (filter === 'unread') {
      const msgs = messages[nb.id] || [];
      return msgs.some((m) => m.isUnread && m.senderId !== (currentUser?.uid || 'me'));
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0B0C0E] text-white font-sans overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-4 space-y-3 bg-[#111315]/95 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-tight">Messages</h1>
          <button
            onClick={onOpenNewChatDrawer}
            className="p-2 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white transition cursor-pointer shadow-md"
            title="New Chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="chat-list-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[13px] focus:outline-none focus:border-[#0F8A5F] transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-2 pt-1">
          <button
            onClick={() => {
              triggerBeep(440, 0.05);
              setFilter('all');
            }}
            className={`px-3 py-1 rounded-lg text-[12px] font-medium transition cursor-pointer ${
              filter === 'all' ? 'bg-[#0F8A5F] text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              triggerBeep(440, 0.05);
              setFilter('unread');
            }}
            className={`px-3 py-1 rounded-lg text-[12px] font-medium transition cursor-pointer ${
              filter === 'unread' ? 'bg-[#0F8A5F] text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => {
              triggerBeep(440, 0.05);
              setFilter('friends');
            }}
            className={`px-3 py-1 rounded-lg text-[12px] font-medium transition cursor-pointer ${
              filter === 'friends' ? 'bg-[#0F8A5F] text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Friends
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-900/60 pb-20">
        {filteredNeighbors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500 space-y-2 mt-8">
            <Sparkles className="w-8 h-8 text-neutral-600" />
            <p className="text-[14px]">No conversations found</p>
          </div>
        ) : (
          filteredNeighbors.map((nb) => {
            const thread = messages[nb.id] || [];
            const lastMsg = thread[thread.length - 1];
            const unreadCount = thread.filter(
              (m) => m.isUnread && m.senderId !== (currentUser?.uid || 'me')
            ).length;
            const presence = presenceMap[nb.id];

            return (
              <button
                key={nb.id}
                id={`chat-item-${nb.id}`}
                onClick={() => {
                  triggerBeep(480, 0.05);
                  onSelectNeighbor(nb);
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-900/80 transition cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[18px] font-bold shadow-sm ${nb.avatarColor}`}
                    >
                      {nb.avatarEmoji || nb.name.charAt(0)}
                    </div>
                    {presence?.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0C0E]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-[14px] font-semibold text-white truncate">{nb.name}</h3>
                      {nb.verificationLevel === 'Verified' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] text-neutral-400 truncate mt-0.5">
                      {presence?.typing === currentUser?.uid ? (
                        <span className="text-emerald-400 font-medium">typing...</span>
                      ) : lastMsg ? (
                        lastMsg.text || (lastMsg.type === 'image' ? '📷 Photo' : '🎵 Audio note')
                      ) : (
                        nb.streetName
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2 space-y-1">
                  <span className="text-[11px] text-neutral-500">
                    {lastMsg ? lastMsg.timestamp : `${nb.distanceMeters}m`}
                  </span>
                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-[#FF7A59] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
