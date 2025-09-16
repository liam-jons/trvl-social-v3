import { useState } from 'react';
import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const HelpPage = () => {
  const breadcrumbs = [{ title: "Help Center" }];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      description: 'Learn the basics of using TRVL Social',
      articles: [
        'How to create your profile',
        'Taking the personality quiz',
        'Finding your first adventure',
        'Understanding compatibility scores'
      ]
    },
    {
      id: 'booking',
      title: 'Booking & Payments',
      icon: '💳',
      description: 'Everything about bookings and payments',
      articles: [
        'How to book an adventure',
        'Payment methods and security',
        'Cancellation and refund policy',
        'Group payment splitting'
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      icon: '🛡️',
      description: 'Staying safe while traveling',
      articles: [
        'Safety verification process',
        'Emergency contact procedures',
        'Travel insurance recommendations',
        'Reporting safety concerns'
      ]
    },
    {
      id: 'community',
      title: 'Community Guidelines',
      icon: '🤝',
      description: 'How to be a great community member',
      articles: [
        'Community rules and guidelines',
        'Communication best practices',
        'Resolving disputes',
        'Leaving reviews and feedback'
      ]
    },
    {
      id: 'account',
      title: 'Account Management',
      icon: '⚙️',
      description: 'Managing your TRVL Social account',
      articles: [
        'Updating your profile',
        'Privacy settings',
        'Notification preferences',
        'Deleting your account'
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: '🔧',
      description: 'Technical issues and troubleshooting',
      articles: [
        'App not loading properly',
        'Login and password issues',
        'Notification problems',
        'Browser compatibility'
      ]
    }
  ];

  const popularArticles = [
    'How to join a travel group',
    'Understanding personality compatibility',
    'What to expect on your first group trip',
    'How to become a verified vendor',
    'Safety tips for group travel'
  ];

  return (
    <StaticPageLayout
      title="Help Center"
      description="Find answers to common questions and get the support you need for your TRVL Social journey."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Can't Find What You're Looking For?"
      ctaDescription="Our support team is here to help with any questions or concerns."
      ctaLink="/contact"
      ctaText="Contact Support"
    >
      <div className="space-y-12">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <GlassCard className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">How can we help you?</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Popular Articles */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Popular Help Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article, index) => (
              <GlassCard key={index} className="p-4 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-500">📝</div>
                  <span className="text-sm font-medium">{article}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Help Categories */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => (
              <GlassCard 
                key={category.id} 
                className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{category.description}</p>
                </div>
                
                {selectedCategory === category.id && (
                  <div className="mt-6 pt-4 border-t border-white/20 dark:border-white/10">
                    <h4 className="font-semibold mb-3">Articles in this category:</h4>
                    <ul className="space-y-2">
                      {category.articles.map((article, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                          <span>•</span>
                          <span>{article}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <GlassButton variant="secondary" size="sm">
                    {selectedCategory === category.id ? 'Hide Articles' : 'View Articles'}
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Contact Options */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Still Need Help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Chat with our support team in real-time
              </p>
              <GlassButton variant="primary">
                Start Chat
              </GlassButton>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Send us a detailed message about your issue
              </p>
              <GlassButton variant="secondary">
                Send Email
              </GlassButton>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Call us during business hours
              </p>
              <GlassButton variant="secondary">
                +1 (555) 123-4567
              </GlassButton>
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <GlassCard className="text-center p-6">
          <h3 className="text-xl font-semibold mb-4">Support Hours</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Live Chat:</strong><br />
              24/7 Available
            </div>
            <div>
              <strong>Email Support:</strong><br />
              24-48 hour response
            </div>
            <div>
              <strong>Phone Support:</strong><br />
              Mon-Fri 9AM-6PM PST
            </div>
          </div>
        </GlassCard>
      </div>
    </StaticPageLayout>
  );
};

export default HelpPage;