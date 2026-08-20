import { useChat } from './useChat';

export function useMessages(neighborId?: string) {
  const { messages, sendMessage, markAsRead, deleteMessage, reactToMessage } = useChat();
  const threadMessages = neighborId ? (messages[neighborId] || []) : [];

  return {
    messages: threadMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    reactToMessage
  };
}
