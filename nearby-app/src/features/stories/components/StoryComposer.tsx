import React, { useState, useRef } from 'react';
import { Camera, Image, X, Send, Sparkles } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface StoryComposerProps {
  onPostStory: (mediaUrl: string, caption?: string) => void;
  onClose: () => void;
}

export const StoryComposer: React.FC<StoryComposerProps> = ({
  onPostStory,
  onClose
}) => {
  const { triggerBeep } = useApp();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!mediaUrl && !caption.trim()) return;
    triggerBeep(520, 0.1);
    onPostStory(mediaUrl || '', caption.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Hidden file selector */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-white">Create Story</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Media Canvas / Preview */}
      <div className="my-auto flex flex-col items-center justify-center">
        {mediaUrl ? (
          <div className="relative rounded-3xl overflow-hidden max-h-80 w-full border border-neutral-700 shadow-2xl">
            <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setMediaUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-full py-12 rounded-3xl bg-neutral-900 border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-[#0F8A5F]">
              <Camera className="w-8 h-8" />
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[13px] cursor-pointer shadow-md transition"
              >
                Choose Photo from Gallery
              </button>
            </div>
          </div>
        )}

        {/* Caption Input */}
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption to your story..."
          className="w-full mt-4 h-12 px-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F]"
        />
      </div>

      {/* Footer Share Button */}
      <button
        onClick={handlePost}
        disabled={!mediaUrl && !caption.trim()}
        className="w-full h-12 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[15px] flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-40 shadow-lg"
      >
        <span>Share to Story (24h)</span>
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
