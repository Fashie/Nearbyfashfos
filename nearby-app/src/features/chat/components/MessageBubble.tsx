import React, { useState } from 'react';
import { Check, CheckCheck, Clock, Play, Pause, MoreVertical, Reply, CornerDownRight } from 'lucide-react';
import { DirectMessage } from '../../../types';
import { safeFormatTime } from '../../../utils/helpers';

interface MessageBubbleProps {
  message: DirectMessage;
  isMe: boolean;
  onReply?: (msg: DirectMessage) => void;
  onReact?: (msgId: string, emoji: string) => void;
  onDelete?: (msgId: string) => void;
  onForward?: (msg: DirectMessage) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  onReply,
  onReact,
  onDelete,
  onForward
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const isDeleted = message.deletedForEveryone;

  return (
    <div
      className={`flex flex-col my-1 relative group select-text ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`max-w-[78%] sm:max-w-[70%] rounded-2xl p-3 relative shadow-sm transition-all ${
          isMe
            ? 'bg-[#0F8A5F] text-white rounded-tr-xs'
            : 'bg-[#1F2227] text-white rounded-tl-xs border border-neutral-800'
        }`}
      >
        {/* Forwarded Header */}
        {message.isForwarded && (
          <div className="flex items-center space-x-1 text-[11px] text-white/70 italic mb-1">
            <CornerDownRight className="w-3 h-3" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-emerald-300 text-[12px] opacity-90">
            <span className="font-semibold block text-[11px] text-emerald-200">
              {message.replyTo.senderName || 'Replied Message'}
            </span>
            <p className="truncate text-white/80">{message.replyTo.text}</p>
          </div>
        )}

        {/* Content Type Handling */}
        {isDeleted ? (
          <p className="text-[13px] italic opacity-60">🚫 This message was deleted</p>
        ) : message.type === 'image' ? (
          <div className="space-y-1.5">
            <img
              referrerPolicy="no-referrer"
              src={message.mediaUrl}
              alt="Shared media"
              className="rounded-xl max-h-60 w-full object-cover shadow-inner"
            />
            {message.text && <p className="text-[14px] leading-relaxed pt-1">{message.text}</p>}
          </div>
        ) : message.type === 'voice' ? (
          <div className="flex items-center space-x-3 py-1 min-w-[180px]">
            <button
              onClick={toggleAudio}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    isPlayingAudio ? 'w-full' : 'w-1/3'
                  }`}
                />
              </div>
              <span className="text-[10px] opacity-75">
                0:{message.audioDurationSec ? (message.audioDurationSec < 10 ? `0${message.audioDurationSec}` : message.audioDurationSec) : '08'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
        )}

        {/* Footer: Time & Checks */}
        <div className="flex items-center justify-end space-x-1.5 mt-1 text-[10px] opacity-75 select-none">
          <span>{safeFormatTime(message.timestamp)}</span>
          {isMe && (
            <span>
              {message.status === 'sending' && <Clock className="w-3 h-3 text-white/50" />}
              {message.status === 'sent' && <Check className="w-3.5 h-3.5 text-white/70" />}
              {message.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-white/70" />}
              {message.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-emerald-200 font-bold" />}
            </span>
          )}
        </div>

        {/* Reactions floating pill */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2 right-2 bg-neutral-900 border border-neutral-700 rounded-full px-2 py-0.5 flex items-center space-x-1 text-[12px] shadow-md">
            {message.reactions.map((r, i) => (
              <span key={i}>{r.reaction}</span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Trigger (Reply, React, Forward) on hover/touch */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 mt-0.5 px-1 text-neutral-400">
        <button
          onClick={() => onReply?.(message)}
          className="p-1 hover:text-white rounded-md text-[11px] flex items-center space-x-0.5 cursor-pointer"
        >
          <Reply className="w-3 h-3" />
          <span>Reply</span>
        </button>
        <button
          onClick={() => onReact?.(message.id, '❤️')}
          className="p-1 hover:scale-125 transition text-[12px] cursor-pointer"
        >
          ❤️
        </button>
        <button
          onClick={() => onReact?.(message.id, '👍')}
          className="p-1 hover:scale-125 transition text-[12px] cursor-pointer"
        >
          👍
        </button>
        {onForward && (
          <button
            onClick={() => onForward(message)}
            className="p-1 hover:text-white rounded-md text-[11px] cursor-pointer"
          >
            Forward
          </button>
        )}
      </div>
    </div>
  );
};
