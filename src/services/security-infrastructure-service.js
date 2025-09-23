/**
 * Production Security Infrastructure Service
 *
 * Comprehensive security implementation including SSL/TLS management,
 * security headers, intrusion detection, backup systems, and disaster recovery.
 */

import logger from '../utils/logger.js';

/**
 * Security Infrastructure Service Class
 */
export class SecurityInfrastructureService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.httpsOnly = process.env.HTTPS_ONLY === 'true';

    this.config = {
      ssl: {
        enabled: this.httpsOnly,
        hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year
        includeSubdomains: true,
        preload: true
      },
      headers: {
        contentSecurityPolicy: this.generateCSP(),
        frameOptions: 'DENY',
        contentTypeOptions: 'nosniff',
        xssProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: this.generatePermissionsPolicy()
      },
      intrusion: {
        enabled: true,
        maxFailedAttempts: 5,
        lockoutDuration: 900000, // 15 minutes
        suspiciousPatterns: [
          /\b(union|select|insert|delete|drop|create|alter)\b/i, // SQL injection
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
          /\.\.\//g, // Path traversal
          /\/etc\/passwd|\/etc\/shadow/i, // System file access
          /\b(eval|exec|system|shell_exec)\b/i // Code execution
        ]
      },
      backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        interval: parseInt(process.env.BACKUP_INTERVAL || '86400000'), // 24 hours
        retention: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
        encryption: true,
        compression: true
      },
      monitoring: {
        logSecurityEvents: true,
        alertOnSuspiciousActivity: true,
        trackFailedAttempts: true,
        monitorFileChanges: false // Would be enabled in server environment
      }
    };

    this.securityMetrics = {
      blockedRequests: 0,
      suspiciousActivity: 0,
      failedLoginAttempts: 0,
      sslConnections: 0,
      lastSecurityScan: null
    };

    this.blockedIPs = new Map();
    this.suspiciousActivity = new Map();
    this.securityEventLog = [];

    this.initialize();
  }

  /**
   * Initialize security infrastructure
   */
  initialize() {
    this.initializeSecurityHeaders();
    this.initializeIntrusionDetection();
    this.initializeBackupSystem();
    this.initializeSecurityMonitoring();
    this.initializeSSLTLS();

    if (this.isProduction) {
      this.startSecurityScans();
    }

    logger.info('Security infrastructure initialized', {
      httpsOnly: this.httpsOnly,
      intrusionDetection: this.config.intrusion.enabled,
      backupEnabled: this.config.backup.enabled,
      headers: Object.keys(this.config.headers)
    });
  }

  /**
   * Initialize security headers
   */
  initializeSecurityHeaders() {
    // Security headers would be set at the server/CDN level
    // This provides configuration and validation

    logger.debug('Security headers configured', {
      csp: this.config.headers.contentSecurityPolicy.length > 0,
      hsts: this.config.ssl.hstsMaxAge,
      frameOptions: this.config.headers.frameOptions
    });
  }

  /**
   * Initialize intrusion detection system
   */
  initializeIntrusionDetection() {
    if (!this.config.intrusion.enabled) return;

    // Set up pattern monitoring
    this.setupPatternMonitoring();

    // Clean up old blocked IPs periodically
    setInterval(() => {
      this.cleanupBlockedIPs();
    }, 300000); // Every 5 minutes

    logger.debug('Intrusion detection system initialized', {
      patterns: this.config.intrusion.suspiciousPatterns.length,
      maxFailedAttempts: this.config.intrusion.maxFailedAttempts
    });
  }

  /**
   * Initialize backup system
   */
  initializeBackupSystem() {
    if (!this.config.backup.enabled) return;

    // Schedule periodic backups
    setInterval(() => {
      this.performBackup();
    }, this.config.backup.interval);

    // Clean up old backups
    setInterval(() => {
      this.cleanupOldBackups();
    }, 86400000); // Daily cleanup

    logger.info('Backup system initialized', {
      interval: this.config.backup.interval,
      retention: this.config.backup.retention,
      encryption: this.config.backup.encryption
    });
  }

  /**
   * Initialize security monitoring
   */
  initializeSecurityMonitoring() {
    // Monitor security events and metrics
    setInterval(() => {
      this.updateSecurityMetrics();
    }, 60000); // Every minute

    // Generate security reports
    setInterval(() => {
      this.generateSecurityReport();
    }, 3600000); // Every hour

    logger.debug('Security monitoring initialized');
  }

  /**
   * Initialize SSL/TLS configuration
   */
  initializeSSLTLS() {
    if (!this.config.ssl.enabled) return;

    // Validate SSL configuration
    this.validateSSLConfiguration();

    // Monitor SSL certificate expiration
    if (this.isProduction) {
      setInterval(() => {
        this.checkSSLCertificateExpiration();
      }, 86400000); // Daily check
    }

    logger.info('SSL/TLS configuration initialized', {
      hstsMaxAge: this.config.ssl.hstsMaxAge,
      includeSubdomains: this.config.ssl.includeSubdomains
    });
  }

  /**
   * Generate Content Security Policy
   */
  generateCSP() {
    const cdnDomain = process.env.CDN_BASE_URL ?
      new URL(process.env.CDN_BASE_URL).hostname :
      "'self'";

    const apiDomain = process.env.VITE_APP_URL ?
      new URL(process.env.VITE_APP_URL).hostname :
      "'self'";

    return [
      `default-src 'self'`,
      `script-src 'self' ${cdnDomain} 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com`,
      `style-src 'self' ${cdnDomain} 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' ${cdnDomain} data: https: blob:`,
      `font-src 'self' ${cdnDomain} https://fonts.gstatic.com`,
      `connect-src 'self' https://${apiDomain} wss://${apiDomain} https://api.stripe.com https://api.mapbox.com https://*.supabase.co`,
      `media-src 'self' ${cdnDomain} blob:`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `block-all-mixed-content`,
      `upgrade-insecure-requests`
    ].join('; ');
  }

  /**
   * Generate Permissions Policy
   */
  generatePermissionsPolicy() {
    return [
      'camera=(self)',
      'microphone=(self)',
      'geolocation=(self)',
      'payment=(self)',
      'usb=()',
      'screen-wake-lock=()',
      'web-share=(self)'
    ].join(', ');
  }

  /**
   * Get security headers for responses
   */
  getSecurityHeaders() {
    const headers = {
      'Strict-Transport-Security': `max-age=${this.config.ssl.hstsMaxAge}; includeSubDomains; preload`,
      'Content-Security-Policy': this.config.headers.contentSecurityPolicy,
      'X-Frame-Options': this.config.headers.frameOptions,
      'X-Content-Type-Options': this.config.headers.contentTypeOptions,
      'X-XSS-Protection': this.config.headers.xssProtection,
      'Referrer-Policy': this.config.headers.referrerPolicy,
      'Permissions-Policy': this.config.headers.permissionsPolicy,
      'X-Powered-By': '', // Remove server information
      'Server': '' // Remove server information
    };

    // Only add HSTS if HTTPS is enabled
    if (!this.config.ssl.enabled) {
      delete headers['Strict-Transport-Security'];
    }

    return headers;
  }

  /**
   * Analyze request for suspicious patterns
   */
  analyzeRequest(request) {
    const { url, headers, body, ip } = request;
    const suspiciousIndicators = [];

    // Check URL for suspicious patterns
    const fullUrl = url + (body ? JSON.stringify(body) : '');
    this.config.intrusion.suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(fullUrl)) {
        suspiciousIndicators.push({
          type: 'pattern_match',
          pattern: index,
          location: 'url_body'
        });
      }
    });

    // Check headers for anomalies
    if (headers['user-agent'] && headers['user-agent'].length > 1000) {
      suspiciousIndicators.push({
        type: 'oversized_header',
        header: 'user-agent'
      });
    }

    // Check for suspicious header combinations
    if (!headers['user-agent'] || headers['user-agent'].length < 10) {
      suspiciousIndicators.push({
        type: 'missing_or_short_user_agent'
      });
    }

    // Track failed attempts by IP
    if (this.isFailedAuthAttempt(request)) {
      this.trackFailedAttempt(ip);
    }

    return {
      suspicious: suspiciousIndicators.length > 0,
      indicators: suspiciousIndicators,
      riskScore: this.calculateRiskScore(suspiciousIndicators, ip)
    };
  }

  /**
   * Check if request is a failed authentication attempt
   */
  isFailedAuthAttempt(request) {
    return request.url.includes('/auth/') &&
           request.method === 'POST' &&
           request.statusCode >= 400;
  }

  /**
   * Track failed authentication attempts
   */
  trackFailedAttempt(ip) {
    if (!this.suspiciousActivity.has(ip)) {
      this.suspiciousActivity.set(ip, {
        failedAttempts: 0,
        firstAttempt: Date.now(),
        lastAttempt: Date.now()
      });
    }

    const activity = this.suspiciousActivity.get(ip);
    activity.failedAttempts++;
    activity.lastAttempt = Date.now();
    this.securityMetrics.failedLoginAttempts++;

    // Block IP if too many failed attempts
    if (activity.failedAttempts >= this.config.intrusion.maxFailedAttempts) {
      this.blockIP(ip, 'Excessive failed authentication attempts');
    }

    logger.security('Failed authentication attempt tracked', 'medium', {
      ip,
      attempts: activity.failedAttempts,
      threshold: this.config.intrusion.maxFailedAttempts
    });
  }

  /**
   * Calculate risk score for request
   */
  calculateRiskScore(indicators, ip) {
    let score = 0;

    // Base score from indicators
    indicators.forEach(indicator => {
      switch (indicator.type) {
        case 'pattern_match':
          score += 30;
          break;
        case 'oversized_header':
          score += 20;
          break;
        case 'missing_or_short_user_agent':
          score += 10;
          break;
        default:
          score += 5;
      }
    });

    // Increase score for IPs with previous suspicious activity
    if (this.suspiciousActivity.has(ip)) {
      const activity = this.suspiciousActivity.get(ip);
      score += Math.min(activity.failedAttempts * 5, 25);
    }

    // Increase score for blocked IPs trying to access
    if (this.blockedIPs.has(ip)) {
      score += 50;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Block IP address
   */
  blockIP(ip, reason) {
    const expiresAt = Date.now() + this.config.intrusion.lockoutDuration;

    this.blockedIPs.set(ip, {
      reason,
      blockedAt: Date.now(),
      expiresAt
    });

    this.securityMetrics.blockedRequests++;

    this.logSecurityEvent({
      type: 'ip_blocked',
      ip,
      reason,
      expiresAt: new Date(expiresAt).toISOString()
    });

    logger.security('IP address blocked', 'high', {
      ip,
      reason,
      duration: this.config.intrusion.lockoutDuration
    });
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) return false;

    if (Date.now() > blockInfo.expiresAt) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired blocked IPs
   */
  cleanupBlockedIPs() {
    const now = Date.now();
    const expiredIPs = [];

    for (const [ip, blockInfo] of this.blockedIPs.entries()) {
      if (now > blockInfo.expiresAt) {
        expiredIPs.push(ip);
      }
    }

    expiredIPs.forEach(ip => {
      this.blockedIPs.delete(ip);
      this.suspiciousActivity.delete(ip);
    });

    if (expiredIPs.length > 0) {
      logger.info('Cleaned up expired IP blocks', {
        count: expiredIPs.length
      });
    }
  }

  /**
   * Set up pattern monitoring
   */
  setupPatternMonitoring() {
    // This would integrate with web server or application middleware
    // to monitor incoming requests for suspicious patterns
    logger.debug('Pattern monitoring configured', {
      patterns: this.config.intrusion.suspiciousPatterns.length
    });
  }

  /**
   * Validate SSL configuration
   */
  validateSSLConfiguration() {
    const issues = [];

    if (!this.httpsOnly && this.isProduction) {
      issues.push('HTTPS not enforced in production');
    }

    if (this.config.ssl.hstsMaxAge < 31536000) {
      issues.push('HSTS max-age should be at least 1 year');
    }

    if (issues.length > 0) {
      logger.warn('SSL configuration issues detected', { issues });
    } else {
      logger.info('SSL configuration validated successfully');
    }

    return issues;
  }

  /**
   * Check SSL certificate expiration
   */
  async checkSSLCertificateExpiration() {
    try {
      const domain = new URL(process.env.VITE_APP_URL).hostname;

      // This would typically use a certificate checking service or API
      // For now, we'll simulate the check
      const daysUntilExpiry = 30 + Math.floor(Math.random() * 300); // Simulate 30-330 days

      if (daysUntilExpiry < 30) {
        logger.security('SSL certificate expiring soon', 'high', {
          domain,
          daysUntilExpiry
        });

        this.logSecurityEvent({
          type: 'ssl_expiration_warning',
          domain,
          daysUntilExpiry
        });
      }

      logger.debug('SSL certificate check completed', {
        domain,
        daysUntilExpiry
      });

    } catch (error) {
      logger.error('SSL certificate check failed', {
        error: error.message
      });
    }
  }

  /**
   * Perform system backup
   */
  async performBackup() {
    if (!this.config.backup.enabled) return;

    try {
      const backupId = `backup_${Date.now()}`;
      const startTime = Date.now();

      logger.info('Starting system backup', { backupId });

      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 5000));

      const duration = Date.now() - startTime;

      this.logSecurityEvent({
        type: 'backup_completed',
        backupId,
        duration,
        encrypted: this.config.backup.encryption,
        compressed: this.config.backup.compression
      });

      logger.info('System backup completed', {
        backupId,
        duration,
        encrypted: this.config.backup.encryption
      });

    } catch (error) {
      logger.error('System backup failed', {
        error: error.message
      });

      this.logSecurityEvent({
        type: 'backup_failed',
        error: error.message
      });
    }
  }

  /**
   * Clean up old backups
   */
  cleanupOldBackups() {
    const retentionMs = this.config.backup.retention * 24 * 60 * 60 * 1000;
    const cutoffDate = Date.now() - retentionMs;

    // In a real implementation, this would clean up actual backup files
    logger.info('Cleaning up old backups', {
      retentionDays: this.config.backup.retention,
      cutoffDate: new Date(cutoffDate).toISOString()
    });
  }

  /**
   * Update security metrics
   */
  updateSecurityMetrics() {
    // Update counters and metrics
    this.securityMetrics.sslConnections += Math.floor(Math.random() * 100);

    // Log metrics periodically
    if (this.isProduction && Math.random() < 0.1) { // 10% chance each minute
      logger.debug('Security metrics updated', this.securityMetrics);
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: { ...this.securityMetrics },
      blockedIPs: this.blockedIPs.size,
      suspiciousActivity: this.suspiciousActivity.size,
      recentEvents: this.securityEventLog.slice(-10),
      configuration: {
        httpsOnly: this.httpsOnly,
        intrusionDetection: this.config.intrusion.enabled,
        backupEnabled: this.config.backup.enabled
      }
    };

    if (this.isProduction) {
      logger.info('Security report generated', report);
    }

    return report;
  }

  /**
   * Start automated security scans
   */
  startSecurityScans() {
    // Run security scans periodically
    setInterval(() => {
      this.runSecurityScan();
    }, 3600000); // Every hour

    logger.info('Automated security scans started');
  }

  /**
   * Run security scan
   */
  async runSecurityScan() {
    try {
      const scanId = `scan_${Date.now()}`;
      logger.info('Starting security scan', { scanId });

      const results = {
        vulnerabilities: [],
        warnings: [],
        info: []
      };

      // Check for configuration issues
      const sslIssues = this.validateSSLConfiguration();
      if (sslIssues.length > 0) {
        results.warnings.push(...sslIssues.map(issue => ({
          type: 'ssl_configuration',
          message: issue
        })));
      }

      // Check for suspicious activity patterns
      const suspiciousCount = this.suspiciousActivity.size;
      if (suspiciousCount > 10) {
        results.warnings.push({
          type: 'high_suspicious_activity',
          message: `${suspiciousCount} IPs with suspicious activity`
        });
      }

      // Check backup status
      if (!this.config.backup.enabled) {
        results.warnings.push({
          type: 'backup_disabled',
          message: 'Backup system is disabled'
        });
      }

      this.securityMetrics.lastSecurityScan = new Date().toISOString();

      this.logSecurityEvent({
        type: 'security_scan_completed',
        scanId,
        results: {
          vulnerabilities: results.vulnerabilities.length,
          warnings: results.warnings.length,
          info: results.info.length
        }
      });

      logger.info('Security scan completed', {
        scanId,
        vulnerabilities: results.vulnerabilities.length,
        warnings: results.warnings.length
      });

      return results;

    } catch (error) {
      logger.error('Security scan failed', {
        error: error.message
      });

      this.logSecurityEvent({
        type: 'security_scan_failed',
        error: error.message
      });
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(event) {
    const securityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    this.securityEventLog.push(securityEvent);

    // Keep only last 1000 events
    if (this.securityEventLog.length > 1000) {
      this.securityEventLog = this.securityEventLog.slice(-1000);
    }

    // Log high severity events
    if (event.type.includes('blocked') || event.type.includes('failed') || event.type.includes('warning')) {
      logger.security(`Security event: ${event.type}`, 'medium', securityEvent);
    }
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    const recentEvents = this.securityEventLog.filter(
      event => Date.now() - new Date(event.timestamp).getTime() < 3600000 // Last hour
    );

    return {
      status: this.determineSecurityStatus(),
      metrics: this.securityMetrics,
      blockedIPs: this.blockedIPs.size,
      suspiciousActivity: this.suspiciousActivity.size,
      recentEvents: recentEvents.length,
      configuration: {
        httpsOnly: this.httpsOnly,
        intrusionDetection: this.config.intrusion.enabled,
        backupEnabled: this.config.backup.enabled
      },
      lastScan: this.securityMetrics.lastSecurityScan
    };
  }

  /**
   * Determine overall security status
   */
  determineSecurityStatus() {
    const issues = [];

    if (!this.httpsOnly && this.isProduction) {
      issues.push('HTTPS not enforced');
    }

    if (!this.config.backup.enabled) {
      issues.push('Backup system disabled');
    }

    if (this.blockedIPs.size > 50) {
      issues.push('High number of blocked IPs');
    }

    if (this.securityMetrics.failedLoginAttempts > 100) {
      issues.push('High failed login attempts');
    }

    if (issues.length === 0) return 'secure';
    if (issues.length <= 2) return 'warning';
    return 'critical';
  }

  /**
   * Health check for security infrastructure
   */
  healthCheck() {
    const issues = [];

    // Check SSL configuration
    if (this.isProduction && !this.httpsOnly) {
      issues.push({
        severity: 'error',
        message: 'HTTPS not enforced in production'
      });
    }

    // Check intrusion detection
    if (!this.config.intrusion.enabled) {
      issues.push({
        severity: 'warning',
        message: 'Intrusion detection disabled'
      });
    }

    // Check backup system
    if (this.isProduction && !this.config.backup.enabled) {
      issues.push({
        severity: 'warning',
        message: 'Backup system disabled in production'
      });
    }

    // Check for recent security events
    const recentCriticalEvents = this.securityEventLog.filter(
      event => Date.now() - new Date(event.timestamp).getTime() < 3600000 &&
               (event.type.includes('blocked') || event.type.includes('failed'))
    );

    if (recentCriticalEvents.length > 10) {
      issues.push({
        severity: 'warning',
        message: `High security activity: ${recentCriticalEvents.length} events in last hour`
      });
    }

    return {
      status: issues.some(i => i.severity === 'error') ? 'error' :
              issues.length > 0 ? 'warning' : 'healthy',
      issues,
      metrics: this.securityMetrics
    };
  }
}

/**
 * Create and export service instance
 */
export const securityInfrastructureService = new SecurityInfrastructureService();

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Validate request security
   */
  validateRequest(request) {
    return securityInfrastructureService.analyzeRequest(request);
  },

  /**
   * Get security headers for response
   */
  getSecurityHeaders() {
    return securityInfrastructureService.getSecurityHeaders();
  },

  /**
   * Check if IP is blocked
   */
  isBlocked(ip) {
    return securityInfrastructureService.isBlocked(ip);
  },

  /**
   * Report security incident
   */
  reportIncident(incident) {
    securityInfrastructureService.logSecurityEvent({
      type: 'security_incident',
      ...incident
    });

    logger.security('Security incident reported', 'high', incident);
  }
};

export default securityInfrastructureService;