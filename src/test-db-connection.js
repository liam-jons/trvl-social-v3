/**
 * Database Connection Pool and Integration Test Script
 * Tests connection pooling, rate limiting, and basic database operations
 */

import { supabase } from './lib/supabase.js';
import supabaseRL from './services/supabase-rate-limited.js';
import { performance } from 'perf_hooks';

class DatabaseConnectionTester {
  constructor() {
    this.results = {
      connectionPool: null,
      rateLimit: null,
      basicQueries: [],
      performanceBaseline: null,
      errors: []
    };
  }

  log(message) {
    console.log(`[DB Test] ${new Date().toISOString()}: ${message}`);
  }

  logError(error, context) {
    const errorMsg = `${context}: ${error.message}`;
    this.results.errors.push(errorMsg);
    console.error(`[DB Test ERROR] ${errorMsg}`);
  }

  async testConnectionPoolConfig() {
    this.log('Testing connection pool configuration...');

    try {
      // Test basic connection
      const { data: version, error: versionError } = await supabase
        .from('pg_stat_database')
        .select('datname')
        .limit(1)
        .single();

      if (versionError) {
        // Try alternative connection test
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        if (testError) {
          throw new Error(`Connection failed: ${testError.message}`);
        }
      }

      // Test concurrent connections
      const concurrentTests = Array.from({ length: 10 }, (_, i) =>
        this.testSingleConnection(i)
      );

      const connectionResults = await Promise.allSettled(concurrentTests);
      const successful = connectionResults.filter(r => r.status === 'fulfilled').length;
      const failed = connectionResults.filter(r => r.status === 'rejected').length;

      this.results.connectionPool = {
        basicConnection: 'success',
        concurrentConnections: {
          attempted: 10,
          successful,
          failed,
          successRate: (successful / 10) * 100
        },
        timestamp: new Date().toISOString()
      };

      this.log(`Connection pool test completed: ${successful}/10 connections successful`);
      return true;

    } catch (error) {
      this.logError(error, 'Connection Pool Test');
      this.results.connectionPool = {
        basicConnection: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  }

  async testSingleConnection(index) {
    const start = performance.now();

    try {
      // Test a simple query that should work regardless of table structure
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error && !error.message.includes('relation "profiles" does not exist')) {
        throw error;
      }

      const duration = performance.now() - start;
      return { index, duration, status: 'success' };
    } catch (error) {
      const duration = performance.now() - start;
      return { index, duration, status: 'failed', error: error.message };
    }
  }

  async testRateLimitConfiguration() {
    this.log('Testing rate limit configuration...');

    try {
      // Test rate limiter config
      const rateLimitInfo = supabaseRL.getRateLimitInfo('read');

      // Test rapid requests to trigger rate limiting
      const rapidRequests = [];
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(this.makeRateLimitedRequest(i));
      }

      const rateLimitResults = await Promise.allSettled(rapidRequests);
      const successful = rateLimitResults.filter(r => r.status === 'fulfilled').length;

      this.results.rateLimit = {
        configuration: rateLimitInfo,
        rapidRequestTest: {
          attempted: 5,
          successful,
          rateLimitTriggered: successful < 5,
        },
        timestamp: new Date().toISOString()
      };

      this.log(`Rate limit test completed: ${successful}/5 requests successful`);
      return true;

    } catch (error) {
      this.logError(error, 'Rate Limit Test');
      this.results.rateLimit = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  }

  async makeRateLimitedRequest(index) {
    try {
      // Use rate-limited client
      const result = await supabaseRL.executeWithRateLimit(
        () => supabase.from('profiles').select('count').limit(1),
        'read'
      );
      return { index, status: 'success' };
    } catch (error) {
      return { index, status: 'failed', error: error.message };
    }
  }

  async testBasicQueries() {
    this.log('Testing basic database queries...');

    const testQueries = [
      {
        name: 'profiles_access',
        query: () => supabase.from('profiles').select('count').limit(1)
      },
      {
        name: 'auth_users_access',
        query: () => supabase.from('auth.users').select('count').limit(1)
      },
      {
        name: 'adventures_access',
        query: () => supabase.from('adventures').select('count').limit(1)
      },
      {
        name: 'groups_access',
        query: () => supabase.from('groups').select('count').limit(1)
      },
      {
        name: 'bookings_access',
        query: () => supabase.from('bookings').select('count').limit(1)
      }
    ];

    for (const test of testQueries) {
      const start = performance.now();
      try {
        const { data, error } = await test.query();
        const duration = performance.now() - start;

        this.results.basicQueries.push({
          name: test.name,
          status: error ? 'failed' : 'success',
          duration: Math.round(duration * 100) / 100,
          error: error?.message,
          timestamp: new Date().toISOString()
        });

        this.log(`Query ${test.name}: ${error ? 'FAILED' : 'SUCCESS'} (${Math.round(duration)}ms)`);

      } catch (error) {
        this.logError(error, `Query ${test.name}`);
        this.results.basicQueries.push({
          name: test.name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async testPerformanceBaseline() {
    this.log('Establishing performance baseline...');

    try {
      const tests = [];
      const iterations = 10;

      // Simple read test
      for (let i = 0; i < iterations; i++) {
        tests.push(this.measureQuery(
          'simple_read',
          () => supabase.from('profiles').select('id').limit(10)
        ));
      }

      // Complex query test (if possible)
      for (let i = 0; i < 5; i++) {
        tests.push(this.measureQuery(
          'complex_read',
          () => supabase.from('profiles')
            .select('id, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
        ));
      }

      const results = await Promise.allSettled(tests);
      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(r => r.status === 'success');

      if (successfulResults.length > 0) {
        const simpleReads = successfulResults.filter(r => r.type === 'simple_read');
        const complexReads = successfulResults.filter(r => r.type === 'complex_read');

        this.results.performanceBaseline = {
          simpleRead: {
            count: simpleReads.length,
            avgDuration: this.calculateAverage(simpleReads.map(r => r.duration)),
            minDuration: Math.min(...simpleReads.map(r => r.duration)),
            maxDuration: Math.max(...simpleReads.map(r => r.duration))
          },
          complexRead: {
            count: complexReads.length,
            avgDuration: this.calculateAverage(complexReads.map(r => r.duration)),
            minDuration: complexReads.length > 0 ? Math.min(...complexReads.map(r => r.duration)) : null,
            maxDuration: complexReads.length > 0 ? Math.max(...complexReads.map(r => r.duration)) : null
          },
          timestamp: new Date().toISOString()
        };

        this.log(`Performance baseline established: Simple reads avg ${Math.round(this.results.performanceBaseline.simpleRead.avgDuration)}ms`);
      }

    } catch (error) {
      this.logError(error, 'Performance Baseline Test');
    }
  }

  async measureQuery(type, queryFn) {
    const start = performance.now();
    try {
      const { data, error } = await queryFn();
      const duration = performance.now() - start;

      return {
        type,
        status: error ? 'failed' : 'success',
        duration: Math.round(duration * 100) / 100,
        error: error?.message
      };
    } catch (error) {
      const duration = performance.now() - start;
      return {
        type,
        status: 'error',
        duration: Math.round(duration * 100) / 100,
        error: error.message
      };
    }
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
  }

  async runAllTests() {
    this.log('Starting comprehensive database connection tests...');
    const startTime = performance.now();

    // Run tests sequentially to avoid interference
    await this.testConnectionPoolConfig();
    await this.testRateLimitConfiguration();
    await this.testBasicQueries();
    await this.testPerformanceBaseline();

    const totalDuration = performance.now() - startTime;

    // Generate summary
    const summary = {
      testDuration: Math.round(totalDuration),
      connectionPool: this.results.connectionPool?.basicConnection === 'success',
      rateLimit: this.results.rateLimit?.configuration != null,
      queriesSuccessful: this.results.basicQueries.filter(q => q.status === 'success').length,
      totalQueries: this.results.basicQueries.length,
      errorCount: this.results.errors.length,
      timestamp: new Date().toISOString()
    };

    this.log(`Tests completed in ${Math.round(totalDuration)}ms`);
    this.log(`Summary: ${summary.queriesSuccessful}/${summary.totalQueries} queries successful, ${summary.errorCount} errors`);

    return {
      summary,
      detailed: this.results
    };
  }

  async testEnvironmentVariables() {
    this.log('Checking environment variables...');

    const envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    };

    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      this.logError(new Error(`Missing environment variables: ${missingVars.join(', ')}`), 'Environment Check');
      return false;
    }

    this.log('Environment variables configured correctly');
    return true;
  }
}

// Export for use in other contexts
export { DatabaseConnectionTester };

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DatabaseConnectionTester();

  tester.runAllTests()
    .then(results => {
      console.log('\n=== DATABASE CONNECTION TEST RESULTS ===');
      console.log(JSON.stringify(results, null, 2));

      if (results.summary.errorCount > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}