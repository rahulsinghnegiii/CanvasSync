import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showNotification: () => {},
  hideNotification: () => {}
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Show a notification
  const showNotification = useCallback((type: NotificationType, message: string, duration?: number) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    setNotifications(prev => [
      ...prev,
      {
        id,
        type,
        message,
        duration
      }
    ]);
    
    return id;
  }, []);

  // Hide a notification
  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        hideNotification
      }}
    >
      {children}
      
      {/* Render all active notifications */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

export default NotificationContext; 