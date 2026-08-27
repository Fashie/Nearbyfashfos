import { db, auth, setDoc, handleFirestoreError, OperationType } from '../../../firebase';
import { DirectMessage } from '../../../types';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

export const chatService = {
  getMessagesCollectionRef: () => collection(db, 'direct_messages'),

  saveOrUpdateMessage: async (msg: DirectMessage, threadId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to send a message.');
    if (threadId.startsWith('nb-')) return msg;

    const docId = msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const participants = [user.uid, threadId].sort();
    const payload = {
      ...msg,
      id: docId,
      chatThreadId: participants.join('_'),
      participants,
      senderId: msg.senderId === 'user' ? user.uid : msg.senderId,
      receiverId: msg.receiverId === 'user' ? threadId : (msg.receiverId || threadId),
      serverTime: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'direct_messages', docId), payload, { merge: true });
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `direct_messages/${docId}`);
      throw err;
    }
  },

  subscribeToMessages: (callback: (messages: DirectMessage[]) => void, onError?: (error: Error) => void) => {
    const user = auth.currentUser;
    if (!user) return () => undefined;

    const q = query(
      collection(db, 'direct_messages'),
      where('participants', 'array-contains', user.uid),
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map((docSnap) => docSnap.data() as DirectMessage)
        .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'direct_messages');
      onError?.(error);
    });
  },
};
