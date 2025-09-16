import { useState, useMemo } from 'react';
import { CompatibilityScoreDisplay } from '../compatibility';
import GlassButton from '../ui/GlassButton';

const ExpandableMemberProfiles = ({
  members = [],
  currentUser = null,
  expanded = false,
  onToggleExpanded,
  maxVisible = 3,
  className = ''
}) => {
  const [selectedMember, setSelectedMember] = useState(null);

  // Filter out current user from members list if present
  const otherMembers = useMemo(() => {
    return members.filter(member => !currentUser || member.id !== currentUser.id);
  }, [members, currentUser]);

  // Calculate compatibility with each member
  const membersWithCompatibility = useMemo(() => {
    return otherMembers.map(member => {
      // This would normally come from actual compatibility calculation
      const baseScore = Math.random() * 35 + 45; // 45-80 range
      const personalityBonus = currentUser &&
        member.personality_profile?.primary_type === currentUser.personality_profile?.primary_type ? 15 : 0;
      const compatibilityScore = Math.min(100, baseScore + personalityBonus);

      return {
        ...member,
        compatibilityWithUser: compatibilityScore,
        compatibilityLevel: compatibilityScore >= 75 ? 'excellent' :
          compatibilityScore >= 60 ? 'great' :
          compatibilityScore >= 45 ? 'good' : 'challenging'
      };
    }).sort((a, b) => b.compatibilityWithUser - a.compatibilityWithUser);
  }, [otherMembers, currentUser]);

  const visibleMembers = expanded ? membersWithCompatibility : membersWithCompatibility.slice(0, maxVisible);

  const getPersonalityIcon = (type) => {
    const icons = {
      adventurer: '🏔️',
      planner: '📋',
      socializer: '🎉',
      explorer: '🗺️',
      relaxer: '🌴'
    };
    return icons[type] || '👤';
  };

  const getCompatibilityColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'great': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'good': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case 'challenging': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  if (otherMembers.length === 0) {
    return (
      <div className={`text-center text-gray-500 dark:text-gray-400 py-4 ${className}`}>
        {currentUser ? 'You are the only member in this group' : 'No members to display'}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Member Profiles
        </h4>
        {membersWithCompatibility.length > maxVisible && (
          <GlassButton
            variant="ghost"
            size="xs"
            onClick={() => onToggleExpanded?.(!expanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {expanded ? 'Show Less' : `Show All ${membersWithCompatibility.length}`}
          </GlassButton>
        )}
      </div>

      {/* Member List */}
      <div className="space-y-3">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              selectedMember === member.id
                ? 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {/* Member Basic Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-medium text-sm"
                  style={{
                    backgroundImage: member.avatar_url ? `url(${member.avatar_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!member.avatar_url && (member.name?.[0] || member.email?.[0] || 'U')}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.name || member.email}
                    </h5>
                    {member.personality_profile?.primary_type && (
                      <div className="flex items-center space-x-1">
                        <span>{getPersonalityIcon(member.personality_profile.primary_type)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {member.personality_profile.primary_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Member traits/bio */}
                  {member.bio && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {member.bio}
                    </p>
                  )}

                  {/* Travel interests */}
                  {member.travel_interests && member.travel_interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.travel_interests.slice(0, 3).map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          {interest}
                        </span>
                      ))}
                      {member.travel_interests.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{member.travel_interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Compatibility with current user */}
              {currentUser && (
                <div className="flex flex-col items-end space-y-1">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityColor(member.compatibilityLevel)}`}>
                    {Math.round(member.compatibilityWithUser)}% match
                  </div>
                  <GlassButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {selectedMember === member.id ? 'Hide Details' : 'View Match'}
                  </GlassButton>
                </div>
              )}
            </div>

            {/* Expanded compatibility details */}
            {selectedMember === member.id && currentUser && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <CompatibilityScoreDisplay
                  compatibilityScore={{
                    overall_score: member.compatibilityWithUser,
                    category_scores: {
                      travel_style: Math.random() * 30 + 55,
                      energy_level: Math.random() * 30 + 50,
                      planning_style: Math.random() * 30 + 60,
                      social_preferences: Math.random() * 30 + 65,
                      budget_alignment: Math.random() * 30 + 45
                    },
                    strengths: [
                      'Similar adventure seeking level',
                      'Compatible planning styles',
                      'Aligned social preferences'
                    ].slice(0, Math.floor(Math.random() * 3) + 1),
                    challenges: [
                      'Different budget preferences',
                      'Varying energy levels',
                      'Different accommodation preferences'
                    ].slice(0, Math.floor(Math.random() * 2) + 1)
                  }}
                  user1={currentUser}
                  user2={member}
                  size="sm"
                  showBreakdownButton={false}
                  showRadarChart={true}
                />
              </div>
            )}

            {/* Quick stats */}
            {expanded && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Trips:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {member.trip_count || Math.floor(Math.random() * 10) + 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Rating:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {member.rating ? `${member.rating}⭐` : `${(Math.random() * 1.5 + 3.5).toFixed(1)}⭐`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Joined:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString()
                        : 'Recently'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Response:</span>
                    <span className={`ml-2 font-medium ${
                      member.response_rate >= 90 ? 'text-green-600 dark:text-green-400' :
                      member.response_rate >= 70 ? 'text-amber-600 dark:text-amber-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {member.response_rate ? `${member.response_rate}%` : `${Math.floor(Math.random() * 30) + 70}%`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Show remaining count */}
        {!expanded && membersWithCompatibility.length > maxVisible && (
          <div className="text-center">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpanded?.(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              View {membersWithCompatibility.length - maxVisible} more member{membersWithCompatibility.length - maxVisible !== 1 ? 's' : ''}
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableMemberProfiles;