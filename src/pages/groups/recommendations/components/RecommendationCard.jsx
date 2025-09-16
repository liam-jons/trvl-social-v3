import React, { useState } from 'react';
import { Users, MapPin, Calendar, DollarSign, Clock, Star, Info } from 'lucide-react';

const RecommendationCard = ({
  group,
  compatibilityData,
  rankingScore,
  explanation,
  onViewDetails,
  onJoinGroup
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const compatibilityLevel = compatibilityData?.level || { level: 'fair', color: '#F59E0B', label: 'Fair Match' };
  const score = Math.round(compatibilityData?.overallScore || 50);

  const formatBudget = (budgetRange) => {
    if (!budgetRange) return 'Budget TBD';
    return `$${budgetRange.min.toLocaleString()} - $${budgetRange.max.toLocaleString()}`;
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Duration TBD';
    if (duration === 1) return '1 day';
    if (duration <= 7) return `${duration} days`;
    if (duration <= 14) return `${Math.ceil(duration / 7)} week${duration > 7 ? 's' : ''}`;
    return `${Math.ceil(duration / 7)} weeks`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCompatibilityBadgeColor = (level) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankingStars = (score) => {
    const stars = Math.round((score || 0.5) * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Group Image */}
      {group.imageUrl && (
        <div className="relative h-48 bg-gray-200">
          <img
            src={group.imageUrl}
            alt={group.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />

          {/* Compatibility Badge */}
          <div className="absolute top-3 right-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCompatibilityBadgeColor(compatibilityLevel.level)}`}>
              {score}% Match
            </div>
          </div>

          {/* Adventure Type Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium text-gray-700 capitalize">
              {group.adventureType?.replace('-', ' ') || 'Adventure'}
            </div>
          </div>
        </div>
      )}

      {/* Group Content */}
      <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {group.title}
          </h3>

          {/* Ranking Stars */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {getRankingStars(rankingScore)}
            </div>
            <span className="text-sm text-gray-500 ml-1">
              ({Math.round((rankingScore || 0.5) * 10) / 10})
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">
            {group.description}
          </p>
        </div>

        {/* Group Details */}
        <div className="space-y-2 mb-4">
          {/* Destination */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={16} className="mr-2 text-gray-400" />
            <span>{group.destination}</span>
          </div>

          {/* Members */}
          <div className="flex items-center text-sm text-gray-600">
            <Users size={16} className="mr-2 text-gray-400" />
            <span>
              {group.members?.length || 0} / {group.maxMembers || 'N/A'} members
            </span>
            {group.members?.length > 0 && (
              <div className="ml-2 flex -space-x-2">
                {group.members.slice(0, 3).map((member, index) => (
                  <div
                    key={member.userId}
                    className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-gray-600"
                    title={member.name}
                  >
                    {member.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                ))}
                {group.members.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                    +{group.members.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-2 text-gray-400" />
            <span>{formatDate(group.startDate)}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="mr-2 text-gray-400" />
            <span>{formatDuration(group.duration)}</span>
          </div>

          {/* Budget */}
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign size={16} className="mr-2 text-gray-400" />
            <span>{formatBudget(group.budgetRange)}</span>
          </div>
        </div>

        {/* Activities */}
        {group.activities && group.activities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {group.activities.slice(0, 3).map((activity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize"
                >
                  {activity.replace('-', ' ')}
                </span>
              ))}
              {group.activities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{group.activities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="mb-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Info size={16} className="mr-1" />
              Why this match?
            </button>

            {showExplanation && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Compatibility Details */}
        {compatibilityData?.memberScores && compatibilityData.memberScores.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">
              Individual compatibility:
            </div>
            <div className="flex items-center gap-2">
              {compatibilityData.memberScores.slice(0, 4).map((memberScore, index) => (
                <div
                  key={memberScore.memberId}
                  className="flex items-center text-xs"
                  title={`${memberScore.memberName}: ${Math.round(memberScore.score)}% compatibility`}
                >
                  <div className="w-3 h-3 rounded-full mr-1 border border-white"
                       style={{ backgroundColor: memberScore.level?.color || '#9CA3AF' }}>
                  </div>
                  <span className="text-gray-600">
                    {Math.round(memberScore.score)}%
                  </span>
                </div>
              ))}
              {compatibilityData.memberScores.length > 4 && (
                <span className="text-xs text-gray-500">
                  +{compatibilityData.memberScores.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {compatibilityData?.groupDynamics?.riskFactors &&
         compatibilityData.groupDynamics.riskFactors.length > 0 &&
         !compatibilityData.groupDynamics.riskFactors.includes('insufficient-data') && (
          <div className="mb-4">
            <div className="text-xs text-orange-600 font-medium mb-1">
              Considerations:
            </div>
            <div className="text-xs text-orange-700">
              {compatibilityData.groupDynamics.riskFactors
                .map(factor => factor.replace('-', ' '))
                .join(', ')}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={() => onViewDetails?.(group)}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onJoinGroup?.(group)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Join Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;