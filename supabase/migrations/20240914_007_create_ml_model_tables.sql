-- Migration: ML Model Training and Versioning Tables
-- Description: Create tables for ML model storage, versioning, training data, and performance tracking

-- Create model status enum
CREATE TYPE model_status AS ENUM ('training', 'trained', 'deployed', 'archived', 'failed');

-- Create training data source enum
CREATE TYPE training_data_source AS ENUM ('booking_history', 'compatibility_scores', 'user_feedback', 'synthetic');

-- Create ML models table for versioning and metadata
CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL CHECK (model_type IN ('compatibility_predictor', 'group_optimizer', 'preference_learner')),
  status model_status DEFAULT 'training',
  architecture JSONB, -- Store model architecture details
  hyperparameters JSONB, -- Store training hyperparameters
  training_config JSONB, -- Store training configuration
  model_blob_url TEXT, -- URL to stored model file
  model_weights BYTEA, -- Inline model weights for small models
  input_features TEXT[], -- Array of feature names used
  output_shape JSONB, -- Expected output shape/format
  performance_metrics JSONB, -- Validation metrics
  training_duration_seconds INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deployed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  UNIQUE(name, version)
);

-- Create training datasets table
CREATE TABLE training_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  data_source training_data_source NOT NULL,
  source_query TEXT, -- SQL query used to generate dataset
  feature_count INTEGER NOT NULL,
  sample_count INTEGER NOT NULL,
  data_blob_url TEXT, -- URL to stored dataset file
  data_hash TEXT NOT NULL, -- Hash for data integrity
  schema_definition JSONB, -- Column definitions and types
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create model training runs table
CREATE TABLE model_training_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES training_datasets(id),
  training_config JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  epoch_count INTEGER DEFAULT 0,
  final_loss DECIMAL(10, 6),
  validation_loss DECIMAL(10, 6),
  training_metrics JSONB, -- Metrics collected during training
  error_message TEXT,
  logs TEXT, -- Training logs
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create model performance tracking table
CREATE TABLE model_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10, 6) NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('training', 'validation', 'production', 'ab_test')),
  measured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  context JSONB -- Additional context like dataset split, test group, etc.
);

-- Create A/B testing experiments table
CREATE TABLE ab_test_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  control_model_id UUID NOT NULL REFERENCES ml_models(id),
  treatment_model_id UUID NOT NULL REFERENCES ml_models(id),
  traffic_split DECIMAL(3, 2) DEFAULT 0.50 CHECK (traffic_split >= 0 AND traffic_split <= 1),
  success_metric TEXT NOT NULL, -- Primary metric to optimize
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  results JSONB, -- Statistical test results
  winner_model_id UUID REFERENCES ml_models(id),
  created_by UUID REFERENCES profiles(id)
);

-- Create A/B test assignments table
CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES ab_test_experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  assigned_model_id UUID NOT NULL REFERENCES ml_models(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(experiment_id, user_id)
);

-- Create model predictions log table for tracking production usage
CREATE TABLE model_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ml_models(id),
  user_id UUID REFERENCES profiles(id),
  group_id UUID REFERENCES groups(id),
  input_features JSONB NOT NULL,
  prediction_output JSONB NOT NULL,
  confidence_score DECIMAL(5, 4),
  prediction_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  feedback_score DECIMAL(3, 2), -- User feedback on prediction quality
  actual_outcome BOOLEAN, -- Whether prediction was correct
  feedback_provided_at TIMESTAMPTZ
);

-- Create automated retraining triggers table
CREATE TABLE retraining_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('data_volume', 'time_based', 'performance_degradation', 'manual')),
  trigger_config JSONB NOT NULL, -- Configuration for trigger conditions
  model_type TEXT NOT NULL CHECK (model_type IN ('compatibility_predictor', 'group_optimizer', 'preference_learner')),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create retraining jobs table
CREATE TABLE retraining_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES retraining_triggers(id),
  model_id UUID REFERENCES ml_models(id), -- Current model being retrained
  new_model_id UUID REFERENCES ml_models(id), -- Newly trained model
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  performance_improvement DECIMAL(5, 4), -- Performance gain from retraining
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_ml_models_name ON ml_models(name);
CREATE INDEX idx_ml_models_type_status ON ml_models(model_type, status);
CREATE INDEX idx_ml_models_created_at ON ml_models(created_at DESC);

CREATE INDEX idx_training_datasets_data_source ON training_datasets(data_source);
CREATE INDEX idx_training_datasets_created_at ON training_datasets(created_at DESC);

CREATE INDEX idx_model_training_runs_model_id ON model_training_runs(model_id);
CREATE INDEX idx_model_training_runs_status ON model_training_runs(status);
CREATE INDEX idx_model_training_runs_created_at ON model_training_runs(created_at DESC);

CREATE INDEX idx_model_performance_metrics_model_id ON model_performance_metrics(model_id);
CREATE INDEX idx_model_performance_metrics_metric_name ON model_performance_metrics(metric_name);
CREATE INDEX idx_model_performance_metrics_measured_at ON model_performance_metrics(measured_at DESC);

CREATE INDEX idx_ab_test_experiments_active ON ab_test_experiments(is_active);
CREATE INDEX idx_ab_test_assignments_experiment_id ON ab_test_assignments(experiment_id);
CREATE INDEX idx_ab_test_assignments_user_id ON ab_test_assignments(user_id);

CREATE INDEX idx_model_predictions_model_id ON model_predictions(model_id);
CREATE INDEX idx_model_predictions_user_id ON model_predictions(user_id);
CREATE INDEX idx_model_predictions_created_at ON model_predictions(created_at DESC);

CREATE INDEX idx_retraining_triggers_active ON retraining_triggers(is_active);
CREATE INDEX idx_retraining_triggers_next_check ON retraining_triggers(next_check_at);

CREATE INDEX idx_retraining_jobs_status ON retraining_jobs(status);
CREATE INDEX idx_retraining_jobs_created_at ON retraining_jobs(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_training_datasets_updated_at
  BEFORE UPDATE ON training_datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retraining_triggers_updated_at
  BEFORE UPDATE ON retraining_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE retraining_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retraining_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read model metadata
CREATE POLICY "Authenticated users can view model metadata"
  ON ml_models FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only allow system/admin users to manage models
CREATE POLICY "System users can manage models"
  ON ml_models FOR ALL
  USING (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Similar policies for other tables
CREATE POLICY "System users can manage training datasets"
  ON training_datasets FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "System users can manage training runs"
  ON model_training_runs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "System users can manage performance metrics"
  ON model_performance_metrics FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their A/B test assignments"
  ON ab_test_assignments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System users can manage A/B tests"
  ON ab_test_experiments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "System users can manage predictions"
  ON model_predictions FOR ALL
  USING (auth.role() = 'service_role');