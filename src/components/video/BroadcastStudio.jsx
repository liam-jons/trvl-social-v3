import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  EyeIcon,
  ClockIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import useVideoStreamStore from '../../stores/videoStreamStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../common/LoadingSpinner';
const BroadcastStudio = ({
  onStreamStart,
  onStreamEnd,
  vendorId,
  className = ""
}) => {
  const studioContainerRef = useRef(null);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [streamSettings, setStreamSettings] = useState({
    enableRecording: true,
    enableChat: true,
    maxViewers: 100,
    quality: 'high'
  });
  const {
    currentStream,
    isBroadcasting,
    isLoading,
    error,
    streamMetrics,
    streamSettings: globalStreamSettings,
    initializeStreaming,
    createStream,
    startBroadcast,
    stopBroadcast,
    toggleCamera,
    toggleMicrophone,
    clearError
  } = useVideoStreamStore();
  // Initialize studio
  useEffect(() => {
    if (studioContainerRef.current) {
      const initStudio = async () => {
        try {
          await initializeStreaming(studioContainerRef.current, {
            showLeaveButton: false,
            showFullscreenButton: false,
            showLocalVideo: true,
            showParticipantsBar: false,
            theme: {
              colors: {
                accent: '#3b82f6',
                accentText: '#ffffff',
                background: 'rgba(31, 41, 55, 0.9)',
                backgroundAccent: 'rgba(55, 65, 81, 0.9)',
                baseText: '#f9fafb',
                border: 'rgba(107, 114, 128, 0.3)',
                mainAreaBg: 'rgba(31, 41, 55, 0.8)',
                mainAreaBgAccent: 'rgba(55, 65, 81, 0.9)',
                mainAreaText: '#f9fafb',
                supportiveText: '#d1d5db'
              }
            }
          });
        } catch (error) {
        }
      };
      initStudio();
    }
  }, []);
  // Handle stream creation and start
  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      alert('Please enter a stream title');
      return;
    }
    try {
      // Create room if not exists
      if (!currentStream) {
        await createStream({
          name: streamTitle,
          description: streamDescription,
          vendorId,
          properties: {
            enable_recording: streamSettings.enableRecording,
            enable_chat: streamSettings.enableChat,
            max_participants: streamSettings.maxViewers,
            enable_screenshare: true,
            enable_knocking: false,
            start_video_off: false,
            start_audio_off: false
          }
        });
      }
      // Start broadcasting
      await startBroadcast({
        enableRecording: streamSettings.enableRecording,
        quality: streamSettings.quality
      });
      setIsPreviewMode(false);
      onStreamStart?.(currentStream);
    } catch (error) {
    }
  };
  // Handle stream stop
  const handleStopStream = async () => {
    try {
      await stopBroadcast();
      setIsPreviewMode(true);
      onStreamEnd?.(currentStream);
    } catch (error) {
    }
  };
  // Handle camera toggle
  const handleCameraToggle = async () => {
    await toggleCamera();
  };
  // Handle microphone toggle
  const handleMicrophoneToggle = async () => {
    await toggleMicrophone();
  };
  // Handle share stream
  const handleShareStream = () => {
    if (currentStream?.url) {
      navigator.clipboard.writeText(currentStream.url);
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
  if (error) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <XMarkIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Broadcast Error
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </GlassCard>
    );
  }
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stream Setup Panel */}
      {isPreviewMode && !isBroadcasting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stream Setup</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stream Title *
                </label>
                <input
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter stream title..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="Tell viewers about your adventure..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Viewers
                  </label>
                  <select
                    value={streamSettings.maxViewers}
                    onChange={(e) => setStreamSettings(prev => ({
                      ...prev,
                      maxViewers: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quality
                  </label>
                  <select
                    value={streamSettings.quality}
                    onChange={(e) => setStreamSettings(prev => ({
                      ...prev,
                      quality: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="high">High (1080p)</option>
                    <option value="medium">Medium (720p)</option>
                    <option value="low">Low (480p)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={streamSettings.enableRecording}
                    onChange={(e) => setStreamSettings(prev => ({
                      ...prev,
                      enableRecording: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Recording</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={streamSettings.enableChat}
                    onChange={(e) => setStreamSettings(prev => ({
                      ...prev,
                      enableChat: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable Chat</span>
                </label>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
      {/* Video Preview/Broadcasting Area */}
      <GlassCard className="relative overflow-hidden">
        {/* Stream Status Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
          <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            {isBroadcasting ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">LIVE</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-white text-sm font-medium">PREVIEW</span>
              </>
            )}
            {streamTitle && (
              <span className="text-white text-sm">{streamTitle}</span>
            )}
          </div>
          {isBroadcasting && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                <EyeIcon className="h-4 w-4 text-white" />
                <span className="text-white text-sm">{streamMetrics.viewerCount}</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                <ClockIcon className="h-4 w-4 text-white" />
                <span className="text-white text-sm">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Video Container */}
        <div
          ref={studioContainerRef}
          className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <LoadingSpinner />
            </div>
          )}
        </div>
        {/* Broadcasting Controls */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg px-4 py-3">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCameraToggle}
                className={`p-2 rounded-lg transition-colors ${
                  globalStreamSettings.videoEnabled
                    ? 'text-white hover:bg-white/10'
                    : 'text-red-500 bg-red-500/20'
                }`}
              >
                {globalStreamSettings.videoEnabled ? (
                  <VideoCameraIcon className="h-6 w-6" />
                ) : (
                  <VideoCameraSlashIcon className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={handleMicrophoneToggle}
                className={`p-2 rounded-lg transition-colors ${
                  globalStreamSettings.audioEnabled
                    ? 'text-white hover:bg-white/10'
                    : 'text-red-500 bg-red-500/20'
                }`}
              >
                <MicrophoneIcon className="h-6 w-6" />
              </button>
            </div>
            {/* Center Controls */}
            <div className="flex items-center space-x-3">
              {!isBroadcasting ? (
                <GlassButton
                  onClick={handleStartStream}
                  disabled={isLoading || !streamTitle.trim()}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Go Live
                </GlassButton>
              ) : (
                <GlassButton
                  onClick={handleStopStream}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <StopIcon className="h-5 w-5 mr-2" />
                  End Stream
                </GlassButton>
              )}
            </div>
            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {isBroadcasting && (
                <button
                  onClick={handleShareStream}
                  className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <ShareIcon className="h-6 w-6" />
                </button>
              )}
              <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
      {/* Stream Statistics */}
      {isBroadcasting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {streamMetrics.viewerCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Current Viewers
            </div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {streamMetrics.totalViews}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Views
            </div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              {Math.round(streamMetrics.averageWatchTime)}m
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Avg. Watch Time
            </div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">
              {Math.round(streamMetrics.engagement)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Engagement
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};
export default BroadcastStudio;