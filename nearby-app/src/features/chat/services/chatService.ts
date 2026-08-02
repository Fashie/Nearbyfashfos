import { db, setDocument } from '../../../services/firebase';
import { DirectMessage } from '../../../types';
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';

export const chatService = {
  getMessagesCollectionRef: () => {
    return collection(db, 'direct_messages');
  },

  saveOrUpdateMessage: async (msg: DirectMessage, threadId: string) => {
    // Generate standard composite key if needed
    const docId = msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const msgRef = doc(db, 'direct_messages', docId);
    
    const payload = {
      ...msg,
      id: docId,
      chatThreadId: threadId,
      serverTime: new Date().toISOString()
    };
    
    await setDoc(msgRef, payload, { merge: true });
    return payload;
  },

  subscribeToMessages: (callback: (messages: DirectMessage[]) => void) => {
    const q = query(
      collection(db, 'direct_messages'),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages: DirectMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push(docSnap.data() as DirectMessage);
      });
      callback(messages);
    }, (error) => {
      console.error("Error subscribing to direct messages:", error);
    });
  }
};
