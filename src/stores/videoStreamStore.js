import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import videoStreamingService from '../services/video-streaming-service';

const useVideoStreamStore = create(
  devtools(
    (set, get) => ({
      // State
      activeStreams: [],
      currentStream: null,
      isStreaming: false,
      isBroadcasting: false,
      isLoading: false,
      error: null,
      participants: {},
      streamMetrics: {
        viewerCount: 0,
        totalViews: 0,
        averageWatchTime: 0,
        engagement: 0
      },
      streamSettings: {
        videoEnabled: true,
        audioEnabled: true,
        quality: 'auto', // auto, high, medium, low
        fullscreen: false
      },
      scheduledStreams: [],

      // Actions
      initializeStreaming: async (container, config) => {
        set({ isLoading: true, error: null });

        try {
          await videoStreamingService.initialize(container, config);

          // Set up metrics listener
          window.addEventListener('streamMetricsUpdate', (event) => {
            set({ streamMetrics: event.detail });
          });

          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      createStream: async (roomConfig) => {
        set({ isLoading: true, error: null });

        try {
          const room = await videoStreamingService.createRoom(roomConfig);

          const newStream = {
            id: room.id,
            name: room.name,
            url: room.url,
            status: 'created',
            createdAt: room.created_at,
            config: room.config,
            viewerCount: 0,
            isLive: false
          };

          set((state) => ({
            activeStreams: [...state.activeStreams, newStream],
            currentStream: newStream,
            isLoading: false
          }));

          return newStream;
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      joinStream: async (streamUrl, joinConfig) => {
        set({ isLoading: true, error: null });

        try {
          const participants = await videoStreamingService.joinRoom(streamUrl, joinConfig);

          set({
            isStreaming: true,
            participants,
            isLoading: false
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      leaveStream: async () => {
        set({ isLoading: true });

        try {
          await videoStreamingService.leaveRoom();

          set({
            isStreaming: false,
            isBroadcasting: false,
            currentStream: null,
            participants: {},
            isLoading: false
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      startBroadcast: async (broadcastConfig) => {
        set({ isLoading: true, error: null });

        try {
          await videoStreamingService.startBroadcast(broadcastConfig);

          set((state) => ({
            isBroadcasting: true,
            currentStream: state.currentStream ? {
              ...state.currentStream,
              status: 'live',
              isLive: true
            } : null,
            isLoading: false
          }));

          // Update active streams
          set((state) => ({
            activeStreams: state.activeStreams.map(stream =>
              stream.id === state.currentStream?.id
                ? { ...stream, status: 'live', isLive: true }
                : stream
            )
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      stopBroadcast: async () => {
        set({ isLoading: true });

        try {
          await videoStreamingService.stopBroadcast();

          set((state) => ({
            isBroadcasting: false,
            currentStream: state.currentStream ? {
              ...state.currentStream,
              status: 'ended',
              isLive: false
            } : null,
            isLoading: false
          }));

          // Update active streams
          set((state) => ({
            activeStreams: state.activeStreams.map(stream =>
              stream.id === state.currentStream?.id
                ? { ...stream, status: 'ended', isLive: false }
                : stream
            )
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      toggleCamera: async () => {
        try {
          const videoEnabled = await videoStreamingService.toggleCamera();
          set((state) => ({
            streamSettings: {
              ...state.streamSettings,
              videoEnabled
            }
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },

      toggleMicrophone: async () => {
        try {
          const audioEnabled = await videoStreamingService.toggleMicrophone();
          set((state) => ({
            streamSettings: {
              ...state.streamSettings,
              audioEnabled
            }
          }));
        } catch (error) {
          set({ error: error.message });
        }
      },

      updateStreamSettings: (newSettings) => {
        set((state) => ({
          streamSettings: {
            ...state.streamSettings,
            ...newSettings
          }
        }));
      },

      setFullscreen: (fullscreen) => {
        set((state) => ({
          streamSettings: {
            ...state.streamSettings,
            fullscreen
          }
        }));
      },

      setStreamQuality: (quality) => {
        set((state) => ({
          streamSettings: {
            ...state.streamSettings,
            quality
          }
        }));
      },

      addScheduledStream: (streamData) => {
        set((state) => ({
          scheduledStreams: [...state.scheduledStreams, {
            id: `scheduled_${Date.now()}`,
            ...streamData,
            status: 'scheduled'
          }]
        }));
      },

      removeScheduledStream: (streamId) => {
        set((state) => ({
          scheduledStreams: state.scheduledStreams.filter(stream => stream.id !== streamId)
        }));
      },

      updateScheduledStream: (streamId, updateData) => {
        set((state) => ({
          scheduledStreams: state.scheduledStreams.map(stream =>
            stream.id === streamId
              ? { ...stream, ...updateData }
              : stream
          )
        }));
      },

      fetchActiveStreams: async () => {
        set({ isLoading: true });

        try {
          // In a real implementation, this would fetch from your backend
          // For now, we'll simulate with existing data
          const streams = get().activeStreams.filter(stream => stream.isLive);

          set({ activeStreams: streams, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      updateStreamMetrics: (metrics) => {
        set({ streamMetrics: metrics });
      },

      sendChatMessage: async (message) => {
        try {
          await videoStreamingService.sendChatMessage(message);
        } catch (error) {
          set({ error: error.message });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      cleanup: () => {
        videoStreamingService.cleanup();

        set({
          activeStreams: [],
          currentStream: null,
          isStreaming: false,
          isBroadcasting: false,
          isLoading: false,
          error: null,
          participants: {},
          streamMetrics: {
            viewerCount: 0,
            totalViews: 0,
            averageWatchTime: 0,
            engagement: 0
          },
          streamSettings: {
            videoEnabled: true,
            audioEnabled: true,
            quality: 'auto',
            fullscreen: false
          }
        });
      }
    }),
    {
      name: 'video-stream-store',
      partialize: (state) => ({
        streamSettings: state.streamSettings,
        scheduledStreams: state.scheduledStreams
      })
    }
  )
);

export default useVideoStreamStore;