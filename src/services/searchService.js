import Fuse from 'fuse.js';

/**
 * Search service for fuzzy matching adventures across multiple fields
 */
class SearchService {
  constructor() {
    this.fuse = null;
    this.recentSearches = this.loadRecentSearches();
    this.popularSearches = [
      'northern lights',
      'photography',
      'iceland',
      'amazon',
      'conservation',
      'trekking',
      'himalayan',
      'sailing',
      'greece',
      'wildlife',
      'culture',
      'meditation'
    ];
  }

  /**
   * Initialize Fuse.js with adventure data
   * @param {Array} adventures - Array of adventure objects
   */
  initialize(adventures) {
    const options = {
      includeScore: true,
      includeMatches: true,
      threshold: 0.6, // More lenient matching
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        {
          name: 'title',
          weight: 0.3
        },
        {
          name: 'description',
          weight: 0.2
        },
        {
          name: 'location',
          weight: 0.2
        },
        {
          name: 'tags',
          weight: 0.15
        },
        {
          name: 'vendor.name',
          weight: 0.1
        },
        {
          name: 'difficulty',
          weight: 0.05
        }
      ]
    };

    this.fuse = new Fuse(adventures, options);
  }

  /**
   * Search adventures with fuzzy matching
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Search results with relevance scores and highlighting
   */
  search(query, options = {}) {
    if (!this.fuse || !query.trim()) {
      return [];
    }

    const {
      limit = 20,
      includeAll = false
    } = options;

    // Save search to recent searches
    this.saveRecentSearch(query.trim());

    // Perform search
    const results = this.fuse.search(query, { limit: includeAll ? undefined : limit });

    // Process results to include highlighting and categorization
    return results.map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches,
      highlights: this.generateHighlights(result.matches),
      category: this.categorizeResult(result.item)
    }));
  }

  /**
   * Get search suggestions based on input
   * @param {string} query - Partial query
   * @param {Array} adventures - Adventure data
   * @returns {Object} Categorized suggestions
   */
  getSuggestions(query, adventures = []) {
    if (!query.trim() || query.length < 2) {
      return {
        adventures: [],
        locations: [],
        activities: [],
        popular: this.popularSearches.slice(0, 5)
      };
    }

    const searchResults = this.search(query, { limit: 10 });

    // Extract unique locations and activities from all adventures
    const allLocations = [...new Set(adventures.map(adv => adv.location))];
    const allActivities = [...new Set(adventures.flatMap(adv => adv.tags))];

    const locationMatches = this.fuzzyMatch(query, allLocations).slice(0, 5);
    const activityMatches = this.fuzzyMatch(query, allActivities).slice(0, 5);

    return {
      adventures: searchResults.slice(0, 5),
      locations: locationMatches,
      activities: activityMatches,
      popular: this.getFilteredPopularSearches(query)
    };
  }

  /**
   * Generate highlighted text for matches
   * @param {Array} matches - Fuse.js matches array
   * @returns {Object} Highlighted text by field
   */
  generateHighlights(matches) {
    const highlights = {};

    matches.forEach(match => {
      const { key, value, indices } = match;

      if (!value || !indices.length) return;

      let highlightedText = '';
      let lastIndex = 0;

      indices.forEach(([start, end]) => {
        // Add text before match
        highlightedText += value.slice(lastIndex, start);
        // Add highlighted match
        highlightedText += `<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">${value.slice(start, end + 1)}</mark>`;
        lastIndex = end + 1;
      });

      // Add remaining text
      highlightedText += value.slice(lastIndex);

      highlights[key] = highlightedText;
    });

    return highlights;
  }

  /**
   * Categorize search result
   * @param {Object} adventure - Adventure object
   * @returns {string} Category name
   */
  categorizeResult(adventure) {
    if (adventure.tags.includes('photography')) return 'Photography';
    if (adventure.tags.includes('culture')) return 'Cultural';
    if (adventure.tags.includes('wildlife')) return 'Wildlife';
    if (adventure.tags.includes('trekking')) return 'Trekking';
    if (adventure.tags.includes('conservation')) return 'Conservation';
    if (adventure.tags.includes('sailing')) return 'Water Sports';
    if (adventure.tags.includes('meditation')) return 'Wellness';
    return 'Adventure';
  }

  /**
   * Simple fuzzy matching for suggestions
   * @param {string} query - Search query
   * @param {Array} items - Items to match against
   * @returns {Array} Matching items
   */
  fuzzyMatch(query, items) {
    const lowerQuery = query.toLowerCase();
    return items
      .filter(item => item.toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.length - b.length);
  }

  /**
   * Get filtered popular searches based on query
   * @param {string} query - Current query
   * @returns {Array} Filtered popular searches
   */
  getFilteredPopularSearches(query) {
    const lowerQuery = query.toLowerCase();
    return this.popularSearches
      .filter(search => search.includes(lowerQuery))
      .slice(0, 3);
  }

  /**
   * Save search to recent searches
   * @param {string} query - Search query
   */
  saveRecentSearch(query) {
    // Remove existing instance and increment count
    const existingSearch = this.recentSearches.find(search => search.query === query);
    this.recentSearches = this.recentSearches.filter(search => search.query !== query);

    // Add to beginning
    this.recentSearches.unshift({
      query,
      timestamp: new Date().toISOString(),
      count: existingSearch ? existingSearch.count + 1 : 1
    });

    // Keep only last 10 searches
    this.recentSearches = this.recentSearches.slice(0, 10);

    // Save to localStorage
    try {
      localStorage.setItem('travel_recent_searches', JSON.stringify(this.recentSearches));

      // Track search analytics (could be sent to analytics service)
      this.trackSearchAnalytics(query);
    } catch (e) {
      console.warn('Failed to save recent searches to localStorage:', e);
    }
  }

  /**
   * Track search analytics (placeholder for future analytics integration)
   * @param {string} query - Search query
   */
  trackSearchAnalytics(query) {
    // Placeholder for analytics tracking
    // In a real app, this would send data to an analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: query,
        event_category: 'Search',
        event_label: 'Adventure Search'
      });
    }

    // Console log for development (remove in production)
    console.log(`Search Analytics: "${query}" at ${new Date().toISOString()}`);
  }

  /**
   * Load recent searches from localStorage
   * @returns {Array} Recent searches
   */
  loadRecentSearches() {
    try {
      const stored = localStorage.getItem('travel_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load recent searches from localStorage:', e);
      return [];
    }
  }

  /**
   * Get recent searches
   * @returns {Array} Recent searches
   */
  getRecentSearches() {
    return this.recentSearches.slice(0, 5);
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches() {
    this.recentSearches = [];
    try {
      localStorage.removeItem('travel_recent_searches');
    } catch (e) {
      console.warn('Failed to clear recent searches from localStorage:', e);
    }
  }

  /**
   * Get trending searches (mock implementation)
   * @returns {Array} Trending searches
   */
  getTrendingSearches() {
    return [
      { query: 'northern lights', trend: '+15%' },
      { query: 'photography tours', trend: '+8%' },
      { query: 'conservation', trend: '+12%' },
      { query: 'cultural experiences', trend: '+5%' },
      { query: 'wildlife safari', trend: '+9%' }
    ];
  }

  /**
   * Get search analytics (mock implementation)
   * @returns {Object} Search analytics data
   */
  getSearchAnalytics() {
    return {
      totalSearches: this.recentSearches.length,
      topQueries: this.popularSearches.slice(0, 5),
      noResultsQueries: [],
      averageResultCount: 8.5
    };
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;