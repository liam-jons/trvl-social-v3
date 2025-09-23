/**
 * Lazy Loading Wrapper for ML Services
 * Reduces initial bundle size by loading TensorFlow.js and ML services on demand
 */

let tfInstance = null;
let mlServicesCache = null;
let loadingPromise = null;

/**
 * Lazy load TensorFlow.js with WebAssembly backend for better performance
 */
export async function loadTensorFlow() {
  if (tfInstance) {
    return tfInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // Dynamic import to avoid including in main bundle
      const tf = await import('@tensorflow/tfjs');

      // Set backend to WebAssembly for better performance
      await tf.setBackend('webgl');
      await tf.ready();

      tfInstance = tf;
      return tf;
    } catch (error) {
      console.error('Failed to load TensorFlow.js:', error);
      // Fallback to CPU backend
      try {
        const tf = await import('@tensorflow/tfjs');
        await tf.setBackend('cpu');
        await tf.ready();
        tfInstance = tf;
        return tf;
      } catch (fallbackError) {
        console.error('Failed to load TensorFlow.js with CPU backend:', fallbackError);
        throw new Error('Unable to load TensorFlow.js');
      }
    }
  })();

  return loadingPromise;
}

/**
 * Lazy load ML services
 */
export async function loadMLServices() {
  if (mlServicesCache) {
    return mlServicesCache;
  }

  try {
    // Ensure TensorFlow is loaded first
    await loadTensorFlow();

    // Dynamic import of ML services
    const [
      { default: MLService },
      { default: DataPreprocessor },
      { default: FeatureEngineer },
      { default: ModelTrainer },
      { default: ModelManager },
      { default: RetrainingScheduler },
      { default: ABTestingFramework }
    ] = await Promise.all([
      import('./ml-service.js'),
      import('./data-preprocessing.js'),
      import('./feature-engineering.js'),
      import('./model-trainer.js'),
      import('./model-manager.js'),
      import('./retraining-scheduler.js'),
      import('./ab-testing-framework.js')
    ]);

    mlServicesCache = {
      MLService,
      DataPreprocessor,
      FeatureEngineer,
      ModelTrainer,
      ModelManager,
      RetrainingScheduler,
      ABTestingFramework
    };

    return mlServicesCache;
  } catch (error) {
    console.error('Failed to load ML services:', error);
    throw new Error('Unable to load ML services');
  }
}

/**
 * Get ML service instance with lazy loading
 */
export async function getMLService() {
  const services = await loadMLServices();

  // Initialize ML service if not already done
  if (!services.MLService.isInitialized) {
    await services.MLService.initialize();
  }

  return services.MLService;
}

/**
 * Preload ML services for better UX (call when user navigates to quiz section)
 */
export function preloadMLServices() {
  // Start loading in background without awaiting
  loadMLServices().catch(error => {
    console.warn('Preload of ML services failed:', error);
  });
}

/**
 * Check if TensorFlow.js is supported in current environment
 */
export function isTensorFlowSupported() {
  // Check for WebGL support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // Check for essential APIs
  const hasArrayBuffer = typeof ArrayBuffer !== 'undefined';
  const hasFloat32Array = typeof Float32Array !== 'undefined';
  const hasPromise = typeof Promise !== 'undefined';

  return !!(gl && hasArrayBuffer && hasFloat32Array && hasPromise);
}

/**
 * Get TensorFlow.js bundle size estimate
 */
export function getTensorFlowBundleSize() {
  return {
    webgl: '2.4MB', // Approximate WebGL backend size
    cpu: '1.8MB',   // Approximate CPU backend size
    estimated: '2.4MB'
  };
}

export default {
  loadTensorFlow,
  loadMLServices,
  getMLService,
  preloadMLServices,
  isTensorFlowSupported,
  getTensorFlowBundleSize
};