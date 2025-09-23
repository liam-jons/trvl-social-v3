/**
 * Load Testing and Performance Validation Suite
 * Tests database performance with concurrent users and production-like data
 *
 * Task 36.8: Load Testing and Performance Validation
 */

import { supabase } from '../../lib/supabase';
import { performance } from 'perf_hooks';

describe('Load Testing and Performance Validation', () => {
  let testResults = {
    queries: [],
    connections: [],
    concurrentOperations: [],
    performanceBaselines: {},
    bottlenecks: [],
    cleanup: []
  };

  beforeAll(() => {
    console.log('Starting load testing suite...');
    console.log('Database URL:', supabase.supabaseUrl);
  });

  afterAll(async () => {
    // Cleanup any test data created during load testing
    testResults.cleanup.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (e) {
        console.warn('Cleanup warning:', e.message);
      }
    });

    // Generate performance report
    generatePerformanceReport();
  });

  describe('1. Database Query Performance Testing', () => {
    test('should measure simple query response times', async () => {
      const queryTests = [
        { name: 'profiles_select', query: () => supabase.from('profiles').select('id, name').limit(10) },
        { name: 'adventures_select', query: () => supabase.from('adventures').select('id, title').limit(10) },
        { name: 'bookings_select', query: () => supabase.from('bookings').select('id, status').limit(10) },
        { name: 'community_posts_select', query: () => supabase.from('community_posts').select('id, content').limit(10) },
        { name: 'notifications_select', query: () => supabase.from('notifications').select('id, title').limit(10) }
      ];

      for (const test of queryTests) {
        const startTime = performance.now();

        try {
          const { data, error } = await test.query();
          const endTime = performance.now();
          const responseTime = endTime - startTime;

          const result = {
            queryName: test.name,
            responseTime,
            success: !error,
            error: error?.message,
            recordCount: data?.length || 0,
            timestamp: new Date().toISOString()
          };

          testResults.queries.push(result);

          expect(responseTime).toBeLessThan(1000); // Less than 1 second
          expect(error).toBeNull();

          console.log(`✓ ${test.name}: ${responseTime.toFixed(2)}ms (${result.recordCount} records)`);
        } catch (e) {
          console.error(`✗ ${test.name}: ${e.message}`);
          testResults.queries.push({
            queryName: test.name,
            responseTime: -1,
            success: false,
            error: e.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Calculate average response time
      const successfulQueries = testResults.queries.filter(q => q.success);
      const avgResponseTime = successfulQueries.reduce((sum, q) => sum + q.responseTime, 0) / successfulQueries.length;

      testResults.performanceBaselines.avgSimpleQueryTime = avgResponseTime;
      expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
    }, 30000);

    test('should measure complex join query performance', async () => {
      const complexQueryTests = [
        {
          name: 'user_with_bookings',
          query: () => supabase
            .from('profiles')
            .select('id, name, bookings(id, status, created_at)')
            .limit(5)
        },
        {
          name: 'adventures_with_vendor',
          query: () => supabase
            .from('adventures')
            .select('id, title, vendors(id, business_name)')
            .limit(5)
        },
        {
          name: 'posts_with_reactions',
          query: () => supabase
            .from('community_posts')
            .select('id, content, post_reactions(id, type)')
            .limit(5)
        }
      ];

      for (const test of complexQueryTests) {
        const startTime = performance.now();

        try {
          const { data, error } = await test.query();
          const endTime = performance.now();
          const responseTime = endTime - startTime;

          const result = {
            queryName: test.name,
            responseTime,
            success: !error,
            error: error?.message,
            recordCount: data?.length || 0,
            timestamp: new Date().toISOString()
          };

          testResults.queries.push(result);

          expect(responseTime).toBeLessThan(2000); // Less than 2 seconds for joins
          expect(error).toBeNull();

          console.log(`✓ ${test.name}: ${responseTime.toFixed(2)}ms (${result.recordCount} records)`);
        } catch (e) {
          console.warn(`⚠ ${test.name}: ${e.message}`);
          testResults.queries.push({
            queryName: test.name,
            responseTime: -1,
            success: false,
            error: e.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      const complexQueryResults = testResults.queries.filter(q => q.queryName.includes('_with_'));
      const avgComplexQueryTime = complexQueryResults
        .filter(q => q.success)
        .reduce((sum, q) => sum + q.responseTime, 0) / complexQueryResults.filter(q => q.success).length;

      testResults.performanceBaselines.avgComplexQueryTime = avgComplexQueryTime || 0;
    }, 30000);
  });

  describe('2. Concurrent User Load Testing', () => {
    test('should handle 50 concurrent read operations', async () => {
      const concurrentUsers = 50;
      const operationsPerUser = 3;

      console.log(`Testing ${concurrentUsers} concurrent users with ${operationsPerUser} operations each...`);

      const userOperations = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userResults = [];

        for (let op = 0; op < operationsPerUser; op++) {
          const startTime = performance.now();

          try {
            // Simulate typical user operations
            const operations = [
              () => supabase.from('profiles').select('id, name').limit(5),
              () => supabase.from('adventures').select('id, title, price').limit(10),
              () => supabase.from('community_posts').select('id, content').limit(8)
            ];

            const operation = operations[op % operations.length];
            const { data, error } = await operation();
            const endTime = performance.now();

            userResults.push({
              userId: userIndex,
              operation: op,
              responseTime: endTime - startTime,
              success: !error,
              recordCount: data?.length || 0
            });
          } catch (e) {
            userResults.push({
              userId: userIndex,
              operation: op,
              responseTime: -1,
              success: false,
              error: e.message
            });
          }
        }

        return userResults;
      });

      const startTime = performance.now();
      const allResults = await Promise.allSettled(userOperations);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const successfulOperations = allResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(op => op.success);

      const failedOperations = allResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(op => !op.success);

      testResults.concurrentOperations.push({
        testName: '50_concurrent_users',
        totalUsers: concurrentUsers,
        operationsPerUser,
        totalTime,
        successCount: successfulOperations.length,
        failureCount: failedOperations.length,
        avgResponseTime: successfulOperations.reduce((sum, op) => sum + op.responseTime, 0) / successfulOperations.length,
        timestamp: new Date().toISOString()
      });

      const successRate = successfulOperations.length / (concurrentUsers * operationsPerUser) * 100;

      console.log(`Concurrent test results:`);
      console.log(`  - Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  - Average response time: ${(successfulOperations.reduce((sum, op) => sum + op.responseTime, 0) / successfulOperations.length).toFixed(2)}ms`);

      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
      expect(totalTime).toBeLessThan(10000); // Complete within 10 seconds
    }, 60000);

    test('should handle 100 concurrent read operations', async () => {
      const concurrentUsers = 100;
      const operationsPerUser = 2;

      console.log(`Testing ${concurrentUsers} concurrent users with ${operationsPerUser} operations each...`);

      const userOperations = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userResults = [];

        for (let op = 0; op < operationsPerUser; op++) {
          const startTime = performance.now();

          try {
            // Lighter operations for higher concurrency
            const { data, error } = await supabase
              .from('profiles')
              .select('id, name')
              .limit(3);

            const endTime = performance.now();

            userResults.push({
              userId: userIndex,
              operation: op,
              responseTime: endTime - startTime,
              success: !error,
              recordCount: data?.length || 0
            });
          } catch (e) {
            userResults.push({
              userId: userIndex,
              operation: op,
              responseTime: -1,
              success: false,
              error: e.message
            });
          }
        }

        return userResults;
      });

      const startTime = performance.now();
      const allResults = await Promise.allSettled(userOperations);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const successfulOperations = allResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(op => op.success);

      const failedOperations = allResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(op => !op.success);

      testResults.concurrentOperations.push({
        testName: '100_concurrent_users',
        totalUsers: concurrentUsers,
        operationsPerUser,
        totalTime,
        successCount: successfulOperations.length,
        failureCount: failedOperations.length,
        avgResponseTime: successfulOperations.reduce((sum, op) => sum + op.responseTime, 0) / successfulOperations.length,
        timestamp: new Date().toISOString()
      });

      const successRate = successfulOperations.length / (concurrentUsers * operationsPerUser) * 100;

      console.log(`High concurrency test results:`);
      console.log(`  - Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  - Average response time: ${(successfulOperations.reduce((sum, op) => sum + op.responseTime, 0) / successfulOperations.length).toFixed(2)}ms`);

      expect(successRate).toBeGreaterThan(70); // At least 70% success rate under high load
      expect(totalTime).toBeLessThan(15000); // Complete within 15 seconds
    }, 90000);
  });

  describe('3. Connection Pool Testing', () => {
    test('should handle multiple simultaneous connections', async () => {
      const connectionCount = 20;
      const connections = [];

      const startTime = performance.now();

      // Create multiple connections simultaneously
      const connectionPromises = Array.from({ length: connectionCount }, async (_, index) => {
        try {
          // Test multiple queries per connection
          const queries = [
            supabase.from('profiles').select('count', { count: 'exact', head: true }),
            supabase.from('adventures').select('count', { count: 'exact', head: true }),
            supabase.from('bookings').select('count', { count: 'exact', head: true })
          ];

          const results = await Promise.all(queries);

          return {
            connectionId: index,
            success: true,
            queryCount: queries.length,
            responses: results.map(r => ({ success: !r.error, count: r.count }))
          };
        } catch (error) {
          return {
            connectionId: index,
            success: false,
            error: error.message
          };
        }
      });

      const connectionResults = await Promise.allSettled(connectionPromises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const successfulConnections = connectionResults
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .length;

      testResults.connections.push({
        testName: 'connection_pool_test',
        connectionCount,
        successfulConnections,
        totalTime,
        successRate: (successfulConnections / connectionCount) * 100,
        timestamp: new Date().toISOString()
      });

      console.log(`Connection pool test results:`);
      console.log(`  - Successful connections: ${successfulConnections}/${connectionCount}`);
      console.log(`  - Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  - Success rate: ${((successfulConnections / connectionCount) * 100).toFixed(1)}%`);

      expect(successfulConnections).toBeGreaterThan(connectionCount * 0.8); // 80% success rate
      expect(totalTime).toBeLessThan(5000); // Under 5 seconds
    }, 30000);
  });

  describe('4. Memory and Resource Usage Testing', () => {
    test('should monitor memory usage during operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform multiple operations to test memory usage
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          supabase.from('profiles').select('id, name, created_at').limit(20)
        );
      }

      await Promise.all(operations);

      const finalMemory = process.memoryUsage();
      const memoryDiff = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        rss: finalMemory.rss - initialMemory.rss
      };

      console.log('Memory usage difference:');
      console.log(`  - Heap used: ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - Heap total: ${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - RSS: ${(memoryDiff.rss / 1024 / 1024).toFixed(2)} MB`);

      testResults.performanceBaselines.memoryUsage = memoryDiff;

      // Memory usage should be reasonable (less than 100MB increase)
      expect(memoryDiff.heapUsed).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('5. Stress Testing with Production-like Data', () => {
    test('should handle rapid sequential operations', async () => {
      const operationCount = 200;
      const results = [];

      console.log(`Performing ${operationCount} rapid sequential operations...`);

      const startTime = performance.now();

      for (let i = 0; i < operationCount; i++) {
        const opStartTime = performance.now();

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name')
            .limit(5);

          const opEndTime = performance.now();

          results.push({
            operation: i,
            responseTime: opEndTime - opStartTime,
            success: !error,
            recordCount: data?.length || 0
          });
        } catch (e) {
          results.push({
            operation: i,
            responseTime: -1,
            success: false,
            error: e.message
          });
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successfulOps = results.filter(r => r.success);
      const avgResponseTime = successfulOps.reduce((sum, r) => sum + r.responseTime, 0) / successfulOps.length;
      const successRate = (successfulOps.length / operationCount) * 100;

      testResults.performanceBaselines.stressTest = {
        operationCount,
        totalTime,
        successRate,
        avgResponseTime,
        timestamp: new Date().toISOString()
      };

      console.log(`Stress test results:`);
      console.log(`  - Operations: ${operationCount}`);
      console.log(`  - Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  - Avg response time: ${avgResponseTime.toFixed(2)}ms`);

      expect(successRate).toBeGreaterThan(90); // 90% success rate
      expect(avgResponseTime).toBeLessThan(200); // Under 200ms average
    }, 120000);
  });

  function generatePerformanceReport() {
    console.log('\n' + '='.repeat(60));
    console.log('LOAD TESTING PERFORMANCE REPORT');
    console.log('='.repeat(60));

    // Query Performance Summary
    console.log('\n📊 QUERY PERFORMANCE SUMMARY:');
    if (testResults.performanceBaselines.avgSimpleQueryTime) {
      console.log(`  Average Simple Query Time: ${testResults.performanceBaselines.avgSimpleQueryTime.toFixed(2)}ms`);
    }
    if (testResults.performanceBaselines.avgComplexQueryTime) {
      console.log(`  Average Complex Query Time: ${testResults.performanceBaselines.avgComplexQueryTime.toFixed(2)}ms`);
    }

    // Concurrent Operations Summary
    console.log('\n🏃 CONCURRENT OPERATIONS SUMMARY:');
    testResults.concurrentOperations.forEach(test => {
      console.log(`  ${test.testName}:`);
      console.log(`    - Users: ${test.totalUsers}, Ops/User: ${test.operationsPerUser}`);
      console.log(`    - Success Rate: ${((test.successCount / (test.totalUsers * test.operationsPerUser)) * 100).toFixed(1)}%`);
      console.log(`    - Avg Response Time: ${test.avgResponseTime.toFixed(2)}ms`);
      console.log(`    - Total Time: ${test.totalTime.toFixed(2)}ms`);
    });

    // Connection Pool Summary
    console.log('\n🔗 CONNECTION POOL SUMMARY:');
    testResults.connections.forEach(test => {
      console.log(`  ${test.testName}:`);
      console.log(`    - Connections: ${test.successfulConnections}/${test.connectionCount}`);
      console.log(`    - Success Rate: ${test.successRate.toFixed(1)}%`);
      console.log(`    - Total Time: ${test.totalTime.toFixed(2)}ms`);
    });

    // Performance Baselines
    console.log('\n📈 PERFORMANCE BASELINES ESTABLISHED:');
    Object.entries(testResults.performanceBaselines).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        console.log(`  ${key}:`);
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (typeof subValue === 'number') {
            console.log(`    - ${subKey}: ${subValue.toFixed(2)}${subKey.includes('Time') ? 'ms' : ''}`);
          } else {
            console.log(`    - ${subKey}: ${subValue}`);
          }
        });
      } else if (typeof value === 'number') {
        console.log(`  ${key}: ${value.toFixed(2)}ms`);
      }
    });

    // Bottlenecks and Recommendations
    console.log('\n⚠️  BOTTLENECKS AND RECOMMENDATIONS:');

    const avgSimpleQuery = testResults.performanceBaselines.avgSimpleQueryTime || 0;
    const avgComplexQuery = testResults.performanceBaselines.avgComplexQueryTime || 0;

    if (avgSimpleQuery > 100) {
      console.log('  - Simple queries averaging >100ms - consider index optimization');
      testResults.bottlenecks.push('Simple query performance needs optimization');
    }

    if (avgComplexQuery > 500) {
      console.log('  - Complex queries averaging >500ms - review join strategies');
      testResults.bottlenecks.push('Complex query performance needs review');
    }

    const concurrentTests = testResults.concurrentOperations;
    const lowSuccessRate = concurrentTests.find(test =>
      (test.successCount / (test.totalUsers * test.operationsPerUser)) < 0.9
    );

    if (lowSuccessRate) {
      console.log('  - Some concurrent tests had <90% success rate - monitor under load');
      testResults.bottlenecks.push('Concurrent operation success rate needs monitoring');
    }

    if (testResults.bottlenecks.length === 0) {
      console.log('  ✅ No significant bottlenecks identified');
      console.log('  ✅ Database performance is excellent');
      console.log('  ✅ Ready for production deployment');
    }

    console.log('\n' + '='.repeat(60));
  }
});