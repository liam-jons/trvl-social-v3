# 🔄 API Key Rotation Procedures and Schedule

**Status**: ACTIVE - Rotation procedures implemented
**Updated**: 2025-09-20T12:00:00Z
**Next Review**: 2025-12-20 (Quarterly)

## 🗓️ Rotation Schedule

### Mandatory Rotation Events
- **Quarterly**: All production API keys (every 90 days)
- **Immediately**: Upon exposure or suspected compromise
- **Annually**: Long-term service tokens and certificates
- **On Departure**: When team members with key access leave

### Service-Specific Schedules

| Service | Standard Rotation | Emergency Rotation | Max Lifetime |
|---------|------------------|-------------------|--------------|
| Anthropic | 90 days | Immediate | 6 months |
| Stripe | 90 days | 2 hours | 1 year |
| Mapbox | 180 days | 24 hours | 1 year |
| WhatsApp | 90 days | 12 hours | 6 months |
| Daily.co | 90 days | 24 hours | 1 year |
| Sentry | 180 days | 24 hours | 1 year |
| Mixpanel | 180 days | 24 hours | 1 year |
| Datadog | 90 days | 12 hours | 6 months |

## 🔄 Rotation Procedures

### Pre-Rotation Checklist
- [ ] Verify new key generation is available for service
- [ ] Confirm service downtime window (if required)
- [ ] Prepare rollback plan with current credentials
- [ ] Notify team of upcoming rotation
- [ ] Schedule rotation during low-traffic hours

### Standard Rotation Process

#### 1. Generate New Credentials
```bash
# Check current credential status
node scripts/credential-management.js status

# Document current keys (for rollback)
node scripts/credential-management.js backup
```

#### 2. Service-by-Service Rotation

##### Anthropic API Key
```bash
# 1. Generate new key at: https://console.anthropic.com/settings/keys
# 2. Test new key functionality
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: NEW_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "Test"}]}'

# 3. Store new key securely
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.rotateCredential('anthropic_api_key', 'NEW_API_KEY');
"

# 4. Verify application functionality
npm run test:integration:ai

# 5. Revoke old key in Anthropic console
```

##### Stripe API Keys
```bash
# 1. Generate new keys at: https://dashboard.stripe.com/apikeys
# 2. Test new keys
curl https://api.stripe.com/v1/customers \
  -u "NEW_SECRET_KEY:"

# 3. Store new keys
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.rotateCredential('stripe_publishable_key', 'pk_live_NEW_KEY');
await manager.rotateCredential('stripe_secret_key', 'sk_live_NEW_KEY');
"

# 4. Update webhook endpoints if secret changed
# 5. Test payment processing
npm run test:integration:payments

# 6. Revoke old keys in Stripe dashboard
```

##### Mapbox Access Token
```bash
# 1. Create new token at: https://account.mapbox.com/access-tokens/
# 2. Test token functionality
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=NEW_TOKEN"

# 3. Store new token
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.rotateCredential('mapbox_access_token', 'pk.NEW_TOKEN');
"

# 4. Test map functionality
npm run test:integration:maps

# 5. Delete old token in Mapbox console
```

#### 3. Post-Rotation Verification
```bash
# Run comprehensive integration tests
npm run test:integration

# Check all services are functional
node scripts/credential-management.js test

# Verify no service disruptions
npm run test:e2e:critical-paths

# Monitor error rates for 24 hours
```

### Emergency Rotation Process

#### Immediate Response (0-15 minutes)
```bash
# 1. Identify compromised credential
COMPROMISED_SERVICE="anthropic_api_key"  # Example

# 2. Generate new credential immediately
# Follow service-specific generation steps above

# 3. Emergency rotation
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.rotateCredential('$COMPROMISED_SERVICE', 'NEW_EMERGENCY_KEY');
console.log('Emergency rotation complete');
"

# 4. Immediate revocation of old key
# Access service provider console and revoke/delete old key
```

#### Verification (15-30 minutes)
```bash
# Test critical functionality
npm run test:integration:$SERVICE

# Monitor application for errors
tail -f logs/application.log | grep -i error

# Check credential access logs
node scripts/check-credential-logs.js --since="1 hour ago"
```

#### Follow-up (30-60 minutes)
```bash
# Full integration test suite
npm run test:integration

# Security incident documentation
node scripts/generate-incident-report.js --credential=$COMPROMISED_SERVICE

# Team notification
node scripts/notify-team.js --incident=credential-rotation --service=$COMPROMISED_SERVICE
```

## 🔔 Automated Monitoring and Alerts

### Credential Expiration Monitoring
```bash
# Cron job: Check credential ages daily
0 9 * * * cd /app && node scripts/check-credential-ages.js

# Alert when credentials approach expiration (30 days)
# Alert when credentials are overdue for rotation
```

### Usage Anomaly Detection
```bash
# Monitor API usage patterns
# Alert on unusual access patterns
# Detect potential credential misuse
```

### Example monitoring script:
```javascript
// scripts/credential-monitoring.js
import { CredentialManager } from './credential-management.js';

class CredentialMonitor {
  async checkExpirations() {
    const credentials = await this.getAllCredentials();
    const expiringCredentials = credentials.filter(cred =>
      cred.daysSinceRotation > 60 && cred.daysSinceRotation < 90
    );

    if (expiringCredentials.length > 0) {
      await this.sendAlert('CREDENTIALS_EXPIRING', expiringCredentials);
    }
  }

  async checkUsageAnomalies() {
    const usageLogs = await this.getUsageLogs(24); // Last 24 hours
    const anomalies = this.detectAnomalies(usageLogs);

    if (anomalies.length > 0) {
      await this.sendAlert('USAGE_ANOMALY', anomalies);
    }
  }
}
```

## 📋 Rotation Documentation Template

### Rotation Record Template
```markdown
# Credential Rotation Record

**Date**: YYYY-MM-DD HH:MM:SS UTC
**Service**: [Service Name]
**Credential Type**: [API Key/Token/Secret]
**Rotation Type**: [Scheduled/Emergency]
**Performed By**: [Team Member]

## Pre-Rotation State
- Old Key ID: [Last 4 characters only]
- Last Rotation: [Previous rotation date]
- Reason: [Scheduled/Compromise/Departure/etc.]

## Rotation Process
- [ ] New key generated
- [ ] New key tested
- [ ] New key stored in vault
- [ ] Application functionality verified
- [ ] Old key revoked
- [ ] Team notified

## Post-Rotation Verification
- [ ] Integration tests passed
- [ ] No service disruptions detected
- [ ] Error rates normal
- [ ] 24-hour monitoring completed

## Notes
[Any issues encountered, special procedures used, etc.]
```

## 🚨 Emergency Contacts and Escalation

### Primary Contacts
- **Security Team Lead**: security@trvlsocial.com
- **DevOps Lead**: devops@trvlsocial.com
- **CTO**: cto@trvlsocial.com

### Service Provider Emergency Contacts
- **Anthropic**: https://support.anthropic.com (Critical: < 2 hours)
- **Stripe**: https://support.stripe.com (Critical: < 1 hour)
- **Supabase**: https://supabase.com/support (Critical: < 4 hours)

### Escalation Matrix
1. **Immediate** (0-15 min): Rotate credential, revoke old key
2. **Short-term** (15-60 min): Verify functionality, monitor systems
3. **Medium-term** (1-4 hours): Document incident, review access logs
4. **Long-term** (4-24 hours): Security review, process improvements

## 🔧 Automation Tools

### Rotation Automation Scripts
```bash
# scripts/automated-rotation.js
# - Checks rotation schedules
# - Generates new credentials when possible
# - Tests new credentials
# - Performs rotation with rollback capability
# - Sends notifications

# scripts/credential-age-checker.js
# - Monitors credential ages
# - Sends expiration alerts
# - Generates rotation reports

# scripts/usage-monitor.js
# - Tracks API usage patterns
# - Detects anomalies
# - Alerts on suspicious activity
```

### Integration with CI/CD
```yaml
# .github/workflows/credential-check.yml
name: Credential Age Check
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:

jobs:
  check-credentials:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check credential ages
        run: node scripts/check-credential-ages.js
      - name: Alert if credentials expiring
        if: ${{ env.CREDENTIALS_EXPIRING }}
        run: node scripts/send-rotation-alerts.js
```

## 📊 Rotation Metrics and KPIs

### Key Metrics
- **Average Rotation Time**: Target < 30 minutes
- **Rotation Success Rate**: Target > 99%
- **Mean Time to Rotate** (MTTR): Target < 2 hours for emergency
- **Compliance Rate**: Target 100% (no overdue rotations)

### Monthly Reporting
- Number of rotations performed
- Emergency vs. scheduled rotations
- Time to complete rotations
- Service disruptions during rotation
- Compliance with rotation schedule

## 🔐 Security Best Practices

### During Rotation
1. **Never** commit new credentials to version control
2. **Always** test new credentials before storing
3. **Immediately** revoke old credentials after rotation
4. **Monitor** for 24 hours post-rotation
5. **Document** all rotation activities

### Access Controls
- Only authorized personnel can perform rotations
- All rotations require two-person approval for production
- Emergency rotations can be performed by on-call engineer
- All rotation activities are logged and audited

### Rollback Procedures
```bash
# Emergency rollback if new credentials fail
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.rollbackCredential('service_name', 'backup_key_id');
"

# Restore from backup within 1-hour window
# Monitor system recovery
# Investigate rotation failure
```

---

**🔄 AUTOMATION STATUS**:
- ✅ Monitoring scripts deployed
- ✅ Expiration alerting active
- ✅ Usage anomaly detection configured
- ✅ Emergency rotation procedures tested
- ⏳ Automated rotation (Phase 2)