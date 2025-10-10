# Secrets Management and Rotation Guide

This document provides comprehensive procedures for managing and rotating critical secrets in the TRVL Social V3 application. Following these procedures ensures security best practices and minimizes the impact of potential security incidents.

## Table of Contents

- [Overview](#overview)
- [Secret Classification](#secret-classification)
- [Rotation Schedule](#rotation-schedule)
- [General Rotation Procedures](#general-rotation-procedures)
- [Service-Specific Rotation Procedures](#service-specific-rotation-procedures)
- [Emergency Rotation](#emergency-rotation)
- [Verification and Testing](#verification-and-testing)
- [Audit and Compliance](#audit-and-compliance)

## Overview

### Why Rotate Secrets?

- **Minimize blast radius**: Limit the damage if a secret is compromised
- **Compliance requirements**: Meet security standards and regulations
- **Best practice**: Industry-standard security hygiene
- **Prevent accumulation**: Reduce the number of valid credentials over time

### Rotation Principles

1. **Never delete the old secret until the new one is verified working**
2. **Test in staging before production**
3. **Coordinate with team members** (especially for shared services)
4. **Document all rotations** in the security audit log
5. **Monitor for errors** after rotation

## Secret Classification

### Critical Secrets (Rotate every 90 days)

These secrets have the highest privilege level and can cause significant damage if compromised:

- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `STRIPE_SECRET_KEY` - Payment processing and financial data
- `JWT_SECRET` - Authentication token signing
- `SESSION_SECRET` - Session cookie signing
- `DATABASE_URL` - Direct database connection string

### High-Priority Secrets (Rotate every 6 months)

These secrets have significant but limited scope:

- `STRIPE_WEBHOOK_SECRET` - Webhook payload verification
- `RESEND_API_KEY` - Email sending capabilities
- `WHATSAPP_WEBHOOK_SECRET` - WhatsApp integration
- `DAILY_API_SECRET` - Video conferencing
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` - AI service access

### Standard Secrets (Rotate annually or as needed)

These secrets have limited scope or are less critical:

- `VITE_MAPBOX_ACCESS_TOKEN` - Map display (public-facing)
- `VITE_GA4_MEASUREMENT_ID` - Analytics
- `VITE_SENTRY_DSN` - Error tracking
- Development/staging API keys

### Public Credentials (Do not require regular rotation)

These are safe to expose in client-side code:

- `VITE_SUPABASE_ANON_KEY` - Public Supabase key (RLS-protected)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Public Stripe key
- Feature flags and configuration values

## Rotation Schedule

### Regular Schedule

| Secret Type | Frequency | Next Review |
|------------|-----------|-------------|
| Critical | Every 90 days | Set calendar reminder |
| High-Priority | Every 6 months | Set calendar reminder |
| Standard | Annually | Review yearly |

### Triggered Rotations

Rotate immediately if:

- **Security incident**: Suspected or confirmed compromise
- **Employee departure**: Team member with access leaves
- **Third-party breach**: Service provider reports a breach
- **Accidental exposure**: Secret committed to git, posted publicly, etc.
- **Compliance requirement**: Audit or regulation mandates rotation

## General Rotation Procedures

### Pre-Rotation Checklist

- [ ] Review current deployment status (avoid during high-traffic periods)
- [ ] Notify team members of planned rotation
- [ ] Have rollback plan ready
- [ ] Test rotation in staging environment first
- [ ] Ensure monitoring is active to detect issues

### Standard Rotation Process

1. **Generate New Secret**
   - Use service provider's dashboard/API
   - Follow service-specific instructions below
   - Document the creation date and purpose

2. **Update Staging Environment**
   - Add new secret to staging environment variables
   - Deploy and test thoroughly
   - Verify all integrations work with new secret

3. **Update Production Environment**
   - **Do not delete old secret yet**
   - Add new secret to production environment variables
   - Deploy the application
   - Monitor error rates and logs closely

4. **Verify Production**
   - Check application health metrics
   - Test critical user flows
   - Verify no increase in error rates
   - Confirm service integrations are working

5. **Deactivate Old Secret**
   - Wait 24-48 hours after successful deployment
   - Deactivate (don't delete) old secret in service provider
   - Monitor for any errors
   - If issues occur, quickly reactivate old secret

6. **Delete Old Secret**
   - After 7 days with no issues
   - Permanently delete old secret from service provider
   - Remove from staging/dev environments
   - Document completion in audit log

### Post-Rotation Checklist

- [ ] New secret working in production
- [ ] Old secret deactivated
- [ ] No error rate increase
- [ ] Team notified of completion
- [ ] Rotation documented in audit log
- [ ] Next rotation scheduled

## Service-Specific Rotation Procedures

### Supabase Service Role Key

**Criticality**: CRITICAL - Full database access

**Rotation Procedure**:

1. **Generate New Key** (Supabase Dashboard):
   - Navigate to Settings → API
   - Scroll to "Project API keys"
   - Click "Generate new service_role key"
   - Copy the new key immediately (shown only once)

2. **Update Vercel Environment Variables**:
   ```
   Project Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY
   ```
   - Click "Edit" next to the variable
   - Replace value with new key
   - Ensure scope includes Production, Preview, and Development
   - Click "Save"

3. **Trigger Redeployment**:
   - In Vercel, navigate to Deployments
   - Click "⋯" next to latest production deployment
   - Select "Redeploy"
   - Wait for deployment to complete

4. **Verify Integration**:
   ```bash
   # Test server-side Supabase operations
   # Check admin functions, RLS bypass operations
   ```
   - Test user creation
   - Test admin-level database queries
   - Check application logs for Supabase errors

5. **Revoke Old Key** (After 48 hours):
   - Return to Supabase Dashboard → Settings → API
   - Click "Revoke" next to old service_role key
   - Confirm revocation

**Rollback Procedure**:
- Re-add old key to Vercel environment variables
- Redeploy application
- Old key is valid until explicitly revoked

---

### Stripe Secret Key

**Criticality**: CRITICAL - Payment processing access

**Rotation Procedure**:

1. **Generate New Key** (Stripe Dashboard):
   - Navigate to Developers → API keys
   - Ensure you're in the correct mode (Test/Live)
   - Click "Create secret key"
   - Name it (e.g., "Production Server Key 2024-10")
   - Copy the key (starts with `sk_live_...` for production)

2. **Update Vercel Environment Variables**:
   ```
   Project Settings → Environment Variables → STRIPE_SECRET_KEY
   ```
   - Edit the variable with new key
   - Scope: Production only (use separate keys for preview/dev)
   - Click "Save"

3. **Trigger Redeployment**:
   - Redeploy via Vercel dashboard
   - Monitor deployment logs

4. **Verify Payment Integration**:
   - Process a test payment (use test card in production if available)
   - Verify webhook receipt
   - Check Stripe dashboard for successful API calls
   - Test refund functionality
   - Verify Stripe Connect operations (if applicable)

5. **Delete Old Key** (After 7 days):
   - Return to Stripe Dashboard → Developers → API keys
   - Click "⋯" next to old key
   - Select "Delete"
   - Confirm deletion

**Important Notes**:
- Never use the same key across test and live modes
- Maintain separate keys for different environments
- Monitor Stripe dashboard for unusual API activity

**Rollback Procedure**:
- Old key remains valid until explicitly deleted
- Re-add old key to environment variables
- Redeploy

---

### Stripe Webhook Secret

**Criticality**: HIGH - Webhook security

**Rotation Procedure**:

1. **Identify Current Endpoint**:
   - Navigate to Stripe Dashboard → Developers → Webhooks
   - Find your production endpoint (e.g., `https://trvlsocial.com/api/webhooks/stripe`)
   - Note the events it's listening to

2. **Create New Endpoint**:
   - Click "Add endpoint"
   - URL: Your webhook URL (same as before)
   - Events: Select the same events as current endpoint
   - Click "Add endpoint"

3. **Get New Signing Secret**:
   - Click on the new endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_...`)

4. **Update Vercel Environment Variables**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_new_secret_here
   ```
   - Update in Vercel dashboard
   - Redeploy application

5. **Verify Webhooks**:
   - Trigger test webhook from Stripe dashboard
   - Check application logs for successful receipt
   - Process a test payment and verify webhook delivery

6. **Disable Old Endpoint** (After 48 hours):
   - Return to Stripe Webhooks
   - Click on old endpoint
   - Click "..." → "Disable"
   - Monitor for 7 days

7. **Delete Old Endpoint** (After 7 days):
   - Click "..." → "Delete"
   - Confirm deletion

---

### JWT and Session Secrets

**Criticality**: CRITICAL - Authentication security

**Rotation Procedure**:

**Important**: JWT rotation requires careful planning as it invalidates all existing sessions!

**Planning Phase**:
1. Schedule during low-traffic period
2. Notify users of potential logout
3. Prepare customer support for increased inquiries

**Rotation Steps**:

1. **Generate New Secrets**:
   ```bash
   # Generate cryptographically secure random strings
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   - Generate new `JWT_SECRET`
   - Generate new `SESSION_SECRET`

2. **Implement Dual-Secret Support** (Recommended):
   ```javascript
   // Support both old and new JWT secrets temporarily
   const JWT_SECRET_PRIMARY = process.env.JWT_SECRET;
   const JWT_SECRET_SECONDARY = process.env.JWT_SECRET_OLD;
   ```

3. **Update Environment Variables**:
   - Add `JWT_SECRET_OLD` with current secret
   - Update `JWT_SECRET` with new secret
   - Add `SESSION_SECRET_OLD` with current secret
   - Update `SESSION_SECRET` with new secret

4. **Deploy with Dual Support**:
   - Application should verify tokens against both secrets
   - Issue new tokens with new secret
   - Accept old tokens for verification

5. **Monitor Grace Period**:
   - Wait 7-14 days (or your token expiration period)
   - Monitor for authentication errors
   - Track percentage of users on new tokens

6. **Remove Old Secrets**:
   - Delete `JWT_SECRET_OLD` and `SESSION_SECRET_OLD`
   - Redeploy to use only new secrets
   - All users with old tokens will be logged out

**Alternative (Immediate Rotation)**:
- Update secrets directly
- All users will be logged out immediately
- Send email notification about required re-login
- Monitor support channels closely

---

### Resend API Key

**Criticality**: HIGH - Email sending capabilities

**Rotation Procedure**:

1. **Generate New Key** (Resend Dashboard):
   - Navigate to [resend.com/api-keys](https://resend.com/api-keys)
   - Click "Create API Key"
   - Name: "Production Server 2024-10"
   - Permission: Full Access (or appropriate scope)
   - Copy the key

2. **Update Environment Variables**:
   ```
   RESEND_API_KEY=re_new_key_here
   ```

3. **Verify Email Sending**:
   - Trigger test email (password reset, welcome email, etc.)
   - Verify receipt in inbox
   - Check Resend dashboard for successful delivery
   - Test both transactional and bulk emails

4. **Delete Old Key** (After 48 hours):
   - Return to Resend dashboard
   - Click "Delete" on old key
   - Confirm deletion

---

### OpenAI / Anthropic API Keys

**Criticality**: HIGH - AI service access and costs

**OpenAI Rotation**:

1. **Generate New Key**:
   - Navigate to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Name: "Production 2024-10"
   - Copy the key

2. **Update Environment Variables**:
   ```
   OPENAI_API_KEY=sk-new_key_here
   VITE_OPENAI_API_KEY=sk-new_key_here  # Only if client-side access needed
   ```

3. **Verify AI Features**:
   - Test AI-powered features (recommendations, content generation, etc.)
   - Monitor OpenAI usage dashboard
   - Check for API errors in logs

4. **Revoke Old Key**:
   - Return to OpenAI dashboard
   - Click "Revoke" on old key

**Anthropic Rotation** (Similar Process):
- Navigate to [console.anthropic.com](https://console.anthropic.com)
- API Keys → Create Key
- Update `ANTHROPIC_API_KEY`
- Test Claude API integrations
- Delete old key

---

### Database Connection String

**Criticality**: CRITICAL - Direct database access

**Rotation Procedure**:

**Note**: This is typically handled by rotating the database password, not the entire URL.

1. **Create New Database User** (Recommended):
   ```sql
   -- In Supabase SQL Editor or PostgreSQL admin panel
   CREATE USER new_app_user WITH PASSWORD 'new_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE your_db TO new_app_user;
   ```

2. **Update Connection String**:
   ```
   # Old format
   DATABASE_URL=postgresql://old_user:old_pass@host:port/db

   # New format
   DATABASE_URL=postgresql://new_user:new_pass@host:port/db
   ```

3. **Update in Vercel**:
   - Add new `DATABASE_URL`
   - Redeploy application

4. **Verify Database Access**:
   - Test database queries
   - Verify migrations run successfully
   - Check connection pooling

5. **Remove Old User** (After 7 days):
   ```sql
   DROP USER old_app_user;
   ```

**Alternative (Password Reset)**:
- Reset password for existing user in Supabase
- Update connection string with new password
- Faster but less traceable

## Emergency Rotation

### When to Perform Emergency Rotation

- Secret leaked in public repository
- Security incident or breach detected
- Unauthorized access to admin panel
- Suspicious API usage patterns
- Employee with secret access terminated

### Emergency Rotation Process

**Immediate Actions (Within 1 hour)**:

1. **Assess the Situation**:
   - Identify which secrets are compromised
   - Determine scope of potential damage
   - Alert security team and stakeholders

2. **Revoke Immediately**:
   - For critical secrets, revoke old secret FIRST
   - This will cause service disruption but prevents further damage
   - Accept temporary downtime for security

3. **Generate and Deploy New Secret**:
   - Generate new secret immediately
   - Push to production with highest priority
   - Skip staging testing if necessary
   - Monitor deployment closely

4. **Communicate**:
   - Notify team via emergency channel (Slack, email)
   - Update status page if user-facing
   - Prepare customer support messaging

**Post-Incident (Within 24 hours)**:

5. **Full Audit**:
   - Review access logs for unusual activity
   - Check for unauthorized transactions/data access
   - Document timeline of events

6. **Comprehensive Rotation**:
   - Rotate all related secrets (not just compromised ones)
   - Review and update access controls
   - Implement additional monitoring

7. **Post-Mortem**:
   - Document what happened
   - How secret was exposed
   - Remediation steps taken
   - Process improvements to prevent recurrence

### Emergency Contact Procedure

1. **Technical Lead**: [Contact info]
2. **Security Team**: [Contact info]
3. **On-Call Engineer**: Use PagerDuty/on-call system
4. **Service Provider Support**: Have account numbers ready

## Verification and Testing

### Staging Environment Testing

Before rotating in production, test in staging:

```bash
# Example staging test checklist
✓ Update staging environment variable
✓ Deploy to staging
✓ Run automated test suite
✓ Manually test critical flows:
  - User authentication
  - Payment processing
  - API integrations
  - Email sending
  - Database operations
✓ Monitor staging logs for errors
✓ Verify 24 hours of stable operation
```

### Production Verification

After production rotation:

```bash
# Production verification checklist
✓ Check application health dashboard
✓ Monitor error tracking (Sentry)
✓ Review server logs
✓ Test critical user journeys:
  - Sign up / Login
  - Make a booking
  - Process a payment
  - Receive email notifications
✓ Verify webhook deliveries
✓ Check API response times
✓ Monitor for 48 hours minimum
```

### Automated Monitoring

Set up alerts for:

```javascript
// Example monitoring rules
- Error rate > 1% for service using rotated secret
- API authentication failures spike
- Webhook delivery failures
- Database connection errors
- Payment processing failures
```

## Audit and Compliance

### Rotation Log

Maintain a log of all secret rotations:

```markdown
# Secret Rotation Audit Log

## 2024-10-01 - SUPABASE_SERVICE_ROLE_KEY
- **Reason**: Scheduled 90-day rotation
- **Performed by**: [Engineer name]
- **Old key ID**: svc_abc123... (created 2024-07-01)
- **New key ID**: svc_xyz789... (created 2024-10-01)
- **Environments updated**: Production, Staging, Development
- **Issues encountered**: None
- **Verification completed**: 2024-10-03
- **Old key revoked**: 2024-10-03

## 2024-09-15 - STRIPE_SECRET_KEY
- **Reason**: Emergency rotation (suspected exposure in logs)
- **Performed by**: [Engineer name]
- **Details**: [Link to incident report]
...
```

### Compliance Requirements

**For SOC 2 / ISO 27001**:
- Document rotation procedures (this document)
- Maintain rotation schedule
- Log all rotations with timestamps
- Demonstrate adherence to schedule
- Regular audit of access controls

**For PCI DSS** (Payment Card Industry):
- Rotate encryption keys quarterly minimum
- Maintain strict access control to payment secrets
- Document all personnel with access to payment credentials
- Audit trail for all secret access

### Access Control Review

Quarterly review of who has access to secrets:

```markdown
# Secret Access Audit - Q4 2024

## Production Secrets Access
- Vercel Dashboard: [List of team members with access]
- Supabase Dashboard: [List of team members]
- Stripe Dashboard: [List of team members]
- Repository Access: [List of team members with repo access]

## Actions Taken
- Removed access for: [Former employee]
- Added access for: [New hire]
- Rotated secrets after access removal: YES
```

## Tools and Automation

### Secret Rotation Scripts

Consider creating automation for routine rotations:

```bash
# Example rotation script structure
./scripts/rotate-secret.sh --service=stripe --environment=staging
```

### Secret Scanning

Implement automated secret scanning:

```yaml
# GitHub Actions example
- name: Secret Scanning
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: main
    head: HEAD
```

### Monitoring Dashboard

Create a secrets dashboard showing:
- Last rotation date for each secret
- Next scheduled rotation
- Secrets approaching rotation deadline
- Recent rotation history

## Best Practices Summary

1. **Never expose secrets in code or version control**
2. **Use different secrets for different environments**
3. **Rotate on schedule, not just when compromised**
4. **Test rotations in staging first**
5. **Keep old secrets valid during transition period**
6. **Monitor closely after rotation**
7. **Document everything**
8. **Automate where possible**
9. **Maintain audit trail**
10. **Regular access control reviews**

## Additional Resources

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Environment variable configuration
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment procedures
- [SECURITY.md](../SECURITY.md) - General security guidelines
- Service-specific documentation:
  - [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod)
  - [Stripe Security](https://stripe.com/docs/security/guide)
  - [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Questions and Support

For questions about secret rotation:
- **Security Team**: security@trvlsocial.com
- **DevOps Team**: devops@trvlsocial.com
- **Emergency Hotline**: [Emergency contact]

Remember: When in doubt, rotate the secret. The cost of rotation is far less than the cost of a breach.
