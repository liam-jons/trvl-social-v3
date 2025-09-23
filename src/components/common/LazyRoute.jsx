/**
 * Lazy Route Component
 * Provides lazy loading for route components with loading states
 */
import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Wrapper for lazy-loaded route components
 */
const LazyRoute = ({
  children,
  fallback = <LoadingFallback />,
  errorBoundary = true
}) => {
  const content = (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );

  // Optionally wrap with error boundary
  if (errorBoundary) {
    return (
      <LazyErrorBoundary>
        {content}
      </LazyErrorBoundary>
    );
  }

  return content;
};

/**
 * Default loading fallback for lazy routes
 */
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

/**
 * Error boundary for lazy-loaded components
 */
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);

    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          section: 'lazy_loading'
        }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return <LazyErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Error fallback for failed lazy loading
 */
const LazyErrorFallback = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4 max-w-md">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Component Failed to Load
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        There was an error loading this page. Please try refreshing.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Refresh Page
      </button>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500">
            Error Details (Development)
          </summary>
          <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
            {error.toString()}
          </pre>
        </details>
      )}
    </div>
  </div>
);

/**
 * Specific loading fallback for quiz components
 */
export const QuizLoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loading Personality Quiz
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Preparing your personalized assessment...
          </p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Specific loading fallback for admin components
 */
export const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Loading Admin Panel
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Initializing administrative tools...
        </p>
        <LoadingSpinner size="lg" />
      </div>
    </div>
  </div>
);

/**
 * Specific loading fallback for vendor components
 */
export const VendorLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Loading Vendor Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Setting up your business tools...
        </p>
        <LoadingSpinner size="lg" />
      </div>
    </div>
  </div>
);

/**
 * Higher-order component for lazy loading with preloading
 */
export const withLazyLoading = (
  importFn,
  fallback = <LoadingFallback />,
  preloadDelay = 0
) => {
  // Create the lazy component
  const LazyComponent = React.lazy(importFn);

  // Optionally preload after a delay
  if (preloadDelay > 0) {
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail preload attempts
      });
    }, preloadDelay);
  }

  // Return wrapped component
  return function WrappedLazyComponent(props) {
    return (
      <LazyRoute fallback={fallback}>
        <LazyComponent {...props} />
      </LazyRoute>
    );
  };
};

export default LazyRoute;