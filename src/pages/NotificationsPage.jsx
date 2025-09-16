import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  EnvelopeOpenIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../components/ui/GlassCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import notificationService from '../services/notification-service';
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadNotifications();
  }, []);
  const loadNotifications = async () => {
    setLoading(true);
    try {
      // This would fetch from the API
      const mockNotifications = [
        {
          id: 1,
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: 'Your booking for Bali Adventure has been confirmed!',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: false,
          icon: 'booking'
        },
        {
          id: 2,
          type: 'group_invitation',
          title: 'Group Invitation',
          message: 'You have been invited to join "Thailand Explorers" group',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: false,
          icon: 'group'
        },
        {
          id: 3,
          type: 'payment_received',
          title: 'Payment Received',
          message: 'Payment of $250 has been received for your adventure',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          read: true,
          icon: 'payment'
        },
        {
          id: 4,
          type: 'review_reminder',
          title: 'Leave a Review',
          message: 'How was your experience with Mountain Trekking Co?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          read: true,
          icon: 'review'
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };
  const clearAll = () => {
    setNotifications([]);
  };
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return '✈️';
      case 'group':
        return '👥';
      case 'payment':
        return '💰';
      case 'review':
        return '⭐';
      default:
        return '📬';
    }
  };
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with your travel activities
          </p>
        </motion.div>
        {/* Actions Bar */}
        <GlassCard className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                All
              </Button>
              <Button
                onClick={() => setFilter('unread')}
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
              >
                Unread
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge className="ml-2">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </Button>
              <Button
                onClick={() => setFilter('read')}
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
              >
                Read
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                disabled={!notifications.some(n => !n.read)}
              >
                <EnvelopeOpenIcon className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
                size="sm"
                disabled={notifications.length === 0}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Clear all
              </Button>
            </div>
          </div>
        </GlassCard>
        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <GlassCard className="text-center py-12">
            <BellIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                ? "No read notifications to show."
                : "You don't have any notifications yet."}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <GlassCard
                  className={`p-4 ${!notification.read ? 'border-blue-500 bg-blue-50/5' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {getRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              title="Mark as read"
                            >
                              <EnvelopeOpenIcon className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            variant="ghost"
                            size="sm"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;