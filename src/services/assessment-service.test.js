/**
 * Unit tests for Assessment Service
 * Tests all CRUD operations, validation, error handling, and real-time subscriptions
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { assessmentService, AssessmentServiceError, ValidationError, DatabaseError } from './assessment-service.js';
import { supabase } from '../lib/supabase.js';

// Mock Supabase client
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

// Test data
const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
const mockAssessmentId = '987fcdeb-51d2-4321-b123-987654321000';

const mockCalculatorTraits = {
  energyLevel: 75,
  socialPreference: 60,
  adventureStyle: 80,
  riskTolerance: 50,
};

const mockAssessmentInput = {
  userId: mockUserId,
  calculatorTraits: mockCalculatorTraits,
  personalityType: 'The Adventurer',
  traitDescriptions: {
    energyLevel: 'You thrive on high-energy activities',
    socialPreference: 'You enjoy both social and personal time',
    adventureStyle: 'You seek unique experiences',
    riskTolerance: 'You enjoy moderate thrills',
  },
  answers: [
    {
      questionId: 1,
      optionId: 'option-a',
      traitScores: { energyLevel: 10, adventureStyle: 5 },
    },
    {
      questionId: 2,
      optionId: 'option-b',
      traitScores: { socialPreference: 8, riskTolerance: 3 },
    },
  ],
  aiDescription: 'AI-generated personality description',
};

const mockDbAssessment = {
  id: mockAssessmentId,
  user_id: mockUserId,
  openness: 0.75,
  conscientiousness: 0.45,
  extraversion: 0.68,
  agreeableness: 0.55,
  neuroticism: 0.35,
  adventure_style: 'explorer',
  budget_preference: 'flexible',
  planning_style: 'structured',
  group_preference: 'small_group',
  completed_at: '2024-09-14T12:00:00.000Z',
  updated_at: '2024-09-14T12:00:00.000Z',
};

// Mock Supabase query builder
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

// Mock Supabase channel
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
  state: 'subscribed',
};

describe('Assessment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.from.mockReturnValue(mockQueryBuilder);
    supabase.channel.mockReturnValue(mockChannel);
  });

  afterEach(() => {
    assessmentService.unsubscribeAll();
  });

  describe('saveAssessment', () => {
    it('should successfully save a valid assessment', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockDbAssessment,
        error: null,
      });

      // Mock responses table operations
      const mockResponsesBuilder = { ...mockQueryBuilder };
      supabase.from
        .mockReturnValueOnce(mockQueryBuilder) // personality_assessments
        .mockReturnValueOnce(mockResponsesBuilder) // assessment_responses delete
        .mockReturnValueOnce(mockResponsesBuilder); // assessment_responses insert

      const result = await assessmentService.saveAssessment(mockAssessmentInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAssessmentId);
      expect(result.user_id).toBe(mockUserId);
      expect(result.calculatorProfile).toBeDefined();
      expect(result.metadata).toBeDefined();

      expect(supabase.from).toHaveBeenCalledWith('personality_assessments');
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid input', async () => {
      const invalidInput = { ...mockAssessmentInput, userId: 'invalid-uuid' };

      await expect(assessmentService.saveAssessment(invalidInput))
        .rejects.toThrow(ValidationError);
    });

    it('should throw DatabaseError on database failure', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(assessmentService.saveAssessment(mockAssessmentInput))
        .rejects.toThrow(DatabaseError);
    });

    it('should retry on transient errors', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Connection timeout' },
        })
        .mockResolvedValueOnce({
          data: mockDbAssessment,
          error: null,
        });

      const result = await assessmentService.saveAssessment(mockAssessmentInput);
      expect(result).toBeDefined();
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAssessmentByUserId', () => {
    it('should retrieve assessment by user ID', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockDbAssessment,
        error: null,
      });

      const result = await assessmentService.getAssessmentByUserId(mockUserId);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(mockUserId);
      expect(result.calculatorProfile).toBeDefined();

      expect(supabase.from).toHaveBeenCalledWith('personality_assessments');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return null for non-existent user', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows found
      });

      const result = await assessmentService.getAssessmentByUserId(mockUserId);
      expect(result).toBeNull();
    });

    it('should throw ValidationError for invalid user ID', async () => {
      await expect(assessmentService.getAssessmentByUserId('invalid-uuid'))
        .rejects.toThrow(ValidationError);

      await expect(assessmentService.getAssessmentByUserId(null))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getAssessmentById', () => {
    it('should retrieve assessment by ID', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockDbAssessment,
        error: null,
      });

      const result = await assessmentService.getAssessmentById(mockAssessmentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAssessmentId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', mockAssessmentId);
    });

    it('should return null for non-existent assessment', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await assessmentService.getAssessmentById(mockAssessmentId);
      expect(result).toBeNull();
    });
  });

  describe('getAssessmentResponses', () => {
    it('should retrieve assessment responses for user', async () => {
      const mockResponses = [
        {
          id: '1',
          user_id: mockUserId,
          question_id: 1,
          response_value: 4,
          response_text: 'option-a',
        },
        {
          id: '2',
          user_id: mockUserId,
          question_id: 2,
          response_value: 3,
          response_text: 'option-b',
        },
      ];

      // Mock the query builder chain
      const responsesQuery = {
        ...mockQueryBuilder,
        order: vi.fn().mockResolvedValue({
          data: mockResponses,
          error: null,
        }),
      };

      mockQueryBuilder.eq.mockReturnValue(responsesQuery);

      const result = await assessmentService.getAssessmentResponses(mockUserId);

      expect(result).toEqual(mockResponses);
      expect(supabase.from).toHaveBeenCalledWith('assessment_responses');
    });

    it('should return empty array if no responses found', async () => {
      const responsesQuery = {
        ...mockQueryBuilder,
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockQueryBuilder.eq.mockReturnValue(responsesQuery);

      const result = await assessmentService.getAssessmentResponses(mockUserId);
      expect(result).toEqual([]);
    });
  });

  describe('updateAssessment', () => {
    it('should update assessment successfully', async () => {
      const updates = {
        openness: 0.8,
        conscientiousness: 0.6,
      };

      const updatedAssessment = {
        ...mockDbAssessment,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedAssessment,
        error: null,
      });

      const result = await assessmentService.updateAssessment(mockUserId, updates);

      expect(result).toBeDefined();
      expect(result.openness).toBe(updates.openness);
      expect(result.conscientiousness).toBe(updates.conscientiousness);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw ValidationError for non-existent user', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const updates = { openness: 0.8 };

      await expect(assessmentService.updateAssessment(mockUserId, updates))
        .rejects.toThrow(ValidationError);
    });

    it('should validate update data', async () => {
      const invalidUpdates = { openness: 1.5 }; // Invalid: > 1.0

      await expect(assessmentService.updateAssessment(mockUserId, invalidUpdates))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteAssessment', () => {
    it('should delete assessment and responses', async () => {
      // Mock the delete operations
      const responsesDelete = { ...mockQueryBuilder };
      const assessmentDelete = { ...mockQueryBuilder };

      supabase.from
        .mockReturnValueOnce(responsesDelete) // assessment_responses
        .mockReturnValueOnce(assessmentDelete); // personality_assessments

      responsesDelete.delete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      assessmentDelete.delete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const result = await assessmentService.deleteAssessment(mockUserId);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('assessment_responses');
      expect(supabase.from).toHaveBeenCalledWith('personality_assessments');
    });

    it('should throw DatabaseError on delete failure', async () => {
      const assessmentDelete = { ...mockQueryBuilder };
      supabase.from.mockReturnValue(assessmentDelete);

      assessmentDelete.delete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Foreign key constraint violation' }
        })
      });

      await expect(assessmentService.deleteAssessment(mockUserId))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('queryAssessments', () => {
    it('should query assessments with pagination', async () => {
      const mockAssessments = [mockDbAssessment];

      // Create a more complete mock query chain
      const queryMock = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockAssessments,
          error: null,
          count: 1,
        }),
      };

      mockQueryBuilder.select.mockReturnValue(queryMock);

      const result = await assessmentService.queryAssessments({
        userId: mockUserId,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should handle date range filtering', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const queryMock = {
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockQueryBuilder.select.mockReturnValue(queryMock);

      await assessmentService.queryAssessments({
        startDate,
        endDate,
        limit: 5,
        offset: 0,
      });

      expect(queryMock.gte).toHaveBeenCalledWith('completed_at', startDate.toISOString());
      expect(queryMock.lte).toHaveBeenCalledWith('completed_at', endDate.toISOString());
    });
  });

  describe('Real-time subscriptions', () => {
    it('should create subscription for assessment changes', () => {
      const mockCallback = vi.fn();

      const subscription = assessmentService.subscribeToAssessmentChanges(
        { userId: mockUserId },
        mockCallback
      );

      expect(subscription).toBeDefined();
      expect(subscription.subscriptionId).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');
      expect(typeof subscription.status).toBe('function');

      expect(supabase.channel).toHaveBeenCalled();
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'personality_assessments',
          filter: `user_id=eq.${mockUserId}`,
        }),
        expect.any(Function)
      );
    });

    it('should handle subscription callback execution', () => {
      const mockCallback = vi.fn();
      let callbackFn;

      mockChannel.on.mockImplementation((event, config, callback) => {
        callbackFn = callback;
        return mockChannel;
      });

      assessmentService.subscribeToAssessmentChanges({}, mockCallback);

      // Simulate a change event
      const mockPayload = {
        eventType: 'INSERT',
        new: mockDbAssessment,
        old: null,
      };

      callbackFn(mockPayload);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'INSERT',
          calculatorProfile: expect.any(Object),
        })
      );
    });

    it('should unsubscribe from subscription', () => {
      const mockCallback = vi.fn();

      const subscription = assessmentService.subscribeToAssessmentChanges(
        { userId: mockUserId },
        mockCallback
      );

      subscription.unsubscribe();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe all active subscriptions', () => {
      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();

      assessmentService.subscribeToAssessmentChanges({}, mockCallback1);
      assessmentService.subscribeToAssessmentChanges({}, mockCallback2);

      assessmentService.unsubscribeAll();

      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2);
    });

    it('should throw ValidationError for invalid callback', () => {
      expect(() => {
        assessmentService.subscribeToAssessmentChanges({}, 'not-a-function');
      }).toThrow(ValidationError);
    });
  });

  describe('Health status', () => {
    it('should return healthy status', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: [{ count: 10 }],
        error: null,
      });

      const health = await assessmentService.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.activeSubscriptions).toBe(0);
      expect(health.timestamp).toBeDefined();
    });

    it('should return unhealthy status on database error', async () => {
      mockQueryBuilder.limit.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const health = await assessmentService.getHealthStatus();

      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Connection failed');
    });

    it('should handle unexpected errors', async () => {
      mockQueryBuilder.limit.mockRejectedValue(new Error('Unexpected error'));

      const health = await assessmentService.getHealthStatus();

      expect(health.status).toBe('error');
      expect(health.error).toBe('Unexpected error');
    });
  });

  describe('Error handling', () => {
    it('should handle timeout errors', async () => {
      // Mock a very slow database response
      mockQueryBuilder.single.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 20000))
      );

      await expect(assessmentService.getAssessmentByUserId(mockUserId))
        .rejects.toThrow('timed out');
    }, 10000); // Allow time for timeout

    it('should not retry validation errors', async () => {
      const invalidInput = { userId: 'invalid' };

      await expect(assessmentService.saveAssessment(invalidInput))
        .rejects.toThrow(ValidationError);

      // Should not make any database calls for validation errors
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle unique constraint violations', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'unique_violation' },
      });

      await expect(assessmentService.saveAssessment(mockAssessmentInput))
        .rejects.toThrow(DatabaseError);
    });
  });
});

describe('Error classes', () => {
  it('should create AssessmentServiceError with proper properties', () => {
    const error = new AssessmentServiceError('Test message', 'TEST_CODE', { detail: 'test' });

    expect(error.name).toBe('AssessmentServiceError');
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 'test' });
    expect(error.timestamp).toBeDefined();
  });

  it('should create ValidationError as subclass', () => {
    const error = new ValidationError('Validation failed');

    expect(error).toBeInstanceOf(AssessmentServiceError);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should create DatabaseError as subclass', () => {
    const error = new DatabaseError('Database operation failed');

    expect(error).toBeInstanceOf(AssessmentServiceError);
    expect(error.name).toBe('DatabaseError');
    expect(error.code).toBe('DATABASE_ERROR');
  });
});