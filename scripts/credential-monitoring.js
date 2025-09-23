#!/usr/bin/env node

/**
 * Credential Monitoring and Alerting System
 *
 * This script provides automated monitoring for:
 * - Credential age and expiration warnings
 * - Usage pattern anomaly detection
 * - Rotation schedule compliance
 * - Security incident detection
 *
 * MONITORING FEATURES:
 * - Daily credential age checks
 * - Automatic expiration alerts (30, 7, 1 day warnings)
 * - Usage anomaly detection
 * - Rotation compliance reporting
 * - Emergency alert integration
 */

import { createClient } from '@supabase/supabase-js';
import { CredentialManager } from './credential-management.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

class CredentialMonitor {
  constructor() {
    this.credentialManager = new CredentialManager();
    this.alertThresholds = {
      expiration: {
        critical: 7,   // 7 days
        warning: 30,   // 30 days
        notice: 60     // 60 days
      },
      usage: {
        hourlySpike: 5,      // 5x normal usage
        dailyAnomaly: 3,     // 3x normal usage
        consecutiveFailures: 10
      }
    };
    this.rotationSchedule = {
      'anthropic_api_key': 90,     // days
      'stripe_publishable_key': 90,
      'stripe_secret_key': 90,
      'mapbox_access_token': 180,
      'whatsapp_access_token': 90,
      'daily_api_key': 90,
      'sentry_dsn': 180,
      'mixpanel_token': 180,
      'datadog_application_id': 90,
      'resend_api_key': 90
    };
  }

  /**
   * Main monitoring function - runs all checks
   */
  async runAllChecks() {
    console.log('🔍 CREDENTIAL MONITORING SYSTEM');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');

    const results = {
      timestamp: new Date().toISOString(),
      checks: {},
      alerts: [],
      summary: {}
    };

    try {
      // 1. Check credential ages and expiration
      console.log('📅 Checking credential ages...');
      results.checks.expiration = await this.checkCredentialAges();

      // 2. Check usage patterns
      console.log('📊 Analyzing usage patterns...');
      results.checks.usage = await this.checkUsagePatterns();

      // 3. Check rotation compliance
      console.log('✅ Verifying rotation compliance...');
      results.checks.compliance = await this.checkRotationCompliance();

      // 4. Check for security anomalies
      console.log('🔒 Scanning for security anomalies...');
      results.checks.security = await this.checkSecurityAnomalies();

      // 5. Generate alerts
      results.alerts = await this.generateAlerts(results.checks);

      // 6. Generate summary
      results.summary = this.generateSummary(results.checks, results.alerts);

      // 7. Send alerts if any critical issues
      if (results.alerts.some(alert => alert.severity === 'critical')) {
        await this.sendCriticalAlerts(results.alerts);
      }

      console.log('\n📊 MONITORING SUMMARY:');
      console.log(`Total Alerts: ${results.alerts.length}`);
      console.log(`Critical: ${results.alerts.filter(a => a.severity === 'critical').length}`);
      console.log(`Warning: ${results.alerts.filter(a => a.severity === 'warning').length}`);
      console.log(`Notice: ${results.alerts.filter(a => a.severity === 'notice').length}`);

      return results;

    } catch (error) {
      console.error('❌ Monitoring failed:', error.message);
      await this.sendSystemAlert('MONITORING_FAILURE', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Check credential ages and identify expiring credentials
   */
  async checkCredentialAges() {
    const results = {
      checked: 0,
      expiring: [],
      overdue: [],
      healthy: []
    };

    for (const [credentialName, maxAgeDays] of Object.entries(this.rotationSchedule)) {
      try {
        const ageInfo = await this.getCredentialAge(credentialName);
        results.checked++;

        if (!ageInfo.exists) {
          results.expiring.push({
            name: credentialName,
            status: 'missing',
            daysOverdue: 0,
            severity: 'critical'
          });
          continue;
        }

        const daysOverdue = ageInfo.ageDays - maxAgeDays;

        if (daysOverdue > 0) {
          // Credential is overdue for rotation
          results.overdue.push({
            name: credentialName,
            ageDays: ageInfo.ageDays,
            maxAgeDays,
            daysOverdue,
            severity: daysOverdue > 30 ? 'critical' : 'warning',
            lastRotation: ageInfo.lastRotation
          });
        } else if (maxAgeDays - ageInfo.ageDays <= this.alertThresholds.expiration.critical) {
          // Credential expires within critical threshold
          results.expiring.push({
            name: credentialName,
            ageDays: ageInfo.ageDays,
            daysUntilExpiration: maxAgeDays - ageInfo.ageDays,
            severity: 'critical',
            lastRotation: ageInfo.lastRotation
          });
        } else if (maxAgeDays - ageInfo.ageDays <= this.alertThresholds.expiration.warning) {
          // Credential expires within warning threshold
          results.expiring.push({
            name: credentialName,
            ageDays: ageInfo.ageDays,
            daysUntilExpiration: maxAgeDays - ageInfo.ageDays,
            severity: 'warning',
            lastRotation: ageInfo.lastRotation
          });
        } else {
          // Credential is healthy
          results.healthy.push({
            name: credentialName,
            ageDays: ageInfo.ageDays,
            daysUntilExpiration: maxAgeDays - ageInfo.ageDays,
            lastRotation: ageInfo.lastRotation
          });
        }

      } catch (error) {
        console.error(`Failed to check age for ${credentialName}:`, error.message);
      }
    }

    // Log findings
    if (results.overdue.length > 0) {
      console.log(`⚠️  ${results.overdue.length} credentials overdue for rotation`);
    }
    if (results.expiring.length > 0) {
      console.log(`🔔 ${results.expiring.length} credentials expiring soon`);
    }
    console.log(`✅ ${results.healthy.length} credentials healthy`);

    return results;
  }

  /**
   * Get credential age information
   */
  async getCredentialAge(credentialName) {
    try {
      // Query credential access logs to find last successful creation/rotation
      const { data: logs, error } = await supabase
        .from('credential_access_logs')
        .select('access_timestamp, credential_key, success')
        .eq('credential_key', `create_${credentialName}`)
        .eq('success', true)
        .order('access_timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!logs || logs.length === 0) {
        return { exists: false, ageDays: 0 };
      }

      const lastRotation = new Date(logs[0].access_timestamp);
      const now = new Date();
      const ageDays = Math.floor((now - lastRotation) / (1000 * 60 * 60 * 24));

      return {
        exists: true,
        ageDays,
        lastRotation: lastRotation.toISOString()
      };

    } catch (error) {
      console.error(`Failed to get age for ${credentialName}:`, error.message);
      return { exists: false, ageDays: 0 };
    }
  }

  /**
   * Check usage patterns for anomalies
   */
  async checkUsagePatterns() {
    const results = {
      analyzed: 0,
      anomalies: [],
      normal: []
    };

    try {
      // Get usage data for last 24 hours
      const { data: recentLogs, error } = await supabase
        .from('credential_access_logs')
        .select('credential_key, access_timestamp, success, user_id')
        .gte('access_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('access_timestamp', { ascending: false });

      if (error) throw error;

      // Group by credential and analyze patterns
      const usageByCredential = {};

      recentLogs.forEach(log => {
        if (!usageByCredential[log.credential_key]) {
          usageByCredential[log.credential_key] = {
            total: 0,
            successful: 0,
            failed: 0,
            uniqueUsers: new Set(),
            hourlyPattern: new Array(24).fill(0)
          };
        }

        const usage = usageByCredential[log.credential_key];
        usage.total++;

        if (log.success) {
          usage.successful++;
        } else {
          usage.failed++;
        }

        if (log.user_id) {
          usage.uniqueUsers.add(log.user_id);
        }

        // Track hourly usage
        const hour = new Date(log.access_timestamp).getHours();
        usage.hourlyPattern[hour]++;
      });

      // Analyze each credential's usage pattern
      for (const [credentialKey, usage] of Object.entries(usageByCredential)) {
        results.analyzed++;

        const failureRate = usage.total > 0 ? usage.failed / usage.total : 0;
        const maxHourlyUsage = Math.max(...usage.hourlyPattern);
        const avgHourlyUsage = usage.total / 24;

        // Detect anomalies
        const anomalies = [];

        // High failure rate
        if (failureRate > 0.1 && usage.failed > 5) {
          anomalies.push({
            type: 'high_failure_rate',
            value: failureRate,
            threshold: 0.1,
            severity: failureRate > 0.5 ? 'critical' : 'warning'
          });
        }

        // Unusual usage spike
        if (maxHourlyUsage > avgHourlyUsage * this.alertThresholds.usage.hourlySpike && maxHourlyUsage > 10) {
          anomalies.push({
            type: 'usage_spike',
            value: maxHourlyUsage,
            baseline: avgHourlyUsage,
            severity: 'warning'
          });
        }

        // Too many different users (potential credential sharing)
        if (usage.uniqueUsers.size > 5 && usage.total > 20) {
          anomalies.push({
            type: 'multiple_users',
            value: usage.uniqueUsers.size,
            threshold: 5,
            severity: 'notice'
          });
        }

        if (anomalies.length > 0) {
          results.anomalies.push({
            credential: credentialKey,
            anomalies,
            stats: {
              total: usage.total,
              successful: usage.successful,
              failed: usage.failed,
              failureRate,
              uniqueUsers: usage.uniqueUsers.size
            }
          });
        } else {
          results.normal.push({
            credential: credentialKey,
            stats: {
              total: usage.total,
              successful: usage.successful,
              failed: usage.failed,
              uniqueUsers: usage.uniqueUsers.size
            }
          });
        }
      }

      console.log(`🔍 Analyzed ${results.analyzed} credentials`);
      if (results.anomalies.length > 0) {
        console.log(`⚠️  Found ${results.anomalies.length} usage anomalies`);
      }

    } catch (error) {
      console.error('Failed to analyze usage patterns:', error.message);
    }

    return results;
  }

  /**
   * Check rotation compliance
   */
  async checkRotationCompliance() {
    const results = {
      compliant: 0,
      nonCompliant: 0,
      total: 0,
      violations: []
    };

    for (const [credentialName, maxAgeDays] of Object.entries(this.rotationSchedule)) {
      results.total++;

      const ageInfo = await this.getCredentialAge(credentialName);

      if (!ageInfo.exists) {
        results.nonCompliant++;
        results.violations.push({
          credential: credentialName,
          violation: 'missing',
          severity: 'critical'
        });
      } else if (ageInfo.ageDays > maxAgeDays) {
        results.nonCompliant++;
        results.violations.push({
          credential: credentialName,
          violation: 'overdue',
          ageDays: ageInfo.ageDays,
          maxAgeDays,
          daysOverdue: ageInfo.ageDays - maxAgeDays,
          severity: ageInfo.ageDays > maxAgeDays + 30 ? 'critical' : 'warning'
        });
      } else {
        results.compliant++;
      }
    }

    const complianceRate = (results.compliant / results.total) * 100;
    console.log(`📋 Compliance Rate: ${complianceRate.toFixed(1)}% (${results.compliant}/${results.total})`);

    return results;
  }

  /**
   * Check for security anomalies
   */
  async checkSecurityAnomalies() {
    const results = {
      anomalies: [],
      checks: 0
    };

    try {
      // Check for credential errors in last 24 hours
      const { data: errors, error } = await supabase
        .from('credential_errors')
        .select('*')
        .gte('error_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('error_timestamp', { ascending: false });

      if (error) throw error;

      results.checks++;

      // Group errors by credential
      const errorsByCredential = {};
      errors.forEach(err => {
        if (!errorsByCredential[err.credential_key]) {
          errorsByCredential[err.credential_key] = [];
        }
        errorsByCredential[err.credential_key].push(err);
      });

      // Check for suspicious patterns
      for (const [credentialKey, credErrors] of Object.entries(errorsByCredential)) {
        if (credErrors.length > 5) {
          results.anomalies.push({
            type: 'frequent_errors',
            credential: credentialKey,
            count: credErrors.length,
            severity: credErrors.length > 20 ? 'critical' : 'warning'
          });
        }

        // Check for rapid consecutive failures
        const sortedErrors = credErrors.sort((a, b) => new Date(b.error_timestamp) - new Date(a.error_timestamp));
        if (sortedErrors.length >= 3) {
          const timeDiff = new Date(sortedErrors[0].error_timestamp) - new Date(sortedErrors[2].error_timestamp);
          if (timeDiff < 5 * 60 * 1000) { // 5 minutes
            results.anomalies.push({
              type: 'rapid_failures',
              credential: credentialKey,
              count: sortedErrors.length,
              timeWindow: timeDiff / 1000,
              severity: 'warning'
            });
          }
        }
      }

      if (results.anomalies.length > 0) {
        console.log(`🚨 Found ${results.anomalies.length} security anomalies`);
      }

    } catch (error) {
      console.error('Failed to check security anomalies:', error.message);
    }

    return results;
  }

  /**
   * Generate alerts based on check results
   */
  async generateAlerts(checks) {
    const alerts = [];

    // Expiration alerts
    if (checks.expiration?.overdue) {
      checks.expiration.overdue.forEach(cred => {
        alerts.push({
          type: 'credential_overdue',
          severity: cred.severity,
          credential: cred.name,
          message: `Credential ${cred.name} is ${cred.daysOverdue} days overdue for rotation`,
          daysOverdue: cred.daysOverdue,
          actionRequired: 'immediate_rotation'
        });
      });
    }

    if (checks.expiration?.expiring) {
      checks.expiration.expiring.forEach(cred => {
        alerts.push({
          type: 'credential_expiring',
          severity: cred.severity,
          credential: cred.name,
          message: `Credential ${cred.name} expires in ${cred.daysUntilExpiration} days`,
          daysUntilExpiration: cred.daysUntilExpiration,
          actionRequired: 'schedule_rotation'
        });
      });
    }

    // Usage anomaly alerts
    if (checks.usage?.anomalies) {
      checks.usage.anomalies.forEach(usage => {
        usage.anomalies.forEach(anomaly => {
          alerts.push({
            type: 'usage_anomaly',
            severity: anomaly.severity,
            credential: usage.credential,
            message: `Unusual ${anomaly.type} detected for ${usage.credential}`,
            anomalyType: anomaly.type,
            value: anomaly.value,
            actionRequired: 'investigate'
          });
        });
      });
    }

    // Security anomaly alerts
    if (checks.security?.anomalies) {
      checks.security.anomalies.forEach(anomaly => {
        alerts.push({
          type: 'security_anomaly',
          severity: anomaly.severity,
          credential: anomaly.credential,
          message: `Security anomaly: ${anomaly.type} for ${anomaly.credential}`,
          anomalyType: anomaly.type,
          actionRequired: 'security_review'
        });
      });
    }

    return alerts;
  }

  /**
   * Generate monitoring summary
   */
  generateSummary(checks, alerts) {
    return {
      timestamp: new Date().toISOString(),
      credentialsChecked: checks.expiration?.checked || 0,
      credentialsHealthy: checks.expiration?.healthy?.length || 0,
      credentialsExpiring: checks.expiration?.expiring?.length || 0,
      credentialsOverdue: checks.expiration?.overdue?.length || 0,
      usageAnomalies: checks.usage?.anomalies?.length || 0,
      securityAnomalies: checks.security?.anomalies?.length || 0,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      complianceRate: checks.compliance ? (checks.compliance.compliant / checks.compliance.total) * 100 : 0
    };
  }

  /**
   * Send critical alerts
   */
  async sendCriticalAlerts(alerts) {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

    if (criticalAlerts.length === 0) return;

    console.log(`🚨 SENDING ${criticalAlerts.length} CRITICAL ALERTS`);

    for (const alert of criticalAlerts) {
      console.log(`⚠️  CRITICAL: ${alert.message}`);

      // In production, this would integrate with:
      // - Slack/Teams notifications
      // - PagerDuty alerts
      // - Email notifications
      // - SMS alerts for on-call

      await this.logAlert(alert);
    }
  }

  /**
   * Send system alert for monitoring failures
   */
  async sendSystemAlert(type, metadata) {
    console.log(`🚨 SYSTEM ALERT: ${type}`);
    console.log('Metadata:', metadata);

    // Log system alert
    await this.logAlert({
      type: 'system_alert',
      severity: 'critical',
      message: `Monitoring system alert: ${type}`,
      metadata
    });
  }

  /**
   * Log alert to database
   */
  async logAlert(alert) {
    try {
      // In production, this would store alerts in a dedicated table
      console.log(`📝 Logging alert: ${alert.type} - ${alert.severity}`);
    } catch (error) {
      console.error('Failed to log alert:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const monitor = new CredentialMonitor();

  switch (command) {
    case 'run':
      await monitor.runAllChecks();
      break;

    case 'ages':
      const ageResults = await monitor.checkCredentialAges();
      console.log('\n📊 CREDENTIAL AGES:');
      ageResults.healthy.forEach(cred => {
        console.log(`✅ ${cred.name}: ${cred.ageDays} days old (${cred.daysUntilExpiration} days until rotation)`);
      });
      ageResults.expiring.forEach(cred => {
        console.log(`⚠️  ${cred.name}: Expires in ${cred.daysUntilExpiration} days`);
      });
      ageResults.overdue.forEach(cred => {
        console.log(`🚨 ${cred.name}: ${cred.daysOverdue} days overdue`);
      });
      break;

    case 'usage':
      await monitor.checkUsagePatterns();
      break;

    case 'security':
      await monitor.checkSecurityAnomalies();
      break;

    default:
      console.log('🔍 CREDENTIAL MONITORING COMMANDS:');
      console.log('');
      console.log('📊 node credential-monitoring.js run');
      console.log('   → Run all monitoring checks');
      console.log('');
      console.log('📅 node credential-monitoring.js ages');
      console.log('   → Check credential ages and expiration');
      console.log('');
      console.log('📈 node credential-monitoring.js usage');
      console.log('   → Analyze usage patterns');
      console.log('');
      console.log('🔒 node credential-monitoring.js security');
      console.log('   → Check for security anomalies');
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Monitoring failed:', error.message);
    process.exit(1);
  });
}

export { CredentialMonitor };