import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Shield, Calendar, User } from 'lucide-react';
import { Neighbor, DirectMessage } from '../../../types';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../../auth/hooks/useAuth';
import { useApp } from '../../../context/AppContext';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ForwardModal } from './ForwardModal';
import { usePresence } from '../../../hooks/usePresence';

interface ChatRoomProps {
  neighbor: Neighbor;
  onBack: () => void;
  onViewProfile?: (nb: Neighbor) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  neighbor,
  onBack,
  onViewProfile
}) => {
  const { currentMessages, sendMessage, deleteMessage, reactToMessage, forwardMessages, startCall, neighbors } = useChat();
  const { currentUser } = useAuth();
  const { setShowScheduleMeetupModal, setScheduleMeetupTargetNeighbor, triggerBeep } = useApp();
  const { presenceMap, setTypingTo } = usePresence(currentUser?.uid);

  const [replyMessage, setReplyMessage] = useState<DirectMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<DirectMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const neighborPresence = presenceMap[neighbor.id];
  const isTyping = neighborPresence?.typing === currentUser?.uid;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = (text: string, type: DirectMessage['type'] = 'text', mediaUrl?: string) => {
    triggerBeep(520, 0.05);
    sendMessage(text, type, mediaUrl, {
      replyTo: replyMessage
        ? {
            msgId: replyMessage.id,
            text: replyMessage.text,
            senderName: replyMessage.senderId === currentUser?.uid ? 'You' : neighbor.name,
            type: replyMessage.type
          }
        : undefined
    });
    setReplyMessage(null);
  };

  const handleScheduleMeetup = () => {
    triggerBeep(480, 0.08);
    setScheduleMeetupTargetNeighbor(neighbor);
    setShowScheduleMeetupModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0C0E] text-white font-sans relative overflow-hidden">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#111315]/95 border-b border-neutral-800 z-20">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onBack}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => onViewProfile?.(neighbor)}
            className="flex items-center space-x-2.5 text-left cursor-pointer group"
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold ${neighbor.avatarColor}`}>
                {neighbor.avatarEmoji || neighbor.name.charAt(0)}
              </div>
              {neighborPresence?.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111315]" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-1">
                <h2 className="text-[14px] font-bold tracking-tight group-hover:text-emerald-400 transition">
                  {neighbor.name}
                </h2>
                {neighbor.verificationLevel === 'Verified' && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0F8A5F] text-[9px] flex items-center justify-center text-white">✓</span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {isTyping ? (
                  <span className="text-emerald-400 font-medium animate-pulse">typing...</span>
                ) : neighborPresence?.online ? (
                  'Active now'
                ) : (
                  neighbor.streetName
                )}
              </p>
            </div>
          </button>
        </div>

        {/* Call & Meetup Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleScheduleMeetup}
            title="Schedule Safe Meetup"
            className="p-2 rounded-xl text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              triggerBeep(520, 0.08);
              startCall(neighbor.id, 'audio');
            }}
            title="Voice Call"
            className="p-2 rounded-xl text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 transition cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              triggerBeep(520, 0.08);
              startCall(neighbor.id, 'video');
            }}
            title="Video Call"
            className="p-2 rounded-xl text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safe Meetup Prompt Banner */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-400">
        <div className="flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Trust Rating: {neighbor.trustScore || '5.0'} ★ • Verified Public Meetups</span>
        </div>
        <button
          onClick={handleScheduleMeetup}
          className="font-bold underline text-white hover:text-emerald-300 cursor-pointer"
        >
          Propose Meetup
        </button>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[24px] mb-3 ${neighbor.avatarColor}`}>
              {neighbor.avatarEmoji || neighbor.name.charAt(0)}
            </div>
            <h3 className="text-white font-semibold text-[15px]">{neighbor.name}</h3>
            <p className="text-[13px] max-w-xs mt-1 text-neutral-400">{neighbor.bio}</p>
            <span className="text-[12px] mt-4 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
              Say hello to start the neighborhood chat 👋
            </span>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.senderId === (currentUser?.uid || 'me')}
              onReply={(m) => setReplyMessage(m)}
              onReact={(id, emoji) => reactToMessage(id, emoji)}
              onDelete={(id) => deleteMessage(id, true)}
              onForward={(m) => setForwardingMessage(m)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input with voice, attachments, emojis */}
      <MessageInput
        onSendMessage={handleSendMessage}
        replyMessage={replyMessage}
        onCancelReply={() => setReplyMessage(null)}
        onTyping={(typing) => setTypingTo(typing ? neighbor.id : null)}
      />

      {/* Forward Modal */}
      {forwardingMessage && (
        <ForwardModal
          neighbors={neighbors.filter((n) => n.id !== neighbor.id)}
          onForward={(targetIds) => forwardMessages(targetIds, [forwardingMessage.id])}
          onClose={() => setForwardingMessage(null)}
        />
      )}
    </div>
  );
};
