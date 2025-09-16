import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CogIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../ui/GlassCard';
import BulkAdventureEditor from './bulk/BulkAdventureEditor';
import BulkBookingManager from './bulk/BulkBookingManager';
import CSVImportExport from './bulk/CSVImportExport';
import BulkNotificationSystem from './bulk/BulkNotificationSystem';
import BulkActionHistory from './bulk/BulkActionHistory';
import { bulkOperationsService } from '../../services/bulk-operations-service';
import useVendorDashboardStore from '../../stores/vendorDashboardStore';
const BulkOperationsManager = ({ vendorId }) => {
  const [activeTab, setActiveTab] = useState('adventures');
  const [activeBatchJobs, setActiveBatchJobs] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentVendor } = useVendorDashboardStore();
  useEffect(() => {
    loadRecentActions();
    loadActiveBatchJobs();
  }, [vendorId]);
  const loadRecentActions = async () => {
    try {
      const { data, error } = await bulkOperationsService.getBulkActionHistory(vendorId, {
        limit: 5
      });
      if (!error && data) {
        setRecentActions(data);
      }
    } catch (error) {
      console.error('Failed to load recent actions:', error);
    }
  };
  const loadActiveBatchJobs = async () => {
    // Implementation for loading active batch jobs
    // This would typically fetch from a real-time subscription
    setActiveBatchJobs([]);
  };
  const tabs = [
    {
      id: 'adventures',
      label: 'Adventures',
      icon: CogIcon,
      description: 'Bulk edit adventure listings'
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: ClockIcon,
      description: 'Manage multiple bookings'
    },
    {
      id: 'import-export',
      label: 'Import/Export',
      icon: DocumentArrowUpIcon,
      description: 'CSV data operations'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      description: 'Bulk messaging system'
    },
    {
      id: 'history',
      label: 'History',
      icon: ClockIcon,
      description: 'Action history & undo'
    }
  ];
  const renderTabContent = () => {
    switch (activeTab) {
      case 'adventures':
        return <BulkAdventureEditor vendorId={vendorId} onActionComplete={loadRecentActions} />;
      case 'bookings':
        return <BulkBookingManager vendorId={vendorId} onActionComplete={loadRecentActions} />;
      case 'import-export':
        return <CSVImportExport vendorId={vendorId} onActionComplete={loadRecentActions} />;
      case 'notifications':
        return <BulkNotificationSystem vendorId={vendorId} onActionComplete={loadRecentActions} />;
      case 'history':
        return <BulkActionHistory vendorId={vendorId} />;
      default:
        return null;
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bulk Operations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage multiple items efficiently with batch operations
          </p>
        </div>
      </div>
      {/* Active Batch Jobs Alert */}
      {activeBatchJobs.length > 0 && (
        <GlassCard variant="warning" padding="md">
          <div className="flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Active Batch Jobs ({activeBatchJobs.length})
              </h3>
              <div className="mt-2 space-y-2">
                {activeBatchJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      {job.job_type}: {job.processed_items}/{job.total_items}
                    </span>
                    <div className="w-24 bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(job.processed_items / job.total_items) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      )}
      {/* Recent Actions Summary */}
      {recentActions.length > 0 && (
        <GlassCard variant="light" padding="md">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Recent Bulk Actions
          </h3>
          <div className="space-y-2">
            {recentActions.slice(0, 3).map((action) => (
              <div key={action.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {action.action_type} on {action.target_count} {action.target_type}
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(action.performed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors duration-200
                  ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <GlassCard variant="light" padding="lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              <span className="text-gray-900 dark:text-white">Processing bulk operation...</span>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
export default BulkOperationsManager;