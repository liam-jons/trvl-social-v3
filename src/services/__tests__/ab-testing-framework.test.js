import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock analytics service
vi.mock('../analytics-service.js', () => ({
  default: {
    trackEvent: vi.fn(),
    trackError: vi.fn(),
    trackExperiment: vi.fn(),
    trackFeatureUsage: vi.fn()
  }
}));

import { ABTestingService } from '../ab-testing-service.js';
import analyticsService from '../analytics-service.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ABTestingService', () => {
  let abTestingService;
  let mockUser;
  let mockContext;

  beforeEach(() => {
    abTestingService = new ABTestingService();
    mockUser = {
      id: 'user123',
      user_metadata: {
        user_type: 'traveler',
        personality_type: 'extrovert',
        country: 'US'
      },
      created_at: new Date().toISOString()
    };
    mockContext = {
      currentPage: '/adventures',
      country: 'US'
    };

    // Clear mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    abTestingService.resetUserAssignments();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await abTestingService.init();
      expect(abTestingService.isInitialized).toBe(true);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'ab_testing_initialized',
        expect.any(Object)
      );
    });

    test('should load default experiments and feature flags', async () => {
      await abTestingService.init();

      const experiments = abTestingService.getAllExperiments();
      const flags = abTestingService.getAllFeatureFlags();

      expect(experiments.length).toBeGreaterThan(0);
      expect(flags.length).toBeGreaterThan(0);

      // Check if default experiments exist
      const adventureCardExperiment = experiments.find(exp => exp.id === 'adventure_card_layout');
      expect(adventureCardExperiment).toBeDefined();
      expect(adventureCardExperiment.variants).toHaveLength(2);
    });
  });

  describe('User Eligibility', () => {
    let experiment;

    beforeEach(async () => {
      await abTestingService.init();
      experiment = abTestingService.getExperiment('adventure_card_layout');
    });

    test('should return true for eligible user', () => {
      const isEligible = abTestingService.isUserEligible(experiment, mockUser, mockContext);
      expect(isEligible).toBe(true);
    });

    test('should return false for wrong user type', () => {
      const vendorUser = {
        ...mockUser,
        user_metadata: { ...mockUser.user_metadata, user_type: 'vendor' }
      };
      const isEligible = abTestingService.isUserEligible(experiment, vendorUser, mockContext);
      expect(isEligible).toBe(false);
    });

    test('should return false for wrong page', () => {
      const wrongPageContext = { ...mockContext, currentPage: '/profile' };
      const isEligible = abTestingService.isUserEligible(experiment, mockUser, wrongPageContext);
      expect(isEligible).toBe(false);
    });

    test('should return false for inactive experiment', () => {
      const inactiveExperiment = { ...experiment, status: 'paused' };
      const isEligible = abTestingService.isUserEligible(inactiveExperiment, mockUser, mockContext);
      expect(isEligible).toBe(false);
    });

    test('should handle new user targeting', async () => {
      const newUserExperiment = {
        ...experiment,
        targeting: { ...experiment.targeting, newUsersOnly: true }
      };

      // Test with new user (created today)
      const newUser = {
        ...mockUser,
        created_at: new Date().toISOString()
      };
      expect(abTestingService.isUserEligible(newUserExperiment, newUser, mockContext)).toBe(true);

      // Test with old user (created 30 days ago)
      const oldUser = {
        ...mockUser,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      expect(abTestingService.isUserEligible(newUserExperiment, oldUser, mockContext)).toBe(false);
    });
  });

  describe('User Assignment', () => {
    let experiment;

    beforeEach(async () => {
      await abTestingService.init();
      experiment = abTestingService.getExperiment('adventure_card_layout');
    });

    test('should assign user to experiment variant', () => {
      const assignment = abTestingService.assignUserToExperiment(experiment.id, mockUser.id, experiment);

      expect(assignment).toBeDefined();
      expect(assignment.experimentId).toBe(experiment.id);
      expect(assignment.userId).toBe(mockUser.id);
      expect(['control', 'compact']).toContain(assignment.variantId);
      expect(assignment.assignedAt).toBeDefined();
    });

    test('should return consistent assignment for same user', () => {
      const assignment1 = abTestingService.assignUserToExperiment(experiment.id, mockUser.id, experiment);
      const assignment2 = abTestingService.assignUserToExperiment(experiment.id, mockUser.id, experiment);

      expect(assignment1.variantId).toBe(assignment2.variantId);
    });

    test('should track assignment event', () => {
      abTestingService.assignUserToExperiment(experiment.id, mockUser.id, experiment);

      expect(analyticsService.trackExperiment).toHaveBeenCalledWith(
        experiment.id,
        expect.any(String)
      );
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'experiment_assignment',
        expect.objectContaining({
          experiment_id: experiment.id,
          variant_id: expect.any(String)
        })
      );
    });

    test('should respect traffic allocation', () => {
      const lowTrafficExperiment = {
        ...experiment,
        trafficAllocation: 0.01 // 1% traffic
      };

      let assignedCount = 0;
      const totalTests = 100;

      // Test with many different users
      for (let i = 0; i < totalTests; i++) {
        const assignment = abTestingService.assignUserToExperiment(
          lowTrafficExperiment.id,
          `user${i}`,
          lowTrafficExperiment
        );
        if (assignment) assignedCount++;
      }

      // Should be close to 1% (allowing for randomness)
      expect(assignedCount).toBeLessThan(10); // Should be much less than 10% of users
    });
  });

  describe('Feature Flags', () => {
    beforeEach(async () => {
      await abTestingService.init();
    });

    test('should check enabled feature flag', () => {
      const isEnabled = abTestingService.isFeatureEnabled('ai_trip_recommendations', mockUser, mockContext);
      expect(isEnabled).toBe(true);
    });

    test('should check disabled feature flag', () => {
      const isEnabled = abTestingService.isFeatureEnabled('video_chat_enabled', mockUser, mockContext);
      expect(isEnabled).toBe(false);
    });

    test('should respect user type targeting', () => {
      // vendor_analytics_v2 is targeted to vendors only
      const travelerEnabled = abTestingService.isFeatureEnabled('vendor_analytics_v2', mockUser, mockContext);
      expect(travelerEnabled).toBe(false);

      const vendorUser = {
        ...mockUser,
        user_metadata: { ...mockUser.user_metadata, user_type: 'vendor', subscription_status: 'premium' }
      };
      const vendorEnabled = abTestingService.isFeatureEnabled('vendor_analytics_v2', vendorUser, mockContext);
      expect(vendorEnabled).toBe(true);
    });

    test('should respect premium requirement', () => {
      const freeUser = {
        ...mockUser,
        user_metadata: { ...mockUser.user_metadata, user_type: 'vendor', subscription_status: 'free' }
      };
      const freeUserEnabled = abTestingService.isFeatureEnabled('vendor_analytics_v2', freeUser, mockContext);
      expect(freeUserEnabled).toBe(false);
    });

    test('should track feature usage', () => {
      abTestingService.isFeatureEnabled('ai_trip_recommendations', mockUser, mockContext);

      expect(analyticsService.trackFeatureUsage).toHaveBeenCalledWith(
        'ai_trip_recommendations',
        expect.objectContaining({
          enabled: true,
          user_type: 'traveler'
        })
      );
    });
  });

  describe('Experiment Tracking', () => {
    let experiment;

    beforeEach(async () => {
      await abTestingService.init();
      experiment = abTestingService.getExperiment('adventure_card_layout');
      // Assign user to experiment first
      abTestingService.assignUserToExperiment(experiment.id, mockUser.id, experiment);
    });

    test('should track experiment event', () => {
      abTestingService.trackExperimentEvent(
        experiment.id,
        'click',
        { element: 'adventure_card' },
        mockUser
      );

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'experiment_click',
        expect.objectContaining({
          experiment_id: experiment.id,
          variant_id: expect.any(String),
          event_name: 'click',
          element: 'adventure_card'
        })
      );
    });

    test('should not track events for users not in experiment', () => {
      const unassignedUser = { id: 'unassigned_user' };

      abTestingService.trackExperimentEvent(
        experiment.id,
        'click',
        { element: 'adventure_card' },
        unassignedUser
      );

      // Should not track experiment event
      expect(analyticsService.trackEvent).not.toHaveBeenCalledWith(
        'experiment_click',
        expect.any(Object)
      );
    });
  });

  describe('Statistical Analysis', () => {
    let experiment;

    beforeEach(async () => {
      await abTestingService.init();
      experiment = abTestingService.getExperiment('adventure_card_layout');
    });

    test('should record experiment metrics', () => {
      abTestingService.recordExperimentMetric(
        experiment.id,
        'control',
        'click_rate',
        { value: 0.15 }
      );

      const metrics = abTestingService.getStoredMetrics();
      const key = `${experiment.id}_control_click_rate`;

      expect(metrics[key]).toBeDefined();
      expect(metrics[key].count).toBe(1);
      expect(metrics[key].sum).toBe(0.15);
    });

    test('should calculate experiment results', () => {
      // Add sample data for both variants
      for (let i = 0; i < 50; i++) {
        abTestingService.recordExperimentMetric(
          experiment.id,
          'control',
          'adventure_click_rate',
          { value: 0.10 + Math.random() * 0.05 }
        );
      }

      for (let i = 0; i < 50; i++) {
        abTestingService.recordExperimentMetric(
          experiment.id,
          'compact',
          'adventure_click_rate',
          { value: 0.12 + Math.random() * 0.05 }
        );
      }

      const results = abTestingService.getExperimentResults(experiment.id);

      expect(results).toBeDefined();
      expect(results.experiment.id).toBe(experiment.id);
      expect(results.variants.control).toBeDefined();
      expect(results.variants.compact).toBeDefined();
      expect(results.significance).toBeDefined();
      expect(results.recommendations).toBeDefined();
    });

    test('should detect insufficient sample size', () => {
      // Add very small sample
      abTestingService.recordExperimentMetric(experiment.id, 'control', 'adventure_click_rate', { value: 0.10 });
      abTestingService.recordExperimentMetric(experiment.id, 'compact', 'adventure_click_rate', { value: 0.12 });

      const results = abTestingService.getExperimentResults(experiment.id);

      expect(results.significance.significant).toBe(false);
      expect(results.significance.reason).toContain('Minimum sample size not reached');
    });
  });

  describe('Experiment Management', () => {
    beforeEach(async () => {
      await abTestingService.init();
    });

    test('should create new experiment', () => {
      const newExperiment = abTestingService.createExperiment({
        id: 'test_experiment',
        name: 'Test Experiment',
        description: 'A test experiment',
        variants: [
          { id: 'control', name: 'Control', allocation: 0.5 },
          { id: 'test', name: 'Test', allocation: 0.5 }
        ],
        metrics: { primary: 'conversion_rate' },
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        hypothesis: 'Test hypothesis'
      });

      expect(newExperiment).toBeDefined();
      expect(newExperiment.id).toBe('test_experiment');
      expect(newExperiment.status).toBe('draft');

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'experiment_created',
        expect.objectContaining({
          experiment_id: 'test_experiment'
        })
      );
    });

    test('should update experiment status', () => {
      const experimentId = 'adventure_card_layout';
      const result = abTestingService.updateExperimentStatus(experimentId, 'paused');

      expect(result).toBe(true);

      const experiment = abTestingService.getExperiment(experimentId);
      expect(experiment.status).toBe('paused');

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'experiment_status_changed',
        expect.objectContaining({
          experiment_id: experimentId,
          new_status: 'paused'
        })
      );
    });

    test('should create feature flag', () => {
      const newFlag = abTestingService.createFeatureFlag({
        id: 'test_flag',
        name: 'Test Flag',
        description: 'A test feature flag',
        enabled: true,
        rolloutPercentage: 50
      });

      expect(newFlag).toBeDefined();
      expect(newFlag.id).toBe('test_flag');
      expect(newFlag.enabled).toBe(true);
      expect(newFlag.rolloutPercentage).toBe(50);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'feature_flag_created',
        expect.objectContaining({
          flag_id: 'test_flag'
        })
      );
    });

    test('should update feature flag', () => {
      const flagId = 'ai_trip_recommendations';
      const result = abTestingService.updateFeatureFlag(flagId, {
        rolloutPercentage: 75
      });

      expect(result).toBe(true);

      const flag = abTestingService.getFeatureFlag(flagId);
      expect(flag.rolloutPercentage).toBe(75);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'feature_flag_updated',
        expect.objectContaining({
          flag_id: flagId,
          new_rollout: 75
        })
      );
    });
  });

  describe('Hash Function', () => {
    beforeEach(async () => {
      await abTestingService.init();
    });

    test('should produce consistent hash for same input', () => {
      const hash1 = abTestingService.hashUserId('user123', 'experiment1');
      const hash2 = abTestingService.hashUserId('user123', 'experiment1');

      expect(hash1).toBe(hash2);
    });

    test('should produce different hash for different input', () => {
      const hash1 = abTestingService.hashUserId('user123', 'experiment1');
      const hash2 = abTestingService.hashUserId('user456', 'experiment1');

      expect(hash1).not.toBe(hash2);
    });

    test('should produce values between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const hash = abTestingService.hashUserId(`user${i}`, 'test');
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Persistence', () => {
    beforeEach(async () => {
      await abTestingService.init();
    });

    test('should persist user assignments', () => {
      const experiment = abTestingService.getExperiment('adventure_card_layout');
      abTestingService.assignUserToExperiment(experiment.id, mockUser.id, experiment);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'trvl_ab_tests',
        expect.any(String)
      );
    });

    test('should load persisted assignments', () => {
      const storedAssignments = {
        'adventure_card_layout_user123': {
          experimentId: 'adventure_card_layout',
          variantId: 'control',
          userId: 'user123',
          assignedAt: new Date().toISOString()
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedAssignments));

      const newService = new ABTestingService();
      newService.loadPersistedAssignments();

      expect(newService.userAssignments.size).toBe(1);
      expect(newService.userAssignments.get('adventure_card_layout_user123')).toBeDefined();
    });
  });
});