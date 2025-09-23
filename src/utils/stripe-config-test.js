/**
 * Stripe Configuration Test Utility
 * Validates Stripe Connect setup and configuration
 */
import { stripeConfig, getStripe } from '../services/stripe-service.js';
/**
 * Test Stripe configuration
 */
export async function testStripeConfiguration() {
  const results = {
    timestamp: new Date().toISOString(),
    overall: 'pending',
    tests: []
  };
  // Test 1: Environment Variables
  try {
    stripeConfig.validateConfig();
    results.tests.push({
      name: 'Environment Variables',
      status: 'pass',
      message: 'All required Stripe environment variables are configured'
    });
  } catch (error) {
    results.tests.push({
      name: 'Environment Variables',
      status: 'fail',
      message: error.message,
      critical: true
    });
  }
  // Test 2: Stripe.js Loading
  try {
    const stripe = await getStripe();
    if (stripe) {
      results.tests.push({
        name: 'Stripe.js Loading',
        status: 'pass',
        message: 'Stripe.js loaded successfully'
      });
    } else {
      results.tests.push({
        name: 'Stripe.js Loading',
        status: 'fail',
        message: 'Failed to load Stripe.js',
        critical: true
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Stripe.js Loading',
      status: 'fail',
      message: error.message,
      critical: true
    });
  }
  // Test 3: Platform Configuration
  try {
    const config = stripeConfig.getConfig();
    if (config.platformFeePercent > 0 && config.platformFeePercent <= 0.3) {
      results.tests.push({
        name: 'Platform Configuration',
        status: 'pass',
        message: `Platform fee: ${(config.platformFeePercent * 100).toFixed(1)}%`
      });
    } else {
      results.tests.push({
        name: 'Platform Configuration',
        status: 'warn',
        message: 'Platform fee percentage is outside recommended range (0-30%)'
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Platform Configuration',
      status: 'fail',
      message: error.message
    });
  }
  // Test 4: Supported Countries and Currencies
  try {
    const config = stripeConfig.getConfig();
    if (config.supportedCountries && config.supportedCountries.length > 0) {
      results.tests.push({
        name: 'Supported Regions',
        status: 'pass',
        message: `Supporting ${config.supportedCountries.length} countries and ${config.supportedCurrencies.length} currencies`
      });
    } else {
      results.tests.push({
        name: 'Supported Regions',
        status: 'fail',
        message: 'No supported countries configured'
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Supported Regions',
      status: 'fail',
      message: error.message
    });
  }
  // Test 5: API Connectivity (if we have backend endpoints)
  try {
    // This would test the backend API endpoints
    // For now, we'll just check if the URLs are configured
    if (window.location.hostname === 'localhost') {
      results.tests.push({
        name: 'API Connectivity',
        status: 'warn',
        message: 'Running in development mode - API endpoints not tested'
      });
    } else {
      results.tests.push({
        name: 'API Connectivity',
        status: 'info',
        message: 'Production API endpoints - manual testing required'
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'API Connectivity',
      status: 'fail',
      message: error.message
    });
  }
  // Determine overall status
  const criticalFailures = results.tests.filter(t => t.status === 'fail' && t.critical);
  const failures = results.tests.filter(t => t.status === 'fail');
  const warnings = results.tests.filter(t => t.status === 'warn');
  if (criticalFailures.length > 0) {
    results.overall = 'critical';
  } else if (failures.length > 0) {
    results.overall = 'fail';
  } else if (warnings.length > 0) {
    results.overall = 'warn';
  } else {
    results.overall = 'pass';
  }
  return results;
}
/**
 * Format configuration test results for display
 */
export function formatTestResults(results) {
  const statusColors = {
    pass: '✅',
    warn: '⚠️',
    fail: '❌',
    info: 'ℹ️',
    critical: '🚨'
  };
  let output = `\n🔧 Stripe Configuration Test Results (${results.timestamp})\n`;
  output += `Overall Status: ${statusColors[results.overall]} ${results.overall.toUpperCase()}\n\n`;
  results.tests.forEach((test, index) => {
    output += `${index + 1}. ${statusColors[test.status]} ${test.name}\n`;
    output += `   ${test.message}\n\n`;
  });
  return output;
}
/**
 * Run configuration test and log results
 */
export async function runConfigurationTest() {
  try {
    const results = await testStripeConfiguration();
    const formatted = formatTestResults(results);
    // Return results for programmatic use
    return results;
  } catch (error) {
    return {
      overall: 'critical',
      error: error.message,
      tests: []
    };
  }
}
/**
 * Calculate platform fee for testing
 */
export function testPlatformFeeCalculation() {
  const testAmounts = [1000, 5000, 10000, 25000]; // in cents
  testAmounts.forEach(amount => {
    const fee = stripeConfig.calculatePlatformFee(amount);
    const vendorAmount = amount - fee;
    const feePercent = ((fee / amount) * 100).toFixed(2);
  });
}
// Export all utilities
export default {
  testStripeConfiguration,
  formatTestResults,
  runConfigurationTest,
  testPlatformFeeCalculation,
};