import { useState } from 'react';
import {
  UsersIcon,
  PlusIcon,
  XMarkIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';
import ParticipantCard from './ParticipantCard';
const CompatibilityDisplay = ({ compatibility }) => {
  if (!compatibility || !compatibility.averageScore) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
        <ChartBarIcon className="h-4 w-4" />
        <span className="text-sm">No compatibility data</span>
      </div>
    );
  }
  const { averageScore, groupDynamics } = compatibility;
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  const getScoreIcon = (score) => {
    if (score >= 70) return CheckCircleIcon;
    if (score >= 50) return ExclamationTriangleIcon;
    return ExclamationTriangleIcon;
  };
  const Icon = getScoreIcon(averageScore);
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${getScoreColor(averageScore)}`} />
        <span className={`text-sm font-medium ${getScoreColor(averageScore)}`}>
          {averageScore}% Compatible
        </span>
      </div>
      {groupDynamics && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span>Energy:</span>
              <span className="ml-1 font-medium">
                {Math.round(groupDynamics.averageTraits?.energyLevel || 0)}%
              </span>
            </div>
            <div>
              <span>Social:</span>
              <span className="ml-1 font-medium">
                {Math.round(groupDynamics.averageTraits?.socialPreference || 0)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const GroupContainer = ({
  group,
  onParticipantRemove,
  onParticipantAdd,
  onGroupDelete,
  onGroupEdit,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCompatibilityDetails, setShowCompatibilityDetails] = useState(false);
  if (!group) return null;
  const { participants = [], maxSize = 6, compatibility = {} } = group;
  const isEmpty = participants.length === 0;
  const isFull = participants.length >= maxSize;
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver && onDragOver(group.id);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragLeave && onDragLeave();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const participantData = e.dataTransfer.getData('application/json');
    if (participantData) {
      try {
        const participant = JSON.parse(participantData);
        onDrop && onDrop(participant, group.id);
      } catch (error) {
      }
    }
  };
  return (
    <GlassCard
      variant="light"
      padding="md"
      className={`
        transition-all duration-300 min-h-48
        ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-900/20 scale-105' : ''}
        ${isFull ? 'border-green-300 dark:border-green-700' : ''}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          >
            <UsersIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {group.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {participants.length} / {maxSize} participants
              {isFull && <span className="text-green-600 dark:text-green-400 ml-2">• Full</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Compatibility indicator */}
          <button
            onClick={() => setShowCompatibilityDetails(!showCompatibilityDetails)}
            className="text-sm hover:bg-white/10 dark:hover:bg-white/5 p-2 rounded transition-colors"
          >
            <CompatibilityDisplay compatibility={compatibility} />
          </button>
          {/* Edit group button */}
          <button
            onClick={() => onGroupEdit && onGroupEdit(group)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/10 dark:hover:bg-white/5 rounded transition-colors"
            title="Edit group"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {/* Delete group button */}
          <button
            onClick={() => onGroupDelete && onGroupDelete(group.id)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white/10 dark:hover:bg-white/5 rounded transition-colors"
            title="Delete group"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Compatibility details */}
      {showCompatibilityDetails && compatibility.groupDynamics && (
        <div className="mb-4 p-3 bg-white/10 dark:bg-white/5 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Group Dynamics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {compatibility.groupDynamics.traits?.map((trait) => (
              <div key={trait.trait} className="text-center">
                <div className={`text-sm font-medium ${
                  trait.value >= 70 ? 'text-green-600 dark:text-green-400' :
                  trait.value >= 50 ? 'text-blue-600 dark:text-blue-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {trait.value}%
                </div>
                <div className="text-gray-600 dark:text-gray-400 capitalize">
                  {trait.trait.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
                <div className="text-gray-500 dark:text-gray-500">
                  {trait.level}
                </div>
              </div>
            ))}
          </div>
          {compatibility.groupDynamics.recommendations?.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Recommendations:
              </div>
              {compatibility.groupDynamics.recommendations.map((rec, index) => (
                <div key={index} className={`text-xs p-2 rounded ${
                  rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                  rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                  'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                }`}>
                  {rec.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Participants */}
      {isExpanded && (
        <div className="space-y-3">
          {participants.length > 0 ? (
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={participant.id} className="relative group">
                  <ParticipantCard
                    participant={participant}
                    variant="compact"
                    showCompatibility={false}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        ...participant,
                        fromGroupId: group.id
                      }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  />
                  {/* Remove participant button */}
                  <button
                    onClick={() => onParticipantRemove && onParticipantRemove(participant.id, group.id)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    title="Remove from group"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                No participants in this group
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Drag participants here to add them to the group
              </p>
            </div>
          )}
          {/* Add participant button */}
          {!isFull && (
            <button
              onClick={() => onParticipantAdd && onParticipantAdd(group.id)}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="text-sm">Add Participant</span>
            </button>
          )}
        </div>
      )}
      {/* Collapsed view */}
      {!isExpanded && participants.length > 0 && (
        <div className="flex items-center space-x-2">
          {participants.slice(0, 4).map((participant) => (
            <div key={participant.id} className="flex-shrink-0">
              {participant.profile?.avatar_url ? (
                <img
                  src={participant.profile.avatar_url}
                  alt={participant.profile?.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {participant.profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
          ))}
          {participants.length > 4 && (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                +{participants.length - 4}
              </span>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};
export default GroupContainer;