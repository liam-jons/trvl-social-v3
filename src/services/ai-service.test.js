import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generatePersonalityDescriptions,
  clearDescriptionCache,
  getAIServiceConfig
} from './ai-service.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ai-service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePersonalityDescriptions', () => {
    const mockProfile = {
      energyLevel: 75,
      socialPreference: 60,
      adventureStyle: 85,
      riskTolerance: 50,
      personalityType: 'The Adventurer'
    };

    it('should validate profile input', async () => {
      await expect(generatePersonalityDescriptions(null)).rejects.toThrow('Invalid personality profile');
      await expect(generatePersonalityDescriptions({})).rejects.toThrow('Missing required profile fields');

      const incompleteProfile = { energyLevel: 75 };
      await expect(generatePersonalityDescriptions(incompleteProfile)).rejects.toThrow('Missing required profile fields');
    });

    it('should return cached results when available', async () => {
      const cachedDescriptions = {
        energyLevel: 'Cached energy description',
        socialPreference: 'Cached social description',
        adventureStyle: 'Cached adventure description',
        riskTolerance: 'Cached risk description'
      };

      // Manually set cache
      const cacheKey = `ai_desc_75_60_85_50_The Adventurer`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: cachedDescriptions,
        timestamp: Date.now()
      }));

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('cache');
      expect(result.descriptions).toEqual(cachedDescriptions);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should make AI API call when no cache exists', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            energyLevel: 'You have high energy and love active pursuits.',
            socialPreference: 'You enjoy balanced social interactions.',
            adventureStyle: 'You seek unique and thrilling experiences.',
            riskTolerance: 'You take calculated risks in your adventures.'
          })
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('ai');
      expect(result.descriptions).toHaveProperty('energyLevel');
      expect(result.descriptions).toHaveProperty('socialPreference');
      expect(result.descriptions).toHaveProperty('adventureStyle');
      expect(result.descriptions).toHaveProperty('riskTolerance');
      expect(mockFetch).toHaveBeenCalledOnce();

      // Verify API call parameters
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['x-api-key']).toBeDefined();
    });

    it('should cache successful AI responses', async () => {
      const mockDescriptions = {
        energyLevel: 'AI generated energy description',
        socialPreference: 'AI generated social description',
        adventureStyle: 'AI generated adventure description',
        riskTolerance: 'AI generated risk description'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: JSON.stringify(mockDescriptions) }]
        })
      });

      await generatePersonalityDescriptions(mockProfile);

      const cacheKey = `ai_desc_75_60_85_50_The Adventurer`;
      const cached = localStorage.getItem(cacheKey);
      expect(cached).toBeTruthy();

      const { data } = JSON.parse(cached);
      expect(data).toEqual(mockDescriptions);
    });

    it('should handle API errors with retry logic', async () => {
      // Mock first two calls to fail, third to succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: [{ text: JSON.stringify({
              energyLevel: 'Success after retry',
              socialPreference: 'Success after retry',
              adventureStyle: 'Success after retry',
              riskTolerance: 'Success after retry'
            })}]
          })
        });

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('ai');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fallback to static descriptions after max retries', async () => {
      // Mock all API calls to fail
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('fallback');
      expect(result.error).toBeDefined();
      expect(result.descriptions).toHaveProperty('energyLevel');
      expect(result.descriptions.energyLevel).toContain('high-energy'); // Static description
    }, 15000); // Increase timeout

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: 'invalid json' }] })
      });

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('fallback');
      expect(result.error).toContain('Failed to parse AI response');
    });

    it('should handle API timeout', async () => {
      // Mock a delayed response that exceeds timeout
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 15000))
      );

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('fallback');
      expect(result.error).toBeDefined();
    }, 15000);

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({
          error: { message: 'Rate limit exceeded' }
        })
      });

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('fallback');
      expect(result.error).toContain('API request failed: 429');
    }, 10000);

    it('should handle missing API key', async () => {
      // Mock missing API key
      const originalEnv = import.meta.env.VITE_ANTHROPIC_API_KEY;
      import.meta.env.VITE_ANTHROPIC_API_KEY = '';

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('fallback');
      expect(result.error).toContain('API key not configured');

      // Restore original value
      import.meta.env.VITE_ANTHROPIC_API_KEY = originalEnv;
    }, 10000);
  });

  describe('cache management', () => {
    it('should clear description cache', () => {
      // Add some cache entries
      localStorage.setItem('ai_desc_test1', 'value1');
      localStorage.setItem('ai_desc_test2', 'value2');
      localStorage.setItem('other_key', 'should_remain');

      clearDescriptionCache();

      expect(localStorage.getItem('ai_desc_test1')).toBeNull();
      expect(localStorage.getItem('ai_desc_test2')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('should_remain');
    });

    it('should expire old cache entries', async () => {
      const mockProfile = {
        energyLevel: 50,
        socialPreference: 50,
        adventureStyle: 50,
        riskTolerance: 50,
        personalityType: 'Test Type'
      };

      // Add expired cache entry
      const cacheKey = `ai_desc_50_50_50_50_Test Type`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: { test: 'expired' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      }));

      // Mock fresh API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: JSON.stringify({
            energyLevel: 'Fresh description',
            socialPreference: 'Fresh description',
            adventureStyle: 'Fresh description',
            riskTolerance: 'Fresh description'
          })}]
        })
      });

      const result = await generatePersonalityDescriptions(mockProfile);

      expect(result.source).toBe('ai'); // Should make new API call, not use cache
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  describe('getAIServiceConfig', () => {
    it('should return configuration information', () => {
      const config = getAIServiceConfig();

      expect(config).toHaveProperty('hasApiKey');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('cacheTimeout');
      expect(config).toHaveProperty('maxRetries');
      expect(typeof config.hasApiKey).toBe('boolean');
    });
  });
});