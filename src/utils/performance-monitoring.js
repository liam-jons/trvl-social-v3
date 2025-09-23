/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and bundle loading performance
 */

/**
 * Track Core Web Vitals
 */
export function trackCoreWebVitals() {
  if (typeof window === 'undefined') return;

  // Import web-vitals library dynamically to avoid bundling it initially
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    // Track Cumulative Layout Shift
    onCLS((metric) => {
      reportMetric('CLS', metric);
    });

    // Track First Input Delay
    onFID((metric) => {
      reportMetric('FID', metric);
    });

    // Track First Contentful Paint
    onFCP((metric) => {
      reportMetric('FCP', metric);
    });

    // Track Largest Contentful Paint
    onLCP((metric) => {
      reportMetric('LCP', metric);
    });

    // Track Time to First Byte
    onTTFB((metric) => {
      reportMetric('TTFB', metric);
    });
  }).catch(() => {
    // Silently fail if web-vitals can't be loaded
  });
}

/**
 * Track bundle loading performance
 */
export function trackBundleLoading() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Track initial bundle loading
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;

    reportMetric('Bundle_Load_Time', {
      value: loadTime,
      rating: loadTime < 3000 ? 'good' : loadTime < 5000 ? 'needs-improvement' : 'poor'
    });

    // Track resource loading times
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));

    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    reportMetric('Total_JS_Size', { value: totalJSSize });
    reportMetric('Total_CSS_Size', { value: totalCSSSize });
    reportMetric('Resource_Count', { value: resources.length });

    // Track largest resources
    const largestJS = jsResources.reduce((largest, current) =>
      (current.transferSize || 0) > (largest.transferSize || 0) ? current : largest,
      jsResources[0] || {}
    );

    if (largestJS.name) {
      reportMetric('Largest_JS_Bundle', {
        name: largestJS.name,
        size: largestJS.transferSize || 0,
        loadTime: largestJS.duration || 0
      });
    }
  });
}

/**
 * Track lazy loading performance
 */
export function trackLazyLoading(chunkName, loadTime) {
  reportMetric('Lazy_Load_Performance', {
    chunk: chunkName,
    loadTime,
    rating: loadTime < 1000 ? 'good' : loadTime < 2000 ? 'needs-improvement' : 'poor'
  });
}

/**
 * Track image loading performance
 */
export function trackImagePerformance() {
  if (typeof window === 'undefined') return;

  const imageObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        reportMetric('Image_Load_Time', {
          url: entry.name,
          loadTime: entry.duration,
          size: entry.transferSize || 0
        });
      }
    });
  });

  imageObserver.observe({ entryTypes: ['resource'] });
}

/**
 * Track TensorFlow.js loading and initialization
 */
export function trackTensorFlowPerformance() {
  const startTime = performance.now();

  return {
    markLoadStart: () => {
      performance.mark('tf-load-start');
    },
    markLoadEnd: () => {
      performance.mark('tf-load-end');
      performance.measure('tf-load-time', 'tf-load-start', 'tf-load-end');

      const measure = performance.getEntriesByName('tf-load-time')[0];
      reportMetric('TensorFlow_Load_Time', {
        value: measure.duration,
        rating: measure.duration < 2000 ? 'good' : measure.duration < 4000 ? 'needs-improvement' : 'poor'
      });
    },
    markInitEnd: () => {
      const totalTime = performance.now() - startTime;
      reportMetric('TensorFlow_Init_Time', {
        value: totalTime,
        rating: totalTime < 3000 ? 'good' : totalTime < 6000 ? 'needs-improvement' : 'poor'
      });
    }
  };
}

/**
 * Report performance metrics
 */
function reportMetric(name, metric) {
  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', 'performance_metric', {
      metric_name: name,
      metric_value: metric.value || metric,
      metric_rating: metric.rating || 'unknown',
      custom_parameter: JSON.stringify(metric)
    });
  }

  // Send to Mixpanel if available
  if (window.mixpanel) {
    window.mixpanel.track('Performance Metric', {
      metric_name: name,
      ...metric
    });
  }

  // Send to DataDog if available
  if (window.DD_RUM) {
    window.DD_RUM.addAction('performance_metric', {
      metric_name: name,
      ...metric
    });
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}:`, metric);
  }
}

/**
 * Monitor bundle chunk loading
 */
export function monitorChunkLoading() {
  if (typeof window === 'undefined') return;

  // Override webpack's chunk loading to track performance
  const originalLoad = window.__webpack_require__?.e;
  if (originalLoad) {
    window.__webpack_require__.e = function(chunkId) {
      const startTime = performance.now();

      return originalLoad.call(this, chunkId).then((result) => {
        const loadTime = performance.now() - startTime;
        trackLazyLoading(chunkId, loadTime);
        return result;
      }).catch((error) => {
        const loadTime = performance.now() - startTime;
        reportMetric('Chunk_Load_Error', {
          chunkId,
          loadTime,
          error: error.message
        });
        throw error;
      });
    };
  }
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Wait for page to be fully loaded
  if (document.readyState === 'complete') {
    setupMonitoring();
  } else {
    window.addEventListener('load', setupMonitoring);
  }
}

function setupMonitoring() {
  trackCoreWebVitals();
  trackBundleLoading();
  trackImagePerformance();
  monitorChunkLoading();
}

/**
 * Performance budget checker
 */
export function checkPerformanceBudget() {
  const budgets = {
    totalJSSize: 500 * 1024, // 500KB
    totalCSSSize: 50 * 1024, // 50KB
    maxChunkSize: 200 * 1024, // 200KB
    loadTime: 3000, // 3 seconds
    fcp: 1500, // 1.5 seconds
    lcp: 2500, // 2.5 seconds
    cls: 0.1,
    fid: 100 // 100ms
  };

  return {
    budgets,
    checkBudget: (metric, value) => {
      const budget = budgets[metric];
      if (!budget) return null;

      const withinBudget = value <= budget;
      const percentOfBudget = (value / budget) * 100;

      return {
        withinBudget,
        percentOfBudget,
        budget,
        actual: value,
        difference: value - budget
      };
    }
  };
}

export default {
  trackCoreWebVitals,
  trackBundleLoading,
  trackLazyLoading,
  trackImagePerformance,
  trackTensorFlowPerformance,
  initializePerformanceMonitoring,
  checkPerformanceBudget
};