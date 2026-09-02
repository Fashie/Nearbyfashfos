import { db, setDocument } from '../../../services/firebase';
import { DirectMessage } from '../../../types';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { auth } from '../../../firebase';

export const chatService = {
  getMessagesCollectionRef: () => {
    return collection(db, 'direct_messages');
  },

  saveOrUpdateMessage: async (msg: DirectMessage, threadId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not signed in - cannot send message.');

    // Message ids double as Firestore doc ids in a single global collection, so a
    // bare timestamp can collide across senders. Namespace by uid.
    const docId = msg.id || `msg-${uid}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const msgRef = doc(db, 'direct_messages', docId);

    const senderId = msg.senderId === 'user' || !msg.senderId ? uid : msg.senderId;
    const receiverId = msg.receiverId === 'user' || !msg.receiverId ? threadId : msg.receiverId;
    // Sorted participants pair - REQUIRED: the message listener queries
    // where('participants','array-contains', uid) and the security rules key off
    // it. Writing a doc without it makes the message invisible to both sides.
    const participants = [senderId, receiverId].sort();

    const payload = {
      ...msg,
      id: docId,
      senderId,
      receiverId,
      participants,
      chatThreadId: participants.join('_'),
      timestamp: msg.timestamp || new Date().toISOString(),
      serverTime: new Date().toISOString()
    };

    await setDoc(msgRef, payload, { merge: true });
    return payload;
  },

  subscribeToMessages: (callback: (messages: DirectMessage[]) => void) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      callback([]);
      return () => {};
    }

    // Previously this subscribed to the ENTIRE direct_messages collection ordered
    // by timestamp: it read other people's private messages (so the rules rightly
    // denied it outright, killing the listener) and needed a composite index. Scope
    // it to this user's own conversations and sort client-side.
    const q = query(
      collection(db, 'direct_messages'),
      where('participants', 'array-contains', uid)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: DirectMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push(docSnap.data() as DirectMessage);
      });
      messages.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
      callback(messages);
    }, (error) => {
      console.error("Error subscribing to direct messages:", error);
      callback([]);
    });
  }
};
