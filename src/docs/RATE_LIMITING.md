# Rate Limiting Implementation Guide

## Overview
This application implements comprehensive rate limiting to prevent API abuse and ensure fair usage. The rate limiting system uses a token bucket algorithm with configurable limits per endpoint type.

## Architecture

### 1. Rate Limiter Service (`services/rate-limiter.js`)
Core rate limiting logic using token bucket algorithm:
- **Token Bucket**: Each endpoint has a bucket with tokens that refill over time
- **Global Limit**: Overall API usage limit across all endpoints
- **Automatic Retry**: Built-in retry logic with exponential backoff

### 2. API Service (`services/api-service.js`)
Centralized API client with automatic rate limiting:
- All API requests go through this service
- Automatic token refresh and auth handling
- Request/response interceptors for logging

### 3. Supabase Integration (`services/supabase-rate-limited.js`)
Rate-limited wrapper for Supabase operations:
- Transparent rate limiting for database queries
- Auth and storage operation limiting
- RPC call protection

## Default Rate Limits

| Endpoint Type | Requests/Minute | Use Case |
|--------------|-----------------|----------|
| Auth | 10 | Login, signup, password reset |
| Search | 30 | Search queries, filters |
| Write | 20 | POST, PUT, PATCH, DELETE |
| Read | 60 | GET requests |
| Upload | 5 | File uploads |
| AI | 10 | AI/ML operations |
| Global | 100 | All endpoints combined |

## Usage Examples

### Basic API Request
```javascript
import apiService from '@/services/api-service';

// Simple GET request
const data = await apiService.get('/api/users/123');

// POST with data
const newUser = await apiService.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Using React Hooks
```javascript
import { useRateLimitedAPI } from '@/hooks/useRateLimitedAPI';

function MyComponent() {
  const { get, post, loading, error, rateLimitInfo } = useRateLimitedAPI();

  const fetchData = async () => {
    try {
      const data = await get('/api/data');
      console.log('Data:', data);
    } catch (err) {
      if (err.name === 'RateLimitError') {
        console.log('Rate limited, retry after:', err.retryAfter);
      }
    }
  };

  return (
    <div>
      {loading && <Spinner />}
      {error && <Error message={error.message} />}
      {rateLimitInfo?.limited && (
        <Alert>Rate limit exceeded. Retry in {rateLimitInfo.waitTime}ms</Alert>
      )}
    </div>
  );
}
```

### Supabase Queries
```javascript
import supabaseRL from '@/services/supabase-rate-limited';

// Rate-limited query
const { data, error } = await supabaseRL
  .from('posts')
  .select('*')
  .limit(10);

// Rate-limited auth
const { user, error } = await supabaseRL.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Monitoring Rate Limits
```javascript
import { useRateLimitStatus } from '@/hooks/useRateLimitedAPI';

function RateLimitMonitor() {
  const status = useRateLimitStatus('search');

  return (
    <div>
      <p>Available: {status.available}/{status.limit}</p>
      <p>Reset in: {Math.ceil((status.reset - Date.now()) / 1000)}s</p>
      {status.isWarning && <Alert>Approaching rate limit!</Alert>}
    </div>
  );
}
```

### Custom Rate Limits
```javascript
import rateLimiter from '@/services/rate-limiter';

// Update limits for specific endpoint
rateLimiter.updateConfig('search', {
  capacity: 50,
  refillRate: 50,
  windowMs: 60000
});

// Reset rate limits (useful for testing)
rateLimiter.reset('search'); // Reset specific endpoint
rateLimiter.reset(); // Reset all endpoints
```

## Components

### Rate Limit Indicator
Add visual feedback for rate limit status:
```javascript
import RateLimitIndicator from '@/components/common/RateLimitIndicator';

// In your app layout
<RateLimitIndicator endpoint="search" showDetails={true} />
```

## Error Handling

### Rate Limit Errors
```javascript
try {
  await apiService.get('/api/data');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limit error
    console.log('Wait time:', error.waitTime);
    console.log('Retry after:', error.retryAfter);
    console.log('Endpoint:', error.endpoint);
  }
}
```

### Automatic Retry
The rate limiter includes automatic retry with exponential backoff:
```javascript
// Will automatically retry up to 3 times
const result = await rateLimiter.executeWithRetry(
  async () => fetch('/api/data'),
  'read',
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  }
);
```

## Best Practices

1. **Use the Centralized API Service**: Always use `apiService` or `supabaseRL` instead of direct fetch/supabase calls

2. **Handle Rate Limit Errors Gracefully**: Show user-friendly messages when rate limited

3. **Implement Caching**: Cache responses to reduce API calls
```javascript
const { data, refresh, isStale } = useRateLimitedFetch(
  'user-profile',
  () => apiService.get('/api/profile'),
  { cacheTime: 5 * 60 * 1000 } // 5 minutes
);
```

4. **Batch Requests**: Use the batch API when possible
```javascript
const { results, errors } = await apiService.batch([
  { endpoint: '/api/users/1', options: { method: 'GET' } },
  { endpoint: '/api/posts/1', options: { method: 'GET' } }
]);
```

5. **Monitor Rate Limits**: Add monitoring in development
```javascript
if (process.env.NODE_ENV === 'development') {
  window.getRateLimits = () => {
    console.table({
      auth: rateLimiter.getRateLimitInfo('auth'),
      search: rateLimiter.getRateLimitInfo('search'),
      write: rateLimiter.getRateLimitInfo('write'),
      read: rateLimiter.getRateLimitInfo('read'),
    });
  };
}
```

## Server Integration

The client-side rate limiting works alongside server-side rate limiting. The system respects server rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
- `Retry-After`: Seconds to wait (on 429 responses)

## Testing

### Manual Testing
```javascript
// Test rate limiting
async function testRateLimit() {
  // Set low limit for testing
  rateLimiter.updateConfig('test', {
    capacity: 3,
    refillRate: 1,
    windowMs: 10000
  });

  for (let i = 0; i < 5; i++) {
    try {
      await rateLimiter.acquire('test');
      console.log(`Request ${i + 1} succeeded`);
    } catch (error) {
      console.log(`Request ${i + 1} rate limited`);
    }
  }
}
```

### Unit Testing
```javascript
import { rateLimiter } from '@/services/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  it('should limit requests', async () => {
    rateLimiter.updateConfig('test', {
      capacity: 2,
      refillRate: 0,
      windowMs: 1000
    });

    await rateLimiter.acquire('test');
    await rateLimiter.acquire('test');

    await expect(rateLimiter.acquire('test'))
      .rejects.toThrow('Rate limit exceeded');
  });
});
```

## Performance Considerations

- Rate limiting adds minimal overhead (~1ms per request)
- Token refill calculations are O(1)
- Memory usage scales with number of unique endpoints
- Buckets are lazily initialized on first use

## Configuration

Rate limits can be configured via environment variables:
```javascript
// In your .env file
VITE_RATE_LIMIT_AUTH=10
VITE_RATE_LIMIT_SEARCH=30
VITE_RATE_LIMIT_WRITE=20
VITE_RATE_LIMIT_READ=60
VITE_RATE_LIMIT_GLOBAL=100
```

## Troubleshooting

**Issue**: Getting rate limited too frequently
- Check if you're making redundant API calls
- Implement proper caching
- Consider batching requests

**Issue**: Rate limits not working
- Ensure you're using the rate-limited services
- Check that services are properly imported
- Verify configuration is loaded

**Issue**: Different limits needed for specific operations
- Create custom endpoint categories
- Override limits for specific endpoints
- Implement endpoint-specific retry logic