import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      createdAt: new Date(),
    };

    setNotifications(prev => [...prev, newNotification].slice(-5)); // Keep max 5 notifications

    // Auto-dismiss after duration (default 5 seconds)
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper methods for different notification types
  const notify = {
    success: (message, options = {}) => 
      addNotification({ type: 'success', message, ...options }),
    error: (message, options = {}) => 
      addNotification({ type: 'error', message, ...options }),
    warning: (message, options = {}) => 
      addNotification({ type: 'warning', message, ...options }),
    info: (message, options = {}) => 
      addNotification({ type: 'info', message, ...options }),
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    notify,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map(notification => (
          <Toast
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};