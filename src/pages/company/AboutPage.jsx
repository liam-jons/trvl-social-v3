import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';

const AboutPage = () => {
  const breadcrumbs = [{ title: "About Us" }];

  return (
    <StaticPageLayout
      title="About TRVL Social"
      description="Connecting adventurous souls worldwide through shared experiences and meaningful travel."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Join Our Adventure Community"
      ctaDescription="Be part of a growing network of travelers creating unforgettable memories together."
    >
      {/* Mission Section */}
      <div className="space-y-8">
        <section>
          <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
          <p className="text-lg leading-relaxed">
            At TRVL Social, we believe that the best adventures are shared ones. Our mission is to connect
            like-minded travelers, create meaningful experiences, and build a global community where every
            journey becomes an opportunity for personal growth and lasting friendships.
          </p>
        </section>

        {/* Vision & Values */}
        <div className="grid md:grid-cols-2 gap-8">
          <GlassCard className="p-6">
            <h3 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Our Vision</h3>
            <p>
              To become the world's leading platform for social travel experiences, where every traveler
              can find their perfect adventure companion and create memories that last a lifetime.
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-2xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Our Values</h3>
            <ul className="space-y-2">
              <li><strong>Community:</strong> Building connections that matter</li>
              <li><strong>Safety:</strong> Ensuring secure and trusted experiences</li>
              <li><strong>Authenticity:</strong> Promoting genuine cultural exchange</li>
              <li><strong>Sustainability:</strong> Responsible and mindful travel</li>
            </ul>
          </GlassCard>
        </div>

        {/* Team Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
          <p className="text-lg leading-relaxed mb-6">
            Founded by a team of passionate travelers, TRVL Social was born from the simple idea that
            travel is better when shared. After countless solo adventures and group trips, we realized
            the need for a platform that could intelligently match travelers based on personality,
            interests, and travel style.
          </p>
          <p className="text-lg leading-relaxed">
            Today, we're proud to serve thousands of adventurers worldwide, facilitating connections
            that transform strangers into lifelong friends and ordinary trips into extraordinary experiences.
          </p>
        </section>

        {/* Stats */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">TRVL Social by the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">50K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Active Travelers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">120+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">10K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Adventures Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">98%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Satisfaction Rate</div>
            </div>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default AboutPage;