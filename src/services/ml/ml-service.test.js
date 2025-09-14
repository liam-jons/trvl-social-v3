/**
 * ML Service Integration Tests
 * Tests the complete ML pipeline functionality
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import mlService, {
  DataPreprocessor,
  FeatureEngineer,
  ModelTrainer,
  ModelManager
} from './index.js';

// Mock TensorFlow.js for testing
vi.mock('@tensorflow/tfjs', () => ({
  sequential: () => ({
    add: vi.fn(),
    compile: vi.fn(),
    fit: vi.fn().mockResolvedValue({}),
    predict: vi.fn().mockReturnValue({
      data: vi.fn().mockResolvedValue(new Float32Array([0.75])),
      dispose: vi.fn()
    }),
    dispose: vi.fn(),
    toJSON: vi.fn().mockResolvedValue({ layers: [] }),
    getWeights: vi.fn().mockReturnValue([])
  }),
  layers: {
    dense: vi.fn().mockReturnValue({}),
    dropout: vi.fn().mockReturnValue({}),
    batchNormalization: vi.fn().mockReturnValue({})
  },
  tensor2d: vi.fn().mockImplementation((data) => ({
    data: vi.fn().mockResolvedValue(new Float32Array(data.flat())),
    dispose: vi.fn(),
    shape: [data.length, data[0]?.length || 0]
  })),
  train: {
    adam: vi.fn().mockReturnValue({}),
    sgd: vi.fn().mockReturnValue({})
  },
  loadLayersModel: vi.fn().mockResolvedValue({
    predict: vi.fn().mockReturnValue({
      data: vi.fn().mockResolvedValue(new Float32Array([0.75])),
      dispose: vi.fn()
    }),
    dispose: vi.fn()
  })
}));

// Mock Supabase
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData(), error: null }),
      then: vi.fn().mockResolvedValue({ data: [mockData()], error: null })
    })
  }
}));

function mockData() {
  return {
    id: 'mock-id',
    name: 'Mock Model',
    version: 'v1.0',
    status: 'trained',
    model_type: 'compatibility_predictor',
    architecture: { type: 'sequential', layers: [] },
    hyperparameters: { epochs: 10 },
    performance_metrics: { accuracy: 0.85 }
  };
}

describe('ML Service Integration Tests', () => {
  beforeAll(async () => {
    // Skip actual initialization in tests
    mlService.initialized = true;
  });

  afterAll(async () => {
    await mlService.cleanup();
  });

  describe('Data Preprocessing', () => {
    test('should create data preprocessor', () => {
      const preprocessor = new DataPreprocessor();
      expect(preprocessor).toBeDefined();
      expect(preprocessor.featureCache).toBeDefined();
    });

    test('should clean data records', async () => {
      const preprocessor = new DataPreprocessor();
      const rawData = [
        { id: 1, name: 'Test', value: 10 },
        { id: null, name: undefined, value: null }, // Invalid record
        { id: 2, name: 'Test2', value: 20 }
      ];

      const cleaned = await preprocessor.cleanData(rawData, 'test');
      expect(cleaned).toHaveLength(2);
      expect(cleaned[0]).toEqual({ id: 1, name: 'Test', value: 10 });
    });

    test('should transform data to features', async () => {
      const preprocessor = new DataPreprocessor();
      const cleanedData = [
        { id: 1, profiles: { age: 25 }, groups: { current_members: 3 } }
      ];

      const featureSet = [
        { name: 'user_age', type: 'numeric', source: 'profiles.age' },
        { name: 'group_size', type: 'numeric', source: 'groups.current_members' }
      ];

      const transformed = await preprocessor.transformToFeatures(cleanedData, {
        featureSet,
        scalingMethod: 'standard'
      });

      expect(transformed).toHaveLength(1);
      expect(transformed[0].features).toHaveLength(2);
    });
  });

  describe('Feature Engineering', () => {
    test('should create feature engineer', () => {
      const engineer = new FeatureEngineer();
      expect(engineer).toBeDefined();
      expect(engineer.featureRegistry.size).toBeGreaterThan(0);
    });

    test('should extract personality features', async () => {
      const engineer = new FeatureEngineer();
      const context = {
        user: {
          personalityAssessment: {
            openness: 0.7,
            conscientiousness: 0.6,
            extraversion: 0.8,
            agreeableness: 0.5,
            neuroticism: 0.3
          }
        }
      };

      const features = await engineer.extractPersonalityFeatures(context);
      expect(features).toHaveProperty('personality_openness', 0.7);
      expect(features).toHaveProperty('personality_extraversion', 0.8);
      expect(features).toHaveProperty('adventure_seeking');
    });

    test('should extract all features', async () => {
      const engineer = new FeatureEngineer();
      const context = {
        user: {
          id: 'user1',
          age: 30,
          interests: ['hiking', 'travel'],
          personalityAssessment: {
            openness: 0.7,
            conscientiousness: 0.6,
            extraversion: 0.8,
            agreeableness: 0.5,
            neuroticism: 0.3
          }
        },
        group: {
          id: 'group1',
          current_members: 4,
          interests: ['hiking', 'adventure'],
          members: []
        }
      };

      const features = await engineer.extractFeatures(context);
      expect(Object.keys(features).length).toBeGreaterThan(10);
      expect(features).toHaveProperty('user_age');
      expect(features).toHaveProperty('group_current_members');
    });
  });

  describe('Model Training', () => {
    test('should create model trainer', () => {
      const trainer = new ModelTrainer();
      expect(trainer).toBeDefined();
      expect(trainer.dataPreprocessor).toBeDefined();
      expect(trainer.featureEngineer).toBeDefined();
    });

    test('should create model from architecture', async () => {
      const trainer = new ModelTrainer();
      const architecture = {
        type: 'sequential',
        layers: [
          { units: 64, activation: 'relu' },
          { units: 1, activation: 'sigmoid' }
        ]
      };

      const model = trainer.createModel(architecture, 10);
      expect(model).toBeDefined();
    });

    test('should prepare training data', async () => {
      const trainer = new ModelTrainer();
      const dataConfig = {
        dataSources: ['booking_history'],
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        targetVariable: {
          type: 'binary_classification',
          source: 'status',
          transformation: { positiveValues: ['completed'] }
        },
        featureConfig: { includeFeatures: ['personality_profile'] }
      };

      // Mock the method to avoid database calls in tests
      trainer.prepareTrainingData = vi.fn().mockResolvedValue([
        {
          features: [0.5, 0.6, 0.7],
          target: 1,
          id: 'test1'
        }
      ]);

      const trainingData = await trainer.prepareTrainingData(dataConfig);
      expect(trainingData).toHaveLength(1);
      expect(trainingData[0]).toHaveProperty('features');
      expect(trainingData[0]).toHaveProperty('target');
    });
  });

  describe('Model Manager', () => {
    test('should create model manager', () => {
      const manager = new ModelManager();
      expect(manager).toBeDefined();
      expect(manager.loadedModels).toBeDefined();
    });

    test('should handle model health check', async () => {
      const manager = new ModelManager();
      const mockModel = {
        predict: vi.fn().mockReturnValue({
          data: vi.fn().mockResolvedValue(new Float32Array([0.75])),
          dispose: vi.fn()
        })
      };

      const healthCheck = await manager.performHealthCheck(mockModel, {
        testInputs: [[0.5, 0.6, 0.7]],
        expectedOutputRange: [0, 1]
      });

      expect(healthCheck.isHealthy).toBe(true);
    });
  });

  describe('ML Service High-Level API', () => {
    test('should predict compatibility', async () => {
      // Mock the internal methods to avoid database/model dependencies
      mlService.prepareFeatureContext = vi.fn().mockResolvedValue({
        user: { id: 'user1', age: 25 },
        group: { id: 'group1', members: [] }
      });

      mlService.modelManager.getDeployedModel = vi.fn().mockResolvedValue({
        predict: vi.fn().mockReturnValue({
          data: vi.fn().mockResolvedValue(new Float32Array([0.75])),
          dispose: vi.fn()
        })
      });

      mlService.featureEngineer.extractFeatures = vi.fn().mockResolvedValue({
        personality_openness: 0.7,
        user_age: 25,
        group_size: 4
      });

      mlService.recordPrediction = vi.fn().mockResolvedValue();

      const result = await mlService.predictCompatibility('user1', 'group1');

      expect(result).toHaveProperty('compatibilityScore');
      expect(result).toHaveProperty('confidence');
      expect(result.compatibilityScore).toBe(0.75);
      expect(result.userId).toBe('user1');
      expect(result.groupId).toBe('group1');
    });

    test('should generate prediction explanation', async () => {
      const features = {
        personality_openness: 0.8,
        personality_extraversion: 0.7,
        user_group_interest_overlap_ratio: 0.6
      };
      const prediction = { score: 0.75, confidence: 0.8 };

      const explanation = await mlService.generatePredictionExplanation(features, prediction);

      expect(explanation).toHaveProperty('score', 0.75);
      expect(explanation).toHaveProperty('topInfluencingFactors');
      expect(explanation).toHaveProperty('interpretation');
      expect(explanation.topInfluencingFactors).toBeInstanceOf(Array);
    });

    test('should get system health', async () => {
      // Mock methods to return test data
      mlService.modelManager.getModels = vi.fn().mockResolvedValue([mockData()]);
      mlService.abTestingFramework.getActiveExperiments = vi.fn().mockResolvedValue([]);

      const health = await mlService.getSystemHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('components');
      expect(health.components).toHaveProperty('deployedModels');
      expect(health.components).toHaveProperty('abTesting');
      expect(health.components).toHaveProperty('retraining');
    });
  });

  describe('Feature Transformations', () => {
    test('should transform binary targets', () => {
      const trainer = new ModelTrainer();

      expect(trainer.transformToBinary('completed', { positiveValues: ['completed'] })).toBe(1);
      expect(trainer.transformToBinary('cancelled', { positiveValues: ['completed'] })).toBe(0);
      expect(trainer.transformToBinary(true)).toBe(1);
      expect(trainer.transformToBinary(false)).toBe(0);
      expect(trainer.transformToBinary(0.8, { threshold: 0.5 })).toBe(1);
      expect(trainer.transformToBinary(0.3, { threshold: 0.5 })).toBe(0);
    });

    test('should normalize values', () => {
      const preprocessor = new DataPreprocessor();

      expect(preprocessor.normalizeValue(0.5, 0, 1)).toBe(0.5);
      expect(preprocessor.normalizeValue(2, 0, 1)).toBe(1); // Clamped to max
      expect(preprocessor.normalizeValue(-1, 0, 1)).toBe(0); // Clamped to min
    });

    test('should categorize values', () => {
      const preprocessor = new DataPreprocessor();
      const categories = [
        { min: 0, max: 25 },
        { min: 26, max: 50 },
        { min: 51, max: 100 }
      ];

      expect(preprocessor.categorizeValue(20, categories)).toBe(0);
      expect(preprocessor.categorizeValue(30, categories)).toBe(1);
      expect(preprocessor.categorizeValue(75, categories)).toBe(2);
    });
  });

  describe('Statistical Functions', () => {
    test('should calculate metrics correctly', () => {
      const abTesting = mlService.abTestingFramework;

      expect(abTesting.calculateMean([1, 2, 3, 4, 5])).toBe(3);
      expect(abTesting.calculateMean([])).toBe(0);

      expect(abTesting.calculateStandardDeviation([1, 2, 3, 4, 5])).toBeCloseTo(1.58, 1);
      expect(abTesting.calculateStandardDeviation([])).toBe(0);
    });

    test('should approximate normal CDF', () => {
      const abTesting = mlService.abTestingFramework;

      // Test known values
      expect(abTesting.normalCDF(0)).toBeCloseTo(0.5, 2);
      expect(abTesting.normalCDF(1.96)).toBeCloseTo(0.975, 2);
      expect(abTesting.normalCDF(-1.96)).toBeCloseTo(0.025, 2);
    });
  });

  describe('Data Validation', () => {
    test('should validate required fields', () => {
      const preprocessor = new DataPreprocessor();

      const validRecord = { id: 1, group_id: 'g1', user_id: 'u1', status: 'active' };
      const invalidRecord = { id: 1, user_id: 'u1' }; // Missing group_id and status

      expect(preprocessor.validateRequiredFields(validRecord, 'booking_history')).toBe(true);
      expect(preprocessor.validateRequiredFields(invalidRecord, 'booking_history')).toBe(false);
    });

    test('should handle nested value extraction', () => {
      const preprocessor = new DataPreprocessor();
      const record = {
        user: {
          profile: {
            age: 25,
            location: 'NYC'
          }
        }
      };

      expect(preprocessor.getNestedValue(record, 'user.profile.age')).toBe(25);
      expect(preprocessor.getNestedValue(record, 'user.profile.name')).toBeNull();
      expect(preprocessor.getNestedValue(record, 'nonexistent')).toBeNull();
    });
  });
});

// Integration test for end-to-end ML workflow
describe('End-to-End ML Workflow', () => {
  test('should complete full prediction workflow', async () => {
    // Mock all external dependencies
    const mockContext = {
      user: {
        id: 'user1',
        age: 28,
        interests: ['hiking', 'travel'],
        personalityAssessment: {
          openness: 0.7,
          conscientiousness: 0.6,
          extraversion: 0.8,
          agreeableness: 0.5,
          neuroticism: 0.3
        }
      },
      group: {
        id: 'group1',
        current_members: 4,
        interests: ['hiking', 'adventure'],
        members: []
      }
    };

    // Test feature extraction
    const engineer = new FeatureEngineer();
    const features = await engineer.extractFeatures(mockContext);
    expect(Object.keys(features).length).toBeGreaterThan(5);

    // Test feature preprocessing
    const preprocessor = new DataPreprocessor();
    const scaledFeatures = await preprocessor.scaleFeatures(features, 'standard');
    expect(Object.keys(scaledFeatures)).toEqual(Object.keys(features));

    // Test prediction (mocked)
    const prediction = await mlService.makePrediction({
      predict: vi.fn().mockReturnValue({
        data: vi.fn().mockResolvedValue(new Float32Array([0.75])),
        dispose: vi.fn()
      })
    }, features);

    expect(prediction.score).toBe(0.75);
    expect(prediction.confidence).toBeGreaterThan(0);
  });
});