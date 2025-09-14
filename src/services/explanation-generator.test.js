/**
 * Test suite for AI-Powered Explanation Generator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCompatibilityExplanation,
  generateBulkExplanations,
  clearExplanationCache,
  getExplanationServiceConfig,
  getSupportedLanguages
} from './explanation-generator.js';
import { ScoringDimensionType } from '../types/compatibility';

// Mock fetch globally for API testing
global.fetch = vi.fn();

// Test data helpers
function createMockCompatibilityScore(overallScore = 75, dimensionScores = {}) {
  const defaultDimensions = {
    [ScoringDimensionType.PERSONALITY_TRAITS]: {
      name: 'Personality Traits',
      weight: 0.35,
      score: dimensionScores.personality || 75,
      maxScore: 100,
      calculatedAt: new Date()
    },
    [ScoringDimensionType.TRAVEL_PREFERENCES]: {
      name: 'Travel Preferences',
      weight: 0.25,
      score: dimensionScores.travel || 70,
      maxScore: 100,
      calculatedAt: new Date()
    },
    [ScoringDimensionType.EXPERIENCE_LEVEL]: {
      name: 'Experience Level',
      weight: 0.15,
      score: dimensionScores.experience || 60,
      maxScore: 100,
      calculatedAt: new Date()
    },
    [ScoringDimensionType.BUDGET_RANGE]: {
      name: 'Budget Range',
      weight: 0.15,
      score: dimensionScores.budget || 80,
      maxScore: 100,
      calculatedAt: new Date()
    },
    [ScoringDimensionType.ACTIVITY_PREFERENCES]: {
      name: 'Activity Preferences',
      weight: 0.10,
      score: dimensionScores.activities || 65,
      maxScore: 100,
      calculatedAt: new Date()
    }
  };

  return {
    user1Id: 'user_1',
    user2Id: 'user_2',
    groupId: 'group_123',
    overallScore,
    dimensions: defaultDimensions,
    confidence: 0.85,
    algorithmVersion: 'v1.0',
    calculatedAt: new Date()
  };
}

function mockAnthropicResponse(content) {
  return {
    ok: true,
    json: () => Promise.resolve({
      content: [{ text: content }]
    })
  };
}

function mockOpenAIResponse(content) {
  return {
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content } }]
    })
  };
}

describe('ExplanationGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearExplanationCache();

    // Set up environment variables for testing
    vi.stubEnv('VITE_ANTHROPIC_API_KEY', 'test_anthropic_key');
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test_openai_key');
    vi.stubEnv('ANTHROPIC_API_KEY', undefined);
    vi.stubEnv('OPENAI_API_KEY', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateCompatibilityExplanation', () => {
    it('should generate explanation using Anthropic API by default', async () => {
      const mockScore = createMockCompatibilityScore(85);
      const mockExplanation = 'You and your travel companion have excellent compatibility! Your personalities align beautifully, making for a harmonious travel experience.';

      fetch.mockResolvedValueOnce(mockAnthropicResponse(mockExplanation));

      const result = await generateCompatibilityExplanation(mockScore);

      expect(result.explanation).toBe(mockExplanation);
      expect(result.metadata.source).toBe('anthropic');
      expect(result.metadata.overallScore).toBe(85);
      expect(result.metadata.language).toBe('en');
      expect(result.metadata.tone).toBe('encouraging');

      // Verify API call
      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchCall = fetch.mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.anthropic.com/v1/messages');
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].headers['x-api-key']).toBe('test_anthropic_key');
    });

    it('should fallback to OpenAI if Anthropic fails', async () => {
      const mockScore = createMockCompatibilityScore(65);
      const mockExplanation = 'You have good compatibility with your travel companion, with strong alignment in key areas.';

      // Mock Anthropic failure then OpenAI success
      fetch
        .mockRejectedValueOnce(new Error('Anthropic API error'))
        .mockResolvedValueOnce(mockOpenAIResponse(mockExplanation));

      const result = await generateCompatibilityExplanation(mockScore);

      expect(result.explanation).toBe(mockExplanation);
      expect(result.metadata.source).toBe('openai');
      expect(result.metadata.error).toBe('Anthropic API error');

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should use template fallback when both AI providers fail', async () => {
      const mockScore = createMockCompatibilityScore(45);

      // Mock both API failures
      fetch
        .mockRejectedValueOnce(new Error('Anthropic API error'))
        .mockRejectedValueOnce(new Error('OpenAI API error'));

      const result = await generateCompatibilityExplanation(mockScore);

      expect(result.explanation).toContain('compatibility');
      expect(result.metadata.source).toBe('fallback');
      expect(result.metadata.overallScore).toBe(45);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect tone adjustments', async () => {
      const mockScore = createMockCompatibilityScore(35); // Poor compatibility
      const cautionaryResponse = 'While you have significant differences in travel preferences, understanding these differences can help you plan better.';

      fetch.mockResolvedValueOnce(mockAnthropicResponse(cautionaryResponse));

      const result = await generateCompatibilityExplanation(mockScore);

      expect(result.metadata.tone).toBe('cautionary');
      expect(result.explanation).toBe(cautionaryResponse);
    });

    it('should support different languages', async () => {
      const mockScore = createMockCompatibilityScore(80);
      const spanishResponse = '¡Tienen una excelente compatibilidad de viaje! Sus personalidades se complementan muy bien.';

      fetch.mockResolvedValueOnce(mockAnthropicResponse(spanishResponse));

      const result = await generateCompatibilityExplanation(mockScore, {
        language: 'es'
      });

      expect(result.explanation).toBe(spanishResponse);
      expect(result.metadata.language).toBe('es');

      // Verify Spanish was requested in the prompt
      const callArgs = fetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      expect(requestBody.messages[0].content).toContain('Spanish');
    });

    it('should use cache for repeated requests', async () => {
      const mockScore = createMockCompatibilityScore(75);
      const mockExplanation = 'Good compatibility with strong foundation for travel.';

      fetch.mockResolvedValueOnce(mockAnthropicResponse(mockExplanation));

      // First call
      const result1 = await generateCompatibilityExplanation(mockScore);
      expect(result1.metadata.source).toBe('anthropic');

      // Second call should use cache
      const result2 = await generateCompatibilityExplanation(mockScore);
      expect(result2.metadata.source).toBe('cache');
      expect(result2.explanation).toBe(mockExplanation);

      // Only one API call should have been made
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API timeouts gracefully', async () => {
      const mockScore = createMockCompatibilityScore(70);

      // Mock timeout that rejects quickly to avoid test timeout
      fetch
        .mockRejectedValueOnce(new Error('API request timeout'))
        .mockRejectedValueOnce(new Error('OpenAI API request timeout'));

      const result = await generateCompatibilityExplanation(mockScore, {
        provider: 'auto'
      });

      expect(result.metadata.source).toBe('fallback');
      expect(result.explanation).toContain('compatibility');
    });

    it('should validate input parameters', async () => {
      await expect(generateCompatibilityExplanation(null)).rejects.toThrow(
        'Invalid compatibility score provided'
      );

      await expect(generateCompatibilityExplanation({})).rejects.toThrow(
        'Invalid compatibility score provided'
      );

      await expect(
        generateCompatibilityExplanation({ overallScore: 'invalid' })
      ).rejects.toThrow('Invalid compatibility score provided');
    });

    it('should handle unsupported languages gracefully', async () => {
      const mockScore = createMockCompatibilityScore(75);
      const mockExplanation = 'Good compatibility explanation in English.';

      fetch.mockResolvedValueOnce(mockAnthropicResponse(mockExplanation));

      // Console.warn should be called for unsupported language
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await generateCompatibilityExplanation(mockScore, {
        language: 'unsupported'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Language unsupported not supported, falling back to English'
      );
      expect(result.metadata.language).toBe('en');
      expect(result.explanation).toBe(mockExplanation);

      consoleSpy.mockRestore();
    });

    it('should include context metadata in results', async () => {
      const mockScore = createMockCompatibilityScore(75, {
        personality: 85,
        travel: 90,
        experience: 45,
        budget: 70,
        activities: 60
      });

      fetch.mockResolvedValueOnce(mockAnthropicResponse('Good compatibility explanation'));

      const result = await generateCompatibilityExplanation(mockScore);

      expect(result.metadata.context.strengths).toBeGreaterThan(0);
      expect(result.metadata.context.challenges).toBeGreaterThan(0);
      expect(result.metadata.context.topStrength).toBeTruthy();
      expect(result.metadata.context.topChallenge).toBeTruthy();
    });
  });

  describe('generateBulkExplanations', () => {
    it('should generate explanations for multiple scores', async () => {
      const scores = [
        createMockCompatibilityScore(85),
        createMockCompatibilityScore(45),
        createMockCompatibilityScore(70)
      ];

      fetch
        .mockResolvedValueOnce(mockAnthropicResponse('Excellent compatibility'))
        .mockResolvedValueOnce(mockAnthropicResponse('Fair compatibility'))
        .mockResolvedValueOnce(mockAnthropicResponse('Good compatibility'));

      const results = await generateBulkExplanations(scores);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].explanation).toBe('Excellent compatibility');
      expect(results[1].success).toBe(true);
      expect(results[1].explanation).toBe('Fair compatibility');
      expect(results[2].success).toBe(true);
      expect(results[2].explanation).toBe('Good compatibility');
    });

    it('should handle partial failures in bulk operations', async () => {
      const scores = [
        createMockCompatibilityScore(85),
        createMockCompatibilityScore(45)
      ];

      fetch
        .mockResolvedValueOnce(mockAnthropicResponse('Excellent compatibility'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('OpenAI also failed'));

      const results = await generateBulkExplanations(scores);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].explanation).toBe('Excellent compatibility');
      expect(results[1].success).toBe(true); // Should succeed with fallback
      expect(results[1].metadata.source).toBe('fallback');
    }, 10000); // Increase timeout for bulk operations
  });

  describe('Cache Management', () => {
    it('should clear explanation cache', () => {
      // This mainly tests that the function doesn't throw
      expect(() => clearExplanationCache()).not.toThrow();
    });
  });

  describe('Configuration and Utilities', () => {
    it('should return service configuration', () => {
      const config = getExplanationServiceConfig();

      expect(config.hasAnthropicKey).toBe(true);
      expect(config.hasOpenAIKey).toBe(true);
      expect(config.supportedLanguages).toEqual(expect.arrayContaining(['en', 'es', 'fr', 'de']));
      expect(config.cacheTimeout).toBeTypeOf('number');
      expect(config.maxRetries).toBeTypeOf('number');
    });

    it('should return supported languages', () => {
      const languages = getSupportedLanguages();

      expect(languages).toHaveProperty('en');
      expect(languages).toHaveProperty('es');
      expect(languages).toHaveProperty('fr');
      expect(languages.en).toEqual({ name: 'English', code: 'en' });
    });
  });

  describe('Tone Adjustment', () => {
    it('should use encouraging tone for excellent scores', async () => {
      const excellentScore = createMockCompatibilityScore(90);
      fetch.mockResolvedValueOnce(mockAnthropicResponse('Encouraging explanation'));

      const result = await generateCompatibilityExplanation(excellentScore);
      expect(result.metadata.tone).toBe('encouraging');
    });

    it('should use cautionary tone for poor scores', async () => {
      const poorScore = createMockCompatibilityScore(25);
      fetch.mockResolvedValueOnce(mockAnthropicResponse('Cautionary explanation'));

      const result = await generateCompatibilityExplanation(poorScore);
      expect(result.metadata.tone).toBe('cautionary');
    });

    it('should allow tone override', async () => {
      const goodScore = createMockCompatibilityScore(75);
      fetch.mockResolvedValueOnce(mockAnthropicResponse('Positive explanation'));

      const result = await generateCompatibilityExplanation(goodScore, {
        tone: 'positive'
      });
      expect(result.metadata.tone).toBe('positive');
    });
  });

  describe('Provider Selection', () => {
    it('should use specific provider when requested', async () => {
      const mockScore = createMockCompatibilityScore(75);
      fetch.mockResolvedValueOnce(mockOpenAIResponse('OpenAI explanation'));

      const result = await generateCompatibilityExplanation(mockScore, {
        provider: 'openai'
      });

      expect(result.metadata.source).toBe('openai');
      const fetchCall = fetch.mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/chat/completions');
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer test_openai_key');
    });

    it('should use fallback provider when explicitly requested', async () => {
      const mockScore = createMockCompatibilityScore(75);

      const result = await generateCompatibilityExplanation(mockScore, {
        provider: 'fallback'
      });

      expect(result.metadata.source).toBe('fallback');
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});