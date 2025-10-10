# Environment Setup Guide

This guide provides comprehensive instructions for setting up environment variables for TRVL Social V3 in development, staging, and production environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Required vs Optional Variables](#required-vs-optional-variables)
- [Obtaining API Keys](#obtaining-api-keys)
- [Environment Variable Validation](#environment-variable-validation)
- [Configuration by Environment](#configuration-by-environment)
- [Feature Flags](#feature-flags)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Quick Start

### For New Developers

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd trvl-social-v3
   ```

2. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in required values** in `.env.local`:
   - Supabase configuration (see [Supabase Setup](#supabase))
   - Stripe keys (see [Stripe Setup](#stripe))
   - Mapbox token (see [Mapbox Setup](#mapbox))

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

The application will validate all required environment variables on startup and provide clear error messages if any are missing.

## Required vs Optional Variables

### Required for Application Startup

These variables **must** be set for the application to start:

```bash
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Maps
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
```

### Optional Variables

These variables enable additional features but are not required for basic operation:

- **Analytics**: Sentry, Google Analytics, Mixpanel, Datadog
- **Communication**: WhatsApp integration, Daily.co video calls
- **AI Services**: OpenAI, Anthropic, Perplexity APIs
- **Email**: Resend API for transactional emails
- **Development Tools**: Debug mode, devtools, mock APIs

## Obtaining API Keys

### Supabase

1. **Create a Supabase project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Note your project name and region

2. **Get your API credentials:**
   - Navigate to Settings → API
   - Copy the following values:
     - **Project ID**: Found in the URL or Settings
     - **Project URL**: `https://[your-project-id].supabase.co`
     - **Anon/Public Key**: Under "Project API keys" → anon/public
     - **Service Role Key**: Under "Project API keys" → service_role (⚠️ Keep secret!)

3. **Add to `.env.local`:**
   ```bash
   VITE_SUPABASE_PROJECT_ID=abcdefghijklmnop
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Stripe

1. **Create a Stripe account:**
   - Go to [https://stripe.com](https://stripe.com)
   - Sign up and complete account verification

2. **Get your API keys:**
   - Navigate to Developers → API keys
   - For development, use **test mode** keys
   - Copy both keys:
     - **Publishable key**: `pk_test_...` (safe to expose)
     - **Secret key**: `sk_test_...` (⚠️ Keep secret!)

3. **Set up webhooks (optional but recommended):**
   - Navigate to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Copy the **Signing secret**: `whsec_...`

4. **Set up Stripe Connect (for marketplace features):**
   - Navigate to Connect → Settings
   - Copy your **Client ID**: `ca_...`

5. **Add to `.env.local`:**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_CONNECT_CLIENT_ID=ca_...
   ```

### Mapbox

1. **Create a Mapbox account:**
   - Go to [https://www.mapbox.com](https://www.mapbox.com)
   - Sign up for a free account

2. **Get your access token:**
   - Navigate to Account → Access tokens
   - Copy the **Default public token** or create a new one
   - The token starts with `pk.`

3. **Add to `.env.local`:**
   ```bash
   VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
   ```

### Sentry (Optional - Error Monitoring)

1. **Create a Sentry project:**
   - Go to [https://sentry.io](https://sentry.io)
   - Create a new project (select React/JavaScript)

2. **Get your DSN:**
   - Navigate to Settings → Projects → [Your Project] → Client Keys (DSN)
   - Copy the DSN URL

3. **Add to `.env.local`:**
   ```bash
   VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
   VITE_SENTRY_ENVIRONMENT=development
   VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

### Google Analytics 4 (Optional)

1. **Create a GA4 property:**
   - Go to [https://analytics.google.com](https://analytics.google.com)
   - Create a new GA4 property

2. **Get your Measurement ID:**
   - Navigate to Admin → Data Streams
   - Select your web stream
   - Copy the **Measurement ID** (starts with `G-`)

3. **Add to `.env.local`:**
   ```bash
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### OpenAI / Anthropic (Optional - AI Features)

1. **OpenAI:**
   - Get API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   ```bash
   OPENAI_API_KEY=sk-...
   VITE_OPENAI_API_KEY=sk-...  # Only if client-side access needed
   ```

2. **Anthropic Claude:**
   - Get API key from [https://console.anthropic.com](https://console.anthropic.com)
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   VITE_ANTHROPIC_API_KEY=sk-ant-...  # Only if client-side access needed
   ```

### Resend (Optional - Email Service)

1. **Create a Resend account:**
   - Go to [https://resend.com](https://resend.com)
   - Verify your sending domain

2. **Get your API key:**
   - Navigate to API Keys
   - Create a new API key

3. **Add to `.env.local`:**
   ```bash
   RESEND_API_KEY=re_...
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   EMAIL_FROM_NAME="TRVL Social"
   ```

## Environment Variable Validation

This project uses **type-safe environment validation** with `@t3-oss/env-core` and Zod schemas to ensure all required variables are present before the application starts.

### How Validation Works

1. **Build-time validation**: When you run `npm run dev` or `npm run build`, the validation runs immediately
2. **Clear error messages**: If a required variable is missing, you'll see exactly which one
3. **Type safety**: Access environment variables through the type-safe `env` object

### Using Environment Variables in Code

**✅ Correct - Type-safe access:**
```javascript
import { env } from '@/env.js';

const supabaseUrl = env.VITE_SUPABASE_URL;
const stripeKey = env.VITE_STRIPE_PUBLISHABLE_KEY;
```

**❌ Incorrect - Direct access (not type-safe):**
```javascript
// Don't do this!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

### Validation Schema Structure

The validation schema in `src/env.js` defines:

- **Server variables**: Only accessible server-side (no `VITE_` prefix)
- **Client variables**: Embedded in the client bundle (must have `VITE_` prefix)
- **Required vs optional**: Which variables must be present
- **Type validation**: URLs must be valid URLs, emails must be valid emails, etc.

### Testing Validation

To verify validation is working:

1. **Remove a required variable** from `.env.local`:
   ```bash
   # Comment out this line:
   # VITE_SUPABASE_URL=...
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **You should see a clear error**:
   ```
   Environment validation failed:
   {
     VITE_SUPABASE_URL: [ 'Required' ]
   }
   ```

## Configuration by Environment

### Development (.env.local)

For local development, create a `.env.local` file (git-ignored):

```bash
# .env.local - Local development overrides
NODE_ENV=development

# Use test/sandbox credentials
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Local development URL
VITE_APP_URL=http://localhost:5173

# Enable development tools
VITE_ENABLE_DEVTOOLS=true
VITE_DEBUG_MODE=true
VITE_DISABLE_ANALYTICS_IN_DEV=true

# Optional: Use mock API for offline development
VITE_USE_MOCK_API=false
```

**Note**: Never commit `.env.local` to version control!

### Staging Environment

For staging deployments (e.g., Vercel preview deployments):

- Use **test mode** keys for payment services
- Use **staging** Supabase project
- Enable monitoring but with lower sampling rates
- Use feature flags to test new features

**Configure in Vercel:**
1. Go to Project Settings → Environment Variables
2. Set scope to "Preview"
3. Add all required variables with staging values

### Production Environment

For production deployments:

- Use **live mode** keys for payment services
- Use **production** Supabase project
- Enable full monitoring and alerting
- Never expose production keys in client bundle (no `VITE_` prefix for secrets)

**Configure in Vercel:**
1. Go to Project Settings → Environment Variables
2. Set scope to "Production"
3. Add all required variables with production values
4. **Important**: Sensitive keys like `SUPABASE_SERVICE_ROLE_KEY` should only be in server environment

**Production Security Checklist:**
- [ ] Service role keys are server-side only (no `VITE_` prefix)
- [ ] Stripe keys are in live mode (`pk_live_...` and `sk_live_...`)
- [ ] All secrets are stored in hosting provider's secret management
- [ ] `.env.local` and other `.env.*` files are in `.gitignore`
- [ ] No hardcoded credentials in source code
- [ ] Secrets rotation schedule is documented (see [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md))

## Feature Flags

Feature flags allow you to enable/disable features without code changes.

### Convention

All feature flags must be prefixed with `VITE_FEATURE_` and have string values of `"true"` or `"false"`.

### Available Feature Flags

```bash
# Enable vendor forum v2 features
VITE_FEATURE_VENDOR_FORUM_V2=false

# Enable group video calls
VITE_FEATURE_GROUP_VIDEO_CALLS=false

# Enable AI-powered trip recommendations
VITE_FEATURE_AI_RECOMMENDATIONS=false

# Enable beta features for testing
VITE_FEATURE_BETA=false
```

### Using Feature Flags in Code

```javascript
import { env } from '@/env.js';

function MyComponent() {
  // Check feature flag
  if (env.VITE_FEATURE_GROUP_VIDEO_CALLS === 'true') {
    return <VideoCallButton />;
  }

  return <ComingSoonBadge />;
}
```

### Adding a New Feature Flag

1. **Add to `.env.example`:**
   ```bash
   # Enable my new feature
   VITE_FEATURE_MY_NEW_FEATURE=false
   ```

2. **Add to validation schema** in `src/env.js`:
   ```javascript
   client: {
     // ... other variables
     VITE_FEATURE_MY_NEW_FEATURE: z.enum(['true', 'false']).optional(),
   },
   runtimeEnv: {
     // ... other variables
     VITE_FEATURE_MY_NEW_FEATURE: import.meta.env.VITE_FEATURE_MY_NEW_FEATURE,
   }
   ```

3. **Use in your code:**
   ```javascript
   import { env } from '@/env.js';

   if (env.VITE_FEATURE_MY_NEW_FEATURE === 'true') {
     // Feature is enabled
   }
   ```

4. **Document in CONTRIBUTING.md** (if creating new flags is a common task)

## Troubleshooting

### Application Won't Start

**Error: "Environment validation failed"**

- **Cause**: Required environment variables are missing or invalid
- **Solution**: Check the error message for the specific variable name and add it to `.env.local`
- **Example**:
  ```
  Environment validation failed:
  {
    VITE_SUPABASE_URL: [ 'Required' ]
  }
  ```
  Add `VITE_SUPABASE_URL=https://your-project.supabase.co` to `.env.local`

### Supabase Connection Issues

**Error: "Failed to connect to Supabase"**

1. **Verify URL format**: Must be `https://[project-id].supabase.co` (no trailing slash)
2. **Check keys**: Ensure you copied the full key without truncation
3. **Verify project status**: Check Supabase dashboard - project must be running
4. **Network issues**: Check if you can access the Supabase URL in your browser

### Stripe Integration Issues

**Error: "Invalid API key"**

1. **Check test vs live mode**: Development should use `pk_test_...` and `sk_test_...`
2. **Verify key visibility**: Only restricted keys work - legacy/secret keys have different formats
3. **Key expiration**: Regenerate keys if they're old or compromised

**Error: "Webhook signature verification failed"**

1. **Verify webhook secret**: Must match the signing secret from Stripe dashboard
2. **Check endpoint URL**: Must be publicly accessible for webhooks
3. **Use Stripe CLI for local testing**:
   ```bash
   stripe listen --forward-to localhost:5173/api/webhooks/stripe
   ```

### Build Failures

**Error: Build fails in CI/CD**

1. **Environment variables not set**: Ensure all required variables are configured in your CI/CD platform
2. **Variable scope**: In Vercel, ensure variables are scoped to the correct environment (Production/Preview/Development)
3. **Check variable names**: Must match exactly (case-sensitive)

### Environment Variables Not Updating

**Changes to `.env.local` not reflected**

1. **Restart dev server**: Stop (`Ctrl+C`) and restart (`npm run dev`)
2. **Clear build cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```
3. **Check file name**: Must be `.env.local` (not `.env` or `.env.development`)

### Type Safety Issues

**TypeScript errors when accessing env variables**

- **Solution**: Make sure you're importing from `@/env.js`:
  ```typescript
  import { env } from '@/env.js';
  const url = env.VITE_SUPABASE_URL; // Fully typed
  ```

## Security Best Practices

### Never Commit Secrets

**Always git-ignored:**
- `.env.local`
- `.env.production.local`
- `.env.development.local`
- Any file containing real credentials

**Safe to commit:**
- `.env.example` (template with no real values)
- Feature flag defaults
- Non-sensitive configuration

### Use Different Keys Per Environment

- **Development**: Test/sandbox keys
- **Staging**: Separate test environment
- **Production**: Live keys with restricted permissions

### Rotate Secrets Regularly

- **High-risk secrets** (service role keys, API secrets): Every 90 days
- **Medium-risk secrets** (API keys): Every 6 months
- **After any security incident**: Immediately

See [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) for rotation procedures.

### Minimize Secret Exposure

1. **Server-side only**: Remove `VITE_` prefix for sensitive secrets
2. **Principle of least privilege**: Use keys with minimum required permissions
3. **Environment-specific**: Never use production keys in development
4. **Audit access**: Regularly review who has access to production secrets

### Client vs Server Variables

**Client variables (VITE_ prefix):**
- ✅ Public API keys (Stripe publishable, Supabase anon)
- ✅ Public configuration (app URL, feature flags)
- ❌ Secret keys (service role, API secrets)
- ❌ Private configuration (database passwords, JWT secrets)

**Server variables (no prefix):**
- ✅ Secret API keys (Stripe secret, service role)
- ✅ Database credentials
- ✅ Webhook secrets
- ✅ JWT signing secrets

### Monitoring and Alerts

Set up alerts for:
- Failed authentication attempts with API keys
- Unusual API usage patterns
- Approaching API rate limits
- Expired certificates/keys

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) - Secret rotation procedures
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment configuration guide

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the `.env.example` file for complete variable list
3. Check validation errors in console for specific variable names
4. Consult service-specific documentation (Supabase, Stripe, etc.)
5. Contact the development team: dev@trvlsocial.com

## Summary Checklist

Before starting development:

- [ ] `.env.example` copied to `.env.local`
- [ ] All required Supabase variables configured
- [ ] Stripe test keys added
- [ ] Mapbox access token added
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Application loads in browser at `http://localhost:5173`
- [ ] No environment validation errors in console

You're ready to start developing! 🚀
