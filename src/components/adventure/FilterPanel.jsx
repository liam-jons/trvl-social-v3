import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import './FilterPanel.css';
import {
  ChevronDownIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TagIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Footprints, Waves, Building, Plane, TreePine, Building2, Camera, Heart } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { useGeolocation } from '../../hooks/useGeolocation';

const FilterPanel = ({
  onFiltersChange,
  className = '',
  totalCount = 0
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { location: userLocation, requestLocation } = useGeolocation();

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    dates: false,
    price: false,
    adventureType: false,
    groupSize: false
  });

  // Filter state - initialize from URL params
  const [filters, setFilters] = useState(() => ({
    location: searchParams.get('location') || 'all',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    priceMin: parseInt(searchParams.get('priceMin')) || 0,
    priceMax: parseInt(searchParams.get('priceMax')) || 5000,
    adventureTypes: searchParams.get('adventureTypes')?.split(',').filter(Boolean) || [],
    groupSize: searchParams.get('groupSize') || 'all'
  }));

  // Adventure type options
  const adventureTypeOptions = [
    { id: 'hiking', name: 'Hiking & Trekking', iconComponent: Footprints },
    { id: 'water-sports', name: 'Water Sports', iconComponent: Waves },
    { id: 'cultural', name: 'Cultural', iconComponent: Building },
    { id: 'extreme', name: 'Extreme Sports', iconComponent: Plane },
    { id: 'wildlife', name: 'Nature & Wildlife', iconComponent: TreePine },
    { id: 'urban', name: 'Urban Exploration', iconComponent: Building2 },
    { id: 'photography', name: 'Photography', iconComponent: Camera },
    { id: 'wellness', name: 'Wellness & Retreat', iconComponent: Heart }
  ];

  // Group size options
  const groupSizeOptions = [
    { id: 'all', name: 'Any Size', description: 'No preference' },
    { id: 'solo', name: 'Solo', description: '1 person' },
    { id: 'couple', name: 'Couple', description: '2 people' },
    { id: 'small', name: 'Small Group', description: '3-6 people' },
    { id: 'large', name: 'Large Group', description: '7+ people' }
  ];

  // Location options
  const locationOptions = [
    { id: 'all', name: 'Anywhere', description: 'No location preference' },
    { id: 'local', name: 'Local', description: 'Within 50 miles', requiresLocation: true },
    { id: 'regional', name: 'Regional', description: 'Within 500 miles', requiresLocation: true },
    { id: 'global', name: 'Global', description: 'Worldwide destinations' }
  ];

  // Update URL params when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();

    if (filters.location !== 'all') newParams.set('location', filters.location);
    if (filters.startDate) newParams.set('startDate', filters.startDate);
    if (filters.endDate) newParams.set('endDate', filters.endDate);
    if (filters.priceMin > 0) newParams.set('priceMin', filters.priceMin.toString());
    if (filters.priceMax < 5000) newParams.set('priceMax', filters.priceMax.toString());
    if (filters.adventureTypes.length > 0) newParams.set('adventureTypes', filters.adventureTypes.join(','));
    if (filters.groupSize !== 'all') newParams.set('groupSize', filters.groupSize);

    setSearchParams(newParams);
    onFiltersChange(filters);
  }, [filters, onFiltersChange, setSearchParams]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  }, []);

  // Update filter value
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle adventure type toggle
  const toggleAdventureType = useCallback((typeId) => {
    setFilters(prev => ({
      ...prev,
      adventureTypes: prev.adventureTypes.includes(typeId)
        ? prev.adventureTypes.filter(id => id !== typeId)
        : [...prev.adventureTypes, typeId]
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      location: 'all',
      startDate: '',
      endDate: '',
      priceMin: 0,
      priceMax: 5000,
      adventureTypes: [],
      groupSize: 'all'
    };
    setFilters(defaultFilters);
  }, []);

  // Get active filters for pill display
  const activeFilters = useMemo(() => {
    const active = [];

    if (filters.location !== 'all') {
      const locationOption = locationOptions.find(opt => opt.id === filters.location);
      active.push({
        key: 'location',
        label: locationOption?.name || filters.location,
        value: filters.location
      });
    }

    if (filters.startDate) {
      active.push({
        key: 'startDate',
        label: `From: ${new Date(filters.startDate).toLocaleDateString()}`,
        value: filters.startDate
      });
    }

    if (filters.endDate) {
      active.push({
        key: 'endDate',
        label: `Until: ${new Date(filters.endDate).toLocaleDateString()}`,
        value: filters.endDate
      });
    }

    if (filters.priceMin > 0) {
      active.push({
        key: 'priceMin',
        label: `Min: $${filters.priceMin}`,
        value: filters.priceMin
      });
    }

    if (filters.priceMax < 5000) {
      active.push({
        key: 'priceMax',
        label: `Max: $${filters.priceMax}`,
        value: filters.priceMax
      });
    }

    filters.adventureTypes.forEach(typeId => {
      const typeOption = adventureTypeOptions.find(opt => opt.id === typeId);
      if (typeOption) {
        active.push({
          key: 'adventureTypes',
          label: typeOption.name,
          value: typeId
        });
      }
    });

    if (filters.groupSize !== 'all') {
      const groupSizeOption = groupSizeOptions.find(opt => opt.id === filters.groupSize);
      active.push({
        key: 'groupSize',
        label: groupSizeOption?.name || filters.groupSize,
        value: filters.groupSize
      });
    }

    return active;
  }, [filters]);

  // Remove individual filter
  const removeFilter = useCallback((filterKey, filterValue) => {
    switch (filterKey) {
      case 'location':
        updateFilter('location', 'all');
        break;
      case 'startDate':
        updateFilter('startDate', '');
        break;
      case 'endDate':
        updateFilter('endDate', '');
        break;
      case 'priceMin':
        updateFilter('priceMin', 0);
        break;
      case 'priceMax':
        updateFilter('priceMax', 5000);
        break;
      case 'adventureTypes':
        toggleAdventureType(filterValue);
        break;
      case 'groupSize':
        updateFilter('groupSize', 'all');
        break;
      default:
        break;
    }
  }, [updateFilter, toggleAdventureType]);

  // Format currency
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Active Filters Pills */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard variant="light" className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Active Filters ({activeFilters.length}):
                </span>
                {activeFilters.map((filter, index) => (
                  <motion.button
                    key={`${filter.key}-${filter.value}-${index}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => removeFilter(filter.key, filter.value)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-sm rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    {filter.label}
                    <XMarkIcon className="h-3 w-3" />
                  </motion.button>
                ))}
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline ml-2"
                >
                  Clear all
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Sections */}
      <GlassCard variant="light" className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {totalCount} adventures
            </span>
          </div>
        </div>

        {/* Location Filter */}
        <div className="border-0">
          <button
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Location</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.location ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.location && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {locationOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="location"
                        value={option.id}
                        checked={filters.location === option.id}
                        onChange={(e) => updateFilter('location', e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                      {option.requiresLocation && !userLocation && (
                        <button
                          onClick={requestLocation}
                          className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                          Enable location
                        </button>
                      )}
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date Range Filter */}
        <div className="border-0">
          <button
            onClick={() => toggleSection('dates')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Trip Dates</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.dates ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.dates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => updateFilter('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      min={filters.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => updateFilter('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Range Filter */}
        <div className="border-0">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Price Range</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.price ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.price && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {/* Price Range Display */}
                  <div className="text-center">
                    <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(filters.priceMin)} - {formatCurrency(filters.priceMax)}
                    </span>
                  </div>

                  {/* Dual Range Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={50}
                      value={filters.priceMin}
                      onChange={(e) => updateFilter('priceMin', Math.min(parseInt(e.target.value), filters.priceMax - 50))}
                      className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-min"
                    />
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={50}
                      value={filters.priceMax}
                      onChange={(e) => updateFilter('priceMax', Math.max(parseInt(e.target.value), filters.priceMin + 50))}
                      className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-max"
                    />
                  </div>

                  {/* Manual Input */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Price
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={filters.priceMax - 50}
                        step={50}
                        value={filters.priceMin}
                        onChange={(e) => updateFilter('priceMin', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Price
                      </label>
                      <input
                        type="number"
                        min={filters.priceMin + 50}
                        max={5000}
                        step={50}
                        value={filters.priceMax}
                        onChange={(e) => updateFilter('priceMax', Math.min(5000, parseInt(e.target.value) || 5000))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Adventure Type Filter */}
        <div className="border-0">
          <button
            onClick={() => toggleSection('adventureType')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <TagIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Adventure Type</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.adventureType ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.adventureType && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {adventureTypeOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.adventureTypes.includes(option.id)}
                        onChange={() => toggleAdventureType(option.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <option.iconComponent className="w-5 h-5" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.name}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Group Size Filter */}
        <div className="border-0">
          <button
            onClick={() => toggleSection('groupSize')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Group Size</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.groupSize ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.groupSize && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {groupSizeOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="groupSize"
                        value={option.id}
                        checked={filters.groupSize === option.id}
                        onChange={(e) => updateFilter('groupSize', e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
};

export default FilterPanel;