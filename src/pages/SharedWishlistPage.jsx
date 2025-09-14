import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WishlistService } from '../services/wishlist-service';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdventureCard from '../components/adventure/AdventureCard';
import {
  HeartIcon,
  UserIcon,
  FolderIcon,
  EyeIcon,
  ShareIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const SharedWishlistPage = () => {
  const { shareId } = useParams();
  const [wishlistData, setWishlistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSharedWishlist = async () => {
      try {
        setLoading(true);
        const { data, error } = await WishlistService.getPublicWishlist(shareId);

        if (error) {
          setError('Wishlist not found or is private');
          return;
        }

        setWishlistData(data);
      } catch (error) {
        console.error('Error loading shared wishlist:', error);
        setError('Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadSharedWishlist();
    }
  }, [shareId]);

  const handleAdventureClick = (adventure) => {
    window.location.href = `/adventures/${adventure.id}`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !wishlistData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <FolderIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Wishlist Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {error || 'This wishlist doesn\'t exist or has been made private.'}
            </p>
            <Link
              to="/adventures"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Browse Adventures
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
          <GlassCard variant="light">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Collection Info */}
              <div className="flex items-start gap-4">
                {wishlistData.user?.avatar_url ? (
                  <img
                    src={wishlistData.user.avatar_url}
                    alt={wishlistData.user.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{wishlistData.user?.full_name || 'Anonymous User'}</span>
                    <span>•</span>
                    <EyeIcon className="w-4 h-4" />
                    <span>Public Collection</span>
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
                    <FolderIcon className="w-8 h-8 text-blue-500" />
                    {wishlistData.name}
                  </h1>

                  {wishlistData.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {wishlistData.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <HeartIcon className="w-4 h-4" />
                      <span>{wishlistData.wishlists?.length || 0} adventures</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        Created {new Date(wishlistData.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    // Could add notification here
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <ShareIcon className="w-4 h-4" />
                  Share
                </button>

                <Link
                  to="/adventures"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Explore Adventures
                </Link>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Adventures Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {wishlistData.wishlists && wishlistData.wishlists.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlistData.wishlists.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdventureCard
                    adventure={item.adventure}
                    viewMode="grid"
                    onClick={() => handleAdventureClick(item.adventure)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <GlassCard variant="light" className="text-center py-16">
              <HeartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Adventures Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This collection doesn't have any saved adventures yet.
              </p>
              <Link
                to="/adventures"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Discover Adventures
              </Link>
            </GlassCard>
          )}
        </motion.div>

        {/* Call to Action */}
        {wishlistData.wishlists && wishlistData.wishlists.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <GlassCard variant="light" className="text-center py-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Inspired by this collection?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create your own wishlist and start planning your next adventure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/adventures"
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Browse Adventures
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SharedWishlistPage;