import React, { useState } from 'react';
import { EMOJI_CATEGORIES } from '../../../utils/constants';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);

  return (
    <div className="bg-[#181A1D] border border-neutral-800 rounded-2xl p-3 shadow-xl w-full max-h-64 flex flex-col">
      {/* Category Tabs */}
      <div className="flex space-x-1 border-b border-neutral-800 pb-2 mb-2 overflow-x-auto">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setSelectedCategory(idx)}
            className={`text-[12px] px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
              selectedCategory === idx
                ? 'bg-[#0F8A5F] text-white font-medium'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 overflow-y-auto p-1 max-h-44">
        {EMOJI_CATEGORIES[selectedCategory].emojis.map((e) => (
          <button
            key={e.char}
            type="button"
            onClick={() => onSelectEmoji(e.char)}
            className="w-9 h-9 flex items-center justify-center text-[20px] hover:bg-white/10 rounded-xl transition cursor-pointer select-none active:scale-90"
            title={e.tags}
          >
            {e.char}
          </button>
        ))}
      </div>
    </div>
  );
};
