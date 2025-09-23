import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import monitoringManager from './services/monitoring-manager.js'

// Initialize monitoring system early
const initializeMonitoring = async () => {
  try {
    // Configuration for production monitoring
    const monitoringConfig = {
      environment: import.meta.env.PROD ? 'production' : 'development',
      enabledServices: [
        'sentry',           // Error tracking and performance monitoring
        'webVitals',        // Core Web Vitals monitoring
        'googleAnalytics',  // GA4 analytics
        'analytics',        // Unified analytics service
        'alerts'            // Performance alerts
      ],

      // Enhanced configuration for production
      sentry: {
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        profilesSampleRate: import.meta.env.PROD ? 0.05 : 0.5,
        replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.1
      },

      googleAnalytics: {
        consentRequired: true,
        enhancedEcommerce: true,
        customDimensions: true
      },

      webVitals: {
        reportAllChanges: !import.meta.env.PROD,
        enableLogging: !import.meta.env.PROD
      },

      alerts: {
        thresholds: {
          webVitals: {
            LCP: { warning: 2500, critical: 4000 },
            FID: { warning: 100, critical: 300 },
            CLS: { warning: 0.1, critical: 0.25 },
            FCP: { warning: 1800, critical: 3000 },
            TTFB: { warning: 800, critical: 1800 }
          },
          performance: {
            responseTime: { warning: 500, critical: 1000 },
            errorRate: { warning: 1, critical: 5 },
            memoryUsage: { warning: 70, critical: 85 },
            cpuUsage: { warning: 70, critical: 85 }
          },
          business: {
            conversionRate: { warning: 2, critical: 1, direction: 'below' },
            bounceRate: { warning: 70, critical: 80 },
            sessionDuration: { warning: 60, critical: 30, direction: 'below' }
          }
        },
        notifications: [
          // Add notification channels as needed
          // { type: 'webhook', url: 'https://hooks.slack.com/...' }
        ]
      }
    };

    // Initialize monitoring system
    const initStatus = await monitoringManager.init(monitoringConfig);

    // Report initialization success
    console.log('✅ Monitoring system initialized:', initStatus);

    // Set up global error handler for unhandled errors
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    return initStatus;

  } catch (error) {
    console.error('❌ Failed to initialize monitoring system:', error);

    // Fallback error reporting
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }

    // Don't block app initialization
    return { initialized: false, error: error.message };
  }
};

// Initialize monitoring before React app
initializeMonitoring().then((initStatus) => {
  // Track app initialization
  if (initStatus.initialized && window.gtag) {
    gtag('event', 'app_initialized', {
      monitoring_status: 'success',
      environment: import.meta.env.PROD ? 'production' : 'development'
    });
  }

  // Create and render React app
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}).catch((error) => {
  console.error('Critical initialization error:', error);

  // Render app anyway - monitoring failure shouldn't block the app
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
