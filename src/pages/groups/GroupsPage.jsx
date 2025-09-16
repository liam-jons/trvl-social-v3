import { useState, useEffect, useMemo } from 'react';
import { PlusIcon, UserGroupIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import GroupPreviewCard from '../../components/groups/GroupPreviewCard';
import GlassButton from '../../components/ui/GlassButton';
import GlassInput from '../../components/ui/GlassInput';
import GlassCard from '../../components/ui/GlassCard';

const GroupsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all', // all, open, full, private
    destination: '',
    size: 'all', // all, small (2-4), medium (5-8), large (9+)
    type: 'all' // all, adventure, social, business
  });
  const [showFilters, setShowFilters] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setGroups([
          {
            id: 1,
            name: 'Bali Adventure Seekers',
            destination: 'Bali, Indonesia',
            travel_dates: 'Mar 15-25, 2024',
            type: 'adventure',
            status: 'open',
            members: [
              { id: 1, name: 'Sarah Chen', avatar: '/avatars/sarah.jpg', personality_profile: { primary_type: 'adventurer' } },
              { id: 2, name: 'Mike Johnson', avatar: '/avatars/mike.jpg', personality_profile: { primary_type: 'planner' } },
              { id: 3, name: 'Emma Davis', avatar: '/avatars/emma.jpg', personality_profile: { primary_type: 'socializer' } }
            ],
            max_members: 8,
            description: 'Join us for an epic adventure through Bali\'s hidden gems!',
            tags: ['adventure', 'nature', 'culture']
          },
          {
            id: 2,
            name: 'Tokyo Food Tour Group',
            destination: 'Tokyo, Japan',
            travel_dates: 'Apr 10-17, 2024',
            type: 'social',
            status: 'open',
            members: [
              { id: 4, name: 'Alex Kim', avatar: '/avatars/alex.jpg', personality_profile: { primary_type: 'explorer' } },
              { id: 5, name: 'Lisa Wang', avatar: '/avatars/lisa.jpg', personality_profile: { primary_type: 'socializer' } },
              { id: 6, name: 'David Park', avatar: '/avatars/david.jpg', personality_profile: { primary_type: 'relaxer' } },
              { id: 7, name: 'Jenny Liu', avatar: '/avatars/jenny.jpg', personality_profile: { primary_type: 'planner' } },
              { id: 8, name: 'Tom Wilson', avatar: '/avatars/tom.jpg', personality_profile: { primary_type: 'adventurer' } }
            ],
            max_members: 6,
            description: 'Explore Tokyo\'s incredible food scene with fellow food lovers!',
            tags: ['food', 'culture', 'social']
          },
          {
            id: 3,
            name: 'European Business Summit',
            destination: 'Amsterdam, Netherlands',
            travel_dates: 'May 5-12, 2024',
            type: 'business',
            status: 'private',
            members: [
              { id: 9, name: 'Robert Smith', avatar: '/avatars/robert.jpg', personality_profile: { primary_type: 'planner' } },
              { id: 10, name: 'Maria Garcia', avatar: '/avatars/maria.jpg', personality_profile: { primary_type: 'socializer' } }
            ],
            max_members: 10,
            description: 'Networking and business opportunities in Amsterdam.',
            tags: ['business', 'networking', 'conferences']
          },
          {
            id: 4,
            name: 'Patagonia Hiking Expedition',
            destination: 'Patagonia, Chile',
            travel_dates: 'Jun 20-Jul 5, 2024',
            type: 'adventure',
            status: 'full',
            members: Array.from({ length: 12 }, (_, i) => ({
              id: 11 + i,
              name: `Member ${i + 1}`,
              avatar: `/avatars/member${i + 1}.jpg`,
              personality_profile: { primary_type: ['adventurer', 'explorer', 'planner'][i % 3] }
            })),
            max_members: 12,
            description: 'Epic hiking adventure through Patagonia\'s stunning landscapes.',
            tags: ['hiking', 'adventure', 'nature']
          }
        ]);
        setCurrentUser({ id: 1, name: 'Current User' });
        setLoading(false);
      }, 1000);
    };

    fetchGroups();
  }, []);

  // Filter and search groups
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          group.name.toLowerCase().includes(searchLower) ||
          group.destination.toLowerCase().includes(searchLower) ||
          group.description.toLowerCase().includes(searchLower) ||
          group.tags.some(tag => tag.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedFilters.status !== 'all' && group.status !== selectedFilters.status) {
        return false;
      }

      // Destination filter
      if (selectedFilters.destination && !group.destination.toLowerCase().includes(selectedFilters.destination.toLowerCase())) {
        return false;
      }

      // Size filter
      if (selectedFilters.size !== 'all') {
        const memberCount = group.members.length;
        if (selectedFilters.size === 'small' && memberCount > 4) return false;
        if (selectedFilters.size === 'medium' && (memberCount < 5 || memberCount > 8)) return false;
        if (selectedFilters.size === 'large' && memberCount < 9) return false;
      }

      // Type filter
      if (selectedFilters.type !== 'all' && group.type !== selectedFilters.type) {
        return false;
      }

      return true;
    });
  }, [groups, searchQuery, selectedFilters]);

  const handleJoinGroup = (groupId) => {
    // Implement join group logic
    console.log('Joining group:', groupId);
  };

  const handleLeaveGroup = (groupId) => {
    // Implement leave group logic
    console.log('Leaving group:', groupId);
  };

  const handleViewDetails = (groupId) => {
    // Navigate to group detail page
    console.log('Viewing group details:', groupId);
  };

  const handleCreateGroup = () => {
    // Navigate to create group page or open modal
    console.log('Creating new group');
  };

  const clearFilters = () => {
    setSelectedFilters({
      status: 'all',
      destination: '',
      size: 'all',
      type: 'all'
    });
    setSearchQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedFilters.status !== 'all') count++;
    if (selectedFilters.destination) count++;
    if (selectedFilters.size !== 'all') count++;
    if (selectedFilters.type !== 'all') count++;
    return count;
  }, [selectedFilters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Travel Groups
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Find your perfect travel companions and join amazing adventures
            </p>
          </div>

          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleCreateGroup}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Group</span>
          </GlassButton>
        </div>

        {/* Search and Filters */}
        <GlassCard className="mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <GlassInput
                type="text"
                placeholder="Search groups by name, destination, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <GlassButton
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <FunnelIcon className="h-5 w-5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-primary-500 text-white rounded-full px-2 py-1 text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </GlassButton>

              {(activeFilterCount > 0 || searchQuery) && (
                <GlassButton
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </GlassButton>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-glass">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedFilters.status}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="all">All Groups</option>
                    <option value="open">Open</option>
                    <option value="full">Full</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destination
                  </label>
                  <GlassInput
                    type="text"
                    placeholder="Enter destination..."
                    value={selectedFilters.destination}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, destination: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Size
                  </label>
                  <select
                    value={selectedFilters.size}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="all">Any Size</option>
                    <option value="small">Small (2-4)</option>
                    <option value="medium">Medium (5-8)</option>
                    <option value="large">Large (9+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedFilters.type}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="adventure">Adventure</option>
                    <option value="social">Social</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            {loading ? 'Loading...' : `${filteredGroups.length} group${filteredGroups.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <GlassCard key={i} className="animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <GroupPreviewCard
                key={group.id}
                group={group}
                currentUser={currentUser}
                onJoinGroup={handleJoinGroup}
                onLeaveGroup={handleLeaveGroup}
                onViewDetails={handleViewDetails}
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <GlassCard className="text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No groups found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters to find more groups.'
                : 'Be the first to create a travel group!'}
            </p>
            <GlassButton
              variant="primary"
              onClick={handleCreateGroup}
              className="flex items-center space-x-2 mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create New Group</span>
            </GlassButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
