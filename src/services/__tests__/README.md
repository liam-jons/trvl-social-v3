# Group Compatibility Algorithm Testing Framework

## Overview

This comprehensive testing framework validates the accuracy, performance, and reliability of the group compatibility algorithms used in the travel social platform. The framework includes unit tests, integration tests, regression tests, performance benchmarks, A/B testing capabilities, and monitoring dashboards.

## Architecture

```
src/services/__tests__/
├── compatibility-scoring.test.js          # Unit tests for individual scoring functions
├── group-optimization-integration.test.js # End-to-end integration tests
├── algorithm-regression.test.js            # Regression tests with historical data
├── algorithm-performance.test.js           # Performance benchmarks and scalability tests
├── ab-testing-framework.test.js           # A/B testing framework for algorithm comparison
├── algorithm-test-runner.test.js           # Orchestrates all testing components
└── README.md                              # This documentation
```

## Test Categories

### 1. Unit Tests (`compatibility-scoring.test.js`)

Tests individual compatibility scoring functions in isolation:

- **Personality Compatibility**: Energy levels, social preferences, communication styles
- **Adventure Style Compatibility**: Risk tolerance, experience levels, adventure preferences
- **Travel Style Compatibility**: Planning styles, group dynamics preferences
- **Age Compatibility**: Age group matching and gap tolerance
- **Overall Compatibility**: Weighted combination of all factors

**Key Features:**
- Performance validation (< 1ms per calculation)
- Edge case handling (null/invalid data)
- Boundary condition testing
- Score range validation (0-100)

### 2. Integration Tests (`group-optimization-integration.test.js`)

Tests the complete group formation pipeline:

- **End-to-End Group Formation**: Full participant processing workflow
- **Algorithm Comparison**: KMeans vs Hierarchical vs Hybrid performance
- **Conflict Detection Integration**: Real-time conflict identification
- **Data Pipeline Integrity**: Metadata preservation through processing
- **Error Handling**: Graceful failure recovery

**Performance Requirements:**
- < 2 seconds for 50 participants
- < 5 seconds for 100 participants
- Memory usage < 100MB additional

### 3. Regression Tests (`algorithm-regression.test.js`)

Validates consistency against historical successful patterns:

- **Historical Success Validation**: Reproduces high-performing group configurations
- **Problematic Pattern Detection**: Identifies known conflict scenarios
- **Algorithm Consistency**: Ensures reproducible results with identical inputs
- **Quality Baseline Maintenance**: Prevents performance degradation
- **Data Compatibility**: Backward compatibility with legacy data formats

### 4. Performance Tests (`algorithm-performance.test.js`)

Comprehensive performance and scalability validation:

- **Single Algorithm Benchmarks**: Individual algorithm performance profiles
- **Comparative Analysis**: Algorithm efficiency comparison
- **Memory Management**: Leak detection and cleanup validation
- **Concurrent Processing**: Multi-request handling capability
- **Scalability Analysis**: Performance scaling with participant count

**SLA Requirements:**
- **Small Groups** (≤25): < 500ms
- **Medium Groups** (≤50): < 1000ms
- **Large Groups** (≤100): < 2000ms
- **Very Large Groups** (≤200): < 5000ms

### 5. A/B Testing Framework (`ab-testing-framework.test.js`)

Statistical comparison of algorithm variations:

- **Experiment Definition**: Configure variants and success metrics
- **Traffic Splitting**: Deterministic and random assignment strategies
- **Statistical Analysis**: T-tests, significance testing, confidence intervals
- **Multi-Variant Support**: Compare multiple algorithm configurations
- **Result Interpretation**: Actionable recommendations and insights

**Statistical Methods:**
- Welch's t-test for unequal variances
- Cohen's d for effect size calculation
- 95% confidence intervals
- Bonferroni correction for multiple comparisons

### 6. Test Orchestration (`algorithm-test-runner.test.js`)

Comprehensive test suite management:

- **Sequential Test Execution**: Coordinated running of all test categories
- **Result Aggregation**: Unified reporting across test types
- **Coverage Analysis**: Test coverage calculation and reporting
- **Recommendation Generation**: Automated improvement suggestions
- **CI/CD Integration**: Automated testing pipeline support

## Usage

### Running Individual Test Suites

```bash
# Run unit tests
npm test compatibility-scoring.test.js

# Run integration tests
npm test group-optimization-integration.test.js

# Run performance benchmarks
npm test algorithm-performance.test.js

# Run regression tests
npm test algorithm-regression.test.js

# Run A/B testing framework
npm test ab-testing-framework.test.js
```

### Running Comprehensive Test Suite

```bash
# Run all tests with orchestration
npm test algorithm-test-runner.test.js

# Or use the enhanced CLI runner
node src/services/group-optimization-test.js --comprehensive
```

### CLI Testing Options

The enhanced CLI provides multiple testing modes:

```bash
# Standard algorithm tests
node src/services/group-optimization-test.js

# Comprehensive test suite
node src/services/group-optimization-test.js --comprehensive

# A/B testing demonstration
node src/services/group-optimization-test.js --ab-testing

# Generate monitoring data
node src/services/group-optimization-test.js --monitoring
```

## Monitoring Integration

The framework integrates with the monitoring dashboard component:

```javascript
import AlgorithmMonitoringDashboard from '../components/admin/AlgorithmMonitoringDashboard.jsx';

// Real-time metrics collection
const metricsCollector = {
  processingTime: [],
  compatibility: [],
  throughput: [],
  errorRate: []
};

// Dashboard integration
<AlgorithmMonitoringDashboard
  metricsData={metricsCollector}
  onRefresh={handleMetricsRefresh}
  realTimeUpdates={true}
/>
```

## Test Data Management

### Synthetic Data Generation

The framework includes sophisticated synthetic data generators:

```javascript
// Generate test participants with specific personality traits
const participants = generateTestParticipants(50, [
  { energy_level: 80, social_preference: 70 },  // High energy extrovert
  { energy_level: 30, social_preference: 40 },  // Low energy introvert
  // ... additional personality profiles
]);

// Pre-defined test scenarios
const scenarios = {
  smallDiverse: 8,      // Diverse personality mix
  largeHomogeneous: 24, // Similar personalities
  highConflict: 12,     // Known conflict patterns
  ageDiverse: 15        // Age-diverse groups
};
```

### Historical Data Simulation

Regression tests use mock historical data representing:

- **Successful Group Patterns**: High satisfaction, low conflicts
- **Problematic Configurations**: Known failure modes
- **Edge Cases**: Boundary conditions and unusual scenarios

## Configuration

### Test Thresholds

Customize performance and quality thresholds:

```javascript
const testConfig = {
  performance: {
    maxProcessingTime: {
      small: 500,   // ms for ≤25 participants
      medium: 1000, // ms for ≤50 participants
      large: 2000,  // ms for ≤100 participants
      xl: 5000      // ms for ≤200 participants
    }
  },
  quality: {
    minCompatibility: 70,    // Minimum average compatibility %
    maxConflicts: 3,         // Maximum conflicts per group
    minSuccessRate: 95       // Minimum algorithm success rate %
  },
  statistical: {
    significanceLevel: 0.05, // p-value threshold
    minimumSampleSize: 30,   // Minimum samples for analysis
    confidenceInterval: 0.95 // Confidence level
  }
};
```

### Alert Configuration

Set up monitoring alerts:

```javascript
const alertThresholds = {
  processingTime: 2000,    // ms - alert if exceeded
  compatibility: 70,       // % - alert if below
  errorRate: 5,           // % - alert if above
  throughput: 20          // participants/sec - alert if below
};
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Algorithm Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Run comprehensive test suite
      - name: Algorithm Tests
        run: npm test algorithm-test-runner.test.js

      # Generate performance report
      - name: Performance Benchmarks
        run: node src/services/group-optimization-test.js --comprehensive
```

### Quality Gates

Automated quality gates based on test results:

- **Unit Test Coverage**: ≥ 85%
- **Performance Regression**: < 10% slower than baseline
- **Compatibility Score**: ≥ 70% average
- **Error Rate**: < 5%

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout for performance tests: `{ timeout: 30000 }`
   - Reduce test data size for faster execution

2. **Memory Issues**
   - Enable garbage collection: `node --expose-gc`
   - Monitor memory usage in performance tests

3. **Flaky Tests**
   - Use deterministic seeding for reproducible results
   - Increase sample sizes for statistical tests

### Debug Mode

Enable detailed logging:

```bash
DEBUG=algorithm-tests npm test
```

### Performance Profiling

Profile algorithm performance:

```bash
node --inspect src/services/group-optimization-test.js --comprehensive
```

## Future Enhancements

- **Machine Learning Integration**: Automated parameter tuning
- **Real-time Analytics**: Live performance monitoring
- **Predictive Testing**: Failure prediction and prevention
- **Cross-platform Testing**: Mobile and web compatibility
- **Load Testing**: Stress testing with realistic traffic patterns

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Include performance benchmarks
3. Add regression test cases
4. Update documentation
5. Verify CI/CD integration

## License

This testing framework is part of the travel social platform and follows the same license terms.