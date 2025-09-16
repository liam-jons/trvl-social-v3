/**
 * Connection Service
 * Manages user connections, recommendations, and relationship building post-adventure
 */

import { supabase } from '../lib/supabase';
import { compatibilityService } from './compatibility-service';
import { logger } from '../utils/logger.js';

export class ConnectionService {
  constructor() {
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.connectionCache = new Map();
  }

  /**
   * Send a connection request to another user
   */
  async sendConnectionRequest(recipientId, message = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if connection already exists
      const existingConnection = await this.getConnectionStatus(user.id, recipientId);
      if (existingConnection) {
        throw new Error('Connection already exists or request pending');
      }

      // Insert connection request
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          recipient_id: recipientId,
          message,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.invalidateConnectionCache(user.id);
      this.invalidateConnectionCache(recipientId);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Respond to a connection request (accept/decline)
   */
  async respondToConnectionRequest(requestId, response, message = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!['accepted', 'declined'].includes(response)) {
        throw new Error('Invalid response. Must be "accepted" or "declined"');
      }

      // Update connection request
      const { data: request, error: requestError } = await supabase
        .from('connection_requests')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('recipient_id', user.id)
        .select()
        .single();

      if (requestError) throw requestError;

      if (response === 'accepted') {
        // Create mutual connections
        const connections = [
          {
            user_id: request.requester_id,
            connected_user_id: request.recipient_id,
            status: 'accepted',
            connection_strength: 0.5,
            interaction_count: 0
          },
          {
            user_id: request.recipient_id,
            connected_user_id: request.requester_id,
            status: 'accepted',
            connection_strength: 0.5,
            interaction_count: 0
          }
        ];

        const { error: connectionError } = await supabase
          .from('community_connections')
          .insert(connections);

        if (connectionError) throw connectionError;

        // Update engagement scores
        await this.updateEngagementScores([request.requester_id, request.recipient_id]);
      }

      // Clear cache
      this.invalidateConnectionCache(request.requester_id);
      this.invalidateConnectionCache(request.recipient_id);

      return {
        success: true,
        data: { request, response }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get connection status between two users
   */
  async getConnectionStatus(userId1, userId2) {
    try {
      // Check existing connection
      const { data: connection } = await supabase
        .from('community_connections')
        .select('*')
        .or(`and(user_id.eq.${userId1},connected_user_id.eq.${userId2}),and(user_id.eq.${userId2},connected_user_id.eq.${userId1})`)
        .eq('status', 'accepted')
        .single();

      if (connection) {
        return {
          type: 'connected',
          status: 'accepted',
          connection
        };
      }

      // Check pending requests
      const { data: request } = await supabase
        .from('connection_requests')
        .select('*')
        .or(`and(requester_id.eq.${userId1},recipient_id.eq.${userId2}),and(requester_id.eq.${userId2},recipient_id.eq.${userId1})`)
        .eq('status', 'pending')
        .single();

      if (request) {
        return {
          type: 'request',
          status: 'pending',
          request
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user's connections with filtering and pagination
   */
  async getUserConnections(userId, options = {}) {
    try {
      const {
        search = '',
        sortBy = 'recent',
        limit = 20,
        offset = 0,
        includeProfile = true
      } = options;

      let query = supabase
        .from('community_connections')
        .select(`
          *,
          ${includeProfile ? `
            connected_profile:profiles!community_connections_connected_user_id_fkey (
              id,
              first_name,
              last_name,
              avatar_url,
              location
            )
          ` : ''}
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      // Apply search filter
      if (search && includeProfile) {
        query = query.or(`connected_profile.first_name.ilike.%${search}%,connected_profile.last_name.ilike.%${search}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('last_interaction', { ascending: false, nullsFirst: false });
          break;
        case 'strength':
          query = query.order('connection_strength', { ascending: false });
          break;
        case 'alphabetical':
          query = query.order('created_at', { ascending: true });
          break;
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      return {
        success: true,
        data,
        pagination: {
          limit,
          offset,
          hasMore: data.length === limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get pending connection requests for a user
   */
  async getPendingRequests(userId, type = 'received') {
    try {
      const field = type === 'received' ? 'recipient_id' : 'requester_id';
      const profileField = type === 'received' ? 'requester_profile' : 'recipient_profile';
      const profileKey = type === 'received' ? 'connection_requests_requester_id_fkey' : 'connection_requests_recipient_id_fkey';

      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          *,
          ${profileField}:profiles!${profileKey} (
            id,
            first_name,
            last_name,
            avatar_url,
            location
          )
        `)
        .eq(field, userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Generate connection recommendations based on compatibility and shared experiences
   */
  async getConnectionRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        includeCompatibility = true,
        filterConnected = true
      } = options;

      // Get user's existing connections if filtering
      let connectedUserIds = [];
      if (filterConnected) {
        const connections = await this.getUserConnections(userId, { includeProfile: false });
        if (connections.success) {
          connectedUserIds = connections.data.map(conn => conn.connected_user_id);
        }
      }

      // Get users who were in the same groups/adventures
      const { data: sharedAdventures, error: adventureError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          group:groups!inner (
            id,
            adventure_id,
            status
          ),
          other_members:group_members!inner (
            user_id,
            profile:profiles (
              id,
              first_name,
              last_name,
              avatar_url,
              location
            )
          )
        `)
        .eq('user_id', userId)
        .neq('other_members.user_id', userId)
        .in('group.status', ['completed', 'active']);

      if (adventureError) throw adventureError;

      // Aggregate potential connections
      const potentialConnections = new Map();

      sharedAdventures?.forEach(adventure => {
        adventure.other_members?.forEach(member => {
          if (member.user_id === userId) return;
          if (filterConnected && connectedUserIds.includes(member.user_id)) return;

          const existing = potentialConnections.get(member.user_id);
          potentialConnections.set(member.user_id, {
            ...member,
            sharedAdventures: (existing?.sharedAdventures || 0) + 1,
            groups: [...(existing?.groups || []), adventure.group_id]
          });
        });
      });

      // Calculate compatibility scores if requested
      const recommendations = [];
      for (const [userId2, connection] of potentialConnections) {
        let compatibilityScore = null;

        if (includeCompatibility) {
          try {
            const result = await compatibilityService.calculateCompatibility({
              user1Id: userId,
              user2Id: userId2,
              options: { cacheResult: true }
            });

            if (result.success) {
              compatibilityScore = result.data;
            }
          } catch (error) {
          }
        }

        recommendations.push({
          ...connection,
          compatibilityScore,
          recommendationScore: this.calculateRecommendationScore(connection, compatibilityScore)
        });
      }

      // Sort by recommendation score and limit
      recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
      const limitedRecommendations = recommendations.slice(0, limit);

      return {
        success: true,
        data: limitedRecommendations
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Calculate recommendation score based on shared adventures and compatibility
   */
  calculateRecommendationScore(connection, compatibilityScore) {
    let score = 0;

    // Base score from shared adventures
    score += connection.sharedAdventures * 20;

    // Boost for multiple group interactions
    if (connection.sharedAdventures > 1) {
      score += 10;
    }

    // Add compatibility score if available
    if (compatibilityScore) {
      score += compatibilityScore.overallScore * 0.5;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Get mutual connections between two users
   */
  async getMutualConnections(userId1, userId2) {
    try {
      const { data, error } = await supabase
        .from('community_connections')
        .select(`
          connected_user_id,
          profile:profiles!community_connections_connected_user_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('user_id', userId1)
        .eq('status', 'accepted')
        .in('connected_user_id',
          supabase
            .from('community_connections')
            .select('connected_user_id')
            .eq('user_id', userId2)
            .eq('status', 'accepted')
        );

      if (error) throw error;

      return {
        success: true,
        data,
        count: data.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Track connection interaction (message, adventure booking, etc.)
   */
  async trackInteraction(userId1, userId2, interactionType = 'general') {
    try {
      // Update interaction count and last interaction for both connections
      const updates = [
        {
          user_id: userId1,
          connected_user_id: userId2
        },
        {
          user_id: userId2,
          connected_user_id: userId1
        }
      ];

      for (const update of updates) {
        await supabase
          .from('community_connections')
          .update({
            interaction_count: supabase.raw('interaction_count + 1'),
            last_interaction: new Date().toISOString(),
            connection_strength: supabase.raw('LEAST(connection_strength + 0.01, 1.0)')
          })
          .eq('user_id', update.user_id)
          .eq('connected_user_id', update.connected_user_id)
          .eq('status', 'accepted');
      }

      // Clear cache
      this.invalidateConnectionCache(userId1);
      this.invalidateConnectionCache(userId2);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection activity feed
   */
  async getConnectionActivity(userId, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      // Get connections' recent activities
      const { data: activities, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_user_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          reactions:post_reactions (
            reaction_type,
            user_id
          ),
          comments_preview:post_comments (
            id,
            content,
            user_id,
            created_at,
            author:profiles!post_comments_user_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .in('user_id',
          supabase
            .from('community_connections')
            .select('connected_user_id')
            .eq('user_id', userId)
            .eq('status', 'accepted')
        )
        .in('visibility', ['public', 'friends'])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: activities,
        pagination: {
          limit,
          offset,
          hasMore: activities.length === limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Block/unblock a user
   */
  async blockUser(userId, block = true) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (block) {
        // Remove existing connection if any
        await supabase
          .from('community_connections')
          .delete()
          .or(`and(user_id.eq.${user.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${user.id})`);

        // Cancel any pending requests
        await supabase
          .from('connection_requests')
          .update({ status: 'cancelled' })
          .or(`and(requester_id.eq.${user.id},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${user.id})`)
          .eq('status', 'pending');

        // Create block entry
        await supabase
          .from('community_connections')
          .insert({
            user_id: user.id,
            connected_user_id: userId,
            status: 'blocked'
          });
      } else {
        // Remove block
        await supabase
          .from('community_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('connected_user_id', userId)
          .eq('status', 'blocked');
      }

      // Clear cache
      this.invalidateConnectionCache(user.id);
      this.invalidateConnectionCache(userId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update engagement scores for users
   */
  async updateEngagementScores(userIds) {
    try {
      for (const userId of userIds) {
        const { data: connections } = await supabase
          .from('community_connections')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'accepted');

        await supabase
          .from('engagement_scores')
          .upsert({
            user_id: userId,
            total_connections: connections?.length || 0,
            last_calculated: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      }
    } catch (error) {
    }
  }

  /**
   * Cache management
   */
  invalidateConnectionCache(userId) {
    const keysToDelete = [];
    for (const key of this.connectionCache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.connectionCache.delete(key));
  }

  getCacheStats() {
    return {
      size: this.connectionCache.size,
      timeout: this.cacheTimeout
    };
  }
}

// Export singleton instance
export const connectionService = new ConnectionService();