import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, AlertCircle, Loader2, Users } from 'lucide-react';

import RecommendationCard from './components/RecommendationCard';
import RecommendationFilters from './components/RecommendationFilters';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

import { recommendationEngine } from './utils/recommendationEngine';
import { mockGroups, mockUserProfile } from './utils/mockGroupsData';

const RecommendationsPage = () => {
  // State management
  const [userProfile, setUserProfile] = useState(mockUserProfile);
  const [recommendations, setRecommendations] = useState([]);
  const [availableFilters, setAvailableFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCompatibleGroups, setTotalCompatibleGroups] = useState(0);

  // Recommendation loading function for infinite scroll
  const fetchMoreRecommendations = useCallback(async ({ page, pageSize }) => {
    try {
      const result = await recommendationEngine.getRecommendations(
        userProfile,
        mockGroups,
        {
          page,
          limit: pageSize,
          filters: activeFilters,
          includeExplanations: true,
          forceRecalculation: false
        }
      );

      // Add new recommendations to existing ones
      if (page === 0) {
        setRecommendations(result.recommendations);
        setAvailableFilters(result.filters);
        setTotalCompatibleGroups(result.totalCompatibleGroups);
      } else {
        setRecommendations(prev => [...prev, ...result.recommendations]);
      }

      return {
        hasMore: result.pagination.hasNext,
        nextPage: result.pagination.currentPage + 1,
        data: result.recommendations
      };
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      throw err;
    }
  }, [userProfile, activeFilters]);

  // Infinite scroll hook
  const {
    isLoading: isLoadingMore,
    hasNextPage,
    currentPage,
    error: scrollError,
    reset,
    canLoadMore
  } = useInfiniteScroll(fetchMoreRecommendations, {
    pageSize: 10,
    enabled: true,
    threshold: 300
  });

  // Initial load
  useEffect(() => {
    const loadInitialRecommendations = async () => {
      setIsInitialLoading(true);
      setError(null);

      try {
        await fetchMoreRecommendations({ page: 0, pageSize: 10 });
      } catch (err) {
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialRecommendations();
  }, []); // Only run on mount

  // Handle filter changes
  const handleFiltersChange = useCallback(async (newFilters) => {
    setActiveFilters(newFilters);
    setIsInitialLoading(true);
    setError(null);

    // Reset infinite scroll and reload with new filters
    reset();

    try {
      const result = await recommendationEngine.getRecommendations(
        userProfile,
        mockGroups,
        {
          page: 0,
          limit: 10,
          filters: newFilters,
          includeExplanations: true,
          forceRecalculation: false
        }
      );

      setRecommendations(result.recommendations);
      setAvailableFilters(result.filters);
      setTotalCompatibleGroups(result.totalCompatibleGroups);
    } catch (err) {
      setError(err.message || 'Failed to apply filters');
    } finally {
      setIsInitialLoading(false);
    }
  }, [userProfile, reset]);

  // Handle search
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      // Reset to show all recommendations
      handleFiltersChange(activeFilters);
      return;
    }

    // Filter recommendations by search query
    const filteredRecommendations = recommendations.filter(rec =>
      rec.title.toLowerCase().includes(query.toLowerCase()) ||
      rec.description.toLowerCase().includes(query.toLowerCase()) ||
      rec.destination.toLowerCase().includes(query.toLowerCase()) ||
      rec.activities?.some(activity =>
        activity.toLowerCase().includes(query.toLowerCase())
      )
    );

    setRecommendations(filteredRecommendations);
  }, [recommendations, activeFilters, handleFiltersChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    handleFiltersChange({});
    setSearchQuery('');
  }, [handleFiltersChange]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    reset();

    try {
      const result = await recommendationEngine.getRecommendations(
        userProfile,
        mockGroups,
        {
          page: 0,
          limit: 10,
          filters: activeFilters,
          includeExplanations: true,
          forceRecalculation: true // Force recalculation on refresh
        }
      );

      setRecommendations(result.recommendations);
      setAvailableFilters(result.filters);
      setTotalCompatibleGroups(result.totalCompatibleGroups);
    } catch (err) {
      setError(err.message || 'Failed to refresh recommendations');
    } finally {
      setIsInitialLoading(false);
    }
  }, [userProfile, activeFilters, reset]);

  // Handle group actions
  const handleViewDetails = useCallback((group) => {
    console.log('View details for group:', group.id);
    // Navigate to group details page
    // In a real app: navigate(`/groups/${group.id}`);
  }, []);

  const handleJoinGroup = useCallback((group) => {
    console.log('Join group:', group.id);
    // Handle join group logic
    // In a real app: show join modal or navigate to join flow
  }, []);

  // Loading state
  if (isInitialLoading && recommendations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 size={40} className="mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Finding your perfect travel companions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && recommendations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Recommendations
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshRecommendations}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Group Recommendations
        </h1>
        <p className="text-gray-600">
          Discover travel groups that match your personality and preferences
        </p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            <span>{totalCompatibleGroups} compatible groups found</span>
          </div>
          <div>
            Showing {recommendations.length} recommendations
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups by destination, activities, or keywords..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={refreshRecommendations}
          disabled={isInitialLoading}
          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50"
        >
          <RefreshCw size={18} className={`mr-2 ${isInitialLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <RecommendationFilters
            availableFilters={availableFilters}
            activeFilters={activeFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={clearAllFilters}
          />
        </div>

        {/* Recommendations List */}
        <div className="flex-1">
          {recommendations.length === 0 && !isInitialLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Users size={48} className="mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No groups found
                </h3>
                <p>
                  Try adjusting your filters or search criteria to find more groups
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {/* Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {recommendations.map((group) => (
                  <RecommendationCard
                    key={group.id}
                    group={group}
                    compatibilityData={group.compatibilityData}
                    rankingScore={group.rankingScore}
                    explanation={group.explanation}
                    onViewDetails={handleViewDetails}
                    onJoinGroup={handleJoinGroup}
                  />
                ))}
              </div>

              {/* Loading More */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Loading more recommendations...</span>
                </div>
              )}

              {/* Load More Error */}
              {scrollError && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
                    <p className="text-red-600 mb-2">Failed to load more recommendations</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Refresh page
                    </button>
                  </div>
                </div>
              )}

              {/* End of Results */}
              {!hasNextPage && !isLoadingMore && recommendations.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    You've seen all available recommendations.
                  </p>
                  <button
                    onClick={refreshRecommendations}
                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Refresh to see new groups
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      {recommendations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div>Total groups: {mockGroups.length}</div>
            <div>Compatible groups: {totalCompatibleGroups}</div>
            <div>Showing: {recommendations.length}</div>
            {canLoadMore && (
              <div>More available: {hasNextPage ? 'Yes' : 'No'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;