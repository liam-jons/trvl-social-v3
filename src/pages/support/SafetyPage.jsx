import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const SafetyPage = () => {
  const breadcrumbs = [{ title: "Safety Guidelines" }];

  const safetyFeatures = [
    {
      icon: '✓️',
      title: 'Identity Verification',
      description: 'All users undergo a thorough identity verification process including government ID and social media verification.'
    },
    {
      icon: '📱',
      title: 'Real-time Check-ins',
      description: 'Regular check-in system allows you to share your location and status with emergency contacts and our safety team.'
    },
    {
      icon: '🚑',
      title: '24/7 Emergency Support',
      description: 'Round-the-clock emergency assistance available through our dedicated safety hotline and mobile app.'
    },
    {
      icon: '🛡️',
      title: 'Background Checks',
      description: 'Comprehensive background checks for all vendors and trip organizers to ensure community safety.'
    }
  ];

  const safetyTips = [
    {
      category: 'Before You Travel',
      icon: '🎒',
      tips: [
        'Research your destination thoroughly',
        'Share your itinerary with trusted contacts',
        'Verify your travel companions\' profiles',
        'Purchase comprehensive travel insurance',
        'Register with your embassy if traveling internationally'
      ]
    },
    {
      category: 'During Your Trip',
      icon: '✈️',
      tips: [
        'Check in regularly using our app',
        'Stay with the group and communicate plans',
        'Keep emergency contacts easily accessible',
        'Trust your instincts and speak up if uncomfortable',
        'Follow local laws and customs'
      ]
    },
    {
      category: 'Emergency Situations',
      icon: '🆘',
      tips: [
        'Contact local emergency services first (911, 112, etc.)',
        'Use our emergency alert feature in the app',
        'Contact your emergency contacts immediately',
        'Keep important documents secure and backed up',
        'Stay calm and follow emergency procedures'
      ]
    }
  ];

  const emergencyContacts = [
    {
      type: 'Emergency Hotline',
      contact: '+1 (555) 911-SAFE',
      description: '24/7 emergency assistance for immediate safety concerns'
    },
    {
      type: 'Safety Support',
      contact: 'safety@trvlsocial.com',
      description: 'Non-emergency safety questions and incident reporting'
    },
    {
      type: 'Crisis Management',
      contact: '+1 (555) 911-CRISIS',
      description: 'Major incident response and crisis coordination'
    }
  ];

  return (
    <StaticPageLayout
      title="Safety Guidelines"
      description="Your safety is our top priority. Learn about our comprehensive safety measures and travel guidelines."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Report a Safety Concern"
      ctaDescription="If you have any safety concerns or incidents to report, please contact us immediately."
      ctaLink="mailto:safety@trvlsocial.com"
      ctaText="Contact Safety Team"
    >
      <div className="space-y-12">
        {/* Safety Commitment */}
        <section>
          <GlassCard className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-3xl font-bold mb-6">Our Safety Commitment</h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              At TRVL Social, we believe that adventure and safety go hand in hand. We've implemented
              comprehensive safety measures, verification processes, and support systems to ensure
              every member of our community can explore the world with confidence and peace of mind.
            </p>
          </GlassCard>
        </section>

        {/* Safety Features */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Our Safety Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {safetyFeatures.map((feature, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl text-green-500">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Safety Tips */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Safety Guidelines</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {safetyTips.map((category, index) => (
              <GlassCard key={index} className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-xl font-semibold">{category.category}</h3>
                </div>
                <ul className="space-y-3">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start space-x-2">
                      <div className="text-blue-500 mt-1">•</div>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Emergency Contacts */}
        <section className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center text-red-600 dark:text-red-400">
            Emergency Contacts
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {emergencyContacts.map((contact, index) => (
              <GlassCard key={index} className="text-center p-6 border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
                  {contact.type}
                </h3>
                <div className="text-xl font-bold mb-3">{contact.contact}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{contact.description}</p>
              </GlassCard>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-red-600 dark:text-red-400 font-semibold">
              ⚠️ In case of immediate danger, always contact local emergency services first (911, 112, etc.)
            </p>
          </div>
        </section>

        {/* Reporting Process */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Incident Reporting</h2>
          <GlassCard className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">When to Report</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• Any safety concerns during your trip</li>
                  <li>• Inappropriate behavior from community members</li>
                  <li>• Vendor-related safety issues</li>
                  <li>• Emergencies or incidents requiring assistance</li>
                  <li>• Violations of community guidelines</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">How to Report</h3>
                <div className="space-y-4">
                  <GlassButton variant="primary" className="w-full">
                    Report via Mobile App
                  </GlassButton>
                  <GlassButton variant="secondary" className="w-full">
                    Email Safety Team
                  </GlassButton>
                  <GlassButton variant="secondary" className="w-full">
                    Call Emergency Hotline
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Travel Insurance */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Travel Insurance</h2>
          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold mb-4">Protect Your Adventure</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                While we provide comprehensive safety measures, we strongly recommend purchasing
                travel insurance for additional protection and peace of mind.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🏥</div>
                <h4 className="font-semibold mb-2">Medical Coverage</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Emergency medical expenses abroad</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">✈️</div>
                <h4 className="font-semibold mb-2">Trip Protection</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Cancellation and interruption coverage</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🎆</div>
                <h4 className="font-semibold mb-2">Emergency Assistance</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">24/7 emergency travel assistance</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <GlassButton variant="primary">
                Find Travel Insurance
              </GlassButton>
            </div>
          </GlassCard>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default SafetyPage;