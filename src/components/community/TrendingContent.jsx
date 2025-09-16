import { useState, useEffect } from 'react';
import { engagementScoringService } from '../../services/engagement-scoring-service';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const TrendingContent = ({ timeWindow = 24, limit = 10, showControls = true }) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(timeWindow);

  const timeWindows = [
    { value: 1, label: 'Last Hour' },
    { value: 6, label: 'Last 6 Hours' },
    { value: 24, label: 'Last 24 Hours' },
    { value: 168, label: 'Last Week' }
  ];

  useEffect(() => {
    loadTrendingContent();
  }, [selectedTimeWindow, limit]);

  const loadTrendingContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await engagementScoringService.getTrendingContent({
        timeWindow: selectedTimeWindow,
        limit,
        minEngagementThreshold: 5
      });

      if (result.success) {
        setTrending(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score) => Math.round(score * 100) / 100;

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = (now - time) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getTrendingIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '📈';
    }
  };

  const getTrendingColor = (index) => {
    switch (index) {
      case 0: return 'text-yellow-600 dark:text-yellow-400';
      case 1: return 'text-gray-600 dark:text-gray-400';
      case 2: return 'text-orange-600 dark:text-orange-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300/20 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-gray-300/10 rounded-lg">
              <div className="w-12 h-12 bg-gray-300/20 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300/20 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🔥</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Trending Content
          </h2>
        </div>
        <GlassButton onClick={loadTrendingContent} size="sm" variant="secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </GlassButton>
      </div>

      {/* Time Window Controls */}
      {showControls && (
        <div className="flex flex-wrap gap-2 mb-6">
          {timeWindows.map(window => (
            <button
              key={window.value}
              onClick={() => setSelectedTimeWindow(window.value)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedTimeWindow === window.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-blue-500/20'
              }`}
            >
              {window.label}
            </button>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Trending Content
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <GlassButton onClick={loadTrendingContent} size="sm">
            Try Again
          </GlassButton>
        </div>
      )}

      {/* Trending Posts */}
      {!error && (
        <div className="space-y-4">
          {trending.length > 0 ? (
            trending.map((post, index) => (
              <TrendingPostCard
                key={post.id}
                post={post}
                rank={index + 1}
                icon={getTrendingIcon(index)}
                rankColor={getTrendingColor(index)}
                formatScore={formatScore}
                formatTimeAgo={formatTimeAgo}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Trending Content
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                No content is trending in the selected time window.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      {trending.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Based on engagement velocity and quality scores. Updated every 30 minutes.
          </p>
        </div>
      )}
    </GlassCard>
  );
};

const TrendingPostCard = ({ post, rank, icon, rankColor, formatScore, formatTimeAgo }) => {
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getAuthorDisplayName = (author) => {
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author.username || 'Anonymous';
  };

  return (
    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg hover:shadow-lg transition-all duration-200">
      {/* Rank */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <span className="text-xl mb-1">{icon}</span>
        <span className={`text-sm font-bold ${rankColor}`}>#{rank}</span>
      </div>

      {/* Author Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {post.author?.first_name?.charAt(0) || post.author?.username?.charAt(0) || 'U'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author and Time */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {getAuthorDisplayName(post.author)}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">•</span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {formatTimeAgo(post.created_at)}
          </span>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <div
            className="text-gray-900 dark:text-white text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: truncateText(post.content.replace(/<[^>]*>/g, ''))
            }}
          />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Engagement Metrics */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <span>💬</span>
            <span>{post.comments?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>👥</span>
            <span>{post.reactions?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>📈</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {formatScore(post.trendingScore)}
            </span>
          </div>
        </div>
      </div>

      {/* Trending Score Badge */}
      <div className="flex-shrink-0">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          {formatScore(post.velocityScore)}
        </div>
      </div>
    </div>
  );
};

export default TrendingContent;