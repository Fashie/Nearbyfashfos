import { useState, useEffect } from 'react';
import { messageQueue } from '../../../services/offline/MessageQueue';

export function useOfflineQueue() {
  const [queueLength, setQueueLength] = useState<number>(messageQueue.getQueueLength());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      messageQueue.processQueue();
      setQueueLength(messageQueue.getQueueLength());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setQueueLength(messageQueue.getQueueLength());
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    queueLength,
    syncNow: () => messageQueue.processQueue()
  };
}
