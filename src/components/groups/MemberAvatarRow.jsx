import { useState } from 'react';
import { Mountain, ClipboardList, PartyPopper, Map, Palmtree } from 'lucide-react';

const MemberAvatarRow = ({
  members = [],
  maxVisible = 5,
  size = 'md',
  showTooltips = false,
  onMemberClick,
  className = ''
}) => {
  const [hoveredMember, setHoveredMember] = useState(null);

  const sizeConfig = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const visibleMembers = members.slice(0, maxVisible);
  const hiddenCount = Math.max(0, members.length - maxVisible);

  const getInitials = (member) => {
    if (member.name) {
      return member.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return member.email?.[0]?.toUpperCase() || 'U';
  };

  const getStatusColor = (member) => {
    if (member.is_online) return 'bg-green-500';
    if (member.last_seen && new Date() - new Date(member.last_seen) < 24 * 60 * 60 * 1000) {
      return 'bg-yellow-500';
    }
    return 'bg-gray-400';
  };

  const getMemberTooltip = (member) => {
    const personalityType = member.personality_profile?.primary_type || 'Unknown';
    const statusText = member.is_online ? 'Online' : 'Offline';
    return `${member.name || member.email} • ${personalityType} • ${statusText}`;
  };

  if (members.length === 0) {
    return (
      <div className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        No members yet
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        {visibleMembers.map((member, index) => (
          <div
            key={member.id}
            className="relative group"
            onMouseEnter={() => showTooltips && setHoveredMember(member.id)}
            onMouseLeave={() => showTooltips && setHoveredMember(null)}
            onClick={() => onMemberClick?.(member)}
          >
            {/* Avatar */}
            <div
              className={`
                ${sizeConfig[size]}
                relative rounded-full border-2 border-white dark:border-gray-800
                bg-gradient-to-br from-primary-400 to-accent-400
                flex items-center justify-center font-medium text-white
                transition-all duration-200 hover:scale-110 hover:z-10
                ${onMemberClick ? 'cursor-pointer' : ''}
                ${hoveredMember === member.id ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}
              `}
              style={{
                zIndex: visibleMembers.length - index,
                backgroundImage: member.avatar_url
                  ? `url(${member.avatar_url})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!member.avatar_url && (
                <span className="font-semibold">
                  {getInitials(member)}
                </span>
              )}
            </div>

            {/* Online status indicator */}
            {(member.is_online !== undefined || member.last_seen) && (
              <div
                className={`
                  absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2
                  border-white dark:border-gray-800 transition-colors
                  ${getStatusColor(member)}
                `}
              />
            )}

            {/* Tooltip */}
            {showTooltips && hoveredMember === member.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  {getMemberTooltip(member)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                </div>
              </div>
            )}

            {/* Personality type indicator */}
            {member.personality_profile?.primary_type && size !== 'xs' && (
              <div className="absolute -top-1 -right-1">
                <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  {member.personality_profile.primary_type === 'adventurer' && <Mountain className="w-2.5 h-2.5" />}
                  {member.personality_profile.primary_type === 'planner' && <ClipboardList className="w-2.5 h-2.5" />}
                  {member.personality_profile.primary_type === 'socializer' && <PartyPopper className="w-2.5 h-2.5" />}
                  {member.personality_profile.primary_type === 'explorer' && <Map className="w-2.5 h-2.5" />}
                  {member.personality_profile.primary_type === 'relaxer' && <Palmtree className="w-2.5 h-2.5" />}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Show remaining count */}
        {hiddenCount > 0 && (
          <div
            className={`
              ${sizeConfig[size]}
              rounded-full border-2 border-white dark:border-gray-800
              bg-gray-200 dark:bg-gray-700
              flex items-center justify-center font-medium
              text-gray-600 dark:text-gray-300
              transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-600
            `}
            style={{ zIndex: 0 }}
            title={`${hiddenCount} more member${hiddenCount !== 1 ? 's' : ''}`}
          >
            <span className="font-semibold">
              +{hiddenCount}
            </span>
          </div>
        )}
      </div>

      {/* Member count text */}
      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
        {members.length} {members.length === 1 ? 'member' : 'members'}
      </span>
    </div>
  );
};

export default MemberAvatarRow;