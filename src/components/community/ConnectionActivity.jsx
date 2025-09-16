/**
 * Connection Activity Component
 * Display activity feed from user's connections
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { connectionService } from '../../services/connection-service';
import { supabase } from '../../lib/supabase';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Calendar,
  Users,
  Camera,
  RefreshCw,
  Eye
} from 'lucide-react';
const ConnectionActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  useEffect(() => {
    loadActivity(true);
  }, []);
  const loadActivity = async (reset = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentPage = reset ? 0 : page;
      const limit = 10;
      const result = await connectionService.getConnectionActivity(user.id, {
        limit,
        offset: currentPage * limit
      });
      if (result.success) {
        if (reset) {
          setActivities(result.data);
          setPage(0);
        } else {
          setActivities(prev => [...prev, ...result.data]);
        }
        setHasMore(result.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadActivity(false);
  };
  const handleLikePost = async (postId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Toggle like
      const { data: existingReaction } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction_type', 'like')
        .single();
      if (existingReaction) {
        // Remove like
        await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReaction.id);
        // Update local state
        setActivities(prev => prev.map(activity => {
          if (activity.id === postId) {
            return {
              ...activity,
              likes_count: Math.max(0, activity.likes_count - 1),
              reactions: activity.reactions.filter(r => !(r.user_id === user.id && r.reaction_type === 'like'))
            };
          }
          return activity;
        }));
      } else {
        // Add like
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: 'like'
          });
        // Update local state
        setActivities(prev => prev.map(activity => {
          if (activity.id === postId) {
            return {
              ...activity,
              likes_count: activity.likes_count + 1,
              reactions: [...activity.reactions, { user_id: user.id, reaction_type: 'like' }]
            };
          }
          return activity;
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString();
    }
  };
  const ActivityPost = ({ activity }) => {
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
      const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      };
      getUser();
    }, []);
    const hasLiked = activity.reactions?.some(r => r.user_id === currentUser?.id && r.reaction_type === 'like');
    return (
      <Card className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <img
              src={activity.author?.avatar_url || '/default-avatar.png'}
              alt={`${activity.author?.first_name} ${activity.author?.last_name}`}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">
                  {activity.author?.first_name} {activity.author?.last_name}
                </h4>
                <span className="text-sm text-gray-500">{formatTimeAgo(activity.created_at)}</span>
              </div>
              {activity.location && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>
          </div>
          {/* Content */}
          <div className="space-y-3">
            <p className="text-gray-800 leading-relaxed">{activity.content}</p>
            {/* Media */}
            {activity.media_urls && activity.media_urls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {activity.media_urls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {activity.media_urls.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{activity.media_urls.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Tags */}
            {activity.tags && activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activity.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikePost(activity.id)}
                className={`flex items-center gap-2 ${hasLiked ? 'text-red-500' : 'text-gray-600'}`}
              >
                <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                <span>{activity.likes_count}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{activity.comments_count}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600"
              >
                <Share2 className="h-4 w-4" />
                <span>{activity.shares_count}</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          </div>
          {/* Recent Comments Preview */}
          {activity.comments_preview && activity.comments_preview.length > 0 && (
            <div className="space-y-2 pt-2">
              {activity.comments_preview.slice(0, 2).map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 text-sm">
                  <img
                    src={comment.author?.avatar_url || '/default-avatar.png'}
                    alt={comment.author?.first_name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {comment.author?.first_name}
                    </span>
                    <span className="text-gray-700 ml-2">{comment.content}</span>
                  </div>
                </div>
              ))}
              {activity.comments_count > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 p-0 h-auto"
                >
                  View all {activity.comments_count} comments
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };
  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Connection Activity</h2>
          <p className="text-gray-600">See what your connections are up to</p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadActivity(true)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      {/* Activity Feed */}
      {activities.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No activity yet</h3>
              <p className="text-gray-600">
                Connect with fellow travelers to see their adventure updates!
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityPost key={activity.id} activity={activity} />
          ))}
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? 'Loading...' : 'Load More Activity'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ConnectionActivity;