import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const APIPage = () => {
  const breadcrumbs = [{ title: "API Documentation" }];

  const endpoints = [
    {
      category: 'Authentication',
      methods: [
        {
          method: 'POST',
          endpoint: '/api/v1/auth/login',
          description: 'Authenticate user and get access token'
        },
        {
          method: 'POST',
          endpoint: '/api/v1/auth/refresh',
          description: 'Refresh expired access token'
        },
        {
          method: 'POST',
          endpoint: '/api/v1/auth/logout',
          description: 'Invalidate access token'
        }
      ]
    },
    {
      category: 'Adventures',
      methods: [
        {
          method: 'GET',
          endpoint: '/api/v1/adventures',
          description: 'List all available adventures with filtering'
        },
        {
          method: 'GET',
          endpoint: '/api/v1/adventures/{id}',
          description: 'Get detailed information about a specific adventure'
        },
        {
          method: 'POST',
          endpoint: '/api/v1/adventures',
          description: 'Create a new adventure (vendors only)'
        },
        {
          method: 'PUT',
          endpoint: '/api/v1/adventures/{id}',
          description: 'Update adventure details (vendors only)'
        }
      ]
    },
    {
      category: 'Bookings',
      methods: [
        {
          method: 'POST',
          endpoint: '/api/v1/bookings',
          description: 'Create a new booking'
        },
        {
          method: 'GET',
          endpoint: '/api/v1/bookings',
          description: 'List user bookings'
        },
        {
          method: 'GET',
          endpoint: '/api/v1/bookings/{id}',
          description: 'Get booking details'
        },
        {
          method: 'PUT',
          endpoint: '/api/v1/bookings/{id}',
          description: 'Update booking status'
        }
      ]
    },
    {
      category: 'Users',
      methods: [
        {
          method: 'GET',
          endpoint: '/api/v1/users/profile',
          description: 'Get current user profile'
        },
        {
          method: 'PUT',
          endpoint: '/api/v1/users/profile',
          description: 'Update user profile'
        },
        {
          method: 'GET',
          endpoint: '/api/v1/users/compatibility/{id}',
          description: 'Get compatibility score with another user'
        }
      ]
    }
  ];

  const sdks = [
    {
      language: 'JavaScript',
      package: 'trvl-social-js',
      description: 'Official JavaScript SDK for web and Node.js applications',
      install: 'npm install trvl-social-js',
      docs: '#'
    },
    {
      language: 'Python',
      package: 'trvl-social-python',
      description: 'Python SDK for backend integrations and data analysis',
      install: 'pip install trvl-social-python',
      docs: '#'
    },
    {
      language: 'PHP',
      package: 'trvl-social-php',
      description: 'PHP SDK for web applications and WordPress plugins',
      install: 'composer require trvl-social/php-sdk',
      docs: '#'
    },
    {
      language: 'iOS',
      package: 'TRVLSocialKit',
      description: 'Swift SDK for iOS mobile applications',
      install: 'pod \'TRVLSocialKit\'',
      docs: '#'
    }
  ];

  const useCases = [
    {
      title: 'Travel Blog Integration',
      description: 'Embed adventure listings and booking widgets in your travel blog',
      icon: '📝'
    },
    {
      title: 'Mobile App Development',
      description: 'Build custom mobile apps that connect to TRVL Social services',
      icon: '📱'
    },
    {
      title: 'Business Intelligence',
      description: 'Access booking and user data for analytics and reporting',
      icon: '📈'
    },
    {
      title: 'Third-party Integrations',
      description: 'Integrate with CRM, marketing, and business management tools',
      icon: '🔗'
    },
    {
      title: 'Custom Vendor Portals',
      description: 'Build specialized interfaces for vendor management',
      icon: '🏢'
    },
    {
      title: 'Affiliate Marketing',
      description: 'Create affiliate programs and tracking systems',
      icon: '💰'
    }
  ];

  return (
    <StaticPageLayout
      title="API Documentation"
      description="Build amazing applications with the TRVL Social API. Access our platform data and services programmatically."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Need API Access?"
      ctaDescription="Request API credentials and start building with TRVL Social today."
      ctaLink="mailto:developers@trvlsocial.com"
      ctaText="Request API Access"
    >
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <GlassCard className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-3xl font-bold mb-6">TRVL Social API</h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              Our RESTful API provides secure access to TRVL Social's platform data and services.
              Build integrations, mobile apps, and custom solutions that connect with our travel community.
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                REST API
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                JSON Responses
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                OAuth 2.0
              </span>
            </div>
          </GlassCard>
        </section>

        {/* Quick Start */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Quick Start</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="text-xl font-semibold mb-3">1. Get API Keys</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Request API credentials from our developer portal
              </p>
              <GlassButton variant="primary" size="sm">
                Request Keys
              </GlassButton>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-3">2. Read Docs</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Explore our comprehensive API documentation
              </p>
              <GlassButton variant="secondary" size="sm">
                View Docs
              </GlassButton>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3">3. Start Building</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Make your first API call and start integrating
              </p>
              <GlassButton variant="secondary" size="sm">
                Try Now
              </GlassButton>
            </GlassCard>
          </div>
        </section>

        {/* API Endpoints */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">API Endpoints</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            Base URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">https://api.trvlsocial.com</code>
          </p>
          <div className="space-y-6">
            {endpoints.map((category, index) => (
              <GlassCard key={index} className="p-6">
                <h3 className="text-xl font-semibold mb-4">{category.category}</h3>
                <div className="space-y-3">
                  {category.methods.map((method, methodIndex) => (
                    <div key={methodIndex} className="flex items-center space-x-4 p-3 border border-white/20 dark:border-white/10 rounded-lg">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        method.method === 'GET' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        method.method === 'POST' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        method.method === 'PUT' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                        'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {method.method}
                      </span>
                      <code className="font-mono text-sm flex-1">{method.endpoint}</code>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{method.description}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* SDKs */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Official SDKs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {sdks.map((sdk, index) => (
              <GlassCard key={index} className="p-6">
                <h3 className="text-xl font-semibold mb-3">{sdk.language}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{sdk.description}</p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4">
                  <code className="text-sm">{sdk.install}</code>
                </div>
                <div className="flex space-x-3">
                  <GlassButton variant="primary" size="sm">
                    Documentation
                  </GlassButton>
                  <GlassButton variant="secondary" size="sm">
                    GitHub
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">What You Can Build</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-lg font-semibold mb-3">{useCase.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{useCase.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Authentication</h2>
          <GlassCard className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">OAuth 2.0 Flow</h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-500">1.</span>
                    <span>Redirect users to TRVL Social authorization URL</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-500">2.</span>
                    <span>User grants permission to your application</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-500">3.</span>
                    <span>Exchange authorization code for access token</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-500">4.</span>
                    <span>Use access token to make authenticated API calls</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">API Key Authentication</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  For server-to-server applications, use API key authentication:
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <code className="text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Rate Limits */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Rate Limits & Guidelines</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="text-center p-6">
              <h3 className="text-lg font-semibold mb-3">Standard Tier</h3>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">1,000</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">requests per hour</p>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <h3 className="text-lg font-semibold mb-3">Premium Tier</h3>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">10,000</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">requests per hour</p>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <h3 className="text-lg font-semibold mb-3">Enterprise</h3>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Custom</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">contact sales</p>
            </GlassCard>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Developer Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">Developer Forum</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Community support and discussions
              </p>
              <GlassButton variant="secondary" size="sm">
                Join Forum
              </GlassButton>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Direct technical support
              </p>
              <GlassButton variant="secondary" size="sm">
                Contact Support
              </GlassButton>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-lg font-semibold mb-2">Documentation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Comprehensive guides and references
              </p>
              <GlassButton variant="secondary" size="sm">
                View Docs
              </GlassButton>
            </GlassCard>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default APIPage;