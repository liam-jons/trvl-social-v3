import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';
import { bulkOperationsService } from '../../../services/bulk-operations-service';
const BulkActionHistory = ({ vendorId }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    actionType: '',
    targetType: '',
    dateRange: { start: '', end: '' }
  });
  const [selectedAction, setSelectedAction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    loadHistory();
  }, [vendorId, filters]);
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await bulkOperationsService.getBulkActionHistory(vendorId, {
        actionType: filters.actionType || undefined,
        targetType: filters.targetType || undefined,
        dateRange: filters.dateRange.start && filters.dateRange.end ? filters.dateRange : undefined,
        limit: 100
      });
      if (!error && data) {
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to load action history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const actionTypeLabels = {
    'bulk_pricing': 'Price Adjustment',
    'bulk_status': 'Status Update',
    'bulk_details': 'Details Update',
    'bulk_booking_status': 'Booking Status',
    'bulk_notification': 'Notifications',
    'csv_export': 'CSV Export',
    'csv_import': 'CSV Import',
    'bulk_booking_notifications': 'Booking Notifications',
    'bulk_booking_refunds': 'Refund Processing'
  };
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'bulk_pricing':
      case 'bulk_status':
      case 'bulk_details':
        return CheckCircleIcon;
      case 'bulk_notification':
      case 'bulk_booking_notifications':
        return CheckCircleIcon;
      case 'csv_export':
      case 'csv_import':
        return CheckCircleIcon;
      default:
        return ClockIcon;
    }
  };
  const getActionColor = (actionType, results) => {
    const hasErrors = results?.failed?.length > 0;
    if (hasErrors) {
      return 'text-amber-500';
    }
    return 'text-green-500';
  };
  const formatActionSummary = (action) => {
    const { action_type, target_count, target_type, results } = action;
    const successful = results?.successful?.length || 0;
    const failed = results?.failed?.length || 0;
    const total = target_count || 0;
    return `${actionTypeLabels[action_type] || action_type} on ${total} ${target_type} (${successful} successful${failed > 0 ? `, ${failed} failed` : ''})`;
  };
  const handleViewDetails = (action) => {
    setSelectedAction(action);
    setShowDetails(true);
  };
  const renderDetailsModal = () => {
    if (!selectedAction) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Action Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Action Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {actionTypeLabels[selectedAction.action_type] || selectedAction.action_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Target:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedAction.target_count} {selectedAction.target_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Performed:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(selectedAction.performed_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 font-medium ${
                      selectedAction.results?.failed?.length > 0 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {selectedAction.results?.failed?.length > 0 ? 'Partial Success' : 'Success'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Results Summary */}
              {selectedAction.results && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Results Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedAction.results.successful?.length || 0}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">Successful</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {selectedAction.results.failed?.length || 0}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedAction.results.total || selectedAction.target_count}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
                    </div>
                  </div>
                </div>
              )}
              {/* Action Details */}
              {selectedAction.details && Object.keys(selectedAction.details).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Action Configuration
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedAction.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {/* Failed Items */}
              {selectedAction.results?.failed && selectedAction.results.failed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-3">
                    Failed Items ({selectedAction.results.failed.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedAction.results.failed.map((failure, index) => (
                      <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-sm text-red-800 dark:text-red-200">
                          {failure.id && `ID: ${failure.id} - `}
                          {failure.error || failure.message || 'Unknown error'}
                        </div>
                        {failure.row && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Row: {failure.row}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard variant="light" padding="md">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            Filter History
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action Type
            </label>
            <select
              value={filters.actionType}
              onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {Object.entries(actionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Type
            </label>
            <select
              value={filters.targetType}
              onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Targets</option>
              <option value="adventures">Adventures</option>
              <option value="bookings">Bookings</option>
              <option value="customers">Customers</option>
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
      {/* History List */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Action History ({history.length} items)
        </h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            <div className="text-gray-600 dark:text-gray-400 mt-2">Loading history...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No bulk actions found matching current filters.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((action) => {
              const Icon = getActionIcon(action.action_type);
              const iconColor = getActionColor(action.action_type, action.results);
              const hasErrors = action.results?.failed?.length > 0;
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <Icon className={`h-6 w-6 ${iconColor} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatActionSummary(action)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(action.performed_at).toLocaleString()}
                    </div>
                  </div>
                  {hasErrors && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  )}
                  <button
                    onClick={() => handleViewDetails(action)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
      {/* Details Modal */}
      {showDetails && renderDetailsModal()}
    </div>
  );
};
export default BulkActionHistory;