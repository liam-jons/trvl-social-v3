import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const PressPage = () => {
  const breadcrumbs = [{ title: "Press & Media" }];

  const pressReleases = [
    {
      title: "TRVL Social Raises $15M Series A to Revolutionize Social Travel",
      date: "March 15, 2024",
      excerpt: "Funding will accelerate global expansion and enhance AI-powered travel matching technology."
    },
    {
      title: "TRVL Social Launches AI-Powered Group Formation Technology",
      date: "January 22, 2024",
      excerpt: "New algorithm creates optimal travel groups based on personality compatibility and interests."
    },
    {
      title: "TRVL Social Reaches 50,000 Active Users Milestone",
      date: "December 8, 2023",
      excerpt: "Platform celebrates rapid growth with community spanning over 120 countries worldwide."
    }
  ];

  const mediaAssets = [
    {
      type: "Brand Kit",
      description: "Logos, colors, and brand guidelines",
      size: "2.3 MB"
    },
    {
      type: "Product Screenshots",
      description: "High-resolution app and web screenshots",
      size: "15.7 MB"
    },
    {
      type: "Executive Photos",
      description: "Professional headshots of leadership team",
      size: "8.2 MB"
    },
    {
      type: "Company Fact Sheet",
      description: "Key statistics and company information",
      size: "1.1 MB"
    }
  ];

  return (
    <StaticPageLayout
      title="Press & Media"
      description="Latest news, media resources, and press information about TRVL Social."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Media Inquiries"
      ctaDescription="For press inquiries, interviews, or additional information, please contact our media team."
      ctaLink="mailto:press@trvlsocial.com"
      ctaText="Contact Press Team"
    >
      <div className="space-y-12">
        {/* Company Overview */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-center">Company Overview</h2>
          <GlassCard className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <p className="text-lg leading-relaxed mb-6">
              TRVL Social is the world's leading platform for social travel experiences, connecting like-minded
              adventurers through AI-powered matching technology. Founded in 2022, the company has facilitated
              over 10,000 successful travel experiences across 120+ countries.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">50K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">120+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Countries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">$15M</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Series A Funding</div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Recent Press Releases */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Recent Press Releases</h2>
          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="mb-4 md:mb-0 md:flex-1">
                    <h3 className="text-xl font-semibold mb-2">{release.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{release.excerpt}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{release.date}</div>
                  </div>
                  <GlassButton variant="primary" className="md:ml-6">
                    Read Full Release
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Media Kit */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Media Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {mediaAssets.map((asset, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{asset.type}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{asset.description}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{asset.size}</div>
                  </div>
                  <GlassButton variant="secondary">
                    Download
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Awards & Recognition */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Awards & Recognition</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">TechCrunch Startup Battlefield</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Finalist 2023</p>
            </GlassCard>

            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold mb-2">Best Travel App</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Travel + Leisure 2024</p>
            </GlassCard>

            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold mb-2">Fast Company's Most Innovative</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Travel Companies 2024</p>
            </GlassCard>
          </div>
        </section>

        {/* Key Contacts */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Media Contacts</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Press Inquiries</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">Sarah Johnson</p>
              <p className="text-gray-600 dark:text-gray-300 mb-2">Director of Communications</p>
              <p className="text-blue-600 dark:text-blue-400">press@trvlsocial.com</p>
              <p className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Partnership Inquiries</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">Michael Chen</p>
              <p className="text-gray-600 dark:text-gray-300 mb-2">Head of Business Development</p>
              <p className="text-blue-600 dark:text-blue-400">partnerships@trvlsocial.com</p>
              <p className="text-gray-600 dark:text-gray-300">+1 (555) 123-4568</p>
            </div>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default PressPage;