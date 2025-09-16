import { useMemo } from 'react';

const GroupDynamicsSummary = ({
  insights = [],
  avgCompatibility = 0,
  memberCount = 0,
  showDetailed = false,
  className = ''
}) => {
  const compatibilityLevel = useMemo(() => {
    if (avgCompatibility >= 85) return { level: 'excellent', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    if (avgCompatibility >= 70) return { level: 'great', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    if (avgCompatibility >= 55) return { level: 'good', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
    if (avgCompatibility >= 40) return { level: 'mixed', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' };
    return { level: 'challenging', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' };
  }, [avgCompatibility]);

  const groupSizeInsight = useMemo(() => {
    if (memberCount <= 2) return 'Intimate group - perfect for close bonding';
    if (memberCount <= 4) return 'Small group - ideal for consensus and flexibility';
    if (memberCount <= 6) return 'Medium group - good balance of dynamics';
    if (memberCount <= 8) return 'Large group - diverse perspectives but coordination needed';
    return 'Very large group - requires strong leadership';
  }, [memberCount]);

  const dynamicsIcon = useMemo(() => {
    switch (compatibilityLevel.level) {
      case 'excellent': return '✨';
      case 'great': return '🎯';
      case 'good': return '👥';
      case 'mixed': return '⚖️';
      case 'challenging': return '🤝';
      default: return '👥';
    }
  }, [compatibilityLevel.level]);

  if (memberCount === 0) {
    return (
      <div className={`text-center text-gray-500 dark:text-gray-400 py-2 ${className}`}>
        Add members to see group dynamics
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Compatibility Summary */}
      <div className={`inline-flex items-center px-3 py-2 rounded-full ${compatibilityLevel.bgColor}`}>
        <span className="mr-2 text-lg">{dynamicsIcon}</span>
        <span className={`text-sm font-medium ${compatibilityLevel.color}`}>
          {compatibilityLevel.level.charAt(0).toUpperCase() + compatibilityLevel.level.slice(1)} Chemistry
        </span>
        {avgCompatibility > 0 && (
          <span className={`ml-2 text-xs ${compatibilityLevel.color} opacity-75`}>
            ({Math.round(avgCompatibility)}% match)
          </span>
        )}
      </div>

      {/* AI-Generated Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.slice(0, showDetailed ? insights.length : 2).map((insight, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2" />
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
          {!showDetailed && insights.length > 2 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              +{insights.length - 2} more insights
            </p>
          )}
        </div>
      )}

      {/* Group Size Insight */}
      {showDetailed && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-accent-500 rounded-full mt-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {groupSizeInsight}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Compatibility Breakdown */}
      {showDetailed && avgCompatibility > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Compatibility Breakdown
          </h5>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Travel Styles:</span>
              <span className={`ml-2 font-medium ${
                avgCompatibility >= 70 ? 'text-green-600 dark:text-green-400' :
                avgCompatibility >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {avgCompatibility >= 70 ? 'Aligned' : avgCompatibility >= 50 ? 'Compatible' : 'Different'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Energy Levels:</span>
              <span className={`ml-2 font-medium ${
                avgCompatibility >= 60 ? 'text-green-600 dark:text-green-400' :
                avgCompatibility >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {avgCompatibility >= 60 ? 'Matched' : avgCompatibility >= 40 ? 'Mixed' : 'Mismatched'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Budget Range:</span>
              <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                Similar
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Flexibility:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                High
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Success Indicators */}
      {showDetailed && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Trip Success Factors
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {[
              { label: 'Planning Alignment', score: Math.min(100, avgCompatibility + 10) },
              { label: 'Activity Preferences', score: avgCompatibility },
              { label: 'Communication Style', score: Math.max(50, avgCompatibility - 10) },
              { label: 'Conflict Resolution', score: Math.min(95, avgCompatibility + 5) }
            ].map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {factor.label}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        factor.score >= 70 ? 'bg-green-500' :
                        factor.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.max(10, factor.score)}%`,
                        transitionDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                    {Math.round(factor.score)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDynamicsSummary;