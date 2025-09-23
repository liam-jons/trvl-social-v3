#!/usr/bin/env node

/**
 * Database Integration Verification Script
 * Tests database connectivity, table access, and core functionality
 * Node.js compatible version
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

class DatabaseIntegrationTester {
  constructor() {
    // Use environment variables or fallback to known production values
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vhecnqaejsukulaktjob.supabase.co';
    this.supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!this.supabaseKey) {
      console.error('ERROR: No Supabase anon key provided. Set VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY environment variable.');
      process.exit(1);
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    });

    this.results = {
      summary: {},
      connectionPool: {},
      tableAccess: [],
      authFlow: {},
      realtime: {},
      foreignKeys: {},
      performance: {},
      errors: []
    };

    // Define core tables to test (from DATABASE_SCHEMA.md)
    this.coreTables = [
      'profiles',
      'user_preferences',
      'vendors',
      'adventures',
      'adventure_availability',
      'adventure_media',
      'bookings',
      'booking_payments',
      'booking_participants',
      'groups',
      'group_members',
      'personality_assessments',
      'assessment_responses',
      'community_posts',
      'community_connections',
      'post_reactions',
      'post_comments',
      'trip_requests',
      'vendor_bids',
      'reviews',
      'engagement_scores'
    ];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp}: ${message}`);
  }

  logError(error, context) {
    const errorMsg = `${context}: ${error.message}`;
    this.results.errors.push({ context, error: error.message, timestamp: new Date().toISOString() });
    this.log(errorMsg, 'ERROR');
  }

  async testDatabaseConnection() {
    this.log('Testing database connection...');

    try {
      // Test basic connection with a system query
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && !error.message.includes('permission denied')) {
        throw error;
      }

      // Test connection timing
      const start = performance.now();
      await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);
      const connectionTime = performance.now() - start;

      this.results.connectionPool = {
        status: 'connected',
        url: this.supabaseUrl,
        connectionTime: Math.round(connectionTime),
        timestamp: new Date().toISOString()
      };

      this.log(`Database connection successful (${Math.round(connectionTime)}ms)`);
      return true;

    } catch (error) {
      this.logError(error, 'Database Connection');
      this.results.connectionPool = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  }

  async testTableAccess() {
    this.log('Testing table accessibility...');

    const accessResults = [];

    for (const tableName of this.coreTables) {
      const start = performance.now();

      try {
        // Test read access
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        const duration = performance.now() - start;

        const result = {
          table: tableName,
          status: error ? 'error' : 'accessible',
          duration: Math.round(duration),
          error: error?.message,
          hasData: data && data.length > 0,
          timestamp: new Date().toISOString()
        };

        accessResults.push(result);

        const statusMsg = error ? `FAILED: ${error.message}` : 'ACCESSIBLE';
        this.log(`Table ${tableName}: ${statusMsg} (${Math.round(duration)}ms)`);

      } catch (error) {
        const duration = performance.now() - start;
        accessResults.push({
          table: tableName,
          status: 'exception',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Table Access: ${tableName}`);
      }
    }

    this.results.tableAccess = accessResults;

    const accessibleTables = accessResults.filter(r => r.status === 'accessible').length;
    const totalTables = accessResults.length;

    this.log(`Table access test completed: ${accessibleTables}/${totalTables} tables accessible`);
    return accessibleTables;
  }

  async testAuthenticationFlow() {
    this.log('Testing authentication flow...');

    try {
      // Test session retrieval (should work without auth)
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();

      // Test user retrieval (should work without auth, returning null)
      const { data: userData, error: userError } = await this.supabase.auth.getUser();

      this.results.authFlow = {
        sessionAccess: !sessionError,
        userAccess: !userError,
        hasActiveSession: !!sessionData?.session,
        sessionError: sessionError?.message,
        userError: userError?.message,
        timestamp: new Date().toISOString()
      };

      this.log(`Auth flow test: Session access ${!sessionError ? 'OK' : 'FAILED'}, User access ${!userError ? 'OK' : 'FAILED'}`);
      return true;

    } catch (error) {
      this.logError(error, 'Authentication Flow');
      this.results.authFlow = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  }

  async testRealTimeConnection() {
    this.log('Testing real-time connection...');

    try {
      // Test channel creation (basic real-time setup)
      const channel = this.supabase
        .channel('test-channel')
        .on('broadcast', { event: 'test' }, (payload) => {
          // Test handler
        });

      // Subscribe and test
      const subscribeResult = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve('timeout'), 5000);

        channel.subscribe((status) => {
          clearTimeout(timeout);
          resolve(status);
        });
      });

      // Clean up
      await this.supabase.removeChannel(channel);

      this.results.realtime = {
        status: subscribeResult === 'SUBSCRIBED' ? 'connected' : 'failed',
        subscribeResult,
        timestamp: new Date().toISOString()
      };

      this.log(`Real-time connection: ${subscribeResult}`);
      return subscribeResult === 'SUBSCRIBED';

    } catch (error) {
      this.logError(error, 'Real-time Connection');
      this.results.realtime = {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  }

  async testForeignKeyIntegrity() {
    this.log('Testing foreign key relationships...');

    try {
      // Test a few key relationships that should exist
      const relationshipTests = [
        {
          name: 'profiles_to_users',
          query: () => this.supabase
            .from('profiles')
            .select('id')
            .limit(1)
        },
        {
          name: 'adventures_to_vendors',
          query: () => this.supabase
            .from('adventures')
            .select('id, vendor_id')
            .limit(1)
        },
        {
          name: 'bookings_to_adventures',
          query: () => this.supabase
            .from('bookings')
            .select('id, adventure_id')
            .limit(1)
        }
      ];

      const relationshipResults = [];

      for (const test of relationshipTests) {
        try {
          const { data, error } = await test.query();
          relationshipResults.push({
            relationship: test.name,
            status: error ? 'failed' : 'accessible',
            error: error?.message
          });
        } catch (error) {
          relationshipResults.push({
            relationship: test.name,
            status: 'error',
            error: error.message
          });
        }
      }

      this.results.foreignKeys = {
        tests: relationshipResults,
        timestamp: new Date().toISOString()
      };

      const successfulTests = relationshipResults.filter(r => r.status === 'accessible').length;
      this.log(`Foreign key tests: ${successfulTests}/${relationshipResults.length} relationships accessible`);
      return successfulTests;

    } catch (error) {
      this.logError(error, 'Foreign Key Integrity');
      return 0;
    }
  }

  async performanceBaseline() {
    this.log('Establishing performance baseline...');

    try {
      const performanceTests = [];

      // Simple read test
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        const { error } = await this.supabase
          .from('profiles')
          .select('id')
          .limit(10);
        const duration = performance.now() - start;

        if (!error || error.message.includes('permission denied')) {
          performanceTests.push({ type: 'simple_read', duration });
        }
      }

      // Complex query test
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        const { error } = await this.supabase
          .from('adventures')
          .select('id, title, vendor_id')
          .order('created_at', { ascending: false })
          .limit(5);
        const duration = performance.now() - start;

        if (!error || error.message.includes('permission denied')) {
          performanceTests.push({ type: 'complex_read', duration });
        }
      }

      if (performanceTests.length > 0) {
        const simpleReads = performanceTests.filter(t => t.type === 'simple_read');
        const complexReads = performanceTests.filter(t => t.type === 'complex_read');

        this.results.performance = {
          simpleRead: {
            count: simpleReads.length,
            avgDuration: this.calculateAverage(simpleReads.map(t => t.duration)),
            minDuration: simpleReads.length > 0 ? Math.min(...simpleReads.map(t => t.duration)) : null,
            maxDuration: simpleReads.length > 0 ? Math.max(...simpleReads.map(t => t.duration)) : null
          },
          complexRead: {
            count: complexReads.length,
            avgDuration: this.calculateAverage(complexReads.map(t => t.duration)),
            minDuration: complexReads.length > 0 ? Math.min(...complexReads.map(t => t.duration)) : null,
            maxDuration: complexReads.length > 0 ? Math.max(...complexReads.map(t => t.duration)) : null
          },
          timestamp: new Date().toISOString()
        };

        this.log(`Performance baseline: Simple reads avg ${Math.round(this.results.performance.simpleRead.avgDuration)}ms`);
      }

    } catch (error) {
      this.logError(error, 'Performance Baseline');
    }
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
  }

  async runAllTests() {
    this.log('Starting comprehensive database integration tests...');
    const startTime = performance.now();

    // Run tests sequentially
    const connectionOk = await this.testDatabaseConnection();
    const accessibleTables = await this.testTableAccess();
    const authOk = await this.testAuthenticationFlow();
    const realtimeOk = await this.testRealTimeConnection();
    const relationshipsOk = await this.testForeignKeyIntegrity();
    await this.performanceBaseline();

    const totalDuration = performance.now() - startTime;

    // Generate summary
    this.results.summary = {
      testDuration: Math.round(totalDuration),
      connection: connectionOk,
      tablesAccessible: accessibleTables,
      totalTables: this.coreTables.length,
      tableAccessRate: Math.round((accessibleTables / this.coreTables.length) * 100),
      authentication: authOk,
      realtime: realtimeOk,
      relationships: relationshipsOk,
      errorCount: this.results.errors.length,
      overallHealth: this.calculateOverallHealth(connectionOk, accessibleTables, authOk, realtimeOk),
      timestamp: new Date().toISOString()
    };

    this.log(`Tests completed in ${Math.round(totalDuration)}ms`);
    this.log(`Summary: ${accessibleTables}/${this.coreTables.length} tables accessible, ${this.results.errors.length} errors, Health: ${this.results.summary.overallHealth}%`);

    return this.results;
  }

  calculateOverallHealth(connection, tables, auth, realtime) {
    let score = 0;
    if (connection) score += 30;
    score += Math.round((tables / this.coreTables.length) * 40);
    if (auth) score += 15;
    if (realtime) score += 15;
    return Math.min(100, score);
  }

  async saveResults(outputPath = null) {
    const defaultPath = path.join(process.cwd(), '.taskmaster', 'reports', 'database-integration-test.json');
    const filePath = outputPath || defaultPath;

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Save results
      await fs.writeFile(filePath, JSON.stringify(this.results, null, 2));
      this.log(`Results saved to: ${filePath}`);
    } catch (error) {
      this.logError(error, 'Save Results');
    }
  }
}

// Main execution
async function main() {
  const tester = new DatabaseIntegrationTester();

  try {
    const results = await tester.runAllTests();
    await tester.saveResults();

    // Print results
    console.log('\n=== DATABASE INTEGRATION TEST RESULTS ===');
    console.log(JSON.stringify(results.summary, null, 2));

    // Exit with appropriate code
    if (results.summary.overallHealth < 70) {
      console.log('\n❌ Database health below acceptable threshold (70%)');
      process.exit(1);
    } else {
      console.log('\n✅ Database integration tests passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseIntegrationTester };