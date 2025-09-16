import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Share2,
  Bookmark,
  Flag,
  CheckCircle,
  Clock,
  User,
  Reply,
  Edit,
  Trash,
  MoreHorizontal,
  Pin,
  Lock,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
const ThreadView = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  // Mock current user (vendor)
  const currentVendor = {
    id: '1',
    business_name: 'My Adventure Co',
    reputation: { reputation_level: 'contributor', total_points: 567 }
  };
  // Mock thread data
  const mockThread = {
    id: threadId,
    title: 'Best practices for adventure photography marketing',
    content: `I've been struggling with getting good engagement on my adventure photos on social media. Despite having amazing shots from our hiking tours, the posts aren't getting the reach I expect.
I've tried posting at different times, using various hashtags, and even collaborating with local influencers, but the results have been inconsistent.
What strategies have worked best for you when marketing adventure photography? Are there specific platforms that work better than others? Any tips on hashtag strategies or content scheduling would be greatly appreciated!`,
    vendor: {
      id: '2',
      business_name: 'Adventure Photos Co',
      reputation: { reputation_level: 'expert', total_points: 1250 }
    },
    category: 'marketing',
    tags: ['photography', 'social-media', 'instagram', 'marketing'],
    is_pinned: true,
    is_locked: false,
    view_count: 245,
    upvotes: 23,
    downvotes: 2,
    reply_count: 12,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    has_solution: true,
    user_vote: null // 'upvote', 'downvote', or null
  };
  const mockReplies = [
    {
      id: '1',
      thread_id: threadId,
      vendor: {
        id: '3',
        business_name: 'Mountain Adventures',
        reputation: { reputation_level: 'helpful', total_points: 890 }
      },
      content: `Great question! I've found that timing is crucial for adventure photography posts. Here's what works for me:
1. **Golden hour posts**: Share photos taken during sunrise/sunset around 7-9 AM and 5-7 PM
2. **Story-driven captions**: Don't just post the photo, tell the story behind it
3. **Platform-specific strategies**: Instagram for visual impact, Facebook for community building, LinkedIn for B2B connections
For hashtags, I use a mix of location-specific tags (#ColoradoHiking), activity tags (#AdventurePhotography), and broad reach tags (#NatureLovers).`,
      upvotes: 15,
      downvotes: 0,
      is_solution: true,
      created_at: new Date(Date.now() - 22 * 60 * 60 * 1000),
      user_vote: null,
      parent_reply_id: null
    },
    {
      id: '2',
      thread_id: threadId,
      vendor: {
        id: '4',
        business_name: 'Peak Experiences',
        reputation: { reputation_level: 'contributor', total_points: 456 }
      },
      content: `Adding to what Mountain Adventures said - engagement pods have been a game changer for me. I'm part of a group of 20 adventure companies where we all engage with each other's posts within the first hour of posting. This boosts the algorithm significantly.
Also, user-generated content works amazingly well. I encourage my clients to tag us in their photos and stories, then I repost the best ones (with permission). It creates authentic content and makes customers feel valued.`,
      upvotes: 8,
      downvotes: 1,
      is_solution: false,
      created_at: new Date(Date.now() - 20 * 60 * 60 * 1000),
      user_vote: 'upvote',
      parent_reply_id: null
    },
    {
      id: '3',
      thread_id: threadId,
      vendor: {
        id: '5',
        business_name: 'Social Media Savvy Tours',
        reputation: { reputation_level: 'expert', total_points: 1100 }
      },
      content: `Both excellent points above! I'd like to add that video content is becoming increasingly important. Even simple time-lapse videos of your adventures or behind-the-scenes content of setting up shots can dramatically increase engagement.
Instagram Reels and TikTok have been particularly effective for reaching younger demographics. A 15-second clip of a waterfall or mountain vista often performs better than static photos.`,
      upvotes: 12,
      downvotes: 0,
      is_solution: false,
      created_at: new Date(Date.now() - 18 * 60 * 60 * 1000),
      user_vote: null,
      parent_reply_id: null
    }
  ];
  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setThread(mockThread);
      setReplies(mockReplies);
      setLoading(false);
    }, 500);
  }, [threadId]);
  const handleVote = async (type, targetId, targetType = 'thread') => {
    // Implementation for voting
    console.log(`Vote ${type} on ${targetType} ${targetId}`);
  };
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    const newReply = {
      id: Date.now().toString(),
      thread_id: threadId,
      vendor: currentVendor,
      content: replyContent,
      upvotes: 0,
      downvotes: 0,
      is_solution: false,
      created_at: new Date(),
      user_vote: null,
      parent_reply_id: replyToId
    };
    setReplies([...replies, newReply]);
    setReplyContent('');
    setShowReplyForm(false);
    setReplyToId(null);
  };
  const markAsSolution = async (replyId) => {
    // Implementation for marking as solution
    console.log(`Mark reply ${replyId} as solution`);
  };
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
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="flex space-x-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Thread not found</h3>
        <p className="text-gray-600 mb-4">The thread you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/vendor/forum"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Forum
        </Link>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 mb-6">
        <Link to="/vendor/forum" className="hover:text-blue-600">Forum</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{thread.title}</span>
      </nav>
      {/* Thread */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex space-x-4">
            {/* Vote Section */}
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <button
                onClick={() => handleVote('upvote', thread.id)}
                className={`p-2 rounded transition-colors ${
                  thread.user_vote === 'upvote'
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-400 hover:text-green-600'
                }`}
              >
                <ChevronUp className="h-6 w-6" />
              </button>
              <span className="text-lg font-bold text-gray-900">
                {thread.upvotes - thread.downvotes}
              </span>
              <button
                onClick={() => handleVote('downvote', thread.id)}
                className={`p-2 rounded transition-colors ${
                  thread.user_vote === 'downvote'
                    ? 'bg-red-100 text-red-600'
                    : 'text-gray-400 hover:text-red-600'
                }`}
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {thread.is_pinned && <Pin className="h-5 w-5 text-yellow-600" />}
                  {thread.is_locked && <Lock className="h-5 w-5 text-red-600" />}
                  {thread.has_solution && <CheckCircle className="h-5 w-5 text-green-600" />}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(thread.category)}`}>
                    {thread.category.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReputationBadge(thread.vendor.reputation.reputation_level)}`}>
                    {thread.vendor.reputation.reputation_level}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Bookmark className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Flag className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{thread.title}</h1>
              <div className="prose max-w-none mb-6">
                {thread.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {thread.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">{thread.vendor.business_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {thread.view_count} views
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {thread.reply_count} replies
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Replies */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {replies.map((reply) => (
            <div key={reply.id} className="p-6">
              <div className="flex space-x-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                  <button
                    onClick={() => handleVote('upvote', reply.id, 'reply')}
                    className={`p-1 rounded transition-colors ${
                      reply.user_vote === 'upvote'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-900">
                    {reply.upvotes - reply.downvotes}
                  </span>
                  <button
                    onClick={() => handleVote('downvote', reply.id, 'reply')}
                    className={`p-1 rounded transition-colors ${
                      reply.user_vote === 'downvote'
                        ? 'bg-red-100 text-red-600'
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
                {/* Reply Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {reply.vendor.business_name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReputationBadge(reply.vendor.reputation.reputation_level)}`}>
                        {reply.vendor.reputation.reputation_level}
                      </span>
                      {reply.is_solution && (
                        <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Solution
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {thread.vendor.id === currentVendor.id && !reply.is_solution && (
                        <button
                          onClick={() => markAsSolution(reply.id)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Mark as Solution
                        </button>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="prose max-w-none mb-4">
                    {reply.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <button
                      onClick={() => {
                        setReplyToId(reply.id);
                        setShowReplyForm(true);
                      }}
                      className="flex items-center hover:text-blue-600 transition-colors"
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </button>
                    {reply.vendor.id === currentVendor.id && (
                      <>
                        <button className="flex items-center hover:text-blue-600 transition-colors">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button className="flex items-center hover:text-red-600 transition-colors">
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Reply Form */}
        <div className="p-6 border-t border-gray-200">
          {!showReplyForm ? (
            <button
              onClick={() => setShowReplyForm(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <MessageSquare className="h-5 w-5 mx-auto mb-2" />
              Add a reply to this discussion
            </button>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {replyToId ? 'Reply to comment' : 'Add your reply'}
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Share your thoughts, experiences, or ask follow-up questions..."
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyToId(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ThreadView;