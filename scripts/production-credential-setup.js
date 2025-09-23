#!/usr/bin/env node

/**
 * Production Credential Setup and Validation Script
 *
 * This script helps transition from test/placeholder credentials to production values
 * and validates that all required services are properly configured for production deployment.
 *
 * PRODUCTION SETUP FEATURES:
 * - Validates all required credentials are present
 * - Tests credential connectivity with services
 * - Replaces test keys with production values
 * - Generates production readiness report
 * - Creates deployment checklist
 */

import { CredentialManager } from './credential-management.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

class ProductionCredentialSetup {
  constructor() {
    this.credentialManager = new CredentialManager();
    this.requiredServices = {
      // Critical services (block deployment if missing)
      critical: [
        {
          name: 'anthropic_api_key',
          service: 'Anthropic Claude',
          description: 'AI services for personality descriptions and chat',
          testEndpoint: 'https://api.anthropic.com/v1/messages',
          setupUrl: 'https://console.anthropic.com/settings/keys',
          cost: 'Usage-based (~$50-200/month estimated)',
          pattern: /^sk-ant-api03-[a-zA-Z0-9_-]+$/
        },
        {
          name: 'stripe_publishable_key',
          service: 'Stripe Payments',
          description: 'Payment processing for bookings and subscriptions',
          testEndpoint: 'https://api.stripe.com/v1/customers',
          setupUrl: 'https://dashboard.stripe.com/apikeys',
          cost: '2.9% + 30¢ per transaction',
          pattern: /^pk_live_[a-zA-Z0-9]+$/,
          isProduction: value => value.startsWith('pk_live_')
        },
        {
          name: 'stripe_secret_key',
          service: 'Stripe Payments',
          description: 'Server-side payment processing',
          testEndpoint: 'https://api.stripe.com/v1/customers',
          setupUrl: 'https://dashboard.stripe.com/apikeys',
          cost: '2.9% + 30¢ per transaction',
          pattern: /^sk_live_[a-zA-Z0-9]+$/,
          isProduction: value => value.startsWith('sk_live_')
        },
        {
          name: 'mapbox_access_token',
          service: 'Mapbox',
          description: 'Maps and location services for adventures',
          testEndpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places/test.json',
          setupUrl: 'https://account.mapbox.com/access-tokens/',
          cost: 'Free tier: 50k requests/month, then $0.50/1k requests',
          pattern: /^pk\.[a-zA-Z0-9_-]+$/
        }
      ],

      // Important services (warn if missing, don't block)
      important: [
        {
          name: 'whatsapp_access_token',
          service: 'WhatsApp Business',
          description: 'Group messaging and notifications',
          setupUrl: 'https://developers.facebook.com/apps/',
          cost: 'Free for first 1k conversations/month',
          pattern: /^[A-Za-z0-9_-]+$/
        },
        {
          name: 'daily_api_key',
          service: 'Daily.co',
          description: 'Video calls and streaming',
          setupUrl: 'https://dashboard.daily.co/developers',
          cost: 'Free tier: 10k minutes/month, then $0.002/minute',
          pattern: /^[a-zA-Z0-9_-]+$/
        },
        {
          name: 'resend_api_key',
          service: 'Resend',
          description: 'Transactional emails',
          setupUrl: 'https://resend.com/api-keys',
          cost: 'Free tier: 3k emails/month, then $0.0004/email',
          pattern: /^re_[a-zA-Z0-9_-]+$/
        }
      ],

      // Optional services (nice to have)
      optional: [
        {
          name: 'mixpanel_token',
          service: 'Mixpanel',
          description: 'User analytics and behavior tracking',
          setupUrl: 'https://mixpanel.com/settings/project/',
          cost: 'Free tier: 100k events/month',
          pattern: /^[a-zA-Z0-9]+$/
        },
        {
          name: 'sentry_dsn',
          service: 'Sentry',
          description: 'Error tracking and monitoring',
          setupUrl: 'https://sentry.io/settings/projects/',
          cost: 'Free tier: 5k errors/month',
          pattern: /^https:\/\/[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.ingest\.sentry\.io\/[0-9]+$/
        },
        {
          name: 'datadog_application_id',
          service: 'Datadog',
          description: 'Performance monitoring',
          setupUrl: 'https://app.datadoghq.com/organization-settings/api-keys',
          cost: 'Starts at $15/host/month',
          pattern: /^[a-zA-Z0-9-]+$/
        }
      ]
    };
  }

  /**
   * Main production setup workflow
   */
  async runProductionSetup() {
    console.log('🚀 PRODUCTION CREDENTIAL SETUP');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');

    const results = {
      timestamp: new Date().toISOString(),
      readiness: {
        critical: { configured: 0, total: 0, missing: [] },
        important: { configured: 0, total: 0, missing: [] },
        optional: { configured: 0, total: 0, missing: [] }
      },
      testResults: [],
      recommendations: [],
      estimatedMonthlyCost: 0,
      deploymentBlockers: []
    };

    // 1. Check current credential status
    console.log('🔍 CHECKING CURRENT CREDENTIAL STATUS...');
    await this.checkCredentialStatus(results);

    // 2. Test credential connectivity
    console.log('\n🔗 TESTING CREDENTIAL CONNECTIVITY...');
    await this.testCredentialConnectivity(results);

    // 3. Validate production readiness
    console.log('\n✅ VALIDATING PRODUCTION READINESS...');
    this.validateProductionReadiness(results);

    // 4. Generate recommendations
    console.log('\n💡 GENERATING RECOMMENDATIONS...');
    this.generateRecommendations(results);

    // 5. Create setup guide
    console.log('\n📋 CREATING SETUP GUIDE...');
    await this.createSetupGuide(results);

    // 6. Generate final report
    console.log('\n📊 PRODUCTION READINESS REPORT:');
    this.printReadinessReport(results);

    return results;
  }

  /**
   * Check status of all required credentials
   */
  async checkCredentialStatus(results) {
    for (const [priority, services] of Object.entries(this.requiredServices)) {
      results.readiness[priority].total = services.length;

      for (const service of services) {
        try {
          const credential = await this.credentialManager.getSecureCredential(service.name);

          if (!credential.success || !credential.value) {
            results.readiness[priority].missing.push({
              name: service.name,
              service: service.service,
              reason: 'not_configured'
            });
            continue;
          }

          // Validate credential format
          if (service.pattern && !service.pattern.test(credential.value)) {
            results.readiness[priority].missing.push({
              name: service.name,
              service: service.service,
              reason: 'invalid_format',
              expected: service.pattern.toString()
            });
            continue;
          }

          // Check if it's a production credential
          if (service.isProduction && !service.isProduction(credential.value)) {
            results.readiness[priority].missing.push({
              name: service.name,
              service: service.service,
              reason: 'test_credential',
              value: 'Using test credential in production setup'
            });
            continue;
          }

          // Check for placeholder values
          if (credential.value.includes('your_') || credential.value.includes('placeholder')) {
            results.readiness[priority].missing.push({
              name: service.name,
              service: service.service,
              reason: 'placeholder'
            });
            continue;
          }

          results.readiness[priority].configured++;
          console.log(`✅ ${service.service}: Configured`);

        } catch (error) {
          results.readiness[priority].missing.push({
            name: service.name,
            service: service.service,
            reason: 'error',
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Test connectivity to services
   */
  async testCredentialConnectivity(results) {
    const criticalServices = this.requiredServices.critical.filter(service =>
      !results.readiness.critical.missing.some(missing => missing.name === service.name)
    );

    for (const service of criticalServices) {
      try {
        console.log(`🔍 Testing ${service.service}...`);

        const credential = await this.credentialManager.getSecureCredential(service.name);

        if (!credential.success) {
          results.testResults.push({
            service: service.service,
            name: service.name,
            status: 'failed',
            error: 'Credential not available'
          });
          continue;
        }

        // Service-specific connectivity tests
        let testResult = null;

        switch (service.name) {
          case 'anthropic_api_key':
            testResult = await this.testAnthropicConnectivity(credential.value);
            break;
          case 'stripe_secret_key':
            testResult = await this.testStripeConnectivity(credential.value);
            break;
          case 'mapbox_access_token':
            testResult = await this.testMapboxConnectivity(credential.value);
            break;
          default:
            testResult = { success: true, message: 'Format validation passed' };
        }

        results.testResults.push({
          service: service.service,
          name: service.name,
          status: testResult.success ? 'passed' : 'failed',
          message: testResult.message,
          responseTime: testResult.responseTime
        });

        const statusIcon = testResult.success ? '✅' : '❌';
        console.log(`${statusIcon} ${service.service}: ${testResult.message}`);

      } catch (error) {
        results.testResults.push({
          service: service.service,
          name: service.name,
          status: 'error',
          error: error.message
        });
        console.log(`❌ ${service.service}: Test failed - ${error.message}`);
      }
    }
  }

  /**
   * Test Anthropic API connectivity
   */
  async testAnthropicConnectivity(apiKey) {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test connection' }]
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `API connection successful (${responseTime}ms)`,
          responseTime
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: `API error: ${response.status} - ${error}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test Stripe API connectivity
   */
  async testStripeConnectivity(secretKey) {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `API connection successful (${responseTime}ms)`,
          responseTime
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: `API error: ${response.status} - ${error}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test Mapbox API connectivity
   */
  async testMapboxConnectivity(accessToken) {
    const startTime = Date.now();

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${accessToken}&limit=1`
      );

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `API connection successful (${responseTime}ms)`,
          responseTime
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: `API error: ${response.status} - ${error}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate production readiness
   */
  validateProductionReadiness(results) {
    const { critical, important } = results.readiness;

    // Check critical services
    if (critical.missing.length > 0) {
      results.deploymentBlockers.push({
        type: 'missing_critical_credentials',
        severity: 'blocking',
        message: `${critical.missing.length} critical services not configured`,
        services: critical.missing.map(m => m.service)
      });
    }

    // Check for test credentials in production
    const testCredentials = [
      ...critical.missing.filter(m => m.reason === 'test_credential'),
      ...important.missing.filter(m => m.reason === 'test_credential')
    ];

    if (testCredentials.length > 0) {
      results.deploymentBlockers.push({
        type: 'test_credentials_in_production',
        severity: 'critical',
        message: 'Test credentials detected - must use production keys',
        services: testCredentials.map(t => t.service)
      });
    }

    // Check for failed connectivity tests
    const failedTests = results.testResults.filter(t => t.status === 'failed' || t.status === 'error');
    if (failedTests.length > 0) {
      results.deploymentBlockers.push({
        type: 'connectivity_failures',
        severity: 'warning',
        message: 'Some services failed connectivity tests',
        services: failedTests.map(t => t.service)
      });
    }

    // Calculate readiness percentage
    const totalCritical = critical.total;
    const configuredCritical = critical.configured;
    const readinessPercentage = totalCritical > 0 ? (configuredCritical / totalCritical) * 100 : 0;

    results.readinessPercentage = readinessPercentage;
    results.isProductionReady = readinessPercentage === 100 && results.deploymentBlockers.filter(b => b.severity === 'blocking').length === 0;
  }

  /**
   * Generate setup recommendations
   */
  generateRecommendations(results) {
    const { critical, important, optional } = results.readiness;

    // Critical service recommendations
    critical.missing.forEach(missing => {
      const service = this.requiredServices.critical.find(s => s.name === missing.name);
      results.recommendations.push({
        priority: 'critical',
        action: 'configure_credential',
        service: service.service,
        message: `Configure ${service.service} for ${service.description}`,
        setupUrl: service.setupUrl,
        cost: service.cost,
        deadline: 'Before production deployment'
      });
    });

    // Important service recommendations
    important.missing.forEach(missing => {
      const service = this.requiredServices.important.find(s => s.name === missing.name);
      results.recommendations.push({
        priority: 'important',
        action: 'configure_credential',
        service: service.service,
        message: `Configure ${service.service} for ${service.description}`,
        setupUrl: service.setupUrl,
        cost: service.cost,
        deadline: 'Within first week of production'
      });
    });

    // Optional service recommendations
    optional.missing.forEach(missing => {
      const service = this.requiredServices.optional.find(s => s.name === missing.name);
      results.recommendations.push({
        priority: 'optional',
        action: 'configure_credential',
        service: service.service,
        message: `Configure ${service.service} for ${service.description}`,
        setupUrl: service.setupUrl,
        cost: service.cost,
        deadline: 'When budget allows'
      });
    });

    // Security recommendations
    results.recommendations.push({
      priority: 'security',
      action: 'rotate_exposed_credentials',
      message: 'Rotate any previously exposed credentials immediately',
      deadline: 'Immediately'
    });

    results.recommendations.push({
      priority: 'security',
      action: 'enable_monitoring',
      message: 'Enable daily credential monitoring alerts',
      deadline: 'Before production deployment'
    });
  }

  /**
   * Create setup guide for missing services
   */
  async createSetupGuide(results) {
    const missingServices = [
      ...results.readiness.critical.missing,
      ...results.readiness.important.missing
    ];

    if (missingServices.length === 0) {
      console.log('✅ All required services configured');
      return;
    }

    let guide = '# 🛠️ Production Credential Setup Guide\n\n';
    guide += `Generated: ${new Date().toISOString()}\n\n`;

    guide += '## Critical Services (Required for Deployment)\n\n';

    for (const missing of results.readiness.critical.missing) {
      const service = this.requiredServices.critical.find(s => s.name === missing.name);
      guide += `### ${service.service}\n`;
      guide += `**Purpose**: ${service.description}\n`;
      guide += `**Setup URL**: ${service.setupUrl}\n`;
      guide += `**Cost**: ${service.cost}\n`;
      guide += `**Issue**: ${missing.reason}\n\n`;

      guide += '**Setup Steps**:\n';
      guide += `1. Visit [${service.service} Dashboard](${service.setupUrl})\n`;
      guide += '2. Generate production API key/token\n';
      guide += '3. Store securely using:\n';
      guide += '   ```bash\n';
      guide += `   node -e "const { CredentialManager } = await import('./scripts/credential-management.js'); await new CredentialManager().storeSecureCredential('${service.name}', 'YOUR_PRODUCTION_KEY');"\n`;
      guide += '   ```\n';
      guide += '4. Test connectivity:\n';
      guide += '   ```bash\n';
      guide += '   node scripts/production-credential-setup.js test\n';
      guide += '   ```\n\n';
    }

    if (results.readiness.important.missing.length > 0) {
      guide += '## Important Services (Recommended)\n\n';

      for (const missing of results.readiness.important.missing) {
        const service = this.requiredServices.important.find(s => s.name === missing.name);
        guide += `### ${service.service}\n`;
        guide += `**Purpose**: ${service.description}\n`;
        guide += `**Setup URL**: ${service.setupUrl}\n`;
        guide += `**Cost**: ${service.cost}\n\n`;
      }
    }

    // Write setup guide to file
    const fs = await import('fs');
    fs.writeFileSync('PRODUCTION_CREDENTIAL_SETUP.md', guide);
    console.log('📄 Setup guide saved to PRODUCTION_CREDENTIAL_SETUP.md');
  }

  /**
   * Print final readiness report
   */
  printReadinessReport(results) {
    const { critical, important, optional } = results.readiness;

    console.log(`🎯 PRODUCTION READINESS: ${results.readinessPercentage.toFixed(1)}%`);
    console.log('');

    console.log('📊 SERVICE STATUS:');
    console.log(`Critical Services: ${critical.configured}/${critical.total} configured`);
    console.log(`Important Services: ${important.configured}/${important.total} configured`);
    console.log(`Optional Services: ${optional.configured}/${optional.total} configured`);
    console.log('');

    if (results.deploymentBlockers.length > 0) {
      console.log('🚫 DEPLOYMENT BLOCKERS:');
      results.deploymentBlockers.forEach(blocker => {
        const icon = blocker.severity === 'blocking' ? '🚫' : '⚠️';
        console.log(`${icon} ${blocker.message}`);
      });
      console.log('');
    }

    if (results.isProductionReady) {
      console.log('🚀 READY FOR PRODUCTION DEPLOYMENT');
    } else {
      console.log('⏳ NOT READY - Complete critical service setup first');
    }

    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Review PRODUCTION_CREDENTIAL_SETUP.md for missing services');
    console.log('2. Configure critical services before deployment');
    console.log('3. Run rotation for any exposed credentials');
    console.log('4. Enable daily monitoring alerts');
    console.log('5. Test full application with production credentials');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const setup = new ProductionCredentialSetup();

  switch (command) {
    case 'check':
      await setup.runProductionSetup();
      break;

    case 'test':
      console.log('🔗 Testing credential connectivity...');
      const results = { testResults: [] };
      await setup.testCredentialConnectivity(results);
      break;

    default:
      console.log('🚀 PRODUCTION CREDENTIAL SETUP COMMANDS:');
      console.log('');
      console.log('📊 node production-credential-setup.js check');
      console.log('   → Run full production readiness assessment');
      console.log('');
      console.log('🔗 node production-credential-setup.js test');
      console.log('   → Test connectivity to configured services');
      console.log('');
      console.log('💡 IMPORTANT:');
      console.log('   Configure all critical services before production deployment');
      console.log('   Use production API keys, not test keys');
      console.log('   Rotate any previously exposed credentials');
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
}

export { ProductionCredentialSetup };