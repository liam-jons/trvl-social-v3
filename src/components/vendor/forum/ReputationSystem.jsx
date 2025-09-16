import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  Star,
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  Users,
  Trophy,
  Target,
  Calendar,
  Gift,
  Crown,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ReputationSystem = () => {
  const [userReputation, setUserReputation] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock current user reputation data
  const mockUserReputation = {
    vendor_id: '1',
    total_points: 1250,
    helpful_answers: 45,
    questions_asked: 12,
    solutions_marked: 8,
    community_contributions: 67,
    reputation_level: 'expert',
    rank: 3,
    points_to_next_level: 250,
    weekly_points: 85,
    monthly_points: 340,
    streak_days: 7,
    badge_count: 12
  };

  // Mock leaderboard data
  const mockLeaderboard = [
    {
      rank: 1,
      vendor: { id: '2', business_name: 'Adventure Guru Co', avatar: null },
      total_points: 2150,
      reputation_level: 'mentor',
      monthly_points: 450,
      specialties: ['safety', 'marketing', 'equipment']
    },
    {
      rank: 2,
      vendor: { id: '3', business_name: 'Expert Adventures', avatar: null },
      total_points: 1890,
      reputation_level: 'expert',
      monthly_points: 380,
      specialties: ['customer_service', 'pricing']
    },
    {
      rank: 3,
      vendor: { id: '1', business_name: 'My Adventure Co', avatar: null },
      total_points: 1250,
      reputation_level: 'expert',
      monthly_points: 340,
      specialties: ['marketing', 'technology']
    },
    {
      rank: 4,
      vendor: { id: '4', business_name: 'Helpful Tours', avatar: null },
      total_points: 980,
      reputation_level: 'helpful',
      monthly_points: 220,
      specialties: ['safety', 'legal_regulations']
    },
    {
      rank: 5,
      vendor: { id: '5', business_name: 'Community Builder', avatar: null },
      total_points: 750,
      reputation_level: 'contributor',
      monthly_points: 180,
      specialties: ['general_discussion']
    }
  ];

  // Mock achievements data
  const mockAchievements = [
    {
      id: 'first_answer',
      title: 'First Helper',
      description: 'Posted your first helpful answer',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      earned: true,
      earned_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      points: 10
    },
    {
      id: 'helpful_streak',
      title: 'Helpful Streak',
      description: 'Received upvotes 5 days in a row',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      earned: true,
      earned_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      points: 50
    },
    {
      id: 'solution_master',
      title: 'Solution Master',
      description: 'Had 10 answers marked as solutions',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      earned: true,
      earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      points: 100
    },
    {
      id: 'community_leader',
      title: 'Community Leader',
      description: 'Reached 1000 reputation points',
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      earned: true,
      earned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      points: 200
    },
    {
      id: 'mentor_badge',
      title: 'Mentor',
      description: 'Help 50 community members',
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      earned: false,
      progress: 45,
      total: 50,
      points: 300
    },
    {
      id: 'daily_contributor',
      title: 'Daily Contributor',
      description: 'Contribute to the forum for 30 consecutive days',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      earned: false,
      progress: 7,
      total: 30,
      points: 150
    }
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setUserReputation(mockUserReputation);
      setLeaderboard(mockLeaderboard);
      setAchievements(mockAchievements);
      setLoading(false);
    }, 500);
  }, []);

  const getReputationLevelInfo = (level) => {
    const levels = {
      newcomer: {
        name: 'Newcomer',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        minPoints: 0,
        maxPoints: 99,
        perks: ['Can ask questions', 'Can upvote answers']
      },
      contributor: {
        name: 'Contributor',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        minPoints: 100,
        maxPoints: 499,
        perks: ['Can answer questions', 'Can use tags', 'Can comment on threads']
      },
      helpful: {
        name: 'Helpful',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        minPoints: 500,
        maxPoints: 999,
        perks: ['Can mark solutions', 'Can edit own content', 'Can flag content']
      },
      expert: {
        name: 'Expert',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        minPoints: 1000,
        maxPoints: 1999,
        perks: ['Can vote to close', 'Can moderate content', 'Featured in expertise areas']
      },
      mentor: {
        name: 'Mentor',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        minPoints: 2000,
        maxPoints: null,
        perks: ['Full moderation rights', 'Can pin threads', 'Can manage community guidelines']
      }
    };
    return levels[level] || levels.newcomer;
  };

  const getPointsToNextLevel = (currentPoints, currentLevel) => {
    const levelInfo = getReputationLevelInfo(currentLevel);
    if (!levelInfo.maxPoints) return 0; // Already at highest level

    return levelInfo.maxPoints + 1 - currentPoints;
  };

  const getProgressPercentage = (currentPoints, currentLevel) => {
    const levelInfo = getReputationLevelInfo(currentLevel);
    if (!levelInfo.maxPoints) return 100; // Already at highest level

    const levelRange = levelInfo.maxPoints - levelInfo.minPoints + 1;
    const currentProgress = currentPoints - levelInfo.minPoints;
    return Math.min((currentProgress / levelRange) * 100, 100);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-12 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentLevelInfo = getReputationLevelInfo(userReputation.reputation_level);
  const progressPercentage = getProgressPercentage(userReputation.total_points, userReputation.reputation_level);
  const pointsToNext = getPointsToNextLevel(userReputation.total_points, userReputation.reputation_level);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reputation & Achievements</h1>
        <p className="text-gray-600">Track your community contributions and unlock achievements</p>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Star className="h-4 w-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Trophy className="h-4 w-4 inline mr-2" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'achievements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award className="h-4 w-4 inline mr-2" />
              Achievements
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Current Level</h3>
                      <p className={`text-2xl font-bold ${currentLevelInfo.color}`}>
                        {currentLevelInfo.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Total Points</p>
                      <p className="text-2xl font-bold">{userReputation.total_points.toLocaleString()}</p>
                    </div>
                  </div>

                  {pointsToNext > 0 && (
                    <>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm opacity-90">
                          <span>Progress to next level</span>
                          <span>{pointsToNext} points needed</span>
                        </div>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Rank</h3>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">#{userReputation.rank}</div>
                      <p className="text-gray-600">out of all vendors</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{userReputation.solutions_marked}</div>
                  <div className="text-sm text-gray-600">Solutions Marked</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <ThumbsUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{userReputation.helpful_answers}</div>
                  <div className="text-sm text-gray-600">Helpful Answers</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{userReputation.questions_asked}</div>
                  <div className="text-sm text-gray-600">Questions Asked</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{userReputation.community_contributions}</div>
                  <div className="text-sm text-gray-600">Total Contributions</div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">+{userReputation.weekly_points}</div>
                    <div className="text-sm text-gray-600">Points This Week</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">+{userReputation.monthly_points}</div>
                    <div className="text-sm text-gray-600">Points This Month</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">{userReputation.streak_days}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                </div>
              </div>

              {/* Level Perks */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Privileges</h3>
                <div className="space-y-2">
                  {currentLevelInfo.perks.map((perk, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                      <span className="text-gray-700">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Community Leaderboard</h3>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>This Month</option>
                  <option>All Time</option>
                  <option>This Week</option>
                </select>
              </div>

              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.vendor.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      entry.vendor.id === '1' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {entry.rank <= 3 ? (
                          entry.rank === 1 ? <Crown className="h-4 w-4" /> :
                          entry.rank === 2 ? <Award className="h-4 w-4" /> :
                          <Trophy className="h-4 w-4" />
                        ) : (
                          entry.rank
                        )}
                      </div>

                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {entry.vendor.business_name.charAt(0)}
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900">{entry.vendor.business_name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReputationLevelInfo(entry.reputation_level).bgColor} ${getReputationLevelInfo(entry.reputation_level).color}`}>
                            {getReputationLevelInfo(entry.reputation_level).name}
                          </span>
                          <span>•</span>
                          <span>{entry.specialties.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{entry.total_points.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">+{entry.monthly_points} this month</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
                <div className="text-sm text-gray-600">
                  {achievements.filter(a => a.earned).length} of {achievements.length} earned
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-6 rounded-lg border transition-all ${
                        achievement.earned
                          ? 'bg-white border-gray-200 shadow-sm'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-full ${achievement.bgColor}`}>
                          <IconComponent className={`h-6 w-6 ${achievement.color}`} />
                        </div>
                        {achievement.earned && (
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Earned
                          </span>
                        )}
                      </div>

                      <h4 className={`font-semibold mb-2 ${achievement.earned ? 'text-gray-900' : 'text-gray-600'}`}>
                        {achievement.title}
                      </h4>
                      <p className={`text-sm mb-4 ${achievement.earned ? 'text-gray-600' : 'text-gray-500'}`}>
                        {achievement.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${achievement.earned ? 'text-blue-600' : 'text-gray-500'}`}>
                          +{achievement.points} points
                        </span>
                        {achievement.earned ? (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(achievement.earned_at), { addSuffix: true })}
                          </span>
                        ) : achievement.progress !== undefined && (
                          <span className="text-xs text-gray-500">
                            {achievement.progress}/{achievement.total}
                          </span>
                        )}
                      </div>

                      {!achievement.earned && achievement.progress !== undefined && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReputationSystem;