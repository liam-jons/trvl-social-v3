import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import {
  CompatibilityCircularProgress,
  CompatibilityBadge,
  CompatibilityRadarChart,
  CompatibilityScoreDisplay
} from '../compatibility';

// Mini quiz questions - subset of main quiz for demo purposes
const demoQuizQuestions = [
  {
    id: 1,
    text: "What's your ideal vacation morning?",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    category: 'energyLevel',
    options: [
      {
        id: '1a',
        text: 'Sunrise hike to catch the golden hour',
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=300&h=200&fit=crop',
        traitScores: { energyLevel: 90, adventureStyle: 80, riskTolerance: 60 }
      },
      {
        id: '1b',
        text: 'Leisurely breakfast with ocean views',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop',
        traitScores: { energyLevel: 30, socialPreference: 40, adventureStyle: 20 }
      },
      {
        id: '1c',
        text: 'Morning yoga session on the beach',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=200&fit=crop',
        traitScores: { energyLevel: 50, adventureStyle: 40, riskTolerance: 30 }
      }
    ]
  },
  {
    id: 2,
    text: "How do you prefer to explore a new city?",
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop",
    category: 'socialPreference',
    options: [
      {
        id: '2a',
        text: 'Join a local group tour with other travelers',
        imageUrl: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=300&h=200&fit=crop',
        traitScores: { socialPreference: 90, energyLevel: 60, adventureStyle: 50 }
      },
      {
        id: '2b',
        text: 'Wander solo with just a map and curiosity',
        imageUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73fb6?w=300&h=200&fit=crop',
        traitScores: { socialPreference: 10, adventureStyle: 80, riskTolerance: 70 }
      },
      {
        id: '2c',
        text: 'Follow a detailed itinerary and guidebook',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
        traitScores: { socialPreference: 40, energyLevel: 40, adventureStyle: 20 }
      }
    ]
  },
  {
    id: 3,
    text: "What type of accommodation appeals to you most?",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop",
    category: 'riskTolerance',
    options: [
      {
        id: '3a',
        text: 'Luxury resort with all amenities',
        imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=300&h=200&fit=crop',
        traitScores: { riskTolerance: 20, energyLevel: 40, socialPreference: 60 }
      },
      {
        id: '3b',
        text: 'Cozy local bed & breakfast',
        imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&h=200&fit=crop',
        traitScores: { riskTolerance: 50, socialPreference: 70, adventureStyle: 60 }
      },
      {
        id: '3c',
        text: 'Camping under the stars',
        imageUrl: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=300&h=200&fit=crop',
        traitScores: { riskTolerance: 90, adventureStyle: 85, energyLevel: 80 }
      }
    ]
  }
];

// Sample users for compatibility comparison
const sampleUsers = [
  {
    id: 'user1',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    personalityProfile: {
      energyLevel: 75,
      socialPreference: 60,
      adventureStyle: 85,
      riskTolerance: 70
    }
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
    }
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
    }
  }
];

const InteractivePersonalityQuiz = ({ onProfileUpdate }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userProfile, setUserProfile] = useState({
    energyLevel: 50,
    socialPreference: 50,
    adventureStyle: 50,
    riskTolerance: 50
  });

  // Calculate current personality profile from answers
  const calculateProfile = useMemo(() => {
    const answerArray = Object.values(answers);
    if (answerArray.length === 0) {
      return {
        energyLevel: 50,
        socialPreference: 50,
        adventureStyle: 50,
        riskTolerance: 50
      };
    }

    const traitTotals = {
      energyLevel: 0,
      socialPreference: 0,
      adventureStyle: 0,
      riskTolerance: 0
    };
    const traitCounts = {
      energyLevel: 0,
      socialPreference: 0,
      adventureStyle: 0,
      riskTolerance: 0
    };

    // Aggregate scores from answers
    answerArray.forEach(answer => {
      if (answer.traitScores) {
        Object.entries(answer.traitScores).forEach(([trait, score]) => {
          if (traitTotals.hasOwnProperty(trait) && typeof score === 'number') {
            traitTotals[trait] += score;
            traitCounts[trait] += 1;
          }
        });
      }
    });

    // Calculate averages
    const profile = {};
    Object.keys(traitTotals).forEach(trait => {
      if (traitCounts[trait] > 0) {
        profile[trait] = Math.round(traitTotals[trait] / traitCounts[trait]);
      } else {
        profile[trait] = 50; // Default middle value
      }
    });

    return profile;
  }, [answers]);

  // Update profile when answers change
  useEffect(() => {
    setUserProfile(calculateProfile);
    onProfileUpdate?.(calculateProfile);
  }, [calculateProfile, onProfileUpdate]);

  // Calculate compatibility scores with sample users
  const compatibilityScores = useMemo(() => {
    return sampleUsers.map(user => {
      const userScores = user.personalityProfile;
      const currentScores = userProfile;

      // Simple compatibility calculation based on trait similarity
      const energyDiff = Math.abs(userScores.energyLevel - currentScores.energyLevel);
      const socialDiff = Math.abs(userScores.socialPreference - currentScores.socialPreference);
      const adventureDiff = Math.abs(userScores.adventureStyle - currentScores.adventureStyle);
      const riskDiff = Math.abs(userScores.riskTolerance - currentScores.riskTolerance);

      // Convert differences to compatibility scores (lower difference = higher compatibility)
      const compatibility = Math.round(
        100 - ((energyDiff + socialDiff + adventureDiff + riskDiff) / 4)
      );

      return {
        ...user,
        compatibilityScore: Math.max(0, Math.min(100, compatibility))
      };
    });
  }, [userProfile]);

  const handleAnswerSelect = (option) => {
    setAnswers(prev => ({
      ...prev,
      [demoQuizQuestions[currentQuestion].id]: option
    }));
  };

  const handleNext = () => {
    if (currentQuestion < demoQuizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setUserProfile({
      energyLevel: 50,
      socialPreference: 50,
      adventureStyle: 50,
      riskTolerance: 50
    });
  };

  const isComplete = Object.keys(answers).length === demoQuizQuestions.length;
  const isLastQuestion = currentQuestion === demoQuizQuestions.length - 1;
  const selectedOption = answers[demoQuizQuestions[currentQuestion].id];

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Interactive Personality Assessment
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Question {currentQuestion + 1} of {demoQuizQuestions.length}
          </div>
          <GlassButton
            onClick={handleReset}
            variant="secondary"
            size="sm"
          >
            Reset Demo
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Section */}
        <div className="lg:col-span-2">
          <GlassCard>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Question Image and Text */}
                <div className="relative h-48 rounded-lg overflow-hidden mb-6">
                  <img
                    src={demoQuizQuestions[currentQuestion].imageUrl}
                    alt={demoQuizQuestions[currentQuestion].text}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="text-lg font-bold text-white drop-shadow-lg">
                      {demoQuizQuestions[currentQuestion].text}
                    </h4>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-3 mb-6">
                  {demoQuizQuestions[currentQuestion].options.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div
                        onClick={() => handleAnswerSelect(option)}
                        className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${
                          selectedOption?.id === option.id
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 dark:border-blue-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 transition-all ${
                            selectedOption?.id === option.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400'
                          }`}>
                            {selectedOption?.id === option.id && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {option.imageUrl && (
                              <img
                                src={option.imageUrl}
                                alt={option.text}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {option.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <GlassButton
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    variant="secondary"
                  >
                    Previous
                  </GlassButton>
                  <GlassButton
                    onClick={handleNext}
                    disabled={!selectedOption || isLastQuestion}
                    variant="primary"
                  >
                    {isLastQuestion ? 'Complete' : 'Next Question'}
                  </GlassButton>
                </div>
              </motion.div>
            </AnimatePresence>
          </GlassCard>
        </div>

        {/* Real-time Compatibility Results */}
        <div className="space-y-4">
          {/* Current Profile */}
          <GlassCard>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Current Profile
            </h4>
            <div className="space-y-3">
              {Object.entries(userProfile).map(([trait, value]) => (
                <div key={trait}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {trait.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {value}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Compatibility with Sample Users */}
          <GlassCard>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Compatibility Matches
            </h4>
            <div className="space-y-4">
              {compatibilityScores.map((user) => (
                <div key={user.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <CompatibilityBadge
                        score={user.compatibilityScore}
                        variant="default"
                        size="sm"
                        showScore={true}
                      />
                    </div>
                    <CompatibilityCircularProgress
                      score={user.compatibilityScore}
                      size={40}
                      animate={true}
                    />
                  </div>

                  {/* Compatibility breakdown bar */}
                  <div className="ml-13 space-y-1">
                    {Object.entries(user.personalityProfile).map(([trait, theirScore]) => {
                      const myScore = userProfile[trait];
                      const similarity = Math.max(0, 100 - Math.abs(theirScore - myScore));

                      return (
                        <div key={trait} className="text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-500 dark:text-gray-400 capitalize">
                              {trait.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {similarity}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <motion.div
                              className={`h-1 rounded-full ${
                                similarity >= 80 ? 'bg-green-500' :
                                similarity >= 60 ? 'bg-blue-500' :
                                similarity >= 40 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${similarity}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Completion Status */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <GlassCard className="bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="text-green-800 dark:text-green-200 text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-sm font-medium">Assessment Complete!</div>
                  <div className="text-xs mt-1">Your personality profile is ready</div>
                </div>
              </GlassCard>

              {/* Radar Chart Visualization */}
              <GlassCard>
                <h5 className="text-md font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Personality Profile Radar
                </h5>
                <div className="flex justify-center">
                  <div className="relative">
                    <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                      {/* Background circles */}
                      {[1, 2, 3, 4, 5].map((level) => (
                        <circle
                          key={level}
                          cx="100"
                          cy="100"
                          r={level * 20}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-gray-300 dark:text-gray-600"
                        />
                      ))}

                      {/* Axis lines */}
                      {Object.keys(userProfile).map((trait, index) => {
                        const angle = (index * Math.PI * 2) / Object.keys(userProfile).length;
                        const x2 = 100 + Math.cos(angle) * 100;
                        const y2 = 100 + Math.sin(angle) * 100;

                        return (
                          <line
                            key={trait}
                            x1="100"
                            y1="100"
                            x2={x2}
                            y2={y2}
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-gray-300 dark:text-gray-600"
                          />
                        );
                      })}

                      {/* Personality profile polygon */}
                      <polygon
                        points={Object.entries(userProfile).map(([trait, value], index) => {
                          const angle = (index * Math.PI * 2) / Object.keys(userProfile).length;
                          const radius = (value / 100) * 100;
                          const x = 100 + Math.cos(angle) * radius;
                          const y = 100 + Math.sin(angle) * radius;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="2"
                      />

                      {/* Data points */}
                      {Object.entries(userProfile).map(([trait, value], index) => {
                        const angle = (index * Math.PI * 2) / Object.keys(userProfile).length;
                        const radius = (value / 100) * 100;
                        const x = 100 + Math.cos(angle) * radius;
                        const y = 100 + Math.sin(angle) * radius;

                        return (
                          <circle
                            key={trait}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="rgb(59, 130, 246)"
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </svg>

                    {/* Labels */}
                    <div className="absolute inset-0">
                      {Object.entries(userProfile).map(([trait, value], index) => {
                        const angle = (index * Math.PI * 2) / Object.keys(userProfile).length;
                        const labelRadius = 110;
                        const x = 100 + Math.cos(angle) * labelRadius;
                        const y = 100 + Math.sin(angle) * labelRadius;

                        return (
                          <div
                            key={trait}
                            className="absolute text-xs font-medium text-gray-700 dark:text-gray-300 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: `${x}px`,
                              top: `${y}px`,
                            }}
                          >
                            {trait.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

InteractivePersonalityQuiz.propTypes = {
  onProfileUpdate: PropTypes.func
};

export default InteractivePersonalityQuiz;