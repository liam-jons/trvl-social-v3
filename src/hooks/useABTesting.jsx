import { useState, useEffect, useContext, createContext } from 'react';
import abTestingService from '../services/ab-testing-service.js';
import { useAuth } from './useAuth';
/**
 * A/B Testing Context
 */
const ABTestingContext = createContext({});
/**
 * A/B Testing Provider Component
 */
export const ABTestingProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [experiments, setExperiments] = useState(new Map());
  const [featureFlags, setFeatureFlags] = useState(new Map());
  const { user } = useAuth();
  // Initialize A/B testing service
  useEffect(() => {
    const initializeABTesting = async () => {
      try {
        await abTestingService.init();
        setIsInitialized(true);
        // Load experiments and flags
        const allExperiments = abTestingService.getAllExperiments();
        const allFlags = abTestingService.getAllFeatureFlags();
        setExperiments(new Map(allExperiments.map(exp => [exp.id, exp])));
        setFeatureFlags(new Map(allFlags.map(flag => [flag.id, flag])));
      } catch (error) {
        console.error('Failed to initialize A/B testing:', error);
      }
    };
    initializeABTesting();
  }, []);
  // Get current page context
  const getCurrentContext = () => ({
    currentPage: window.location.pathname,
    country: user?.user_metadata?.country,
    userAgent: navigator.userAgent
  });
  // Get experiment variant for user
  const getVariant = (experimentId) => {
    if (!isInitialized) return null;
    const context = getCurrentContext();
    return abTestingService.getUserVariant(experimentId, user, context);
  };
  // Check if feature is enabled
  const isFeatureEnabled = (flagId) => {
    if (!isInitialized) return false;
    const context = getCurrentContext();
    return abTestingService.isFeatureEnabled(flagId, user, context);
  };
  // Track experiment event
  const trackExperimentEvent = (experimentId, eventName, properties = {}) => {
    if (!isInitialized) return;
    abTestingService.trackExperimentEvent(experimentId, eventName, properties, user);
  };
  const contextValue = {
    isInitialized,
    experiments: Array.from(experiments.values()),
    featureFlags: Array.from(featureFlags.values()),
    getVariant,
    isFeatureEnabled,
    trackExperimentEvent,
    service: abTestingService
  };
  return (
    <ABTestingContext.Provider value={contextValue}>
      {children}
    </ABTestingContext.Provider>
  );
};
/**
 * Hook to access A/B testing context
 */
export const useABTesting = () => {
  const context = useContext(ABTestingContext);
  if (!context) {
    throw new Error('useABTesting must be used within an ABTestingProvider');
  }
  return context;
};
/**
 * Hook to get experiment variant
 */
export const useExperiment = (experimentId) => {
  const { getVariant, trackExperimentEvent, isInitialized } = useABTesting();
  const [variant, setVariant] = useState(null);
  useEffect(() => {
    if (isInitialized && experimentId) {
      const userVariant = getVariant(experimentId);
      setVariant(userVariant);
    }
  }, [experimentId, getVariant, isInitialized]);
  const trackEvent = (eventName, properties = {}) => {
    trackExperimentEvent(experimentId, eventName, properties);
  };
  return {
    variant,
    isControl: variant === 'control',
    isTest: variant && variant !== 'control',
    trackEvent
  };
};
/**
 * Hook to check feature flag
 */
export const useFeatureFlag = (flagId) => {
  const { isFeatureEnabled, isInitialized } = useABTesting();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (isInitialized && flagId) {
      const isEnabled = isFeatureEnabled(flagId);
      setEnabled(isEnabled);
    }
  }, [flagId, isFeatureEnabled, isInitialized]);
  return enabled;
};
/**
 * Hook for conditional rendering based on experiment variant
 */
export const useVariantComponent = (experimentId, components = {}) => {
  const { variant } = useExperiment(experimentId);
  if (!variant || !components[variant]) {
    return components.control || components.default || null;
  }
  return components[variant];
};
/**
 * Hook for A/B testing with automatic event tracking
 */
export const useExperimentWithTracking = (experimentId, config = {}) => {
  const { variant, trackEvent } = useExperiment(experimentId);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  // Auto-track view event
  useEffect(() => {
    if (variant && !hasTrackedView && config.autoTrackView !== false) {
      trackEvent('view');
      setHasTrackedView(true);
    }
  }, [variant, hasTrackedView, trackEvent, config.autoTrackView]);
  // Track interaction events
  const trackInteraction = (interactionType, properties = {}) => {
    trackEvent(`interaction_${interactionType}`, properties);
  };
  // Track conversion events
  const trackConversion = (conversionType = 'default', properties = {}) => {
    trackEvent(`conversion_${conversionType}`, properties);
  };
  // Track click events with element info
  const trackClick = (elementId, properties = {}) => {
    trackEvent('click', {
      element_id: elementId,
      ...properties
    });
  };
  return {
    variant,
    isControl: variant === 'control',
    isTest: variant && variant !== 'control',
    trackEvent,
    trackInteraction,
    trackConversion,
    trackClick
  };
};
/**
 * Hook for gradual feature rollout with analytics
 */
export const useGradualRollout = (flagId, options = {}) => {
  const enabled = useFeatureFlag(flagId);
  const { trackExperimentEvent } = useABTesting();
  const [hasTrackedUsage, setHasTrackedUsage] = useState(false);
  // Track feature usage
  useEffect(() => {
    if (enabled && !hasTrackedUsage) {
      trackExperimentEvent('feature_rollout', 'feature_accessed', {
        feature_id: flagId,
        rollout_stage: options.stage || 'gradual'
      });
      setHasTrackedUsage(true);
    }
  }, [enabled, hasTrackedUsage, flagId, options.stage, trackExperimentEvent]);
  const trackFeatureUsage = (action, properties = {}) => {
    if (enabled) {
      trackExperimentEvent('feature_rollout', `feature_${action}`, {
        feature_id: flagId,
        ...properties
      });
    }
  };
  return {
    enabled,
    trackUsage: trackFeatureUsage
  };
};
/**
 * Higher-order component for A/B testing
 */
export const withExperiment = (experimentId, variants = {}) => {
  return (WrappedComponent) => {
    return function ExperimentWrapper(props) {
      const { variant } = useExperiment(experimentId);
      // Pass variant as prop
      const experimentProps = {
        ...props,
        experimentVariant: variant,
        isControl: variant === 'control',
        isTest: variant && variant !== 'control'
      };
      // Render variant-specific component if available
      if (variant && variants[variant]) {
        const VariantComponent = variants[variant];
        return <VariantComponent {...experimentProps} />;
      }
      // Render default component
      return <WrappedComponent {...experimentProps} />;
    };
  };
};
/**
 * Component for conditional rendering based on feature flags
 */
export const FeatureFlag = ({ flagId, children, fallback = null }) => {
  const enabled = useFeatureFlag(flagId);
  if (enabled) {
    return typeof children === 'function' ? children({ enabled }) : children;
  }
  return fallback;
};
/**
 * Component for A/B test rendering
 */
export const ExperimentVariant = ({
  experimentId,
  variant: targetVariant,
  children,
  fallback = null
}) => {
  const { variant } = useExperiment(experimentId);
  if (variant === targetVariant) {
    return typeof children === 'function' ? children({ variant }) : children;
  }
  return fallback;
};
export default useABTesting;