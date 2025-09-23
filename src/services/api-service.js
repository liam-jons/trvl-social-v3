/**
 * Centralized API service with built-in rate limiting
 * Handles all API requests with automatic retry and rate limit management
 */

import { withRateLimit, rateLimiter, RateLimitError } from './rate-limiter';
import { supabase } from '../lib/supabase';

class APIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  // Add error interceptor
  addErrorInterceptor(interceptor) {
    this.interceptors.error.push(interceptor);
  }

  // Apply request interceptors
  async applyRequestInterceptors(config) {
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }
    return config;
  }

  // Apply response interceptors
  async applyResponseInterceptors(response) {
    for (const interceptor of this.interceptors.response) {
      response = await interceptor(response);
    }
    return response;
  }

  // Apply error interceptors
  async applyErrorInterceptors(error) {
    for (const interceptor of this.interceptors.error) {
      error = await interceptor(error);
    }
    return error;
  }

  // Build full URL
  buildURL(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  // Categorize endpoint for rate limiting
  categorizeEndpoint(method, url) {
    const endpoint = `${method} ${url}`;

    if (url.includes('/auth') || url.includes('/sessions')) {
      return 'auth';
    }
    if (url.includes('/search') || url.includes('/filter')) {
      return 'search';
    }
    if (url.includes('/upload') || url.includes('/storage')) {
      return 'upload';
    }
    if (url.includes('/ai') || url.includes('/generate')) {
      return 'ai';
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return 'write';
    }
    if (method === 'GET') {
      return 'read';
    }
    return 'default';
  }

  // Main request method with rate limiting
  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const url = this.buildURL(endpoint);
    const endpointCategory = this.categorizeEndpoint(method, url);

    // Prepare config
    let config = {
      ...options,
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    // Add auth token if available
    const session = await supabase.auth.getSession();
    if (session?.data?.session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
    }

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    try {
      // Execute request with rate limiting
      const response = await withRateLimit(url, config, endpointCategory);

      // Check response status
      if (!response.ok) {
        const error = await this.handleErrorResponse(response);
        throw error;
      }

      // Parse response
      const data = await this.parseResponse(response);

      // Apply response interceptors
      const result = await this.applyResponseInterceptors({
        data,
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });

      return result;
    } catch (error) {
      // Apply error interceptors
      const processedError = await this.applyErrorInterceptors(error);
      throw processedError;
    }
  }

  // Parse response based on content type
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }
    if (contentType?.includes('text/')) {
      return response.text();
    }
    return response.blob();
  }

  // Handle error responses
  async handleErrorResponse(response) {
    const error = new Error();
    error.status = response.status;
    error.statusText = response.statusText;

    try {
      const errorData = await response.json();
      error.message = errorData.message || errorData.error || response.statusText;
      error.data = errorData;
    } catch {
      error.message = response.statusText;
    }

    // Handle specific error codes
    switch (response.status) {
      case 401:
        error.name = 'AuthenticationError';
        // Optionally trigger logout
        break;
      case 403:
        error.name = 'ForbiddenError';
        break;
      case 404:
        error.name = 'NotFoundError';
        break;
      case 429:
        error.name = 'RateLimitError';
        const retryAfter = response.headers.get('Retry-After');
        error.retryAfter = retryAfter ? parseInt(retryAfter) : 60;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        error.name = 'ServerError';
        break;
      default:
        error.name = 'APIError';
    }

    return error;
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload file with rate limiting
  async upload(endpoint, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    // Add any additional fields
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...options.headers,
        // Don't set Content-Type, let browser set it with boundary
      },
    });
  }

  // Batch requests with rate limiting
  async batch(requests) {
    const results = [];
    const errors = [];

    for (const request of requests) {
      try {
        const result = await this.request(request.endpoint, request.options);
        results.push({ success: true, data: result });
      } catch (error) {
        errors.push({ success: false, error, request });
      }
    }

    return { results, errors };
  }

  // Get rate limit info for an endpoint
  getRateLimitInfo(endpoint) {
    return rateLimiter.getRateLimitInfo(endpoint);
  }

  // Reset rate limits
  resetRateLimits(endpoint) {
    rateLimiter.reset(endpoint);
  }

  // Update rate limit configuration
  updateRateLimitConfig(endpoint, config) {
    rateLimiter.updateConfig(endpoint, config);
  }
}

// Create singleton instance
const apiService = new APIService();

// Add default error handling interceptor
apiService.addErrorInterceptor(async (error) => {
  if (error instanceof RateLimitError) {
    // You could show a toast notification here
  } else if (error.name === 'AuthenticationError') {
    // Redirect to login
  } else if (error.name === 'ServerError') {
    // Show error notification
  }

  return error;
});

export default apiService;
export { APIService, RateLimitError };