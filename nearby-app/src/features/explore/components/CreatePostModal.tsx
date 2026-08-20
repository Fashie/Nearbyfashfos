import React, { useState, useRef } from 'react';
import { Camera, X, Send, MapPin } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface CreatePostModalProps {
  onPost: (caption: string, mediaUrl?: string, locationTag?: string) => void;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onPost, onClose }) => {
  const { currentAddress, triggerBeep } = useApp();
  const [caption, setCaption] = useState('');
  const [locationTag, setLocationTag] = useState(currentAddress ? currentAddress.split(',')[0] : 'Neighborhood Hub');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

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

  const handlePublish = () => {
    if (!caption.trim() && !mediaUrl) return;
    triggerBeep(520, 0.1);
    onPost(caption.trim(), mediaUrl || undefined, locationTag);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-between p-6 max-w-md mx-auto">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <h2 className="text-[18px] font-bold text-white">Create Neighborhood Post</h2>
        <button onClick={onClose} className="p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="my-auto space-y-4 py-4">
        <textarea
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's happening in the neighborhood?"
          className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 text-[14px] focus:outline-none focus:border-[#0F8A5F] resize-none"
        />

        {/* Location Tag */}
        <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 h-11">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={locationTag}
            onChange={(e) => setLocationTag(e.target.value)}
            placeholder="Add location..."
            className="w-full bg-transparent text-white text-[13px] focus:outline-none"
          />
        </div>

        {/* Image Preview / Picker */}
        {mediaUrl ? (
          <div className="relative rounded-2xl overflow-hidden max-h-60 border border-neutral-700">
            <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setMediaUrl(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-neutral-700 flex flex-col items-center justify-center space-y-1 text-neutral-400 hover:text-white cursor-pointer transition"
          >
            <Camera className="w-6 h-6 text-[#0F8A5F]" />
            <span className="text-[13px]">Attach Photo</span>
          </button>
        )}
      </div>

      {/* Post Button */}
      <button
        onClick={handlePublish}
        disabled={!caption.trim() && !mediaUrl}
        className="w-full h-12 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white font-semibold text-[15px] flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-40 shadow-lg"
      >
        <span>Share Post</span>
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
