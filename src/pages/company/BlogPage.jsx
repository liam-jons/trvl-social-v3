import { useState } from 'react';
import { Backpack, Bot, Handshake, Sprout, Building } from 'lucide-react';
import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const BlogPage = () => {
  const breadcrumbs = [{ title: "Blog" }];
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'travel-tips', name: 'Travel Tips' },
    { id: 'community', name: 'Community' },
    { id: 'technology', name: 'Technology' },
    { id: 'culture', name: 'Culture' }
  ];

  const blogPosts = [
    {
      title: "10 Essential Tips for First-Time Group Travelers",
      excerpt: "Traveling with strangers can be intimidating, but with the right mindset and preparation, it can lead to incredible friendships and unforgettable experiences.",
      author: "Emma Rodriguez",
      date: "March 20, 2025",
      category: "travel-tips",
      readTime: "5 min read",
      iconComponent: Backpack
    },
    {
      title: "How AI is Revolutionizing Travel Compatibility",
      excerpt: "Discover how machine learning algorithms are helping travelers find their perfect adventure companions based on personality, interests, and travel style.",
      author: "David Kim",
      date: "March 18, 2025",
      category: "technology",
      readTime: "7 min read",
      iconComponent: Bot
    },
    {
      title: "Building Meaningful Connections on the Road",
      excerpt: "Stories from our community about how travel has transformed not just their journeys, but their lives through the connections they've made.",
      author: "Sofia Martinez",
      date: "March 15, 2025",
      category: "community",
      readTime: "4 min read",
      iconComponent: Handshake
    },
    {
      title: "Sustainable Travel: Small Changes, Big Impact",
      excerpt: "Learn how conscious travel choices can help preserve the destinations we love while creating positive impacts on local communities.",
      author: "James Thompson",
      date: "March 12, 2025",
      category: "travel-tips",
      readTime: "6 min read",
      iconComponent: Sprout
    },
    {
      title: "Cultural Immersion: Beyond Tourist Attractions",
      excerpt: "How to experience authentic local culture and create meaningful connections with communities around the world.",
      author: "Priya Patel",
      date: "March 10, 2025",
      category: "culture",
      readTime: "8 min read",
      iconComponent: Building
    },
    {
      title: "The Psychology of Travel Compatibility",
      excerpt: "Understanding what makes travelers compatible and how personality traits influence group dynamics during adventures.",
      author: "Dr. Michael Chen",
      date: "March 8, 2025",
      category: "technology",
      readTime: "10 min read",
      image: "🧠"
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <StaticPageLayout
      title="TRVL Social Blog"
      description="Insights, tips, and stories from the world of social travel and adventure."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Want to Share Your Story?"
      ctaDescription="We're always looking for guest contributors and community stories."
      ctaLink="mailto:blog@trvlsocial.com"
      ctaText="Submit Your Story"
    >
      <div className="space-y-8">
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

        {/* Featured Post */}
        {filteredPosts.length > 0 && (
          <GlassCard className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="text-center">
              <div className="text-6xl mb-4">{filteredPosts[0].image}</div>
              <h2 className="text-3xl font-bold mb-4">{filteredPosts[0].title}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                {filteredPosts[0].excerpt}
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <span>By {filteredPosts[0].author}</span>
                <span>•</span>
                <span>{filteredPosts[0].date}</span>
                <span>•</span>
                <span>{filteredPosts[0].readTime}</span>
              </div>
              <GlassButton variant="primary" size="lg">
                Read Article
              </GlassButton>
            </div>
          </GlassCard>
        )}

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.slice(1).map((post, index) => (
            <GlassCard key={index} className="p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-4">
                <post.iconComponent className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full mb-3">
                  {categories.find(cat => cat.id === post.category)?.name}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 line-clamp-2">{post.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span>By {post.author}</span>
                <span>{post.readTime}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{post.date}</span>
                <GlassButton variant="secondary" size="sm">
                  Read More
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Newsletter Signup */}
        <GlassCard className="text-center p-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Subscribe to our newsletter for the latest travel insights, community stories, and platform updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <GlassButton variant="primary">
              Subscribe
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </StaticPageLayout>
  );
};

export default BlogPage;