import React, { useState } from 'react';
import { Filter, X, Calendar, MapPin, Users, DollarSign, Activity, Clock } from 'lucide-react';

const RecommendationFilters = ({
  availableFilters,
  activeFilters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(activeFilters || {});

  const handleFilterChange = (category, value, isChecked) => {
    const newFilters = { ...localFilters };

    if (!newFilters[category]) {
      newFilters[category] = [];
    }

    if (isChecked) {
      if (!newFilters[category].includes(value)) {
        newFilters[category] = [...newFilters[category], value];
      }
    } else {
      newFilters[category] = newFilters[category].filter(item => item !== value);
      if (newFilters[category].length === 0) {
        delete newFilters[category];
      }
    }

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (field, value) => {
    const newFilters = { ...localFilters };
    if (!newFilters.dateRange) {
      newFilters.dateRange = {};
    }

    newFilters.dateRange[field] = value;

    if (!newFilters.dateRange.startDate && !newFilters.dateRange.endDate) {
      delete newFilters.dateRange;
    }

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleBudgetRangeChange = (field, value) => {
    const newFilters = { ...localFilters };
    if (!newFilters.budgetRange) {
      newFilters.budgetRange = {};
    }

    newFilters.budgetRange[field] = parseInt(value) || 0;

    if (!newFilters.budgetRange.min && !newFilters.budgetRange.max) {
      delete newFilters.budgetRange;
    }

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(localFilters).forEach(filterValue => {
      if (Array.isArray(filterValue)) {
        count += filterValue.length;
      } else if (typeof filterValue === 'object' && filterValue !== null) {
        count += Object.keys(filterValue).length;
      } else if (filterValue) {
        count += 1;
      }
    });
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Filter Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter size={20} className="mr-2 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
            {activeCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {activeCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <X size={16} className="mr-1" />
                Clear all
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      {!isExpanded && activeCount === 0 && (
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-3">Quick filters:</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('compatibilityLevel', 'excellent', true)}
              className="px-3 py-1 text-sm border border-gray-200 rounded-full hover:bg-gray-50"
            >
              Excellent matches
            </button>
            <button
              onClick={() => handleFilterChange('adventureType', 'cultural-immersion', true)}
              className="px-3 py-1 text-sm border border-gray-200 rounded-full hover:bg-gray-50"
            >
              Cultural
            </button>
            <button
              onClick={() => handleFilterChange('adventureType', 'adventure-sports', true)}
              className="px-3 py-1 text-sm border border-gray-200 rounded-full hover:bg-gray-50"
            >
              Adventure Sports
            </button>
            <button
              onClick={() => handleFilterChange('groupSizes', 'Small group', true)}
              className="px-3 py-1 text-sm border border-gray-200 rounded-full hover:bg-gray-50"
            >
              Small groups
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeCount > 0 && !isExpanded && (
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-2">Active filters:</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(localFilters).map(([category, values]) => {
              if (Array.isArray(values)) {
                return values.map(value => (
                  <span
                    key={`${category}-${value}`}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {value}
                    <button
                      onClick={() => handleFilterChange(category, value, false)}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ));
              } else if (typeof values === 'object' && values !== null) {
                return Object.entries(values).map(([subKey, subValue]) => (
                  <span
                    key={`${category}-${subKey}`}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {category} {subKey}: {subValue}
                    <button
                      onClick={() => {
                        const newFilters = { ...localFilters };
                        delete newFilters[category][subKey];
                        if (Object.keys(newFilters[category]).length === 0) {
                          delete newFilters[category];
                        }
                        setLocalFilters(newFilters);
                        onFiltersChange(newFilters);
                      }}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ));
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Date Range */}
          <div>
            <div className="flex items-center mb-3">
              <Calendar size={16} className="mr-2 text-gray-600" />
              <label className="font-medium text-gray-900">Date Range</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={localFilters.dateRange?.startDate || ''}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={localFilters.dateRange?.endDate || ''}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <div className="flex items-center mb-3">
              <DollarSign size={16} className="mr-2 text-gray-600" />
              <label className="font-medium text-gray-900">Budget Range (USD)</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Min Budget</label>
                <input
                  type="number"
                  placeholder="500"
                  value={localFilters.budgetRange?.min || ''}
                  onChange={(e) => handleBudgetRangeChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Budget</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={localFilters.budgetRange?.max || ''}
                  onChange={(e) => handleBudgetRangeChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Destinations */}
          {availableFilters?.destinations && availableFilters.destinations.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <MapPin size={16} className="mr-2 text-gray-600" />
                <label className="font-medium text-gray-900">Destinations</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableFilters.destinations.slice(0, 8).map(destination => (
                  <label key={destination} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.destinations?.includes(destination) || false}
                      onChange={(e) => handleFilterChange('destinations', destination, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 truncate" title={destination}>
                      {destination}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Group Sizes */}
          {availableFilters?.groupSizes && availableFilters.groupSizes.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <Users size={16} className="mr-2 text-gray-600" />
                <label className="font-medium text-gray-900">Group Sizes</label>
              </div>
              <div className="space-y-2">
                {availableFilters.groupSizes.map(size => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.groupSizes?.includes(size) || false}
                      onChange={(e) => handleFilterChange('groupSizes', size, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          {availableFilters?.durations && availableFilters.durations.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <Clock size={16} className="mr-2 text-gray-600" />
                <label className="font-medium text-gray-900">Duration</label>
              </div>
              <div className="space-y-2">
                {availableFilters.durations.map(duration => (
                  <label key={duration} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.durations?.includes(duration) || false}
                      onChange={(e) => handleFilterChange('durations', duration, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{duration}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {availableFilters?.activities && availableFilters.activities.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <Activity size={16} className="mr-2 text-gray-600" />
                <label className="font-medium text-gray-900">Activities</label>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableFilters.activities.map(activity => (
                  <label key={activity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.activities?.includes(activity) || false}
                      onChange={(e) => handleFilterChange('activities', activity, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {activity.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility Level */}
          <div>
            <label className="font-medium text-gray-900 mb-3 block">Minimum Compatibility</label>
            <div className="space-y-2">
              {[
                { value: 'excellent', label: 'Excellent (80%+)', color: 'text-green-700' },
                { value: 'good', label: 'Good (60%+)', color: 'text-blue-700' },
                { value: 'fair', label: 'Fair (40%+)', color: 'text-yellow-700' },
                { value: 'any', label: 'Any compatibility', color: 'text-gray-700' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="compatibilityLevel"
                    value={option.value}
                    checked={localFilters.compatibilityLevel === option.value}
                    onChange={(e) => {
                      const newFilters = { ...localFilters };
                      if (e.target.value === 'any') {
                        delete newFilters.compatibilityLevel;
                      } else {
                        newFilters.compatibilityLevel = e.target.value;
                      }
                      setLocalFilters(newFilters);
                      onFiltersChange(newFilters);
                    }}
                    className="mr-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${option.color}`}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationFilters;