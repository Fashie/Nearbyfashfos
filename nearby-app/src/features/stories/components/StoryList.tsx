import React from 'react';
import { Plus, Flame } from 'lucide-react';
import { Neighbor, StorySnap } from '../../../types';
import { useAuth } from '../../auth/hooks/useAuth';
import { useApp } from '../../../context/AppContext';

interface StoryListProps {
  myStories: StorySnap[];
  neighborsWithStories: Neighbor[];
  onOpenStory: (neighbor: Neighbor | 'me') => void;
  onOpenComposer: () => void;
}

export const StoryList: React.FC<StoryListProps> = ({
  myStories,
  neighborsWithStories,
  onOpenStory,
  onOpenComposer
}) => {
  const { userProfile } = useAuth();
  const { triggerBeep } = useApp();

  const hasMyStory = myStories.length > 0;

  return (
    <div className="flex items-center space-x-3.5 px-4 py-3 overflow-x-auto select-none no-scrollbar">
      {/* "Your Story" Item */}
      <div className="flex flex-col items-center shrink-0">
        <button
          id="stories-add-btn"
          type="button"
          onClick={() => {
            triggerBeep(480, 0.05);
            if (hasMyStory) {
              onOpenStory('me');
            } else {
              onOpenComposer();
            }
          }}
          className="relative cursor-pointer group"
        >
          <div
            className={`w-14 h-14 rounded-full p-[2px] ${
              hasMyStory
                ? 'bg-gradient-to-tr from-[#0F8A5F] via-emerald-400 to-[#FF7A59]'
                : 'border-2 border-dashed border-neutral-700'
            }`}
          >
            <div className="w-full h-full bg-[#1A1C1F] rounded-full flex items-center justify-center text-[20px] font-bold">
              {userProfile?.avatarEmoji || '🙋‍♂️'}
            </div>
          </div>

          {!hasMyStory && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#0F8A5F] text-white rounded-full flex items-center justify-center border-2 border-[#111315]">
              <Plus className="w-3 h-3" />
            </div>
          )}
        </button>
        <span className="text-[11px] text-neutral-300 mt-1 truncate max-w-[64px]">Your Story</span>
      </div>

      {/* Friends Stories */}
      {neighborsWithStories.map((nb) => (
        <div key={nb.id} className="flex flex-col items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerBeep(480, 0.05);
              onOpenStory(nb);
            }}
            className="relative cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#0F8A5F] via-emerald-400 to-[#FF7A59]">
              <div className={`w-full h-full rounded-full flex items-center justify-center text-[20px] font-bold ${nb.avatarColor}`}>
                {nb.avatarEmoji || nb.name.charAt(0)}
              </div>
            </div>
          </button>
          <span className="text-[11px] text-neutral-300 mt-1 truncate max-w-[64px]">
            {nb.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
};
