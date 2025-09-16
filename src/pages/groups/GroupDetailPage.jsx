import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ShareIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import MemberAvatarRow from '../../components/groups/MemberAvatarRow';
import ExpandableMemberProfiles from '../../components/groups/ExpandableMemberProfiles';
import PersonalityMixVisualization from '../../components/groups/PersonalityMixVisualization';
import GroupDynamicsSummary from '../../components/groups/GroupDynamicsSummary';
import GroupChemistryIndicators from '../../components/groups/GroupChemistryIndicators';
import BookingConfidenceScore from '../../components/groups/BookingConfidenceScore';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showExpandedMembers, setShowExpandedMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, members, activities, chat

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchGroupDetails = async () => {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        const mockGroup = {
          id: parseInt(groupId),
          name: 'Bali Adventure Seekers',
          description: 'Join us for an epic adventure through Bali\'s hidden gems! We\'ll explore ancient temples, hike through rice terraces, experience local culture, and enjoy the most beautiful beaches. This trip is perfect for adventurous spirits who want to combine cultural experiences with outdoor activities.',
          destination: 'Bali, Indonesia',
          travel_dates: 'Mar 15-25, 2024',
          type: 'adventure',
          status: 'open',
          created_at: '2024-01-15T10:00:00Z',
          created_by: {
            id: 1,
            name: 'Sarah Chen',
            avatar_url: '/avatars/sarah.jpg'
          },
          members: [
            {
              id: 1,
              name: 'Sarah Chen',
              email: 'sarah@example.com',
              avatar_url: '/avatars/sarah.jpg',
              personality_profile: { primary_type: 'adventurer' },
              bio: 'Love exploring new cultures and pushing boundaries. Always up for the next adventure!',
              travel_interests: ['adventure', 'culture', 'hiking', 'photography'],
              trip_count: 15,
              rating: 4.9,
              response_rate: 95,
              is_online: true,
              role: 'creator'
            },
            {
              id: 2,
              name: 'Mike Johnson',
              email: 'mike@example.com',
              avatar_url: '/avatars/mike.jpg',
              personality_profile: { primary_type: 'planner' },
              bio: 'Detail-oriented traveler who loves organizing amazing experiences for everyone.',
              travel_interests: ['planning', 'logistics', 'budget', 'itinerary'],
              trip_count: 8,
              rating: 4.7,
              response_rate: 88,
              is_online: false,
              last_seen: '2024-01-10T15:30:00Z',
              role: 'admin'
            },
            {
              id: 3,
              name: 'Emma Davis',
              email: 'emma@example.com',
              avatar_url: '/avatars/emma.jpg',
              personality_profile: { primary_type: 'socializer' },
              bio: 'Social butterfly who brings groups together and creates lasting friendships.',
              travel_interests: ['social', 'nightlife', 'food', 'festivals'],
              trip_count: 12,
              rating: 4.8,
              response_rate: 92,
              is_online: true,
              role: 'member'
            },
            {
              id: 4,
              name: 'Alex Kim',
              email: 'alex@example.com',
              avatar_url: '/avatars/alex.jpg',
              personality_profile: { primary_type: 'explorer' },
              bio: 'Always seeking off-the-beaten-path destinations and unique experiences.',
              travel_interests: ['exploration', 'hidden gems', 'local experiences', 'nature'],
              trip_count: 20,
              rating: 4.9,
              response_rate: 90,
              is_online: false,
              role: 'member'
            }
          ],
          max_members: 8,
          current_members: 4,
          tags: ['adventure', 'nature', 'culture', 'temples', 'beaches'],
          itinerary: [
            { day: 1, title: 'Arrival in Denpasar', description: 'Airport pickup, hotel check-in, welcome dinner' },
            { day: 2, title: 'Ubud Temple Tour', description: 'Visit ancient temples and rice terraces' },
            { day: 3, title: 'Mount Batur Sunrise Hike', description: 'Early morning hike to watch sunrise' },
            { day: 4, title: 'Cultural Workshops', description: 'Traditional cooking and batik making' },
            { day: 5, title: 'Beach Day in Canggu', description: 'Surfing lessons and beach relaxation' }
          ],
          budget: {
            total: 1200,
            breakdown: {
              accommodation: 400,
              activities: 300,
              meals: 250,
              transportation: 150,
              misc: 100
            }
          },
          requirements: [
            'Intermediate fitness level required for hiking',
            'Valid passport with 6+ months validity',
            'Travel insurance recommended',
            'Comfortable walking shoes essential'
          ],
          likes_count: 24,
          chat_message_count: 156,
          is_featured: true
        };

        setGroup(mockGroup);
        setCurrentUser({ id: 1, name: 'Current User', personality_profile: { primary_type: 'adventurer' } });
        setIsLiked(Math.random() > 0.5);
        setLoading(false);
      }, 1000);
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  // Calculate group metrics
  const groupMetrics = useMemo(() => {
    if (!group?.members) return null;

    const members = group.members;
    const personalityTypes = ['adventurer', 'planner', 'socializer', 'explorer', 'relaxer'];
    const personalityMix = personalityTypes.reduce((acc, type) => {
      acc[type] = members.filter(member =>
        member.personality_profile?.primary_type === type
      ).length;
      return acc;
    }, {});

    // Calculate average compatibility
    const avgCompatibility = 78; // Mock value
    const confidenceScore = Math.min(100, avgCompatibility + (members.length >= 3 ? 20 : 0));

    const dynamicsInsights = [
      `${members.length} travelers with diverse personalities`,
      `Strong ${personalityMix.adventurer > personalityMix.planner ? 'adventure' : 'planning'} focus`,
      avgCompatibility > 80 ? 'Excellent group chemistry' : 'Good compatibility'
    ];

    return {
      personalityMix,
      totalMembers: members.length,
      avgCompatibility,
      confidenceScore,
      dynamicsInsights
    };
  }, [group?.members]);

  const isUserInGroup = useMemo(() => {
    return currentUser && group?.members?.some(member => member.id === currentUser.id);
  }, [currentUser, group?.members]);

  const userRole = useMemo(() => {
    const member = group?.members?.find(member => member.id === currentUser?.id);
    return member?.role || null;
  }, [currentUser, group?.members]);

  const canManageGroup = userRole === 'creator' || userRole === 'admin';

  const handleJoinGroup = () => {
    console.log('Joining group:', group.id);
    // Implement join group logic
  };

  const handleLeaveGroup = () => {
    console.log('Leaving group:', group.id);
    // Implement leave group logic
  };

  const handleLikeGroup = () => {
    setIsLiked(!isLiked);
    // Implement like/unlike logic
  };

  const handleShareGroup = () => {
    // Implement share functionality
    navigator.share({
      title: group.name,
      text: group.description,
      url: window.location.href
    }).catch(() => {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <GlassCard className="animate-pulse">
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <GlassCard className="text-center py-12">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Group not found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The group you're looking for doesn't exist or has been removed.
            </p>
            <GlassButton
              variant="primary"
              onClick={() => navigate('/groups')}
              className="flex items-center space-x-2 mx-auto"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Groups</span>
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <GlassButton
            variant="ghost"
            onClick={() => navigate('/groups')}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Groups</span>
          </GlassButton>

          <div className="flex items-center space-x-3">
            <GlassButton
              variant="ghost"
              onClick={handleLikeGroup}
              className={`flex items-center space-x-2 ${isLiked ? 'text-red-600' : 'text-gray-600'}`}
            >
              {isLiked ? (
                <HeartSolidIcon className="h-5 w-5" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span>{group.likes_count}</span>
            </GlassButton>

            <GlassButton
              variant="ghost"
              onClick={handleShareGroup}
              className="flex items-center space-x-2"
            >
              <ShareIcon className="h-5 w-5" />
              <span>Share</span>
            </GlassButton>

            {canManageGroup && (
              <GlassButton
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <Cog6ToothIcon className="h-5 w-5" />
                <span>Settings</span>
              </GlassButton>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="xl:col-span-2 space-y-6">
            {/* Group Header */}
            <GlassCard>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {group.name}
                    </h1>
                    {group.is_featured && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                        <SparklesIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <MapPinIcon className="h-5 w-5" />
                      <span>{group.destination}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <CalendarDaysIcon className="h-5 w-5" />
                      <span>{group.travel_dates}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <UserGroupIcon className="h-5 w-5" />
                      <span>{group.current_members} / {group.max_members} members</span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {group.description}
                  </p>
                </div>

                <BookingConfidenceScore
                  score={groupMetrics?.confidenceScore || 0}
                  size="lg"
                  animated={true}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {group.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                {isUserInGroup ? (
                  <>
                    <GlassButton
                      variant="primary"
                      size="lg"
                      className="flex items-center space-x-2"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      <span>Open Chat ({group.chat_message_count})</span>
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      onClick={handleLeaveGroup}
                      className="flex items-center space-x-2"
                    >
                      <span>Leave Group</span>
                    </GlassButton>
                  </>
                ) : (
                  <GlassButton
                    variant="primary"
                    size="lg"
                    onClick={handleJoinGroup}
                    disabled={group.status === 'full'}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>
                      {group.status === 'full' ? 'Group Full' : 'Join Group'}
                    </span>
                  </GlassButton>
                )}
              </div>
            </GlassCard>

            {/* Navigation Tabs */}
            <GlassCard className="p-0">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'members', label: 'Members' },
                  { id: 'itinerary', label: 'Itinerary' },
                  { id: 'requirements', label: 'Requirements' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <PersonalityMixVisualization
                      personalityMix={groupMetrics?.personalityMix || {}}
                      totalMembers={groupMetrics?.totalMembers || 0}
                    />
                    <GroupDynamicsSummary
                      insights={groupMetrics?.dynamicsInsights || []}
                      avgCompatibility={groupMetrics?.avgCompatibility || 0}
                      memberCount={groupMetrics?.totalMembers || 0}
                    />
                    <GroupChemistryIndicators
                      members={group.members}
                      currentUser={currentUser}
                      showPairwiseCompatibility={true}
                    />
                  </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                  <ExpandableMemberProfiles
                    members={group.members}
                    currentUser={currentUser}
                    expanded={showExpandedMembers}
                    onToggleExpanded={setShowExpandedMembers}
                    maxVisible={10}
                  />
                )}

                {/* Itinerary Tab */}
                {activeTab === 'itinerary' && (
                  <div className="space-y-4">
                    {group.itinerary.map((item, index) => (
                      <div key={index} className="flex space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 dark:text-primary-300 font-semibold">
                            {item.day}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {item.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Requirements Tab */}
                {activeTab === 'requirements' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      What you need to know
                    </h4>
                    <ul className="space-y-3">
                      {group.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                          <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <GlassCard>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Trip Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-medium capitalize ${
                    group.status === 'open' ? 'text-green-600 dark:text-green-400' :
                    group.status === 'full' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {group.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Budget</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${group.budget.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(group.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Group Creator */}
            <GlassCard>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Group Creator
              </h3>
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-medium"
                  style={{
                    backgroundImage: group.created_by.avatar_url ? `url(${group.created_by.avatar_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!group.created_by.avatar_url && group.created_by.name[0]}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {group.created_by.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Trip organizer
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Budget Breakdown */}
            <GlassCard>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Budget Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(group.budget.breakdown).map(([category, amount]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {category}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${amount}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Members Preview */}
            <GlassCard>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Group Members
              </h3>
              <MemberAvatarRow
                members={group.members}
                maxVisible={8}
                size="md"
                showTooltips={true}
                className="mb-4"
              />
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('members')}
                className="w-full text-center"
              >
                View All Members
              </GlassButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
