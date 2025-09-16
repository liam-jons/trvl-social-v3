import { useState, useEffect } from 'react';
import { contentRankingService } from '../../services/content-ranking-service';
import { engagementScoringService } from '../../services/engagement-scoring-service';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const EngagementAnalyticsDashboard = ({ postId, isAuthor = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (postId) {
      loadAnalytics();
    }
  }, [postId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [analyticsResult, scoreResult] = await Promise.all([
        contentRankingService.getContentAnalytics(postId),
        engagementScoringService.calculatePostEngagementScore(postId)
      ]);

      if (!analyticsResult.success) {
        throw new Error(analyticsResult.error);
      }

      setAnalytics({
        ...analyticsResult.data,
        detailedScore: scoreResult
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num) => `${Math.round(num)}%`;

  const formatScore = (score) => Math.round(score * 100) / 100;

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300/20 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-300/20 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Analytics Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <GlassButton onClick={loadAnalytics} size="sm">
            Retry
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  if (!analytics) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'engagement', label: 'Engagement', icon: '💬' },
    { id: 'performance', label: 'Performance', icon: '🚀' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' }
  ];

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Content Analytics
        </h2>
        <GlassButton onClick={loadAnalytics} size="sm" variant="secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </GlassButton>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Engagement"
              value={analytics.totalReactions + analytics.totalComments + analytics.totalSaves + analytics.totalShares}
              icon="👥"
              color="blue"
            />
            <MetricCard
              title="Engagement Score"
              value={formatScore(analytics.detailedScore.totalScore)}
              icon="⭐"
              color="purple"
            />
            <MetricCard
              title="Quality Score"
              value={formatScore(analytics.performanceMetrics.qualityScore)}
              icon="✨"
              color="green"
            />
            <MetricCard
              title="Virality Score"
              value={formatScore(analytics.performanceMetrics.viralityScore)}
              icon="🚀"
              color="orange"
            />
          </div>

          {/* Score Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Score Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analytics.detailedScore.breakdown).map(([key, value]) => (
                <div key={key} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatScore(value)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Engagement Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EngagementMetric
              title="Reactions"
              count={analytics.totalReactions}
              breakdown={analytics.reactionBreakdown}
            />
            <EngagementMetric
              title="Comments"
              count={analytics.totalComments}
              breakdown={analytics.commentQuality}
            />
            <EngagementMetric
              title="Saves"
              count={analytics.totalSaves}
            />
            <EngagementMetric
              title="Shares"
              count={analytics.totalShares}
            />
          </div>

          {/* Reaction Breakdown */}
          {analytics.reactionBreakdown.total > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reaction Types
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(analytics.reactionBreakdown.breakdown).map(([type, count]) => (
                  <div key={type} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">
                      {type === 'like' && '👍'}
                      {type === 'love' && '❤️'}
                      {type === 'helpful' && '💡'}
                      {type === 'wow' && '😮'}
                      {type === 'sad' && '😢'}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                      {type}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Quality */}
          {analytics.commentQuality.total > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Comment Analysis
              </h3>
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analytics.commentQuality.total}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analytics.commentQuality.averageLength}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Avg. Length</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatPercentage(analytics.commentQuality.qualityScore)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Quality Score</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PerformanceCard
              title="Engagement Rate"
              value={formatPercentage(analytics.performanceMetrics.engagementRate)}
              description="Percentage of meaningful interactions"
              color="blue"
            />
            <PerformanceCard
              title="Quality Score"
              value={formatScore(analytics.performanceMetrics.qualityScore)}
              description="Content completeness and richness"
              color="green"
            />
            <PerformanceCard
              title="Virality Score"
              value={formatScore(analytics.performanceMetrics.viralityScore)}
              description="Sharing and amplification potential"
              color="orange"
            />
          </div>

          {/* Score Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Details
            </h3>
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Raw Score</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatScore(analytics.detailedScore.rawScore)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Time Decay</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {formatScore(analytics.detailedScore.timeDecay)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Final Score</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatScore(analytics.detailedScore.totalScore)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Engagement Timeline
          </h3>

          {analytics.engagementTimeline.length > 0 ? (
            <div className="space-y-3">
              {analytics.engagementTimeline.map((event, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-shrink-0">
                    {event.type === 'reaction' && (
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">
                          {event.subtype === 'like' && '👍'}
                          {event.subtype === 'love' && '❤️'}
                          {event.subtype === 'helpful' && '💡'}
                          {event.subtype === 'wow' && '😮'}
                          {event.subtype === 'sad' && '😢'}
                        </span>
                      </div>
                    )}
                    {event.type === 'comment' && (
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">💬</span>
                      </div>
                    )}
                    {event.type === 'save' && (
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">🔖</span>
                      </div>
                    )}
                    {event.type === 'share' && (
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-sm">🔗</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {event.type} {event.subtype && `(${event.subtype})`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">No engagement activity yet</p>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};

// Helper Components
const MetricCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
  };

  return (
    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</span>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
};

const EngagementMetric = ({ title, count, breakdown }) => (
  <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
    <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
    <div className="text-sm text-gray-600 dark:text-gray-300">{title}</div>
    {breakdown && breakdown.sentiment && (
      <div className={`text-xs mt-1 font-medium ${
        breakdown.sentiment === 'positive' ? 'text-green-600 dark:text-green-400' :
        breakdown.sentiment === 'negative' ? 'text-red-600 dark:text-red-400' :
        'text-gray-500 dark:text-gray-400'
      }`}>
        {breakdown.sentiment}
      </div>
    )}
  </div>
);

const PerformanceCard = ({ title, value, description, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400'
  };

  return (
    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h4>
      <div className={`text-3xl font-bold mb-2 ${colorClasses[color]}`}>{value}</div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default EngagementAnalyticsDashboard;