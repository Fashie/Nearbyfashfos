import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Send } from 'lucide-react';
import { FeedPost } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface FeedItemProps {
  post: FeedPost;
  onToggleLike: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  post,
  onToggleLike,
  onAddComment
}) => {
  const { triggerBeep } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    triggerBeep(520, 0.05);
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Author Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-800 flex items-center justify-center text-[20px] font-bold">
            {post.authorAvatar || '👤'}
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-white leading-tight">{post.authorName}</h3>
            <div className="flex items-center space-x-1 text-[11px] text-neutral-400 mt-0.5">
              {post.locationTag && (
                <>
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{post.locationTag}</span>
                  <span>•</span>
                </>
              )}
              <span>{post.timestamp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Image */}
      {post.mediaUrl && (
        <div className="relative max-h-96 w-full overflow-hidden bg-black/40">
          <img
            referrerPolicy="no-referrer"
            src={post.mediaUrl}
            alt="Feed attachment"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Caption */}
      <div className="p-4 space-y-3">
        <p className="text-[14px] text-neutral-200 leading-relaxed break-words">{post.caption}</p>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                triggerBeep(520, 0.05);
                onToggleLike(post.id);
              }}
              className={`flex items-center space-x-1.5 text-[13px] font-medium transition cursor-pointer ${
                post.likedByMe ? 'text-rose-500 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.likedByMe ? 'fill-rose-500' : ''}`} />
              <span>{post.likes}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1.5 text-[13px] font-medium text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments?.length || 0}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-3 space-y-3 border-t border-neutral-800">
            {post.comments?.map((c) => (
              <div key={c.id} className="text-[13px] bg-neutral-950/50 p-2.5 rounded-xl space-y-1">
                <span className="font-semibold text-emerald-400 block text-[12px]">{c.authorName}</span>
                <p className="text-neutral-300">{c.text}</p>
              </div>
            ))}

            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 h-9 px-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-[13px] focus:outline-none focus:border-[#0F8A5F]"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-[#0F8A5F] text-white flex items-center justify-center cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
