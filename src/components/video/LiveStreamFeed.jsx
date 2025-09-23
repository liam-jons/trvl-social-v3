import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  EyeIcon,
  PlayIcon,
  ClockIcon,
  MapPinIcon,
  HeartIcon,
  ShareIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import useVideoStreamStore from '../../stores/videoStreamStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
const LiveStreamFeed = ({ maxStreams = 4, showHeader = true, className = "" }) => {
  const [selectedStream, setSelectedStream] = useState(null);
  const [hoveredStream, setHoveredStream] = useState(null);
  const {
    activeStreams,
    fetchActiveStreams,
    isLoading
  } = useVideoStreamStore();
  // Fetch active streams on component mount
  useEffect(() => {
    fetchActiveStreams();
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchActiveStreams();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchActiveStreams]);
  // Mock live streams for demonstration
  const mockLiveStreams = [
    {
      id: 'stream_1',
      title: 'Live from Mount Everest Base Camp',
      streamerName: 'Adventure Pro Guides',
      streamerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      viewerCount: 127,
      duration: '2:15:30',
      location: 'Nepal, Himalayas',
      category: 'Mountain Climbing',
      isLive: true,
      url: '/stream/stream_1'
    },
    {
      id: 'stream_2',
      title: 'Sunset Safari in Serengeti',
      streamerName: 'Wild Africa Tours',
      streamerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop',
      viewerCount: 89,
      duration: '1:45:12',
      location: 'Tanzania, East Africa',
      category: 'Wildlife Safari',
      isLive: true,
      url: '/stream/stream_2'
    },
    {
      id: 'stream_3',
      title: 'Diving with Whale Sharks',
      streamerName: 'Ocean Explorer Co.',
      streamerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop',
      viewerCount: 203,
      duration: '0:58:45',
      location: 'Maldives',
      category: 'Scuba Diving',
      isLive: true,
      url: '/stream/stream_3'
    },
    {
      id: 'stream_4',
      title: 'Northern Lights Photography',
      streamerName: 'Arctic Adventures',
      streamerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop',
      viewerCount: 156,
      duration: '3:22:10',
      location: 'Iceland',
      category: 'Photography',
      isLive: true,
      url: '/stream/stream_4'
    }
  ];
  // Use mock data if no active streams
  const displayStreams = activeStreams.length > 0 ? activeStreams.slice(0, maxStreams) : mockLiveStreams.slice(0, maxStreams);
  // Handle stream interaction
  const handleStreamClick = (stream) => {
    setSelectedStream(stream);
  };
  // Handle like stream
  const handleLikeStream = (streamId) => {
    // In a real implementation, this would make an API call
  };
  // Handle share stream
  const handleShareStream = (stream) => {
    if (navigator.share) {
      navigator.share({
        title: stream.title,
        text: `Check out this live adventure stream: ${stream.title}`,
        url: window.location.origin + stream.url
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + stream.url);
      // Show toast notification
      const event = new CustomEvent('showNotification', {
        detail: {
          type: 'success',
          message: 'Stream link copied to clipboard!'
        }
      });
      window.dispatchEvent(event);
    }
  };
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Live Adventure Streams
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Join fellow adventurers experiencing the world in real-time
            </p>
          </div>
          <Link to="/streams">
            <GlassButton variant="ghost" className="flex items-center space-x-2">
              <span>View All</span>
              <ArrowRightIcon className="h-4 w-4" />
            </GlassButton>
          </Link>
        </div>
      )}
      {displayStreams.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <PlayIcon className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
            No Live Streams
          </h3>
          <p className="text-gray-500">
            Adventure streams will appear here when they go live
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {displayStreams.map((stream, index) => (
            <motion.div
              key={stream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredStream(stream.id)}
              onMouseLeave={() => setHoveredStream(null)}
            >
              <GlassCard className="overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105">
                <div className="relative">
                  {/* Stream Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Live Badge */}
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center space-x-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                    </div>
                    {/* Viewer Count */}
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-sm">
                        <EyeIcon className="h-4 w-4" />
                        <span>{stream.viewerCount}</span>
                      </div>
                    </div>
                    {/* Duration */}
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-sm">
                        {stream.duration}
                      </div>
                    </div>
                    {/* Play Overlay */}
                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${
                      hoveredStream === stream.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={hoveredStream === stream.id ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <GlassButton
                          onClick={() => handleStreamClick(stream)}
                          className="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                        >
                          <PlayIcon className="h-8 w-8 text-white" />
                        </GlassButton>
                      </motion.div>
                    </div>
                  </div>
                  {/* Stream Info */}
                  <div className="p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <img
                        src={stream.streamerAvatar}
                        alt={stream.streamerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                          {stream.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {stream.streamerName}
                        </p>
                      </div>
                    </div>
                    {/* Location and Category */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-3 w-3" />
                        <span className="truncate">{stream.location}</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
                        {stream.category}
                      </span>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeStream(stream.id);
                          }}
                          className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <HeartIcon className="h-4 w-4" />
                          <span className="text-xs">Like</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareStream(stream);
                          }}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <ShareIcon className="h-4 w-4" />
                          <span className="text-xs">Share</span>
                        </button>
                      </div>
                      <Link
                        to={stream.url}
                        className="text-blue-500 hover:text-blue-600 text-xs font-medium"
                      >
                        Watch
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
      {/* Featured Stream Modal (if selected) */}
      {selectedStream && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStream(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {selectedStream.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                by {selectedStream.streamerName}
              </p>
              <div className="space-y-3">
                <Link
                  to={selectedStream.url}
                  className="block w-full"
                >
                  <GlassButton className="w-full">
                    Watch Stream
                  </GlassButton>
                </Link>
                <button
                  onClick={() => setSelectedStream(null)}
                  className="w-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
export default LiveStreamFeed;