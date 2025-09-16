import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';
import { bulkOperationsService } from '../../../services/bulk-operations-service';
import { vendorService } from '../../../services/vendor-service';
import useVendorDashboardStore from '../../../stores/vendorDashboardStore';
const BulkAdventureEditor = ({ vendorId, onActionComplete }) => {
  const [selectedAdventures, setSelectedAdventures] = useState([]);
  const [allAdventures, setAllAdventures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkOperation, setBulkOperation] = useState('');
  const [operationData, setOperationData] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const { adventures, loadAdventures } = useVendorDashboardStore();
  useEffect(() => {
    loadAdventures();
    setAllAdventures(adventures || []);
  }, [loadAdventures, adventures]);
  const operationTypes = [
    {
      id: 'pricing',
      label: 'Pricing Adjustment',
      icon: CurrencyDollarIcon,
      description: 'Update prices across multiple adventures'
    },
    {
      id: 'status',
      label: 'Status Change',
      icon: TagIcon,
      description: 'Publish, unpublish, or archive adventures'
    },
    {
      id: 'details',
      label: 'Adventure Details',
      icon: ClockIcon,
      description: 'Update duration, capacity, or other details'
    },
    {
      id: 'availability',
      label: 'Availability',
      icon: UserGroupIcon,
      description: 'Bulk update availability settings'
    }
  ];
  const handleSelectAll = () => {
    if (selectedAdventures.length === allAdventures.length) {
      setSelectedAdventures([]);
    } else {
      setSelectedAdventures(allAdventures.map(a => a.id));
    }
  };
  const handleSelectAdventure = (adventureId) => {
    setSelectedAdventures(prev =>
      prev.includes(adventureId)
        ? prev.filter(id => id !== adventureId)
        : [...prev, adventureId]
    );
  };
  const handleExecuteBulkOperation = async () => {
    if (!bulkOperation || selectedAdventures.length === 0) return;
    setIsLoading(true);
    let result;
    try {
      switch (bulkOperation) {
        case 'pricing':
          result = await bulkOperationsService.bulkUpdatePricing(
            vendorId,
            selectedAdventures,
            operationData.pricing
          );
          break;
        case 'status':
          result = await bulkOperationsService.bulkUpdateStatus(
            vendorId,
            selectedAdventures,
            operationData.status
          );
          break;
        case 'details':
          result = await bulkOperationsService.bulkUpdateAdventures(
            vendorId,
            selectedAdventures,
            operationData.details
          );
          break;
        default:
          throw new Error('Invalid operation type');
      }
      setResults(result.data);
      setShowResults(true);
      // Log the action
      await bulkOperationsService.logBulkAction(vendorId, {
        type: `bulk_${bulkOperation}`,
        targetType: 'adventures',
        targetCount: selectedAdventures.length,
        details: operationData,
        results: result.data
      });
      // Refresh adventures list
      loadAdventures();
      onActionComplete?.();
    } catch (error) {
      console.error('Bulk operation failed:', error);
      setResults({
        successful: [],
        failed: selectedAdventures.map(id => ({ id, error: error.message })),
        total: selectedAdventures.length
      });
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };
  const renderOperationForm = () => {
    switch (bulkOperation) {
      case 'pricing':
        return (
          <GlassCard variant="light" padding="md" className="mt-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Pricing Adjustment Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adjustment Type
                </label>
                <select
                  value={operationData.pricing?.type || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    pricing: { ...operationData.pricing, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select adjustment type</option>
                  <option value="percentage">Percentage Change</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="set_price">Set Fixed Price</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={operationData.pricing?.value || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    pricing: { ...operationData.pricing, value: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    operationData.pricing?.type === 'percentage' ? 'e.g., 10 for 10% increase' :
                    operationData.pricing?.type === 'fixed_amount' ? 'e.g., 50 to add $50' :
                    'e.g., 200 to set price to $200'
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Price (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={operationData.pricing?.minimumPrice || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    pricing: { ...operationData.pricing, minimumPrice: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum price floor"
                />
              </div>
            </div>
          </GlassCard>
        );
      case 'status':
        return (
          <GlassCard variant="light" padding="md" className="mt-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Status Change Settings
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
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </GlassCard>
        );
      case 'details':
        return (
          <GlassCard variant="light" padding="md" className="mt-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Adventure Details Update
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={operationData.details?.duration_hours || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    details: { ...operationData.details, duration_hours: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to keep current"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Capacity
                </label>
                <input
                  type="number"
                  value={operationData.details?.max_capacity || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    details: { ...operationData.details, max_capacity: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to keep current"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={operationData.details?.difficulty_level || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    details: { ...operationData.details, difficulty_level: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Keep current</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={operationData.details?.category || ''}
                  onChange={(e) => setOperationData({
                    ...operationData,
                    details: { ...operationData.details, category: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to keep current"
                />
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
                  Adventure ID {failure.id}: {failure.error}
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
      {/* Operation Type Selection */}
      <GlassCard variant="light" padding="md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Select Bulk Operation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      {/* Adventure Selection */}
      <GlassCard variant="light" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Select Adventures ({selectedAdventures.length} selected)
          </h3>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {selectedAdventures.length === allAdventures.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {allAdventures.map((adventure) => (
            <div
              key={adventure.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <input
                type="checkbox"
                checked={selectedAdventures.includes(adventure.id)}
                onChange={() => handleSelectAdventure(adventure.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {adventure.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {adventure.location} • ${adventure.price_per_person} • {adventure.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        {allAdventures.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No adventures found. Create your first adventure to use bulk operations.
          </div>
        )}
      </GlassCard>
      {/* Operation Configuration */}
      {bulkOperation && renderOperationForm()}
      {/* Execute Button */}
      {bulkOperation && selectedAdventures.length > 0 && (
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
export default BulkAdventureEditor;