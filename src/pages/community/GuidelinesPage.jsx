import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const GuidelinesPage = () => {
  const breadcrumbs = [{ title: "Community Guidelines" }];

  const coreValues = [
    {
      icon: '🤝',
      title: 'Respect',
      description: 'Treat all community members with kindness, dignity, and respect regardless of background, beliefs, or travel experience.'
    },
    {
      icon: '🌍',
      title: 'Inclusivity',
      description: 'Welcome travelers from all walks of life. Our community thrives on diversity and different perspectives.'
    },
    {
      icon: '🛡️',
      title: 'Safety',
      description: 'Prioritize the safety and well-being of yourself and fellow travelers. Report concerns immediately.'
    },
    {
      icon: '✨',
      title: 'Authenticity',
      description: 'Be genuine in your interactions. Share honest experiences and provide accurate information.'
    }
  ];

  const guidelines = [
    {
      category: 'Communication & Interaction',
      icon: '💬',
      rules: [
        'Use respectful and inclusive language in all communications',
        'No harassment, bullying, or discriminatory behavior',
        'Keep conversations relevant to travel and community topics',
        'Respect privacy and personal boundaries',
        'Report inappropriate behavior immediately'
      ]
    },
    {
      category: 'Profile & Content',
      icon: '📝',
      rules: [
        'Use real, recent photos that accurately represent yourself',
        'Provide honest information in your profile and preferences',
        'No fake profiles, impersonation, or misleading information',
        'Keep content appropriate and travel-related',
        'Respect intellectual property and image rights'
      ]
    },
    {
      category: 'Booking & Financial',
      icon: '💳',
      rules: [
        'Honor your booking commitments and payment obligations',
        'Communicate changes or cancellations promptly',
        'No fraudulent payment methods or financial scams',
        'Respect group payment agreements and deadlines',
        'Report financial disputes through proper channels'
      ]
    },
    {
      category: 'Safety & Security',
      icon: '🛡️',
      rules: [
        'Complete identity verification and maintain accurate information',
        'Follow all safety guidelines and local laws during travel',
        'Report safety concerns or emergencies immediately',
        'Respect group safety decisions and protocols',
        'No sharing of personal information outside the platform'
      ]
    }
  ];

  const violations = [
    {
      severity: 'Minor Violations',
      color: 'yellow',
      examples: ['Late communication', 'Minor booking issues', 'Unclear profile information'],
      consequences: ['Warning', 'Account review', 'Required profile updates']
    },
    {
      severity: 'Moderate Violations',
      color: 'orange',
      examples: ['Inappropriate content', 'Disrespectful behavior', 'Repeated minor violations'],
      consequences: ['Temporary suspension', 'Content removal', 'Mandatory community service']
    },
    {
      severity: 'Severe Violations',
      color: 'red',
      examples: ['Harassment', 'Fraud', 'Safety violations', 'Discriminatory behavior'],
      consequences: ['Account suspension', 'Permanent ban', 'Legal action if necessary']
    }
  ];

  return (
    <StaticPageLayout
      title="Community Guidelines"
      description="Our guidelines ensure TRVL Social remains a safe, welcoming, and positive space for all travelers."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Questions About Guidelines?"
      ctaDescription="Need clarification on any of our community rules? We're here to help."
      ctaLink="/contact"
      ctaText="Contact Support"
    >
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <GlassCard className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-3xl font-bold mb-6">Building a Better Travel Community</h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              These guidelines help create a positive environment where every traveler can connect,
              explore, and create amazing memories together. By following these principles, we build
              a community based on trust, respect, and shared adventure.
            </p>
          </GlassCard>
        </section>

        {/* Core Values */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => (
              <GlassCard key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{value.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Detailed Guidelines */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Community Guidelines</h2>
          <div className="space-y-8">
            {guidelines.map((section, index) => (
              <GlassCard key={index} className="p-8">
                <div className="flex items-center mb-6">
                  <div className="text-3xl mr-4">{section.icon}</div>
                  <h3 className="text-2xl font-semibold">{section.category}</h3>
                </div>
                <ul className="space-y-3">
                  {section.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start space-x-3">
                      <div className="text-green-500 mt-1">✓</div>
                      <span className="text-gray-700 dark:text-gray-300">{rule}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Violations and Consequences */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Violations & Consequences</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            We take community guidelines seriously. Here's what happens when guidelines are violated:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {violations.map((violation, index) => {
              const colorClasses = {
                yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
                orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
                red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              };
              
              return (
                <GlassCard key={index} className={`p-6 ${colorClasses[violation.color]}`}>
                  <h3 className="text-xl font-semibold mb-4 text-center">{violation.severity}</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Examples:</h4>
                    <ul className="space-y-1 text-sm">
                      {violation.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Consequences:</h4>
                    <ul className="space-y-1 text-sm">
                      {violation.consequences.map((consequence, consequenceIndex) => (
                        <li key={consequenceIndex} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{consequence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Reporting */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Reporting Violations</h2>
          <GlassCard className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">When to Report</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• Harassment or bullying behavior</li>
                  <li>• Inappropriate or offensive content</li>
                  <li>• Safety concerns or violations</li>
                  <li>• Fraudulent or suspicious activity</li>
                  <li>• Discrimination or hate speech</li>
                  <li>• Any behavior that makes you uncomfortable</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">How to Report</h3>
                <div className="space-y-4">
                  <GlassButton variant="primary" className="w-full">
                    Report via App
                  </GlassButton>
                  <GlassButton variant="secondary" className="w-full">
                    Email Support
                  </GlassButton>
                  <GlassButton variant="secondary" className="w-full">
                    Emergency Hotline
                  </GlassButton>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  All reports are confidential and investigated promptly.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Appeal Process */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Appeal Process</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            If you believe a moderation decision was made in error, you can appeal:
          </p>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Submit Appeal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Contact our appeals team with details</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Review</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Independent review of your case</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Decision</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Final decision within 5 business days</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 dark:text-orange-400 font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Resolution</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Account restoration if appeal successful</p>
            </div>
          </div>
        </section>

        {/* Updates */}
        <GlassCard className="text-center p-6">
          <h3 className="text-xl font-semibold mb-4">Guideline Updates</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            These guidelines may be updated from time to time. We'll notify the community of any
            significant changes and the updated guidelines will take effect immediately.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: September 20, 2025
          </p>
        </GlassCard>
      </div>
    </StaticPageLayout>
  );
};

export default GuidelinesPage;