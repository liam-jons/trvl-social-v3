import { useState } from 'react';
import {
  UserIcon,
  MapPinIcon,
  BoltIcon,
  UserGroupIcon,
  SparklesIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';

const PersonalityBar = ({ label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`${colorClasses[color]} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const CompatibilityIndicator = ({ score, size = 'sm' }) => {
  const getColor = (score) => {
    if (score >= 85) return 'text-green-500 bg-green-100 dark:bg-green-900/20';
    if (score >= 70) return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
    if (score >= 50) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-500 bg-red-100 dark:bg-red-900/20';
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  return (
    <div className={`${sizeClasses[size]} ${getColor(score)} rounded-full flex items-center justify-center font-bold`}>
      {score}
    </div>
  );
};

const ParticipantCard = ({
  participant,
  isDragging = false,
  compatibilityScore = null,
  showCompatibility = true,
  onClick,
  onDragStart,
  onDragEnd,
  className = '',
  variant = 'default' // default, compact, detailed
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!participant) {
    return null;
  }

  const { profile, personality } = participant;

  const getPersonalityIcon = (trait) => {
    const icons = {
      energy_level: BoltIcon,
      social_preference: UserGroupIcon,
      adventure_style: SparklesIcon,
      risk_tolerance: ShieldExclamationIcon
    };
    return icons[trait] || UserIcon;
  };

  const getPersonalityColor = (trait) => {
    const colors = {
      energy_level: 'blue',
      social_preference: 'green',
      adventure_style: 'purple',
      risk_tolerance: 'orange'
    };
    return colors[trait] || 'blue';
  };

  const getPersonalityLabel = (trait) => {
    const labels = {
      energy_level: 'Energy',
      social_preference: 'Social',
      adventure_style: 'Adventure',
      risk_tolerance: 'Risk'
    };
    return labels[trait] || trait;
  };

  const renderCompactCard = () => (
    <GlassCard
      variant="light"
      padding="sm"
      className={`
        relative cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${className}
      `}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Compatibility indicator */}
      {showCompatibility && compatibilityScore !== null && (
        <div className="absolute -top-2 -right-2 z-10">
          <CompatibilityIndicator score={compatibilityScore} size="sm" />
        </div>
      )}

      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile?.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {profile?.full_name || 'Unknown User'}
          </p>
          <div className="flex items-center mt-1">
            {profile?.location && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate max-w-20">{profile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick personality indicators */}
        {personality && (
          <div className="flex space-x-1">
            {Object.entries(personality).map(([trait, value]) => {
              if (!['energy_level', 'social_preference', 'adventure_style', 'risk_tolerance'].includes(trait)) {
                return null;
              }

              const Icon = getPersonalityIcon(trait);
              const intensity = value >= 75 ? 'high' : value >= 50 ? 'medium' : 'low';
              const opacityClass = intensity === 'high' ? 'opacity-100' : intensity === 'medium' ? 'opacity-70' : 'opacity-40';

              return (
                <Icon
                  key={trait}
                  className={`h-4 w-4 text-${getPersonalityColor(trait)}-500 ${opacityClass}`}
                  title={`${getPersonalityLabel(trait)}: ${value}%`}
                />
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );

  const renderDetailedCard = () => (
    <GlassCard
      variant="light"
      padding="md"
      className={`
        relative cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${className}
      `}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Compatibility indicator */}
      {showCompatibility && compatibilityScore !== null && (
        <div className="absolute -top-2 -right-2 z-10">
          <CompatibilityIndicator score={compatibilityScore} size="md" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile?.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {profile?.full_name || 'Unknown User'}
          </h3>
          {profile?.location && (
            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPinIcon className="h-3 w-3 mr-1" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile?.bio && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Personality traits */}
      {personality && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Personality Profile
          </h4>

          {Object.entries(personality).map(([trait, value]) => {
            if (!['energy_level', 'social_preference', 'adventure_style', 'risk_tolerance'].includes(trait)) {
              return null;
            }

            return (
              <PersonalityBar
                key={trait}
                label={getPersonalityLabel(trait)}
                value={value}
                color={getPersonalityColor(trait)}
              />
            );
          })}
        </div>
      )}

      {/* Toggle details button */}
      <button
        className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(!showDetails);
        }}
      >
        {showDetails ? 'Show Less' : 'Show More'}
      </button>

      {/* Additional details */}
      {showDetails && personality && (
        <div className="mt-3 pt-3 border-t border-gray-200/20 dark:border-gray-700/30">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Planning:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                {personality.planning_style || 'N/A'}%
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Communication:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                {personality.communication_style || 'N/A'}%
              </span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );

  return variant === 'detailed' ? renderDetailedCard() : renderCompactCard();
};

export default ParticipantCard;