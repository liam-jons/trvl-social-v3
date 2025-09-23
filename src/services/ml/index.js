/**
 * ML Service Index - Main entry point for ML functionality
 * Exports all ML services and utilities
 */
export { default as MLService } from './ml-service.js';
export { default as DataPreprocessor } from './data-preprocessing.js';
export { default as FeatureEngineer } from './feature-engineering.js';
export { default as ModelTrainer } from './model-trainer.js';
export { default as ModelManager } from './model-manager.js';
export { default as RetrainingScheduler } from './retraining-scheduler.js';
export { default as ABTestingFramework } from './ab-testing-framework.js';
// Main ML service singleton
import mlService from './ml-service.js';
// Initialize ML service on import
mlService.initialize().catch(error => {
});
export default mlService;