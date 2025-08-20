import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useChatNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkNewMessages = async () => {
      try {
        const response = await fetch('/api/chat/messages?limit=1');
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
          const lastMessage = data.messages[0];
          const lastReadTime = localStorage.getItem(`lastRead_${user.id}`);
          
          if (!lastReadTime || new Date(lastMessage.timestamp) > new Date(lastReadTime)) {
            setUnreadCount(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error checking for new messages:', error);
      }
    };

    const interval = setInterval(checkNewMessages, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = () => {
    if (user) {
      localStorage.setItem(`lastRead_${user.id}`, new Date().toISOString());
      setUnreadCount(0);
    }
  };

  return { unreadCount, markAsRead };
}
