import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Sparkles } from 'lucide-react';
import { StorySnap, Neighbor } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface StoryViewerProps {
  stories: StorySnap[];
  authorName: string;
  authorEmoji?: string;
  onClose: () => void;
  onSendReply?: (text: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  authorName,
  authorEmoji = '🙋‍♂️',
  onClose,
  onSendReply
}) => {
  const { triggerBeep } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentStory = stories[currentIndex];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, stories.length, onClose]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    triggerBeep(520, 0.05);
    onSendReply?.(replyText.trim());
    setReplyText('');
    onClose();
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none max-w-md mx-auto">
      {/* Top Progress Bars & Author */}
      <div className="p-4 space-y-3 z-20 bg-gradient-to-b from-black/80 to-transparent">
        {/* Progress Segments */}
        <div className="flex space-x-1">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-100 ${
                  idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-pulse' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center text-[16px]">
              {authorEmoji}
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-white leading-tight">{authorName}</h3>
              <span className="text-[11px] text-white/70">{currentStory.timestamp}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Story Content with left/right touch zones */}
      <div
        className="flex-1 relative flex items-center justify-center p-4"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <button
          onClick={handlePrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 opacity-0 cursor-pointer"
        />
        <button
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 opacity-0 cursor-pointer"
        />

        {currentStory.mediaUrl ? (
          <img
            referrerPolicy="no-referrer"
            src={currentStory.mediaUrl}
            alt="Story content"
            className="max-h-full max-w-full rounded-2xl object-cover shadow-2xl"
          />
        ) : (
          <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center p-6 text-center text-white text-[20px] font-semibold">
            {currentStory.caption || 'Neighborhood Update! ✨'}
          </div>
        )}

        {currentStory.caption && (
          <div className="absolute bottom-6 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center text-[14px] text-white">
            {currentStory.caption}
          </div>
        )}
      </div>

      {/* Bottom Reply Bar */}
      <div className="p-4 z-20 bg-gradient-to-t from-black/90 to-transparent">
        <form onSubmit={handleReply} className="flex items-center space-x-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${authorName}...`}
            className="flex-1 h-11 px-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/60 text-[13px] focus:outline-none focus:border-emerald-400 backdrop-blur-sm"
          />
          <button
            type="submit"
            className="w-11 h-11 rounded-full bg-[#0F8A5F] text-white flex items-center justify-center cursor-pointer shadow-md transition active:scale-95"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
