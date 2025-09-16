import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const VendorResourcesPage = () => {
  const breadcrumbs = [{ title: "Vendor Resources" }];

  const resources = [
    {
      category: 'Getting Started',
      icon: '🚀',
      items: [
        {
          title: 'Vendor Onboarding Guide',
          description: 'Complete step-by-step guide to becoming a verified vendor',
          type: 'PDF Guide',
          downloadUrl: '#'
        },
        {
          title: 'Platform Overview Video',
          description: 'Introduction to TRVL Social vendor features and benefits',
          type: 'Video Tutorial',
          downloadUrl: '#'
        },
        {
          title: 'Verification Checklist',
          description: 'Required documents and steps for vendor verification',
          type: 'Checklist',
          downloadUrl: '#'
        }
      ]
    },
    {
      category: 'Marketing & Promotion',
      icon: '📢',
      items: [
        {
          title: 'Adventure Listing Best Practices',
          description: 'Tips for creating compelling adventure descriptions and photos',
          type: 'Guide',
          downloadUrl: '#'
        },
        {
          title: 'SEO Optimization Guide',
          description: 'How to optimize your listings for better visibility',
          type: 'Guide',
          downloadUrl: '#'
        },
        {
          title: 'Photo Guidelines',
          description: 'Professional photography tips and requirements',
          type: 'Visual Guide',
          downloadUrl: '#'
        },
        {
          title: 'Seasonal Marketing Calendar',
          description: 'Key dates and trends for travel marketing',
          type: 'Calendar',
          downloadUrl: '#'
        }
      ]
    },
    {
      category: 'Operations & Management',
      icon: '⚙️',
      items: [
        {
          title: 'Booking Management Guide',
          description: 'How to handle bookings, cancellations, and modifications',
          type: 'Manual',
          downloadUrl: '#'
        },
        {
          title: 'Customer Communication Templates',
          description: 'Pre-written templates for common customer interactions',
          type: 'Templates',
          downloadUrl: '#'
        },
        {
          title: 'Group Management Best Practices',
          description: 'Tips for managing group dynamics and experiences',
          type: 'Guide',
          downloadUrl: '#'
        },
        {
          title: 'Crisis Management Handbook',
          description: 'Emergency procedures and crisis communication',
          type: 'Handbook',
          downloadUrl: '#'
        }
      ]
    },
    {
      category: 'Financial & Legal',
      icon: '💰',
      items: [
        {
          title: 'Payment Processing Guide',
          description: 'Understanding payments, fees, and payout schedules',
          type: 'Guide',
          downloadUrl: '#'
        },
        {
          title: 'Tax Documentation',
          description: 'Tax forms and reporting requirements for vendors',
          type: 'Forms',
          downloadUrl: '#'
        },
        {
          title: 'Insurance Requirements',
          description: 'Required insurance coverage and recommendations',
          type: 'Requirements',
          downloadUrl: '#'
        },
        {
          title: 'Vendor Agreement Template',
          description: 'Standard vendor terms and conditions',
          type: 'Legal Document',
          downloadUrl: '#'
        }
      ]
    }
  ];

  const tools = [
    {
      name: 'Vendor Dashboard',
      description: 'Comprehensive control panel for managing your adventures, bookings, and analytics',
      features: ['Booking management', 'Revenue analytics', 'Customer reviews', 'Calendar sync'],
      access: 'Web & Mobile App'
    },
    {
      name: 'Communication Hub',
      description: 'Centralized messaging system for customer and group communication',
      features: ['Group chats', 'Automated notifications', 'Translation support', 'File sharing'],
      access: 'Web & Mobile App'
    },
    {
      name: 'Analytics Suite',
      description: 'Detailed insights into your business performance and customer behavior',
      features: ['Revenue tracking', 'Booking trends', 'Customer insights', 'Performance metrics'],
      access: 'Web Dashboard'
    },
    {
      name: 'Marketing Tools',
      description: 'Built-in tools to promote your adventures and reach more customers',
      features: ['Social sharing', 'Promotional campaigns', 'SEO optimization', 'Review management'],
      access: 'Web Dashboard'
    }
  ];

  const supportChannels = [
    {
      type: 'Vendor Support',
      icon: '🎆',
      contact: 'vendors@trvlsocial.com',
      description: 'Dedicated support for vendor-specific questions and issues',
      responseTime: '4-8 hours'
    },
    {
      type: 'Technical Support',
      icon: '🔧',
      contact: 'tech-support@trvlsocial.com',
      description: 'Help with platform features, API, and technical problems',
      responseTime: '2-4 hours'
    },
    {
      type: 'Partnership Team',
      icon: '🤝',
      contact: 'partnerships@trvlsocial.com',
      description: 'Strategic partnerships and business development opportunities',
      responseTime: '1-2 business days'
    },
    {
      type: 'Emergency Line',
      icon: '🚑',
      contact: '+1 (555) 911-VENDOR',
      description: 'Urgent issues during active trips and emergencies',
      responseTime: 'Immediate'
    }
  ];

  return (
    <StaticPageLayout
      title="Vendor Resources"
      description="Everything you need to succeed as a TRVL Social vendor - guides, tools, and support."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Ready to Become a Vendor?"
      ctaDescription="Join our network of trusted adventure providers and start hosting amazing experiences."
      ctaLink="/vendor-portal/apply"
      ctaText="Apply Now"
    >
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <GlassCard className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-3xl font-bold mb-6">Welcome to the Vendor Resource Center</h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              Whether you're just starting out or looking to optimize your existing adventures,
              this resource center provides everything you need to succeed on the TRVL Social platform.
            </p>
          </GlassCard>
        </section>

        {/* Resource Categories */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Resource Library</h2>
          <div className="space-y-8">
            {resources.map((category, index) => (
              <GlassCard key={index} className="p-8">
                <div className="flex items-center mb-6">
                  <div className="text-3xl mr-4">{category.icon}</div>
                  <h3 className="text-2xl font-semibold">{category.category}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border border-white/20 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold mb-2">{item.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <GlassButton variant="secondary" size="sm" className="w-full">
                        Download
                      </GlassButton>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Platform Tools */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Platform Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tools.map((tool, index) => (
              <GlassCard key={index} className="p-6">
                <h3 className="text-xl font-semibold mb-3">{tool.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{tool.description}</p>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Key Features:</h4>
                  <ul className="space-y-1">
                    {tool.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2 text-sm">
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Access: {tool.access}
                </div>
                <GlassButton variant="primary" className="w-full">
                  Launch Tool
                </GlassButton>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Success Tips */}
        <section className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Tips for Success</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-3">Quality First</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Focus on creating exceptional experiences. Quality adventures get better reviews
                and higher rankings in our algorithm.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-semibold mb-3">Great Photos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                High-quality, authentic photos significantly increase booking rates.
                Show the real experience travelers will have.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-3">Communication</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Respond quickly to inquiries and keep groups informed.
                Great communication leads to happier customers.
              </p>
            </div>
          </div>
        </section>

        {/* Support Channels */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Vendor Support</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, index) => (
              <GlassCard key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{channel.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{channel.type}</h3>
                <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                  {channel.contact}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {channel.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Response: {channel.responseTime}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Community Forum */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Vendor Community</h2>
          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🎆</div>
              <h3 className="text-2xl font-semibold mb-4">Join the Vendor Forum</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Connect with other vendors, share experiences, get advice, and stay updated
                on platform changes and opportunities.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <h4 className="font-semibold mb-2">Knowledge Sharing</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Learn from experienced vendors and share your own insights
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Networking</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Build relationships and explore collaboration opportunities
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Platform Updates</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Stay informed about new features and policy changes
                </p>
              </div>
            </div>
            <div className="text-center">
              <GlassButton variant="primary" size="lg">
                Access Vendor Forum
              </GlassButton>
            </div>
          </GlassCard>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default VendorResourcesPage;