import { useState } from 'react';
import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const FAQPage = () => {
  const breadcrumbs = [{ title: "FAQ" }];
  const [openFAQ, setOpenFAQ] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'booking', name: 'Booking & Payments' },
    { id: 'safety', name: 'Safety & Security' },
    { id: 'community', name: 'Community' },
    { id: 'technical', name: 'Technical' }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How does TRVL Social work?',
      answer: 'TRVL Social connects like-minded travelers through our AI-powered matching system. You take a personality quiz, browse adventures, and get matched with compatible travel companions based on your interests, travel style, and personality traits.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'Do I need to pay to use TRVL Social?',
      answer: 'Creating an account and browsing adventures is free. You only pay when you book an actual trip. We charge a small service fee to help maintain the platform and ensure quality experiences.'
    },
    {
      id: 3,
      category: 'getting-started',
      question: 'How accurate is the personality matching?',
      answer: 'Our matching algorithm has a 95% accuracy rate based on user feedback. It considers personality traits, travel preferences, activity levels, and communication styles to create compatible groups.'
    },
    {
      id: 4,
      category: 'booking',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers in select regions.'
    },
    {
      id: 5,
      category: 'booking',
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel your booking. Cancellation policies vary by vendor and trip type. Most bookings allow free cancellation up to 48-72 hours before departure. Check the specific cancellation policy for your trip.'
    },
    {
      id: 6,
      category: 'booking',
      question: 'How does group payment splitting work?',
      answer: 'Our group payment feature allows you to split costs automatically among group members. The organizer can set up payment plans, and each member pays their portion directly through the platform.'
    },
    {
      id: 7,
      category: 'safety',
      question: 'How do you verify user identities?',
      answer: 'All users must complete identity verification including government-issued ID, phone number, and social media verification. We also conduct background checks for vendors and trip organizers.'
    },
    {
      id: 8,
      category: 'safety',
      question: 'What safety measures are in place during trips?',
      answer: 'We provide 24/7 emergency support, real-time check-in systems, emergency contact protocols, and all vendors are vetted and insured. We also recommend comprehensive travel insurance.'
    },
    {
      id: 9,
      category: 'safety',
      question: 'What if I feel unsafe during a trip?',
      answer: 'Contact our emergency hotline immediately at +1 (555) 911-SAFE. We have 24/7 crisis management support and can coordinate with local authorities if needed. Your safety is our top priority.'
    },
    {
      id: 10,
      category: 'community',
      question: 'What are the community guidelines?',
      answer: 'Our community guidelines promote respect, inclusivity, and safety. We prohibit harassment, discrimination, inappropriate content, and dangerous behavior. Violations can result in account suspension or permanent bans.'
    },
    {
      id: 11,
      category: 'community',
      question: 'Can I leave reviews for other travelers?',
      answer: 'Yes, after completing a trip, you can leave reviews for your travel companions and the experience itself. This helps maintain community quality and helps future travelers make informed decisions.'
    },
    {
      id: 12,
      category: 'community',
      question: 'How do I report inappropriate behavior?',
      answer: 'You can report users through the app, email safety@trvlsocial.com, or call our support line. We take all reports seriously and investigate promptly to maintain a safe community environment.'
    },
    {
      id: 13,
      category: 'technical',
      question: 'Is there a mobile app?',
      answer: 'Yes, we have mobile apps for both iOS and Android. The apps include all web features plus additional travel tools like offline maps, emergency features, and real-time group chat.'
    },
    {
      id: 14,
      category: 'technical',
      question: 'My app is not working properly. What should I do?',
      answer: 'Try restarting the app, checking your internet connection, and updating to the latest version. If problems persist, contact our technical support team at support@trvlsocial.com.'
    },
    {
      id: 15,
      category: 'technical',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email. If you don\'t receive the email, check your spam folder or contact support.'
    }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <StaticPageLayout
      title="Frequently Asked Questions"
      description="Find quick answers to the most common questions about TRVL Social."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Still Have Questions?"
      ctaDescription="Can't find what you're looking for? Our support team is here to help."
      ctaLink="/contact"
      ctaText="Contact Support"
    >
      <div className="space-y-8">
        {/* Search and Filter */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Bar */}
          <GlassCard className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                className="w-full px-4 py-3 pl-12 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </GlassCard>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-white/20'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Questions */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-center">
            {selectedCategory === 'all' ? 'Popular Questions' : 
             categories.find(cat => cat.id === selectedCategory)?.name + ' Questions'}
          </h2>
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <GlassCard key={faq.id} className="overflow-hidden">
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-6 text-left hover:bg-white/5 transition-colors duration-200 flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  <div className={`transform transition-transform duration-200 ${
                    openFAQ === faq.id ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </div>
                </button>
                {openFAQ === faq.id && (
                  <div className="px-6 pb-6 border-t border-white/10">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Need More Help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Get instant help from our support team
              </p>
              <GlassButton variant="primary">
                Start Chat
              </GlassButton>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Send us a detailed message
              </p>
              <GlassButton variant="secondary">
                Send Email
              </GlassButton>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">Help Center</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Browse our comprehensive guides
              </p>
              <GlassButton variant="secondary">
                Visit Help Center
              </GlassButton>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <GlassCard className="text-center p-6">
          <h3 className="text-xl font-semibold mb-4">Was this helpful?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Help us improve by letting us know if you found what you were looking for.
          </p>
          <div className="flex justify-center space-x-4">
            <GlassButton variant="primary">
              👍 Yes, helpful
            </GlassButton>
            <GlassButton variant="secondary">
              👎 No, needs improvement
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </StaticPageLayout>
  );
};

export default FAQPage;