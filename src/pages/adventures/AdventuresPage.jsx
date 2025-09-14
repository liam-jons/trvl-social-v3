import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapView, MapboxProvider } from '../../components/adventure';
import AdventureList from '../../components/adventure/AdventureList';
import FilterPanel from '../../components/adventure/FilterPanel';
import { mockAdventures, adventureCategories } from '../../data/mock-adventures';
import GlassCard from '../../components/ui/GlassCard';
import { EyeIcon, MapIcon } from '@heroicons/react/24/outline';

const AdventuresPage = () => {
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    startDate: '',
    endDate: '',
    priceMin: 0,
    priceMax: 5000,
    adventureTypes: [],
    groupSize: 'all',
    // Legacy filters for backward compatibility
    duration: '',
    difficulty: ''
  });

  // Simulate loading adventures
  useEffect(() => {
    const loadAdventures = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAdventures(mockAdventures);
      setLoading(false);
    };

    loadAdventures();
  }, []);

  const handleAdventureClick = (adventure) => {
    // Navigate to adventure detail page
    window.location.href = `/adventures/${adventure.id}`;
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setFilters(prev => ({ ...prev, category }));
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'map' : 'list');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">
            Discover Adventures
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Embark on extraordinary journeys and create unforgettable memories with our curated adventure experiences.
          </p>
        </motion.div>

        {/* Search Bar and View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard variant="light" className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search adventures by name, location, or activity..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all min-w-[100px] ${
                    showFilters
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/20'
                  }`}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-w-[160px]"
                >
                  <option value="featured">Featured First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="duration">Duration</option>
                  <option value="alphabetical">A to Z</option>
                </select>

                {/* View Toggle */}
                <button
                  onClick={toggleViewMode}
                  className="px-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2"
                >
                  {viewMode === 'list' ? (
                    <>
                      <MapIcon className="h-5 w-5" />
                      Map
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-5 w-5" />
                      List
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {adventureCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${selectedCategory === category.id
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/20'
                    }
                  `}
                >
                  {category.name}
                  {category.id !== 'all' && (
                    <span className="ml-1 text-xs opacity-75">
                      ({category.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.2 }}
              className="lg:w-80 flex-shrink-0"
            >
              <FilterPanel
                onFiltersChange={handleFiltersChange}
                totalCount={adventures.length}
                className="sticky top-4"
              />
            </motion.div>
          )}

          {/* Adventure Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            {viewMode === 'list' ? (
              <AdventureList
                adventures={adventures}
                loading={loading}
                onAdventureClick={handleAdventureClick}
                filters={filters}
                searchQuery={searchQuery}
                sortBy={sortBy}
              />
            ) : (
              <GlassCard variant="light" className="p-0 overflow-hidden">
                <MapboxProvider>
                  <MapView
                    adventures={adventures}
                    onAdventureSelect={handleAdventureClick}
                    height="600px"
                    showLocationSearch={false}
                    showDrawControls={false}
                    allowClustering={true}
                  />
                </MapboxProvider>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdventuresPage;
