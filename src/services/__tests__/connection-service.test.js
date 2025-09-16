/**
 * Connection Service Tests
 * Test suite for connection management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { connectionService } from '../connection-service';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn()
        })),
        or: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn()
            }))
          }))
        })),
        range: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn()
        })),
        or: vi.fn()
      })),
      upsert: vi.fn()
    }))
  })
};

// Mock compatibility service
const mockCompatibilityService = {
  calculateCompatibility: vi.fn()
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

vi.mock('../compatibility-service', () => ({
  compatibilityService: mockCompatibilityService
}));

describe('ConnectionService', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    // Reset mocks
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendConnectionRequest', () => {
    it('should send a connection request successfully', async () => {
      const recipientId = 'user-456';
      const message = 'Hello! Let\'s connect.';

      // Mock no existing connection
      connectionService.getConnectionStatus = vi.fn().mockResolvedValue(null);

      // Mock successful insert
      const mockRequest = {
        id: 'request-123',
        requester_id: mockUser.id,
        recipient_id: recipientId,
        message,
        status: 'pending'
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockRequest,
        error: null
      });

      const result = await connectionService.sendConnectionRequest(recipientId, message);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRequest);
      expect(mockSupabase.from).toHaveBeenCalledWith('connection_requests');
    });

    it('should reject request if connection already exists', async () => {
      const recipientId = 'user-456';

      // Mock existing connection
      connectionService.getConnectionStatus = vi.fn().mockResolvedValue({
        type: 'connected'
      });

      const result = await connectionService.sendConnectionRequest(recipientId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection already exists');
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const result = await connectionService.sendConnectionRequest('user-456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated');
    });
  });

  describe('respondToConnectionRequest', () => {
    it('should accept a connection request successfully', async () => {
      const requestId = 'request-123';
      const mockRequest = {
        id: requestId,
        requester_id: 'user-456',
        recipient_id: mockUser.id,
        status: 'accepted'
      };

      // Mock successful update
      mockSupabase.from().update().eq().eq().select().single.mockResolvedValue({
        data: mockRequest,
        error: null
      });

      // Mock successful connection creation
      mockSupabase.from().insert.mockResolvedValue({
        error: null
      });

      connectionService.updateEngagementScores = vi.fn().mockResolvedValue();

      const result = await connectionService.respondToConnectionRequest(requestId, 'accepted');

      expect(result.success).toBe(true);
      expect(result.data.response).toBe('accepted');
    });

    it('should decline a connection request successfully', async () => {
      const requestId = 'request-123';
      const mockRequest = {
        id: requestId,
        requester_id: 'user-456',
        recipient_id: mockUser.id,
        status: 'declined'
      };

      mockSupabase.from().update().eq().eq().select().single.mockResolvedValue({
        data: mockRequest,
        error: null
      });

      const result = await connectionService.respondToConnectionRequest(requestId, 'declined');

      expect(result.success).toBe(true);
      expect(result.data.response).toBe('declined');
    });

    it('should reject invalid response types', async () => {
      const result = await connectionService.respondToConnectionRequest('request-123', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response');
    });
  });

  describe('getConnectionRecommendations', () => {
    it('should generate recommendations based on shared adventures', async () => {
      const mockSharedAdventures = [
        {
          group_id: 'group-1',
          group: { id: 'group-1', adventure_id: 'adventure-1', status: 'completed' },
          other_members: [
            {
              user_id: 'user-456',
              profile: {
                id: 'user-456',
                first_name: 'Jane',
                last_name: 'Doe',
                avatar_url: 'avatar.jpg',
                location: 'New York'
              }
            }
          ]
        }
      ];

      // Mock getUserConnections to return empty (filter connected users)
      connectionService.getUserConnections = vi.fn().mockResolvedValue({
        success: true,
        data: []
      });

      mockSupabase.from().select().eq().neq().in.mockResolvedValue({
        data: mockSharedAdventures,
        error: null
      });

      // Mock compatibility calculation
      mockCompatibilityService.calculateCompatibility.mockResolvedValue({
        success: true,
        data: {
          overallScore: 85,
          dimensions: {}
        }
      });

      const result = await connectionService.getConnectionRecommendations(mockUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_id).toBe('user-456');
      expect(result.data[0].sharedAdventures).toBe(1);
      expect(result.data[0].recommendationScore).toBeGreaterThan(0);
    });

    it('should handle no shared adventures', async () => {
      connectionService.getUserConnections = vi.fn().mockResolvedValue({
        success: true,
        data: []
      });

      mockSupabase.from().select().eq().neq().in.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await connectionService.getConnectionRecommendations(mockUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('calculateRecommendationScore', () => {
    it('should calculate score based on shared adventures', () => {
      const connection = {
        sharedAdventures: 2
      };

      const score = connectionService.calculateRecommendationScore(connection, null);

      expect(score).toBe(50); // 2 * 20 + 10 (multiple adventures bonus)
    });

    it('should include compatibility score in calculation', () => {
      const connection = {
        sharedAdventures: 1
      };

      const compatibilityScore = {
        overallScore: 80
      };

      const score = connectionService.calculateRecommendationScore(connection, compatibilityScore);

      expect(score).toBe(60); // 1 * 20 + 80 * 0.5
    });

    it('should cap score at 100', () => {
      const connection = {
        sharedAdventures: 5
      };

      const compatibilityScore = {
        overallScore: 100
      };

      const score = connectionService.calculateRecommendationScore(connection, compatibilityScore);

      expect(score).toBe(100); // Should be capped at 100
    });
  });

  describe('getMutualConnections', () => {
    it('should find mutual connections between two users', async () => {
      const userId2 = 'user-456';
      const mockMutualConnections = [
        {
          connected_user_id: 'user-789',
          profile: {
            id: 'user-789',
            first_name: 'John',
            last_name: 'Smith',
            avatar_url: 'avatar.jpg'
          }
        }
      ];

      mockSupabase.from().select().eq().eq().in.mockResolvedValue({
        data: mockMutualConnections,
        error: null
      });

      const result = await connectionService.getMutualConnections(mockUser.id, userId2);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMutualConnections);
      expect(result.count).toBe(1);
    });
  });

  describe('trackInteraction', () => {
    it('should update interaction counts for both users', async () => {
      const userId2 = 'user-456';

      mockSupabase.from().update().eq().eq().eq.mockResolvedValue({
        error: null
      });

      const result = await connectionService.trackInteraction(mockUser.id, userId2);

      expect(result.success).toBe(true);
      expect(mockSupabase.from().update).toHaveBeenCalledTimes(2); // Once for each direction
    });
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      const userId = 'user-456';

      // Mock successful operations
      mockSupabase.from().delete().or.mockResolvedValue({ error: null });
      mockSupabase.from().update().or().eq.mockResolvedValue({ error: null });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const result = await connectionService.blockUser(userId, true);

      expect(result.success).toBe(true);
    });

    it('should unblock a user successfully', async () => {
      const userId = 'user-456';

      mockSupabase.from().delete().eq().eq().eq.mockResolvedValue({ error: null });

      const result = await connectionService.blockUser(userId, false);

      expect(result.success).toBe(true);
    });
  });
});

describe('ConnectionService Cache Management', () => {
  let connectionService;

  beforeEach(() => {
    connectionService = new ConnectionService();
  });

  it('should invalidate cache for specific user', () => {
    // Add some cache entries
    connectionService.connectionCache.set('user-123-connections', []);
    connectionService.connectionCache.set('user-123-recommendations', []);
    connectionService.connectionCache.set('user-456-connections', []);

    connectionService.invalidateConnectionCache('user-123');

    // Should remove entries containing user-123
    expect(connectionService.connectionCache.has('user-123-connections')).toBe(false);
    expect(connectionService.connectionCache.has('user-123-recommendations')).toBe(false);
    // Should keep other entries
    expect(connectionService.connectionCache.has('user-456-connections')).toBe(true);
  });

  it('should return cache statistics', () => {
    connectionService.connectionCache.set('test-key', 'test-value');

    const stats = connectionService.getCacheStats();

    expect(stats.size).toBe(1);
    expect(stats.timeout).toBe(5 * 60 * 1000); // 5 minutes
  });
});