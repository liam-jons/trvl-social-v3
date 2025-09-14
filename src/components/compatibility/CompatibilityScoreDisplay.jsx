import { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import CompatibilityCircularProgress from './CompatibilityCircularProgress';
import CompatibilityBadge from './CompatibilityBadge';
import CompatibilityRadarChart from './CompatibilityRadarChart';
import CompatibilityBreakdownModal from './CompatibilityBreakdownModal';
import LoadingSpinner from '../common/LoadingSpinner';

const CompatibilityScoreDisplay = ({
  compatibilityScore = null,
  user1 = null,
  user2 = null,
  loading = false,
  error = null,
  onRecalculate,
  showRadarChart = true,
  showBreakdownButton = true,
  size = 'md',
  className = ''
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const sizeConfig = {
    sm: {
      circularSize: 80,
      radarSize: 150,
      cardPadding: 'sm'
    },
    md: {
      circularSize: 120,
      radarSize: 200,
      cardPadding: 'md'
    },
    lg: {
      circularSize: 160,
      radarSize: 250,
      cardPadding: 'lg'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Loading state
  if (loading) {
    return (
      <GlassCard className={`text-center py-8 ${className}`} padding={config.cardPadding}>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Calculating compatibility...
        </p>
      </GlassCard>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassCard className={`text-center py-8 ${className}`} padding={config.cardPadding}>
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Compatibility Error
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'Unable to calculate compatibility score'}
        </p>
        {onRecalculate && (
          <GlassButton onClick={onRecalculate} variant="primary">
            Try Again
          </GlassButton>
        )}
      </GlassCard>
    );
  }

  // No data state
  if (!compatibilityScore) {
    return (
      <GlassCard className={`text-center py-8 ${className}`} padding={config.cardPadding}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Compatibility Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Compatibility analysis is not available for these users.
        </p>
      </GlassCard>
    );
  }

  const { overallScore, dimensions, calculatedAt, confidence } = compatibilityScore;

  return (
    <>
      <GlassCard className={className} padding={config.cardPadding}>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Compatibility Analysis
            </h3>
            {user1 && user2 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user1.name || user1.email} & {user2.name || user2.email}
              </p>
            )}
          </div>

          {/* Main Content */}
          <div className={`grid gap-6 ${showRadarChart ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Overall Score */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                Overall Match
              </h4>
              <CompatibilityCircularProgress
                score={overallScore}
                size={config.circularSize}
                animate={true}
              />
              <div className="mt-4">
                <CompatibilityBadge
                  score={overallScore}
                  size={size === 'sm' ? 'sm' : 'md'}
                  variant="default"
                />
              </div>
            </div>

            {/* Radar Chart */}
            {showRadarChart && (
              <div className="text-center">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Compatibility Breakdown
                </h4>
                <div className="flex justify-center">
                  <CompatibilityRadarChart
                    dimensions={dimensions}
                    size={config.radarSize}
                    animate={true}
                    showLabels={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>
              Calculated on {new Date(calculatedAt).toLocaleDateString()}
            </div>
            {confidence && (
              <div>
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBreakdownButton && (
              <GlassButton
                onClick={() => setShowBreakdown(true)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Details
              </GlassButton>
            )}

            {onRecalculate && (
              <GlassButton
                onClick={onRecalculate}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recalculate
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Breakdown Modal */}
      {showBreakdownButton && (
        <CompatibilityBreakdownModal
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)}
          compatibilityScore={compatibilityScore}
          user1Name={user1?.name || user1?.email || 'User 1'}
          user2Name={user2?.name || user2?.email || 'User 2'}
        />
      )}
    </>
  );
};

export default CompatibilityScoreDisplay;