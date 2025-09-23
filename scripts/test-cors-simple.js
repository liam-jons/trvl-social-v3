#!/usr/bin/env node

/**
 * Simple CORS Test Script
 * Quick test to verify CORS configuration is working
 */

import { getAllowedOrigins, getCorsHeaders, isOriginAllowed, getSecureCorsHeaders } from '../src/utils/cors-config.js';

console.log('🧪 Testing CORS Configuration');
console.log('=' .repeat(50));

// Test environment variable loading
try {
  console.log('\n1. Testing environment variable loading...');

  // Set test environment
  process.env.NODE_ENV = 'development';
  delete process.env.ALLOWED_ORIGINS; // Force development fallback

  const allowedOrigins = getAllowedOrigins();
  console.log('✅ Allowed origins (development):', allowedOrigins);

  // Test production environment
  process.env.ALLOWED_ORIGINS = 'https://trvlsocial.com,https://www.trvlsocial.com';
  const prodOrigins = getAllowedOrigins();
  console.log('✅ Allowed origins (production):', prodOrigins);

} catch (error) {
  console.log('❌ Environment loading failed:', error.message);
}

// Test origin validation
console.log('\n2. Testing origin validation...');

const testOrigins = [
  'https://trvlsocial.com',      // Should be allowed in production
  'https://www.trvlsocial.com',  // Should be allowed in production
  'http://localhost:5173',       // Should be allowed in development
  'https://evil.com',            // Should be blocked
  'http://malicious-site.com',   // Should be blocked
  null,                          // Should be blocked
  undefined                      // Should be blocked
];

testOrigins.forEach(origin => {
  const allowed = isOriginAllowed(origin);
  const status = allowed ? '✅ ALLOWED' : '❌ BLOCKED';
  console.log(`  ${origin || 'null/undefined'}: ${status}`);
});

// Test CORS headers generation
console.log('\n3. Testing CORS headers generation...');

const testCases = [
  { origin: 'https://trvlsocial.com', expected: 'https://trvlsocial.com' },
  { origin: 'https://evil.com', expected: 'null' },
  { origin: null, expected: 'null' }
];

testCases.forEach(testCase => {
  const headers = getCorsHeaders(testCase.origin);
  const actualOrigin = headers['Access-Control-Allow-Origin'];
  const status = actualOrigin === testCase.expected ? '✅ CORRECT' : '❌ WRONG';

  console.log(`  Origin: ${testCase.origin || 'null'}`);
  console.log(`    Expected: ${testCase.expected}`);
  console.log(`    Actual: ${actualOrigin}`);
  console.log(`    Status: ${status}`);
});

// Test security headers
console.log('\n4. Testing security headers...');
const secureHeaders = getSecureCorsHeaders('https://trvlsocial.com');

const expectedSecurityHeaders = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Referrer-Policy',
  'Content-Security-Policy'
];

expectedSecurityHeaders.forEach(header => {
  const present = header in secureHeaders;
  const status = present ? '✅ PRESENT' : '❌ MISSING';
  console.log(`  ${header}: ${status}`);
  if (present) {
    console.log(`    Value: ${secureHeaders[header]}`);
  }
});

console.log('\n🏁 Simple CORS test completed');
console.log('💡 Run "npm run test:cors" for comprehensive endpoint testing');