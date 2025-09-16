import { groupBuilderService } from './group-builder-service.js';
/**
 * Comprehensive testing suite for group optimization algorithms
 * Tests algorithm accuracy, performance, and edge cases
 */
// Test data generators
function generateTestParticipant(id, personality = {}) {
  return {
    id,
    profile: {
      full_name: `Participant ${id}`,
      avatar_url: `https://example.com/avatar${id}.png`,
      age: 20 + Math.random() * 40
    },
    personality: {
      energy_level: personality.energy_level || Math.random() * 100,
      social_preference: personality.social_preference || Math.random() * 100,
      adventure_style: personality.adventure_style || Math.random() * 100,
      risk_tolerance: personality.risk_tolerance || Math.random() * 100,
      planning_style: personality.planning_style || Math.random() * 100,
      communication_style: personality.communication_style || Math.random() * 100,
      experience_level: personality.experience_level || Math.random() * 100,
      leadership_style: personality.leadership_style || Math.random() * 100,
      age: personality.age || 20 + Math.random() * 40
    }
  };
}
function generateTestParticipants(count, personalityVariations = []) {
  const participants = [];
  for (let i = 0; i < count; i++) {
    const personality = personalityVariations[i] || {};
    participants.push(generateTestParticipant(i + 1, personality));
  }
  return participants;
}
// Test scenarios
const testScenarios = {
  // Small diverse group
  smallDiverse: generateTestParticipants(8, [
    { energy_level: 90, social_preference: 80, risk_tolerance: 85 }, // High energy extrovert
    { energy_level: 20, social_preference: 15, risk_tolerance: 30 }, // Low energy introvert
    { energy_level: 60, social_preference: 70, risk_tolerance: 40 }, // Moderate balanced
    { energy_level: 85, social_preference: 30, risk_tolerance: 90 }, // High energy introvert
    { energy_level: 40, social_preference: 85, risk_tolerance: 20 }, // Low energy extrovert
    { energy_level: 70, social_preference: 50, risk_tolerance: 60 }, // Balanced
    { energy_level: 95, social_preference: 95, risk_tolerance: 95 }, // Extreme high
    { energy_level: 10, social_preference: 10, risk_tolerance: 10 }  // Extreme low
  ]),
  // Large homogeneous group
  largeHomogeneous: generateTestParticipants(24, Array(24).fill({
    energy_level: 60 + Math.random() * 20, // 60-80
    social_preference: 50 + Math.random() * 30, // 50-80
    risk_tolerance: 40 + Math.random() * 20, // 40-60
    experience_level: 50 + Math.random() * 20
  })),
  // High conflict group
  highConflict: generateTestParticipants(12, [
    { energy_level: 95, social_preference: 90, risk_tolerance: 95, leadership_style: 90 },
    { energy_level: 5, social_preference: 10, risk_tolerance: 5, leadership_style: 10 },
    { energy_level: 90, social_preference: 15, risk_tolerance: 85, leadership_style: 85 },
    { energy_level: 15, social_preference: 85, risk_tolerance: 20, leadership_style: 15 },
    { energy_level: 95, social_preference: 95, risk_tolerance: 10, leadership_style: 90 },
    { energy_level: 10, social_preference: 10, risk_tolerance: 95, leadership_style: 85 },
    { energy_level: 85, social_preference: 20, risk_tolerance: 90, leadership_style: 80 },
    { energy_level: 20, social_preference: 80, risk_tolerance: 15, leadership_style: 20 },
    { energy_level: 90, social_preference: 85, risk_tolerance: 85, leadership_style: 85 },
    { energy_level: 15, social_preference: 15, risk_tolerance: 15, leadership_style: 15 },
    { energy_level: 85, social_preference: 90, risk_tolerance: 20, leadership_style: 80 },
    { energy_level: 25, social_preference: 20, risk_tolerance: 80, leadership_style: 25 }
  ]),
  // Age diverse group
  ageDiverse: generateTestParticipants(15, [
    { age: 22, energy_level: 85, experience_level: 20 },
    { age: 25, energy_level: 80, experience_level: 30 },
    { age: 28, energy_level: 75, experience_level: 45 },
    { age: 32, energy_level: 70, experience_level: 60 },
    { age: 35, energy_level: 65, experience_level: 70 },
    { age: 38, energy_level: 60, experience_level: 75 },
    { age: 42, energy_level: 55, experience_level: 80 },
    { age: 45, energy_level: 50, experience_level: 85 },
    { age: 48, energy_level: 45, experience_level: 90 },
    { age: 52, energy_level: 40, experience_level: 85 },
    { age: 55, energy_level: 35, experience_level: 80 },
    { age: 58, energy_level: 30, experience_level: 75 },
    { age: 62, energy_level: 25, experience_level: 70 },
    { age: 65, energy_level: 20, experience_level: 65 },
    { age: 68, energy_level: 15, experience_level: 60 }
  ])
};
/**
 * Performance test runner
 */
export class GroupOptimizationTester {
  constructor() {
    this.results = {
      algorithmPerformance: {},
      accuracyTests: {},
      edgeCaseTests: {},
      stressTests: {},
      summary: {}
    };
  }
  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Group Optimization Algorithm Tests...\n');
    await this.testAlgorithmPerformance();
    await this.testAccuracy();
    await this.testEdgeCases();
    await this.testStressConditions();
    await this.testConflictDetection();
    this.generateSummaryReport();
    return this.results;
  }
  // Test algorithm performance with different group sizes
  async testAlgorithmPerformance() {
    console.log('⚡ Testing Algorithm Performance...');
    const algorithms = ['kmeans', 'hierarchical', 'spectral', 'hybrid'];
    const groupSizes = [8, 16, 32, 64, 100];
    for (const algorithm of algorithms) {
      this.results.algorithmPerformance[algorithm] = {};
      for (const size of groupSizes) {
        const participants = generateTestParticipants(size);
        const startTime = Date.now();
        try {
          let groups;
          const options = { targetGroupSize: 6, numGroups: Math.ceil(size / 6) };
          switch (algorithm) {
            case 'kmeans':
              groups = await groupBuilderService.performKMeansGrouping(participants, options.numGroups, options);
              break;
            case 'hierarchical':
              groups = await groupBuilderService.performHierarchicalGrouping(participants, options.targetGroupSize, options);
              break;
            case 'spectral':
              groups = await groupBuilderService.performSpectralGrouping(participants, options.numGroups, options);
              break;
            case 'hybrid':
              groups = await groupBuilderService.performHybridOptimization(participants, options);
              break;
          }
          const endTime = Date.now();
          const duration = endTime - startTime;
          // Calculate quality metrics
          const avgCompatibility = groups.reduce((sum, group) =>
            sum + (group.compatibility?.averageScore || 0), 0
          ) / groups.length;
          const balanceScore = this.calculateGroupBalance(groups);
          this.results.algorithmPerformance[algorithm][size] = {
            duration,
            groupCount: groups.length,
            avgCompatibility: Math.round(avgCompatibility),
            balanceScore: Math.round(balanceScore),
            participantsProcessed: size,
            success: true
          };
          console.log(`  ${algorithm} (${size} participants): ${duration}ms, compatibility: ${Math.round(avgCompatibility)}%`);
        } catch (error) {
          this.results.algorithmPerformance[algorithm][size] = {
            duration: -1,
            error: error.message,
            success: false
          };
          console.log(`  ${algorithm} (${size} participants): FAILED - ${error.message}`);
        }
      }
    }
    console.log('✅ Algorithm Performance Tests Complete\n');
  }
  // Test algorithm accuracy with known scenarios
  async testAccuracy() {
    console.log('🎯 Testing Algorithm Accuracy...');
    const scenarios = Object.keys(testScenarios);
    for (const scenarioName of scenarios) {
      console.log(`  Testing scenario: ${scenarioName}`);
      const participants = testScenarios[scenarioName];
      this.results.accuracyTests[scenarioName] = {};
      // Test each algorithm
      const algorithms = ['kmeans', 'hierarchical', 'hybrid'];
      for (const algorithm of algorithms) {
        try {
          const startTime = Date.now();
          let groups;
          switch (algorithm) {
            case 'kmeans':
              groups = await groupBuilderService.performKMeansGrouping(participants, Math.ceil(participants.length / 6));
              break;
            case 'hierarchical':
              groups = await groupBuilderService.performHierarchicalGrouping(participants, 6);
              break;
            case 'hybrid':
              groups = await groupBuilderService.performHybridOptimization(participants);
              break;
          }
          const duration = Date.now() - startTime;
          // Analyze results
          const conflicts = await Promise.all(
            groups.map(group => groupBuilderService.detectGroupConflicts(group.participants))
          );
          const avgConflictScore = conflicts.reduce((sum, conflict) => {
            return sum + conflict.severityBreakdown.critical * 3 +
                   conflict.severityBreakdown.major * 2 +
                   conflict.severityBreakdown.minor;
          }, 0) / conflicts.length;
          const avgCompatibility = groups.reduce((sum, group) =>
            sum + (group.compatibility?.averageScore || 0), 0
          ) / groups.length;
          this.results.accuracyTests[scenarioName][algorithm] = {
            duration,
            groupCount: groups.length,
            avgCompatibility: Math.round(avgCompatibility),
            avgConflictScore: Math.round(avgConflictScore),
            balanceScore: Math.round(this.calculateGroupBalance(groups)),
            success: true
          };
        } catch (error) {
          this.results.accuracyTests[scenarioName][algorithm] = {
            error: error.message,
            success: false
          };
        }
      }
    }
    console.log('✅ Accuracy Tests Complete\n');
  }
  // Test edge cases and error conditions
  async testEdgeCases() {
    console.log('🔬 Testing Edge Cases...');
    const edgeCases = [
      { name: 'empty_array', participants: [] },
      { name: 'single_participant', participants: generateTestParticipants(1) },
      { name: 'two_participants', participants: generateTestParticipants(2) },
      { name: 'no_personality_data', participants: [
        { id: 1, profile: { full_name: 'Test 1' }, personality: null },
        { id: 2, profile: { full_name: 'Test 2' }, personality: null }
      ]},
      { name: 'mixed_personality_data', participants: [
        ...generateTestParticipants(3),
        { id: 4, profile: { full_name: 'Test 4' }, personality: null },
        { id: 5, profile: { full_name: 'Test 5' }, personality: null }
      ]},
      { name: 'extreme_values', participants: generateTestParticipants(6, [
        { energy_level: 0, social_preference: 0, risk_tolerance: 0 },
        { energy_level: 100, social_preference: 100, risk_tolerance: 100 },
        { energy_level: -10, social_preference: 110, risk_tolerance: 50 }, // Invalid values
        { energy_level: 50, social_preference: 50, risk_tolerance: 50 },
        { energy_level: 25, social_preference: 75, risk_tolerance: 25 },
        { energy_level: 75, social_preference: 25, risk_tolerance: 75 }
      ])}
    ];
    for (const testCase of edgeCases) {
      console.log(`  Testing: ${testCase.name}`);
      this.results.edgeCaseTests[testCase.name] = {};
      // Test hybrid algorithm (most robust)
      try {
        const groups = await groupBuilderService.performHybridOptimization(testCase.participants);
        this.results.edgeCaseTests[testCase.name] = {
          success: true,
          groupCount: groups.length,
          handledGracefully: true,
          totalParticipants: testCase.participants.length,
          groupedParticipants: groups.reduce((sum, group) => sum + group.participants.length, 0)
        };
      } catch (error) {
        this.results.edgeCaseTests[testCase.name] = {
          success: false,
          error: error.message,
          handledGracefully: false
        };
      }
    }
    console.log('✅ Edge Case Tests Complete\n');
  }
  // Test stress conditions and scalability
  async testStressConditions() {
    console.log('💪 Testing Stress Conditions...');
    const stressTests = [
      { name: 'large_group_500', size: 500, timeout: 30000 },
      { name: 'very_large_group_1000', size: 1000, timeout: 60000 },
      { name: 'repeated_calls', size: 50, iterations: 10 },
      { name: 'memory_pressure', size: 200, iterations: 5 }
    ];
    for (const test of stressTests) {
      console.log(`  Stress testing: ${test.name}`);
      try {
        if (test.name === 'repeated_calls') {
          // Test repeated calls for memory leaks
          const times = [];
          const participants = generateTestParticipants(test.size);
          for (let i = 0; i < test.iterations; i++) {
            const startTime = Date.now();
            await groupBuilderService.performHybridOptimization(participants);
            times.push(Date.now() - startTime);
            // Force garbage collection if available
            if (global.gc) global.gc();
          }
          this.results.stressTests[test.name] = {
            success: true,
            iterations: test.iterations,
            avgTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            timeVariation: Math.max(...times) - Math.min(...times)
          };
        } else if (test.name === 'memory_pressure') {
          // Test memory usage with large datasets
          const memoryBefore = process.memoryUsage();
          const participants = generateTestParticipants(test.size);
          for (let i = 0; i < test.iterations; i++) {
            await groupBuilderService.performHybridOptimization(participants);
          }
          const memoryAfter = process.memoryUsage();
          this.results.stressTests[test.name] = {
            success: true,
            memoryIncrease: Math.round((memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024), // MB
            iterations: test.iterations,
            participantsPerIteration: test.size
          };
        } else {
          // Test large groups with timeout
          const participants = generateTestParticipants(test.size);
          const startTime = Date.now();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), test.timeout)
          );
          const algorithmPromise = groupBuilderService.performHybridOptimization(participants);
          await Promise.race([algorithmPromise, timeoutPromise]);
          const duration = Date.now() - startTime;
          this.results.stressTests[test.name] = {
            success: true,
            duration,
            participantCount: test.size,
            withinTimeout: duration < test.timeout
          };
        }
      } catch (error) {
        this.results.stressTests[test.name] = {
          success: false,
          error: error.message
        };
      }
    }
    console.log('✅ Stress Tests Complete\n');
  }
  // Test conflict detection accuracy
  async testConflictDetection() {
    console.log('🔍 Testing Conflict Detection...');
    // Create groups with known conflicts
    const conflictScenarios = [
      {
        name: 'no_conflicts',
        participants: generateTestParticipants(6, Array(6).fill({
          energy_level: 60, social_preference: 60, risk_tolerance: 60
        })),
        expectedConflicts: 0
      },
      {
        name: 'energy_conflicts',
        participants: [
          generateTestParticipant(1, { energy_level: 95 }),
          generateTestParticipant(2, { energy_level: 5 }),
          generateTestParticipant(3, { energy_level: 90 }),
          generateTestParticipant(4, { energy_level: 10 })
        ],
        expectedConflicts: 4 // Each high-low pair
      },
      {
        name: 'leadership_conflicts',
        participants: [
          generateTestParticipant(1, { leadership_style: 90 }),
          generateTestParticipant(2, { leadership_style: 85 }),
          generateTestParticipant(3, { leadership_style: 80 }),
          generateTestParticipant(4, { leadership_style: 20 })
        ],
        expectedConflicts: 3 // Three leader pairs
      }
    ];
    for (const scenario of conflictScenarios) {
      try {
        const conflicts = await groupBuilderService.detectGroupConflicts(scenario.participants, {
          includeMinorConflicts: true
        });
        const totalConflicts = conflicts.energyConflicts.length +
                             conflicts.socialConflicts.length +
                             conflicts.riskConflicts.length +
                             conflicts.leadershipConflicts.length;
        const accuracy = scenario.expectedConflicts === 0
          ? (totalConflicts === 0 ? 100 : 0)
          : Math.max(0, 100 - Math.abs(totalConflicts - scenario.expectedConflicts) * 25);
        this.results.accuracyTests[`conflict_${scenario.name}`] = {
          expectedConflicts: scenario.expectedConflicts,
          detectedConflicts: totalConflicts,
          accuracy: Math.round(accuracy),
          overallRisk: conflicts.overallRisk,
          success: true
        };
      } catch (error) {
        this.results.accuracyTests[`conflict_${scenario.name}`] = {
          success: false,
          error: error.message
        };
      }
    }
    console.log('✅ Conflict Detection Tests Complete\n');
  }
  // Calculate group balance score
  calculateGroupBalance(groups) {
    if (groups.length === 0) return 0;
    const sizes = groups.map(group => group.participants.length);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const sizeVariance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    // Lower variance = better balance
    return Math.max(0, 100 - Math.sqrt(sizeVariance) * 10);
  }
  // Generate comprehensive summary report
  generateSummaryReport() {
    console.log('📊 Generating Summary Report...');
    // Algorithm performance summary
    const performanceSummary = {};
    Object.keys(this.results.algorithmPerformance).forEach(algorithm => {
      const results = this.results.algorithmPerformance[algorithm];
      const successfulTests = Object.values(results).filter(r => r.success);
      if (successfulTests.length > 0) {
        performanceSummary[algorithm] = {
          avgDuration: Math.round(
            successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length
          ),
          avgCompatibility: Math.round(
            successfulTests.reduce((sum, r) => sum + r.avgCompatibility, 0) / successfulTests.length
          ),
          avgBalance: Math.round(
            successfulTests.reduce((sum, r) => sum + r.balanceScore, 0) / successfulTests.length
          ),
          successRate: Math.round((successfulTests.length / Object.keys(results).length) * 100)
        };
      }
    });
    // Edge case summary
    const edgeCaseSuccessRate = Object.values(this.results.edgeCaseTests)
      .filter(test => test.handledGracefully).length / Object.keys(this.results.edgeCaseTests).length * 100;
    // Stress test summary
    const stressTestSuccessRate = Object.values(this.results.stressTests)
      .filter(test => test.success).length / Object.keys(this.results.stressTests).length * 100;
    this.results.summary = {
      performanceSummary,
      edgeCaseSuccessRate: Math.round(edgeCaseSuccessRate),
      stressTestSuccessRate: Math.round(stressTestSuccessRate),
      overallHealth: Math.round((edgeCaseSuccessRate + stressTestSuccessRate) / 2),
      recommendations: this.generateRecommendations(performanceSummary)
    };
    console.log('✅ Summary Report Generated\n');
  }
  // Generate optimization recommendations
  generateRecommendations(performanceSummary) {
    const recommendations = [];
    // Find best performing algorithm
    let bestAlgorithm = null;
    let bestScore = 0;
    Object.entries(performanceSummary).forEach(([algorithm, stats]) => {
      const score = (stats.avgCompatibility * 0.4) + (stats.avgBalance * 0.3) +
                   (stats.successRate * 0.2) + ((10000 - stats.avgDuration) / 100 * 0.1);
      if (score > bestScore) {
        bestScore = score;
        bestAlgorithm = algorithm;
      }
    });
    if (bestAlgorithm) {
      recommendations.push(`Best overall algorithm: ${bestAlgorithm}`);
    }
    // Performance recommendations
    const slowAlgorithms = Object.entries(performanceSummary)
      .filter(([_, stats]) => stats.avgDuration > 5000)
      .map(([algorithm]) => algorithm);
    if (slowAlgorithms.length > 0) {
      recommendations.push(`Consider optimizing slow algorithms: ${slowAlgorithms.join(', ')}`);
    }
    // Accuracy recommendations
    const lowAccuracyAlgorithms = Object.entries(performanceSummary)
      .filter(([_, stats]) => stats.avgCompatibility < 70)
      .map(([algorithm]) => algorithm);
    if (lowAccuracyAlgorithms.length > 0) {
      recommendations.push(`Improve accuracy for: ${lowAccuracyAlgorithms.join(', ')}`);
    }
    return recommendations;
  }
  // Print detailed report
  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('GROUP OPTIMIZATION ALGORITHM TEST REPORT');
    console.log('='.repeat(80));
    console.log('\n📈 PERFORMANCE SUMMARY:');
    Object.entries(this.results.summary.performanceSummary || {}).forEach(([algorithm, stats]) => {
      console.log(`  ${algorithm.toUpperCase()}:`);
      console.log(`    Average Duration: ${stats.avgDuration}ms`);
      console.log(`    Average Compatibility: ${stats.avgCompatibility}%`);
      console.log(`    Average Balance: ${stats.avgBalance}%`);
      console.log(`    Success Rate: ${stats.successRate}%`);
      console.log('');
    });
    console.log(`\n🛡️  EDGE CASE SUCCESS RATE: ${this.results.summary.edgeCaseSuccessRate}%`);
    console.log(`💪 STRESS TEST SUCCESS RATE: ${this.results.summary.stressTestSuccessRate}%`);
    console.log(`🎯 OVERALL HEALTH SCORE: ${this.results.summary.overallHealth}%`);
    console.log('\n💡 RECOMMENDATIONS:');
    this.results.summary.recommendations?.forEach(rec => {
      console.log(`  • ${rec}`);
    });
    console.log('\n' + '='.repeat(80));
  }
}
// Export for use in other modules
export { testScenarios, generateTestParticipants };
// CLI runner with enhanced testing framework integration
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for comprehensive test mode
  const args = process.argv.slice(2);
  const comprehensive = args.includes('--comprehensive');
  const abTesting = args.includes('--ab-testing');
  const monitoring = args.includes('--monitoring');
  if (comprehensive) {
    // Run comprehensive test suite
    import('./__tests__/algorithm-test-runner.test.js').then(({ AlgorithmTestSuite }) => {
      const testSuite = new AlgorithmTestSuite();
      testSuite.runCompleteTestSuite().then(() => {
        console.log('🎉 Comprehensive testing completed!');
      }).catch(console.error);
    });
  } else if (abTesting) {
    // Run A/B testing framework
    import('./__tests__/ab-testing-framework.test.js').then(({ AlgorithmABTester }) => {
      const abTester = new AlgorithmABTester();
      // Define and run a sample experiment
      abTester.defineExperiment('cli_test', {
        name: 'Algorithm Comparison Test',
        variants: {
          kmeans: { algorithm: 'kmeans', targetGroupSize: 6 },
          hierarchical: { algorithm: 'hierarchical', targetGroupSize: 6 },
          hybrid: { algorithm: 'hybrid', targetGroupSize: 6 }
        },
        successMetrics: ['compatibility', 'processing_time'],
        sampleSize: 30
      });
      console.log('🧪 Running A/B Testing Framework...');
      // Run tests
      const runExperiment = async () => {
        for (let i = 0; i < 30; i++) {
          const participants = generateTestParticipants(24);
          await abTester.runTest('cli_test', participants, `cli_test_${i}`);
          if (i % 10 === 0) {
            console.log(`Progress: ${i + 1}/30 tests completed`);
          }
        }
        const analysis = abTester.analyzeResults('cli_test');
        console.log('\n📊 A/B Test Results:');
        console.log(JSON.stringify(analysis, null, 2));
      };
      runExperiment().catch(console.error);
    });
  } else if (monitoring) {
    // Generate monitoring dashboard data
    console.log('📊 Generating monitoring dashboard data...');
    const generateMonitoringData = async () => {
      const metrics = [];
      for (let i = 0; i < 20; i++) {
        const participants = generateTestParticipants(30);
        const startTime = performance.now();
        const groups = await groupBuilderService.performHybridOptimization(participants);
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        const avgCompatibility = groups.reduce((sum, group) =>
          sum + (group.compatibility?.averageScore || 0), 0
        ) / groups.length;
        metrics.push({
          timestamp: new Date().toISOString(),
          algorithm: 'hybrid',
          processingTimeMs: Math.round(processingTime),
          avgCompatibility: Math.round(avgCompatibility),
          participantCount: participants.length,
          groupCount: groups.length,
          throughput: Math.round((participants.length / processingTime) * 1000)
        });
        console.log(`Generated metric ${i + 1}/20: ${Math.round(processingTime)}ms, ${Math.round(avgCompatibility)}% compatibility`);
      }
      console.log('\n📈 Monitoring Metrics Summary:');
      console.log(`Average Processing Time: ${Math.round(metrics.reduce((sum, m) => sum + m.processingTimeMs, 0) / metrics.length)}ms`);
      console.log(`Average Compatibility: ${Math.round(metrics.reduce((sum, m) => sum + m.avgCompatibility, 0) / metrics.length)}%`);
      console.log(`Average Throughput: ${Math.round(metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length)} participants/sec`);
    };
    generateMonitoringData().catch(console.error);
  } else {
    // Original test runner
    const tester = new GroupOptimizationTester();
    tester.runAllTests().then(() => {
      tester.printReport();
      console.log('\n🔧 Advanced Testing Options:');
      console.log('  --comprehensive  Run complete test suite with unit, integration, performance, and A/B tests');
      console.log('  --ab-testing     Run A/B testing framework demonstration');
      console.log('  --monitoring     Generate sample monitoring dashboard data');
      console.log('\nExample: node src/services/group-optimization-test.js --comprehensive');
    }).catch(console.error);
  }
}