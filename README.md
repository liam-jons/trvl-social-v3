# TravelSocial - Social Travel Platform

A modern social travel platform that connects adventurous travelers and enables personalized group formation through AI-powered compatibility matching.

## 🌟 Features

- **Personality-Based Matching**: Advanced compatibility scoring using comprehensive personality assessments
- **Group Formation**: AI-powered recommendations for optimal travel group composition
- **Adventure Marketplace**: Browse and book unique travel experiences from verified vendors
- **Social Community**: Connect with like-minded travelers and share experiences
- **Smart Payment System**: Integrated split payments and secure transaction handling
- **Real-time Coordination**: Live updates and communication tools for travel groups

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trvl-social-v3
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:

   **See the complete [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) for detailed instructions.**

   **Required Variables** (minimum for application to start):
   - `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep secret!)
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (keep secret!)
   - `VITE_MAPBOX_ACCESS_TOKEN`: Your Mapbox access token

   **Optional Variables** for additional features:
   - Analytics: `VITE_SENTRY_DSN`, `VITE_GA4_MEASUREMENT_ID`, `VITE_MIXPANEL_TOKEN`
   - AI Services: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
   - Email: `RESEND_API_KEY`
   - Video: `VITE_DAILY_API_KEY`
   - WhatsApp: `VITE_WHATSAPP_ACCESS_TOKEN`

5. Start the development server:
```bash
npm run dev
```

The application uses **type-safe environment validation** - if any required variables are missing, you'll see a clear error message indicating which ones need to be configured.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **Email**: Resend
- **State Management**: Zustand
- **Testing**: Vitest, React Testing Library
- **Deployment**: Vercel/Netlify ready

### Key Services

- **Compatibility Service**: AI-powered personality matching algorithms
- **Image Asset Service**: Optimized image handling with Supabase storage
- **Email Service**: Template-based email notifications
- **Payment Services**: Comprehensive payment processing and split billing
- **Security**: Age verification and secure authentication systems

## 📧 Contact & Support

- **Development Team**: dev@trvlsocial.com
- **Business Inquiries**: hello@trvlsocial.com
- **Support**: support@trvlsocial.com

## 🔒 Security

This application implements comprehensive security measures including:
- Age verification (18+ requirement)
- Encrypted sensitive data storage
- Secure credential management
- Content moderation systems
- Payment security with PCI compliance

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

For coverage reports:
```bash
npm run test:coverage
```

## 📦 Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🔧 Environment Configuration

### Environment Variable Management

This project uses **type-safe environment validation** with `@t3-oss/env-core` to ensure all required configuration is present before the application starts.

#### Quick Start

1. **Copy the template**: `cp .env.example .env.local`
2. **Fill in required values** (see `.env.example` for complete list with descriptions)
3. **Start development**: `npm run dev`

If any required variables are missing, the build will fail with a clear error message.

#### Documentation

- **[Environment Setup Guide](docs/ENVIRONMENT_SETUP.md)** - Complete setup instructions and API key acquisition
- **[Secrets Management Guide](docs/SECRETS_MANAGEMENT.md)** - Secret rotation procedures and security best practices
- **[Environment Migration Guide](docs/ENVIRONMENT_MIGRATION_GUIDE.md)** - Migrating code to use type-safe environment variables

#### Using Environment Variables in Code

**✅ Correct - Type-safe access:**
```javascript
import { env } from '@/env.js';
const supabaseUrl = env.VITE_SUPABASE_URL;
```

**❌ Incorrect - Direct access (deprecated):**
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Don't do this!
```

#### Environment Hierarchy

- **`.env.local`** - Local development (git-ignored, add your credentials here)
- **`.env.example`** - Template file (committed to repo, no real values)
- **Production secrets** - Managed via hosting provider (Vercel, AWS, etc.)

**Never commit `.env.local` or any file containing real credentials!**

#### Feature Flags

Control feature availability using environment variables prefixed with `VITE_FEATURE_`:

```bash
VITE_FEATURE_VENDOR_FORUM_V2=true
VITE_FEATURE_GROUP_VIDEO_CALLS=false
VITE_FEATURE_AI_RECOMMENDATIONS=true
```

See [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md#feature-flags) for complete list.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Adding New Environment Variables

When adding a new environment variable:

1. Add to `.env.example` with description and example value
2. Add to validation schema in `src/env.js`:
   ```javascript
   client: {
     VITE_YOUR_NEW_VAR: z.string().optional(),
   },
   runtimeEnv: {
     VITE_YOUR_NEW_VAR: import.meta.env.VITE_YOUR_NEW_VAR,
   }
   ```
3. Use via type-safe `env` object:
   ```javascript
   import { env } from '@/env.js';
   const value = env.VITE_YOUR_NEW_VAR;
   ```
4. Document in [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) if it requires external service setup

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

Built with modern web technologies and a focus on creating meaningful travel connections.