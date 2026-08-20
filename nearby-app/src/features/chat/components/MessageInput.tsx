import React, { useState, useRef } from 'react';
import { Send, Smile, Paperclip, Mic, X, Square } from 'lucide-react';
import { DirectMessage } from '../../../types';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSendMessage: (text: string, type?: DirectMessage['type'], mediaUrl?: string) => void;
  replyMessage: DirectMessage | null;
  onCancelReply: () => void;
  onTyping?: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyMessage,
  onCancelReply,
  onTyping
}) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    setShowEmoji(false);
    onTyping?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping?.(e.target.value.length > 0);
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordSeconds(0);
    recordIntervalRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    onSendMessage('Voice Note', 'voice', undefined);
    setRecordSeconds(0);
  };

  const handleCancelRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage('', 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative border-t border-neutral-800 bg-[#111315]/95 backdrop-blur-md p-3">
      {/* Hidden file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Reply Quote Banner */}
      {replyMessage && (
        <div className="mb-2 p-2.5 rounded-xl bg-neutral-800 border-l-4 border-[#0F8A5F] flex items-center justify-between">
          <div className="text-[12px] truncate pr-2">
            <span className="font-semibold text-emerald-400 block">Replying to message</span>
            <span className="text-neutral-300 truncate block">{replyMessage.text || 'Media attachment'}</span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-neutral-400 hover:text-white rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmoji && (
        <div className="absolute bottom-16 left-3 right-3 z-30">
          <EmojiPicker onSelectEmoji={handleSelectEmoji} onClose={() => setShowEmoji(false)} />
        </div>
      )}

      {/* Main Input Row */}
      {isRecording ? (
        <div className="flex items-center justify-between h-12 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[14px] font-semibold text-rose-400">
              Recording 0:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancelRecording}
              className="text-[13px] text-neutral-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStopRecording}
              className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center cursor-pointer shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2.5 rounded-xl transition cursor-pointer ${
              showEmoji ? 'bg-[#0F8A5F] text-white' : 'text-neutral-400 hover:text-white bg-neutral-800/60'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-neutral-400 hover:text-white bg-neutral-800/60 rounded-xl transition cursor-pointer"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            id="chat-message-input"
            type="text"
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-11 px-4 bg-neutral-800/80 border border-neutral-700/60 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F] transition"
          />

          {/* Send or Mic */}
          {text.trim() ? (
            <button
              id="chat-send-btn"
              onClick={handleSend}
              className="w-11 h-11 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              id="chat-mic-btn"
              onClick={handleStartRecording}
              className="w-11 h-11 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
