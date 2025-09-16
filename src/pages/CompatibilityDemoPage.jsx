import { useState } from 'react';
import { Target, Tag, BarChart3, Brain, Users } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import {
  CompatibilityCircularProgress,
  CompatibilityBadge,
  CompatibilityRadarChart,
  CompatibilityBreakdownModal,
  CompatibilityScoreDisplay
} from '../components/compatibility';
import { ScoringDimensionType } from '../types/compatibility';
import InteractivePersonalityQuiz from '../components/demo/InteractivePersonalityQuiz';
import GroupCompatibilityDemo from '../components/demo/GroupCompatibilityDemo';

const CompatibilityDemoPage = () => {
  const [selectedDemo, setSelectedDemo] = useState('interactive');
  const [showModal, setShowModal] = useState(false);
  const [userPersonalityProfile, setUserPersonalityProfile] = useState(null);

  // Mock compatibility data
  const mockCompatibilityScore = {
    id: 'demo-score',
    user1Id: 'user1',
    user2Id: 'user2',
    overallScore: 78,
    dimensions: {
      [ScoringDimensionType.PERSONALITY_TRAITS]: {
        name: 'Personality Traits',
        weight: 0.35,
        score: 85,
        maxScore: 100,
        calculatedAt: new Date()
      },
      [ScoringDimensionType.TRAVEL_PREFERENCES]: {
        name: 'Travel Preferences',
        weight: 0.25,
        score: 72,
        maxScore: 100,
        calculatedAt: new Date()
      },
      [ScoringDimensionType.EXPERIENCE_LEVEL]: {
        name: 'Experience Level',
        weight: 0.15,
        score: 68,
        maxScore: 100,
        calculatedAt: new Date()
      },
      [ScoringDimensionType.BUDGET_RANGE]: {
        name: 'Budget Range',
        weight: 0.15,
        score: 90,
        maxScore: 100,
        calculatedAt: new Date()
      },
      [ScoringDimensionType.ACTIVITY_PREFERENCES]: {
        name: 'Activity Preferences',
        weight: 0.10,
        score: 65,
        maxScore: 100,
        calculatedAt: new Date()
      }
    },
    confidence: 0.87,
    algorithmVersion: 'demo-v1',
    calculatedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };

  const mockUsers = {
    user1: { name: 'Alex Johnson', email: 'alex@example.com' },
    user2: { name: 'Sam Wilson', email: 'sam@example.com' }
  };

  const demos = [
    { id: 'interactive', name: 'Interactive Quiz', icon: Brain },
    { id: 'group', name: 'Group Matching', icon: Users },
    { id: 'all', name: 'Complete Display', icon: Target },
    { id: 'circular', name: 'Circular Progress', icon: Target },
    { id: 'badge', name: 'Compatibility Badge', icon: Tag },
    { id: 'radar', name: 'Radar Chart', icon: BarChart3 },
    { id: 'modal', name: 'Breakdown Modal', icon: BarChart3 }
  ];

  const scoreVariations = [
    { score: 92, name: 'Excellent Match' },
    { score: 78, name: 'Good Match' },
    { score: 55, name: 'Fair Match' },
    { score: 28, name: 'Poor Match' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Interactive Compatibility Demo
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Experience our personality assessment and compatibility scoring system through interactive demos and visualizations
        </p>
      </div>

        {/* Demo Navigation */}
        <GlassCard className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {demos.map(demo => (
              <GlassButton
                key={demo.id}
                onClick={() => setSelectedDemo(demo.id)}
                variant={selectedDemo === demo.id ? 'primary' : 'secondary'}
                className="flex items-center gap-2"
              >
                <demo.icon className="w-5 h-5" />
                {demo.name}
              </GlassButton>
            ))}
          </div>
        </GlassCard>

        {/* Demo Content */}
        <div className="space-y-8">
          {/* Interactive Personality Quiz Demo */}
          {selectedDemo === 'interactive' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Interactive Personality Assessment
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Take a mini personality quiz and see real-time compatibility calculations with sample travel partners.
                  This demonstrates how our personality assessment integrates with compatibility scoring.
                </p>
              </div>
              <InteractivePersonalityQuiz
                onProfileUpdate={setUserPersonalityProfile}
              />
            </div>
          )}

          {/* Group Matching Demo */}
          {selectedDemo === 'group' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Group Matching Demonstration
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Explore how our algorithm creates optimal travel groups by analyzing personality compatibility
                  and matching travelers to specific trip scenarios. See compatibility matrices and group harmony scores.
                </p>
              </div>
              <GroupCompatibilityDemo
                userProfile={userPersonalityProfile}
              />
            </div>
          )}

          {/* Complete Display Demo */}
          {selectedDemo === 'all' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Complete Compatibility Display
              </h2>
              <CompatibilityScoreDisplay
                compatibilityScore={mockCompatibilityScore}
                user1={mockUsers.user1}
                user2={mockUsers.user2}
                showRadarChart={true}
                showBreakdownButton={true}
                size="md"
              />

              {/* Different Sizes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['sm', 'md', 'lg'].map(size => (
                  <GlassCard key={size}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                      Size: {size.toUpperCase()}
                    </h3>
                    <CompatibilityScoreDisplay
                      compatibilityScore={mockCompatibilityScore}
                      user1={mockUsers.user1}
                      user2={mockUsers.user2}
                      showRadarChart={false}
                      showBreakdownButton={false}
                      size={size}
                    />
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Circular Progress Demo */}
          {selectedDemo === 'circular' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Circular Progress Components
              </h2>

              {/* Score Variations */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
                  Different Score Levels
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {scoreVariations.map((variation, index) => (
                    <div key={index} className="text-center">
                      <CompatibilityCircularProgress
                        score={variation.score}
                        size={120}
                        animate={true}
                      />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {variation.name}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Size Variations */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
                  Different Sizes
                </h3>
                <div className="flex items-end justify-center gap-8">
                  {[80, 100, 120, 160].map(size => (
                    <div key={size} className="text-center">
                      <CompatibilityCircularProgress
                        score={78}
                        size={size}
                        animate={true}
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {size}px
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Badge Demo */}
          {selectedDemo === 'badge' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Compatibility Badges
              </h2>

              {/* Score Variations */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Score Variations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scoreVariations.map((variation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">{variation.score}%</span>
                      <CompatibilityBadge
                        score={variation.score}
                        variant="default"
                        size="md"
                        showScore={true}
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Variant Styles */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Badge Variants
                </h3>
                <div className="space-y-4">
                  {['default', 'solid', 'outline', 'minimal'].map(variant => (
                    <div key={variant} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{variant}</span>
                      <CompatibilityBadge
                        score={78}
                        variant={variant}
                        size="md"
                        showScore={true}
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Radar Chart Demo */}
          {selectedDemo === 'radar' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Radar Chart Visualization
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Standard Chart */}
                <GlassCard className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    With Labels & Values
                  </h3>
                  <CompatibilityRadarChart
                    dimensions={mockCompatibilityScore.dimensions}
                    size={250}
                    animate={true}
                    showLabels={true}
                    showValues={true}
                  />
                </GlassCard>

                {/* Compact Chart */}
                <GlassCard className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Compact Version
                  </h3>
                  <CompatibilityRadarChart
                    dimensions={mockCompatibilityScore.dimensions}
                    size={200}
                    animate={true}
                    showLabels={false}
                    showValues={false}
                  />
                </GlassCard>
              </div>

              {/* Different Sizes */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
                  Size Variations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[150, 200, 250].map(size => (
                    <div key={size} className="text-center">
                      <CompatibilityRadarChart
                        dimensions={mockCompatibilityScore.dimensions}
                        size={size}
                        animate={true}
                        showLabels={true}
                      />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {size}px
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Modal Demo */}
          {selectedDemo === 'modal' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Breakdown Modal
              </h2>

              <GlassCard className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Click to Open Modal
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The breakdown modal provides detailed analysis across multiple tabs
                  including overview, dimension breakdown, and insights.
                </p>
                <GlassButton
                  onClick={() => setShowModal(true)}
                  variant="primary"
                  className="flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Open Breakdown Modal
                </GlassButton>
              </GlassCard>
            </div>
          )}
        </div>

      {/* Demo Modal */}
      <CompatibilityBreakdownModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        compatibilityScore={mockCompatibilityScore}
        user1Name={mockUsers.user1.name}
        user2Name={mockUsers.user2.name}
      />
    </div>
  );
};

export default CompatibilityDemoPage;