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
      console.warn('Sentry DSN not configured. Error monitoring disabled.');
      return;
    }

    const isProduction = import.meta.env.NODE_ENV === 'production';

    Sentry.init({
      dsn,
      environment: isProduction ? 'production' : 'development',
      debug: !isProduction,

      // Performance monitoring
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
      profilesSampleRate: isProduction ? 0.1 : 1.0,

      // Session replay (privacy-conscious)
      replaysSessionSampleRate: isProduction ? 0.01 : 0.1, // 1% in prod, 10% in dev
      replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

      // Release tracking
      release: `trvl-social-v3@${process.env.npm_package_version || 'unknown'}`,

      // Integration configurations
      integrations: [
        // Performance monitoring integration
        new Sentry.browserTracingIntegration({
          // Router instrumentation
          instrumentNavigation: true,
          instrumentPageLoad: true,
        }),
        // Session replay integration (if available)
        ...(Sentry.replayIntegration ? [Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
          maskAllInputs: true,
        })] : [])
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
    console.log('Sentry initialized successfully');
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
      console.error('Sentry not initialized, logging error:', error);
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
      console.log('Sentry not initialized, logging message:', message);
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
          console.error('Error caught by boundary:', error, errorInfo);
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
}

// Create singleton instance
const sentryService = new SentryService();

export default sentryService;
export { SentryService };