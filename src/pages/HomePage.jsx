import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Discover Your Next Adventure
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Connect with fellow travelers, find amazing experiences, and create unforgettable memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/adventures">
                  <GlassButton variant="primary" size="lg">
                    Browse Adventures
                  </GlassButton>
                </Link>
                <Link to="/community">
                  <GlassButton variant="secondary" size="lg">
                    Join Community
                  </GlassButton>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <GlassButton variant="primary" size="lg">
                    Get Started Free
                  </GlassButton>
                </Link>
                <Link to="/login">
                  <GlassButton variant="ghost" size="lg">
                    Sign In
                  </GlassButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything You Need for Your Journey
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="text-center p-6">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold mb-2">Global Adventures</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Explore experiences from local hidden gems to worldwide destinations
            </p>
          </GlassCard>
          
          <GlassCard className="text-center p-6">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-2">Travel Groups</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Find compatible travel companions based on personality and interests
            </p>
          </GlassCard>
          
          <GlassCard className="text-center p-6">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">Trusted Vendors</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Book with verified adventure providers and local experts
            </p>
          </GlassCard>
          
          <GlassCard className="text-center p-6">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Vibrant Community</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Share experiences, get tips, and connect with fellow adventurers
            </p>
          </GlassCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <GlassCard className="text-center p-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
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