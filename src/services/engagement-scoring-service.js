/**
 * Engagement Scoring Service
 * Implements meaningful engagement metrics without traditional social media vanity metrics
 */
import { supabase } from '../lib/supabase';
export class EngagementScoringService {
  constructor() {
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    this.scoreCache = new Map();
    this.trendingCache = new Map();
  }
  /**
   * Calculate engagement score for a post based on meaningful interactions
   */
  async calculatePostEngagementScore(postId) {
    try {
      const cacheKey = `post_score_${postId}`;
      const cached = this.scoreCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      // Fetch post data with engagement metrics
      const { data: post, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          reactions:post_reactions(reaction_type, created_at),
          comments:post_comments(content, created_at, likes_count),
          author:profiles!community_posts_user_id_fkey(
            id, created_at
          )
        `)
        .eq('id', postId)
        .single();
      if (error) throw error;
      const score = this.computePostScore(post);
      // Cache the result
      this.scoreCache.set(cacheKey, {
        data: score,
        timestamp: Date.now()
      });
      return score;
    } catch (error) {
      console.error('Error calculating post engagement score:', error);
      return { totalScore: 0, breakdown: {} };
    }
  }
  /**
   * Compute post score based on meaningful metrics
   */
  computePostScore(post) {
    const now = new Date();
    const postAge = (now - new Date(post.created_at)) / (1000 * 60 * 60); // hours
    let score = 0;
    const breakdown = {};
    // 1. Content Quality Score (0-40 points)
    const contentQuality = this.calculateContentQuality(post);
    score += contentQuality;
    breakdown.contentQuality = contentQuality;
    // 2. Meaningful Reactions Score (0-30 points)
    const reactionsScore = this.calculateReactionsScore(post.reactions || []);
    score += reactionsScore;
    breakdown.reactions = reactionsScore;
    // 3. Discussion Quality Score (0-30 points)
    const discussionScore = this.calculateDiscussionScore(post.comments || []);
    score += discussionScore;
    breakdown.discussion = discussionScore;
    // 4. Time Decay Factor (multiplier 0.1-1.0)
    const timeDecay = this.calculateTimeDecay(postAge);
    breakdown.timeDecay = timeDecay;
    // 5. Author Credibility Boost (0-10 points)
    const authorCredibility = this.calculateAuthorCredibility(post.author);
    score += authorCredibility;
    breakdown.authorCredibility = authorCredibility;
    // Apply time decay
    const finalScore = score * timeDecay;
    return {
      totalScore: Math.round(finalScore * 100) / 100,
      rawScore: score,
      timeDecay,
      breakdown,
      lastCalculated: now.toISOString()
    };
  }
  /**
   * Calculate content quality based on completeness and richness
   */
  calculateContentQuality(post) {
    let score = 0;
    // Base content score (0-15 points)
    const contentLength = post.content?.length || 0;
    if (contentLength > 500) score += 15;
    else if (contentLength > 200) score += 10;
    else if (contentLength > 50) score += 5;
    // Media presence (0-10 points)
    if (post.media_urls && post.media_urls.length > 0) {
      score += Math.min(post.media_urls.length * 3, 10);
    }
    // Tags usage (0-5 points)
    if (post.tags && post.tags.length > 0) {
      score += Math.min(post.tags.length * 1, 5);
    }
    // Location context (0-5 points)
    if (post.location || (post.latitude && post.longitude)) {
      score += 5;
    }
    // Adventure/travel relevance (0-5 points)
    const travelKeywords = ['travel', 'adventure', 'trip', 'journey', 'explore', 'destination'];
    const hasRelevantContent = travelKeywords.some(keyword =>
      post.content?.toLowerCase().includes(keyword)
    );
    if (hasRelevantContent) score += 5;
    return Math.min(score, 40);
  }
  /**
   * Calculate meaningful reactions score
   */
  calculateReactionsScore(reactions) {
    if (!reactions || reactions.length === 0) return 0;
    let score = 0;
    const reactionWeights = {
      'helpful': 5,    // Most valuable
      'love': 3,       // High emotional engagement
      'wow': 3,        // Surprise/amazement
      'like': 2,       // Basic appreciation
      'sad': 1         // Emotional but less positive
    };
    // Count reactions by type
    const reactionCounts = reactions.reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
      return acc;
    }, {});
    // Calculate weighted score
    for (const [type, count] of Object.entries(reactionCounts)) {
      const weight = reactionWeights[type] || 1;
      score += count * weight;
    }
    // Diversity bonus (having multiple types of reactions)
    const reactionTypes = Object.keys(reactionCounts).length;
    if (reactionTypes > 2) score *= 1.2;
    return Math.min(score, 30);
  }
  /**
   * Calculate discussion quality score
   */
  calculateDiscussionScore(comments) {
    if (!comments || comments.length === 0) return 0;
    let score = 0;
    // Base discussion score (number of comments)
    score += Math.min(comments.length * 2, 15);
    // Quality comments bonus
    const qualityComments = comments.filter(comment => {
      const length = comment.content?.length || 0;
      return length > 50; // Substantial comments
    });
    score += qualityComments.length * 3;
    // Comments with likes (indicates quality)
    const likedComments = comments.filter(comment =>
      (comment.likes_count || 0) > 0
    );
    score += likedComments.length * 2;
    // Recency bonus for active discussions
    const recentComments = comments.filter(comment => {
      const commentAge = (Date.now() - new Date(comment.created_at)) / (1000 * 60 * 60); // hours
      return commentAge < 24; // Comments in last 24 hours
    });
    if (recentComments.length > 0) score += 5;
    return Math.min(score, 30);
  }
  /**
   * Calculate time decay factor for content freshness
   */
  calculateTimeDecay(hoursOld) {
    // Fresh content (0-6 hours): no decay
    if (hoursOld <= 6) return 1.0;
    // Recent content (6-24 hours): slight decay
    if (hoursOld <= 24) return 0.9;
    // Day-old content (1-3 days): moderate decay
    if (hoursOld <= 72) return 0.7;
    // Week-old content (3-7 days): significant decay
    if (hoursOld <= 168) return 0.5;
    // Month-old content (7-30 days): heavy decay
    if (hoursOld <= 720) return 0.3;
    // Old content (30+ days): minimum score
    return 0.1;
  }
  /**
   * Calculate author credibility boost
   */
  calculateAuthorCredibility(author) {
    if (!author) return 0;
    let score = 0;
    // Account age bonus
    const accountAge = (Date.now() - new Date(author.created_at)) / (1000 * 60 * 60 * 24); // days
    if (accountAge > 365) score += 5;      // 1+ year old account
    else if (accountAge > 90) score += 3;  // 3+ months old
    else if (accountAge > 30) score += 1;  // 1+ month old
    // Community member bonus (basic credibility)
    score += 2;
    return Math.min(score, 10);
  }
  /**
   * Get ranked content feed for a user
   */
  async getPersonalizedFeed(userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        includeGlobal = true,
        locationFilter = null,
        diversityFactor = 0.3
      } = options;
      // Get user preferences and connections
      const [userPrefs, connections] = await Promise.all([
        this.getUserPreferences(userId),
        this.getUserConnections(userId)
      ]);
      // Build content query with scoring
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_user_id_fkey(
            id, first_name, last_name, avatar_url, created_at
          ),
          reactions:post_reactions(reaction_type, created_at),
          comments:post_comments(content, created_at, likes_count)
        `);
      // Apply visibility filters
      if (connections.length > 0) {
        query = query.or(`visibility.eq.public,and(visibility.eq.friends,user_id.in.(${connections.join(',')}))`);
      } else {
        query = query.eq('visibility', 'public');
      }
      // Apply location filter if specified
      if (locationFilter) {
        query = query.not('latitude', 'is', null)
                     .not('longitude', 'is', null);
      }
      // Get posts
      query = query.order('created_at', { ascending: false })
                   .range(offset, offset + (limit * 2) - 1); // Get extra for ranking
      const { data: posts, error } = await query;
      if (error) throw error;
      // Calculate engagement scores for all posts
      const scoredPosts = await Promise.all(
        posts.map(async (post) => {
          const score = this.computePostScore(post);
          const personalizationScore = await this.calculatePersonalizationScore(
            post, userId, userPrefs, connections
          );
          return {
            ...post,
            engagementScore: score,
            personalizationScore,
            combinedScore: score.totalScore * 0.7 + personalizationScore * 0.3
          };
        })
      );
      // Apply diversity filtering and ranking
      const rankedPosts = this.applyDiversityRanking(scoredPosts, diversityFactor);
      // Return final ranked and limited results
      return {
        success: true,
        data: rankedPosts.slice(0, limit),
        pagination: {
          limit,
          offset,
          hasMore: rankedPosts.length > limit
        }
      };
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
   * Calculate personalization score based on user interests and behavior
   */
  async calculatePersonalizationScore(post, userId, userPrefs, connections) {
    let score = 0;
    // Connection bonus
    if (connections.includes(post.user_id)) {
      score += 30;
    }
    // Interest matching (based on tags)
    if (userPrefs.interests && post.tags) {
      const matchingTags = post.tags.filter(tag =>
        userPrefs.interests.some(interest =>
          interest.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      );
      score += matchingTags.length * 10;
    }
    // Location relevance
    if (userPrefs.location && post.location) {
      // Simple location matching (could be enhanced with geographic distance)
      if (post.location.toLowerCase().includes(userPrefs.location.toLowerCase())) {
        score += 15;
      }
    }
    // Group affiliation bonus
    if (post.group_id) {
      // Check if user is member of the group
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', post.group_id)
        .eq('user_id', userId)
        .single();
      if (membership) score += 25;
    }
    return Math.min(score, 100);
  }
  /**
   * Apply diversity ranking to avoid echo chambers
   */
  applyDiversityRanking(posts, diversityFactor) {
    const categorizedPosts = {};
    const rankedPosts = [];
    // Categorize posts by author and tags
    posts.forEach(post => {
      const authorId = post.user_id;
      const category = post.tags?.[0] || 'general';
      if (!categorizedPosts[category]) {
        categorizedPosts[category] = [];
      }
      categorizedPosts[category].push(post);
    });
    // Sort each category by combined score
    Object.keys(categorizedPosts).forEach(category => {
      categorizedPosts[category].sort((a, b) => b.combinedScore - a.combinedScore);
    });
    // Interleave posts from different categories
    const categories = Object.keys(categorizedPosts);
    let categoryIndex = 0;
    const maxIterations = Math.max(...Object.values(categorizedPosts).map(arr => arr.length));
    for (let i = 0; i < maxIterations; i++) {
      for (let j = 0; j < categories.length; j++) {
        const category = categories[(categoryIndex + j) % categories.length];
        const categoryPosts = categorizedPosts[category];
        if (categoryPosts.length > i) {
          rankedPosts.push(categoryPosts[i]);
        }
      }
      categoryIndex++;
    }
    return rankedPosts;
  }
  /**
   * Get trending content based on engagement velocity
   */
  async getTrendingContent(options = {}) {
    try {
      const {
        timeWindow = 24, // hours
        limit = 10,
        minEngagementThreshold = 10
      } = options;
      const cacheKey = `trending_${timeWindow}_${limit}`;
      const cached = this.trendingCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (30 * 60 * 1000)) { // 30 min cache
        return cached.data;
      }
      const cutoffTime = new Date(Date.now() - (timeWindow * 60 * 60 * 1000));
      // Get recent posts with engagement data
      const { data: posts, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_user_id_fkey(
            id, first_name, last_name, avatar_url
          ),
          reactions:post_reactions(reaction_type, created_at),
          comments:post_comments(content, created_at, likes_count)
        `)
        .eq('visibility', 'public')
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Calculate trending scores
      const trendingPosts = await Promise.all(
        posts.map(async (post) => {
          const engagementScore = this.computePostScore(post);
          const velocityScore = this.calculateEngagementVelocity(post, timeWindow);
          return {
            ...post,
            engagementScore,
            velocityScore,
            trendingScore: engagementScore.totalScore * 0.6 + velocityScore * 0.4
          };
        })
      );
      // Filter and sort by trending score
      const trending = trendingPosts
        .filter(post => post.trendingScore >= minEngagementThreshold)
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);
      const result = {
        success: true,
        data: trending,
        timeWindow,
        generatedAt: new Date().toISOString()
      };
      // Cache results
      this.trendingCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      console.error('Error getting trending content:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
  /**
   * Calculate engagement velocity (rate of engagement over time)
   */
  calculateEngagementVelocity(post, timeWindowHours) {
    const postAge = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60); // hours
    const reactions = post.reactions || [];
    const comments = post.comments || [];
    if (postAge <= 0) return 0;
    // Count recent engagements
    const recentReactions = reactions.filter(reaction => {
      const reactionAge = (Date.now() - new Date(reaction.created_at)) / (1000 * 60 * 60);
      return reactionAge <= timeWindowHours;
    });
    const recentComments = comments.filter(comment => {
      const commentAge = (Date.now() - new Date(comment.created_at)) / (1000 * 60 * 60);
      return commentAge <= timeWindowHours;
    });
    // Calculate engagements per hour
    const totalEngagements = recentReactions.length + recentComments.length;
    const velocity = totalEngagements / Math.min(postAge, timeWindowHours);
    // Apply velocity multiplier based on engagement types
    const qualityMultiplier = this.calculateVelocityQualityMultiplier(recentReactions, recentComments);
    return velocity * qualityMultiplier * 100; // Scale up for better scoring
  }
  /**
   * Calculate quality multiplier for velocity score
   */
  calculateVelocityQualityMultiplier(reactions, comments) {
    let multiplier = 1.0;
    // Reaction quality bonus
    const helpfulReactions = reactions.filter(r => r.reaction_type === 'helpful').length;
    const emotionalReactions = reactions.filter(r => ['love', 'wow'].includes(r.reaction_type)).length;
    multiplier += (helpfulReactions * 0.3) + (emotionalReactions * 0.2);
    // Comment quality bonus
    const substantialComments = comments.filter(c => (c.content?.length || 0) > 50).length;
    multiplier += substantialComments * 0.25;
    return Math.min(multiplier, 3.0); // Cap at 3x multiplier
  }
  /**
   * Get user preferences for personalization
   */
  async getUserPreferences(userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences, location')
        .eq('id', userId)
        .single();
      return {
        interests: profile?.preferences?.interests || [],
        location: profile?.location || null,
        ...profile?.preferences
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { interests: [], location: null };
    }
  }
  /**
   * Get user connections for friend-based content
   */
  async getUserConnections(userId) {
    try {
      const { data: connections } = await supabase
        .from('community_connections')
        .select('connected_user_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');
      return connections?.map(c => c.connected_user_id) || [];
    } catch (error) {
      console.error('Error getting user connections:', error);
      return [];
    }
  }
  /**
   * Update user engagement scores
   */
  async updateUserEngagementScore(userId) {
    try {
      // Get user's recent activity
      const cutoffDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // 30 days
      const [postsData, reactionsData, commentsData, connectionsData] = await Promise.all([
        supabase.from('community_posts').select('id').eq('user_id', userId).gte('created_at', cutoffDate.toISOString()),
        supabase.from('post_reactions').select('id').eq('user_id', userId).gte('created_at', cutoffDate.toISOString()),
        supabase.from('post_comments').select('id').eq('user_id', userId).gte('created_at', cutoffDate.toISOString()),
        supabase.from('community_connections').select('id').eq('user_id', userId).eq('status', 'accepted')
      ]);
      const totalPosts = postsData.data?.length || 0;
      const totalReactions = reactionsData.data?.length || 0;
      const totalComments = commentsData.data?.length || 0;
      const totalConnections = connectionsData.data?.length || 0;
      // Calculate engagement score
      const engagementScore = (totalPosts * 5) + (totalReactions * 1) + (totalComments * 2) + (totalConnections * 3);
      // Update engagement scores table
      await supabase
        .from('engagement_scores')
        .upsert({
          user_id: userId,
          total_posts: totalPosts,
          total_reactions: totalReactions,
          total_comments: totalComments,
          total_connections: totalConnections,
          engagement_score: engagementScore,
          last_calculated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      return { success: true, score: engagementScore };
    } catch (error) {
      console.error('Error updating user engagement score:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Clear caches
   */
  clearCaches() {
    this.scoreCache.clear();
    this.trendingCache.clear();
  }
  /**
   * Track post interaction for engagement scoring
   */
  async trackPostInteraction(postId, userId, interactionType, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      switch (interactionType) {
        case 'reaction':
          // Insert reaction into post_reactions table
          await supabase
            .from('post_reactions')
            .upsert({
              post_id: postId,
              user_id: userId,
              reaction_type: metadata.reactionType || 'like'
            }, {
              onConflict: 'post_id,user_id'
            });
          break;
        case 'save':
          // Insert save into post_saves table
          await supabase
            .from('post_saves')
            .upsert({
              post_id: postId,
              user_id: userId
            }, {
              onConflict: 'post_id,user_id'
            });
          break;
        case 'share':
          // Insert share into post_shares table
          await supabase
            .from('post_shares')
            .insert({
              post_id: postId,
              user_id: userId,
              share_type: metadata.shareType || 'link',
              platform: metadata.platform || 'internal'
            });
          break;
        case 'view':
          // Track view duration if provided
          await supabase
            .from('post_views')
            .insert({
              post_id: postId,
              user_id: userId,
              view_duration: metadata.duration || 0,
              is_unique_view: metadata.isUnique || true
            });
          break;
        case 'comment':
          // This would be handled by the comment creation logic
          break;
      }
      // Invalidate cache for this post
      this.scoreCache.delete(`post_score_${postId}`);
      // Update user engagement score
      await this.updateUserEngagementScore(userId);
      return { success: true };
    } catch (error) {
      console.error('Error tracking post interaction:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Track post interaction session for time-based engagement
   */
  async trackInteractionSession(postId, userId, sessionData) {
    try {
      await supabase
        .from('post_interaction_sessions')
        .insert({
          post_id: postId,
          user_id: userId,
          session_start: sessionData.startTime,
          session_end: sessionData.endTime,
          total_duration: sessionData.duration || 0,
          interactions_count: sessionData.interactions || 0,
          scroll_depth: sessionData.scrollDepth || 0,
          has_meaningful_engagement: sessionData.hasMeaningfulEngagement || false
        });
      return { success: true };
    } catch (error) {
      console.error('Error tracking interaction session:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Log content discovery for recommendation improvement
   */
  async logContentDiscovery(userId, postId, discoveryMethod, metadata = {}) {
    try {
      await supabase
        .from('content_discovery_log')
        .insert({
          user_id: userId,
          post_id: postId,
          discovery_method: discoveryMethod,
          rank_position: metadata.rankPosition,
          feed_algorithm: metadata.feedAlgorithm
        });
      return { success: true };
    } catch (error) {
      console.error('Error logging content discovery:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Get engagement insights for a user
   */
  async getUserEngagementInsights(userId) {
    try {
      const [userScore, recentActivity, topInterests] = await Promise.all([
        // User's current engagement score
        supabase
          .from('engagement_scores')
          .select('*')
          .eq('user_id', userId)
          .single(),
        // Recent activity summary
        supabase
          .from('post_reactions')
          .select('reaction_type, created_at')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false }),
        // User's most engaged content topics
        supabase
          .from('post_reactions')
          .select(`
            post:community_posts(tags)
          `)
          .eq('user_id', userId)
          .not('post.tags', 'is', null)
          .limit(50)
      ]);
      // Analyze top interests from tags
      const tagCounts = {};
      topInterests.data?.forEach(item => {
        if (item.post?.tags) {
          item.post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      const topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
      return {
        success: true,
        data: {
          engagementScore: userScore.data?.engagement_score || 0,
          totalConnections: userScore.data?.total_connections || 0,
          recentActivity: recentActivity.data || [],
          topInterests: topTags,
          lastCalculated: userScore.data?.last_calculated
        }
      };
    } catch (error) {
      console.error('Error getting user engagement insights:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      scoreCache: {
        size: this.scoreCache.size,
        timeout: this.cacheTimeout
      },
      trendingCache: {
        size: this.trendingCache.size,
        timeout: 30 * 60 * 1000
      }
    };
  }
}
// Export singleton instance
export const engagementScoringService = new EngagementScoringService();