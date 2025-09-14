import { describe, it, expect, beforeEach, vi } from 'vitest';
import searchService from '../searchService';
import { mockAdventures } from '../../data/mock-adventures';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchService.initialize(mockAdventures);
  });

  describe('initialization', () => {
    it('should initialize with adventure data', () => {
      expect(searchService.fuse).toBeDefined();
    });
  });

  describe('search', () => {
    it('should return empty array for empty query', () => {
      const results = searchService.search('');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      const results = searchService.search('   ');
      expect(results).toEqual([]);
    });

    it('should find exact matches', () => {
      const results = searchService.search('Iceland');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('score');
    });

    it('should find fuzzy matches', () => {
      const results = searchService.search('photograp');
      expect(results.length).toBeGreaterThan(0);

      // Should match "photography" adventures
      const hasPhotographyAdventure = results.some(result =>
        result.title.toLowerCase().includes('photography') ||
        result.tags?.includes('photography')
      );
      expect(hasPhotographyAdventure).toBe(true);
    });

    it('should search across multiple fields', () => {
      const results = searchService.search('Amazon');
      expect(results.length).toBeGreaterThan(0);

      // Should find adventures with Amazon in title, location, or description
      const hasAmazonReference = results.some(result =>
        result.title.toLowerCase().includes('amazon') ||
        result.location.toLowerCase().includes('amazon') ||
        result.description.toLowerCase().includes('amazon')
      );
      expect(hasAmazonReference).toBe(true);
    });

    it('should include highlights in results', () => {
      const results = searchService.search('photography');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('highlights');
    });

    it('should categorize results', () => {
      const results = searchService.search('photography');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('category');
    });

    it('should respect limit option', () => {
      const results = searchService.search('adventure', { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('suggestions', () => {
    it('should return empty suggestions for short query', () => {
      const suggestions = searchService.getSuggestions('a', mockAdventures);
      expect(suggestions.adventures).toEqual([]);
      expect(suggestions.locations).toEqual([]);
      expect(suggestions.activities).toEqual([]);
    });

    it('should return popular searches for empty query', () => {
      const suggestions = searchService.getSuggestions('', mockAdventures);
      expect(suggestions.popular.length).toBeGreaterThan(0);
    });

    it('should return categorized suggestions', () => {
      const suggestions = searchService.getSuggestions('photography', mockAdventures);
      expect(suggestions).toHaveProperty('adventures');
      expect(suggestions).toHaveProperty('locations');
      expect(suggestions).toHaveProperty('activities');
      expect(suggestions).toHaveProperty('popular');
    });

    it('should filter locations correctly', () => {
      const suggestions = searchService.getSuggestions('ice', mockAdventures);
      expect(suggestions.locations.some(loc => loc.toLowerCase().includes('iceland'))).toBe(true);
    });

    it('should filter activities correctly', () => {
      const suggestions = searchService.getSuggestions('photo', mockAdventures);
      expect(suggestions.activities.some(activity => activity.includes('photography'))).toBe(true);
    });
  });

  describe('recent searches', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('should save search to recent searches', () => {
      searchService.search('test query');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'travel_recent_searches',
        expect.stringContaining('test query')
      );
    });

    it('should load recent searches from localStorage', () => {
      const mockRecentSearches = JSON.stringify([
        { query: 'iceland', timestamp: '2024-01-01T00:00:00.000Z', count: 1 }
      ]);
      localStorageMock.getItem.mockReturnValue(mockRecentSearches);

      const recentSearches = searchService.loadRecentSearches();
      expect(recentSearches).toHaveLength(1);
      expect(recentSearches[0].query).toBe('iceland');
    });

    it('should clear recent searches', () => {
      searchService.clearRecentSearches();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('travel_recent_searches');
    });

    it('should limit recent searches to 10', () => {
      // Fill with 15 searches
      for (let i = 0; i < 15; i++) {
        searchService.search(`query ${i}`);
      }

      const recentSearches = searchService.getRecentSearches();
      expect(recentSearches.length).toBeLessThanOrEqual(10);
    });
  });

  describe('highlighting', () => {
    it('should generate highlights for matches', () => {
      const mockMatches = [
        {
          key: 'title',
          value: 'Northern Lights Photography',
          indices: [[0, 7], [14, 25]]
        }
      ];

      const highlights = searchService.generateHighlights(mockMatches);
      expect(highlights.title).toContain('<mark');
      expect(highlights.title).toContain('Northern');
      // The highlighting might split "Photography" across matches
      expect(highlights.title).toContain('Photograph');
    });

    it('should handle empty matches', () => {
      const highlights = searchService.generateHighlights([]);
      expect(Object.keys(highlights).length).toBe(0);
    });
  });

  describe('categorization', () => {
    it('should categorize photography adventures correctly', () => {
      const category = searchService.categorizeResult({
        tags: ['photography', 'nature']
      });
      expect(category).toBe('Photography');
    });

    it('should categorize cultural adventures correctly', () => {
      const category = searchService.categorizeResult({
        tags: ['culture', 'temples']
      });
      expect(category).toBe('Cultural');
    });

    it('should default to Adventure category', () => {
      const category = searchService.categorizeResult({
        tags: ['unknown']
      });
      expect(category).toBe('Adventure');
    });
  });

  describe('trending and popular searches', () => {
    it('should return trending searches', () => {
      const trending = searchService.getTrendingSearches();
      expect(trending).toBeInstanceOf(Array);
      expect(trending.length).toBeGreaterThan(0);
      expect(trending[0]).toHaveProperty('query');
      expect(trending[0]).toHaveProperty('trend');
    });

    it('should return search analytics', () => {
      const analytics = searchService.getSearchAnalytics();
      expect(analytics).toHaveProperty('totalSearches');
      expect(analytics).toHaveProperty('topQueries');
      expect(analytics).toHaveProperty('noResultsQueries');
      expect(analytics).toHaveProperty('averageResultCount');
    });
  });
});