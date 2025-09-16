/**
 * Connections List Component
 * Display and manage user's connections with search and filtering
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import GlassInput from '../ui/GlassInput';
import { connectionService } from '../../services/connection-service';
import { supabase } from '../../lib/supabase';
import {
  Search,
  MessageCircle,
  MoreVertical,
  Users,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';
const ConnectionsList = ({ onUpdate }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  useEffect(() => {
    loadConnections(true);
  }, [sortBy]);
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== '') {
        loadConnections(true);
      } else {
        loadConnections(true);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);
  const loadConnections = async (reset = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentPage = reset ? 0 : page;
      const limit = 10;
      const result = await connectionService.getUserConnections(user.id, {
        search: searchTerm,
        sortBy,
        limit,
        offset: currentPage * limit,
        includeProfile: true
      });
      if (result.success) {
        if (reset) {
          setConnections(result.data);
          setPage(0);
        } else {
          setConnections(prev => [...prev, ...result.data]);
        }
        setHasMore(result.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadConnections(false);
  };
  const handleStartConversation = async (connectionId) => {
    // Navigate to chat or open messaging interface
    console.log('Start conversation with:', connectionId);
  };
  const handleViewProfile = (userId) => {
    // Navigate to user profile
    console.log('View profile:', userId);
  };
  const formatLastInteraction = (lastInteraction) => {
    if (!lastInteraction) return 'No recent activity';
    const date = new Date(lastInteraction);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
  };
  const getConnectionStrengthColor = (strength) => {
    if (strength >= 0.8) return 'text-green-600';
    if (strength >= 0.6) return 'text-blue-600';
    if (strength >= 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };
  const getConnectionStrengthLabel = (strength) => {
    if (strength >= 0.8) return 'Strong';
    if (strength >= 0.6) return 'Good';
    if (strength >= 0.4) return 'Growing';
    return 'New';
  };
  if (loading && connections.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <GlassInput
            icon={Search}
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Recent Activity</option>
            <option value="strength">Connection Strength</option>
            <option value="alphabetical">Name A-Z</option>
          </select>
        </div>
      </div>
      {/* Connections List */}
      {connections.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No connections yet</h3>
              <p className="text-gray-600">
                Start building your travel network by joining adventures and sending connection requests.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <Card key={connection.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={connection.connected_profile?.avatar_url || '/default-avatar.png'}
                    alt={`${connection.connected_profile?.first_name} ${connection.connected_profile?.last_name}`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                    connection.connection_strength >= 0.8 ? 'bg-green-500' :
                    connection.connection_strength >= 0.6 ? 'bg-blue-500' :
                    connection.connection_strength >= 0.4 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {connection.connected_profile?.first_name} {connection.connected_profile?.last_name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getConnectionStrengthColor(connection.connection_strength)} bg-gray-100`}>
                      {getConnectionStrengthLabel(connection.connection_strength)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    {connection.connected_profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{connection.connected_profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatLastInteraction(connection.last_interaction)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{connection.interaction_count} interactions</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartConversation(connection.connected_user_id)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewProfile(connection.connected_user_id)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
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
                {loading ? 'Loading...' : 'Load More Connections'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ConnectionsList;