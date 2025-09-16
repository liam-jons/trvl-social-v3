import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { WishlistService } from '../services/wishlist-service';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdventureCard from '../components/adventure/AdventureCard';
import FavoriteButton from '../components/wishlist/FavoriteButton';
import WishlistStats from '../components/wishlist/WishlistStats';
import CollectionModal from '../components/wishlist/CollectionModal';
import ExportModal from '../components/wishlist/ExportModal';
import {
  HeartIcon,
  PlusIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FolderIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
const WishlistPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date_added_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // Load wishlist data
  const loadWishlistData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Load wishlist items
      const collectionId = selectedCollection === 'all' ? null : selectedCollection;
      const { data: items, error: itemsError } = await WishlistService.getUserWishlist(user.id, {
        collectionId
      });
      if (itemsError) {
        console.error('Error loading wishlist:', itemsError);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load your wishlist'
        });
        return;
      }
      // Load collections
      const { data: collectionData, error: collectionsError } = await WishlistService.getUserCollections(user.id);
      if (collectionsError) {
        console.error('Error loading collections:', collectionsError);
      } else {
        setCollections(collectionData || []);
      }
      setWishlistItems(items || []);
    } catch (error) {
      console.error('Error loading wishlist data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load wishlist data'
      });
    } finally {
      setLoading(false);
    }
  }, [user, selectedCollection, addNotification]);
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlistData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadWishlistData]);
  // Filter and sort wishlist items
  const filteredAndSortedItems = wishlistItems
    .filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.adventure?.title?.toLowerCase().includes(query) ||
        item.adventure?.location?.toLowerCase().includes(query) ||
        item.adventure?.description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_added_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date_added_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'price_low':
          return a.adventure.price - b.adventure.price;
        case 'price_high':
          return b.adventure.price - a.adventure.price;
        case 'rating':
          return b.adventure.rating - a.adventure.rating;
        case 'alphabetical':
          return a.adventure.title.localeCompare(b.adventure.title);
        default:
          return 0;
      }
    });
  const handleAdventureClick = (adventure) => {
    window.location.href = `/adventures/${adventure.id}`;
  };
  const handleFavoriteToggle = (adventureId, isFavorited) => {
    if (!isFavorited) {
      // Remove from local state
      setWishlistItems(prev => prev.filter(item => item.adventure_id !== adventureId));
    }
  };
  const handleCreateCollection = async (name, description, isPrivate) => {
    try {
      const { data, error } = await WishlistService.createCollection(user.id, name, description, isPrivate);
      if (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to create collection'
        });
        return;
      }
      setCollections(prev => [data, ...prev]);
      setShowCollectionModal(false);
      addNotification({
        type: 'success',
        title: 'Collection Created',
        message: `"${name}" collection has been created`
      });
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };
  const handleExport = async (format) => {
    try {
      const collectionId = selectedCollection === 'all' ? null : selectedCollection;
      const { data, filename, mimeType, error } = await WishlistService.exportWishlist(
        user.id,
        format,
        collectionId
      );
      if (error) {
        addNotification({
          type: 'error',
          title: 'Export Failed',
          message: 'Failed to export wishlist'
        });
        return;
      }
      // Download file
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Your wishlist has been exported successfully'
      });
    } catch (error) {
      console.error('Error exporting wishlist:', error);
    }
  };
  const toggleSelection = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  const selectAll = () => {
    setSelectedItems(filteredAndSortedItems.map(item => item.id));
  };
  const clearSelection = () => {
    setSelectedItems([]);
  };
  // Loading state
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  // Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <HeartIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Sign In to View Your Wishlist
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Save your favorite adventures and organize them into collections.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <HeartIcon className="w-8 h-8 text-red-500" />
                My Wishlist
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {filteredAndSortedItems.length} saved adventure{filteredAndSortedItems.length !== 1 ? 's' : ''}
                {selectedCollection !== 'all' && (
                  <span className="ml-2">
                    in "{collections.find(c => c.id === selectedCollection)?.name}"
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                title="Export wishlist"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCollectionModal(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                title="Create collection"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`p-2 transition-colors ${
                  isSelectionMode
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title="Selection mode"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
        {/* Stats */}
        <WishlistStats userId={user?.id} className="mb-8" />
        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard variant="light" className="space-y-4">
            {/* Search and Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search saved adventures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {/* View Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-white/20 dark:border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/20'
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/20'
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[180px]"
              >
                <option value="date_added_desc">Recently Added</option>
                <option value="date_added_asc">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="alphabetical">A to Z</option>
              </select>
            </div>
            {/* Collection Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCollection('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCollection === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/20'
                }`}
              >
                All Items ({wishlistItems.length})
              </button>
              {collections.map(collection => (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCollection === collection.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/20'
                  }`}
                >
                  <FolderIcon className="w-4 h-4" />
                  {collection.name}
                  <span className="text-xs opacity-75">
                    ({collection.wishlists_count?.length || 0})
                  </span>
                </button>
              ))}
            </div>
            {/* Selection Actions */}
            {isSelectionMode && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <button
                    onClick={selectAll}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
                  >
                    Clear Selection
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedItems.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">
                    Remove Selected
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {filteredAndSortedItems.length === 0 ? (
            <GlassCard variant="light" className="text-center py-16">
              <HeartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No matching adventures' : 'Your wishlist is empty'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start saving adventures you love to build your perfect trip collection.'
                }
              </p>
              {!searchQuery && (
                <Link
                  to="/adventures"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Browse Adventures
                </Link>
              )}
            </GlassCard>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              <AnimatePresence>
                {filteredAndSortedItems.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className="w-5 h-5 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    )}
                    <AdventureCard
                      adventure={item.adventure}
                      viewMode={viewMode}
                      onClick={() => handleAdventureClick(item.adventure)}
                    />
                    {/* Collection Badge */}
                    {item.collection && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        {item.collection.name}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
      {/* Modals */}
      <CollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        onCreate={handleCreateCollection}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        collectionName={
          selectedCollection === 'all'
            ? 'All Items'
            : collections.find(c => c.id === selectedCollection)?.name
        }
      />
    </div>
  );
};
export default WishlistPage;