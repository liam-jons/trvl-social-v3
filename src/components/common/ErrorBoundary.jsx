import React, { Component } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import sentryService from '../../services/sentry-service.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Capture error in Sentry with full context
    const eventId = sentryService.captureException(error, {
      tags: {
        error_type: 'react_error_boundary',
        component: this.props.name || 'ErrorBoundary',
        fallback_level: this.props.level || 'page'
      },
      extra: {
        errorInfo,
        props: this.props,
        component_stack: errorInfo.componentStack,
        error_boundary_name: this.props.name || 'ErrorBoundary',
        error_count: this.state.errorCount + 1
      },
      level: 'error'
    });

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
      eventId
    }));

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      const feedbackUrl = `mailto:support@trvl-social.com?subject=Error Report&body=Error ID: ${this.state.eventId}%0A%0APlease describe what you were doing when this error occurred:`;
      window.open(feedbackUrl, '_blank');
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-900/20">
          <GlassCard className="max-w-2xl w-full p-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We encountered an unexpected error. The issue has been logged and we'll look into it.
              </p>

              {/* Error Details (Development Only) */}
              {isDevelopment && this.state.error && (
                <div className="mb-6 text-left">
                  <details className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-300">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-4 text-xs text-red-700 dark:text-red-400 overflow-auto max-h-64">
                      {this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <GlassButton
                  variant="ghost"
                  onClick={this.handleReset}
                >
                  Try Again
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={this.handleReload}
                >
                  Reload Page
                </GlassButton>
                {this.state.eventId && (
                  <GlassButton
                    variant="outline"
                    onClick={this.handleReportFeedback}
                    className="text-sm"
                  >
                    Report Issue
                  </GlassButton>
                )}
              </div>

              {/* Multiple Errors Warning */}
              {this.state.errorCount > 2 && (
                <p className="mt-6 text-sm text-orange-600 dark:text-orange-400">
                  Multiple errors detected. If the problem persists, please contact support.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for imperative error handling
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    sentryService.captureException(error, {
      tags: {
        error_type: 'hook_error',
        component: errorInfo.component || 'unknown'
      },
      extra: errorInfo
    });
  }, []);

  return handleError;
};

export default ErrorBoundary;