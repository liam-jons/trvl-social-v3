import React from 'react';
import * as Sentry from '@sentry/react';
import { createBrowserRouter } from 'react-router-dom';
class SentryService {
  constructor() {
    this.isInitialized = false;
  }
  // Initialize Sentry
  init() {
    if (this.isInitialized) return;
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn || dsn === 'YOUR_SENTRY_DSN_HERE') {
      console.warn('Sentry DSN not configured');
      return;
    }
    const isProduction = import.meta.env.PROD;
    const isDevelopment = import.meta.env.DEV;

    Sentry.init({
      dsn,
      environment: isProduction ? 'production' : 'development',
      debug: isDevelopment,

      // Performance monitoring with dynamic sampling
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
      profilesSampleRate: isProduction ? 0.05 : 0.5, // 5% in prod, 50% in dev

      // Session replay with privacy controls
      replaysSessionSampleRate: isProduction ? 0.01 : 0.1, // 1% in prod, 10% in dev
      replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

      // Release and deployment tracking
      release: `trvl-social-v3@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,
      dist: import.meta.env.VITE_BUILD_NUMBER || 'unknown',

      // Enhanced configuration for production
      maxBreadcrumbs: isProduction ? 50 : 100,
      attachStacktrace: true,
      sendDefaultPii: false, // Privacy-first approach

      // Integration configurations
      integrations: [
        // Enhanced browser tracing for production
        Sentry.browserTracingIntegration({
          instrumentNavigation: true,
          instrumentPageLoad: true,
          instrumentXHR: true,
          instrumentFetch: true,
          // Mark important transactions for better sampling
          beforeNavigate: (context) => {
            return {
              ...context,
              name: this.getTransactionName(context.location.pathname),
              tags: {
                importance: this.getTransactionImportance(context.location.pathname)
              }
            };
          },
          // Only track performance for important routes in production
          shouldCreateSpanForRequest: (url) => {
            if (isProduction) {
              return this.shouldTrackRequest(url);
            }
            return true;
          }
        }),

        // Privacy-conscious session replay
        ...(Sentry.replayIntegration ? [Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
          maskAllInputs: true,
          // Privacy-first selectors
          mask: ['.sensitive', '[data-sensitive]', '.payment-info'],
          block: ['.pii', '[data-pii]', '.personal-data'],
          // Network capture with filtering
          networkDetailAllowUrls: [
            // Only capture important API calls
            /\/api\/adventures/,
            /\/api\/bookings/,
            /\/api\/groups/
          ],
          // Ignore sensitive requests
          networkCaptureBodies: false,
          networkRequestHeaders: ['content-type'],
          networkResponseHeaders: ['content-type']
        })] : []),

        // HTTP context integration for better debugging
        Sentry.httpContextIntegration(),

        // Production-specific integrations
        ...(isProduction ? [
          // Context lines for production debugging
          Sentry.contextLinesIntegration(),
          // Dedupe integration to prevent duplicate errors
          Sentry.dedupeIntegration(),
          // Module metadata for better stack traces
          Sentry.moduleMetadataIntegration()
        ] : [])
      ],
      // Error filtering
      beforeSend(event, hint) {
        // Filter out common non-actionable errors
        const ignoredErrors = [
          'Network Error',
          'Loading chunk',
          'ChunkLoadError',
          'Non-Error promise rejection captured',
          'ResizeObserver loop limit exceeded',
          'Script error.'
        ];
        const errorMessage = event.exception?.values?.[0]?.value || '';
        if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
          return null;
        }
        // Filter out development-only errors in production
        if (isProduction && errorMessage.includes('Warning:')) {
          return null;
        }
        return event;
      },
      // Performance filtering
      beforeSendTransaction(event) {
        // Only send performance data for important routes
        const importantRoutes = [
          '/adventures',
          '/booking',
          '/groups',
          '/vendor/dashboard'
        ];
        const transactionName = event.transaction;
        const isImportantRoute = importantRoutes.some(route =>
          transactionName?.includes(route)
        );
        // In production, only send performance data for important routes
        if (isProduction && !isImportantRoute) {
          return null;
        }
        return event;
      },
      // Custom tags
      initialScope: {
        tags: {
          component: 'frontend',
          platform: 'web',
          framework: 'react',
          bundler: 'vite'
        }
      }
    });
    this.isInitialized = true;
  }
  // Set user context
  setUser(user) {
    if (!this.isInitialized) return;
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.full_name,
      ip_address: '{{auto}}', // Let Sentry determine IP
      subscription: user.subscription_status,
      userType: user.user_type
    });
  }
  // Set additional context
  setContext(key, context) {
    if (!this.isInitialized) return;
    Sentry.setContext(key, context);
  }
  // Set tags
  setTag(key, value) {
    if (!this.isInitialized) return;
    Sentry.setTag(key, value);
  }
  // Set multiple tags
  setTags(tags) {
    if (!this.isInitialized) return;
    Sentry.setTags(tags);
  }
  // Add breadcrumb
  addBreadcrumb(breadcrumb) {
    if (!this.isInitialized) return;
    Sentry.addBreadcrumb({
      timestamp: Date.now() / 1000,
      ...breadcrumb
    });
  }
  // Capture exception
  captureException(error, context = {}) {
    if (!this.isInitialized) {
      return;
    }
    Sentry.withScope((scope) => {
      // Add custom context
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      if (context.level) {
        scope.setLevel(context.level);
      }
      Sentry.captureException(error);
    });
  }
  // Capture message
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) {
      return;
    }
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureMessage(message, level);
    });
  }
  // Booking-specific error context
  captureBookingError(error, bookingData) {
    this.captureException(error, {
      tags: {
        error_type: 'booking_error',
        booking_stage: bookingData.stage
      },
      extra: {
        booking_id: bookingData.bookingId,
        adventure_id: bookingData.adventureId,
        user_id: bookingData.userId,
        amount: bookingData.amount,
        payment_method: bookingData.paymentMethod,
        error_details: bookingData.errorDetails
      },
      level: 'error'
    });
  }
  // API error context
  captureAPIError(error, apiData) {
    this.captureException(error, {
      tags: {
        error_type: 'api_error',
        api_endpoint: apiData.endpoint,
        http_status: apiData.status
      },
      extra: {
        request_url: apiData.url,
        request_method: apiData.method,
        request_headers: apiData.headers,
        response_body: apiData.responseBody,
        response_time: apiData.responseTime
      },
      level: 'error'
    });
  }
  // Group interaction error context
  captureGroupError(error, groupData) {
    this.captureException(error, {
      tags: {
        error_type: 'group_error',
        group_action: groupData.action
      },
      extra: {
        group_id: groupData.groupId,
        user_id: groupData.userId,
        group_size: groupData.groupSize,
        compatibility_score: groupData.compatibilityScore
      },
      level: 'error'
    });
  }
  // Vendor-specific error context
  captureVendorError(error, vendorData) {
    this.captureException(error, {
      tags: {
        error_type: 'vendor_error',
        vendor_action: vendorData.action
      },
      extra: {
        vendor_id: vendorData.vendorId,
        listing_id: vendorData.listingId,
        vendor_category: vendorData.category
      },
      level: 'error'
    });
  }
  // Performance monitoring
  startTransaction(name, op = 'navigation') {
    if (!this.isInitialized) return null;
    return Sentry.startSpan({
      name,
      op,
      attributes: {
        custom_transaction: true
      }
    });
  }
  // Measure function performance
  measurePerformance(name, fn) {
    if (!this.isInitialized) return fn();
    return Sentry.startSpan({
      name,
      op: 'function',
      attributes: { custom_function: true }
    }, () => {
      try {
        const result = fn();
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.catch(err => {
            Sentry.captureException(err);
            throw err;
          });
        }
        return result;
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    });
  }
  // Clear user context (logout)
  clearUser() {
    if (!this.isInitialized) return;
    Sentry.setUser(null);
  }
  // Flush events (useful before page unload)
  flush(timeout = 2000) {
    if (!this.isInitialized) return Promise.resolve(true);
    return Sentry.flush(timeout);
  }
  // Create custom error boundary wrapper
  createErrorBoundary(options = {}) {
    if (!this.isInitialized) {
      // Return a simple error boundary if Sentry isn't initialized
      return class SimpleErrorBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false };
        }
        static getDerivedStateFromError() {
          return { hasError: true };
        }
        componentDidCatch(error, errorInfo) {
        }
        render() {
          if (this.state.hasError) {
            return options.fallback || React.createElement('div', null, 'Something went wrong.');
          }
          return this.props.children;
        }
      };
    }
    return Sentry.ErrorBoundary;
  }
  // Profiling
  startProfiler(name) {
    if (!this.isInitialized) return null;
    return Sentry.startSpan({
      name,
      op: 'profile',
    });
  }
  // Custom metrics
  addCustomMetric(name, value, tags = {}) {
    if (!this.isInitialized) return;
    Sentry.withScope((scope) => {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
      scope.setExtra('metric_name', name);
      scope.setExtra('metric_value', value);
      Sentry.captureMessage(`Custom Metric: ${name}`, 'info');
    });
  }

  // Helper methods for enhanced Sentry configuration

  // Get transaction name from pathname
  getTransactionName(pathname) {
    // Map pathnames to meaningful transaction names
    const routeMap = {
      '/': 'Home',
      '/adventures': 'Adventures List',
      '/adventure': 'Adventure Detail',
      '/booking': 'Booking Flow',
      '/groups': 'Groups Management',
      '/vendor/dashboard': 'Vendor Dashboard',
      '/vendor/adventures': 'Vendor Adventures',
      '/payment': 'Payment Processing',
      '/quiz': 'Personality Quiz',
      '/profile': 'User Profile'
    };

    // Check for exact matches first
    if (routeMap[pathname]) {
      return routeMap[pathname];
    }

    // Check for pattern matches
    if (pathname.startsWith('/adventure/')) return 'Adventure Detail';
    if (pathname.startsWith('/booking/')) return 'Booking Flow';
    if (pathname.startsWith('/groups/')) return 'Group Detail';
    if (pathname.startsWith('/vendor/')) return 'Vendor Area';
    if (pathname.startsWith('/payment/')) return 'Payment Processing';

    return pathname || 'Unknown Route';
  }

  // Get transaction importance for sampling decisions
  getTransactionImportance(pathname) {
    // Critical paths that should always be tracked
    const criticalPaths = [
      '/booking',
      '/payment',
      '/vendor/dashboard',
      '/adventures'
    ];

    // Important paths that should be tracked frequently
    const importantPaths = [
      '/groups',
      '/quiz',
      '/profile'
    ];

    if (criticalPaths.some(path => pathname.startsWith(path))) {
      return 'critical';
    }

    if (importantPaths.some(path => pathname.startsWith(path))) {
      return 'important';
    }

    return 'normal';
  }

  // Determine if a request should be tracked for performance
  shouldTrackRequest(url) {
    // Always track API calls
    if (url.includes('/api/')) return true;

    // Track important static resources
    const importantResources = [
      'chunk',
      'bundle',
      'vendor',
      'main'
    ];

    return importantResources.some(resource => url.includes(resource));
  }

  // Rate limiting to prevent spam
  shouldRateLimit(event) {
    const now = Date.now();
    const errorKey = event.exception?.values?.[0]?.type || 'unknown';

    // Initialize rate limiting storage
    if (!this.rateLimitMap) {
      this.rateLimitMap = new Map();
    }

    // Clean old entries (older than 1 minute)
    for (const [key, data] of this.rateLimitMap.entries()) {
      if (now - data.firstSeen > 60000) {
        this.rateLimitMap.delete(key);
      }
    }

    // Check rate limit for this error type
    const errorData = this.rateLimitMap.get(errorKey);
    if (!errorData) {
      this.rateLimitMap.set(errorKey, { count: 1, firstSeen: now });
      return false;
    }

    errorData.count++;

    // Rate limit: max 5 of the same error type per minute
    if (errorData.count > 5) {
      return true;
    }

    return false;
  }
}
// Create singleton instance
const sentryService = new SentryService();
export default sentryService;
export { SentryService };