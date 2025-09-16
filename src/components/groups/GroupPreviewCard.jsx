import { useState, useMemo } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import PersonalityMixVisualization from './PersonalityMixVisualization';
import MemberAvatarRow from './MemberAvatarRow';
import GroupDynamicsSummary from './GroupDynamicsSummary';
import GroupChemistryIndicators from './GroupChemistryIndicators';
import BookingConfidenceScore from './BookingConfidenceScore';
import ExpandableMemberProfiles from './ExpandableMemberProfiles';
import { CompatibilityScoreDisplay } from '../compatibility';

const GroupPreviewCard = ({
  group,
  currentUser,
  onJoinGroup,
  onLeaveGroup,
  onViewDetails,
  className = '',
  showExpandedView = false,
  onToggleExpanded
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [expandedProfiles, setExpandedProfiles] = useState(false);

  // Calculate group composition and dynamics
  const groupMetrics = useMemo(() => {
    if (!group?.members || !Array.isArray(group.members)) {
      return {
        personalityMix: {},
        totalMembers: 0,
        avgCompatibility: 0,
        confidenceScore: 0,
        dynamicsInsights: []
      };
    }

    const members = group.members;
    const personalityTypes = ['adventurer', 'planner', 'socializer', 'explorer', 'relaxer'];
    const personalityMix = personalityTypes.reduce((acc, type) => {
      acc[type] = members.filter(member =>
        member.personality_profile?.primary_type === type
      ).length;
      return acc;
    }, {});

    // Calculate average compatibility with current user
    let avgCompatibility = 0;
    if (currentUser && members.length > 0) {
      const compatibilityScores = members.map(member => {
        // This would normally come from the compatibility calculation
        return member.compatibility_with_user || Math.random() * 100;
      });
      avgCompatibility = compatibilityScores.reduce((sum, score) => sum + score, 0) / compatibilityScores.length;
    }

    // Calculate booking confidence based on group dynamics
    const confidenceScore = Math.min(100, avgCompatibility + (members.length >= 3 ? 20 : 0));

    // Generate AI insights (would normally come from AI service)
    const dynamicsInsights = [
      `${members.length} ${members.length === 1 ? 'traveler' : 'travelers'} with diverse personalities`,
      `Strong ${personalityMix.adventurer > personalityMix.planner ? 'adventure' : 'planning'} focus`,
      avgCompatibility > 80 ? 'Excellent group chemistry' : avgCompatibility > 60 ? 'Good compatibility' : 'Mixed compatibility'
    ].filter(Boolean);

    return {
      personalityMix,
      totalMembers: members.length,
      avgCompatibility,
      confidenceScore,
      dynamicsInsights
    };
  }, [group?.members, currentUser]);

  const isUserInGroup = useMemo(() => {
    return currentUser && group?.members?.some(member => member.id === currentUser.id);
  }, [currentUser, group?.members]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  if (!group) {
    return null;
  }

  return (
    <GlassCard
      className={`relative transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 ${
        isHovered ? 'scale-[1.02]' : ''
      } ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Group Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {group.name || 'Travel Group'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {group.destination || 'Destination TBD'} • {group.travel_dates || 'Dates TBD'}
          </p>
          <MemberAvatarRow
            members={group.members}
            maxVisible={5}
            size="sm"
            showTooltips={isHovered}
          />
        </div>
        <BookingConfidenceScore
          score={groupMetrics.confidenceScore}
          size="sm"
          animated={isHovered}
        />
      </div>

      {/* Personality Mix Visualization */}
      <div className="mb-4">
        <PersonalityMixVisualization
          personalityMix={groupMetrics.personalityMix}
          totalMembers={groupMetrics.totalMembers}
          compact={!showExpandedView}
        />
      </div>

      {/* Group Dynamics Summary */}
      <GroupDynamicsSummary
        insights={groupMetrics.dynamicsInsights}
        avgCompatibility={groupMetrics.avgCompatibility}
        memberCount={groupMetrics.totalMembers}
        className="mb-4"
      />

      {/* Group Chemistry Indicators */}
      <GroupChemistryIndicators
        members={group.members}
        currentUser={currentUser}
        showPairwiseCompatibility={isHovered && showExpandedView}
        className="mb-4"
      />

      {/* Expandable Member Profiles */}
      {showExpandedView && (
        <ExpandableMemberProfiles
          members={group.members}
          currentUser={currentUser}
          expanded={expandedProfiles}
          onToggleExpanded={setExpandedProfiles}
          className="mb-4"
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-glass">
        <div className="flex space-x-2">
          {isUserInGroup ? (
            <GlassButton
              variant="danger"
              size="sm"
              onClick={() => onLeaveGroup?.(group.id)}
              className="text-red-600 hover:text-red-700"
            >
              Leave Group
            </GlassButton>
          ) : (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => onJoinGroup?.(group.id)}
            >
              Join Group
            </GlassButton>
          )}

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails?.(group.id)}
          >
            View Details
          </GlassButton>
        </div>

        {onToggleExpanded && (
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpanded(!showExpandedView)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showExpandedView ? 'Show Less' : 'Show More'}
          </GlassButton>
        )}
      </div>

      {/* Hover overlay for pairwise compatibility */}
      {isHovered && showExpandedView && group.members && (
        <div className="absolute inset-0 pointer-events-none">
          {/* This would show connection lines between compatible members */}
          {/* Implementation would depend on specific design requirements */}
        </div>
      )}
    </GlassCard>
  );
};

export default GroupPreviewCard;