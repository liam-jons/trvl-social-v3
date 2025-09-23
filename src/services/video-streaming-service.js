import DailyIframe from '@daily-co/daily-js';
/**
 * Video Streaming Service for Daily.co Integration
 * Handles room creation, participant management, and streaming functionality
 */
class VideoStreamingService {
  constructor() {
    this.callFrame = null;
    this.isInitialized = false;
    this.participants = new Map();
    this.streamMetrics = {
      viewerCount: 0,
      totalViews: 0,
      averageWatchTime: 0,
      engagement: 0
    };
  }
  /**
   * Initialize Daily.co call frame
   * @param {HTMLElement} container - Container element for video
   * @param {Object} config - Configuration options
   */
  async initialize(container, config = {}) {
    try {
      if (this.isInitialized) {
        return this.callFrame;
      }
      const defaultConfig = {
        showLeaveButton: false,
        showFullscreenButton: true,
        showLocalVideo: false,
        showParticipantsBar: false,
        activeSpeakerMode: true,
        theme: {
          colors: {
            accent: '#3b82f6',
            accentText: '#ffffff',
            background: '#1f2937',
            backgroundAccent: '#374151',
            baseText: '#f9fafb',
            border: '#6b7280',
            mainAreaBg: 'rgba(31, 41, 55, 0.8)',
            mainAreaBgAccent: 'rgba(55, 65, 81, 0.9)',
            mainAreaText: '#f9fafb',
            supportiveText: '#d1d5db'
          }
        },
        ...config
      };
      this.callFrame = DailyIframe.createFrame(container, defaultConfig);
      // Set up event listeners
      this.setupEventListeners();
      this.isInitialized = true;
      return this.callFrame;
    } catch (error) {
      throw new Error('Video streaming initialization failed');
    }
  }
  /**
   * Set up Daily.co event listeners
   */
  setupEventListeners() {
    if (!this.callFrame) return;
    // Participant events
    this.callFrame.on('participant-joined', (event) => {
      this.participants.set(event.participant.session_id, event.participant);
      this.updateViewerCount();
    });
    this.callFrame.on('participant-left', (event) => {
      this.participants.delete(event.participant.session_id);
      this.updateViewerCount();
    });
    this.callFrame.on('participant-updated', (event) => {
      this.participants.set(event.participant.session_id, event.participant);
    });
    // Call events
    this.callFrame.on('joined-meeting', (event) => {
    });
    this.callFrame.on('left-meeting', (event) => {
      this.cleanup();
    });
    // Stream events
    this.callFrame.on('recording-started', (event) => {
    });
    this.callFrame.on('recording-stopped', (event) => {
    });
    // Error handling
    this.callFrame.on('error', (error) => {
    });
  }
  /**
   * Create a new streaming room
   * @param {Object} roomConfig - Room configuration
   * @returns {Promise<Object>} Room data
   */
  async createRoom(roomConfig = {}) {
    try {
      const defaultRoomConfig = {
        privacy: 'public',
        properties: {
          enable_recording: 'cloud',
          enable_transcription: true,
          max_participants: 100,
          enable_chat: true,
          enable_screenshare: true,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
          ...roomConfig.properties
        }
      };
      // In a real implementation, this would make an API call to Daily.co
      // For now, we'll simulate room creation
      const room = {
        id: `room_${Date.now()}`,
        name: roomConfig.name || `Stream_${Date.now()}`,
        url: `https://your-domain.daily.co/room_${Date.now()}`,
        created_at: new Date().toISOString(),
        config: defaultRoomConfig
      };
      return room;
    } catch (error) {
      throw new Error('Room creation failed');
    }
  }
  /**
   * Join a streaming room
   * @param {string} roomUrl - Room URL to join
   * @param {Object} joinConfig - Join configuration
   */
  async joinRoom(roomUrl, joinConfig = {}) {
    try {
      if (!this.callFrame) {
        throw new Error('Call frame not initialized');
      }
      const defaultJoinConfig = {
        userName: joinConfig.userName || 'Anonymous',
        startVideoOff: joinConfig.startVideoOff || false,
        startAudioOff: joinConfig.startAudioOff || true,
        ...joinConfig
      };
      await this.callFrame.join({
        url: roomUrl,
        ...defaultJoinConfig
      });
      return this.callFrame.participants();
    } catch (error) {
      throw new Error('Failed to join stream');
    }
  }
  /**
   * Leave the current room
   */
  async leaveRoom() {
    try {
      if (this.callFrame) {
        await this.callFrame.leave();
      }
    } catch (error) {
    }
  }
  /**
   * Start broadcasting (for broadcasters)
   * @param {Object} broadcastConfig - Broadcasting configuration
   */
  async startBroadcast(broadcastConfig = {}) {
    try {
      if (!this.callFrame) {
        throw new Error('Call frame not initialized');
      }
      // Enable camera and microphone for broadcaster
      await this.callFrame.setLocalVideo(true);
      await this.callFrame.setLocalAudio(true);
      // Configure as broadcaster
      await this.callFrame.updateParticipant('local', {
        setVideo: true,
        setAudio: true,
        ...broadcastConfig
      });
      // Start recording if enabled
      if (broadcastConfig.enableRecording) {
        await this.startRecording();
      }
      return true;
    } catch (error) {
      throw new Error('Broadcast start failed');
    }
  }
  /**
   * Stop broadcasting
   */
  async stopBroadcast() {
    try {
      if (!this.callFrame) return;
      await this.callFrame.setLocalVideo(false);
      await this.callFrame.setLocalAudio(false);
      await this.stopRecording();
      return true;
    } catch (error) {
      throw new Error('Broadcast stop failed');
    }
  }
  /**
   * Start recording the stream
   */
  async startRecording() {
    try {
      if (!this.callFrame) return;
      await this.callFrame.startRecording({
        layout: {
          preset: 'default'
        }
      });
    } catch (error) {
    }
  }
  /**
   * Stop recording the stream
   */
  async stopRecording() {
    try {
      if (!this.callFrame) return;
      await this.callFrame.stopRecording();
    } catch (error) {
    }
  }
  /**
   * Toggle camera on/off
   */
  async toggleCamera() {
    try {
      if (!this.callFrame) return;
      const localParticipant = this.callFrame.participants().local;
      const currentVideoState = localParticipant?.video;
      await this.callFrame.setLocalVideo(!currentVideoState);
      return !currentVideoState;
    } catch (error) {
    }
  }
  /**
   * Toggle microphone on/off
   */
  async toggleMicrophone() {
    try {
      if (!this.callFrame) return;
      const localParticipant = this.callFrame.participants().local;
      const currentAudioState = localParticipant?.audio;
      await this.callFrame.setLocalAudio(!currentAudioState);
      return !currentAudioState;
    } catch (error) {
    }
  }
  /**
   * Update viewer count and metrics
   */
  updateViewerCount() {
    const participantCount = this.participants.size;
    this.streamMetrics.viewerCount = Math.max(0, participantCount - 1); // Subtract broadcaster
    this.streamMetrics.totalViews++;
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('streamMetricsUpdate', {
      detail: this.streamMetrics
    }));
  }
  /**
   * Get current stream metrics
   */
  getStreamMetrics() {
    return { ...this.streamMetrics };
  }
  /**
   * Get current participants
   */
  getParticipants() {
    if (!this.callFrame) return {};
    return this.callFrame.participants();
  }
  /**
   * Send chat message
   * @param {string} message - Message to send
   */
  async sendChatMessage(message) {
    try {
      if (!this.callFrame) return;
      await this.callFrame.sendAppMessage({
        type: 'chat',
        message,
        timestamp: Date.now()
      });
    } catch (error) {
    }
  }
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.callFrame) {
      this.callFrame.destroy();
      this.callFrame = null;
    }
    this.isInitialized = false;
    this.participants.clear();
    this.streamMetrics = {
      viewerCount: 0,
      totalViews: 0,
      averageWatchTime: 0,
      engagement: 0
    };
  }
}
// Export singleton instance
export default new VideoStreamingService();