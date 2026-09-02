import { db } from '../../../services/firebase';
import { collection, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';

export const notificationService = {
  subscribeToNotifications: (userId: string, callback: (notifications: any[]) => void) => {
    const q = query(
      collection(db, 'notifications'),
      // Notifications are written with a `userId` field (see createNotification in
      // src/firebase.ts) - querying the non-existent `receiverUID` matched nothing,
      // so this subscription always reported zero notifications.
      where('userId', '==', userId)
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
      isUnread: true,
      ...notification,
      id: notifId,
      // `createdAt` is the field the notifications UI sorts/groups on; only writing
      // `timestamp` left every notification with an empty date.
      createdAt: (notification && notification.createdAt) || new Date().toISOString(),
      timestamp: new Date().toISOString()
    }, { merge: true });
  }
};
