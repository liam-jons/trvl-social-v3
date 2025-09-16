import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const PartnersPage = () => {
  const breadcrumbs = [{ title: "Partner Program" }];

  const partnerTypes = [
    {
      type: 'Travel Brands',
      icon: '✈️',
      description: 'Airlines, hotels, and travel service providers',
      benefits: [
        'Cross-promotional opportunities',
        'Integrated booking experiences',
        'Shared customer insights',
        'Co-branded marketing campaigns'
      ]
    },
    {
      type: 'Technology Partners',
      icon: '💻',
      description: 'Software providers and platform integrators',
      benefits: [
        'API access and integration support',
        'Technical documentation and SDKs',
        'Joint product development',
        'White-label solutions'
      ]
    },
    {
      type: 'Content Creators',
      icon: '📹',
      description: 'Influencers, bloggers, and content producers',
      benefits: [
        'Sponsored content opportunities',
        'Exclusive adventure access',
        'Revenue sharing programs',
        'Creative collaboration projects'
      ]
    },
    {
      type: 'Educational Institutions',
      icon: '🎓',
      description: 'Universities, schools, and educational programs',
      benefits: [
        'Student group discounts',
        'Educational travel programs',
        'Internship opportunities',
        'Research collaboration'
      ]
    }
  ];

  const partnershipTiers = [
    {
      tier: 'Explorer',
      description: 'Perfect for small businesses and content creators',
      features: [
        'Basic API access',
        'Marketing resource library',
        'Community forum access',
        'Email support'
      ],
      requirements: [
        'Minimum 1K monthly visitors/followers',
        'Travel-related business or content',
        'Basic application approval'
      ]
    },
    {
      tier: 'Navigator',
      description: 'Ideal for established businesses and brands',
      features: [
        'Enhanced API access',
        'Dedicated partner manager',
        'Co-marketing opportunities',
        'Priority support',
        'Custom integration options'
      ],
      requirements: [
        'Minimum 10K monthly visitors/customers',
        'Proven track record in travel industry',
        'Detailed application review'
      ]
    },
    {
      tier: 'Pioneer',
      description: 'For enterprise partners and major brands',
      features: [
        'Full API access and customization',
        'Executive relationship management',
        'Joint marketing campaigns',
        'White-label solutions',
        'Revenue sharing programs',
        'Custom development support'
      ],
      requirements: [
        'Significant market presence',
        'Strategic business alignment',
        'Executive approval process'
      ]
    }
  ];

  const currentPartners = [
    {
      name: 'SkyWings Airlines',
      type: 'Travel Brand',
      description: 'Exclusive flight deals for adventure groups',
      logo: '✈️'
    },
    {
      name: 'AdventureGear Co.',
      type: 'Equipment Partner',
      description: 'Travel gear discounts for community members',
      logo: '🎒'
    },
    {
      name: 'TravelTech Solutions',
      type: 'Technology Partner',
      description: 'Payment processing and booking technology',
      logo: '💻'
    },
    {
      name: 'Global Nomad University',
      type: 'Educational Partner',
      description: 'Study abroad and educational travel programs',
      logo: '🎓'
    },
    {
      name: 'WanderlustMedia',
      type: 'Content Partner',
      description: 'Travel content creation and promotion',
      logo: '📹'
    },
    {
      name: 'SafeTravel Insurance',
      type: 'Service Partner',
      description: 'Comprehensive travel insurance solutions',
      logo: '🛡️'
    }
  ];

  const applicationProcess = [
    {
      step: 1,
      title: 'Initial Application',
      description: 'Submit your partnership application with business details and partnership goals'
    },
    {
      step: 2,
      title: 'Evaluation',
      description: 'Our partnerships team reviews your application and business alignment'
    },
    {
      step: 3,
      title: 'Partnership Discussion',
      description: 'Schedule a call to discuss partnership opportunities and requirements'
    },
    {
      step: 4,
      title: 'Agreement',
      description: 'Finalize partnership terms and sign the partnership agreement'
    },
    {
      step: 5,
      title: 'Onboarding',
      description: 'Get access to partner resources and begin collaboration'
    }
  ];

  return (
    <StaticPageLayout
      title="Partner Program"
      description="Join our partner ecosystem and help shape the future of social travel experiences."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Ready to Partner With Us?"
      ctaDescription="Start your partnership journey and unlock new opportunities for growth."
      ctaLink="mailto:partnerships@trvlsocial.com"
      ctaText="Apply for Partnership"
    >
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <GlassCard className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-3xl font-bold mb-6">Building the Future of Travel Together</h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              Our partner program brings together innovative companies, creators, and organizations
              to enhance the travel experience for millions of adventurers worldwide. Together,
              we're creating a more connected and accessible travel ecosystem.
            </p>
          </GlassCard>
        </section>

        {/* Partner Types */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Partnership Opportunities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {partnerTypes.map((partner, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{partner.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold">{partner.type}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{partner.description}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Partnership Benefits:</h4>
                  <ul className="space-y-2">
                    {partner.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start space-x-2 text-sm">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Partnership Tiers */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Partnership Tiers</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {partnershipTiers.map((tier, index) => (
              <GlassCard key={index} className={`p-6 ${
                tier.tier === 'Navigator' ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.tier}</h3>
                  {tier.tier === 'Navigator' && (
                    <div className="inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded-full mb-2">
                      Most Popular
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{tier.description}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-2 text-sm">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Requirements:</h4>
                  <ul className="space-y-2">
                    {tier.requirements.map((requirement, reqIndex) => (
                      <li key={reqIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="mt-1">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <GlassButton 
                  variant={tier.tier === 'Navigator' ? 'primary' : 'secondary'} 
                  className="w-full"
                >
                  Apply for {tier.tier}
                </GlassButton>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Current Partners */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Our Partners</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            We're proud to work with innovative companies that share our vision for better travel experiences.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPartners.map((partner, index) => (
              <GlassCard key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{partner.logo}</div>
                <h3 className="text-lg font-semibold mb-2">{partner.name}</h3>
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-3">{partner.type}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{partner.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Application Process */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Partnership Application Process</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {applicationProcess.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  {step.step}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                {index < applicationProcess.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-blue-300 dark:bg-blue-700 transform translate-y-6"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Why Partner With TRVL Social?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-3">Growing Market</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access our rapidly growing community of 50,000+ active travelers
                and expand your market reach.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">🎆</div>
              <h3 className="text-xl font-semibold mb-3">Innovation Focus</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Collaborate on cutting-edge travel technology and be part of
                industry-leading innovations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-3">Mutual Success</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our partnership model is built for mutual benefit and
                long-term collaborative success.
              </p>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Partner Resources</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <GlassCard className="text-center p-6">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="font-semibold mb-2">Brand Guidelines</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Logos, colors, and usage guidelines
              </p>
              <GlassButton variant="secondary" size="sm">
                Download
              </GlassButton>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">Marketing Kit</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Marketing materials and templates
              </p>
              <GlassButton variant="secondary" size="sm">
                Download
              </GlassButton>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <div className="text-3xl mb-3">🔗</div>
              <h3 className="font-semibold mb-2">API Docs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Technical integration guides
              </p>
              <GlassButton variant="secondary" size="sm">
                View Docs
              </GlassButton>
            </GlassCard>
            
            <GlassCard className="text-center p-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold mb-2">Partner Portal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Dedicated partner management platform
              </p>
              <GlassButton variant="secondary" size="sm">
                Access Portal
              </GlassButton>
            </GlassCard>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Get Started Today</h2>
          <GlassCard className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Partnership Inquiries</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Ready to explore partnership opportunities? Our team is here to discuss
                  how we can work together to create amazing travel experiences.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span>📧</span>
                    <span>partnerships@trvlsocial.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span>📞</span>
                    <span>+1 (555) 123-PARTNER</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span>📅</span>
                    <span>Schedule a consultation call</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Quick Application</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Company Name"
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Contact Email"
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Partnership Type</option>
                    <option>Travel Brand</option>
                    <option>Technology Partner</option>
                    <option>Content Creator</option>
                    <option>Educational Institution</option>
                    <option>Other</option>
                  </select>
                  <GlassButton variant="primary" className="w-full">
                    Submit Initial Inquiry
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default PartnersPage;