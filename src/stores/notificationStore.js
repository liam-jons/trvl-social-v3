import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import notificationService from '../services/notification-service';
import useAuthStore from './authStore';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      permission: 'default',
      preferences: {
        pushNotifications: true,
        emailNotifications: true,
        whatsappNotifications: true,
        vendorOffers: true,
        bookingUpdates: true,
        groupInvitations: true,
        marketingEmails: false,
        frequency: 'immediate'
      },

      // Actions
      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setPermission: (permission) => set({ permission }),
      setPreferences: (preferences) => set({ preferences }),

      // Initialize notification system
      initialize: async () => {
        try {
          set({ loading: true, error: null });

          // Initialize notification service
          const initialized = await notificationService.initialize();
          const permission = notificationService.permission;

          set({ permission });

          if (initialized) {
            // Load user notifications and preferences
            await get().loadNotifications();
            await get().loadPreferences();
            await get().loadUnreadCount();
          }

          return initialized;
        } catch (error) {
          console.error('Error initializing notifications:', error);
          set({ error: error.message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      // Request notification permission
      requestPermission: async () => {
        try {
          const permission = await notificationService.requestPermission();
          set({ permission });
          return permission;
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          set({ error: error.message });
          return 'denied';
        }
      },

      // Load user notifications
      loadNotifications: async (options = {}) => {
        try {
          set({ loading: true, error: null });

          const user = useAuthStore.getState().user;
          if (!user) {
            throw new Error('No authenticated user');
          }

          const { data, error } = await notificationService.getUserNotifications(
            user.id,
            options
          );

          if (error) throw error;

          set({ notifications: data || [] });
          return data;
        } catch (error) {
          console.error('Error loading notifications:', error);
          set({ error: error.message });
          return [];
        } finally {
          set({ loading: false });
        }
      },

      // Load unread count
      loadUnreadCount: async () => {
        try {
          const user = useAuthStore.getState().user;
          if (!user) return 0;

          const count = await notificationService.getUnreadCount(user.id);
          set({ unreadCount: count });
          return count;
        } catch (error) {
          console.error('Error loading unread count:', error);
          return 0;
        }
      },

      // Load user preferences
      loadPreferences: async () => {
        try {
          const user = useAuthStore.getState().user;
          if (!user) return;

          // This would fetch from user_preferences table
          // For now, keeping defaults
          const preferences = {
            pushNotifications: true,
            emailNotifications: true,
            whatsappNotifications: true,
            vendorOffers: true,
            bookingUpdates: true,
            groupInvitations: true,
            marketingEmails: false,
            frequency: 'immediate'
          };

          set({ preferences });
          return preferences;
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      },

      // Update preferences
      updatePreferences: async (newPreferences) => {
        try {
          set({ loading: true, error: null });

          const user = useAuthStore.getState().user;
          if (!user) {
            throw new Error('No authenticated user');
          }

          const success = await notificationService.updatePreferences(
            user.id,
            newPreferences
          );

          if (success) {
            const currentPreferences = get().preferences;
            const updatedPreferences = { ...currentPreferences, ...newPreferences };
            set({ preferences: updatedPreferences });
            return true;
          } else {
            throw new Error('Failed to update preferences');
          }
        } catch (error) {
          console.error('Error updating preferences:', error);
          set({ error: error.message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      // Mark notification as read
      markAsRead: async (notificationId) => {
        try {
          const success = await notificationService.markAsRead(notificationId);

          if (success) {
            const notifications = get().notifications;
            const updatedNotifications = notifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, read: true, read_at: new Date().toISOString() }
                : notification
            );

            set({ notifications: updatedNotifications });

            // Update unread count
            const unreadCount = updatedNotifications.filter(n => !n.read).length;
            set({ unreadCount });
          }

          return success;
        } catch (error) {
          console.error('Error marking notification as read:', error);
          return false;
        }
      },

      // Mark all notifications as read
      markAllAsRead: async () => {
        try {
          const notifications = get().notifications;
          const unreadNotifications = notifications.filter(n => !n.read);

          const promises = unreadNotifications.map(notification =>
            notificationService.markAsRead(notification.id)
          );

          await Promise.all(promises);

          // Update local state
          const updatedNotifications = notifications.map(notification => ({
            ...notification,
            read: true,
            read_at: new Date().toISOString()
          }));

          set({
            notifications: updatedNotifications,
            unreadCount: 0
          });

          return true;
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
          return false;
        }
      },

      // Send notification to user
      sendNotification: async (userId, notificationData) => {
        try {
          const result = await notificationService.sendNotification(userId, notificationData);

          if (result.success) {
            // Refresh notifications if it's for current user
            const currentUser = useAuthStore.getState().user;
            if (currentUser && currentUser.id === userId) {
              await get().loadNotifications();
              await get().loadUnreadCount();
            }
          }

          return result;
        } catch (error) {
          console.error('Error sending notification:', error);
          return { success: false, error: error.message };
        }
      },

      // Show local notification
      showNotification: async (title, options = {}) => {
        try {
          const notification = await notificationService.showNotification(title, options);
          return notification;
        } catch (error) {
          console.error('Error showing notification:', error);
          return null;
        }
      },

      // Clear all notifications
      clearAllNotifications: async () => {
        try {
          set({ loading: true, error: null });

          const user = useAuthStore.getState().user;
          if (!user) {
            throw new Error('No authenticated user');
          }

          const success = await notificationService.clearAllNotifications(user.id);

          if (success) {
            set({
              notifications: [],
              unreadCount: 0
            });
          }

          return success;
        } catch (error) {
          console.error('Error clearing notifications:', error);
          set({ error: error.message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      // Add new notification to store (for real-time updates)
      addNotification: (notification) => {
        const notifications = get().notifications;
        const updatedNotifications = [notification, ...notifications];
        const unreadCount = get().unreadCount + (notification.read ? 0 : 1);

        set({
          notifications: updatedNotifications,
          unreadCount
        });
      },

      // Remove notification from store
      removeNotification: (notificationId) => {
        const notifications = get().notifications;
        const notification = notifications.find(n => n.id === notificationId);
        const updatedNotifications = notifications.filter(n => n.id !== notificationId);
        const unreadCount = get().unreadCount - (notification && !notification.read ? 1 : 0);

        set({
          notifications: updatedNotifications,
          unreadCount: Math.max(0, unreadCount)
        });
      },

      // Create notification from template
      createFromTemplate: (templateType, data) => {
        return notificationService.createNotificationTemplate(templateType, data);
      },

      // Handle notification click
      handleNotificationClick: async (notification) => {
        try {
          // Mark as read
          if (!notification.read) {
            await get().markAsRead(notification.id);
          }

          // Navigate to URL if provided
          if (notification.data?.url && typeof window !== 'undefined') {
            window.location.href = notification.data.url;
          }

          return true;
        } catch (error) {
          console.error('Error handling notification click:', error);
          return false;
        }
      },

      // Cleanup on logout
      cleanup: () => {
        set({
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null,
          permission: notificationService.permission
        });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        permission: state.permission
      }),
    }
  )
);

export default useNotificationStore;