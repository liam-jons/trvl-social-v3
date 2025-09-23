/**
 * Performance Alerts Service
 * Configures and manages performance alerts and thresholds
 * for proactive monitoring and incident response
 */
import sentryService from './sentry-service.js';
import analyticsService from './analytics-service.js';
import webVitalsService from './web-vitals-service.js';

class PerformanceAlertsService {
  constructor() {
    this.isInitialized = false;
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.cooldownPeriods = new Map();
    this.notificationChannels = new Set();
    this.escalationRules = [];

    // Default thresholds
    this.defaultThresholds = {
      // Core Web Vitals thresholds
      webVitals: {
        LCP: { warning: 2500, critical: 4000, unit: 'ms' },
        FID: { warning: 100, critical: 300, unit: 'ms' },
        CLS: { warning: 0.1, critical: 0.25, unit: '' },
        FCP: { warning: 1800, critical: 3000, unit: 'ms' },
        TTFB: { warning: 800, critical: 1800, unit: 'ms' }
      },

      // Application performance thresholds
      performance: {
        responseTime: { warning: 500, critical: 1000, unit: 'ms' },
        errorRate: { warning: 1, critical: 5, unit: '%' },
        memoryUsage: { warning: 70, critical: 85, unit: '%' },
        cpuUsage: { warning: 70, critical: 85, unit: '%' },
        throughput: { warning: 50, critical: 20, unit: 'req/s', direction: 'below' }
      },

      // Business metrics thresholds
      business: {
        conversionRate: { warning: 2, critical: 1, unit: '%', direction: 'below' },
        bounceRate: { warning: 70, critical: 80, unit: '%' },
        sessionDuration: { warning: 60, critical: 30, unit: 's', direction: 'below' },
        pageLoadFailures: { warning: 1, critical: 3, unit: '%' }
      },

      // System metrics thresholds
      system: {
        longTasks: { warning: 50, critical: 100, unit: 'ms' },
        resourceLoadTime: { warning: 2000, critical: 5000, unit: 'ms' },
        jsErrors: { warning: 5, critical: 10, unit: 'errors/min' },
        networkFailures: { warning: 2, critical: 5, unit: 'failures/min' }
      }
    };
  }

  /**
   * Initialize the alerts service
   */
  init(config = {}) {
    if (this.isInitialized) return;

    try {
      // Merge custom thresholds with defaults
      if (config.thresholds) {
        this.mergeThresholds(config.thresholds);
      }

      // Set up notification channels
      if (config.notifications) {
        this.setupNotificationChannels(config.notifications);
      }

      // Configure escalation rules
      if (config.escalation) {
        this.setupEscalationRules(config.escalation);
      }

      // Initialize default alert rules
      this.initializeDefaultAlertRules();

      // Start monitoring
      this.startMonitoring();

      this.isInitialized = true;

      // Track initialization
      analyticsService.trackEvent('performance_alerts_initialized', {
        rules_count: this.alertRules.size,
        notification_channels: this.notificationChannels.size,
        escalation_rules: this.escalationRules.length
      });

    } catch (error) {
      sentryService.captureException(error, {
        tags: { error_type: 'alerts_init_error' }
      });
    }
  }

  /**
   * Merge custom thresholds with defaults
   */
  mergeThresholds(customThresholds) {
    Object.keys(customThresholds).forEach(category => {
      if (this.defaultThresholds[category]) {
        Object.assign(this.defaultThresholds[category], customThresholds[category]);
      } else {
        this.defaultThresholds[category] = customThresholds[category];
      }
    });
  }

  /**
   * Setup notification channels
   */
  setupNotificationChannels(channels) {
    channels.forEach(channel => {
      this.notificationChannels.add(channel);
    });
  }

  /**
   * Setup escalation rules
   */
  setupEscalationRules(rules) {
    this.escalationRules = rules.map(rule => ({
      ...rule,
      lastTriggered: null
    }));
  }

  /**
   * Initialize default alert rules
   */
  initializeDefaultAlertRules() {
    // Web Vitals alerts
    Object.entries(this.defaultThresholds.webVitals).forEach(([metric, thresholds]) => {
      this.addAlertRule(`webvitals_${metric.toLowerCase()}_warning`, {
        type: 'webVitals',
        metric,
        threshold: thresholds.warning,
        severity: 'warning',
        condition: 'above',
        duration: 60000, // 1 minute
        cooldown: 300000 // 5 minutes
      });

      this.addAlertRule(`webvitals_${metric.toLowerCase()}_critical`, {
        type: 'webVitals',
        metric,
        threshold: thresholds.critical,
        severity: 'critical',
        condition: 'above',
        duration: 30000, // 30 seconds
        cooldown: 600000 // 10 minutes
      });
    });

    // Performance alerts
    Object.entries(this.defaultThresholds.performance).forEach(([metric, thresholds]) => {
      const condition = thresholds.direction === 'below' ? 'below' : 'above';

      this.addAlertRule(`performance_${metric}_warning`, {
        type: 'performance',
        metric,
        threshold: thresholds.warning,
        severity: 'warning',
        condition,
        duration: 120000, // 2 minutes
        cooldown: 300000 // 5 minutes
      });

      this.addAlertRule(`performance_${metric}_critical`, {
        type: 'performance',
        metric,
        threshold: thresholds.critical,
        severity: 'critical',
        condition,
        duration: 60000, // 1 minute
        cooldown: 600000 // 10 minutes
      });
    });

    // Business metrics alerts
    Object.entries(this.defaultThresholds.business).forEach(([metric, thresholds]) => {
      const condition = thresholds.direction === 'below' ? 'below' : 'above';

      this.addAlertRule(`business_${metric}_warning`, {
        type: 'business',
        metric,
        threshold: thresholds.warning,
        severity: 'warning',
        condition,
        duration: 300000, // 5 minutes
        cooldown: 900000 // 15 minutes
      });
    });

    // System alerts
    this.addAlertRule('system_high_error_rate', {
      type: 'system',
      metric: 'errorRate',
      threshold: 10,
      severity: 'critical',
      condition: 'above',
      duration: 60000,
      cooldown: 300000
    });

    this.addAlertRule('system_memory_leak', {
      type: 'system',
      metric: 'memoryTrend',
      threshold: 10, // 10% increase per minute
      severity: 'warning',
      condition: 'above',
      duration: 300000,
      cooldown: 600000
    });
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(ruleId, rule) {
    this.alertRules.set(ruleId, {
      ...rule,
      id: ruleId,
      enabled: true,
      triggerCount: 0,
      lastTriggered: null,
      firstDetected: null
    });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId) {
    this.alertRules.delete(ruleId);
    this.activeAlerts.delete(ruleId);
  }

  /**
   * Start monitoring for alerts
   */
  startMonitoring() {
    // Monitor Web Vitals
    this.startWebVitalsMonitoring();

    // Monitor performance metrics
    this.startPerformanceMonitoring();

    // Monitor business metrics
    this.startBusinessMetricsMonitoring();

    // Monitor system health
    this.startSystemHealthMonitoring();
  }

  /**
   * Start Web Vitals monitoring
   */
  startWebVitalsMonitoring() {
    // Get current Web Vitals and check against thresholds
    setInterval(() => {
      const vitalsData = webVitalsService.getVitalsData();

      Object.entries(vitalsData).forEach(([metric, data]) => {
        if (data && typeof data.value === 'number') {
          this.checkMetric('webVitals', metric, data.value);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Monitor performance metrics
    setInterval(() => {
      // Simulate performance data collection
      const performanceData = this.collectPerformanceMetrics();

      Object.entries(performanceData).forEach(([metric, value]) => {
        this.checkMetric('performance', metric, value);
      });
    }, 60000); // Check every minute
  }

  /**
   * Start business metrics monitoring
   */
  startBusinessMetricsMonitoring() {
    setInterval(() => {
      const businessData = this.collectBusinessMetrics();

      Object.entries(businessData).forEach(([metric, value]) => {
        this.checkMetric('business', metric, value);
      });
    }, 300000); // Check every 5 minutes
  }

  /**
   * Start system health monitoring
   */
  startSystemHealthMonitoring() {
    setInterval(() => {
      const systemData = this.collectSystemMetrics();

      Object.entries(systemData).forEach(([metric, value]) => {
        this.checkMetric('system', metric, value);
      });
    }, 60000); // Check every minute
  }

  /**
   * Check metric against alert rules
   */
  checkMetric(type, metric, value) {
    this.alertRules.forEach((rule, ruleId) => {
      if (rule.type === type && rule.metric === metric && rule.enabled) {
        const shouldAlert = this.evaluateRule(rule, value);

        if (shouldAlert) {
          this.triggerAlert(ruleId, rule, value);
        } else {
          this.resolveAlert(ruleId, rule);
        }
      }
    });
  }

  /**
   * Evaluate if a rule should trigger an alert
   */
  evaluateRule(rule, value) {
    const { condition, threshold } = rule;

    switch (condition) {
      case 'above':
        return value > threshold;
      case 'below':
        return value < threshold;
      case 'equals':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  triggerAlert(ruleId, rule, value) {
    const now = Date.now();
    const existingAlert = this.activeAlerts.get(ruleId);

    // Check cooldown period
    if (this.cooldownPeriods.has(ruleId)) {
      const cooldownEnd = this.cooldownPeriods.get(ruleId);
      if (now < cooldownEnd) {
        return; // Still in cooldown
      }
    }

    // If alert doesn't exist, create it
    if (!existingAlert) {
      const alert = {
        id: ruleId,
        rule,
        value,
        firstDetected: now,
        lastTriggered: now,
        triggerCount: 1,
        status: 'active',
        acknowledged: false
      };

      this.activeAlerts.set(ruleId, alert);
      this.sendAlert(alert);

      // Update rule statistics
      rule.triggerCount++;
      rule.lastTriggered = now;
      if (!rule.firstDetected) {
        rule.firstDetected = now;
      }

    } else {
      // Update existing alert
      existingAlert.lastTriggered = now;
      existingAlert.triggerCount++;
      existingAlert.value = value;

      // Check if we should escalate
      this.checkEscalation(existingAlert);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(ruleId, rule) {
    const existingAlert = this.activeAlerts.get(ruleId);

    if (existingAlert && existingAlert.status === 'active') {
      existingAlert.status = 'resolved';
      existingAlert.resolvedAt = Date.now();

      // Send resolution notification
      this.sendAlertResolution(existingAlert);

      // Move to history and remove from active
      this.alertHistory.unshift(existingAlert);
      this.activeAlerts.delete(ruleId);

      // Set cooldown period
      this.cooldownPeriods.set(ruleId, Date.now() + rule.cooldown);
    }
  }

  /**
   * Send alert notification
   */
  sendAlert(alert) {
    const { rule, value, firstDetected } = alert;

    // Create alert message
    const alertData = {
      alert_id: alert.id,
      rule_type: rule.type,
      metric: rule.metric,
      threshold: rule.threshold,
      actual_value: value,
      severity: rule.severity,
      condition: rule.condition,
      first_detected: new Date(firstDetected).toISOString(),
      message: this.generateAlertMessage(alert)
    };

    // Send to Sentry
    sentryService.captureMessage(
      `Performance Alert: ${alertData.message}`,
      rule.severity === 'critical' ? 'error' : 'warning',
      {
        tags: {
          alert_type: 'performance',
          severity: rule.severity,
          metric: rule.metric
        },
        extra: alertData
      }
    );

    // Track in analytics
    analyticsService.trackEvent('performance_alert_triggered', alertData);

    // Send to configured notification channels
    this.notificationChannels.forEach(channel => {
      this.sendToChannel(channel, alertData);
    });

    // Log alert
    console.warn('Performance Alert:', alertData);
  }

  /**
   * Send alert resolution notification
   */
  sendAlertResolution(alert) {
    const resolutionData = {
      alert_id: alert.id,
      rule_type: alert.rule.type,
      metric: alert.rule.metric,
      duration: alert.resolvedAt - alert.firstDetected,
      trigger_count: alert.triggerCount,
      resolved_at: new Date(alert.resolvedAt).toISOString()
    };

    // Track resolution in analytics
    analyticsService.trackEvent('performance_alert_resolved', resolutionData);

    console.info('Performance Alert Resolved:', resolutionData);
  }

  /**
   * Check escalation rules
   */
  checkEscalation(alert) {
    const duration = Date.now() - alert.firstDetected;

    this.escalationRules.forEach(rule => {
      if (this.shouldEscalate(alert, rule, duration)) {
        this.escalateAlert(alert, rule);
      }
    });
  }

  /**
   * Determine if alert should be escalated
   */
  shouldEscalate(alert, escalationRule, duration) {
    // Check if escalation criteria are met
    const meetsCriteria =
      escalationRule.severity.includes(alert.rule.severity) &&
      duration >= escalationRule.duration &&
      alert.triggerCount >= escalationRule.triggerThreshold;

    // Check if we haven't escalated recently
    const hasRecentEscalation = escalationRule.lastTriggered &&
      (Date.now() - escalationRule.lastTriggered) < escalationRule.cooldown;

    return meetsCriteria && !hasRecentEscalation;
  }

  /**
   * Escalate alert
   */
  escalateAlert(alert, escalationRule) {
    escalationRule.lastTriggered = Date.now();

    const escalationData = {
      alert_id: alert.id,
      escalation_level: escalationRule.level,
      escalation_reason: escalationRule.reason,
      duration: Date.now() - alert.firstDetected,
      trigger_count: alert.triggerCount
    };

    // Send escalation notification
    sentryService.captureMessage(
      `Alert Escalated: ${alert.rule.metric} - ${escalationRule.reason}`,
      'error',
      {
        tags: {
          alert_escalation: true,
          escalation_level: escalationRule.level
        },
        extra: escalationData
      }
    );

    analyticsService.trackEvent('performance_alert_escalated', escalationData);
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(alert) {
    const { rule, value } = alert;
    const thresholds = this.defaultThresholds[rule.type]?.[rule.metric];
    const unit = thresholds?.unit || '';

    return `${rule.metric} is ${rule.condition} threshold: ${value}${unit} (threshold: ${rule.threshold}${unit})`;
  }

  /**
   * Send alert to notification channel
   */
  sendToChannel(channel, alertData) {
    // Implementation would depend on the notification channel
    // This is a placeholder for channel-specific implementations
    switch (channel.type) {
      case 'webhook':
        this.sendWebhook(channel, alertData);
        break;
      case 'email':
        this.sendEmail(channel, alertData);
        break;
      case 'slack':
        this.sendSlack(channel, alertData);
        break;
      default:
        console.log(`Unsupported notification channel: ${channel.type}`);
    }
  }

  /**
   * Collect performance metrics (placeholder)
   */
  collectPerformanceMetrics() {
    // This would integrate with actual performance monitoring
    return {
      responseTime: Math.random() * 1000,
      errorRate: Math.random() * 10,
      memoryUsage: Math.random() * 100,
      cpuUsage: Math.random() * 100,
      throughput: 50 + Math.random() * 50
    };
  }

  /**
   * Collect business metrics (placeholder)
   */
  collectBusinessMetrics() {
    return {
      conversionRate: 2 + Math.random() * 3,
      bounceRate: 60 + Math.random() * 30,
      sessionDuration: 120 + Math.random() * 180
    };
  }

  /**
   * Collect system metrics (placeholder)
   */
  collectSystemMetrics() {
    return {
      errorRate: Math.random() * 15,
      memoryTrend: Math.random() * 20 - 10
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get alert rules
   */
  getAlertRules() {
    return Array.from(this.alertRules.values());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();

      analyticsService.trackEvent('performance_alert_acknowledged', {
        alert_id: alertId,
        acknowledged_by: acknowledgedBy
      });
    }
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId, updates) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  /**
   * Enable/disable alert rule
   */
  toggleAlertRule(ruleId, enabled) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      active_alerts: this.activeAlerts.size,
      total_rules: this.alertRules.size,
      enabled_rules: Array.from(this.alertRules.values()).filter(r => r.enabled).length,
      notification_channels: this.notificationChannels.size,
      alert_history_size: this.alertHistory.length
    };
  }

  // Placeholder notification methods
  sendWebhook(channel, data) { /* Implementation needed */ }
  sendEmail(channel, data) { /* Implementation needed */ }
  sendSlack(channel, data) { /* Implementation needed */ }
}

// Create singleton instance
const performanceAlertsService = new PerformanceAlertsService();

export default performanceAlertsService;
export { PerformanceAlertsService };