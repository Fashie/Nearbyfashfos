import { useState, useEffect } from 'react';
import { chatService } from '../features/chat/services/chatService';
import { DirectMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<DirectMessage[]>([]);

  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages((msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, []);

  const sendMessage = async (msg: DirectMessage, threadId: string) => {
    return chatService.saveOrUpdateMessage(msg, threadId);
  };

  return {
    messages,
    sendMessage
  };
}
