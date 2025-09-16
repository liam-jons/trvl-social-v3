/**
 * Mutual Connections Component
 * Display mutual connections between users
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { connectionService } from '../../services/connection-service';
import { supabase } from '../../lib/supabase';
import { Users, UserPlus } from 'lucide-react';

const MutualConnections = ({ userId, className = '' }) => {
  const [mutualConnections, setMutualConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (userId) {
      loadMutualConnections();
    }
  }, [userId]);

  const loadMutualConnections = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === userId) {
        setLoading(false);
        return;
      }

      const result = await connectionService.getMutualConnections(user.id, userId);

      if (result.success) {
        setMutualConnections(result.data);
      }
    } catch (error) {
      console.error('Error loading mutual connections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  if (mutualConnections.length === 0) {
    return null;
  }

  const displayConnections = expanded ? mutualConnections : mutualConnections.slice(0, 3);
  const hasMore = mutualConnections.length > 3;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Users className="h-4 w-4" />
        <span>{mutualConnections.length} mutual connection{mutualConnections.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {displayConnections.map((connection) => (
          <div
            key={connection.connected_user_id}
            className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1"
          >
            <img
              src={connection.profile?.avatar_url || '/default-avatar.png'}
              alt={connection.profile?.first_name}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-xs text-gray-700">
              {connection.profile?.first_name}
            </span>
          </div>
        ))}

        {hasMore && !expanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="text-xs text-blue-600 p-1 h-auto"
          >
            +{mutualConnections.length - 3} more
          </Button>
        )}

        {expanded && hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            className="text-xs text-blue-600 p-1 h-auto"
          >
            Show less
          </Button>
        )}
      </div>
    </div>
  );
};

export default MutualConnections;