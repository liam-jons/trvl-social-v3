# TRVL Social V3 - Production Deployment Guide

## Overview

This comprehensive guide covers the complete production deployment process for TRVL Social V3, from environment setup to post-launch monitoring. Follow this guide to ensure a smooth and secure production deployment.

## Table of Contents

1. [Environment Variables Configuration](#environment-variables-configuration)
2. [Third-Party Service Setup](#third-party-service-setup)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Pre-Launch Checklist](#pre-launch-checklist)
5. [Deployment Steps](#deployment-steps)
6. [Post-Launch Monitoring](#post-launch-monitoring)
7. [Troubleshooting](#troubleshooting)

## Environment Variables Configuration

### Required Environment Variables

Create a `.env` file in your production environment with the following variables:

```bash
# =================================================================
# CORE SERVICES (REQUIRED)
# =================================================================

# Supabase Configuration (Required for Authentication & Database)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Stripe Payment Processing (Required for Payments)
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."  # Use pk_live_ for production
STRIPE_SECRET_KEY="sk_live_..."            # Use sk_live_ for production
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CONNECT_CLIENT_ID="ca_..."

# Maps and Location Services (Required for Map Features)
VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJja..."

# AI Services (At least one required)
ANTHROPIC_API_KEY="sk-ant-api03-..."       # Recommended primary
OPENAI_API_KEY="sk-proj-..."               # Alternative
PERPLEXITY_API_KEY="pplx-..."              # For research features

# =================================================================
# WHATSAPP INTEGRATION (REQUIRED FOR MESSAGING)
# =================================================================

VITE_WHATSAPP_API_BASE_URL="https://graph.facebook.com/v18.0"
VITE_WHATSAPP_ACCESS_TOKEN="your_permanent_access_token"
VITE_WHATSAPP_PHONE_NUMBER_ID="123456789012345"
VITE_WHATSAPP_VERIFY_TOKEN="your_webhook_verify_token"
WHATSAPP_WEBHOOK_SECRET="your_webhook_secret"

# =================================================================
# VIDEO CONFERENCING (REQUIRED FOR VIDEO CALLS)
# =================================================================

VITE_DAILY_API_KEY="your_daily_api_key"
DAILY_API_SECRET="your_daily_secret_key"

# =================================================================
# ANALYTICS & MONITORING (RECOMMENDED)
# =================================================================

# Mixpanel Analytics
VITE_MIXPANEL_TOKEN="your_mixpanel_token"

# Sentry Error Tracking
VITE_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
SENTRY_AUTH_TOKEN="your_sentry_auth_token"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="trvl-social-v3"

# Datadog Performance Monitoring
VITE_DATADOG_APPLICATION_ID="your_datadog_app_id"
VITE_DATADOG_CLIENT_TOKEN="your_datadog_client_token"
VITE_DATADOG_SITE="datadoghq.com"

# =================================================================
# OPTIONAL SERVICES
# =================================================================

# Multi-Currency Support
VITE_EXCHANGE_RATE_API_KEY="your_exchange_rate_api_key"

# Email Notifications
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
FROM_EMAIL="noreply@yourdomain.com"

# Company Information (for invoices)
VITE_COMPANY_NAME="TRVL Social"
VITE_COMPANY_ADDRESS_1="Your Company Address"
VITE_COMPANY_CITY="Your City"
VITE_COMPANY_STATE="Your State"
VITE_COMPANY_POSTAL="12345"
VITE_COMPANY_COUNTRY="Your Country"
VITE_COMPANY_EMAIL="support@yourdomain.com"
VITE_COMPANY_PHONE="+1-555-XXX-XXXX"
VITE_TAX_NUMBER="TAX123456789"
VITE_VAT_NUMBER="VAT987654321"

# Application Configuration
VITE_APP_URL="https://yourdomain.com"
VITE_APP_NAME="TRVL Social"
```

### Environment Variable Security

**Critical Security Notes:**
- Never commit `.env` files to version control
- Use secrets management for production (Vercel Environment Variables, AWS Secrets Manager, etc.)
- Rotate API keys regularly (quarterly minimum)
- Use production-specific keys (not test/development keys)

## Third-Party Service Setup

### 1. Supabase Setup

#### Create Production Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project for production
3. Choose region closest to your users
4. Select Pro plan for production usage

#### Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref your-production-project-ref

# Run all migrations
supabase db push

# Verify migrations
supabase db diff
```

#### Storage Configuration
1. Go to Storage in Supabase Dashboard
2. Create buckets:
   - `avatars` (public)
   - `media` (public)
   - `documents` (private)
3. Set up RLS policies for each bucket

#### Row Level Security (RLS)
Ensure all tables have appropriate RLS policies:
```sql
-- Example for user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### 2. Stripe Connect Setup

#### Production Account Setup
1. Complete business verification in Stripe Dashboard
2. Enable Live mode
3. Set up Connect platform settings
4. Configure webhook endpoints

#### Webhook Configuration
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `payout.created`
   - `payout.paid`
   - `transfer.created`

#### Test Webhook Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Test webhook
stripe trigger payment_intent.succeeded
```

### 3. WhatsApp Business API Setup

#### Meta Business Account
1. Create Meta Business Account
2. Add WhatsApp Business API
3. Get permanent access token
4. Configure webhook URL: `https://yourdomain.com/api/whatsapp/webhook`

#### Phone Number Verification
1. Verify business phone number
2. Complete business verification
3. Request production access

### 4. Analytics & Monitoring Setup

#### Mixpanel Setup
1. Create production project in Mixpanel
2. Copy project token
3. Set up conversion funnels
4. Configure retention cohorts

#### Sentry Setup
1. Create new Sentry project
2. Configure release tracking
3. Set up performance monitoring
4. Configure alert rules

#### Datadog Setup
1. Create Datadog account
2. Set up RUM application
3. Configure dashboard
4. Set up alerts and monitors

## Infrastructure Setup

### 1. Domain Configuration

#### DNS Setup
```bash
# A Records
@     300   A      76.76.19.61    # Vercel IP
www   300   CNAME  cname.vercel-dns.com.

# CNAME for API subdomain (optional)
api   300   CNAME  cname.vercel-dns.com.
```

#### SSL Certificate
- Vercel automatically provisions SSL certificates
- Verify HTTPS is working: `https://yourdomain.com`
- Set up HSTS headers in `vercel.json`

### 2. CDN Setup (Optional but Recommended)

#### Cloudflare Setup
1. Add domain to Cloudflare
2. Configure DNS
3. Enable caching rules:
   ```javascript
   // Page Rules
   yourdomain.com/assets/* - Cache Everything, Edge TTL: 1 month
   yourdomain.com/api/* - Bypass Cache
   ```

### 3. Backup Strategy

#### Database Backups
- Supabase Pro automatically backs up daily
- Set up additional backups using `pg_dump`
- Store backups in separate cloud storage

#### Code Backups
- Use Git with multiple remotes
- Set up automated deployment from main branch
- Tag releases for easy rollback

## Pre-Launch Checklist

### Security Checklist
- [ ] All environment variables set with production values
- [ ] No test API keys in production
- [ ] All console.logs removed from production code
- [ ] Error tracking properly configured
- [ ] HTTPS enforced (no HTTP redirects)
- [ ] CORS properly configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Rate limiting configured

### Performance Checklist
- [ ] Bundle size optimized (< 1MB)
- [ ] Images optimized and compressed
- [ ] Lazy loading implemented
- [ ] Service worker configured
- [ ] Database queries optimized
- [ ] Proper indexing on all query columns
- [ ] CDN configured for static assets

### Functionality Checklist
- [ ] User registration and login working
- [ ] Password reset flow working
- [ ] All payment flows tested
- [ ] WhatsApp messaging working
- [ ] Video calls functional
- [ ] File uploads working
- [ ] Email notifications sending
- [ ] Search functionality working
- [ ] Mobile responsiveness verified

### Content Checklist
- [ ] All placeholder content replaced
- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] Contact information accurate
- [ ] Company information complete
- [ ] Legal disclaimers in place

### Testing Checklist
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Cross-browser testing complete
- [ ] Mobile device testing complete
- [ ] Performance testing complete
- [ ] Load testing complete
- [ ] Security testing complete

## Deployment Steps

### 1. Build Process

#### Local Build Test
```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run tests
npm run test:run

# Build for production
npm run build

# Test production build locally
npm run preview
```

#### Build Optimization
Verify the following in your build:
- No development dependencies in bundle
- Tree shaking working properly
- Source maps generated for debugging
- Environment variables properly replaced

### 2. Vercel Deployment

#### Initial Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Environment Variables in Vercel
1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Add all production environment variables
3. Set appropriate environment (Production, Preview, Development)

#### Domain Configuration
1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add your custom domain
3. Verify DNS configuration
4. Wait for SSL certificate provisioning

### 3. Database Migration

#### Run Production Migrations
```bash
# Connect to production database
supabase db push --db-url "postgresql://..."

# Verify all tables exist
supabase db diff

# Run custom scripts if needed
psql "postgresql://..." -f scripts/production-setup.sql
```

### 4. Service Configuration

#### Configure Webhooks
1. Update all webhook URLs to production domain
2. Test webhook delivery
3. Set up webhook monitoring

#### Update API Endpoints
1. Verify all API calls use production URLs
2. Test all integrations
3. Update any hardcoded development URLs

## Post-Launch Monitoring

### Key Metrics to Monitor

#### Performance Metrics
- Page load times (< 3 seconds)
- Core Web Vitals
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- API response times (< 500ms for 95th percentile)
- Error rates (< 1%)

#### Business Metrics
- User registration rate
- Payment success rate
- Message delivery rate
- User engagement metrics
- Feature adoption rates

#### Infrastructure Metrics
- Server response times
- Database query performance
- Memory and CPU usage
- Bandwidth usage
- Storage usage

### Alert Configuration

#### Critical Alerts (Immediate Response)
```javascript
// Sentry Alert Rules
{
  "conditions": [
    {
      "metric": "error_rate",
      "threshold": 5,
      "timeWindow": "1m"
    }
  ],
  "actions": ["email", "slack"]
}
```

#### Warning Alerts (Monitor Closely)
- Page load time > 5 seconds
- API response time > 1 second
- Payment failure rate > 5%
- Database connection issues

### Monitoring Dashboards

#### Create Dashboards For:
1. **User Experience**
   - Page load times
   - User journey funnels
   - Error rates by page

2. **Business KPIs**
   - Daily/weekly active users
   - Revenue metrics
   - Conversion rates

3. **Infrastructure Health**
   - Server performance
   - Database performance
   - Third-party service status

### Performance Baselines

Establish baselines within first week of launch:
- Average page load time
- API response times
- User engagement rates
- Conversion rates

Set up automatic reports to track:
- Weekly performance summary
- Monthly business metrics review
- Quarterly security audit

## Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check build logs
vercel logs your-deployment-url

# Check environment variables
vercel env list

# Redeploy with debug
vercel --debug
```

#### Database Connection Issues
```bash
# Test connection
psql "postgresql://user:pass@host:port/db" -c "SELECT 1;"

# Check migration status
supabase migration list

# Reset if needed (DANGEROUS - backup first)
supabase db reset
```

#### Payment Integration Issues
```bash
# Test Stripe webhook
stripe listen --forward-to https://yourdomain.com/api/stripe/webhooks

# Check webhook logs in Stripe Dashboard
# Verify webhook signing secret matches environment variable
```

#### WhatsApp Integration Issues
1. Verify webhook URL in Meta Business account
2. Check phone number verification status
3. Test webhook with Meta's testing tool
4. Verify access token hasn't expired

### Debug Mode

Enable debug logging in production (temporarily):
```javascript
// Add to environment variables
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug

// Remove after debugging is complete
```

### Support Contacts

Keep these contacts ready for production issues:
- Vercel Support: [support@vercel.com](mailto:support@vercel.com)
- Supabase Support: [support@supabase.com](mailto:support@supabase.com)
- Stripe Support: [support@stripe.com](mailto:support@stripe.com)
- Meta Business Support: [business.facebook.com/support](https://business.facebook.com/support)

### Emergency Procedures

#### Rollback Process
```bash
# Quick rollback to previous deployment
vercel rollback

# Or deploy specific commit
git checkout previous-stable-commit
vercel --prod
```

#### Database Emergency
1. Stop all write operations
2. Create immediate backup
3. Investigate issue
4. Apply fix or restore from backup

#### Security Incident
1. Rotate all API keys immediately
2. Review access logs
3. Notify users if data breach
4. Apply security patches
5. Conduct post-incident review

---

## Final Notes

- Test the entire deployment process in a staging environment first
- Keep this document updated as services and processes change
- Regular security audits and penetration testing recommended
- Consider setting up blue-green deployments for zero-downtime updates
- Document any custom configurations or deviations from this guide

For additional support or questions about this deployment guide, contact the development team or refer to the service-specific documentation in the `/docs` directory.