# TRVL Social V3 - Monitoring & Analytics Setup

## Overview

This document provides a comprehensive guide to the monitoring, analytics, and error tracking systems implemented in TRVL Social V3. The system provides unified monitoring across three key platforms:

- **Mixpanel** - User behavior tracking and analytics
- **Sentry** - Error monitoring and debugging
- **Datadog** - Performance monitoring and infrastructure observability

## Quick Start

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Mixpanel Configuration
VITE_MIXPANEL_TOKEN=your_mixpanel_project_token

# Sentry Configuration
VITE_SENTRY_DSN=your_sentry_dsn_url
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=trvl-social-v3

# Datadog Configuration
VITE_DATADOG_APPLICATION_ID=your_datadog_app_id
VITE_DATADOG_CLIENT_TOKEN=your_datadog_client_token
VITE_DATADOG_SITE=datadoghq.com
```

### 2. Using Analytics in Components

```jsx
import { useAnalytics } from '../contexts/AnalyticsContext';

function MyComponent() {
  const { trackEvent, trackFeatureUsage } = useAnalytics();

  const handleButtonClick = () => {
    trackEvent('button_clicked', {
      button_name: 'hero_cta',
      page: 'homepage'
    });
  };

  return <button onClick={handleButtonClick}>Click me</button>;
}
```

## Architecture

### Core Services

#### 1. Analytics Service (`src/services/analytics-service.js`)
Centralized service that orchestrates all monitoring platforms.

**Key Methods:**
- `trackEvent(eventName, properties)` - Universal event tracking
- `trackPageView(pageName, properties)` - Page navigation tracking
- `trackError(error, context)` - Error tracking across platforms
- `identifyUser(userId, userData)` - User identification
- `trackAPICall(endpoint, method, startTime)` - API performance tracking

#### 2. Mixpanel Service (`src/services/mixpanel-service.js`)
Handles user behavior analytics and conversion tracking.

**Features:**
- Standardized event naming conventions
- Offline event queuing
- User segmentation properties
- Conversion funnel tracking
- A/B testing support

#### 3. Sentry Service (`src/services/sentry-service.js`)
Error monitoring with enhanced context and debugging capabilities.

**Features:**
- Automatic error capture with React Error Boundaries
- Performance monitoring with transaction tracking
- User context enrichment
- Source map upload for production debugging
- Custom error filtering

#### 4. Datadog Service (`src/services/datadog-service.js`)
Performance monitoring and infrastructure observability.

**Features:**
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Custom business metrics
- API performance monitoring
- Resource usage tracking

### Analytics Context

The `AnalyticsProvider` (`src/contexts/AnalyticsContext.jsx`) wraps the entire application and provides:

- Automatic initialization of all monitoring services
- User identification on auth state changes
- Automatic page view tracking
- Global access to analytics methods

## Event Tracking Guide

### Standard Events

#### Page Views
```javascript
// Automatic tracking via AnalyticsContext
// Manual tracking:
trackPageView('Adventure Detail', {
  adventure_id: 'abc123',
  category: 'hiking'
});
```

#### User Actions
```javascript
// Adventure interactions
trackEvent('adventure_view', {
  adventure_id: 'abc123',
  adventure_title: 'Mountain Hiking',
  category: 'hiking',
  duration: 'full_day'
});

// Booking funnel
trackBookingFunnel('initiated', {
  bookingId: 'book123',
  adventureId: 'adv456',
  totalAmount: 150,
  currency: 'USD'
});
```

#### Group Interactions
```javascript
trackGroupInteraction('compatibility_viewed', {
  groupId: 'group123',
  groupSize: 4,
  compatibilityScore: 85,
  personalityTypes: ['ENFP', 'INTJ', 'ESFJ', 'ISTP']
});
```

### Error Tracking

#### Manual Error Tracking
```javascript
import { useErrorHandler } from '../components/common/ErrorBoundary';

function MyComponent() {
  const handleError = useErrorHandler();

  const handleAsyncOperation = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error, {
        component: 'MyComponent',
        operation: 'riskyOperation',
        additional_context: 'user_action'
      });
    }
  };
}
```

#### Automatic Error Boundaries
```jsx
import ErrorBoundary, { withErrorBoundary } from '../components/common/ErrorBoundary';

// Wrap components with error boundaries
const SafeComponent = withErrorBoundary(MyComponent, {
  name: 'MyComponent',
  level: 'component'
});

// Or use directly
<ErrorBoundary name="FeatureSection" level="section">
  <FeatureComponent />
</ErrorBoundary>
```

### Performance Monitoring

#### API Call Tracking
```javascript
import { useAnalyticsAPI } from '../hooks/useAnalyticsAPI';

function useAdventureData() {
  const { trackedSupabaseOp } = useAnalyticsAPI();

  const fetchAdventures = async () => {
    return trackedSupabaseOp(
      () => supabase.from('adventures').select('*'),
      'adventures',
      'select',
      { user_filter: 'active' }
    );
  };
}
```

#### Component Performance
```javascript
import { useComponentPerformance } from '../hooks/usePerformanceMonitoring';

function ExpensiveComponent({ data }) {
  // Automatically tracks render performance
  useComponentPerformance('ExpensiveComponent', [data]);

  return <div>{/* component content */}</div>;
}
```

## Business Metrics

### Key Performance Indicators (KPIs)

The system automatically tracks business-critical metrics:

#### Booking Metrics
- Conversion rates by funnel stage
- Average booking value
- Time to conversion
- Payment method performance

#### Search Performance
- Search response times
- Click-through rates
- Query success rates
- Filter usage patterns

#### Group Dynamics
- Compatibility matching speed
- Group formation rates
- Member interaction frequency

#### Vendor Performance
- Listing engagement rates
- Dashboard usage analytics
- Revenue metrics

### Custom Business Metrics
```javascript
trackBusinessKPI('monthly_recurring_revenue', 15000, {
  currency: 'USD',
  period: '2024-01',
  segment: 'premium_users'
});
```

## Development Workflow

### Local Development

In development mode:
- All events are tracked (100% sampling)
- Full error details are displayed
- Debug logs are enabled
- Source maps are available

### Production Deployment

Production optimizations:
- Intelligent sampling (10% for performance, 1% for session replay)
- Error filtering for noise reduction
- Automatic source map uploads
- Cost-optimized log aggregation

### Testing Analytics

Use the health check to verify setup:
```javascript
import analyticsService from '../services/analytics-service';

console.log(analyticsService.getHealthStatus());
// Output:
// {
//   initialized: true,
//   services: {
//     mixpanel: true,
//     sentry: true,
//     datadog: true
//   }
// }
```

## Privacy & Compliance

### Data Protection
- All user inputs are masked in session replays
- Personal information is excluded from error logs
- GDPR-compliant opt-out mechanisms
- Secure token handling

### Opt-out Functionality
```javascript
// User privacy controls
analyticsService.optOut(); // Disable all tracking
analyticsService.optIn();  // Re-enable tracking
```

## Monitoring Dashboards

### Recommended Mixpanel Dashboards
1. **User Journey Funnel** - Track conversion from signup to booking
2. **Feature Adoption** - Monitor new feature usage
3. **Cohort Analysis** - User retention by signup date
4. **Revenue Analytics** - Booking value and frequency

### Sentry Alert Rules
1. **Critical Errors** - >10 errors/minute
2. **Performance Degradation** - >2s average response time
3. **High Error Rate** - >5% error rate over 5 minutes
4. **Memory Leaks** - Sustained high memory usage

### Datadog Dashboards
1. **Core Web Vitals** - LCP, FID, CLS tracking
2. **API Performance** - Response times and error rates
3. **Business KPIs** - Revenue, conversion, engagement
4. **Infrastructure Health** - Browser performance and errors

## Troubleshooting

### Common Issues

#### Analytics Not Tracking
1. Check environment variables are set
2. Verify network connectivity
3. Check browser console for errors
4. Confirm user has opted in to tracking

#### Performance Impact
1. Monitor bundle size impact (monitoring adds ~200KB)
2. Check sampling rates in production
3. Verify event frequency isn't excessive
4. Use performance debugging tools

#### Error Reporting Issues
1. Confirm Sentry DSN is correct
2. Check source map uploads
3. Verify error boundary placement
4. Review error filtering rules

### Debug Commands

```javascript
// Check service status
analyticsService.getHealthStatus();

// Flush all pending data
await analyticsService.flush();

// Get Sentry session URL for support
sentryService.getSessionReplayUrl();
```

## Best Practices

### Event Naming
- Use descriptive, action-based names: `adventure_searched`, `booking_completed`
- Include context: user type, page, feature
- Maintain consistency across the application

### Error Context
- Always include relevant user and session data
- Add component and operation context
- Include reproduction steps when possible

### Performance Monitoring
- Track user-impacting metrics (page load, interaction response)
- Monitor business-critical operations (search, booking, payment)
- Set up alerts for performance regression

### Data Privacy
- Mask sensitive information in logs
- Implement proper opt-out mechanisms
- Regularly audit tracked data for compliance

## Support

For questions about the monitoring setup:
- Check this documentation first
- Review service documentation in `src/services/`
- Check component examples in `src/hooks/`
- Contact the development team for custom tracking needs

---

*This monitoring setup provides comprehensive observability while maintaining performance and privacy standards. Regular review and optimization ensure continued effectiveness as the application scales.*