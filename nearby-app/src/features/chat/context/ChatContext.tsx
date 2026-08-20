import React, { createContext, useContext, useState, useEffect } from 'react';
import { DirectMessage, Neighbor, CallState } from '../../../types';
import { INITIAL_NEIGHBORS, INITIAL_MESSAGES } from '../../../utils/constants';
import { useAuth } from '../../auth/hooks/useAuth';
import { subscribeToMessages, sendMessageDoc, markMessageAsRead, deleteMessageForEveryone, deleteMessageForMe, updateMessageReaction } from '../../../services/firebase/messaging';
import { messageQueue } from '../../../services/offline/MessageQueue';

interface ChatContextValue {
  neighbors: Neighbor[];
  setNeighbors: React.Dispatch<React.SetStateAction<Neighbor[]>>;
  activeChatNeighbor: Neighbor | null;
  setActiveChatNeighbor: (nb: Neighbor | null) => void;
  messages: Record<string, DirectMessage[]>;
  currentMessages: DirectMessage[];
  sendMessage: (text: string, type?: DirectMessage['type'], mediaUrl?: string, extra?: Partial<DirectMessage>) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string, forEveryone?: boolean) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  forwardMessages: (targetNeighborIds: string[], messageIds: string[]) => Promise<void>;
  startCall: (neighborId: string, type: 'audio' | 'video') => void;
  endCall: () => void;
  activeCall: CallState | null;
  friendIds: string[];
  toggleFriend: (neighborId: string) => void;
  unreadTotal: number;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [neighbors, setNeighbors] = useState<Neighbor[]>(INITIAL_NEIGHBORS);
  const [activeChatNeighbor, setActiveChatNeighbor] = useState<Neighbor | null>(null);
  const [messages, setMessages] = useState<Record<string, DirectMessage[]>>(INITIAL_MESSAGES);
  const [activeCall, setActiveCall] = useState<CallState | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>(['nb-1']);

  // Subscribe to messages when an active chat neighbor is selected
  useEffect(() => {
    if (!currentUser || !activeChatNeighbor) return;

    const myUid = currentUser.uid;
    const targetUid = activeChatNeighbor.id;

    const unsubscribe = subscribeToMessages(myUid, targetUid, (serverMsgs) => {
      if (serverMsgs.length > 0) {
        setMessages((prev) => ({
          ...prev,
          [targetUid]: serverMsgs
        }));
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeChatNeighbor]);

  const currentMessages = activeChatNeighbor ? (messages[activeChatNeighbor.id] || []) : [];

  const sendMessage = async (
    text: string,
    type: DirectMessage['type'] = 'text',
    mediaUrl?: string,
    extra?: Partial<DirectMessage>
  ) => {
    if (!activeChatNeighbor) return;
    const senderId = currentUser?.uid || 'me';
    const receiverId = activeChatNeighbor.id;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: DirectMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      receiverId,
      timestamp: nowStr,
      type,
      text,
      mediaUrl,
      status: 'sending',
      ...extra
    };

    // Optimistic local update
    setMessages((prev) => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), newMsg]
    }));

    if (navigator.onLine && currentUser) {
      try {
        await sendMessageDoc(senderId, receiverId, newMsg);
        setMessages((prev) => ({
          ...prev,
          [receiverId]: (prev[receiverId] || []).map((m) =>
            m.id === newMsg.id ? { ...m, status: 'sent' } : m
          )
        }));
      } catch (err) {
        messageQueue.enqueue(senderId, receiverId, newMsg);
      }
    } else {
      messageQueue.enqueue(senderId, receiverId, newMsg);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!activeChatNeighbor || !currentUser) return;
    const threadId = [currentUser.uid, activeChatNeighbor.id].sort().join('_');
    await markMessageAsRead(threadId, messageId);
  };

  const deleteMessage = async (messageId: string, forEveryone = false) => {
    if (!activeChatNeighbor || !currentUser) return;
    const threadId = [currentUser.uid, activeChatNeighbor.id].sort().join('_');
    if (forEveryone) {
      await deleteMessageForEveryone(threadId, messageId);
    } else {
      await deleteMessageForMe(threadId, messageId, currentUser.uid);
    }
    setMessages((prev) => ({
      ...prev,
      [activeChatNeighbor.id]: (prev[activeChatNeighbor.id] || []).map((m) =>
        m.id === messageId ? (forEveryone ? { ...m, deletedForEveryone: true, text: '🚫 This message was deleted' } : { ...m, deletedForUsers: [...(m.deletedForUsers || []), currentUser.uid] }) : m
      )
    }));
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!activeChatNeighbor || !currentUser) return;
    const threadId = [currentUser.uid, activeChatNeighbor.id].sort().join('_');
    await updateMessageReaction(threadId, messageId, currentUser.uid, emoji);
    setMessages((prev) => ({
      ...prev,
      [activeChatNeighbor.id]: (prev[activeChatNeighbor.id] || []).map((m) =>
        m.id === messageId ? { ...m, reactions: [...(m.reactions || []), { userId: currentUser.uid, reaction: emoji }] } : m
      )
    }));
  };

  const forwardMessages = async (targetNeighborIds: string[], messageIds: string[]) => {
    if (!currentUser) return;
    const allMsgs: DirectMessage[] = (Object.values(messages) as DirectMessage[][]).reduce((acc, list) => acc.concat(list), []);
    for (const targetId of targetNeighborIds) {
      for (const msgId of messageIds) {
        const found = allMsgs.find((m) => m.id === msgId);
        if (found) {
          await sendMessageDoc(currentUser.uid, targetId, {
            ...found,
            id: `fwd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            isForwarded: true
          });
        }
      }
    }
  };

  const startCall = (neighborId: string, type: 'audio' | 'video') => {
    setActiveCall({
      active: true,
      type,
      neighborId,
      status: 'ringing',
      incoming: false,
      durationSeconds: 0
    });
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const toggleFriend = (neighborId: string) => {
    setFriendIds((prev) =>
      prev.includes(neighborId) ? prev.filter((id) => id !== neighborId) : [...prev, neighborId]
    );
  };

  const unreadTotal = (Object.values(messages) as DirectMessage[][]).reduce((acc, msgList) => {
    return acc + msgList.filter((m) => m.isUnread && m.senderId !== (currentUser?.uid || 'me')).length;
  }, 0);

  return (
    <ChatContext.Provider
      value={{
        neighbors,
        setNeighbors,
        activeChatNeighbor,
        setActiveChatNeighbor,
        messages,
        currentMessages,
        sendMessage,
        markAsRead,
        deleteMessage,
        reactToMessage,
        forwardMessages,
        startCall,
        endCall,
        activeCall,
        friendIds,
        toggleFriend,
        unreadTotal
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
