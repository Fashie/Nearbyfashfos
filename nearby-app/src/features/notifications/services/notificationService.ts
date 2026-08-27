import { db } from '../../../services/firebase';
import { collection, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';

export const notificationService = {
  subscribeToNotifications: (userId: string, callback: (notifications: any[]) => void) => {
    const q = query(
      collection(db, 'notifications'),
      where('receiverUID', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: any[] = [];
      snapshot.forEach((docSnap) => {
        notifications.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(notifications);
    });
  },

  sendNotification: async (notification: any) => {
    const notifId = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notifRef = doc(db, 'notifications', notifId);
    await setDoc(notifRef, {
      ...notification,
      id: notifId,
      timestamp: new Date().toISOString()
    }, { merge: true });
  }
};
