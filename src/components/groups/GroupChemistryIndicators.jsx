import { useMemo, useState } from 'react';
import { CompatibilityScoreDisplay } from '../compatibility';

const GroupChemistryIndicators = ({
  members = [],
  currentUser = null,
  showPairwiseCompatibility = false,
  className = ''
}) => {
  const [selectedPair, setSelectedPair] = useState(null);

  // Calculate pairwise compatibility scores
  const pairwiseScores = useMemo(() => {
    if (!members || members.length < 2) return [];

    const pairs = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const member1 = members[i];
        const member2 = members[j];

        // This would normally come from a real compatibility calculation
        const baseScore = Math.random() * 40 + 50; // 50-90 range
        const personalityBonus = member1.personality_profile?.primary_type === member2.personality_profile?.primary_type ? 10 : 0;
        const score = Math.min(100, baseScore + personalityBonus);

        pairs.push({
          id: `${member1.id}-${member2.id}`,
          member1,
          member2,
          score,
          level: score >= 80 ? 'excellent' : score >= 65 ? 'great' : score >= 50 ? 'good' : 'challenging'
        });
      }
    }

    return pairs.sort((a, b) => b.score - a.score);
  }, [members]);

  // Calculate overall group chemistry metrics
  const groupMetrics = useMemo(() => {
    if (pairwiseScores.length === 0) return { avgScore: 0, strongPairs: 0, weakPairs: 0, totalPairs: 0 };

    const scores = pairwiseScores.map(pair => pair.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const strongPairs = scores.filter(score => score >= 70).length;
    const weakPairs = scores.filter(score => score < 50).length;

    return {
      avgScore,
      strongPairs,
      weakPairs,
      totalPairs: scores.length
    };
  }, [pairwiseScores]);

  // Calculate compatibility with current user
  const userCompatibility = useMemo(() => {
    if (!currentUser || !members.length) return [];

    return members
      .filter(member => member.id !== currentUser.id)
      .map(member => {
        // This would come from real compatibility calculation
        const score = Math.random() * 40 + 45; // 45-85 range
        return {
          member,
          score,
          level: score >= 75 ? 'excellent' : score >= 60 ? 'great' : score >= 45 ? 'good' : 'challenging'
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [currentUser, members]);

  const getChemistryColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'great': return 'text-blue-600 dark:text-blue-400';
      case 'good': return 'text-amber-600 dark:text-amber-400';
      case 'challenging': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChemistryIcon = (level) => {
    switch (level) {
      case 'excellent': return '⭐';
      case 'great': return '✨';
      case 'good': return '👍';
      case 'challenging': return '⚠️';
      default: return '👥';
    }
  };

  if (members.length < 2) {
    return (
      <div className={`text-center text-gray-500 dark:text-gray-400 py-2 ${className}`}>
        Need at least 2 members to show chemistry
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Chemistry Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🧪</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Group Chemistry
            </span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            groupMetrics.avgScore >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
            groupMetrics.avgScore >= 55 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {Math.round(groupMetrics.avgScore)}% Average
          </div>
        </div>

        {/* Chemistry indicators */}
        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
          {groupMetrics.strongPairs > 0 && (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{groupMetrics.strongPairs} strong</span>
            </span>
          )}
          {groupMetrics.weakPairs > 0 && (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span>{groupMetrics.weakPairs} weak</span>
            </span>
          )}
        </div>
      </div>

      {/* Your Compatibility (if current user is provided) */}
      {currentUser && userCompatibility.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Your Compatibility
          </h5>
          <div className="space-y-1">
            {userCompatibility.slice(0, 3).map(({ member, score, level }) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-medium">
                    {member.name?.[0] || member.email?.[0] || 'U'}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {member.name || member.email}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getChemistryColor(level)}`}>
                    {Math.round(score)}%
                  </span>
                  <span>{getChemistryIcon(level)}</span>
                </div>
              </div>
            ))}
            {userCompatibility.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{userCompatibility.length - 3} more members
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pairwise Compatibility (shown on hover/expanded view) */}
      {showPairwiseCompatibility && pairwiseScores.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Member Compatibility Matrix
          </h5>

          {/* Top pairs */}
          <div className="space-y-2">
            {pairwiseScores.slice(0, 4).map((pair) => (
              <div
                key={pair.id}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  selectedPair === pair.id
                    ? 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedPair(selectedPair === pair.id ? null : pair.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                        {pair.member1.name?.[0] || 'U'}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                        {pair.member2.name?.[0] || 'U'}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {(pair.member1.name || pair.member1.email).split(' ')[0]} & {(pair.member2.name || pair.member2.email).split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getChemistryColor(pair.level)}`}>
                      {Math.round(pair.score)}%
                    </span>
                    <span>{getChemistryIcon(pair.level)}</span>
                  </div>
                </div>

                {/* Detailed compatibility breakdown when selected */}
                {selectedPair === pair.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <CompatibilityScoreDisplay
                      compatibilityScore={{
                        overall_score: pair.score,
                        category_scores: {
                          travel_style: Math.random() * 30 + 60,
                          energy_level: Math.random() * 30 + 55,
                          planning_style: Math.random() * 30 + 65,
                          social_preferences: Math.random() * 30 + 70,
                          budget_alignment: Math.random() * 30 + 50
                        }
                      }}
                      user1={pair.member1}
                      user2={pair.member2}
                      size="sm"
                      showBreakdownButton={false}
                      showRadarChart={false}
                    />
                  </div>
                )}
              </div>
            ))}
            {pairwiseScores.length > 4 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{pairwiseScores.length - 4} more pairs
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChemistryIndicators;