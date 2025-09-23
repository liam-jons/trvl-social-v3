# 🛠️ Production Credential Setup Guide

Generated: 2025-09-20T11:52:59.869Z

## Critical Services (Required for Deployment)

### Anthropic Claude
**Purpose**: AI services for personality descriptions and chat
**Setup URL**: https://console.anthropic.com/settings/keys
**Cost**: Usage-based (~$50-200/month estimated)
**Issue**: not_configured

**Setup Steps**:
1. Visit [Anthropic Claude Dashboard](https://console.anthropic.com/settings/keys)
2. Generate production API key/token
3. Store securely using:
   ```bash
   node -e "const { CredentialManager } = await import('./scripts/credential-management.js'); await new CredentialManager().storeSecureCredential('anthropic_api_key', 'YOUR_PRODUCTION_KEY');"
   ```
4. Test connectivity:
   ```bash
   node scripts/production-credential-setup.js test
   ```

### Stripe Payments
**Purpose**: Payment processing for bookings and subscriptions
**Setup URL**: https://dashboard.stripe.com/apikeys
**Cost**: 2.9% + 30¢ per transaction
**Issue**: not_configured

**Setup Steps**:
1. Visit [Stripe Payments Dashboard](https://dashboard.stripe.com/apikeys)
2. Generate production API key/token
3. Store securely using:
   ```bash
   node -e "const { CredentialManager } = await import('./scripts/credential-management.js'); await new CredentialManager().storeSecureCredential('stripe_publishable_key', 'YOUR_PRODUCTION_KEY');"
   ```
4. Test connectivity:
   ```bash
   node scripts/production-credential-setup.js test
   ```

### Stripe Payments
**Purpose**: Server-side payment processing
**Setup URL**: https://dashboard.stripe.com/apikeys
**Cost**: 2.9% + 30¢ per transaction
**Issue**: not_configured

**Setup Steps**:
1. Visit [Stripe Payments Dashboard](https://dashboard.stripe.com/apikeys)
2. Generate production API key/token
3. Store securely using:
   ```bash
   node -e "const { CredentialManager } = await import('./scripts/credential-management.js'); await new CredentialManager().storeSecureCredential('stripe_secret_key', 'YOUR_PRODUCTION_KEY');"
   ```
4. Test connectivity:
   ```bash
   node scripts/production-credential-setup.js test
   ```

### Mapbox
**Purpose**: Maps and location services for adventures
**Setup URL**: https://account.mapbox.com/access-tokens/
**Cost**: Free tier: 50k requests/month, then $0.50/1k requests
**Issue**: not_configured

**Setup Steps**:
1. Visit [Mapbox Dashboard](https://account.mapbox.com/access-tokens/)
2. Generate production API key/token
3. Store securely using:
   ```bash
   node -e "const { CredentialManager } = await import('./scripts/credential-management.js'); await new CredentialManager().storeSecureCredential('mapbox_access_token', 'YOUR_PRODUCTION_KEY');"
   ```
4. Test connectivity:
   ```bash
   node scripts/production-credential-setup.js test
   ```

## Important Services (Recommended)

### WhatsApp Business
**Purpose**: Group messaging and notifications
**Setup URL**: https://developers.facebook.com/apps/
**Cost**: Free for first 1k conversations/month

### Daily.co
**Purpose**: Video calls and streaming
**Setup URL**: https://dashboard.daily.co/developers
**Cost**: Free tier: 10k minutes/month, then $0.002/minute

### Resend
**Purpose**: Transactional emails
**Setup URL**: https://resend.com/api-keys
**Cost**: Free tier: 3k emails/month, then $0.0004/email

