import { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, updateDoc, doc } from '../services/firebase/firestore';
import { AppNotification } from '../types';
import { triggerAudioBeep } from '../utils/helpers';

export function useNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<{ message: string; icon?: string } | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const notifRef = collection(db, 'notifications');
      const q = query(
        notifRef,
        where('recipientId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: AppNotification[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as any) });
          });
          setNotifications(list);
          const unread = list.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        },
        (err) => {
          console.warn("Notifications listener note:", err);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not set up notifications listener:", e);
    }
  }, [userId]);

  const showToast = (message: string, icon?: string) => {
    setActiveToast({ message, icon });
    triggerAudioBeep(520, 0.08);
    setTimeout(() => setActiveToast(null), 3500);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const notif of unread) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
      } catch (_) {}
    }
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    activeToast,
    showToast,
    markAllAsRead
  };
}
