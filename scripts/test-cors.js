#!/usr/bin/env node

/**
 * CORS Testing Script
 * Tests CORS configuration across all API endpoints and environments
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  // Development environment
  development: {
    baseUrl: 'http://localhost:5173',
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    blockedOrigins: [
      'https://evil.com',
      'http://malicious-site.com',
      'https://unauthorized.domain.com'
    ]
  },
  // Production environment
  production: {
    baseUrl: 'https://trvlsocial.com',
    allowedOrigins: [
      'https://trvlsocial.com',
      'https://www.trvlsocial.com'
    ],
    blockedOrigins: [
      'https://evil.com',
      'http://localhost:3000',
      'https://unauthorized.domain.com',
      'http://malicious-site.com'
    ]
  }
};

// API endpoints to test
const ENDPOINTS_TO_TEST = [
  // Stripe payment endpoints (critical security)
  '/api/stripe/confirm-payment',
  '/api/stripe/payment-methods',
  '/api/stripe/connect/payouts',
  '/api/stripe/connect/transfers',
  '/api/stripe/connect/accounts',
  '/api/stripe/connect/account-links',
  '/api/stripe/payment-intents',

  // Compatibility API endpoints
  '/api/compatibility/calculate',
  '/api/compatibility/bulk',
  '/api/compatibility/cache',
  '/api/compatibility/config',

  // Supabase Edge Functions
  '/functions/v1/verify-age'
];

// HTTP methods to test
const METHODS_TO_TEST = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

class CorsTestRunner {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = TEST_CONFIG[environment];
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      summary: {}
    };
  }

  /**
   * Make HTTP request for CORS testing
   */
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'OPTIONS',
        headers: {
          'Origin': options.origin || this.config.allowedOrigins[0],
          'Access-Control-Request-Method': options.method || 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
          ...options.headers
        }
      };

      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  /**
   * Test CORS preflight request
   */
  async testPreflight(endpoint, origin) {
    try {
      const response = await this.makeRequest(
        `${this.config.baseUrl}${endpoint}`,
        {
          method: 'OPTIONS',
          origin: origin
        }
      );

      return {
        success: response.status === 200,
        headers: response.headers,
        allowedOrigin: response.headers['access-control-allow-origin'],
        allowedMethods: response.headers['access-control-allow-methods'],
        allowedHeaders: response.headers['access-control-allow-headers']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test actual request with CORS
   */
  async testActualRequest(endpoint, origin, method = 'POST') {
    try {
      const response = await this.makeRequest(
        `${this.config.baseUrl}${endpoint}`,
        {
          method: method,
          origin: origin,
          body: method === 'POST' ? { test: true } : undefined,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.status < 500, // Accept 4xx as successful CORS test
        status: response.status,
        headers: response.headers,
        allowedOrigin: response.headers['access-control-allow-origin']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test endpoint with allowed origin
   */
  async testAllowedOrigin(endpoint, origin) {
    console.log(`\n  Testing allowed origin: ${origin}`);

    // Test preflight
    const preflightResult = await this.testPreflight(endpoint, origin);
    console.log(`    Preflight: ${preflightResult.success ? '✅ PASS' : '❌ FAIL'}`);

    if (preflightResult.success) {
      const expectedOrigin = origin;
      const actualOrigin = preflightResult.allowedOrigin;

      if (actualOrigin === expectedOrigin) {
        console.log(`    Origin header: ✅ Correct (${actualOrigin})`);
        this.results.passed++;
      } else {
        console.log(`    Origin header: ❌ Expected '${expectedOrigin}', got '${actualOrigin}'`);
        this.results.failed++;
        this.results.errors.push(`${endpoint}: Wrong origin header for ${origin}`);
      }
    } else {
      this.results.failed++;
      this.results.errors.push(`${endpoint}: Preflight failed for allowed origin ${origin}: ${preflightResult.error}`);
    }

    // Test actual request
    const actualResult = await this.testActualRequest(endpoint, origin);
    console.log(`    Actual request: ${actualResult.success ? '✅ PASS' : '❌ FAIL'}`);

    if (!actualResult.success) {
      this.results.failed++;
      this.results.errors.push(`${endpoint}: Actual request failed for allowed origin ${origin}: ${actualResult.error}`);
    } else {
      this.results.passed++;
    }
  }

  /**
   * Test endpoint with blocked origin
   */
  async testBlockedOrigin(endpoint, origin) {
    console.log(`\n  Testing blocked origin: ${origin}`);

    // Test preflight
    const preflightResult = await this.testPreflight(endpoint, origin);
    console.log(`    Preflight: ${preflightResult.success ? '❌ SHOULD BE BLOCKED' : '✅ CORRECTLY BLOCKED'}`);

    if (preflightResult.success) {
      const actualOrigin = preflightResult.allowedOrigin;
      if (actualOrigin === '*' || actualOrigin === origin) {
        console.log(`    ❌ SECURITY ISSUE: Origin ${origin} should be blocked but got '${actualOrigin}'`);
        this.results.failed++;
        this.results.errors.push(`${endpoint}: SECURITY VULNERABILITY - Blocked origin ${origin} was allowed`);
      } else {
        console.log(`    ✅ Origin correctly rejected`);
        this.results.passed++;
      }
    } else {
      console.log(`    ✅ Correctly blocked`);
      this.results.passed++;
    }

    // Test actual request
    const actualResult = await this.testActualRequest(endpoint, origin);
    if (actualResult.success && actualResult.status < 400) {
      console.log(`    ❌ SECURITY ISSUE: Actual request should be blocked`);
      this.results.failed++;
      this.results.errors.push(`${endpoint}: SECURITY VULNERABILITY - Blocked origin ${origin} allowed actual request`);
    } else {
      console.log(`    ✅ Actual request correctly blocked`);
      this.results.passed++;
    }
  }

  /**
   * Test a single endpoint
   */
  async testEndpoint(endpoint) {
    console.log(`\n🧪 Testing endpoint: ${endpoint}`);

    // Test allowed origins
    for (const origin of this.config.allowedOrigins) {
      await this.testAllowedOrigin(endpoint, origin);
    }

    // Test blocked origins
    for (const origin of this.config.blockedOrigins) {
      await this.testBlockedOrigin(endpoint, origin);
    }
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log(`🚀 Starting CORS tests for ${this.environment} environment`);
    console.log(`Base URL: ${this.config.baseUrl}`);
    console.log(`Allowed origins: ${this.config.allowedOrigins.join(', ')}`);
    console.log(`Blocked origins: ${this.config.blockedOrigins.join(', ')}`);

    for (const endpoint of ENDPOINTS_TO_TEST) {
      try {
        await this.testEndpoint(endpoint);
      } catch (error) {
        console.log(`❌ Error testing ${endpoint}: ${error.message}`);
        this.results.failed++;
        this.results.errors.push(`${endpoint}: ${error.message}`);
      }
    }

    this.printResults();
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 CORS TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Environment: ${this.environment}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Total tests: ${this.results.passed + this.results.failed}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.results.failed === 0) {
      console.log('\n🎉 All CORS tests passed! Security configuration is correct.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review CORS configuration.');
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] || 'development';

  if (!TEST_CONFIG[environment]) {
    console.error('❌ Invalid environment. Use: development or production');
    process.exit(1);
  }

  const tester = new CorsTestRunner(environment);
  await tester.runTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { CorsTestRunner, TEST_CONFIG };