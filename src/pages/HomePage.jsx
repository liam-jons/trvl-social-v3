import { Link } from 'react-router-dom';
import { Globe, Handshake, Sparkles, Users } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { VideoHero, HomepageAdventuresGrid } from '../components/homepage';

const HomePage = () => {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Video Hero Section */}
      <VideoHero />

      {/* Adventures Grid Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <HomepageAdventuresGrid />
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12">
          Everything You Need for Your Journey
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <GlassCard className="text-center p-4 sm:p-6">
            <Globe className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-blue-500" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Global Adventures</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Explore experiences from local hidden gems to worldwide destinations
            </p>
          </GlassCard>

          <GlassCard className="text-center p-4 sm:p-6">
            <Handshake className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-green-500" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Travel Groups</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Find compatible travel companions based on personality and interests
            </p>
          </GlassCard>

          <GlassCard className="text-center p-4 sm:p-6">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-purple-500" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Trusted Vendors</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Book with verified adventure providers and local experts
            </p>
          </GlassCard>

          <GlassCard className="text-center p-4 sm:p-6">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-orange-500" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Vibrant Community</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Share experiences, get tips, and connect with fellow adventurers
            </p>
          </GlassCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard className="text-center p-6 sm:p-8 md:p-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of travelers discovering amazing experiences and making lifelong connections
          </p>
          <Link to="/register">
            <GlassButton variant="primary" size="lg">
              Join TRVL Social Today
            </GlassButton>
          </Link>
        </GlassCard>
      </section>
    </div>
  );
};

export default HomePage;