import { useEffect, useRef, useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  ChatBubbleLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import useVideoStreamStore from '../../stores/videoStreamStore';
import GlassCard from '../ui/GlassCard';
const VideoStreamPlayer = ({
  streamUrl,
  streamTitle = "Live Adventure Stream",
  streamerName = "Adventure Guide",
  showControls = true,
  autoplay = true,
  className = ""
}) => {
  const videoContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const {
    isStreaming,
    isLoading,
    error,
    streamMetrics,
    streamSettings,
    initializeStreaming,
    joinStream,
    leaveStream,
    setFullscreen,
    setStreamQuality,
    updateStreamSettings,
    sendChatMessage,
    clearError
  } = useVideoStreamStore();
  // Initialize video streaming
  useEffect(() => {
    if (videoContainerRef.current && streamUrl) {
      const initVideo = async () => {
        try {
          await initializeStreaming(videoContainerRef.current, {
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
          if (autoplay) {
            await joinStream(streamUrl, {
              userName: 'Viewer',
              startVideoOff: true,
              startAudioOff: false
            });
          }
        } catch (error) {
        }
      };
      initVideo();
    }
    return () => {
      leaveStream();
    };
  }, [streamUrl]);
  // Handle play/pause
  const handlePlayPause = async () => {
    if (isPlaying && isStreaming) {
      await leaveStream();
      setIsPlaying(false);
    } else if (!isStreaming) {
      await joinStream(streamUrl, {
        userName: 'Viewer',
        startVideoOff: true,
        startAudioOff: false
      });
      setIsPlaying(true);
    }
  };
  // Handle volume control
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(0.5);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };
  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    const newFullscreen = !streamSettings.fullscreen;
    setFullscreen(newFullscreen);
    if (newFullscreen) {
      videoContainerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };
  // Handle quality change
  const handleQualityChange = (quality) => {
    setStreamQuality(quality);
    setShowSettings(false);
  };
  // Handle chat message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      await sendChatMessage(chatMessage);
      setChatMessage('');
    }
  };
  if (error) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Stream Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard className={`relative overflow-hidden ${className}`}>
      {/* Stream Info Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
        <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">LIVE</span>
          </div>
          <div className="text-white">
            <div className="font-semibold text-sm">{streamTitle}</div>
            <div className="text-xs text-gray-300">{streamerName}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <EyeIcon className="h-4 w-4 text-white" />
          <span className="text-white text-sm">{streamMetrics.viewerCount}</span>
        </div>
      </div>
      {/* Video Container */}
      <div
        ref={videoContainerRef}
        className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg px-4 py-3">
            {/* Play/Pause and Volume */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-blue-400 transition-colors"
                disabled={isLoading}
              >
                {isPlaying && isStreaming ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={handleMuteToggle}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? (
                  <SpeakerXMarkIcon className="h-6 w-6" />
                ) : (
                  <SpeakerWaveIcon className="h-6 w-6" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-blue-500"
              />
            </div>
            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Chat Toggle */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`text-white hover:text-blue-400 transition-colors ${showChat ? 'text-blue-400' : ''}`}
              >
                <ChatBubbleLeftIcon className="h-6 w-6" />
              </button>
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`text-white hover:text-blue-400 transition-colors ${showSettings ? 'text-blue-400' : ''}`}
              >
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
              {/* Fullscreen */}
              <button
                onClick={handleFullscreenToggle}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {streamSettings.fullscreen ? (
                  <ArrowsPointingInIcon className="h-6 w-6" />
                ) : (
                  <ArrowsPointingOutIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Settings Menu */}
      {showSettings && (
        <div className="absolute bottom-20 right-4 z-20">
          <GlassCard className="p-4 min-w-[200px]">
            <h4 className="font-semibold mb-3">Quality Settings</h4>
            <div className="space-y-2">
              {['auto', 'high', 'medium', 'low'].map((quality) => (
                <button
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    streamSettings.quality === quality
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
      {/* Chat Panel */}
      {showChat && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-black/50 backdrop-blur-sm border-l border-gray-600">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-white font-semibold">Live Chat</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {/* Chat messages would be rendered here */}
                <div className="text-gray-300 text-sm text-center">
                  Welcome to the live chat!
                </div>
              </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-600">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
export default VideoStreamPlayer;