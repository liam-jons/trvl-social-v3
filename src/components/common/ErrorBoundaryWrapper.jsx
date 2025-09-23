/**
 * Comprehensive Error Boundary Wrapper
 * Provides different error boundaries for different parts of the application
 * with contextual error handling and reporting
 */
import React from 'react';
import * as Sentry from '@sentry/react';
import sentryService from '../../services/sentry-service.js';
import analyticsService from '../../services/analytics-service.js';

/**
 * Generic Error Boundary with enhanced error reporting
 */
class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const { context = 'unknown', onError, reportToSentry = true } = this.props;

    this.setState({
      error,
      errorInfo
    });

    // Enhanced error reporting
    const errorContext = {
      component_context: context,
      component_stack: errorInfo.componentStack,
      error_boundary: this.constructor.name,
      props_data: this.sanitizeProps(this.props),
      state_data: this.sanitizeState(this.state),
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Report to Sentry if enabled
    if (reportToSentry && sentryService.isInitialized) {
      Sentry.withScope((scope) => {
        scope.setTag('error_boundary', this.constructor.name);
        scope.setTag('component_context', context);
        scope.setContext('error_boundary_info', errorContext);
        scope.setLevel('error');

        const eventId = Sentry.captureException(error);
        this.setState({ eventId });
      });
    }

    // Report to analytics
    analyticsService.trackError(error, {
      error_boundary: this.constructor.name,
      context,
      ...errorContext
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo, errorContext);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group(`Error Boundary: ${this.constructor.name}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Context:', errorContext);
      console.groupEnd();
    }
  }

  sanitizeProps(props) {
    const { children, ...otherProps } = props;
    // Remove potentially sensitive data
    const sanitized = { ...otherProps };
    delete sanitized.onError;
    delete sanitized.reportToSentry;
    return sanitized;
  }

  sanitizeState(state) {
    // Remove error objects from state to prevent circular references
    const { error, errorInfo, ...otherState } = state;
    return otherState;
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });

    // Track retry attempt
    analyticsService.trackEvent('error_boundary_retry', {
      component_context: this.props.context,
      error_boundary: this.constructor.name
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback, context = 'unknown' } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(this.state.error, this.state.errorInfo, this.handleRetry)
          : fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallbackUI
          error={this.state.error}
          context={context}
          eventId={this.state.eventId}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Page-level Error Boundary
 * For catching errors in entire pages/routes
 */
export class PageErrorBoundary extends EnhancedErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <PageErrorFallback
          error={this.state.error}
          context={this.props.context || 'page'}
          eventId={this.state.eventId}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Feature-level Error Boundary
 * For catching errors in specific features/components
 */
export class FeatureErrorBoundary extends EnhancedErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <FeatureErrorFallback
          error={this.state.error}
          context={this.props.context || 'feature'}
          eventId={this.state.eventId}
          onRetry={this.handleRetry}
          featureName={this.props.featureName}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Payment-specific Error Boundary
 * For critical payment flows with enhanced reporting
 */
export class PaymentErrorBoundary extends EnhancedErrorBoundary {
  componentDidCatch(error, errorInfo) {
    // Call parent error handling
    super.componentDidCatch(error, errorInfo);

    // Additional payment-specific error handling
    const paymentContext = {
      payment_flow: this.props.paymentFlow || 'unknown',
      booking_id: this.props.bookingId,
      payment_method: this.props.paymentMethod,
      amount: this.props.amount,
      currency: this.props.currency
    };

    // Report to business intelligence
    analyticsService.trackEvent('payment_error_boundary_triggered', {
      ...paymentContext,
      error_message: error.message,
      error_stack: error.stack
    });

    // Immediate alert for payment errors
    sentryService.captureMessage(
      'Critical payment error boundary triggered',
      'error',
      {
        tags: {
          error_type: 'payment_critical',
          payment_flow: this.props.paymentFlow
        },
        extra: paymentContext
      }
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <PaymentErrorFallback
          error={this.state.error}
          context="payment"
          eventId={this.state.eventId}
          onRetry={this.handleRetry}
          paymentData={{
            flow: this.props.paymentFlow,
            bookingId: this.props.bookingId,
            amount: this.props.amount
          }}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function ErrorFallbackUI({ error, context, eventId, onRetry }) {
  return (
    <div className="error-boundary-fallback" role="alert">
      <div className="error-content">
        <h2>Something went wrong</h2>
        <p>We encountered an unexpected error in the {context} section.</p>

        {import.meta.env.DEV && (
          <details style={{ marginTop: '1rem' }}>
            <summary>Error Details (Development)</summary>
            <pre style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {error?.stack || error?.message || 'Unknown error'}
            </pre>
          </details>
        )}

        <div className="error-actions">
          <button
            onClick={onRetry}
            className="btn btn-primary"
            style={{ marginRight: '0.5rem' }}
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="btn btn-secondary"
          >
            Reload Page
          </button>
        </div>

        {eventId && (
          <p className="error-id" style={{
            fontSize: '0.75rem',
            color: '#666',
            marginTop: '1rem'
          }}>
            Error ID: {eventId}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Page-level Error Fallback
 */
function PageErrorFallback({ error, context, eventId, onRetry }) {
  return (
    <div className="page-error-boundary">
      <div className="container">
        <div className="error-page-content">
          <h1>Oops! Something went wrong</h1>
          <p>We're sorry, but we encountered an error while loading this page.</p>

          <div className="error-suggestions">
            <h3>What can you do?</h3>
            <ul>
              <li>Try refreshing the page</li>
              <li>Go back to the <a href="/">home page</a></li>
              <li>Check your internet connection</li>
              <li>Try again in a few moments</li>
            </ul>
          </div>

          <div className="error-actions">
            <button onClick={onRetry} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => window.location.href = '/'} className="btn btn-secondary">
              Go Home
            </button>
          </div>

          {eventId && (
            <p className="error-reference">
              Reference ID: {eventId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Feature-level Error Fallback
 */
function FeatureErrorFallback({ error, context, eventId, onRetry, featureName }) {
  return (
    <div className="feature-error-boundary">
      <div className="feature-error-content">
        <h3>{featureName || 'Feature'} Unavailable</h3>
        <p>This feature is temporarily unavailable due to a technical issue.</p>

        <div className="feature-error-actions">
          <button onClick={onRetry} className="btn btn-sm btn-primary">
            Retry
          </button>
        </div>

        {eventId && (
          <p className="feature-error-id">
            Error: {eventId}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Payment-specific Error Fallback
 */
function PaymentErrorFallback({ error, context, eventId, onRetry, paymentData }) {
  return (
    <div className="payment-error-boundary">
      <div className="payment-error-content">
        <h2>Payment Processing Error</h2>
        <p>We encountered an issue while processing your payment. Don't worry - your payment has not been charged.</p>

        <div className="payment-error-details">
          {paymentData?.bookingId && (
            <p><strong>Booking ID:</strong> {paymentData.bookingId}</p>
          )}
          {paymentData?.amount && (
            <p><strong>Amount:</strong> ${paymentData.amount}</p>
          )}
        </div>

        <div className="payment-error-actions">
          <button onClick={onRetry} className="btn btn-primary">
            Try Payment Again
          </button>
          <button
            onClick={() => window.location.href = '/booking'}
            className="btn btn-secondary"
          >
            Return to Booking
          </button>
        </div>

        <div className="payment-error-support">
          <p>If this issue persists, please contact our support team.</p>
          {eventId && <p><strong>Reference:</strong> {eventId}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * HOC for wrapping components with error boundaries
 */
export function withErrorBoundary(WrappedComponent, boundaryProps = {}) {
  const ComponentWithErrorBoundary = (props) => {
    return (
      <EnhancedErrorBoundary {...boundaryProps}>
        <WrappedComponent {...props} />
      </EnhancedErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName =
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
}

/**
 * Hook for manual error reporting
 */
export function useErrorReporting() {
  const reportError = (error, context = {}) => {
    sentryService.captureException(error, {
      tags: { error_type: 'manual_report' },
      extra: context
    });

    analyticsService.trackError(error, context);
  };

  const reportMessage = (message, level = 'info', context = {}) => {
    sentryService.captureMessage(message, level, {
      tags: { message_type: 'manual_report' },
      extra: context
    });

    analyticsService.trackEvent('manual_message_report', {
      message,
      level,
      ...context
    });
  };

  return { reportError, reportMessage };
}

export default EnhancedErrorBoundary;
export {
  EnhancedErrorBoundary,
  PageErrorBoundary,
  FeatureErrorBoundary,
  PaymentErrorBoundary
};