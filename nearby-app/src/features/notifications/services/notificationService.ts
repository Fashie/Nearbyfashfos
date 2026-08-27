import { db, auth, handleFirestoreError, OperationType } from '../../../firebase';
import { collection, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';

export const notificationService = {
  subscribeToNotifications: (userId: string, callback: (notifications: any[]) => void, onError?: (error: Error) => void) => {
    if (!auth.currentUser || auth.currentUser.uid !== userId) return () => undefined;
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
      onError?.(error);
    });
  },

  sendNotification: async (notification: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to send a notification.');
    const notifId = notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        ...notification,
        id: notifId,
        senderId: notification.senderId || user.uid,
        timestamp: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${notifId}`);
      throw err;
    }
  },
};
