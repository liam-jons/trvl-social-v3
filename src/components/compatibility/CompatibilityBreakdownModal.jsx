import { useState } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassCard from '../ui/GlassCard';
import CompatibilityCircularProgress from './CompatibilityCircularProgress';
import CompatibilityRadarChart from './CompatibilityRadarChart';
import CompatibilityBadge from './CompatibilityBadge';
import { ScoringDimensionType, COMPATIBILITY_THRESHOLDS } from '../../types/compatibility';

const CompatibilityBreakdownModal = ({
  isOpen = false,
  onClose,
  compatibilityScore = null,
  user1Name = 'User 1',
  user2Name = 'User 2',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!compatibilityScore) return null;

  const { overallScore, dimensions, confidence, calculatedAt } = compatibilityScore;

  // Format dimension data for display
  const dimensionData = [
    {
      key: ScoringDimensionType.PERSONALITY_TRAITS,
      name: 'Personality Traits',
      description: 'How well your personalities complement each other',
      icon: '🧠',
      score: dimensions[ScoringDimensionType.PERSONALITY_TRAITS]?.score || 0,
      weight: dimensions[ScoringDimensionType.PERSONALITY_TRAITS]?.weight || 0
    },
    {
      key: ScoringDimensionType.TRAVEL_PREFERENCES,
      name: 'Travel Preferences',
      description: 'Alignment in travel styles and preferences',
      icon: '✈️',
      score: dimensions[ScoringDimensionType.TRAVEL_PREFERENCES]?.score || 0,
      weight: dimensions[ScoringDimensionType.TRAVEL_PREFERENCES]?.weight || 0
    },
    {
      key: ScoringDimensionType.EXPERIENCE_LEVEL,
      name: 'Experience Level',
      description: 'Compatibility in travel experience and comfort zones',
      icon: '🎯',
      score: dimensions[ScoringDimensionType.EXPERIENCE_LEVEL]?.score || 0,
      weight: dimensions[ScoringDimensionType.EXPERIENCE_LEVEL]?.weight || 0
    },
    {
      key: ScoringDimensionType.BUDGET_RANGE,
      name: 'Budget Range',
      description: 'How well your budget expectations align',
      icon: '💰',
      score: dimensions[ScoringDimensionType.BUDGET_RANGE]?.score || 0,
      weight: dimensions[ScoringDimensionType.BUDGET_RANGE]?.weight || 0
    },
    {
      key: ScoringDimensionType.ACTIVITY_PREFERENCES,
      name: 'Activity Preferences',
      description: 'Shared interests in activities and experiences',
      icon: '🎨',
      score: dimensions[ScoringDimensionType.ACTIVITY_PREFERENCES]?.score || 0,
      weight: dimensions[ScoringDimensionType.ACTIVITY_PREFERENCES]?.weight || 0
    }
  ];

  const getThresholdInfo = (score) => {
    if (score >= COMPATIBILITY_THRESHOLDS.EXCELLENT.min) return COMPATIBILITY_THRESHOLDS.EXCELLENT;
    if (score >= COMPATIBILITY_THRESHOLDS.GOOD.min) return COMPATIBILITY_THRESHOLDS.GOOD;
    if (score >= COMPATIBILITY_THRESHOLDS.FAIR.min) return COMPATIBILITY_THRESHOLDS.FAIR;
    return COMPATIBILITY_THRESHOLDS.POOR;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'dimensions', label: 'Breakdown', icon: '🔍' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ];

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Compatibility Analysis"
      className={className}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {user1Name} & {user2Name}
          </h3>
          <CompatibilityBadge score={overallScore} size="lg" variant="default" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Calculated on {new Date(calculatedAt).toLocaleDateString()}
            {confidence && (
              <span className="ml-2">
                • {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md
                text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Score */}
              <GlassCard className="text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Overall Compatibility
                </h4>
                <CompatibilityCircularProgress
                  score={overallScore}
                  size={120}
                  animate={true}
                />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {getThresholdInfo(overallScore).label}
                </p>
              </GlassCard>

              {/* Radar Chart */}
              <GlassCard>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Compatibility Dimensions
                </h4>
                <div className="flex justify-center">
                  <CompatibilityRadarChart
                    dimensions={dimensions}
                    size={200}
                    animate={true}
                    showLabels={true}
                  />
                </div>
              </GlassCard>
            </div>
          )}

          {/* Dimensions Tab */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              {dimensionData.map((dimension) => {
                const threshold = getThresholdInfo(dimension.score);
                return (
                  <GlassCard key={dimension.key} padding="md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{dimension.icon}</span>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white">
                            {dimension.name}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {dimension.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: threshold.color }}>
                          {Math.round(dimension.score)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Weight: {Math.round(dimension.weight * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${dimension.score}%`,
                          backgroundColor: threshold.color,
                          boxShadow: `0 0 8px ${threshold.color}40`
                        }}
                      />
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <GlassCard>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  💡 Key Insights
                </h4>
                <div className="space-y-4">
                  {/* Strongest Areas */}
                  <div>
                    <h5 className="font-medium text-green-700 dark:text-green-400 mb-2">
                      🌟 Strongest Compatibility Areas
                    </h5>
                    <div className="space-y-2">
                      {dimensionData
                        .filter(d => d.score >= 70)
                        .sort((a, b) => b.score - a.score)
                        .map(dimension => (
                          <div key={dimension.key} className="flex items-center gap-2 text-sm">
                            <span>{dimension.icon}</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {dimension.name}: {Math.round(dimension.score)}%
                            </span>
                          </div>
                        ))}
                      {dimensionData.filter(d => d.score >= 70).length === 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No dimensions scoring above 70%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div>
                    <h5 className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                      ⚠️ Areas to Discuss
                    </h5>
                    <div className="space-y-2">
                      {dimensionData
                        .filter(d => d.score < 60)
                        .sort((a, b) => a.score - b.score)
                        .map(dimension => (
                          <div key={dimension.key} className="flex items-center gap-2 text-sm">
                            <span>{dimension.icon}</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {dimension.name}: {Math.round(dimension.score)}%
                            </span>
                          </div>
                        ))}
                      {dimensionData.filter(d => d.score < 60).length === 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          All dimensions scoring well above 60%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h5 className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                      🎯 Recommendations
                    </h5>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {overallScore >= 80 && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          You're an excellent match! Focus on planning your adventure together.
                        </li>
                      )}
                      {overallScore >= 60 && overallScore < 80 && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            Discuss expectations and preferences early in the planning process.
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            Find compromises in areas where you differ most.
                          </li>
                        </>
                      )}
                      {overallScore < 60 && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-500">!</span>
                            Consider a shorter trip to test compatibility first.
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-500">!</span>
                            Have open conversations about travel styles and expectations.
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-500">!</span>
                            Consider adding more compatible group members to balance dynamics.
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </GlassModal>
  );
};

export default CompatibilityBreakdownModal;