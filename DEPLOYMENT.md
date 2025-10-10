# Production Deployment Checklist

## Pre-Deployment Security Audit

### 🔒 Environment Configuration

#### Environment Variable Setup

This application uses **type-safe environment validation** that will fail the build if required variables are missing. Follow these steps for production deployment:

**Pre-Deployment Checklist:**

- [ ] All environment variables properly configured in production hosting provider
- [ ] No test/placeholder API keys in production environment
- [ ] Production keys use live mode (not test mode):
  - [ ] `STRIPE_SECRET_KEY` uses `sk_live_...` (not `sk_test_...`)
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` uses `pk_live_...` (not `pk_test_...`)
- [ ] Database connection strings use production credentials
- [ ] Service role keys are server-side only (no `VITE_` prefix)
- [ ] HTTPS enforced for all endpoints
- [ ] Security headers properly configured

**Required Production Environment Variables:**

Critical variables that must be set (application will not build without these):

```bash
# Supabase (Required)
VITE_SUPABASE_PROJECT_ID=your-production-project-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only!

# Stripe (Required)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live mode!
STRIPE_SECRET_KEY=sk_live_...  # Live mode, server-side only!
STRIPE_WEBHOOK_SECRET=whsec_...  # Production webhook secret
STRIPE_CONNECT_CLIENT_ID=ca_...  # For marketplace features

# Maps (Required)
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...

# Application Config (Required)
VITE_APP_URL=https://trvlsocial.com  # Production URL
VITE_APP_NAME="TRVL Social"
VITE_APP_VERSION=3.0.0
NODE_ENV=production
```

**Recommended Production Environment Variables:**

For monitoring, analytics, and enhanced features:

```bash
# Error Tracking & Monitoring
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Analytics
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_MIXPANEL_TOKEN=your-token

# Email Service
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=noreply@trvlsocial.com
EMAIL_FROM_NAME="TRVL Social"

# Security
JWT_SECRET=your-cryptographically-secure-random-string
SESSION_SECRET=your-cryptographically-secure-random-string
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MINUTES=1
```

**Setting Environment Variables in Vercel:**

1. Navigate to Project Settings → Environment Variables
2. Add each variable with scope set to "Production"
3. For secrets (service role keys, JWT secrets), ensure they have no `VITE_` prefix
4. Click "Save" after each variable
5. Trigger a new deployment to apply changes

**Setting Environment Variables in Other Platforms:**

- **AWS Amplify**: App Settings → Environment variables
- **Netlify**: Site Settings → Environment variables
- **Railway**: Variables tab in project settings
- **Render**: Environment tab in service settings

**Environment Variable Validation:**

The application validates environment variables at build time using `@t3-oss/env-core`. If validation fails:

1. Check deployment logs for specific missing variables:
   ```
   Environment validation failed:
   {
     VITE_SUPABASE_URL: [ 'Required' ]
   }
   ```
2. Add the missing variable to your hosting provider's environment settings
3. Redeploy the application

**Documentation:**
- [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) - Complete configuration guide
- [Secrets Management Guide](docs/SECRETS_MANAGEMENT.md) - Secret rotation procedures

### 🗄️ Database Security & Migration

**Database Migration Status: ✅ COMPLETE**

- [x] All 42 migrations applied successfully (Task 43.1-43.3)
- [x] 106 tables created with V3 schema
- [x] Row-level security (RLS) enabled on all tables (200+ policies)
- [x] 100+ triggers installed for automation
- [x] Storage buckets configured (4 buckets)
- [x] Database schema verified and production-ready
- [ ] Index optimization migration applied (Task 43.6 - Ready to apply)
- [ ] Connection pooling enabled (Task 43.7 - Ready to configure)
- [x] Database backups configured (automatic via Supabase)
- [x] Sensitive data encrypted at rest
- [x] Database access logs enabled

**Pre-Launch Database Tasks:**
1. Apply index optimization: `supabase/migrations/20251001190000_optimize_production_indexes.sql`
2. Enable connection pooling in Supabase Dashboard (Settings → Database)
3. Configure pool mode to "Transaction" with 15-20 max connections
4. Update environment variable to use pooled connection (port 6543)

**Documentation:**
- See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for complete migration strategy
- See [INDEX_OPTIMIZATION_STRATEGY.md](docs/INDEX_OPTIMIZATION_STRATEGY.md) for index details
- See [CONNECTION_POOLING_GUIDE.md](docs/CONNECTION_POOLING_GUIDE.md) for pooling setup
- See [V1_MIGRATION_ASSESSMENT.md](docs/V1_MIGRATION_ASSESSMENT.md) for migration assessment

### 🔐 Authentication & Authorization

- [ ] JWT secrets rotated and secured
- [ ] Multi-factor authentication enabled for admin accounts
- [ ] Role-based access control properly implemented
- [ ] Session timeout configured appropriately
- [ ] Password policies enforced

## Content & Asset Verification

### 📝 Content Audit

- [ ] All Lorem ipsum text replaced with production copy
- [ ] "Coming soon" messages updated to professional language
- [ ] Placeholder usernames/profiles replaced
- [ ] Marketing copy reviewed and approved
- [ ] Legal disclaimers and terms updated

### 🖼️ Image Assets

- [ ] External image dependencies migrated to local storage
- [ ] Image optimization pipeline configured
- [ ] Supabase storage buckets set up and secured
- [ ] Image loading performance tested
- [ ] Lazy loading implemented where appropriate

### ✉️ Email Configuration

- [ ] Resend API configured with production credentials
- [ ] Email templates tested and reviewed
- [ ] Sender reputation configured
- [ ] Email delivery monitoring set up
- [ ] Bounce and complaint handling implemented

## Technical Infrastructure

### ⚡ Performance

- [ ] Bundle size optimized and analyzed
- [ ] Critical resources preloaded
- [ ] Code splitting implemented
- [ ] CDN configured for static assets
- [ ] Caching strategies implemented

### 📊 Monitoring & Logging

- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Security monitoring alerts set up
- [ ] Database query performance monitored
- [ ] Rate limiting configured and tested

### 🧪 Testing

- [ ] All unit tests passing
- [ ] Integration tests validated
- [ ] End-to-end tests completed
- [ ] Security tests executed
- [ ] Load testing performed

## Compliance & Legal

### 👤 Age Verification

- [ ] Age verification system fully implemented (18+ requirement)
- [ ] Age verification encryption and security measures in place
- [ ] Privacy policy updated for age requirements
- [ ] Staff training completed on age verification compliance

### 🛡️ Data Protection

- [ ] Privacy policy published and accessible
- [ ] Cookie consent banner implemented
- [ ] Data retention policies configured
- [ ] User data export functionality tested
- [ ] Data deletion procedures implemented

### 💳 Payment Security

- [ ] PCI DSS compliance verified
- [ ] Stripe webhook signatures validated
- [ ] Payment audit trails configured
- [ ] Refund procedures tested
- [ ] Fraud detection enabled

## Service Integrations

### 📨 Email Services

- [ ] Resend integration tested in production environment
- [ ] Email templates rendering correctly
- [ ] Delivery tracking configured
- [ ] Spam prevention measures in place
- [ ] Unsubscribe mechanisms working

### 💰 Payment Processing

- [ ] Stripe production keys configured
- [ ] Webhook endpoints secured and tested
- [ ] Split payment functionality validated
- [ ] Currency handling tested
- [ ] Invoice generation working

### 🗂️ File Storage

- [ ] Supabase storage buckets configured
- [ ] File upload limits enforced
- [ ] Image resizing pipeline working
- [ ] Access controls properly configured
- [ ] Backup procedures for uploaded files

## Launch Preparation

### 🌐 Domain & DNS

- [ ] Production domain configured
- [ ] SSL certificate installed and valid
- [ ] DNS records properly configured
- [ ] CDN endpoints configured
- [ ] Email domain authentication (SPF, DKIM, DMARC)

### 📱 PWA Configuration

- [ ] Service worker properly configured
- [ ] App manifest validated
- [ ] Offline functionality tested
- [ ] Push notifications set up
- [ ] Install prompts working

### 🚀 Deployment Pipeline

- [ ] CI/CD pipeline configured for production
- [ ] Automated testing in pipeline
- [ ] Database migration scripts ready
- [ ] Rollback procedures documented
- [ ] Deployment monitoring configured

## Post-Launch Monitoring

### 📈 Analytics

- [ ] User analytics tracking configured
- [ ] Conversion funnel monitoring set up
- [ ] A/B testing framework ready
- [ ] Performance metrics baseline established
- [ ] Business metrics tracking enabled

### 🔍 Security Monitoring

- [ ] Security incident response plan documented
- [ ] Vulnerability scanning scheduled
- [ ] Access log monitoring configured
- [ ] Intrusion detection enabled
- [ ] Security alert notifications set up

### 📞 Support Infrastructure

- [ ] Customer support email configured (support@trvlsocial.com)
- [ ] Help documentation published
- [ ] FAQ section populated
- [ ] Escalation procedures documented
- [ ] Support ticket system configured

## Final Verification

### ✅ Pre-Launch Checklist

- [ ] All placeholder content replaced
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Legal review completed
- [ ] Stakeholder approval obtained

### 🎯 Launch Readiness

- [ ] Launch communication plan ready
- [ ] Support team briefed
- [ ] Monitoring dashboards configured
- [ ] Emergency contacts available
- [ ] Post-launch review scheduled

## Environment Variable Security

### Secret Rotation Schedule

Regular secret rotation is critical for security. Follow these schedules:

**Critical Secrets (Every 90 days):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `DATABASE_URL` credentials

**High-Priority Secrets (Every 6 months):**
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- AI service API keys

**Standard Secrets (Annually or as needed):**
- Analytics tokens
- Public API tokens

**Emergency Rotation Triggers:**
- Security incident or suspected compromise
- Employee with access departs
- Secret accidentally exposed (committed to git, posted publicly, etc.)
- Service provider reports a breach

**Rotation Procedures:**

See [Secrets Management Guide](docs/SECRETS_MANAGEMENT.md) for detailed rotation procedures for each service.

**General Rotation Steps:**
1. Generate new secret in service provider dashboard
2. Update staging environment and test thoroughly
3. Update production environment (keep old secret active)
4. Deploy and verify application functionality
5. Monitor for 24-48 hours
6. Deactivate old secret
7. After 7 days with no issues, delete old secret permanently
8. Document rotation in security audit log

### Secret Security Best Practices

**Client vs Server Variables:**

- **Client Variables** (`VITE_` prefix): Embedded in client bundle, safe to expose
  - ✅ Public keys: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY`
  - ✅ Configuration: `VITE_APP_URL`, feature flags
  - ❌ Never use `VITE_` prefix for secret keys!

- **Server Variables** (no prefix): Only accessible server-side
  - ✅ Secret keys: `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - ✅ Database credentials: `DATABASE_URL`
  - ✅ Webhook secrets: `STRIPE_WEBHOOK_SECRET`

**Never Commit Secrets:**
- `.env.local` is git-ignored - use for local development
- `.env.example` is committed but contains no real values
- Production secrets live only in hosting provider's secure vault

**Access Control:**
- Limit team members with access to production secrets
- Use service-specific API keys with minimum required permissions
- Regularly audit who has access to secret management
- Remove access immediately when team members depart

**Monitoring:**
- Set up alerts for unusual API usage patterns
- Monitor for failed authentication attempts
- Track API rate limits and usage
- Configure alerts for approaching limits

## Emergency Procedures

### 🚨 Incident Response

- [ ] Emergency contact list updated
- [ ] Rollback procedures tested
- [ ] Communication templates prepared
- [ ] Escalation matrix defined
- [ ] Recovery procedures documented
- [ ] Secret rotation procedures documented and tested
- [ ] Emergency secret rotation contacts available

### 🔐 Emergency Secret Rotation

If a secret is compromised:

1. **Immediate Actions (within 1 hour):**
   - Identify which secrets are compromised
   - Revoke compromised secrets immediately (accept downtime for security)
   - Generate new secrets
   - Update production environment
   - Deploy immediately
   - Monitor logs for unauthorized access

2. **Post-Incident (within 24 hours):**
   - Full audit of access logs
   - Rotate all related secrets (not just compromised ones)
   - Document timeline and remediation steps
   - Conduct post-mortem
   - Implement process improvements

See [Secrets Management Guide](docs/SECRETS_MANAGEMENT.md#emergency-rotation) for detailed procedures.

### 📞 Contact Information

- **Technical Issues**: dev@trvlsocial.com
- **Security Incidents**: security@trvlsocial.com
- **Business Critical**: hello@trvlsocial.com
- **On-Call Engineer**: [To be configured]

### Emergency Secret Rotation Contacts

- **Supabase Support**: [Account dashboard]
- **Stripe Support**: [Account dashboard]
- **Technical Lead**: [Contact info]
- **Security Team**: [Contact info]

---

**Deployment Approval Required From:**
- [ ] Technical Lead
- [ ] Security Officer
- [ ] Product Manager
- [ ] Legal Team
- [ ] Business Stakeholder

**Date**: ___________
**Deployed By**: ___________
**Version**: ___________

---

## Rollback Procedures

### Overview

This section documents the procedures for rolling back deployments when issues are detected in production or staging environments. Rollbacks should be performed when critical bugs, security issues, or data integrity problems are discovered post-deployment.

### When to Perform a Rollback

Immediate rollback is required for:
- Critical security vulnerabilities discovered in production
- Data corruption or integrity issues
- Complete application failure or severe performance degradation
- Payment processing failures affecting users
- Authentication or authorization system failures

Consider rollback for:
- High-severity bugs affecting core functionality
- Performance degradation > 50% from baseline
- Increased error rates > 5% of requests
- Failed database migrations causing data inconsistencies

### Rollback Decision Authority

**Staging Environment:**
- Any engineer with deployment access
- No approval required

**Production Environment:**
- Technical Lead or CTO approval required
- Exception: On-call engineer can rollback immediately for critical security or data integrity issues, with post-rollback notification

### Application Rollback (Vercel)

#### Automatic Rollback via Vercel Dashboard

**Timeframe: 5-10 minutes**

This is the fastest and safest method for application code rollbacks.

**Procedure:**

1. **Access Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select the TRVL Social project
   - Go to the "Deployments" tab

2. **Identify Previous Stable Deployment**
   - Review deployment history
   - Find the last known stable deployment (before the issue)
   - Check deployment time and commit SHA
   - Verify it's a production deployment (marked with production icon)

3. **Promote Previous Deployment**
   - Click on the three-dot menu next to the stable deployment
   - Select "Promote to Production"
   - Confirm the action in the modal dialog
   - Vercel will immediately redirect production traffic to this deployment

4. **Verify Rollback**
   - Visit production URL: https://trvlsocial.com
   - Test critical functionality:
     - Homepage loads correctly
     - User authentication works
     - API endpoints responding
     - Payment processing functional
   - Check Sentry for error rate reduction
   - Monitor application logs for 10-15 minutes

5. **Document Rollback**
   - Update incident ticket with rollback details
   - Note the deployment that was rolled back
   - Record reason for rollback
   - Schedule post-mortem meeting

**Important Notes:**
- Vercel maintains all deployments indefinitely
- No data is lost during application rollback
- DNS changes are instant (no propagation delay)
- Previous deployment retains all environment variables from its build time

#### Manual Rollback via Vercel CLI

**Use this method if dashboard is unavailable**

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Authenticate with Vercel
vercel login

# List recent deployments
vercel list --prod

# Promote specific deployment to production
vercel promote <deployment-url> --token=$VERCEL_TOKEN

# Example:
# vercel promote https://trvl-social-abc123.vercel.app
```

#### Rollback from GitHub

**Use this method to trigger a redeployment of a previous commit**

```bash
# 1. Identify the last stable commit
git log --oneline --decorate

# 2. Create a revert commit (recommended for tracking)
git revert <bad-commit-sha>
git push origin main

# OR - Force push to previous commit (use with caution)
git reset --hard <stable-commit-sha>
git push --force origin main

# 3. Monitor GitHub Actions workflow
# The production deployment workflow will automatically trigger
```

**Warning:** Force pushing to main requires special permissions and should only be done in emergencies.

### Database Rollback (Supabase)

**⚠️ CRITICAL WARNING: Database rollbacks are HIGH RISK operations**

Database rollbacks are complex and potentially destructive. Consider these alternatives first:
1. Forward-fix: Deploy a new migration to fix the issue
2. Hotfix: Create a minimal fix and deploy immediately
3. Manual data correction: Fix specific data issues without rolling back schema

#### Database Rollback Prerequisites

Before attempting any database rollback:

1. **Verify Backup Availability**
   ```bash
   # Production backups are created before each deployment
   # Check GitHub Actions artifacts for backup file
   # Artifact name: database-backup-<run-id>
   ```

2. **Assess Data Loss Risk**
   - How much data was created since the bad migration?
   - Are users currently active on the platform?
   - Can the data be recreated or recovered?

3. **Notify Stakeholders**
   - Inform technical lead and product team
   - Put application in maintenance mode if possible
   - Alert customer support team

#### Method 1: Restore from Pre-Migration Backup (DESTRUCTIVE)

**⚠️ ALL DATA CREATED AFTER BACKUP WILL BE LOST**

**Use only for catastrophic migration failures**

```bash
# 1. Download backup from GitHub Actions artifacts
# Navigate to the deployment workflow run that created the backup
# Download: database-backup-<timestamp>.sql

# 2. Put application in maintenance mode (if possible)
# Update Vercel environment variable:
VITE_MAINTENANCE_MODE=true

# 3. Connect to Supabase project
npx supabase link --project-ref <production-project-id>

# 4. Restore database from backup
psql $DATABASE_URL < database-backup-<timestamp>.sql

# 5. Verify restoration
# Check critical tables have expected data
# Verify row counts match pre-migration numbers

# 6. Remove maintenance mode
# Update Vercel environment variable:
VITE_MAINTENANCE_MODE=false

# 7. Monitor application
# Check error logs
# Verify user functionality
```

**Post-Restoration Tasks:**
- Document all data loss
- Identify affected users
- Plan data recovery or user communication
- Update incident report

#### Method 2: Manual Migration Reversion (SAFER)

**Use when migration can be reversed without data loss**

This method creates a new "revert" migration that undoes the changes.

```bash
# 1. Analyze the problematic migration
# Open the migration file: supabase/migrations/<timestamp>_<name>.sql
# Understand what changes were made

# 2. Create revert migration
npx supabase migration new revert_<original_migration_name>

# 3. Write the revert SQL
# In the new migration file, write SQL to undo the changes:
# - DROP tables that were created
# - Add back columns that were removed
# - Restore constraints that were dropped
# Example:

-- Drop new table
DROP TABLE IF EXISTS new_problematic_table CASCADE;

-- Restore removed column
ALTER TABLE users ADD COLUMN old_column_name VARCHAR(255);

-- Restore data from backup if needed
-- Copy data from backup tables to original tables

# 4. Test revert migration on staging
npx supabase db push --project-ref <staging-project-id>

# 5. If staging test succeeds, apply to production
npx supabase db push --project-ref <production-project-id>

# 6. Verify database state
# Check affected tables
# Run test queries to ensure data integrity
```

#### Method 3: Point-in-Time Recovery (Supabase Pro/Team plans)

**Available on Supabase Pro and Team plans**

Supabase provides point-in-time recovery (PITR) for the last 7-30 days.

```bash
# 1. Access Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/<project-id>

# 2. Navigate to Database → Backups

# 3. Select "Point in Time Recovery"

# 4. Choose recovery point
# Select a timestamp before the problematic deployment
# Review the recovery point details

# 5. Confirm recovery
# Read all warnings carefully
# Confirm you understand data loss implications
# Click "Restore"

# 6. Wait for restoration
# This process can take 10-60 minutes depending on database size

# 7. Verify restoration
# Test critical database queries
# Check data integrity
# Verify application functionality
```

#### Emergency Database Procedures

**If database is corrupted or inaccessible:**

1. **Immediate Actions**
   - Enable maintenance mode on application
   - Notify all stakeholders
   - Contact Supabase support immediately
   - Document the issue with screenshots/logs

2. **Supabase Support Contact**
   - Dashboard: Help & Support chat
   - Email: support@supabase.com
   - Priority: Mark as "Production Critical"
   - Include: Project ID, timestamp of issue, description

3. **Temporary Mitigation**
   - Redirect users to status page
   - Disable new user signups if needed
   - Cache critical read-only data on CDN
   - Use read replicas if available

### Rollback Testing

**Mandatory: Test rollback procedures quarterly**

#### Staging Environment Rollback Drill

**Schedule: First Tuesday of each quarter**

1. Deploy a test "broken" version to staging
2. Practice Vercel dashboard rollback
3. Practice database migration reversion
4. Document time taken for each step
5. Update procedures based on findings

#### Production Rollback Simulation

**Schedule: Annually during low-traffic period**

1. Schedule maintenance window (announce 1 week in advance)
2. Deploy a minor change to production
3. Immediately roll back using documented procedures
4. Measure downtime and user impact
5. Update runbooks with lessons learned

### Post-Rollback Actions

#### Immediate (Within 1 hour)

- [ ] Verify application is stable
- [ ] Check error monitoring dashboards (Sentry)
- [ ] Monitor user activity and error rates
- [ ] Update status page if public incident
- [ ] Notify stakeholders of rollback completion

#### Short-term (Within 24 hours)

- [ ] Create incident ticket with full details
- [ ] Identify root cause of issue that required rollback
- [ ] Create fix plan for the rolled-back changes
- [ ] Schedule post-mortem meeting
- [ ] Update deployment documentation if procedures need revision

#### Long-term (Within 1 week)

- [ ] Conduct post-mortem meeting with team
- [ ] Document lessons learned
- [ ] Implement process improvements
- [ ] Create prevention measures for similar issues
- [ ] Update testing requirements if needed
- [ ] Deploy fixed version after thorough testing

### Rollback Communication Templates

#### Internal Team Notification

**Subject:** [URGENT] Production Rollback Initiated - [Brief Description]

```
Team,

A production rollback has been initiated due to: [brief description]

Status: [In Progress / Complete]
Deployment rolled back: [commit SHA / deployment ID]
Restored to: [commit SHA / deployment ID]
Estimated downtime: [duration]
User impact: [description]

Next steps:
1. [Action item]
2. [Action item]

Post-mortem scheduled for: [date/time]

Contact [Name] for questions or concerns.
```

#### User Communication (if needed)

**For status page or user notification:**

```
We experienced a technical issue that required rolling back a recent update.
The issue has been resolved, and all systems are operating normally.
We apologize for any inconvenience.

If you experience any problems, please contact support@trvlsocial.com.
```

### Rollback Checklist

**Use this checklist for every production rollback:**

#### Pre-Rollback
- [ ] Severity assessment complete
- [ ] Rollback approval obtained (or emergency exception noted)
- [ ] Backup verified available (for database rollbacks)
- [ ] Team members notified
- [ ] Monitoring dashboards open

#### During Rollback
- [ ] Previous stable version identified
- [ ] Application rolled back via Vercel
- [ ] Database rolled back (if needed)
- [ ] Rollback verified via production URL
- [ ] Error monitoring checked
- [ ] Critical functionality tested

#### Post-Rollback
- [ ] Stakeholders notified of completion
- [ ] Incident ticket created
- [ ] Root cause investigation initiated
- [ ] Post-mortem scheduled
- [ ] Documentation updated if needed
- [ ] User communication sent (if applicable)

### Rollback Metrics and Monitoring

Track these metrics for each rollback:

- **Time to detect issue:** Time from deployment to issue detection
- **Time to decision:** Time from detection to rollback decision
- **Time to rollback:** Time from decision to rollback completion
- **Total downtime:** Total time users affected
- **User impact:** Number of users affected
- **Data loss:** Amount of data lost (if any)

**Target Metrics:**
- Detection time: < 5 minutes (via monitoring alerts)
- Decision time: < 10 minutes
- Rollback execution: < 15 minutes (application only)
- Total downtime: < 30 minutes
- Database rollback: < 2 hours (including verification)

### Additional Resources

- **Vercel Deployment Documentation:** https://vercel.com/docs/deployments
- **Supabase Backup Documentation:** https://supabase.com/docs/guides/platform/backups
- **GitHub Actions Workflow Logs:** https://github.com/[org]/trvl-social-v3/actions
- **Monitoring Dashboards:**
  - Sentry: [Your Sentry dashboard URL]
  - Vercel Analytics: [Your Vercel project URL]
  - Supabase Logs: [Your Supabase project URL]

### Emergency Contacts

**On-Call Rotation:**
- Current on-call engineer: [Consult team schedule]
- Backup engineer: [Consult team schedule]

**Service Providers:**
- Vercel Support: https://vercel.com/support
- Supabase Support: support@supabase.com
- Technical escalation: [CTO contact]

---

**Last Updated:** 2025-10-01
**Document Owner:** DevOps Team
**Review Frequency:** Quarterly