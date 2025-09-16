/**
 * Connection Recommendations Component
 * Smart recommendations based on compatibility and shared adventures
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { connectionService } from '../../services/connection-service';
import { supabase } from '../../lib/supabase';
import {
  UserPlus,
  Users,
  MapPin,
  Star,
  Heart,
  Zap,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const ConnectionRecommendations = ({ onUpdate }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await connectionService.getConnectionRecommendations(user.id, {
        limit: 15,
        includeCompatibility: true,
        filterConnected: true
      });

      if (result.success) {
        setRecommendations(result.data);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (recipientId, message = '') => {
    try {
      setSendingRequest(recipientId);

      const result = await connectionService.sendConnectionRequest(recipientId, message);

      if (result.success) {
        // Remove from recommendations
        setRecommendations(prev => prev.filter(rec => rec.user_id !== recipientId));
        onUpdate?.();
      } else {
        console.error('Failed to send request:', result.error);
      }
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSendingRequest(null);
    }
  };

  const getCompatibilityColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getCompatibilityLabel = (score) => {
    if (!score) return 'Unknown';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  const getRecommendationIcon = (score) => {
    if (score >= 80) return <Sparkles className="h-4 w-4 text-purple-500" />;
    if (score >= 60) return <Star className="h-4 w-4 text-yellow-500" />;
    if (score >= 40) return <Heart className="h-4 w-4 text-pink-500" />;
    return <Users className="h-4 w-4 text-blue-500" />;
  };

  const RecommendationCard = ({ recommendation }) => {
    const compatibilityScore = recommendation.compatibilityScore?.overallScore;

    return (
      <Card className="p-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
        <div className="flex items-start gap-4">
          {/* Avatar with recommendation badge */}
          <div className="relative">
            <img
              src={recommendation.profile?.avatar_url || '/default-avatar.png'}
              alt={`${recommendation.profile?.first_name} ${recommendation.profile?.last_name}`}
              className="h-16 w-16 rounded-full object-cover"
            />
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
              {getRecommendationIcon(recommendation.recommendationScore)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">
                {recommendation.profile?.first_name} {recommendation.profile?.last_name}
              </h3>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {Math.round(recommendation.recommendationScore)}% match
              </span>
            </div>

            {recommendation.profile?.location && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="h-4 w-4" />
                <span>{recommendation.profile.location}</span>
              </div>
            )}

            {/* Recommendation reasons */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">
                  {recommendation.sharedAdventures} shared adventure{recommendation.sharedAdventures !== 1 ? 's' : ''}
                </span>
              </div>

              {compatibilityScore && (
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-700">
                    <span className={getCompatibilityColor(compatibilityScore)}>
                      {getCompatibilityLabel(compatibilityScore)}
                    </span> compatibility ({compatibilityScore}%)
                  </span>
                </div>
              )}
            </div>

            {/* Compatibility breakdown */}
            {recommendation.compatibilityScore?.dimensions && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(recommendation.compatibilityScore.dimensions).map(([key, dim]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">
                        {key.replace('_', ' ')}:
                      </span>
                      <span className={getCompatibilityColor(dim.score)}>
                        {Math.round(dim.score)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleSendRequest(recommendation.user_id)}
                disabled={sendingRequest === recommendation.user_id}
                className="flex items-center gap-2"
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
                {sendingRequest === recommendation.user_id ? 'Sending...' : 'Connect'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
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
          <h2 className="text-xl font-semibold text-gray-900">Recommended Connections</h2>
          <p className="text-gray-600">People you might know based on shared adventures and compatibility</p>
        </div>
        <Button
          variant="outline"
          onClick={loadRecommendations}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No recommendations yet</h3>
              <p className="text-gray-600">
                Join more adventures to get personalized connection recommendations!
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.user_id}
              recommendation={recommendation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectionRecommendations;