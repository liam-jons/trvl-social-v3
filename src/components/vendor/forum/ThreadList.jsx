import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Pin,
  Lock,
  Eye,
  Clock,
  User,
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ThreadList = () => {
  const { searchQuery, selectedCategory } = useOutletContext();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('last_reply');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');

  // Mock data for demonstration
  const mockThreads = [
    {
      id: '1',
      title: 'Best practices for adventure photography marketing',
      content: 'I\'ve been struggling with getting good engagement on my adventure photos...',
      vendor: {
        id: '1',
        business_name: 'Adventure Photos Co',
        reputation: { reputation_level: 'expert', total_points: 1250 }
      },
      category: 'marketing',
      tags: ['photography', 'social-media', 'instagram'],
      is_pinned: true,
      is_locked: false,
      view_count: 245,
      upvotes: 23,
      downvotes: 2,
      reply_count: 12,
      last_reply_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      last_reply_vendor: { business_name: 'Mountain Adventures' },
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      has_solution: true
    },
    {
      id: '2',
      title: 'Safety protocols for water sports activities',
      content: 'Following recent regulations, I need to update my safety protocols...',
      vendor: {
        id: '2',
        business_name: 'Ocean Adventures',
        reputation: { reputation_level: 'helpful', total_points: 890 }
      },
      category: 'safety',
      tags: ['water-sports', 'safety', 'regulations'],
      is_pinned: false,
      is_locked: false,
      view_count: 156,
      upvotes: 18,
      downvotes: 0,
      reply_count: 8,
      last_reply_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
      last_reply_vendor: { business_name: 'SafetyFirst Tours' },
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
      has_solution: false
    },
    {
      id: '3',
      title: 'Dynamic pricing strategies for peak season',
      content: 'How do you handle pricing during peak tourist seasons?',
      vendor: {
        id: '3',
        business_name: 'Peak Adventures',
        reputation: { reputation_level: 'contributor', total_points: 456 }
      },
      category: 'pricing_strategies',
      tags: ['pricing', 'peak-season', 'strategy'],
      is_pinned: false,
      is_locked: false,
      view_count: 89,
      upvotes: 12,
      downvotes: 1,
      reply_count: 15,
      last_reply_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
      last_reply_vendor: { business_name: 'Seasonal Tours Co' },
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000),
      has_solution: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      let filteredThreads = [...mockThreads];

      // Filter by category
      const category = searchParams.get('category') || selectedCategory;
      if (category && category !== 'all') {
        filteredThreads = filteredThreads.filter(thread => thread.category === category);
      }

      // Filter by search query
      if (searchQuery) {
        filteredThreads = filteredThreads.filter(thread =>
          thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      // Filter by status
      if (filterBy === 'solved') {
        filteredThreads = filteredThreads.filter(thread => thread.has_solution);
      } else if (filterBy === 'unsolved') {
        filteredThreads = filteredThreads.filter(thread => !thread.has_solution);
      } else if (filterBy === 'pinned') {
        filteredThreads = filteredThreads.filter(thread => thread.is_pinned);
      }

      // Sort threads
      filteredThreads.sort((a, b) => {
        let aValue, bValue;
        switch (sortBy) {
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'last_reply':
            aValue = new Date(a.last_reply_at || a.created_at);
            bValue = new Date(b.last_reply_at || b.created_at);
            break;
          case 'upvotes':
            aValue = a.upvotes;
            bValue = b.upvotes;
            break;
          case 'replies':
            aValue = a.reply_count;
            bValue = b.reply_count;
            break;
          case 'views':
            aValue = a.view_count;
            bValue = b.view_count;
            break;
          default:
            aValue = new Date(a.last_reply_at || a.created_at);
            bValue = new Date(b.last_reply_at || b.created_at);
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Ensure pinned threads stay at top
      const pinnedThreads = filteredThreads.filter(thread => thread.is_pinned);
      const regularThreads = filteredThreads.filter(thread => !thread.is_pinned);

      setThreads([...pinnedThreads, ...regularThreads]);
      setLoading(false);
    }, 500);
  }, [searchQuery, selectedCategory, searchParams, sortBy, sortOrder, filterBy]);

  const getReputationBadge = (level) => {
    const badges = {
      newcomer: 'bg-gray-100 text-gray-800',
      contributor: 'bg-blue-100 text-blue-800',
      helpful: 'bg-green-100 text-green-800',
      expert: 'bg-purple-100 text-purple-800',
      mentor: 'bg-yellow-100 text-yellow-800'
    };
    return badges[level] || badges.newcomer;
  };

  const getCategoryColor = (category) => {
    const colors = {
      marketing: 'bg-pink-100 text-pink-800',
      safety: 'bg-red-100 text-red-800',
      customer_service: 'bg-blue-100 text-blue-800',
      pricing_strategies: 'bg-green-100 text-green-800',
      equipment_maintenance: 'bg-yellow-100 text-yellow-800',
      legal_regulations: 'bg-purple-100 text-purple-800',
      insurance: 'bg-indigo-100 text-indigo-800',
      seasonal_tips: 'bg-orange-100 text-orange-800',
      technology: 'bg-cyan-100 text-cyan-800',
      general_discussion: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general_discussion;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 pb-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="flex space-x-4">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Controls */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Threads</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
              <option value="pinned">Pinned</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="last_reply">Last Reply</option>
              <option value="created_at">Created</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="replies">Most Replies</option>
              <option value="views">Most Viewed</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Thread List */}
      <div className="divide-y divide-gray-200">
        {threads.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No threads found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to start a discussion!'}
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex space-x-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                  <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-900">
                    {thread.upvotes - thread.downvotes}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>

                {/* Thread Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {thread.is_pinned && (
                          <Pin className="h-4 w-4 text-yellow-600" />
                        )}
                        {thread.is_locked && (
                          <Lock className="h-4 w-4 text-red-600" />
                        )}
                        {thread.has_solution && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(thread.category)}`}>
                          {thread.category.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReputationBadge(thread.vendor.reputation.reputation_level)}`}>
                          {thread.vendor.reputation.reputation_level}
                        </span>
                      </div>

                      <Link
                        to={`/vendor/forum/thread/${thread.id}`}
                        className="block group"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                          {thread.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 mb-3">
                          {thread.content}
                        </p>
                      </Link>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {thread.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {thread.vendor.business_name}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {thread.view_count}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {thread.reply_count}
                          </div>
                        </div>
                      </div>

                      {thread.last_reply_at && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Last reply by <span className="font-medium">{thread.last_reply_vendor?.business_name}</span>
                            {' '}{formatDistanceToNow(new Date(thread.last_reply_at), { addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ThreadList;