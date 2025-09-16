import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeolocation } from '../../hooks/useGeolocation';
import { locationService } from '../../services/location-service';
import { contentRankingService } from '../../services/content-ranking-service';
import { engagementScoringService } from '../../services/engagement-scoring-service';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LocationFilter from './LocationFilter';
import LocationSettings from './LocationSettings';
import PostCreator from './posts/PostCreator';
import TrendingContent from './TrendingContent';
import EngagementAnalyticsDashboard from './EngagementAnalyticsDashboard';
import GlassModal from '../ui/GlassModal';

const CommunityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { location: userLocation } = useGeolocation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('global');
  const [sortBy, setSortBy] = useState('relevance');
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [selectedPostAnalytics, setSelectedPostAnalytics] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);

  // Load user preferences on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;

      try {
        const prefs = await locationService.getLocationPreferences(user.id);
        setUserPreferences(prefs);
        setActiveFilter(prefs.default_filter || 'global');
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        setActiveFilter('global');
      }
    };

    loadUserPreferences();
  }, [user]);

  // Load posts when filter or sort changes
  useEffect(() => {
    loadPosts();
  }, [activeFilter, sortBy, userLocation]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      if (!user) {
        // For non-authenticated users, use basic location filtering
        const filterConfig = {
          type: activeFilter,
          userLocation: userLocation,
          radius: activeFilter === 'local' ? 50 : activeFilter === 'regional' ? 500 : null
        };

        const { posts: fetchedPosts } = await locationService.getLocationFilteredPosts(
          filterConfig,
          { limit: 20, offset: 0 }
        );

        setPosts(fetchedPosts);
      } else {
        // For authenticated users, use intelligent content ranking
        const result = await contentRankingService.generatePersonalizedFeed(user.id, {
          limit: 20,
          offset: 0,
          location: activeFilter === 'local' ? userLocation?.city :
                   activeFilter === 'regional' ? userLocation?.state : null,
          sortBy: sortBy,
          includeConnections: true,
          diversityWeight: 0.3
        });

        if (result.success) {
          setPosts(result.data);
        } else {
          console.error('Failed to load personalized feed:', result.error);
          // Fallback to basic location filtering
          const filterConfig = {
            type: activeFilter,
            userLocation: userLocation,
            radius: activeFilter === 'local' ? 50 : activeFilter === 'regional' ? 500 : null
          };

          const { posts: fetchedPosts } = await locationService.getLocationFilteredPosts(
            filterConfig,
            { limit: 20, offset: 0 }
          );

          setPosts(fetchedPosts);
        }
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter.type);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handlePostReaction = async (postId, reactionType) => {
    if (!user) return;

    try {
      // Track reaction and update engagement scores
      await engagementScoringService.trackPostInteraction(postId, user.id, 'reaction', {
        reactionType
      });

      // Refresh posts to show updated engagement
      loadPosts();
    } catch (error) {
      console.error('Failed to track reaction:', error);
    }
  };

  const handlePostSave = async (postId) => {
    if (!user) return;

    try {
      // Track save action
      await engagementScoringService.trackPostInteraction(postId, user.id, 'save');

      // Refresh posts
      loadPosts();
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const handlePostShare = async (postId) => {
    if (!user) return;

    try {
      // Track share action
      await engagementScoringService.trackPostInteraction(postId, user.id, 'share');

      // Refresh posts
      loadPosts();
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant', icon: '🎯' },
    { value: 'recent', label: 'Most Recent', icon: '⏰' },
    { value: 'trending', label: 'Trending', icon: '🔥' }
  ];

  const handleCreatePost = async (postData) => {
    try {
      // Add user location to post if available and sharing is enabled
      const locationData = {
        ...postData,
        user_id: user.id,
        location: userPreferences?.location_sharing !== 'private' ? userLocation : null
      };

      await locationService.createPostWithLocation(locationData);
      setShowPostCreator(false);

      // Reload posts to show the new post
      loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error; // Re-throw to let PostCreator handle the error display
    }
  };

  const PostCard = ({ post }) => (
    <GlassCard className="mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {post.profiles?.first_name?.charAt(0) || post.profiles?.username?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {post.profiles?.first_name && post.profiles?.last_name
                ? `${post.profiles.first_name} ${post.profiles.last_name}`
                : post.profiles?.username || 'Anonymous'
              }
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(post.created_at).toLocaleDateString()}
              {activeFilter !== 'global' && post.location && (
                <span className="ml-2 text-blue-500">
                  • {activeFilter === 'local' ? 'Nearby' : 'Regional'}
                </span>
              )}
            </div>
          </div>
        </div>

        {post.category && (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
            {post.category}
          </span>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {post.title}
        </h3>
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* Post Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Post Interactions - Meaningful engagement actions */}
      <div className="pt-4 border-t border-white/10">
        {/* Engagement Score Display */}
        {user && post.scores && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Engagement: {Math.round(post.scores.engagement || 0)}</span>
              <span>Quality: {Math.round(post.scores.quality || 0)}</span>
              {post.finalScore && (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Score: {Math.round(post.finalScore)}
                </span>
              )}
            </div>
            {user && (post.user_id === user.id || user.role === 'admin') && (
              <button
                onClick={() => setSelectedPostAnalytics(post.id)}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                View Analytics
              </button>
            )}
          </div>
        )}

        {/* Main Interaction Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Reaction Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                <span className="text-lg">👍</span>
                <span className="text-sm">{post.reactions?.length || 0}</span>
              </button>

              {/* Reaction Options (simplified for now) */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-x-1">
                {['👍', '❤️', '💡', '😮', '😢'].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePostReaction(post.id, ['like', 'love', 'helpful', 'wow', 'sad'][idx])}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">{post.comments?.length || 0}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button */}
            {user && (
              <button
                onClick={() => handlePostSave(post.id)}
                className="flex items-center gap-1 text-gray-500 hover:text-purple-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-sm">Save</span>
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={() => handlePostShare(post.id)}
              className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Community Feed
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            {activeFilter === 'local' && userLocation
              ? 'Posts within 50 miles of your location'
              : activeFilter === 'regional' && userLocation
                ? 'Posts within 500 miles of your location'
                : 'Posts from travelers worldwide'
            }
          </p>
        </div>

        <div className="flex gap-2">
          <GlassButton
            onClick={() => setShowTrending(true)}
            variant="secondary"
            size="sm"
          >
            <span className="text-sm mr-1">🔥</span>
            Trending
          </GlassButton>

          <GlassButton
            onClick={() => setShowLocationSettings(true)}
            variant="secondary"
            size="sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </GlassButton>

          {user && (
            <GlassButton
              onClick={() => setShowPostCreator(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
              size="sm"
            >
              Create Post
            </GlassButton>
          )}
        </div>
      </div>

      {/* Location Filter */}
      <LocationFilter
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Sort Controls (only for authenticated users with personalized feed) */}
      {user && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Sort by:
            </span>
            <div className="flex gap-2">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-blue-500/20'
                  }`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Posts Feed */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <GlassCard key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-300/20 rounded-full"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-300/20 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300/20 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300/20 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300/20 rounded"></div>
                  <div className="h-4 bg-gray-300/20 rounded w-1/2"></div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <GlassCard className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {activeFilter === 'global'
                ? 'Be the first to share something with the community!'
                : 'No posts found in your area. Try expanding your search or switch to Global view.'
              }
            </p>
            {user && (
              <GlassButton
                onClick={() => setShowPostCreator(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Create First Post
              </GlassButton>
            )}
          </GlassCard>
        )}
      </div>

      {/* Post Creator Modal */}
      <GlassModal
        isOpen={showPostCreator}
        onClose={() => setShowPostCreator(false)}
        title="Create New Post"
      >
        <PostCreator
          onSubmit={handleCreatePost}
          onCancel={() => setShowPostCreator(false)}
        />
      </GlassModal>

      {/* Location Settings Modal */}
      <GlassModal
        isOpen={showLocationSettings}
        onClose={() => setShowLocationSettings(false)}
        title="Location Settings"
      >
        <LocationSettings
          onClose={() => setShowLocationSettings(false)}
        />
      </GlassModal>

      {/* Trending Content Modal */}
      <GlassModal
        isOpen={showTrending}
        onClose={() => setShowTrending(false)}
        title="Trending Content"
        size="lg"
      >
        <TrendingContent
          timeWindow={24}
          limit={15}
          showControls={true}
        />
      </GlassModal>

      {/* Post Analytics Modal */}
      {selectedPostAnalytics && (
        <GlassModal
          isOpen={!!selectedPostAnalytics}
          onClose={() => setSelectedPostAnalytics(null)}
          title="Post Analytics"
          size="xl"
        >
          <EngagementAnalyticsDashboard
            postId={selectedPostAnalytics}
            isAuthor={user && posts.find(p => p.id === selectedPostAnalytics)?.user_id === user.id}
          />
        </GlassModal>
      )}
    </div>
  );
};

export default CommunityFeed;