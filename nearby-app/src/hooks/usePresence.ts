import { useState, useEffect, useRef } from 'react';
import { db, doc, setDoc, onSnapshot, collection } from '../services/firebase/firestore';

interface PresenceData {
  online: boolean;
  lastSeen: string;
  typing?: string | null;
}

export function usePresence(userId?: string | null) {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceData>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    const userPresenceRef = doc(db, 'presence', userId);
    
    // Set active presence
    const setOnline = async () => {
      try {
        await setDoc(userPresenceRef, {
          online: true,
          lastSeen: new Date().toISOString(),
          typing: null
        }, { merge: true });
      } catch (_) {}
    };

    const setOffline = async () => {
      try {
        await setDoc(userPresenceRef, {
          online: false,
          lastSeen: new Date().toISOString(),
          typing: null
        }, { merge: true });
      } catch (_) {}
    };

    setOnline();

    const handleBeforeUnload = () => {
      setOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Listen to all presence
    const presenceCol = collection(db, 'presence');
    const unsubscribe = onSnapshot(presenceCol, (snapshot) => {
      const map: Record<string, PresenceData> = {};
      snapshot.forEach((d) => {
        map[d.id] = d.data() as PresenceData;
      });
      setPresenceMap(map);
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
      unsubscribe();
    };
  }, [userId]);

  const setTypingTo = (targetId: string | null) => {
    if (!userId) return;
    const userPresenceRef = doc(db, 'presence', userId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setDoc(userPresenceRef, { typing: targetId }, { merge: true }).catch(() => {});

    if (targetId) {
      typingTimeoutRef.current = setTimeout(() => {
        setDoc(userPresenceRef, { typing: null }, { merge: true }).catch(() => {});
      }, 3000);
    }
  };

  return {
    presenceMap,
    setTypingTo
  };
}
