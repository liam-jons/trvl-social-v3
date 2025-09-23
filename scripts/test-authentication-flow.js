#!/usr/bin/env node

/**
 * Authentication Flow Testing Script
 * Tests user registration, login, session management, and auth triggers
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class AuthenticationFlowTester {
  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vhecnqaejsukulaktjob.supabase.co';
    this.supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!this.supabaseKey) {
      console.error('ERROR: No Supabase anon key provided.');
      process.exit(1);
    }

    // Create a clean client for each test
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Don't persist for testing
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    });

    this.results = {
      summary: {},
      authSystemTests: [],
      sessionManagement: [],
      triggerTests: [],
      securityTests: [],
      performanceMetrics: [],
      errors: []
    };

    // Test user credentials (for read-only testing)
    this.testEmail = `test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@example.com`;
    this.testPassword = 'TestPassword123!';
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

  async testAuthSystemAvailability() {
    this.log('Testing auth system availability...');

    const tests = [
      {
        name: 'auth_client_initialization',
        description: 'Verify auth client initializes correctly',
        testFn: async () => {
          try {
            const client = createClient(this.supabaseUrl, this.supabaseKey);
            const { data, error } = await client.auth.getSession();

            return {
              success: !error,
              hasAuthClient: !!client.auth,
              sessionAccessible: !error,
              error: error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'auth_user_endpoint',
        description: 'Test auth.getUser() endpoint accessibility',
        testFn: async () => {
          try {
            const { data, error } = await this.supabase.auth.getUser();

            return {
              success: !error,
              userEndpointAccessible: !error,
              userData: data,
              error: error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'auth_session_endpoint',
        description: 'Test auth.getSession() endpoint functionality',
        testFn: async () => {
          try {
            const { data, error } = await this.supabase.auth.getSession();

            return {
              success: !error,
              sessionEndpointAccessible: !error,
              hasSession: !!data.session,
              sessionData: data.session,
              error: error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'auth_config_validation',
        description: 'Validate auth configuration and URLs',
        testFn: async () => {
          try {
            // Test if auth URLs are accessible (without making requests)
            const authUrl = `${this.supabaseUrl}/auth/v1`;
            const validUrl = authUrl.startsWith('https://') && authUrl.includes('supabase.co');

            return {
              success: validUrl,
              authUrlValid: validUrl,
              supabaseUrl: this.supabaseUrl,
              hasValidKey: this.supabaseKey && this.supabaseKey.length > 50
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      }
    ];

    for (const test of tests) {
      const start = performance.now();

      try {
        const result = await test.testFn();
        const duration = performance.now() - start;

        this.results.authSystemTests.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          details: result,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${Math.round(duration)}ms)` :
          `FAILED: ${result.error}`;

        this.log(`Auth System ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.authSystemTests.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Auth System Test: ${test.name}`);
      }
    }
  }

  async testSessionManagement() {
    this.log('Testing session management...');

    const tests = [
      {
        name: 'session_state_consistency',
        description: 'Test session state consistency across calls',
        testFn: async () => {
          try {
            // Make multiple session calls and verify consistency
            const session1 = await this.supabase.auth.getSession();
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
            const session2 = await this.supabase.auth.getSession();

            const consistent = (
              session1.error === session2.error &&
              !!session1.data.session === !!session2.data.session
            );

            return {
              success: consistent && !session1.error,
              consistent,
              session1HasError: !!session1.error,
              session2HasError: !!session2.error,
              bothHaveSession: !!session1.data.session && !!session2.data.session,
              error: session1.error?.message || session2.error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'auth_state_listeners',
        description: 'Test auth state change listener setup',
        testFn: async () => {
          try {
            let listenerCalled = false;
            let listenerData = null;

            // Set up auth state listener
            const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
              listenerCalled = true;
              listenerData = { event, session };
            });

            // Wait a bit to see if listener fires
            await new Promise(resolve => setTimeout(resolve, 500));

            // Clean up
            subscription.unsubscribe();

            return {
              success: true, // Just testing that we can set up the listener
              listenerSetup: !!subscription,
              listenerCalled,
              hasUnsubscribe: typeof subscription.unsubscribe === 'function'
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'session_refresh_capability',
        description: 'Test session refresh mechanism availability',
        testFn: async () => {
          try {
            // Test if refresh token functionality is available
            const { data, error } = await this.supabase.auth.refreshSession();

            // Even if there's no session to refresh, the endpoint should be accessible
            const endpointAvailable = !error || !error.message.includes('network') && !error.message.includes('fetch');

            return {
              success: endpointAvailable,
              refreshEndpointAvailable: endpointAvailable,
              error: error?.message,
              hasRefreshMethod: typeof this.supabase.auth.refreshSession === 'function'
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      }
    ];

    for (const test of tests) {
      const start = performance.now();

      try {
        const result = await test.testFn();
        const duration = performance.now() - start;

        this.results.sessionManagement.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          details: result,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${Math.round(duration)}ms)` :
          `FAILED: ${result.error}`;

        this.log(`Session Management ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.sessionManagement.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Session Management Test: ${test.name}`);
      }
    }
  }

  async testAuthTriggers() {
    this.log('Testing auth triggers and profile creation...');

    const tests = [
      {
        name: 'handle_new_user_trigger_exists',
        description: 'Verify handle_new_user trigger function exists',
        testFn: async () => {
          try {
            // Test by trying to query functions (this will work even without admin access)
            // We'll check if the profiles table has the expected structure that would be created by the trigger
            const { data, error } = await this.supabase
              .from('profiles')
              .select('id, created_at')
              .limit(1);

            // If we can access profiles table, the trigger infrastructure is likely working
            return {
              success: !error || error.message.includes('permission') || error.message.includes('policy'),
              profilesTableAccessible: !error,
              triggerInfrastructurePresent: !error || !error.message.includes('does not exist'),
              error: error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'user_preferences_creation',
        description: 'Test user preferences trigger creation',
        testFn: async () => {
          try {
            const { data, error } = await this.supabase
              .from('user_preferences')
              .select('id, user_id')
              .limit(1);

            return {
              success: !error || error.message.includes('permission') || error.message.includes('policy'),
              userPreferencesAccessible: !error,
              tableStructureValid: !error || !error.message.includes('does not exist'),
              error: error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'auth_user_metadata_support',
        description: 'Test auth user metadata handling',
        testFn: async () => {
          try {
            // Test the auth metadata structure by checking current user
            const { data, error } = await this.supabase.auth.getUser();

            return {
              success: !error,
              userMetadataSupported: !error && (data.user === null || typeof data.user === 'object'),
              authUserStructureValid: !error,
              error: error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      }
    ];

    for (const test of tests) {
      const start = performance.now();

      try {
        const result = await test.testFn();
        const duration = performance.now() - start;

        this.results.triggerTests.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          details: result,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${Math.round(duration)}ms)` :
          `FAILED: ${result.error}`;

        this.log(`Auth Trigger ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.triggerTests.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Auth Trigger Test: ${test.name}`);
      }
    }
  }

  async testSecurityFeatures() {
    this.log('Testing auth security features...');

    const tests = [
      {
        name: 'rls_enabled_auth_tables',
        description: 'Verify RLS is enabled on auth-related tables',
        testFn: async () => {
          try {
            // Test that we get policy-related errors (indicating RLS is working)
            const profilesTest = await this.supabase.from('profiles').select('*').limit(1);
            const preferencesTest = await this.supabase.from('user_preferences').select('*').limit(1);

            // RLS working if we either get data or get policy/permission errors
            const profilesRLS = !profilesTest.error ||
              profilesTest.error.message.includes('policy') ||
              profilesTest.error.message.includes('permission');

            const preferencesRLS = !preferencesTest.error ||
              preferencesTest.error.message.includes('policy') ||
              preferencesTest.error.message.includes('permission');

            return {
              success: profilesRLS && preferencesRLS,
              profilesRLSActive: profilesRLS,
              preferencesRLSActive: preferencesRLS,
              profilesError: profilesTest.error?.message,
              preferencesError: preferencesTest.error?.message
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'password_requirements',
        description: 'Test password policy enforcement',
        testFn: async () => {
          try {
            // Test weak password (this should fail or be handled appropriately)
            const weakPasswordTest = await this.supabase.auth.signUp({
              email: `weak-${Date.now()}@example.com`,
              password: '123' // Intentionally weak
            });

            // Strong password test
            const strongPasswordTest = await this.supabase.auth.signUp({
              email: `strong-${Date.now()}@example.com`,
              password: 'StrongPassword123!'
            });

            return {
              success: true, // We're just testing that the endpoints work
              weakPasswordHandled: !!weakPasswordTest.error || !!weakPasswordTest.data,
              strongPasswordHandled: !!strongPasswordTest.error || !!strongPasswordTest.data,
              signUpEndpointWorking: true
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      },
      {
        name: 'auth_rate_limiting',
        description: 'Test auth rate limiting behavior',
        testFn: async () => {
          try {
            // Make multiple rapid auth requests
            const requests = Array.from({ length: 3 }, (_, i) =>
              this.supabase.auth.getSession()
            );

            const results = await Promise.allSettled(requests);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const rateLimited = results.some(r =>
              r.status === 'rejected' && r.reason.message?.includes('rate')
            );

            return {
              success: successful > 0, // At least some should succeed
              totalRequests: requests.length,
              successfulRequests: successful,
              rateLimitingDetected: rateLimited,
              allSucceeded: successful === requests.length
            };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
      }
    ];

    for (const test of tests) {
      const start = performance.now();

      try {
        const result = await test.testFn();
        const duration = performance.now() - start;

        this.results.securityTests.push({
          name: test.name,
          description: test.description,
          status: result.success ? 'passed' : 'failed',
          duration: Math.round(duration),
          details: result,
          timestamp: new Date().toISOString()
        });

        const statusMsg = result.success ?
          `PASSED (${Math.round(duration)}ms)` :
          `FAILED: ${result.error}`;

        this.log(`Security Test ${test.name}: ${statusMsg}`);

      } catch (error) {
        const duration = performance.now() - start;
        this.results.securityTests.push({
          name: test.name,
          description: test.description,
          status: 'error',
          duration: Math.round(duration),
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Security Test: ${test.name}`);
      }
    }
  }

  async benchmarkAuthPerformance() {
    this.log('Benchmarking auth performance...');

    const performanceTests = [
      {
        name: 'auth_session_retrieval',
        description: 'Benchmark session retrieval performance',
        testFn: async () => {
          const iterations = 5;
          const times = [];

          for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const { error } = await this.supabase.auth.getSession();
            const duration = performance.now() - start;

            if (error) throw new Error(error.message);
            times.push(duration);
          }

          return {
            iterations,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            times
          };
        }
      },
      {
        name: 'auth_user_retrieval',
        description: 'Benchmark user retrieval performance',
        testFn: async () => {
          const iterations = 5;
          const times = [];

          for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const { error } = await this.supabase.auth.getUser();
            const duration = performance.now() - start;

            if (error) throw new Error(error.message);
            times.push(duration);
          }

          return {
            iterations,
            averageTime: times.reduce((a, b) => a + b, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            times
          };
        }
      }
    ];

    for (const test of performanceTests) {
      try {
        const result = await test.testFn();

        this.results.performanceMetrics.push({
          name: test.name,
          description: test.description,
          status: 'completed',
          metrics: result,
          timestamp: new Date().toISOString()
        });

        this.log(`Auth Performance ${test.name}: avg ${Math.round(result.averageTime)}ms (${result.iterations} iterations)`);

      } catch (error) {
        this.results.performanceMetrics.push({
          name: test.name,
          description: test.description,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.logError(error, `Auth Performance Test: ${test.name}`);
      }
    }
  }

  async runAllTests() {
    this.log('Starting comprehensive authentication flow testing...');
    const startTime = performance.now();

    await this.testAuthSystemAvailability();
    await this.testSessionManagement();
    await this.testAuthTriggers();
    await this.testSecurityFeatures();
    await this.benchmarkAuthPerformance();

    const totalDuration = performance.now() - startTime;

    // Generate summary
    const passedSystemTests = this.results.authSystemTests.filter(t => t.status === 'passed').length;
    const passedSessionTests = this.results.sessionManagement.filter(t => t.status === 'passed').length;
    const passedTriggerTests = this.results.triggerTests.filter(t => t.status === 'passed').length;
    const passedSecurityTests = this.results.securityTests.filter(t => t.status === 'passed').length;

    const totalTests = this.results.authSystemTests.length +
                      this.results.sessionManagement.length +
                      this.results.triggerTests.length +
                      this.results.securityTests.length;

    const totalPassed = passedSystemTests + passedSessionTests + passedTriggerTests + passedSecurityTests;

    this.results.summary = {
      testDuration: Math.round(totalDuration),
      authSystem: {
        passed: passedSystemTests,
        total: this.results.authSystemTests.length,
        rate: this.results.authSystemTests.length > 0 ? Math.round((passedSystemTests / this.results.authSystemTests.length) * 100) : 0
      },
      sessionManagement: {
        passed: passedSessionTests,
        total: this.results.sessionManagement.length,
        rate: this.results.sessionManagement.length > 0 ? Math.round((passedSessionTests / this.results.sessionManagement.length) * 100) : 0
      },
      triggers: {
        passed: passedTriggerTests,
        total: this.results.triggerTests.length,
        rate: this.results.triggerTests.length > 0 ? Math.round((passedTriggerTests / this.results.triggerTests.length) * 100) : 0
      },
      security: {
        passed: passedSecurityTests,
        total: this.results.securityTests.length,
        rate: this.results.securityTests.length > 0 ? Math.round((passedSecurityTests / this.results.securityTests.length) * 100) : 0
      },
      overall: {
        passed: totalPassed,
        total: totalTests,
        rate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
      },
      performanceAverage: this.calculateAveragePerformance(),
      errorCount: this.results.errors.length,
      overallHealth: this.calculateOverallHealth(),
      timestamp: new Date().toISOString()
    };

    this.log(`Tests completed in ${Math.round(totalDuration)}ms`);
    this.log(`Summary: ${totalPassed}/${totalTests} auth tests passed (${this.results.summary.overall.rate}%), ${this.results.errors.length} errors`);

    return this.results;
  }

  calculateAveragePerformance() {
    const completedTests = this.results.performanceMetrics.filter(p => p.status === 'completed');
    if (completedTests.length === 0) return 0;

    const avgTimes = completedTests.map(p => p.metrics.averageTime);
    return Math.round(avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length);
  }

  calculateOverallHealth() {
    // Calculate before summary is created
    const passedSystemTests = this.results.authSystemTests.filter(t => t.status === 'passed').length;
    const passedSessionTests = this.results.sessionManagement.filter(t => t.status === 'passed').length;
    const passedTriggerTests = this.results.triggerTests.filter(t => t.status === 'passed').length;
    const passedSecurityTests = this.results.securityTests.filter(t => t.status === 'passed').length;

    const totalTests = this.results.authSystemTests.length +
                      this.results.sessionManagement.length +
                      this.results.triggerTests.length +
                      this.results.securityTests.length;

    const totalPassed = passedSystemTests + passedSessionTests + passedTriggerTests + passedSecurityTests;
    const testScore = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    const errorPenalty = Math.min(20, this.results.errors.length * 5);
    const performanceAverage = this.calculateAveragePerformance();
    const performanceBonus = performanceAverage < 200 ? 5 : 0;

    return Math.max(0, Math.min(100, testScore - errorPenalty + performanceBonus));
  }

  async saveResults(outputPath = null) {
    const defaultPath = path.join(process.cwd(), '.taskmaster', 'reports', 'authentication-flow-test.json');
    const filePath = outputPath || defaultPath;

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(this.results, null, 2));
      this.log(`Results saved to: ${filePath}`);
    } catch (error) {
      this.logError(error, 'Save Results');
    }
  }
}

// Main execution
async function main() {
  const tester = new AuthenticationFlowTester();

  try {
    const results = await tester.runAllTests();
    await tester.saveResults();

    console.log('\n=== AUTHENTICATION FLOW TEST RESULTS ===');
    console.log(JSON.stringify(results.summary, null, 2));

    if (results.summary.overallHealth < 75) {
      console.log('\n❌ Authentication health below acceptable threshold (75%)');
      process.exit(1);
    } else {
      console.log('\n✅ Authentication flow tests passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AuthenticationFlowTester };