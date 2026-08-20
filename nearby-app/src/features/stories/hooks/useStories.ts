import { useState, useEffect } from 'react';
import { StorySnap, Neighbor } from '../../../types';
import { useAuth } from '../../auth/hooks/useAuth';

export function useStories(neighbors: Neighbor[]) {
  const { currentUser, userProfile } = useAuth();
  const [myStories, setMyStories] = useState<StorySnap[]>(() => {
    try {
      const saved = localStorage.getItem('nearby_my_stories');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const addStory = (snap: Omit<StorySnap, 'id' | 'timestamp' | 'viewed'>) => {
    const newSnap: StorySnap = {
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      viewed: false,
      createdAt: Date.now(),
      ...snap
    };

    const updated = [newSnap, ...myStories];
    setMyStories(updated);
    try {
      localStorage.setItem('nearby_my_stories', JSON.stringify(updated));
    } catch (_) {}
  };

  const activeFriendsStories = neighbors.filter((nb) => nb.activeStory && nb.activeStory.length > 0);

  return {
    myStories,
    addStory,
    activeFriendsStories
  };
}
