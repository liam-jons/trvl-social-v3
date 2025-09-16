import { useMemo } from 'react';

const PersonalityMixVisualization = ({
  personalityMix = {},
  totalMembers = 0,
  compact = false,
  className = ''
}) => {
  const personalityConfig = {
    adventurer: {
      label: 'Adventurers',
      color: 'bg-red-500',
      lightColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-300',
      icon: '🏔️'
    },
    planner: {
      label: 'Planners',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      icon: '📋'
    },
    socializer: {
      label: 'Socializers',
      color: 'bg-green-500',
      lightColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-300',
      icon: '🎉'
    },
    explorer: {
      label: 'Explorers',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-300',
      icon: '🗺️'
    },
    relaxer: {
      label: 'Relaxers',
      color: 'bg-amber-500',
      lightColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      icon: '🌴'
    }
  };

  const sortedPersonalities = useMemo(() => {
    return Object.entries(personalityMix)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalMembers > 0 ? (count / totalMembers) * 100 : 0,
        config: personalityConfig[type]
      }));
  }, [personalityMix, totalMembers]);

  if (totalMembers === 0) {
    return (
      <div className={`text-center text-gray-500 dark:text-gray-400 py-4 ${className}`}>
        No members yet
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Personality Mix
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Compact bar visualization */}
        <div className="flex rounded-lg overflow-hidden h-2 bg-gray-200 dark:bg-gray-700">
          {sortedPersonalities.map(({ type, percentage, config }) => (
            <div
              key={type}
              className={`${config.color} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
              title={`${config.label}: ${personalityMix[type]}`}
            />
          ))}
        </div>

        {/* Compact labels */}
        <div className="flex flex-wrap gap-2">
          {sortedPersonalities.slice(0, 3).map(({ type, count, config }) => (
            <div
              key={type}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${config.lightColor} ${config.textColor}`}
            >
              <span className="mr-1">{config.icon}</span>
              <span className="font-medium">{count}</span>
              <span className="ml-1 hidden sm:inline">
                {count === 1 ? config.label.slice(0, -1) : config.label}
              </span>
            </div>
          ))}
          {sortedPersonalities.length > 3 && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              +{sortedPersonalities.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Group Personality Mix
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
        </span>
      </div>

      {/* Full visualization bars */}
      <div className="space-y-3">
        {sortedPersonalities.map(({ type, count, percentage, config }) => (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{config.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {config.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${config.color} h-2 rounded-full transition-all duration-500 ease-out`}
                style={{
                  width: `${percentage}%`,
                  transitionDelay: `${Object.keys(personalityConfig).indexOf(type) * 100}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      {sortedPersonalities.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {sortedPersonalities.length === 1 ? (
              <>This group is primarily <strong>{sortedPersonalities[0].config.label.toLowerCase()}</strong></>
            ) : sortedPersonalities[0].count > sortedPersonalities[1].count ? (
              <>Dominated by <strong>{sortedPersonalities[0].config.label.toLowerCase()}</strong> with diverse mix</>
            ) : (
              <>Well-balanced group with diverse personalities</>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalityMixVisualization;