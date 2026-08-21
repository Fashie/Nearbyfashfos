import { useState, useEffect } from 'react';
import { notificationService } from '../features/notifications/services/notificationService';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = notificationService.subscribeToNotifications(userId, (data) => {
      setNotifications(data);
    });
    return unsubscribe;
  }, [userId]);

  const send = async (notification: any) => {
    await notificationService.sendNotification(notification);
  };

  return {
    notifications,
    send
  };
}
