import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const OfferFilters = ({ filters, onFilterChange, offers }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Calculate price range from offers
  const priceStats = offers.length > 0 ? {
    min: Math.min(...offers.map(o => o.proposed_price)),
    max: Math.max(...offers.map(o => o.proposed_price)),
    avg: offers.reduce((sum, o) => sum + o.proposed_price, 0) / offers.length
  } : { min: 0, max: 10000, avg: 0 };

  const statusOptions = [
    { value: 'all', label: 'All Status', count: offers.length },
    { value: 'pending', label: 'Pending', count: offers.filter(o => o.status === 'pending').length },
    { value: 'accepted', label: 'Accepted', count: offers.filter(o => o.status === 'accepted').length },
    { value: 'rejected', label: 'Rejected', count: offers.filter(o => o.status === 'rejected').length },
    { value: 'counter_offered', label: 'Counter Offered', count: offers.filter(o => o.status === 'counter_offered').length },
    { value: 'expired', label: 'Expired', count: offers.filter(o => o.is_expired).length }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'price', label: 'Price' },
    { value: 'rating', label: 'Vendor Rating' },
    { value: 'expiry', label: 'Expiry Date' }
  ];

  const handleFilterUpdate = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (index, value) => {
    const newRange = [...localFilters.priceRange];
    newRange[index] = parseInt(value) || 0;
    handleFilterUpdate('priceRange', newRange);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
      priceRange: [0, 10000],
      dateRange: null,
      vendorRating: 0
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.status !== 'all') count++;
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 10000) count++;
    if (localFilters.vendorRating > 0) count++;
    if (localFilters.dateRange) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filter Offers
          </h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 transition-colors"
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterUpdate('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleFilterUpdate('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Order
          </label>
          <select
            value={localFilters.sortOrder}
            onChange={(e) => handleFilterUpdate('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>

        {/* Quick Price Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price Range
          </label>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {formatCurrency(localFilters.priceRange[0])} - {formatCurrency(localFilters.priceRange[1])}
          </div>
          <input
            type="range"
            min={priceStats.min}
            max={priceStats.max}
            value={localFilters.priceRange[1]}
            onChange={(e) => handlePriceRangeChange(1, e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Detailed Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range (Detailed)
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Minimum</label>
                  <input
                    type="number"
                    value={localFilters.priceRange[0]}
                    onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                    min={0}
                    max={priceStats.max}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min price"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Maximum</label>
                  <input
                    type="number"
                    value={localFilters.priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                    min={localFilters.priceRange[0]}
                    max={priceStats.max}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Max price"
                  />
                </div>
              </div>
              {offers.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Range: {formatCurrency(priceStats.min)} - {formatCurrency(priceStats.max)} |
                  Avg: {formatCurrency(priceStats.avg)}
                </div>
              )}
            </div>

            {/* Vendor Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Vendor Rating
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={localFilters.vendorRating}
                  onChange={(e) => handleFilterUpdate('vendorRating', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Any</span>
                  <span className="font-medium">
                    {localFilters.vendorRating > 0 ? `${localFilters.vendorRating}+ ⭐` : 'Any rating'}
                  </span>
                  <span>5⭐</span>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Offer Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={localFilters.dateRange?.[0]?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const startDate = e.target.value ? new Date(e.target.value) : null;
                    const endDate = localFilters.dateRange?.[1] || null;
                    handleFilterUpdate('dateRange', startDate && endDate ? [startDate, endDate] : null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="date"
                  value={localFilters.dateRange?.[1]?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const endDate = e.target.value ? new Date(e.target.value) : null;
                    const startDate = localFilters.dateRange?.[0] || null;
                    handleFilterUpdate('dateRange', startDate && endDate ? [startDate, endDate] : null);
                  }}
                  min={localFilters.dateRange?.[0]?.toISOString().split('T')[0] || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {localFilters.dateRange && (
                <button
                  onClick={() => handleFilterUpdate('dateRange', null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                >
                  Clear date range
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {offers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {offers.filter(offer => {
                // Apply the same filtering logic as in the store
                if (localFilters.status !== 'all' && offer.status !== localFilters.status) return false;
                if (offer.proposed_price < localFilters.priceRange[0] || offer.proposed_price > localFilters.priceRange[1]) return false;
                if (localFilters.vendorRating > 0 && (offer.vendor?.rating || 0) < localFilters.vendorRating) return false;
                return true;
              }).length} of {offers.length} offers
            </span>
            <div className="flex items-center gap-4">
              {offers.filter(o => o.status === 'pending').length > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {offers.filter(o => o.status === 'pending').length} pending
                </span>
              )}
              {offers.filter(o => o.days_until_expiry <= 1 && !o.is_expired).length > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {offers.filter(o => o.days_until_expiry <= 1 && !o.is_expired).length} expiring soon
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferFilters;