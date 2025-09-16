import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { CompatibilityCircularProgress, CompatibilityBadge } from '../compatibility';

// Extended sample users pool for group matching
const sampleUsersPool = [
  {
    id: 'user1',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    personalityProfile: {
      energyLevel: 75,
      socialPreference: 60,
      adventureStyle: 85,
      riskTolerance: 70
    },
    travelStyle: 'Adventure Seeker',
    interests: ['Hiking', 'Photography', 'Local Culture']
  },
  {
    id: 'user2',
    name: 'Sam Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1c5?w=100&h=100&fit=crop&crop=face',
    personalityProfile: {
      energyLevel: 45,
      socialPreference: 80,
      adventureStyle: 40,
      riskTolerance: 30
    },
    travelStyle: 'Social Explorer',
    interests: ['Food Tours', 'Museums', 'Shopping']
  },
  {
    id: 'user3',
    name: 'Jordan Taylor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    personalityProfile: {
      energyLevel: 90,
      socialPreference: 35,
      adventureStyle: 95,
      riskTolerance: 85
    },
    travelStyle: 'Solo Adventurer',
    interests: ['Extreme Sports', 'Wildlife', 'Off-grid Travel']
  },
  {
    id: 'user4',
    name: 'Maya Patel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    personalityProfile: {
      energyLevel: 60,
      socialPreference: 70,
      adventureStyle: 60,
      riskTolerance: 50
    },
    travelStyle: 'Balanced Explorer',
    interests: ['Art Galleries', 'Yoga Retreats', 'Beach Relaxation']
  },
  {
    id: 'user5',
    name: 'Chris Johnson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    personalityProfile: {
      energyLevel: 80,
      socialPreference: 85,
      adventureStyle: 70,
      riskTolerance: 60
    },
    travelStyle: 'Group Leader',
    interests: ['Group Activities', 'Nightlife', 'Sports Events']
  },
  {
    id: 'user6',
    name: 'Riley Martinez',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    personalityProfile: {
      energyLevel: 40,
      socialPreference: 55,
      adventureStyle: 30,
      riskTolerance: 25
    },
    travelStyle: 'Comfort Traveler',
    interests: ['Luxury Resorts', 'Spa Treatments', 'Fine Dining']
  }
];

// Predefined group scenarios
const groupScenarios = [
  {
    id: 'adventure',
    name: 'Adventure Seekers Trip',
    description: 'High-energy adventure travel with hiking and outdoor activities',
    idealProfile: {
      energyLevel: 80,
      socialPreference: 60,
      adventureStyle: 85,
      riskTolerance: 75
    },
    maxSize: 4
  },
  {
    id: 'cultural',
    name: 'Cultural Exploration',
    description: 'Museum visits, local experiences, and cultural immersion',
    idealProfile: {
      energyLevel: 50,
      socialPreference: 70,
      adventureStyle: 45,
      riskTolerance: 40
    },
    maxSize: 5
  },
  {
    id: 'relaxation',
    name: 'Relaxation Retreat',
    description: 'Beach resorts, spa treatments, and low-key activities',
    idealProfile: {
      energyLevel: 30,
      socialPreference: 50,
      adventureStyle: 25,
      riskTolerance: 20
    },
    maxSize: 3
  }
];

const GroupCompatibilityDemo = ({ userProfile }) => {
  const [selectedScenario, setSelectedScenario] = useState('adventure');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showMatrix, setShowMatrix] = useState(false);

  const currentScenario = groupScenarios.find(s => s.id === selectedScenario);

  // Calculate compatibility scores between all users
  const compatibilityMatrix = useMemo(() => {
    const allUsers = userProfile ? [...sampleUsersPool, {
      id: 'you',
      name: 'You',
      personalityProfile: userProfile,
      travelStyle: 'Your Style',
      interests: ['Your Interests']
    }] : sampleUsersPool;

    const matrix = [];
    for (let i = 0; i < allUsers.length; i++) {
      const row = [];
      for (let j = 0; j < allUsers.length; j++) {
        if (i === j) {
          row.push(100); // Perfect compatibility with self
        } else {
          const user1 = allUsers[i].personalityProfile;
          const user2 = allUsers[j].personalityProfile;

          // Calculate compatibility based on personality similarity
          const energyDiff = Math.abs(user1.energyLevel - user2.energyLevel);
          const socialDiff = Math.abs(user1.socialPreference - user2.socialPreference);
          const adventureDiff = Math.abs(user1.adventureStyle - user2.adventureStyle);
          const riskDiff = Math.abs(user1.riskTolerance - user2.riskTolerance);

          const compatibility = Math.round(
            100 - ((energyDiff + socialDiff + adventureDiff + riskDiff) / 4)
          );

          row.push(Math.max(0, Math.min(100, compatibility)));
        }
      }
      matrix.push(row);
    }
    return { matrix, users: allUsers };
  }, [userProfile]);

  // Get recommendations for the current scenario
  const getGroupRecommendations = () => {
    const availableUsers = userProfile ?
      [...sampleUsersPool, {
        id: 'you',
        name: 'You',
        personalityProfile: userProfile,
        travelStyle: 'Your Style',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'
      }] :
      sampleUsersPool;

    // Score users based on how well they fit the scenario
    const scoredUsers = availableUsers.map(user => {
      const profile = user.personalityProfile;
      const ideal = currentScenario.idealProfile;

      const energyScore = 100 - Math.abs(profile.energyLevel - ideal.energyLevel);
      const socialScore = 100 - Math.abs(profile.socialPreference - ideal.socialPreference);
      const adventureScore = 100 - Math.abs(profile.adventureStyle - ideal.adventureStyle);
      const riskScore = 100 - Math.abs(profile.riskTolerance - ideal.riskTolerance);

      const scenarioFit = Math.round((energyScore + socialScore + adventureScore + riskScore) / 4);

      return {
        ...user,
        scenarioFit: Math.max(0, Math.min(100, scenarioFit))
      };
    });

    // Sort by scenario fit and return top matches
    return scoredUsers
      .sort((a, b) => b.scenarioFit - a.scenarioFit)
      .slice(0, currentScenario.maxSize);
  };

  const recommendedGroup = getGroupRecommendations();

  // Calculate group harmony (average pairwise compatibility)
  const calculateGroupHarmony = (group) => {
    if (group.length < 2) return 0;

    let totalCompatibility = 0;
    let pairCount = 0;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const user1Index = compatibilityMatrix.users.findIndex(u => u.id === group[i].id);
        const user2Index = compatibilityMatrix.users.findIndex(u => u.id === group[j].id);

        if (user1Index !== -1 && user2Index !== -1) {
          totalCompatibility += compatibilityMatrix.matrix[user1Index][user2Index];
          pairCount++;
        }
      }
    }

    return pairCount > 0 ? Math.round(totalCompatibility / pairCount) : 0;
  };

  const groupHarmony = calculateGroupHarmony(recommendedGroup);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Group Matching Demonstration
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          See how our algorithm creates optimal travel groups based on personality compatibility
        </p>
      </div>

      {/* Scenario Selection */}
      <GlassCard>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose Travel Scenario
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groupScenarios.map(scenario => (
            <motion.div
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                onClick={() => setSelectedScenario(scenario.id)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  selectedScenario === scenario.id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {scenario.name}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {scenario.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Max group size: {scenario.maxSize}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Recommended Group */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recommended Group
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Group Harmony:</span>
            <CompatibilityBadge
              score={groupHarmony}
              variant="default"
              size="sm"
              showScore={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {recommendedGroup.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.travelStyle}
                    </div>
                  </div>
                  <CompatibilityCircularProgress
                    score={user.scenarioFit}
                    size={40}
                    animate={true}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Scenario fit: {user.scenarioFit}%
                  </div>

                  {/* Personality traits mini bars */}
                  <div className="space-y-1">
                    {Object.entries(user.personalityProfile).map(([trait, value]) => (
                      <div key={trait} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16 truncate">
                          {trait.replace(/([A-Z])/g, ' $1').trim().split(' ')[0]}
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 w-8">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {user.interests && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Interests:</div>
                    <div className="flex flex-wrap gap-1">
                      {user.interests.slice(0, 3).map(interest => (
                        <span
                          key={interest}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <GlassButton
            onClick={() => setShowMatrix(!showMatrix)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <span>📊</span>
            {showMatrix ? 'Hide' : 'Show'} Compatibility Matrix
          </GlassButton>
        </div>
      </GlassCard>

      {/* Compatibility Matrix */}
      <AnimatePresence>
        {showMatrix && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Full Compatibility Matrix
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 text-gray-600 dark:text-gray-400"></th>
                      {compatibilityMatrix.users.map(user => (
                        <th key={user.id} className="text-center p-2 text-gray-600 dark:text-gray-400">
                          {user.name.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compatibilityMatrix.users.map((user1, i) => (
                      <tr key={user1.id}>
                        <td className="p-2 font-medium text-gray-900 dark:text-white">
                          {user1.name.split(' ')[0]}
                        </td>
                        {compatibilityMatrix.matrix[i].map((score, j) => (
                          <td key={j} className="text-center p-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                                score >= 80 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                score >= 60 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                score >= 40 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {i === j ? '—' : score}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4 justify-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded"></div>
                    <span>80-100% (Excellent)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded"></div>
                    <span>60-79% (Good)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 rounded"></div>
                    <span>40-59% (Fair)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded"></div>
                    <span>0-39% (Poor)</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

GroupCompatibilityDemo.propTypes = {
  userProfile: PropTypes.object
};

export default GroupCompatibilityDemo;