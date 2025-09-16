/**
 * Engagement Scoring Service Tests
 * Tests for the engagement scoring and content ranking system
 */

import { engagementScoringService } from '../engagement-scoring-service';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('EngagementScoringService', () => {
  beforeEach(() => {
    // Clear caches before each test
    engagementScoringService.clearCaches();
  });

  describe('computePostScore', () => {
    test('should calculate content quality score correctly', () => {
      const post = {
        content: 'This is a comprehensive travel guide about exploring the beautiful mountains of Switzerland. It includes detailed information about hiking trails, accommodation options, and local customs.',
        media_urls: ['image1.jpg', 'image2.jpg'],
        tags: ['travel', 'hiking', 'switzerland'],
        location: 'Switzerland',
        created_at: new Date().toISOString(),
        author: {
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year ago
        },
        reactions: [
          { reaction_type: 'helpful', created_at: new Date().toISOString() },
          { reaction_type: 'love', created_at: new Date().toISOString() }
        ],
        comments: [
          {
            content: 'Great post! Very informative and helpful for my upcoming trip.',
            created_at: new Date().toISOString(),
            likes_count: 2
          }
        ]
      };

      const result = engagementScoringService.computePostScore(post);

      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.breakdown).toHaveProperty('contentQuality');
      expect(result.breakdown).toHaveProperty('reactions');
      expect(result.breakdown).toHaveProperty('discussion');
      expect(result.breakdown).toHaveProperty('authorCredibility');
      expect(result.breakdown.contentQuality).toBeGreaterThan(20); // Good content
      expect(result.breakdown.reactions).toBeGreaterThan(0); // Has meaningful reactions
    });

    test('should apply time decay correctly', () => {
      const recentPost = {
        content: 'Recent post content',
        created_at: new Date().toISOString(),
        author: { created_at: new Date().toISOString() },
        reactions: [],
        comments: []
      };

      const oldPost = {
        content: 'Old post content',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        author: { created_at: new Date().toISOString() },
        reactions: [],
        comments: []
      };

      const recentScore = engagementScoringService.computePostScore(recentPost);
      const oldScore = engagementScoringService.computePostScore(oldPost);

      expect(recentScore.timeDecay).toBeGreaterThan(oldScore.timeDecay);
      expect(recentScore.totalScore).toBeGreaterThan(oldScore.totalScore);
    });

    test('should handle empty post gracefully', () => {
      const emptyPost = {
        content: '',
        created_at: new Date().toISOString(),
        author: { created_at: new Date().toISOString() },
        reactions: [],
        comments: []
      };

      const result = engagementScoringService.computePostScore(emptyPost);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.breakdown).toBeDefined();
    });
  });

  describe('calculateContentQuality', () => {
    test('should score content length appropriately', () => {
      const shortPost = { content: 'Short' };
      const mediumPost = { content: 'A'.repeat(300) };
      const longPost = { content: 'A'.repeat(600) };

      const shortScore = engagementScoringService.calculateContentQuality(shortPost);
      const mediumScore = engagementScoringService.calculateContentQuality(mediumPost);
      const longScore = engagementScoringService.calculateContentQuality(longPost);

      expect(longScore).toBeGreaterThan(mediumScore);
      expect(mediumScore).toBeGreaterThan(shortScore);
    });

    test('should give bonus for media presence', () => {
      const textOnlyPost = { content: 'Text only post' };
      const mediaPost = {
        content: 'Post with media',
        media_urls: ['image1.jpg', 'image2.jpg']
      };

      const textScore = engagementScoringService.calculateContentQuality(textOnlyPost);
      const mediaScore = engagementScoringService.calculateContentQuality(mediaPost);

      expect(mediaScore).toBeGreaterThan(textScore);
    });

    test('should recognize travel-related content', () => {
      const travelPost = {
        content: 'Amazing adventure hiking through the mountains on my latest travel expedition!'
      };
      const genericPost = {
        content: 'Just had lunch today. It was okay.'
      };

      const travelScore = engagementScoringService.calculateContentQuality(travelPost);
      const genericScore = engagementScoringService.calculateContentQuality(genericPost);

      expect(travelScore).toBeGreaterThan(genericScore);
    });
  });

  describe('calculateReactionsScore', () => {
    test('should weight helpful reactions higher than likes', () => {
      const helpfulReactions = [
        { reaction_type: 'helpful' },
        { reaction_type: 'helpful' }
      ];
      const likeReactions = [
        { reaction_type: 'like' },
        { reaction_type: 'like' }
      ];

      const helpfulScore = engagementScoringService.calculateReactionsScore(helpfulReactions);
      const likeScore = engagementScoringService.calculateReactionsScore(likeReactions);

      expect(helpfulScore).toBeGreaterThan(likeScore);
    });

    test('should give diversity bonus for mixed reactions', () => {
      const diverseReactions = [
        { reaction_type: 'helpful' },
        { reaction_type: 'love' },
        { reaction_type: 'wow' }
      ];
      const singleTypeReactions = [
        { reaction_type: 'like' },
        { reaction_type: 'like' },
        { reaction_type: 'like' }
      ];

      const diverseScore = engagementScoringService.calculateReactionsScore(diverseReactions);
      const singleScore = engagementScoringService.calculateReactionsScore(singleTypeReactions);

      // Diverse reactions should get a bonus multiplier
      expect(diverseScore).toBeGreaterThan(singleScore);
    });
  });

  describe('calculateDiscussionScore', () => {
    test('should value quality comments over quantity', () => {
      const qualityComments = [
        {
          content: 'This is a very detailed and thoughtful comment that provides additional value to the discussion.',
          likes_count: 3
        }
      ];
      const shortComments = [
        { content: 'Nice', likes_count: 0 },
        { content: 'Cool', likes_count: 0 },
        { content: 'Good', likes_count: 0 }
      ];

      const qualityScore = engagementScoringService.calculateDiscussionScore(qualityComments);
      const quantityScore = engagementScoringService.calculateDiscussionScore(shortComments);

      expect(qualityScore).toBeGreaterThan(quantityScore);
    });

    test('should give recency bonus for active discussions', () => {
      const recentComments = [
        {
          content: 'Recent comment',
          created_at: new Date().toISOString()
        }
      ];
      const oldComments = [
        {
          content: 'Old comment',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 48 hours ago
        }
      ];

      const recentScore = engagementScoringService.calculateDiscussionScore(recentComments);
      const oldScore = engagementScoringService.calculateDiscussionScore(oldComments);

      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });

  describe('calculateEngagementVelocity', () => {
    test('should calculate velocity based on recent engagements', () => {
      const now = new Date();
      const recentTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

      const post = {
        created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        reactions: [
          { reaction_type: 'helpful', created_at: recentTime.toISOString() },
          { reaction_type: 'love', created_at: recentTime.toISOString() }
        ],
        comments: [
          { content: 'Great post!', created_at: recentTime.toISOString() }
        ]
      };

      const velocity = engagementScoringService.calculateEngagementVelocity(post, 24);

      expect(velocity).toBeGreaterThan(0);
    });
  });

  describe('cache management', () => {
    test('should cache and retrieve scores', () => {
      const postId = 'test-post-id';
      const mockScore = { totalScore: 85, breakdown: {} };

      // Mock the cache
      engagementScoringService.scoreCache.set(`post_score_${postId}`, {
        data: mockScore,
        timestamp: Date.now()
      });

      const cached = engagementScoringService.scoreCache.get(`post_score_${postId}`);
      expect(cached.data).toEqual(mockScore);
    });

    test('should clear caches', () => {
      engagementScoringService.scoreCache.set('test', { data: 'test' });
      engagementScoringService.trendingCache.set('test', { data: 'test' });

      engagementScoringService.clearCaches();

      expect(engagementScoringService.scoreCache.size).toBe(0);
      expect(engagementScoringService.trendingCache.size).toBe(0);
    });

    test('should provide cache statistics', () => {
      const stats = engagementScoringService.getCacheStats();

      expect(stats).toHaveProperty('scoreCache');
      expect(stats).toHaveProperty('trendingCache');
      expect(stats.scoreCache).toHaveProperty('size');
      expect(stats.scoreCache).toHaveProperty('timeout');
    });
  });
});