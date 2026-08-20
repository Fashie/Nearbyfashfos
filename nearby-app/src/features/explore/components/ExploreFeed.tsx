import React, { useState } from 'react';
import { Plus, Sparkles, Image as ImageIcon, MapPin } from 'lucide-react';
import { Neighbor } from '../../../types';
import { useExplore } from '../hooks/useExplore';
import { useStories } from '../../stories/hooks/useStories';
import { StoryList } from '../../stories/components/StoryList';
import { StoryViewer } from '../../stories/components/StoryViewer';
import { StoryComposer } from '../../stories/components/StoryComposer';
import { FeedItem } from './FeedItem';
import { CreatePostModal } from './CreatePostModal';
import { useApp } from '../../../context/AppContext';

interface ExploreFeedProps {
  neighbors: Neighbor[];
  onSelectNeighbor: (neighbor: Neighbor) => void;
}

export const ExploreFeed: React.FC<ExploreFeedProps> = ({ neighbors, onSelectNeighbor }) => {
  const { posts, createPost, toggleLike, addComment } = useExplore();
  const { myStories, addStory, activeFriendsStories } = useStories(neighbors);
  const { triggerBeep } = useApp();

  const [activeStoryNeighbor, setActiveStoryNeighbor] = useState<Neighbor | 'me' | null>(null);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#0B0C0E] text-white font-sans overflow-y-auto pb-24">
      {/* 24-Hour Stories Carousel */}
      <div className="border-b border-neutral-900 bg-[#111315]/60 backdrop-blur-md">
        <StoryList
          myStories={myStories}
          neighborsWithStories={activeFriendsStories}
          onOpenStory={(target) => setActiveStoryNeighbor(target)}
          onOpenComposer={() => setShowStoryComposer(true)}
        />
      </div>

      {/* Share Update Bar */}
      <div className="p-4">
        <button
          onClick={() => {
            triggerBeep(480, 0.05);
            setShowCreatePost(true);
          }}
          className="w-full p-3.5 bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between transition cursor-pointer text-left shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F8A5F]/20 flex items-center justify-center text-[#0F8A5F]">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[13px] text-neutral-400 font-medium">
              Share an update with your neighbors...
            </span>
          </div>
          <ImageIcon className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      {/* Social Posts Feed */}
      <div className="px-4 space-y-4">
        {posts.map((post) => (
          <FeedItem
            key={post.id}
            post={post}
            onToggleLike={toggleLike}
            onAddComment={addComment}
          />
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStoryNeighbor && (
        <StoryViewer
          stories={
            activeStoryNeighbor === 'me'
              ? myStories
              : activeStoryNeighbor.activeStory || []
          }
          authorName={activeStoryNeighbor === 'me' ? 'You' : activeStoryNeighbor.name}
          authorEmoji={activeStoryNeighbor === 'me' ? '🙋‍♂️' : activeStoryNeighbor.avatarEmoji}
          onClose={() => setActiveStoryNeighbor(null)}
          onSendReply={(reply) => {
            if (activeStoryNeighbor !== 'me') {
              onSelectNeighbor(activeStoryNeighbor);
            }
          }}
        />
      )}

      {/* Story Composer Modal */}
      {showStoryComposer && (
        <StoryComposer
          onPostStory={(mediaUrl, caption) => addStory({ mediaUrl, caption })}
          onClose={() => setShowStoryComposer(false)}
        />
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          onPost={createPost}
          onClose={() => setShowCreatePost(false)}
        />
      )}
    </div>
  );
};
