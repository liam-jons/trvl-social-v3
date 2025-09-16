import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  EyeIcon,
  FunnelIcon,
  ClockIcon,
  CheckBadgeIcon,
  CameraIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { mockVendors, vendorCategories, vendorLocations, priceRanges } from '../../data/mock-vendors';

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Load vendors data
  useEffect(() => {
    const loadVendors = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setVendors(mockVendors);
      setFilteredVendors(mockVendors);
      setLoading(false);
    };

    loadVendors();
  }, []);

  // Filter and search vendors
  useEffect(() => {
    let filtered = [...vendors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(query) ||
        vendor.location.toLowerCase().includes(query) ||
        vendor.description.toLowerCase().includes(query) ||
        vendor.categories.some(cat => cat.toLowerCase().includes(query)) ||
        vendor.adventureTypes.some(type => type.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vendor =>
        vendor.categories.some(cat =>
          cat.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }

    // Location filter
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(vendor =>
        vendor.location.includes(selectedLocation)
      );
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const priceRange = priceRanges.find(range => range.id === selectedPriceRange);
      if (priceRange) {
        filtered = filtered.filter(vendor => {
          // Extract price from vendor.priceRange string like "$1000-$2000"
          const priceMatch = vendor.priceRange.match(/\$(\d+)-\$(\d+)/);
          if (priceMatch) {
            const minPrice = parseInt(priceMatch[1]);
            const maxPrice = parseInt(priceMatch[2]);
            return (minPrice >= priceRange.min && minPrice <= priceRange.max) ||
                   (maxPrice >= priceRange.min && maxPrice <= priceRange.max);
          }
          return true;
        });
      }
    }

    // Rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(vendor => vendor.rating >= selectedRating);
    }

    // Sort vendors
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'location':
        filtered.sort((a, b) => a.location.localeCompare(b.location));
        break;
      case 'featured':
      default:
        // Keep original order for featured
        break;
    }

    setFilteredVendors(filtered);
    setCurrentPage(1);
  }, [vendors, searchQuery, selectedCategory, selectedLocation, selectedPriceRange, selectedRating, sortBy]);

  const handleVendorClick = (vendor) => {
    window.location.href = `/vendors/${vendor.id}`;
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocation('All Locations');
    setSelectedPriceRange('all');
    setSelectedRating(0);
    setSortBy('featured');
  };

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);

  const VendorCard = ({ vendor }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <GlassCard
        variant="light"
        className="h-full cursor-pointer transition-all duration-300 hover:shadow-xl"
        onClick={() => handleVendorClick(vendor)}
      >
        {/* Vendor Cover Image */}
        <div className="relative h-48 -m-6 mb-4 rounded-t-xl overflow-hidden">
          <img
            src={vendor.coverImage}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Vendor Avatar */}
          <div className="absolute bottom-4 left-4">
            <div className="relative">
              <img
                src={vendor.avatar}
                alt={vendor.name}
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {vendor.verified && (
                <CheckBadgeIcon className="absolute -top-1 -right-1 w-6 h-6 text-blue-500 bg-white rounded-full" />
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-4 right-4 flex flex-wrap gap-1">
            {vendor.badges.slice(0, 2).map((badge, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Vendor Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
              {vendor.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="w-4 h-4" />
              {vendor.location}
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {vendor.description}
          </p>

          {/* Rating and Reviews */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(vendor.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {vendor.rating}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({vendor.reviewCount})
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {vendor.priceRange}
            </div>
          </div>

          {/* Adventure Types */}
          <div className="flex flex-wrap gap-1">
            {vendor.adventureTypes.slice(0, 3).map((type, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
              >
                {type}
              </span>
            ))}
            {vendor.adventureTypes.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{vendor.adventureTypes.length - 3}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200/20 dark:border-gray-700/30">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <CameraIcon className="w-3 h-3" />
                {vendor.adventureCount} adventures
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {vendor.responseTime}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVendorClick(vendor);
              }}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-full transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  const FilterSection = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="lg:w-80 flex-shrink-0"
    >
      <GlassCard variant="light" className="sticky top-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear All
          </button>
        </div>

        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {vendorCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {vendorLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price Range
            </label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priceRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Rating
            </label>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1, 0].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    checked={selectedRating === rating}
                    onChange={(e) => setSelectedRating(Number(e.target.value))}
                    className="mr-2"
                  />
                  <div className="flex items-center gap-1">
                    {rating === 0 ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400">Any Rating</span>
                    ) : (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">& up</span>
                      </>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading vendors..." />
      </div>
    );
  }

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
            Discover Vendors
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with trusted adventure providers and expert guides from around the world.
          </p>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard variant="light" className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name, location, or speciality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all min-w-[100px] flex items-center gap-2 ${
                    showFilters
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[160px]"
                >
                  <option value="featured">Featured First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="name">Name A-Z</option>
                  <option value="location">Location</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredVendors.length)} of {filteredVendors.length} vendors
              </span>
              {(searchQuery || selectedCategory !== 'all' || selectedLocation !== 'All Locations' || selectedPriceRange !== 'all' || selectedRating > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          {showFilters && <FilterSection />}

          {/* Vendors Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            {filteredVendors.length === 0 ? (
              <GlassCard variant="light" className="text-center py-12">
                <EyeIcon className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No vendors found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search criteria or filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </GlassCard>
            ) : (
              <>
                {/* Vendors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {currentVendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <GlassCard variant="light" className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                currentPage === page
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 3 ||
                          page === currentPage + 3
                        ) {
                          return (
                            <span key={page} className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      Next
                    </button>
                  </GlassCard>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorsPage;
