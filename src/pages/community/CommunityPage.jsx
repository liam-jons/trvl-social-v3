import { useState } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import CommunityTabs from '../../components/community/CommunityTabs';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CommunityPage = () => {
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Sarah Chen',
      avatar: null,
      timestamp: '2 hours ago',
      content: 'Just arrived in Bali! The sunset at Tanah Lot temple is absolutely breathtaking. Can\'t wait to explore more tomorrow!',
      likes: 24,
      comments: 5,
      location: 'Bali, Indonesia'
    },
    {
      id: 2,
      author: 'Mark Johnson',
      avatar: null,
      timestamp: '5 hours ago',
      content: 'Looking for travel buddies for a 2-week backpacking trip through Southeast Asia in March. Anyone interested?',
      likes: 18,
      comments: 12,
      location: 'Planning from NYC'
    },
    {
      id: 3,
      author: 'Emma Wilson',
      avatar: null,
      timestamp: '1 day ago',
      content: 'Pro tip: Book your Japan Rail Pass before arriving in Japan to save money! Just learned this the hard way.',
      likes: 45,
      comments: 8,
      location: 'Tokyo, Japan'
    }
  ]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading community posts..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Travel Community
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Connect with fellow travelers, share experiences, and discover your next adventure
        </p>
      </div>

      {/* Navigation Tabs */}
      <CommunityTabs activeTab="feed" />

      {/* Create Post */}
      <GlassCard className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            U
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Share your travel story..."
              className="w-full px-4 py-3 glass-input rounded-lg resize-none"
              rows="3"
            />
            <div className="flex justify-between items-center mt-3">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-glass-light rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-glass-light rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                Post
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <GlassCard key={post.id} className="p-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {post.author.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{post.author}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{post.timestamp}</span>
                      {post.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {post.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-glass-light rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                </div>

                <p className="mb-4">{post.content}</p>

                <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
                  <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                    </svg>
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;