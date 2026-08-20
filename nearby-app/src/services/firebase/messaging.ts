import {
  db,
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  arrayUnion,
  handleFirestoreError,
  OperationType
} from './firestore';
import { DirectMessage } from '../../types';

export function getChatThreadId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function sendMessageDoc(
  senderId: string,
  receiverId: string,
  message: Partial<DirectMessage>
): Promise<DirectMessage> {
  const isGroup = receiverId.startsWith('grp-');
  const threadId = isGroup ? receiverId : getChatThreadId(senderId, receiverId);
  const msgId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fullMessage: DirectMessage = {
    id: msgId,
    senderId,
    receiverId,
    timestamp: message.timestamp || nowStr,
    type: message.type || 'text',
    text: message.text || '',
    mediaUrl: message.mediaUrl,
    audioDurationSec: message.audioDurationSec,
    fileName: message.fileName,
    fileSize: message.fileSize,
    callLog: message.callLog,
    isUnread: true,
    status: message.status || 'sent',
    replyTo: message.replyTo,
    reactions: message.reactions || [],
    chatThreadId: threadId,
    isForwarded: message.isForwarded,
    isStarred: message.isStarred,
    deliveredTime: message.deliveredTime,
    readTime: message.readTime
  };

  try {
    const threadDocRef = doc(db, 'direct_messages', threadId);
    const msgDocRef = doc(collection(threadDocRef, 'messages'), msgId);
    
    await setDoc(msgDocRef, fullMessage);
    await setDoc(threadDocRef, {
      lastMessage: fullMessage.text || (fullMessage.type === 'image' ? '📷 Photo' : '🎵 Audio note'),
      lastTimestamp: Date.now(),
      lastSenderId: senderId,
      participants: isGroup ? [] : [senderId, receiverId]
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `direct_messages/${threadId}/messages/${msgId}`);
  }

  return fullMessage;
}

export function subscribeToMessages(
  senderId: string,
  receiverId: string,
  onMessages: (msgs: DirectMessage[]) => void
): () => void {
  const isGroup = receiverId.startsWith('grp-');
  const threadId = isGroup ? receiverId : getChatThreadId(senderId, receiverId);

  const messagesCol = collection(db, 'direct_messages', threadId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: DirectMessage[] = [];
      snapshot.forEach((d) => {
        messages.push(d.data() as DirectMessage);
      });
      onMessages(messages);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `direct_messages/${threadId}/messages`);
    }
  );

  return unsubscribe;
}

export async function updateMessageReaction(
  threadId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  try {
    const msgRef = doc(db, 'direct_messages', threadId, 'messages', messageId);
    await updateDoc(msgRef, {
      reactions: arrayUnion({ userId, reaction: emoji })
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `direct_messages/${threadId}/messages/${messageId}`);
  }
}

export async function deleteMessageForEveryone(threadId: string, messageId: string): Promise<void> {
  try {
    const msgRef = doc(db, 'direct_messages', threadId, 'messages', messageId);
    await updateDoc(msgRef, {
      deletedForEveryone: true,
      text: '🚫 This message was deleted'
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `direct_messages/${threadId}/messages/${messageId}`);
  }
}

export async function deleteMessageForMe(threadId: string, messageId: string, userId: string): Promise<void> {
  try {
    const msgRef = doc(db, 'direct_messages', threadId, 'messages', messageId);
    await updateDoc(msgRef, {
      deletedForUsers: arrayUnion(userId)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `direct_messages/${threadId}/messages/${messageId}`);
  }
}

export async function markMessageAsRead(threadId: string, messageId: string): Promise<void> {
  try {
    const msgRef = doc(db, 'direct_messages', threadId, 'messages', messageId);
    await updateDoc(msgRef, {
      status: 'read',
      isUnread: false,
      readTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (err) {
    // Non-critical background update
  }
}
