import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WishlistService } from '../../services/wishlist-service';
import GlassCard from '../ui/GlassCard';
import { HeartIcon, FolderIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const WishlistStats = ({ userId, className = '' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;

      try {
        const { data, error } = await WishlistService.getWishlistStats(userId);

        if (error) {
          console.error('Error loading wishlist stats:', error);
          return;
        }

        setStats(data);
      } catch (error) {
        console.error('Error loading wishlist stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  if (loading || !stats) {
    return (
      <div className={`${className}`}>
        <GlassCard variant="light">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  const statItems = [
    {
      icon: HeartIcon,
      label: 'Total Saved',
      value: stats.totalItems,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      icon: FolderIcon,
      label: 'Collections',
      value: stats.totalCollections,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: ClockIcon,
      label: 'Recent Activity',
      value: stats.recentActivity?.length || 0,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: CurrencyDollarIcon,
      label: 'Est. Total Value',
      value: '$0',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    }
  ];

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard variant="light">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="text-center"
              >
                <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default WishlistStats;