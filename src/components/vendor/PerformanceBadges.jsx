import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  Zap,
  Target,
  Award,
  Lightbulb,
  Medal
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import vendorPerformanceService from '../../services/vendor-performance-service';
/**
 * Performance Badges Component - Award and display performance-based badges
 */
const PerformanceBadges = ({ vendorId }) => {
  const [badges, setBadges] = useState([]);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    loadBadgeData();
  }, [vendorId]);
  const loadBadgeData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get current performance data
      const performanceResult = await vendorPerformanceService.calculatePerformanceMetrics(vendorId, 30);
      if (performanceResult.error) {
        throw new Error(performanceResult.error);
      }
      setPerformanceData(performanceResult.data);
      // Load earned badges (from localStorage for demo)
      const savedBadges = localStorage.getItem(`vendor-badges-${vendorId}`);
      const earnedBadges = savedBadges ? JSON.parse(savedBadges) : [];
      setBadges(earnedBadges);
      // Calculate available badges based on performance
      const available = calculateAvailableBadges(performanceResult.data, earnedBadges);
      setAvailableBadges(available);
    } catch (err) {
      console.error('Load badge data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const calculateAvailableBadges = (performance, earnedBadges) => {
    const metrics = performance.metrics;
    const earnedBadgeTypes = earnedBadges.map(b => b.type);
    const allBadges = [
      {
        type: 'excellence_award',
        name: 'Excellence Award',
        description: 'Maintain an overall performance score of 90+ for 30 days',
        icon: '🏆',
        tier: 'gold',
        criteria: performance.performanceScore >= 90,
        requirement: 'Performance Score: 90+',
        current: performance.performanceScore,
        points: 100
      },
      {
        type: 'customer_favorite',
        name: 'Customer Favorite',
        description: 'Achieve 4.8+ average rating with 50+ reviews',
        icon: Star,
        tier: 'gold',
        criteria: metrics.reviews.averageRating >= 4.8 && metrics.reviews.totalReviews >= 50,
        requirement: '4.8+ rating, 50+ reviews',
        current: `${metrics.reviews.averageRating.toFixed(1)} rating, ${metrics.reviews.totalReviews} reviews`,
        points: 150
      },
      {
        type: 'reliability_expert',
        name: 'Reliability Expert',
        description: 'Maintain 95+ completion rate with zero vendor cancellations',
        icon: CheckCircle,
        tier: 'silver',
        criteria: metrics.bookings.completionRate >= 95 && metrics.cancellations.vendorCancellationRate === 0,
        requirement: '95%+ completion, 0% vendor cancellations',
        current: `${metrics.bookings.completionRate.toFixed(1)}% completion, ${metrics.cancellations.vendorCancellationRate.toFixed(1)}% cancellations`,
        points: 75
      },
      {
        type: 'quick_responder',
        name: 'Quick Responder',
        description: 'Maintain average response time under 2 hours',
        icon: Zap,
        tier: 'bronze',
        criteria: metrics.responseTime.averageResponseTime <= 2,
        requirement: 'Response time: <2 hours',
        current: `${metrics.responseTime.averageResponseTime.toFixed(1)} hours`,
        points: 50
      },
      {
        type: 'growth_champion',
        name: 'Growth Champion',
        description: 'Achieve 20%+ revenue growth over previous period',
        icon: '📈',
        tier: 'silver',
        criteria: metrics.revenue.growthRate >= 20,
        requirement: 'Revenue growth: 20%+',
        current: `${metrics.revenue.growthRate.toFixed(1)}% growth`,
        points: 80
      },
      {
        type: 'satisfaction_guru',
        name: 'Satisfaction Guru',
        description: 'Achieve 90%+ customer satisfaction rate',
        icon: '😊',
        tier: 'silver',
        criteria: metrics.reviews.satisfactionRate >= 90,
        requirement: 'Satisfaction rate: 90%+',
        current: `${metrics.reviews.satisfactionRate.toFixed(1)}%`,
        points: 70
      },
      {
        type: 'volume_master',
        name: 'Volume Master',
        description: 'Complete 100+ bookings in 30 days',
        icon: Target,
        tier: 'bronze',
        criteria: metrics.bookings.completedBookings >= 100,
        requirement: 'Completed bookings: 100+',
        current: `${metrics.bookings.completedBookings} bookings`,
        points: 60
      },
      {
        type: 'newcomer_success',
        name: 'Newcomer Success',
        description: 'Achieve first 10 completed bookings with 4.0+ rating',
        icon: Award,
        tier: 'bronze',
        criteria: metrics.bookings.completedBookings >= 10 && metrics.reviews.averageRating >= 4.0,
        requirement: '10+ bookings, 4.0+ rating',
        current: `${metrics.bookings.completedBookings} bookings, ${metrics.reviews.averageRating.toFixed(1)} rating`,
        points: 30
      },
      {
        type: 'consistency_king',
        name: 'Consistency King',
        description: 'Maintain stable performance for 90 consecutive days',
        icon: '👑',
        tier: 'platinum',
        criteria: false, // This would require historical data
        requirement: 'Stable performance for 90 days',
        current: 'Track performance over time',
        points: 200
      },
      {
        type: 'innovation_leader',
        name: 'Innovation Leader',
        description: 'First to implement new platform features',
        icon: Lightbulb,
        tier: 'special',
        criteria: false, // This would be manually awarded
        requirement: 'Early feature adoption',
        current: 'Adopt new features quickly',
        points: 120
      }
    ];
    return allBadges.filter(badge => !earnedBadgeTypes.includes(badge.type));
  };
  const claimBadge = (badge) => {
    if (!badge.criteria) return;
    const newBadge = {
      ...badge,
      earnedAt: new Date().toISOString(),
      id: Date.now().toString()
    };
    const updatedBadges = [...badges, newBadge];
    setBadges(updatedBadges);
    localStorage.setItem(`vendor-badges-${vendorId}`, JSON.stringify(updatedBadges));
    // Remove from available badges
    setAvailableBadges(availableBadges.filter(b => b.type !== badge.type));
  };
  const getTierColor = (tier) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      special: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[tier] || colors.bronze;
  };
  const getTierIcon = (tier) => {
    const icons = {
      bronze: Medal,
      silver: Medal,
      gold: Award,
      platinum: Star,
      special: Medal
    };
    return icons[tier] || Medal;
  };
  const totalPoints = badges.reduce((sum, badge) => sum + (badge.points || 0), 0);
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Badges</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadBadgeData}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Badges</h2>
          <p className="text-gray-500 mt-1">
            Earn badges by achieving performance milestones and excellence standards
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
          <div className="text-sm text-gray-500">Total Points</div>
        </div>
      </div>
      {/* Earned Badges */}
      {badges.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Earned Badges</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className={`p-4 rounded-lg border-2 ${getTierColor(badge.tier)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <badge.icon className="w-6 h-6 text-yellow-500" />
                    {(() => {
                      const TierIcon = getTierIcon(badge.tier);
                      return <TierIcon className="w-5 h-5 text-gray-500" />;
                    })()}
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    +{badge.points} pts
                  </Badge>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{badge.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                <div className="text-xs text-gray-500">
                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Available Badges */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Badges</h3>
        {availableBadges.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">All Badges Earned!</h4>
            <p className="text-gray-500">You've earned all available badges. Keep up the excellent work!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableBadges.map((badge) => (
              <div key={badge.type} className={`p-4 rounded-lg border-2 ${badge.criteria ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <badge.icon className="w-6 h-6 text-yellow-500" />
                    {(() => {
                      const TierIcon = getTierIcon(badge.tier);
                      return <TierIcon className="w-5 h-5 text-gray-500" />;
                    })()}
                    <span className="text-sm font-medium text-gray-600 capitalize">{badge.tier}</span>
                  </div>
                  <Badge className={badge.criteria ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {badge.points} pts
                  </Badge>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{badge.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    <div className="font-medium">Requirement:</div>
                    <div>{badge.requirement}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <div className="font-medium">Current:</div>
                    <div>{badge.current}</div>
                  </div>
                </div>
                {badge.criteria && (
                  <div className="mt-4">
                    <Button
                      onClick={() => claimBadge(badge)}
                      size="sm"
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Claim Badge
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      {/* Badge Tiers Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Badge Tiers</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {[
            { tier: 'bronze', name: 'Bronze', icon: '🥉', points: '30-60 pts' },
            { tier: 'silver', name: 'Silver', icon: '🥈', points: '70-80 pts' },
            { tier: 'gold', name: 'Gold', icon: '🥇', points: '100-150 pts' },
            { tier: 'platinum', name: 'Platinum', icon: '💎', points: '200+ pts' },
            { tier: 'special', name: 'Special', icon: Medal, points: 'Variable' }
          ].map((tier) => (
            <div key={tier.tier} className="text-center">
              <div className="text-2xl mb-1">{tier.icon}</div>
              <div className="font-medium text-blue-900">{tier.name}</div>
              <div className="text-xs text-blue-700">{tier.points}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-blue-800">
          <div className="flex items-center space-x-2 font-medium mb-1">
            <Lightbulb className="w-4 h-4" />
            <span>Badge Benefits:</span>
          </div>
          <ul className="text-blue-700 space-y-1">
            <li>• Display badges on your profile to build customer trust</li>
            <li>• Higher search ranking for badged vendors</li>
            <li>• Exclusive access to premium features</li>
            <li>• Priority customer support</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
export default PerformanceBadges;