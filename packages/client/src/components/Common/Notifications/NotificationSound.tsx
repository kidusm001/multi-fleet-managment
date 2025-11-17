import { useEffect, useRef } from 'react';
import { useNotifications } from '@contexts/NotificationContext';

export function NotificationSound() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { notifications } = useNotifications();
  const lastNotificationCount = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > lastNotificationCount.current) {
      audioRef.current?.play().catch(console.error);
    }
    lastNotificationCount.current = notifications.length;
  }, [notifications]);

  return (
    <audio 
      ref={audioRef} 
      src="/assets/sounds/notification.mp3" 
      preload="auto"
    />
  );
}
