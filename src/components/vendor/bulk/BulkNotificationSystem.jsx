import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';
import { bulkOperationsService } from '../../../services/bulk-operations-service';
import { vendorService } from '../../../services/vendor-service';
const BulkNotificationSystem = ({ vendorId, onActionComplete }) => {
  const [recipientType, setRecipientType] = useState('booking_participants');
  const [targetBookings, setTargetBookings] = useState([]);
  const [targetAdventures, setTargetAdventures] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allAdventures, setAllAdventures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    message: '',
    notificationType: 'vendor_update',
    includeEmail: false,
    includeWhatsApp: false,
    subject: ''
  });
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  useEffect(() => {
    loadData();
  }, [vendorId]);
  useEffect(() => {
    calculateRecipientCount();
  }, [recipientType, targetBookings, targetAdventures, allBookings, allAdventures]);
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bookingsResult, adventuresResult] = await Promise.all([
        bulkOperationsService.getBulkBookingsData(vendorId, { limit: 500 }),
        vendorService.getVendorAdventures(vendorId, { limit: 1000 })
      ]);
      if (bookingsResult.data) {
        setAllBookings(bookingsResult.data);
      }
      if (adventuresResult.data) {
        setAllAdventures(adventuresResult.data);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };
  const calculateRecipientCount = () => {
    let count = 0;
    const uniqueUsers = new Set();
    switch (recipientType) {
      case 'booking_participants':
        const selectedBookings = allBookings.filter(booking =>
          targetBookings.length === 0 || targetBookings.includes(booking.id)
        );
        selectedBookings.forEach(booking => {
          booking.booking_participants?.forEach(participant => {
            uniqueUsers.add(participant.user_id);
          });
        });
        count = uniqueUsers.size;
        break;
      case 'adventure_followers':
        const selectedAdventures = allAdventures.filter(adventure =>
          targetAdventures.length === 0 || targetAdventures.includes(adventure.id)
        );
        // Get unique users from bookings for these adventures
        allBookings
          .filter(booking => selectedAdventures.some(adv => adv.id === booking.adventure_id))
          .forEach(booking => {
            booking.booking_participants?.forEach(participant => {
              uniqueUsers.add(participant.user_id);
            });
          });
        count = uniqueUsers.size;
        break;
      default:
        count = 0;
    }
    setRecipientCount(count);
  };
  const recipientTypes = [
    {
      id: 'booking_participants',
      label: 'Booking Participants',
      icon: UserGroupIcon,
      description: 'Send to customers with confirmed bookings'
    },
    {
      id: 'adventure_followers',
      label: 'Adventure Followers',
      icon: BellIcon,
      description: 'Send to customers who have booked specific adventures'
    }
  ];
  const notificationTypes = [
    { value: 'vendor_update', label: 'General Update' },
    { value: 'booking_reminder', label: 'Booking Reminder' },
    { value: 'cancellation_notice', label: 'Cancellation Notice' },
    { value: 'schedule_change', label: 'Schedule Change' },
    { value: 'weather_alert', label: 'Weather Alert' },
    { value: 'special_offer', label: 'Special Offer' },
    { value: 'safety_information', label: 'Safety Information' }
  ];
  const handleSendNotifications = async () => {
    if (!notification.message.trim()) {
      alert('Please enter a message');
      return;
    }
    if (recipientCount === 0) {
      alert('No recipients selected');
      return;
    }
    setIsLoading(true);
    try {
      const notificationData = {
        recipientType,
        message: notification.message,
        notificationType: notification.notificationType,
        includeEmail: notification.includeEmail,
        includeWhatsApp: notification.includeWhatsApp
      };
      // Add specific targets based on recipient type
      if (recipientType === 'booking_participants') {
        notificationData.bookingIds = targetBookings.length > 0 ? targetBookings : allBookings.map(b => b.id);
      } else if (recipientType === 'adventure_followers') {
        notificationData.adventureIds = targetAdventures.length > 0 ? targetAdventures : allAdventures.map(a => a.id);
      }
      const result = await bulkOperationsService.sendBulkNotifications(vendorId, notificationData);
      setResults(result.data);
      setShowResults(true);
      // Log the action
      await bulkOperationsService.logBulkAction(vendorId, {
        type: 'bulk_notification',
        targetType: 'customers',
        targetCount: recipientCount,
        details: notificationData,
        results: result.data
      });
      onActionComplete?.();
    } catch (error) {
      setResults({
        successful: [],
        failed: [{ error: error.message }],
        total: recipientCount
      });
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };
  const renderResults = () => {
    if (!results) return null;
    return (
      <GlassCard variant="light" padding="md" className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Notification Results
          </h3>
          <button
            onClick={() => setShowResults(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {results.successful?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sent Successfully</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {results.failed?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {results.total || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Recipients</div>
          </div>
        </div>
        {results.failed && results.failed.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
              Failed Notifications:
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.failed.map((failure, index) => (
                <div key={index} className="text-sm text-red-600 dark:text-red-400">
                  {failure.recipient}: {failure.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    );
  };
  return (
    <div className="space-y-6">
      {/* Recipient Type Selection */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Select Recipients
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipientTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = recipientType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setRecipientType(type.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }
                `}
              >
                <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`} />
                <div className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                  {type.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {type.description}
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>
      {/* Target Selection */}
      {recipientType === 'booking_participants' && (
        <GlassCard variant="light" padding="md">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Select Bookings (Leave empty to include all)
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {allBookings.map((booking) => (
              <label key={booking.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="checkbox"
                  checked={targetBookings.includes(booking.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTargetBookings([...targetBookings, booking.id]);
                    } else {
                      setTargetBookings(targetBookings.filter(id => id !== booking.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {booking.adventures?.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(booking.booking_date).toLocaleDateString()} •
                    {booking.booking_participants?.length} participants
                  </div>
                </div>
              </label>
            ))}
          </div>
        </GlassCard>
      )}
      {recipientType === 'adventure_followers' && (
        <GlassCard variant="light" padding="md">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Select Adventures (Leave empty to include all)
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {allAdventures.map((adventure) => (
              <label key={adventure.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="checkbox"
                  checked={targetAdventures.includes(adventure.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTargetAdventures([...targetAdventures, adventure.id]);
                    } else {
                      setTargetAdventures(targetAdventures.filter(id => id !== adventure.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {adventure.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {adventure.location} • ${adventure.price_per_person}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </GlassCard>
      )}
      {/* Notification Configuration */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Type
            </label>
            <select
              value={notification.notificationType}
              onChange={(e) => setNotification({
                ...notification,
                notificationType: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={notification.message}
              onChange={(e) => setNotification({
                ...notification,
                message: e.target.value
              })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your message to customers..."
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {notification.message.length}/500 characters
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Delivery Methods
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <BellIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  In-App Notification (Always included)
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notification.includeEmail}
                  onChange={(e) => setNotification({
                    ...notification,
                    includeEmail: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Email Notification
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notification.includeWhatsApp}
                  onChange={(e) => setNotification({
                    ...notification,
                    includeWhatsApp: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  WhatsApp Message
                </span>
              </label>
            </div>
          </div>
        </div>
      </GlassCard>
      {/* Recipient Summary */}
      <GlassCard variant="info" padding="md">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-medium text-blue-800 dark:text-blue-200">
              {recipientCount} Recipients Selected
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {recipientType === 'booking_participants'
                ? `Customers from ${targetBookings.length || allBookings.length} bookings`
                : `Customers who have booked ${targetAdventures.length || allAdventures.length} adventures`
              }
            </div>
          </div>
        </div>
      </GlassCard>
      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSendNotifications}
          disabled={isLoading || !notification.message.trim() || recipientCount === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Sending...
            </>
          ) : (
            <>
              <BellIcon className="h-5 w-5" />
              Send to {recipientCount} Recipients
            </>
          )}
        </button>
      </div>
      {/* Results */}
      {showResults && renderResults()}
    </div>
  );
};
export default BulkNotificationSystem;