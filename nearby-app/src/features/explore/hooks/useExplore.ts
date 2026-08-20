import { useState } from 'react';
import { FeedPost } from '../../../types';
import { INITIAL_POSTS } from '../../../utils/constants';
import { useAuth } from '../../auth/hooks/useAuth';

export function useExplore() {
  const { currentUser, userProfile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);

  const createPost = (caption: string, mediaUrl?: string, locationTag?: string) => {
    const newPost: FeedPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: currentUser?.uid || 'me',
      authorName: userProfile?.name || 'Nearby Member',
      authorAvatar: userProfile?.avatarEmoji || '🙋‍♂️',
      timestamp: 'Just now',
      caption,
      mediaUrl,
      locationTag: locationTag || 'Neighborhood Plaza',
      likes: 0,
      likedByMe: false,
      comments: []
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const toggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = !p.likedByMe;
          return {
            ...p,
            likedByMe: liked,
            likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1)
          };
        }
        return p;
      })
    );
  };

  const addComment = (postId: string, text: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `comment_${Date.now()}`,
                authorName: userProfile?.name || 'You',
                text,
                timestamp: 'Just now'
              }
            ]
          };
        }
        return p;
      })
    );
  };

  return {
    posts,
    createPost,
    toggleLike,
    addComment
  };
}
