import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const CareersPage = () => {
  const breadcrumbs = [{ title: "Careers" }];

  const openPositions = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote / San Francisco",
      type: "Full-time"
    },
    {
      title: "Travel Experience Designer",
      department: "Product",
      location: "Remote / New York",
      type: "Full-time"
    },
    {
      title: "Community Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Data Scientist",
      department: "Engineering",
      location: "Remote / London",
      type: "Full-time"
    }
  ];

  return (
    <StaticPageLayout
      title="Join Our Team"
      description="Help us build the future of social travel and connect adventurers worldwide."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Don't See Your Role?"
      ctaDescription="We're always looking for talented individuals to join our mission."
      ctaLink="mailto:careers@trvlsocial.com"
      ctaText="Contact Us"
    >
      <div className="space-y-12">
        {/* Culture Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-center">Why Work at TRVL Social?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3">Global Impact</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Help millions of travelers create meaningful connections and experiences worldwide.
              </p>
            </GlassCard>

            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Work with cutting-edge technology in AI, machine learning, and social platforms.
              </p>
            </GlassCard>

            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-3">Community</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join a passionate team that practices what we preach - collaboration and adventure.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Benefits & Perks</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Competitive salary and equity package</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Comprehensive health, dental, and vision insurance</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Flexible working hours and remote-first culture</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Professional development budget</span>
              </li>
            </ul>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Annual travel stipend for team adventures</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Unlimited PTO policy</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Top-tier equipment and home office setup</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-green-500">✓</span>
                <span>Free access to all TRVL Social premium features</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Open Positions */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center">
                        <span className="mr-1">🏢</span>
                        {position.department}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">📍</span>
                        {position.location}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">⏰</span>
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <GlassButton variant="primary">
                    Apply Now
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Application Process */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-center">Our Hiring Process</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Application</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Submit your resume and cover letter</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Phone Screen</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">30-minute chat with our team</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Technical Interview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Role-specific skills assessment</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 dark:text-orange-400 font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Final Interview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Meet the team and culture fit</p>
            </div>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default CareersPage;