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
cp .env.example .env
```

4. Configure your environment variables in `.env`:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `RESEND_API_KEY`: Your Resend API key for email services
- Additional service API keys as needed

5. Start the development server:
```bash
npm run dev
```

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
- **Security**: COPPA compliance and age verification systems

## 📧 Contact & Support

- **Development Team**: dev@trvlsocial.com
- **Business Inquiries**: hello@trvlsocial.com
- **Support**: support@trvlsocial.com

## 🔒 Security

This application implements comprehensive security measures including:
- Age verification and COPPA compliance
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

Built with modern web technologies and a focus on creating meaningful travel connections.