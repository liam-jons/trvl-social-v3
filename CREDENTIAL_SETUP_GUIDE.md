# 🔐 Production Credential Setup Guide

**Status**: CRITICAL - IMMEDIATE ACTION REQUIRED
**Updated**: 2025-09-20T11:45:00Z

## 🚨 URGENT: Exposed Credentials Detected

### Immediate Actions Required

#### 1. Rotate Exposed Anthropic API Key (CRITICAL)
- **Current Key**: `[REDACTED - Key rotated for security]`
- **Action**:
  1. Login to [Anthropic Console](https://console.anthropic.com/settings/keys)
  2. Generate new API key
  3. Store in Supabase Vault: `node scripts/credential-management.js migrate`
  4. **REVOKE OLD KEY IMMEDIATELY**
- **Risk**: AI service access, potential billing charges

#### 2. Rotate Exposed Stripe Keys (CRITICAL)
- **Test Keys Exposed**:
  - Publishable: `[REDACTED - Test key replaced]`
  - Secret: `[REDACTED - Test key replaced]`
- **Action**:
  1. Login to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
  2. Generate new test keys (immediate)
  3. Generate production keys for launch
  4. Update webhook endpoints
  5. **REVOKE OLD KEYS**
- **Risk**: Payment processing access, financial transactions

## 📊 Current Security Status

### ✅ Secure Infrastructure Ready
- Supabase Vault configured and operational
- Credential management service deployed
- Access logging and monitoring active
- Admin-only access controls implemented

### 🔐 Migrated Credentials (7/19 total)
- ✅ **anthropic_api_key**: Migrated (ROTATE IMMEDIATELY)
- ✅ **stripe_publishable_key**: Migrated (test key - needs production)
- ✅ **stripe_secret_key**: Migrated (test key - needs production)
- ✅ **stripe_webhook_secret**: Migrated
- ✅ **stripe_connect_client_id**: Migrated
- ✅ **sentry_dsn**: Migrated (placeholder URL)
- ✅ **whatsapp_phone_number_id**: Migrated

### ❌ Missing Production Credentials (12/19 total)

#### Critical Services (Required for Core Functionality)
1. **Mapbox Access Token** - Maps and location features
   - Status: Invalid format in current environment
   - Required for: Adventure search, location services, map display
   - Setup: [Mapbox Account](https://account.mapbox.com/access-tokens/)

2. **WhatsApp Business API** - Messaging integration
   - Status: Placeholder values
   - Required for: Group messaging, notifications
   - Setup: [Facebook Developers](https://developers.facebook.com/apps/)

3. **Daily.co API Keys** - Video calls
   - Status: Placeholder values
   - Required for: Video streaming, group calls
   - Setup: [Daily.co Dashboard](https://dashboard.daily.co/developers)

#### Analytics & Monitoring (Recommended)
4. **Mixpanel Token** - User analytics
5. **Datadog Keys** - Performance monitoring
6. **Resend API Key** - Email notifications
7. **Exchange Rate API** - Multi-currency support

## 🛠️ Production Setup Instructions

### Step 1: Credential Management Tools
```bash
# Check current status
node scripts/credential-management.js status

# Get rotation instructions for exposed keys
node scripts/credential-management.js emergency

# Migrate new credentials to vault
node scripts/credential-management.js migrate
```

### Step 2: Service-by-Service Setup

#### Anthropic (AI Services) - URGENT
```bash
# 1. Generate new key at: https://console.anthropic.com/settings/keys
# 2. Store securely (replace NEW_KEY with actual key):
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.storeSecureCredential('anthropic_api_key', 'NEW_KEY');
"
# 3. REVOKE old key in Anthropic console
```

#### Stripe (Payments) - URGENT
```bash
# 1. Generate production keys at: https://dashboard.stripe.com/apikeys
# 2. Store securely:
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.storeSecureCredential('stripe_publishable_key', 'pk_live_YOUR_KEY');
await manager.storeSecureCredential('stripe_secret_key', 'sk_live_YOUR_KEY');
"
```

#### Mapbox (Maps)
```bash
# 1. Create token at: https://account.mapbox.com/access-tokens/
# 2. Store securely:
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.storeSecureCredential('mapbox_access_token', 'pk.YOUR_TOKEN');
"
```

#### WhatsApp Business (Messaging)
```bash
# 1. Setup app at: https://developers.facebook.com/apps/
# 2. Store credentials:
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.storeSecureCredential('whatsapp_access_token', 'YOUR_TOKEN');
await manager.storeSecureCredential('whatsapp_verify_token', 'YOUR_VERIFY_TOKEN');
await manager.storeSecureCredential('whatsapp_webhook_secret', 'YOUR_SECRET');
"
```

#### Daily.co (Video)
```bash
# 1. Setup at: https://dashboard.daily.co/developers
# 2. Store credentials:
node -e "
const { CredentialManager } = await import('./scripts/credential-management.js');
const manager = new CredentialManager();
await manager.storeSecureCredential('daily_api_key', 'YOUR_API_KEY');
await manager.storeSecureCredential('daily_api_secret', 'YOUR_SECRET');
"
```

### Step 3: Environment Cleanup

#### Replace .env file with secure version:
```bash
# Backup current .env (contains exposed keys)
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Use secure template
cp .env.secure .env

# Verify no sensitive data in new .env
grep -i "sk-\|pk_\|whsec_" .env || echo "✅ No exposed keys found"
```

#### Update .gitignore
```bash
# Ensure .env files are ignored
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
echo "!.env.secure" >> .gitignore

# Remove tracked .env files
git rm --cached .env 2>/dev/null || true
git commit -m "Remove exposed credentials from version control"
```

### Step 4: Deployment Configuration

#### Production Environment Variables
Set these in your deployment platform (Vercel, Netlify, etc.):

```bash
# Required public variables (safe to set in platform)
VITE_SUPABASE_URL=https://vhecnqaejsukulaktjob.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=vhecnqaejsukulaktjob
VITE_APP_URL=https://yourdomain.com
NODE_ENV=production

# Company information (public)
VITE_COMPANY_NAME="TRVL Social"
VITE_COMPANY_EMAIL="support@trvlsocial.com"
# ... other company details
```

**Note**: All sensitive credentials are managed via Supabase Vault and retrieved at runtime.

## 🔒 Security Features Implemented

### Credential Storage
- **Supabase Vault**: AES-256-GCM encryption at rest
- **Access Control**: Admin-only credential management
- **Audit Trail**: All access attempts logged
- **Format Validation**: Prevents invalid credentials

### Development Workflow
- **Local Development**: Uses secure credential service
- **Environment Separation**: Development/staging/production isolation
- **Rotation Support**: Built-in key rotation procedures
- **Monitoring**: Usage analytics and anomaly detection

### Access Patterns
```javascript
// Secure credential retrieval in application code
import { getAnthropicKey, getStripeKeys } from './services/secure-credentials-service.js';

// Runtime credential access (cached for performance)
const anthropicKey = await getAnthropicKey();
const stripeKeys = await getStripeKeys();
```

## 📋 Production Readiness Checklist

### 🚨 Critical (Block Deployment)
- [ ] **Rotate exposed Anthropic API key**
- [ ] **Rotate exposed Stripe keys**
- [ ] **Configure Mapbox access token**
- [ ] **Set up WhatsApp Business API**
- [ ] **Configure Daily.co for video calls**

### ⚠️ Important (Core Features)
- [ ] Configure Mixpanel analytics
- [ ] Set up Sentry error tracking
- [ ] Configure Resend for emails
- [ ] Set up Datadog monitoring
- [ ] Configure exchange rate API

### ✅ Security Verification
- [ ] All credentials stored in Supabase Vault
- [ ] No secrets in environment files
- [ ] No secrets in git history
- [ ] Credential access monitoring active
- [ ] Test credential rotation procedures

### 🧪 Testing
- [ ] Test AI features with new Anthropic key
- [ ] Verify payment processing with production Stripe
- [ ] Test map functionality with Mapbox token
- [ ] Verify WhatsApp messaging integration
- [ ] Test video call functionality

## 🚀 Deployment Commands

### Pre-deployment Verification
```bash
# Final credential status check
node scripts/credential-management.js status

# Expected output: 100% production readiness
# All services should show "CONFIGURED" status
```

### Production Deployment
```bash
# 1. Ensure all credentials are configured
# 2. Deploy application with secure environment
# 3. Monitor for credential-related errors
# 4. Verify all integrations functional

# Post-deployment monitoring
node scripts/credential-management.js test
```

## 📞 Emergency Contacts

### If Credentials Are Compromised
1. **Immediate**: Run `node scripts/credential-management.js emergency`
2. **Rotate**: Follow service-specific rotation instructions
3. **Monitor**: Check access logs for unusual activity
4. **Update**: Store new credentials securely

### Support Resources
- **Anthropic Support**: https://support.anthropic.com
- **Stripe Support**: https://support.stripe.com
- **Mapbox Support**: https://support.mapbox.com
- **Supabase Support**: https://supabase.com/support

---

**⚠️ SECURITY REMINDER**:
- Never commit actual credential values to version control
- Always use production keys for production deployments
- Rotate exposed credentials immediately
- Monitor credential usage regularly