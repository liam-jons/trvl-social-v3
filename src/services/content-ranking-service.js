/**
 * Content Ranking Service
 * Provides intelligent content ranking and feed generation without traditional social metrics
 */

import { supabase } from '../lib/supabase';
import { engagementScoringService } from './engagement-scoring-service';

export class ContentRankingService {
  constructor() {
    this.feedCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Generate a ranked feed for a user based on multiple factors
   */
  async generatePersonalizedFeed(userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        location = null,
        categories = [],
        sortBy = 'relevance', // relevance, recent, trending
        includeConnections = true,
        diversityWeight = 0.3
      } = options;

      const cacheKey = `feed_${userId}_${JSON.stringify(options)}`;
      const cached = this.feedCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Get user context
      const userContext = await this.getUserContext(userId);

      // Build content query based on preferences
      const posts = await this.fetchRelevantContent(userId, userContext, {
        limit: limit * 2, // Fetch more for better ranking
        offset,
        location,
        categories,
        includeConnections
      });

      // Rank content based on multiple factors
      const rankedPosts = await this.rankContent(posts, userId, userContext, {
        sortBy,
        diversityWeight
      });

      // Apply final filtering and limiting
      const finalFeed = rankedPosts.slice(0, limit);

      const result = {
        success: true,
        data: finalFeed,
        ranking: {
          algorithm: sortBy,
          diversityWeight,
          userContext: {
            connectionCount: userContext.connections.length,
            interestCount: userContext.interests.length,
            hasLocation: !!userContext.location
          }
        },
        pagination: {
          limit,
          offset,
          hasMore: rankedPosts.length > limit
        },
        generatedAt: new Date().toISOString()
      };

      // Cache result
      this.feedCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Error generating personalized feed:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get user context for personalization
   */
  async getUserContext(userId) {
    try {
      const [userProfile, connections, interests, engagementData] = await Promise.all([
        // User profile
        supabase
          .from('profiles')
          .select('location, preferences, created_at')
          .eq('id', userId)
          .single(),

        // User connections
        supabase
          .from('community_connections')
          .select('connected_user_id, connection_strength')
          .eq('user_id', userId)
          .eq('status', 'accepted'),

        // User interests from past interactions
        this.inferUserInterests(userId),

        // User engagement history
        supabase
          .from('engagement_scores')
          .select('*')
          .eq('user_id', userId)
          .single()
      ]);

      return {
        location: userProfile.data?.location || null,
        preferences: userProfile.data?.preferences || {},
        accountAge: userProfile.data?.created_at ?
          (Date.now() - new Date(userProfile.data.created_at)) / (1000 * 60 * 60 * 24) : 0,
        connections: connections.data || [],
        interests: interests,
        engagementLevel: engagementData.data?.engagement_score || 0
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        location: null,
        preferences: {},
        accountAge: 0,
        connections: [],
        interests: [],
        engagementLevel: 0
      };
    }
  }

  /**
   * Infer user interests from past interactions
   */
  async inferUserInterests(userId) {
    try {
      // Get tags from posts user has reacted to or commented on
      const { data: interactedPosts } = await supabase
        .from('post_reactions')
        .select(`
          post:community_posts(tags, content)
        `)
        .eq('user_id', userId)
        .not('post.tags', 'is', null);

      const { data: commentedPosts } = await supabase
        .from('post_comments')
        .select(`
          post:community_posts(tags, content)
        `)
        .eq('user_id', userId)
        .not('post.tags', 'is', null);

      // Extract and count tags
      const tagCounts = {};
      [...(interactedPosts || []), ...(commentedPosts || [])].forEach(item => {
        if (item.post?.tags) {
          item.post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Return top interests
      return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

    } catch (error) {
      console.error('Error inferring user interests:', error);
      return [];
    }
  }

  /**
   * Fetch relevant content based on user context
   */
  async fetchRelevantContent(userId, userContext, options) {
    try {
      const {
        limit,
        offset,
        location,
        categories,
        includeConnections
      } = options;

      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_user_id_fkey(
            id, first_name, last_name, avatar_url, created_at
          ),
          reactions:post_reactions(reaction_type, created_at, user_id),
          comments:post_comments(
            id, content, created_at, likes_count,
            author:profiles!post_comments_user_id_fkey(id, first_name)
          ),
          saves:post_saves(id, user_id),
          shares:post_shares(id, created_at)
        `);

      // Visibility filtering
      if (includeConnections && userContext.connections.length > 0) {
        const connectionIds = userContext.connections.map(c => c.connected_user_id);
        query = query.or(`visibility.eq.public,and(visibility.eq.friends,user_id.in.(${connectionIds.join(',')}))`);
      } else {
        query = query.eq('visibility', 'public');
      }

      // Location filtering
      if (location) {
        query = query.or(`location.ilike.%${location}%,latitude.not.is.null`);
      }

      // Category filtering
      if (categories.length > 0) {
        query = query.overlaps('tags', categories);
      }

      // Exclude user's own posts (optional)
      query = query.neq('user_id', userId);

      // Get recent content (last 30 days) for better ranking
      const cutoffDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      query = query.gte('created_at', cutoffDate.toISOString());

      // Fetch with ordering and pagination
      query = query.order('created_at', { ascending: false })
                   .range(offset, offset + limit - 1);

      const { data: posts, error } = await query;
      if (error) throw error;

      return posts || [];

    } catch (error) {
      console.error('Error fetching relevant content:', error);
      return [];
    }
  }

  /**
   * Rank content based on multiple factors
   */
  async rankContent(posts, userId, userContext, options) {
    try {
      const { sortBy, diversityWeight } = options;

      // Calculate scores for each post
      const scoredPosts = await Promise.all(
        posts.map(async (post) => {
          const scores = await this.calculateContentScores(post, userId, userContext);

          return {
            ...post,
            scores,
            finalScore: this.calculateFinalScore(scores, sortBy)
          };
        })
      );

      // Sort by final score
      scoredPosts.sort((a, b) => b.finalScore - a.finalScore);

      // Apply diversity algorithm if requested
      if (diversityWeight > 0) {
        return this.applyDiversityRanking(scoredPosts, diversityWeight);
      }

      return scoredPosts;

    } catch (error) {
      console.error('Error ranking content:', error);
      return posts.map(post => ({ ...post, scores: {}, finalScore: 0 }));
    }
  }

  /**
   * Calculate multiple scoring factors for a post
   */
  async calculateContentScores(post, userId, userContext) {
    const scores = {};

    // 1. Engagement Score (from engagement service)
    const engagementScore = await engagementScoringService.calculatePostEngagementScore(post.id);
    scores.engagement = engagementScore.totalScore;

    // 2. Relevance Score (interest matching)
    scores.relevance = this.calculateRelevanceScore(post, userContext);

    // 3. Social Score (connection relationships)
    scores.social = this.calculateSocialScore(post, userContext);

    // 4. Quality Score (content richness)
    scores.quality = this.calculateQualityScore(post);

    // 5. Freshness Score (time-based)
    scores.freshness = this.calculateFreshnessScore(post);

    // 6. Discovery Score (new content/authors)
    scores.discovery = this.calculateDiscoveryScore(post, userContext);

    return scores;
  }

  /**
   * Calculate relevance score based on user interests
   */
  calculateRelevanceScore(post, userContext) {
    let score = 0;

    // Interest matching
    if (userContext.interests.length > 0 && post.tags) {
      const matchingTags = post.tags.filter(tag =>
        userContext.interests.some(interest =>
          interest.toLowerCase() === tag.toLowerCase()
        )
      );
      score += matchingTags.length * 15;
    }

    // Location relevance
    if (userContext.location && post.location) {
      if (post.location.toLowerCase().includes(userContext.location.toLowerCase())) {
        score += 20;
      }
    }

    // Content keyword matching
    const userInterests = userContext.interests.join(' ').toLowerCase();
    const postContent = post.content.toLowerCase();

    userContext.interests.forEach(interest => {
      if (postContent.includes(interest.toLowerCase())) {
        score += 5;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Calculate social score based on connections and relationships
   */
  calculateSocialScore(post, userContext) {
    let score = 0;

    // Direct connection bonus
    const isFromConnection = userContext.connections.some(
      conn => conn.connected_user_id === post.user_id
    );
    if (isFromConnection) {
      const connection = userContext.connections.find(
        conn => conn.connected_user_id === post.user_id
      );
      score += 40 + (connection.connection_strength * 10);
    }

    // Mutual engagement indicators
    if (post.reactions) {
      const hasConnectionReactions = post.reactions.some(reaction =>
        userContext.connections.some(conn => conn.connected_user_id === reaction.user_id)
      );
      if (hasConnectionReactions) score += 15;
    }

    if (post.comments) {
      const hasConnectionComments = post.comments.some(comment =>
        userContext.connections.some(conn => conn.connected_user_id === comment.author?.id)
      );
      if (hasConnectionComments) score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate quality score based on content characteristics
   */
  calculateQualityScore(post) {
    let score = 0;

    // Content length and richness
    const contentLength = post.content?.length || 0;
    if (contentLength > 500) score += 20;
    else if (contentLength > 200) score += 15;
    else if (contentLength > 100) score += 10;

    // Media richness
    if (post.media_urls && post.media_urls.length > 0) {
      score += Math.min(post.media_urls.length * 5, 20);
    }

    // Tags usage (categorization)
    if (post.tags && post.tags.length > 0) {
      score += Math.min(post.tags.length * 3, 15);
    }

    // Location context
    if (post.location || (post.latitude && post.longitude)) {
      score += 10;
    }

    // Engagement indicators
    const totalReactions = post.reactions?.length || 0;
    const totalComments = post.comments?.length || 0;

    score += Math.min(totalReactions * 2, 20);
    score += Math.min(totalComments * 3, 15);

    return Math.min(score, 100);
  }

  /**
   * Calculate freshness score based on post age
   */
  calculateFreshnessScore(post) {
    const hoursOld = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60);

    // Very fresh (0-2 hours): maximum score
    if (hoursOld <= 2) return 100;

    // Fresh (2-12 hours): high score
    if (hoursOld <= 12) return 80;

    // Recent (12-24 hours): good score
    if (hoursOld <= 24) return 60;

    // Day old (1-3 days): moderate score
    if (hoursOld <= 72) return 40;

    // Week old (3-7 days): low score
    if (hoursOld <= 168) return 20;

    // Old (7+ days): minimal score
    return 10;
  }

  /**
   * Calculate discovery score for new content/authors
   */
  calculateDiscoveryScore(post, userContext) {
    let score = 0;

    // New author discovery
    const isNewAuthor = !userContext.connections.some(
      conn => conn.connected_user_id === post.user_id
    );
    if (isNewAuthor) score += 15;

    // Diverse content discovery (new tags)
    if (post.tags) {
      const newTags = post.tags.filter(tag =>
        !userContext.interests.includes(tag)
      );
      if (newTags.length > 0) score += newTags.length * 5;
    }

    // Location diversity
    if (post.location && post.location !== userContext.location) {
      score += 10;
    }

    return Math.min(score, 50);
  }

  /**
   * Calculate final score based on ranking algorithm
   */
  calculateFinalScore(scores, sortBy) {
    switch (sortBy) {
      case 'trending':
        return (scores.engagement * 0.5) + (scores.freshness * 0.3) + (scores.quality * 0.2);

      case 'recent':
        return (scores.freshness * 0.6) + (scores.quality * 0.25) + (scores.engagement * 0.15);

      case 'relevance':
      default:
        return (scores.relevance * 0.3) +
               (scores.social * 0.25) +
               (scores.engagement * 0.2) +
               (scores.quality * 0.15) +
               (scores.freshness * 0.1);
    }
  }

  /**
   * Apply diversity ranking to avoid echo chambers
   */
  applyDiversityRanking(posts, diversityWeight) {
    const diversePosts = [];
    const usedAuthors = new Set();
    const usedTags = new Set();

    // First pass: select diverse content
    posts.forEach(post => {
      const authorUsed = usedAuthors.has(post.user_id);
      const hasNewTags = post.tags?.some(tag => !usedTags.has(tag)) || false;

      if (!authorUsed || hasNewTags) {
        diversePosts.push(post);
        usedAuthors.add(post.user_id);
        post.tags?.forEach(tag => usedTags.add(tag));
      }
    });

    // Second pass: fill remaining slots with best remaining content
    const remainingSlots = Math.max(0, posts.length - diversePosts.length);
    const remainingPosts = posts.filter(post => !diversePosts.includes(post));

    diversePosts.push(...remainingPosts.slice(0, remainingSlots));

    return diversePosts;
  }

  /**
   * Get content analytics for a post
   */
  async getContentAnalytics(postId) {
    try {
      const [post, engagementData] = await Promise.all([
        supabase
          .from('community_posts')
          .select(`
            *,
            reactions:post_reactions(reaction_type, created_at),
            comments:post_comments(content, created_at, likes_count),
            saves:post_saves(id, created_at),
            shares:post_shares(id, created_at)
          `)
          .eq('id', postId)
          .single(),

        engagementScoringService.calculatePostEngagementScore(postId)
      ]);

      if (post.error) throw post.error;

      // Calculate analytics
      const analytics = {
        totalViews: 0, // Would need view tracking implementation
        totalReactions: post.data.reactions?.length || 0,
        totalComments: post.data.comments?.length || 0,
        totalSaves: post.data.saves?.length || 0,
        totalShares: post.data.shares?.length || 0,
        engagementScore: engagementData,
        reactionBreakdown: this.analyzeReactions(post.data.reactions),
        commentQuality: this.analyzeComments(post.data.comments),
        engagementTimeline: this.createEngagementTimeline(post.data),
        performanceMetrics: {
          engagementRate: this.calculateEngagementRate(post.data),
          viralityScore: this.calculateViralityScore(post.data),
          qualityScore: this.calculateQualityScore(post.data)
        }
      };

      return {
        success: true,
        data: analytics
      };

    } catch (error) {
      console.error('Error getting content analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze reaction patterns
   */
  analyzeReactions(reactions) {
    if (!reactions || reactions.length === 0) {
      return { total: 0, breakdown: {}, sentiment: 'neutral' };
    }

    const breakdown = reactions.reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
      return acc;
    }, {});

    const positive = (breakdown.like || 0) + (breakdown.love || 0) + (breakdown.helpful || 0) + (breakdown.wow || 0);
    const negative = breakdown.sad || 0;

    let sentiment = 'neutral';
    if (positive > negative * 2) sentiment = 'positive';
    else if (negative > positive) sentiment = 'negative';

    return {
      total: reactions.length,
      breakdown,
      sentiment,
      diversityScore: Object.keys(breakdown).length / 5 // Out of 5 possible reactions
    };
  }

  /**
   * Analyze comment quality
   */
  analyzeComments(comments) {
    if (!comments || comments.length === 0) {
      return { total: 0, averageLength: 0, qualityScore: 0 };
    }

    const totalLength = comments.reduce((sum, comment) => sum + (comment.content?.length || 0), 0);
    const averageLength = totalLength / comments.length;

    const qualityComments = comments.filter(comment => {
      const length = comment.content?.length || 0;
      return length > 50; // Substantial comments
    });

    return {
      total: comments.length,
      averageLength: Math.round(averageLength),
      qualityScore: (qualityComments.length / comments.length) * 100,
      totalLikes: comments.reduce((sum, comment) => sum + (comment.likes_count || 0), 0)
    };
  }

  /**
   * Create engagement timeline
   */
  createEngagementTimeline(postData) {
    const timeline = [];

    (postData.reactions || []).forEach(reaction => {
      timeline.push({
        type: 'reaction',
        subtype: reaction.reaction_type,
        timestamp: reaction.created_at
      });
    });

    (postData.comments || []).forEach(comment => {
      timeline.push({
        type: 'comment',
        timestamp: comment.created_at,
        length: comment.content?.length || 0
      });
    });

    (postData.saves || []).forEach(save => {
      timeline.push({
        type: 'save',
        timestamp: save.created_at
      });
    });

    (postData.shares || []).forEach(share => {
      timeline.push({
        type: 'share',
        timestamp: share.created_at
      });
    });

    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(postData) {
    const totalEngagements = (postData.reactions?.length || 0) +
                           (postData.comments?.length || 0) +
                           (postData.saves?.length || 0) +
                           (postData.shares?.length || 0);

    // Since we don't have view count, use a simplified calculation
    const baseScore = totalEngagements * 10; // Assume each engagement represents ~10 views
    return Math.min(baseScore, 100);
  }

  /**
   * Calculate virality score
   */
  calculateViralityScore(postData) {
    const shares = postData.shares?.length || 0;
    const comments = postData.comments?.length || 0;
    const reactions = postData.reactions?.length || 0;

    // Shares are weighted most heavily for virality
    return Math.min((shares * 20) + (comments * 5) + (reactions * 2), 100);
  }

  /**
   * Clear feed cache
   */
  clearCache() {
    this.feedCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      feedCache: {
        size: this.feedCache.size,
        timeout: this.cacheTimeout
      }
    };
  }
}

// Export singleton instance
export const contentRankingService = new ContentRankingService();