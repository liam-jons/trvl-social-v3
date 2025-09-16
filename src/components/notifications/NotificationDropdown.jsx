import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import useNotificationStore from '../../stores/notificationStore';

const NotificationDropdown = ({ isOpen, onToggle, onClose }) => {
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    loadNotifications
  } = useNotificationStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Load notifications when opened
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications({ limit: 10 });
    }
  }, [isOpen, notifications.length, loadNotifications]);

  const handleNotificationItemClick = async (notification, event) => {
    event.preventDefault();
    await handleNotificationClick(notification);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      vendor_offer: '🎯',
      booking_confirmed: '✅',
      booking_reminder: '⏰',
      group_invitation: '👥',
      group_update: '👥',
      trip_request_match: '🎯',
      payment_reminder: '💳',
      system_update: '🔔',
      marketing: '📢',
      general: '🔔'
    };
    return icons[type] || '🔔';
  };

  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 z-50" ref={dropdownRef}>
      <GlassCard className="max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                Mark all read
              </GlassButton>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-2">🔔</div>
              <h4 className="font-medium mb-1">No notifications yet</h4>
              <p className="text-sm text-gray-500">
                We'll notify you when there's something new
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
                  }`}
                  onClick={(e) => handleNotificationItemClick(notification, e)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.read ? 'text-blue-400' : ''
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.body}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatNotificationTime(notification.created_at)}
                        </span>

                        {/* Action buttons */}
                        {notification.data?.url && (
                          <Link
                            to={notification.data.url}
                            className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-white/20 text-center">
            <Link
              to="/notifications"
              className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
              onClick={onClose}
            >
              View all notifications
            </Link>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default NotificationDropdown;