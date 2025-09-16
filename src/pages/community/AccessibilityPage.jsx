import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const AccessibilityPage = () => {
  const breadcrumbs = [{ title: "Accessibility" }];

  const accessibilityFeatures = [
    {
      category: 'Visual Accessibility',
      icon: '👁️',
      features: [
        {
          feature: 'High Contrast Mode',
          description: 'Enhanced color contrast for better visibility',
          status: 'Available'
        },
        {
          feature: 'Screen Reader Support',
          description: 'Full compatibility with NVDA, JAWS, and VoiceOver',
          status: 'Available'
        },
        {
          feature: 'Text Size Controls',
          description: 'Adjustable font sizes up to 200% without loss of functionality',
          status: 'Available'
        },
        {
          feature: 'Alt Text for Images',
          description: 'Descriptive alternative text for all images and graphics',
          status: 'Available'
        }
      ]
    },
    {
      category: 'Motor Accessibility',
      icon: '⌨️',
      features: [
        {
          feature: 'Keyboard Navigation',
          description: 'Full site functionality using only keyboard inputs',
          status: 'Available'
        },
        {
          feature: 'Focus Indicators',
          description: 'Clear visual indicators for keyboard focus',
          status: 'Available'
        },
        {
          feature: 'Voice Control Support',
          description: 'Compatible with voice navigation software',
          status: 'Available'
        },
        {
          feature: 'Extended Time Limits',
          description: 'Adjustable or extended timeouts for form completion',
          status: 'Available'
        }
      ]
    },
    {
      category: 'Hearing Accessibility',
      icon: '🔊',
      features: [
        {
          feature: 'Video Captions',
          description: 'Closed captions for all video content',
          status: 'Available'
        },
        {
          feature: 'Visual Alerts',
          description: 'Visual notifications for audio alerts',
          status: 'Available'
        },
        {
          feature: 'Transcript Support',
          description: 'Text transcripts for audio and video content',
          status: 'In Development'
        }
      ]
    },
    {
      category: 'Cognitive Accessibility',
      icon: '🧠',
      features: [
        {
          feature: 'Simple Language',
          description: 'Clear, concise language throughout the platform',
          status: 'Available'
        },
        {
          feature: 'Consistent Navigation',
          description: 'Predictable and consistent site structure',
          status: 'Available'
        },
        {
          feature: 'Error Prevention',
          description: 'Clear error messages and prevention mechanisms',
          status: 'Available'
        },
        {
          feature: 'Help Documentation',
          description: 'Comprehensive help and support resources',
          status: 'Available'
        }
      ]
    }
  ];

  const wcagCompliance = [
    {
      level: 'WCAG 2.1 Level A',
      status: 'Compliant',
      description: 'Basic accessibility requirements met',
      color: 'green'
    },
    {
      level: 'WCAG 2.1 Level AA',
      status: 'Compliant',
      description: 'Enhanced accessibility standards achieved',
      color: 'green'
    },
    {
      level: 'WCAG 2.1 Level AAA',
      status: 'Partial',
      description: 'Working towards highest accessibility standards',
      color: 'yellow'
    }
  ];

  const assistiveTech = [
    {
      name: 'Screen Readers',
      compatible: ['NVDA', 'JAWS', 'VoiceOver', 'TalkBack', 'Dragon Naturally Speaking'],
      icon: '📱'
    },
    {
      name: 'Voice Control',
      compatible: ['Dragon NaturallySpeaking', 'Voice Control (iOS/macOS)', 'Voice Access (Android)'],
      icon: '🎤'
    },
    {
      name: 'Switch Devices',
      compatible: ['Switch Control (iOS)', 'Switch Access (Android)', 'Hardware switches'],
      icon: '🔘'
    },
    {
      name: 'Magnification',
      compatible: ['ZoomText', 'Magnifier (Windows)', 'Zoom (macOS)', 'Browser zoom'],
      icon: '🔍'
    }
  ];

  const travelAccessibility = [
    {
      title: 'Accessible Adventure Listings',
      description: 'Detailed accessibility information for each adventure including mobility requirements, sensory considerations, and available accommodations.',
      icon: '♿'
    },
    {
      title: 'Accessibility Filters',
      description: 'Search and filter adventures based on specific accessibility needs and requirements.',
      icon: '🔍'
    },
    {
      title: 'Vendor Accessibility Training',
      description: 'Educational resources and training for vendors to make their adventures more inclusive.',
      icon: '🎓'
    },
    {
      title: 'Accessibility Support Team',
      description: 'Dedicated support specialists to help with accessibility questions and adventure planning.',
      icon: '🤝'
    }
  ];

  return (
    <StaticPageLayout
      title="Accessibility Statement"
      description="TRVL Social is committed to making travel accessible to everyone. Learn about our accessibility features and ongoing efforts."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Need Accessibility Support?"
      ctaDescription="Our accessibility team is here to help with any questions or assistance you may need."
      ctaLink="mailto:accessibility@trvlsocial.com"
      ctaText="Contact Accessibility Team"
    >
      <div className="space-y-12">
        {/* Commitment Statement */}
        <section>
          <GlassCard className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-3xl font-bold mb-6">Our Accessibility Commitment</h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              TRVL Social believes that travel should be accessible to everyone, regardless of ability.
              We're committed to creating an inclusive platform that removes barriers and enables all
              travelers to discover, connect, and explore the world together.
            </p>
          </GlassCard>
        </section>

        {/* WCAG Compliance */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Web Accessibility Standards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {wcagCompliance.map((standard, index) => {
              const colorClasses = {
                green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
                yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
                red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              };
              
              return (
                <GlassCard key={index} className={`text-center p-6 ${colorClasses[standard.color]}`}>
                  <h3 className="text-lg font-semibold mb-2">{standard.level}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                    standard.status === 'Compliant' 
                      ? 'bg-green-500 text-white'
                      : standard.status === 'Partial'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {standard.status}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{standard.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Platform Features */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Platform Accessibility Features</h2>
          <div className="space-y-8">
            {accessibilityFeatures.map((category, index) => (
              <GlassCard key={index} className="p-8">
                <div className="flex items-center mb-6">
                  <div className="text-3xl mr-4">{category.icon}</div>
                  <h3 className="text-2xl font-semibold">{category.category}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="border border-white/20 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{feature.feature}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feature.status === 'Available' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Assistive Technology */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Assistive Technology Support</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {assistiveTech.map((tech, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">{tech.icon}</div>
                  <h3 className="text-lg font-semibold">{tech.name}</h3>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Compatible with:</p>
                  <ul className="space-y-1">
                    {tech.compatible.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center space-x-2 text-sm">
                        <span className="text-green-500">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Travel Accessibility */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Accessible Travel Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {travelAccessibility.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accessibility Controls */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Accessibility Controls</h2>
          <GlassCard className="p-8">
            <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
              Use these controls to customize your experience on TRVL Social:
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              <GlassButton variant="secondary" className="w-full">
                🎨 High Contrast
              </GlassButton>
              <GlassButton variant="secondary" className="w-full">
                🔍 Large Text
              </GlassButton>
              <GlassButton variant="secondary" className="w-full">
                ⌨️ Keyboard Nav
              </GlassButton>
              <GlassButton variant="secondary" className="w-full">
                🔊 Screen Reader
              </GlassButton>
            </div>
          </GlassCard>
        </section>

        {/* Feedback and Testing */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Continuous Improvement</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-4">User Testing</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We regularly conduct accessibility testing with users who have disabilities
                to ensure our platform meets real-world needs.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Monthly user testing sessions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Automated accessibility scanning</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Expert accessibility audits</span>
                </li>
              </ul>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-4">Feedback & Support</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We welcome feedback about accessibility barriers and are committed
                to addressing issues promptly.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span>📧</span>
                  <span className="text-sm">accessibility@trvlsocial.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span>📞</span>
                  <span className="text-sm">+1 (555) 123-ACCESS</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span>💬</span>
                  <span className="text-sm">Live chat support available</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Legal Information */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Legal & Compliance</h2>
          <GlassCard className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Americans with Disabilities Act (ADA)</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  TRVL Social is committed to compliance with the Americans with Disabilities Act and
                  ensuring equal access to our services for all users.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Web Content Accessibility Guidelines (WCAG)</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Our platform follows WCAG 2.1 Level AA guidelines as the technical standard
                  for accessibility compliance.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Section 508</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  We ensure compatibility with Section 508 standards for federal accessibility
                  requirements when working with government partners.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Last Updated */}
        <GlassCard className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">Accessibility Statement</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This accessibility statement was last reviewed and updated on March 15, 2024.
            We review and update our accessibility practices regularly to ensure continued compliance
            and improvement.
          </p>
        </GlassCard>
      </div>
    </StaticPageLayout>
  );
};

export default AccessibilityPage;