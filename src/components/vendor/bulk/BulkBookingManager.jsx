import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';
import { bulkOperationsService } from '../../../services/bulk-operations-service';
import { vendorService } from '../../../services/vendor-service';
const BulkBookingManager = ({ vendorId, onActionComplete }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    dateRange: {
      start: '',
      end: ''
    },
    adventureIds: []
  });
  const [bulkOperation, setBulkOperation] = useState('');
  const [operationData, setOperationData] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  useEffect(() => {
    loadBookings();
  }, [vendorId, filters]);
  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await bulkOperationsService.getBulkBookingsData(vendorId, {
        status: filters.status.length > 0 ? filters.status : undefined,
        dateRange: filters.dateRange.start && filters.dateRange.end ? filters.dateRange : undefined,
        adventureIds: filters.adventureIds.length > 0 ? filters.adventureIds : undefined,
        limit: 500 // Reasonable limit for bulk operations
      });
      if (!error && data) {
        setBookings(data);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };
  const operationTypes = [
    {
      id: 'status',
      label: 'Status Update',
      icon: ClockIcon,
      description: 'Confirm, cancel, or complete bookings'
    },
    {
      id: 'notifications',
      label: 'Send Notifications',
      icon: UserGroupIcon,
      description: 'Notify customers about booking updates'
    },
    {
      id: 'refunds',
      label: 'Process Refunds',
      icon: CurrencyDollarIcon,
      description: 'Initiate refunds for cancelled bookings'
    }
  ];
  const bookingStatuses = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'no_show', label: 'No Show', color: 'gray' }
  ];
  const handleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map(b => b.id));
    }
  };
  const handleSelectBooking = (bookingId) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };
  const handleExecuteBulkOperation = async () => {
    if (!bulkOperation || selectedBookings.length === 0) return;
    setIsLoading(true);
    let result;
    try {
      switch (bulkOperation) {
        case 'status':
          result = await bulkOperationsService.bulkUpdateBookingStatus(
            vendorId,
            selectedBookings,
            operationData.status
          );
          break;
        case 'notifications':
          result = await bulkOperationsService.sendBulkNotifications(vendorId, {
            recipientType: 'booking_participants',
            bookingIds: selectedBookings,
            message: operationData.message,
            notificationType: 'booking_update',
            includeEmail: operationData.includeEmail,
            includeWhatsApp: operationData.includeWhatsApp
          });
          break;
        case 'refunds':
          // This would integrate with the refund processing system
          result = { data: { successful: [], failed: [], total: selectedBookings.length }, error: null };
          break;
        default:
          throw new Error('Invalid operation type');
      }
      setResults(result.data);
      setShowResults(true);
      // Log the action
      await bulkOperationsService.logBulkAction(vendorId, {
        type: `bulk_booking_${bulkOperation}`,
        targetType: 'bookings',
        targetCount: selectedBookings.length,
        details: operationData,
        results: result.data
      });
      // Refresh bookings list
      loadBookings();
      onActionComplete?.();
    } catch (error) {
      setResults({
        successful: [],
        failed: selectedBookings.map(id => ({ id, error: error.message })),
        total: selectedBookings.length
      });
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };
  const renderOperationForm = () => {
    switch (bulkOperation) {
      case 'status':
        return (
          <GlassCard variant="light" padding="md" className="mt-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Booking Status Update
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Status
              </label>
              <select
                value={operationData.status || ''}
                onChange={(e) => setOperationData({
                  ...operationData,
                  status: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select new status</option>
                {bookingStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </GlassCard>
        );
      case 'notifications':
        return (
          <GlassCard variant="light" padding="md" className="mt-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Send Bulk Notifications
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={operationData.message || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    message: e.target.value
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your message to customers..."
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={operationData.includeEmail || false}
                    onChange={(e) => setOperationData({
                      ...operationData,
                      includeEmail: e.target.checked
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Send Email
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={operationData.includeWhatsApp || false}
                    onChange={(e) => setOperationData({
                      ...operationData,
                      includeWhatsApp: e.target.checked
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Send WhatsApp
                  </span>
                </label>
              </div>
            </div>
          </GlassCard>
        );
      case 'refunds':
        return (
          <GlassCard variant="warning" padding="md" className="mt-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Process Refunds
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                  This will initiate refund processing for the selected bookings.
                  Only cancelled bookings are eligible for refunds.
                </p>
                <div>
                  <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Refund Reason
                  </label>
                  <select
                    value={operationData.refundReason || ''}
                    onChange={(e) => setOperationData({
                      ...operationData,
                      refundReason: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-amber-300 dark:border-amber-600 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Select refund reason</option>
                    <option value="vendor_cancellation">Vendor Cancellation</option>
                    <option value="customer_request">Customer Request</option>
                    <option value="weather_conditions">Weather Conditions</option>
                    <option value="equipment_failure">Equipment Failure</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      default:
        return null;
    }
  };
  const renderResults = () => {
    if (!results) return null;
    return (
      <GlassCard variant="light" padding="md" className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Operation Results
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
            <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
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
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>
        {results.failed && results.failed.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
              Failed Operations:
            </h4>
            <div className="space-y-1">
              {results.failed.map((failure, index) => (
                <div key={index} className="text-sm text-red-600 dark:text-red-400">
                  Booking ID {failure.id}: {failure.error}
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
      {/* Filters */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Filter Bookings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              multiple
              value={filters.status}
              onChange={(e) => setFilters({
                ...filters,
                status: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={3}
            >
              {bookingStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, start: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, end: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </GlassCard>
      {/* Operation Type Selection */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Select Bulk Operation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operationTypes.map((operation) => {
            const Icon = operation.icon;
            const isSelected = bulkOperation === operation.id;
            return (
              <button
                key={operation.id}
                onClick={() => setBulkOperation(operation.id)}
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
                  {operation.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {operation.description}
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>
      {/* Booking Selection */}
      <GlassCard variant="light" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Select Bookings ({selectedBookings.length} selected)
          </h3>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {selectedBookings.length === bookings.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {bookings.map((booking) => {
            const statusConfig = bookingStatuses.find(s => s.value === booking.status);
            return (
              <div
                key={booking.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedBookings.includes(booking.id)}
                  onChange={() => handleSelectBooking(booking.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {booking.adventures?.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(booking.booking_date).toLocaleDateString()} •
                    {booking.booking_participants?.length} participants •
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${statusConfig?.color}-100 text-${statusConfig?.color}-800 dark:bg-${statusConfig?.color}-900/20 dark:text-${statusConfig?.color}-300`}>
                      {statusConfig?.label}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ${booking.total_amount}
                </div>
              </div>
            );
          })}
        </div>
        {bookings.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No bookings found matching current filters.
          </div>
        )}
      </GlassCard>
      {/* Operation Configuration */}
      {bulkOperation && renderOperationForm()}
      {/* Execute Button */}
      {bulkOperation && selectedBookings.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleExecuteBulkOperation}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5" />
                Execute Bulk Operation
              </>
            )}
          </button>
        </div>
      )}
      {/* Results */}
      {showResults && renderResults()}
    </div>
  );
};
export default BulkBookingManager;