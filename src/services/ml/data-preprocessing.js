/**
 * Data Preprocessing Pipeline for ML Model Training
 * Handles extraction, cleaning, and transformation of historical booking data
 */
import { supabase } from '../../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
export class DataPreprocessor {
  constructor() {
    this.featureCache = new Map();
    this.scalingParams = new Map();
  }
  /**
   * Extract raw training data from various sources
   */
  async extractTrainingData(dataSourceConfig) {
    const { source, dateRange, filters = {} } = dataSourceConfig;
    try {
      switch (source) {
        case 'booking_history':
          return await this.extractBookingHistoryData(dateRange, filters);
        case 'compatibility_scores':
          return await this.extractCompatibilityData(dateRange, filters);
        case 'user_feedback':
          return await this.extractUserFeedbackData(dateRange, filters);
        case 'group_outcomes':
          return await this.extractGroupOutcomeData(dateRange, filters);
        default:
          throw new Error(`Unknown data source: ${source}`);
      }
    } catch (error) {
      console.error('Error extracting training data:', error);
      throw error;
    }
  }
  /**
   * Extract historical booking data with group and user information
   */
  async extractBookingHistoryData(dateRange, filters) {
    const { startDate, endDate } = dateRange;
    const query = supabase
      .from('bookings')
      .select(`
        id,
        group_id,
        user_id,
        status,
        created_at,
        cancelled_at,
        groups!inner(
          id,
          name,
          max_members,
          current_members,
          interests,
          age_range,
          location
        ),
        profiles!inner(
          id,
          age,
          location,
          interests
        ),
        personality_assessments(
          openness,
          conscientiousness,
          extraversion,
          agreeableness,
          neuroticism,
          adventure_style,
          budget_preference,
          planning_style,
          group_preference
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    // Apply filters
    if (filters.groupSize) {
      query.gte('groups.current_members', filters.groupSize.min);
      query.lte('groups.current_members', filters.groupSize.max);
    }
    if (filters.bookingStatus) {
      query.in('status', filters.bookingStatus);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to extract booking history: ${error.message}`);
    }
    return data;
  }
  /**
   * Extract compatibility score history
   */
  async extractCompatibilityData(dateRange, filters) {
    const { startDate, endDate } = dateRange;
    const { data, error } = await supabase
      .from('group_compatibility_scores')
      .select(`
        group_id,
        user_id,
        compatibility_score,
        personality_match,
        interest_match,
        style_match,
        calculated_at,
        groups!inner(
          current_members,
          interests,
          age_range
        ),
        profiles!inner(
          age,
          location,
          interests
        )
      `)
      .gte('calculated_at', startDate)
      .lte('calculated_at', endDate);
    if (error) {
      throw new Error(`Failed to extract compatibility data: ${error.message}`);
    }
    return data;
  }
  /**
   * Extract user feedback data
   */
  async extractUserFeedbackData(dateRange, filters) {
    const { startDate, endDate } = dateRange;
    const { data, error } = await supabase
      .from('model_predictions')
      .select(`
        model_id,
        user_id,
        group_id,
        input_features,
        prediction_output,
        confidence_score,
        feedback_score,
        actual_outcome,
        created_at,
        feedback_provided_at
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('feedback_score', 'is', null);
    if (error) {
      throw new Error(`Failed to extract user feedback: ${error.message}`);
    }
    return data;
  }
  /**
   * Extract group outcome data (success/failure metrics)
   */
  async extractGroupOutcomeData(dateRange, filters) {
    const { startDate, endDate } = dateRange;
    // Query groups with their booking completion rates
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        max_members,
        current_members,
        interests,
        age_range,
        location,
        created_at,
        bookings(
          id,
          status,
          created_at,
          cancelled_at
        ),
        group_members(
          user_id,
          joined_at,
          profiles!inner(
            age,
            location,
            interests,
            personality_assessments(
              openness,
              conscientiousness,
              extraversion,
              agreeableness,
              neuroticism,
              adventure_style,
              budget_preference,
              planning_style,
              group_preference
            )
          )
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    if (error) {
      throw new Error(`Failed to extract group outcome data: ${error.message}`);
    }
    return data;
  }
  /**
   * Clean and validate raw data
   */
  async cleanData(rawData, dataSource) {
    if (!Array.isArray(rawData)) {
      throw new Error('Raw data must be an array');
    }
    const cleanedData = [];
    let validRecords = 0;
    let invalidRecords = 0;
    for (const record of rawData) {
      try {
        const cleanedRecord = await this.cleanRecord(record, dataSource);
        if (cleanedRecord) {
          cleanedData.push(cleanedRecord);
          validRecords++;
        } else {
          invalidRecords++;
        }
      } catch (error) {
        console.warn('Error cleaning record:', error);
        invalidRecords++;
      }
    }
    console.log(`Data cleaning complete: ${validRecords} valid, ${invalidRecords} invalid records`);
    return cleanedData;
  }
  /**
   * Clean individual record
   */
  async cleanRecord(record, dataSource) {
    if (!record || typeof record !== 'object') {
      return null;
    }
    // Remove null/undefined values
    const cleanedRecord = {};
    for (const [key, value] of Object.entries(record)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively clean nested objects
          const cleanedNested = await this.cleanRecord(value, dataSource);
          if (cleanedNested && Object.keys(cleanedNested).length > 0) {
            cleanedRecord[key] = cleanedNested;
          }
        } else if (Array.isArray(value)) {
          // Clean arrays
          const cleanedArray = value.filter(item => item !== null && item !== undefined);
          if (cleanedArray.length > 0) {
            cleanedRecord[key] = cleanedArray;
          }
        } else {
          cleanedRecord[key] = value;
        }
      }
    }
    // Validate required fields based on data source
    if (!this.validateRequiredFields(cleanedRecord, dataSource)) {
      return null;
    }
    return cleanedRecord;
  }
  /**
   * Validate required fields for different data sources
   */
  validateRequiredFields(record, dataSource) {
    const requiredFields = {
      booking_history: ['id', 'group_id', 'user_id', 'status'],
      compatibility_scores: ['group_id', 'user_id', 'compatibility_score'],
      user_feedback: ['user_id', 'prediction_output', 'feedback_score'],
      group_outcomes: ['id', 'current_members']
    };
    const fields = requiredFields[dataSource];
    if (!fields) return true;
    return fields.every(field => {
      const value = this.getNestedValue(record, field);
      return value !== null && value !== undefined;
    });
  }
  /**
   * Get nested object value by dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }
  /**
   * Transform cleaned data into feature vectors
   */
  async transformToFeatures(cleanedData, transformationConfig) {
    const { featureSet, scalingMethod = 'standard', handleMissing = 'mean' } = transformationConfig;
    const transformedData = [];
    for (const record of cleanedData) {
      try {
        const features = await this.extractFeatures(record, featureSet);
        const scaledFeatures = await this.scaleFeatures(features, scalingMethod);
        const completeFeatures = await this.handleMissingValues(scaledFeatures, handleMissing);
        transformedData.push({
          id: record.id || uuidv4(),
          features: completeFeatures,
          metadata: {
            originalRecord: record,
            transformedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('Error transforming record to features:', error);
      }
    }
    return transformedData;
  }
  /**
   * Extract features from a single record
   */
  async extractFeatures(record, featureSet) {
    const features = {};
    for (const featureConfig of featureSet) {
      const { name, type, source, transformation } = featureConfig;
      try {
        let value = this.getNestedValue(record, source);
        // Apply transformation if specified
        if (transformation && value !== null && value !== undefined) {
          value = await this.applyTransformation(value, transformation);
        }
        // Convert to appropriate type
        features[name] = this.convertFeatureType(value, type);
      } catch (error) {
        console.warn(`Error extracting feature ${name}:`, error);
        features[name] = null;
      }
    }
    return features;
  }
  /**
   * Apply transformation functions to feature values
   */
  async applyTransformation(value, transformation) {
    const { type, params = {} } = transformation;
    switch (type) {
      case 'normalize':
        return this.normalizeValue(value, params.min || 0, params.max || 1);
      case 'categorize':
        return this.categorizeValue(value, params.categories || []);
      case 'one_hot_encode':
        return this.oneHotEncode(value, params.categories || []);
      case 'log_transform':
        return value > 0 ? Math.log(value) : 0;
      case 'age_group':
        return this.getAgeGroup(value);
      case 'array_length':
        return Array.isArray(value) ? value.length : 0;
      case 'date_features':
        return this.extractDateFeatures(value);
      default:
        return value;
    }
  }
  /**
   * Normalize value to specified range
   */
  normalizeValue(value, min = 0, max = 1) {
    if (typeof value !== 'number') return 0;
    return min + (max - min) * Math.max(0, Math.min(1, value));
  }
  /**
   * Categorize continuous values into discrete categories
   */
  categorizeValue(value, categories) {
    if (!Array.isArray(categories) || categories.length === 0) return 0;
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (value >= category.min && value <= category.max) {
        return i;
      }
    }
    return categories.length - 1; // Default to last category
  }
  /**
   * One-hot encode categorical values
   */
  oneHotEncode(value, categories) {
    const encoded = new Array(categories.length).fill(0);
    const index = categories.indexOf(value);
    if (index >= 0) {
      encoded[index] = 1;
    }
    return encoded;
  }
  /**
   * Convert age to age group
   */
  getAgeGroup(age) {
    if (age < 25) return 0;
    if (age < 35) return 1;
    if (age < 45) return 2;
    if (age < 55) return 3;
    return 4;
  }
  /**
   * Extract features from dates
   */
  extractDateFeatures(dateString) {
    const date = new Date(dateString);
    return {
      month: date.getMonth(),
      day_of_week: date.getDay(),
      hour: date.getHours(),
      is_weekend: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0
    };
  }
  /**
   * Convert feature value to specified type
   */
  convertFeatureType(value, type) {
    if (value === null || value === undefined) return null;
    switch (type) {
      case 'numeric':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      case 'categorical':
        return String(value);
      case 'boolean':
        return Boolean(value) ? 1 : 0;
      case 'array':
        return Array.isArray(value) ? value : [];
      default:
        return value;
    }
  }
  /**
   * Scale features using specified method
   */
  async scaleFeatures(features, scalingMethod) {
    const scaledFeatures = { ...features };
    for (const [featureName, value] of Object.entries(features)) {
      if (typeof value === 'number' && !isNaN(value)) {
        scaledFeatures[featureName] = await this.scaleValue(value, featureName, scalingMethod);
      }
    }
    return scaledFeatures;
  }
  /**
   * Scale individual feature value
   */
  async scaleValue(value, featureName, scalingMethod) {
    // Get or compute scaling parameters for this feature
    const scalingParams = await this.getScalingParams(featureName, scalingMethod);
    switch (scalingMethod) {
      case 'standard':
        return scalingParams.std > 0 ? (value - scalingParams.mean) / scalingParams.std : 0;
      case 'min_max':
        return scalingParams.max > scalingParams.min
          ? (value - scalingParams.min) / (scalingParams.max - scalingParams.min)
          : 0;
      case 'robust':
        return scalingParams.iqr > 0 ? (value - scalingParams.median) / scalingParams.iqr : 0;
      default:
        return value;
    }
  }
  /**
   * Get scaling parameters for a feature
   */
  async getScalingParams(featureName, scalingMethod) {
    const cacheKey = `${featureName}_${scalingMethod}`;
    if (this.scalingParams.has(cacheKey)) {
      return this.scalingParams.get(cacheKey);
    }
    // In a real implementation, these would be computed from training data
    // For now, return default parameters
    const defaultParams = {
      standard: { mean: 0, std: 1 },
      min_max: { min: 0, max: 1 },
      robust: { median: 0, iqr: 1 }
    };
    const params = defaultParams[scalingMethod] || defaultParams.standard;
    this.scalingParams.set(cacheKey, params);
    return params;
  }
  /**
   * Handle missing values in features
   */
  async handleMissingValues(features, strategy) {
    const completeFeatures = { ...features };
    for (const [featureName, value] of Object.entries(features)) {
      if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
        completeFeatures[featureName] = await this.imputeMissingValue(featureName, strategy);
      }
    }
    return completeFeatures;
  }
  /**
   * Impute missing values using specified strategy
   */
  async imputeMissingValue(featureName, strategy) {
    switch (strategy) {
      case 'mean':
        return 0; // In real implementation, compute actual mean from training data
      case 'median':
        return 0; // In real implementation, compute actual median from training data
      case 'mode':
        return 'unknown'; // In real implementation, compute actual mode from training data
      case 'zero':
        return 0;
      case 'forward_fill':
        return this.featureCache.get(`${featureName}_last_value`) || 0;
      default:
        return 0;
    }
  }
  /**
   * Split data into training, validation, and test sets
   */
  splitData(data, splitRatio = { train: 0.7, validation: 0.15, test: 0.15 }) {
    const shuffled = this.shuffleArray([...data]);
    const totalSize = shuffled.length;
    const trainSize = Math.floor(totalSize * splitRatio.train);
    const validationSize = Math.floor(totalSize * splitRatio.validation);
    return {
      train: shuffled.slice(0, trainSize),
      validation: shuffled.slice(trainSize, trainSize + validationSize),
      test: shuffled.slice(trainSize + validationSize)
    };
  }
  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  /**
   * Save processed dataset to database
   */
  async saveDataset(processedData, metadata) {
    const datasetId = uuidv4();
    const dataHash = this.generateDataHash(processedData);
    try {
      // In a real implementation, you would store the data in a file storage system
      // and save the URL reference in the database
      const { data, error } = await supabase
        .from('training_datasets')
        .insert({
          id: datasetId,
          name: metadata.name,
          description: metadata.description,
          data_source: metadata.dataSource,
          feature_count: metadata.featureCount,
          sample_count: processedData.length,
          data_hash: dataHash,
          schema_definition: metadata.schemaDefinition,
          source_query: metadata.sourceQuery
        })
        .select()
        .single();
      if (error) {
        throw new Error(`Failed to save dataset: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Error saving dataset:', error);
      throw error;
    }
  }
  /**
   * Generate hash for data integrity checking
   */
  generateDataHash(data) {
    // Simple hash function - in production, use a proper hash like SHA-256
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
  /**
   * Load dataset from database
   */
  async loadDataset(datasetId) {
    try {
      const { data, error } = await supabase
        .from('training_datasets')
        .select('*')
        .eq('id', datasetId)
        .single();
      if (error) {
        throw new Error(`Failed to load dataset: ${error.message}`);
      }
      // In a real implementation, load the actual data from the stored URL
      return data;
    } catch (error) {
      console.error('Error loading dataset:', error);
      throw error;
    }
  }
}
export default DataPreprocessor;