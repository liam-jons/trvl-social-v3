import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { vendorService } from '../services/vendor-service';

const useVendorDashboardStore = create(
  persist(
    (set, get) => ({
      // State
      vendor: null,
      dashboardStats: null,
      todaysBookings: [],
      upcomingBookings: [],
      recentActivities: [],
      adventures: [],
      analyticsData: null,
      loading: {
        vendor: false,
        stats: false,
        bookings: false,
        activities: false,
        adventures: false,
        analytics: false
      },
      error: null,
      lastUpdated: null,
      realtimeSubscription: null,

      // Actions
      setVendor: (vendor) => set({ vendor, error: null }),

      setDashboardStats: (stats) => set({
        dashboardStats: stats,
        lastUpdated: Date.now()
      }),

      setTodaysBookings: (bookings) => set({ todaysBookings: bookings }),

      setUpcomingBookings: (bookings) => set({ upcomingBookings: bookings }),

      setRecentActivities: (activities) => set({ recentActivities: activities }),

      setAdventures: (adventures) => set({ adventures }),

      setAnalyticsData: (analyticsData) => set({ analyticsData }),

      setLoading: (loadingKey, isLoading) => set((state) => ({
        loading: {
          ...state.loading,
          [loadingKey]: isLoading
        }
      })),

      setError: (error) => set({ error }),

      // Clear all data
      clearData: () => set({
        vendor: null,
        dashboardStats: null,
        todaysBookings: [],
        upcomingBookings: [],
        recentActivities: [],
        adventures: [],
        analyticsData: null,
        error: null,
        lastUpdated: null
      }),

      // Initialize vendor dashboard
      initializeDashboard: async (userId) => {
        try {
          set({ error: null });
          get().setLoading('vendor', true);

          // Get vendor profile
          const { data: vendor, error: vendorError } = await vendorService.getVendorByUserId(userId);

          if (vendorError) {
            throw new Error(vendorError.message);
          }

          if (!vendor) {
            throw new Error('Vendor profile not found. Please complete vendor registration.');
          }

          set({ vendor });

          // Load dashboard data in parallel
          await Promise.all([
            get().loadDashboardStats(vendor.id),
            get().loadRecentActivities(vendor.id),
            get().loadAdventures(vendor.id)
          ]);

          // Set up real-time subscriptions
          get().setupRealtimeSubscriptions(vendor.id);

        } catch (error) {
          console.error('Dashboard initialization error:', error);
          set({ error: error.message });
        } finally {
          get().setLoading('vendor', false);
        }
      },

      // Load dashboard statistics
      loadDashboardStats: async (vendorId) => {
        try {
          get().setLoading('stats', true);

          const { data: stats, error } = await vendorService.getDashboardStats(vendorId);

          if (error) {
            throw new Error(error);
          }

          set({
            dashboardStats: stats,
            todaysBookings: stats.todaysBookings || [],
            upcomingBookings: stats.upcomingBookings || [],
            lastUpdated: Date.now()
          });

        } catch (error) {
          console.error('Dashboard stats error:', error);
          set({ error: error.message });
        } finally {
          get().setLoading('stats', false);
        }
      },

      // Load recent activities
      loadRecentActivities: async (vendorId) => {
        try {
          get().setLoading('activities', true);

          const { data: activities, error } = await vendorService.getRecentActivities(vendorId);

          if (error) {
            throw new Error(error);
          }

          set({ recentActivities: activities || [] });

        } catch (error) {
          console.error('Recent activities error:', error);
          set({ error: error.message });
        } finally {
          get().setLoading('activities', false);
        }
      },

      // Load adventures
      loadAdventures: async (vendorId, options = {}) => {
        try {
          get().setLoading('adventures', true);

          const { data: adventures, error } = await vendorService.getVendorAdventures(vendorId, options);

          if (error) {
            throw new Error(error.message);
          }

          set({ adventures: adventures || [] });

        } catch (error) {
          console.error('Adventures loading error:', error);
          set({ error: error.message });
        } finally {
          get().setLoading('adventures', false);
        }
      },

      // Create new adventure
      createAdventure: async (adventureData) => {
        const vendor = get().vendor;
        if (!vendor) throw new Error('No vendor profile found');

        try {
          get().setLoading('adventures', true);

          const { data: newAdventure, error } = await vendorService.createAdventure(vendor.id, adventureData);

          if (error) {
            throw new Error(error.message);
          }

          // Add to local state
          const adventures = get().adventures;
          set({ adventures: [newAdventure, ...adventures] });

          return { success: true, data: newAdventure };
        } catch (error) {
          console.error('Adventure creation error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('adventures', false);
        }
      },

      // Update adventure
      updateAdventure: async (adventureId, updates) => {
        try {
          get().setLoading('adventures', true);

          const { data: updatedAdventure, error } = await vendorService.updateAdventure(adventureId, updates);

          if (error) {
            throw new Error(error.message);
          }

          // Update local state
          const adventures = get().adventures;
          const updatedAdventures = adventures.map(adventure =>
            adventure.id === adventureId ? { ...adventure, ...updatedAdventure } : adventure
          );
          set({ adventures: updatedAdventures });

          return { success: true, data: updatedAdventure };
        } catch (error) {
          console.error('Adventure update error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('adventures', false);
        }
      },

      // Delete adventure
      deleteAdventure: async (adventureId) => {
        try {
          get().setLoading('adventures', true);

          const { error } = await vendorService.deleteAdventure(adventureId);

          if (error) {
            throw new Error(error.message);
          }

          // Remove from local state
          const adventures = get().adventures;
          const filteredAdventures = adventures.filter(adventure => adventure.id !== adventureId);
          set({ adventures: filteredAdventures });

          return { success: true };
        } catch (error) {
          console.error('Adventure deletion error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('adventures', false);
        }
      },

      // Duplicate adventure
      duplicateAdventure: async (adventure) => {
        const vendor = get().vendor;
        if (!vendor) throw new Error('No vendor profile found');

        try {
          get().setLoading('adventures', true);

          // Create a copy with modified title and reset certain fields
          const duplicatedData = {
            ...adventure,
            id: undefined, // Will be generated by backend
            title: `${adventure.title} (Copy)`,
            status: 'draft',
            createdAt: undefined,
            updatedAt: undefined,
            bookings: 0,
            revenue: 0,
            rating: 0,
            reviewCount: 0
          };

          const { data: newAdventure, error } = await vendorService.createAdventure(vendor.id, duplicatedData);

          if (error) {
            throw new Error(error.message);
          }

          // Add to local state
          const adventures = get().adventures;
          set({ adventures: [newAdventure, ...adventures] });

          return { success: true, data: newAdventure };
        } catch (error) {
          console.error('Adventure duplication error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('adventures', false);
        }
      },

      // Refresh dashboard data
      refreshDashboard: async () => {
        const vendor = get().vendor;
        if (!vendor) return;

        try {
          set({ error: null });

          await Promise.all([
            get().loadDashboardStats(vendor.id),
            get().loadRecentActivities(vendor.id)
          ]);

        } catch (error) {
          console.error('Dashboard refresh error:', error);
          set({ error: error.message });
        }
      },

      // Set up real-time subscriptions
      setupRealtimeSubscriptions: (vendorId) => {
        // Clean up existing subscription
        const existingSubscription = get().realtimeSubscription;
        if (existingSubscription) {
          existingSubscription();
        }

        // Set up new subscription
        const unsubscribe = vendorService.subscribeToVendorUpdates(vendorId, {
          onBookingUpdate: (payload) => {
            console.log('Booking update received:', payload);

            // Show notification based on event type
            const eventType = payload.eventType;
            let message = '';

            switch (eventType) {
              case 'INSERT':
                message = 'New booking received!';
                break;
              case 'UPDATE':
                message = 'Booking updated';
                break;
              case 'DELETE':
                message = 'Booking cancelled';
                break;
              default:
                message = 'Booking status changed';
            }

            // Add to activities
            const newActivity = {
              id: `booking-${payload.new?.id || payload.old?.id}-${Date.now()}`,
              type: 'booking',
              title: message,
              description: `Booking ${payload.new?.id || payload.old?.id}`,
              timestamp: new Date().toISOString(),
              relatedId: payload.new?.id || payload.old?.id,
              relatedType: 'booking',
              metadata: payload.new || payload.old
            };

            set((state) => ({
              recentActivities: [newActivity, ...state.recentActivities.slice(0, 19)] // Keep only 20 most recent
            }));

            // Refresh stats after a short delay to let database updates propagate
            setTimeout(() => {
              get().refreshDashboard();
            }, 1000);
          },

          onAdventureUpdate: (payload) => {
            console.log('Adventure update received:', payload);

            // Update adventures list
            const adventures = get().adventures;
            const updatedAdventures = adventures.map(adventure => {
              if (adventure.id === payload.new?.id) {
                return { ...adventure, ...payload.new };
              }
              return adventure;
            });

            set({ adventures: updatedAdventures });
          }
        });

        set({ realtimeSubscription: unsubscribe });
      },

      // Add new activity (for manual additions)
      addActivity: (activity) => {
        const activities = get().recentActivities;
        set({
          recentActivities: [activity, ...activities.slice(0, 19)]
        });
      },

      // Update vendor profile
      updateVendorProfile: async (updates) => {
        const vendor = get().vendor;
        if (!vendor) return;

        try {
          get().setLoading('vendor', true);

          const { data: updatedVendor, error } = await vendorService.updateVendor(vendor.id, updates);

          if (error) {
            throw new Error(error.message);
          }

          set({ vendor: updatedVendor });

          return { success: true, data: updatedVendor };
        } catch (error) {
          console.error('Vendor update error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('vendor', false);
        }
      },

      // Get formatted data for charts/widgets
      getFormattedStats: () => {
        const stats = get().dashboardStats;
        if (!stats) return null;

        return {
          todayBookings: stats.todaysBookings?.length || 0,
          upcomingBookings: stats.upcomingBookings?.length || 0,
          totalAdventures: stats.totalAdventures || 0,
          activeAdventures: stats.activeAdventures || 0,
          monthlyRevenue: stats.monthlyRevenue || 0,
          monthlyBookingsCount: stats.monthlyBookingsCount || 0,
          averageBookingValue: stats.monthlyBookingsCount > 0
            ? (stats.monthlyRevenue / stats.monthlyBookingsCount).toFixed(2)
            : 0
        };
      },

      // Check if data needs refresh (older than 5 minutes)
      needsRefresh: () => {
        const lastUpdated = get().lastUpdated;
        if (!lastUpdated) return true;

        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return lastUpdated < fiveMinutesAgo;
      },

      // Fetch analytics data for charts
      fetchAnalyticsData: async (vendorId, dateRange = 30) => {
        try {
          get().setLoading('analytics', true);

          // TODO: Replace with real API call when backend is ready
          // For now, this is a placeholder that generates mock data
          const { data: analytics, error } = await vendorService.getAnalytics?.(vendorId, {
            dateRange,
            metrics: ['revenue', 'bookings', 'customers', 'demographics', 'sources']
          }) || { data: null, error: null };

          if (error) {
            throw new Error(error.message);
          }

          // If real data is not available, the component will generate mock data
          set({ analyticsData: analytics });

          return analytics;
        } catch (error) {
          console.error('Analytics data error:', error);
          set({ error: error.message });
          return null;
        } finally {
          get().setLoading('analytics', false);
        }
      },

      // Current vendor (alias for vendor for consistency)
      get currentVendor() {
        return get().vendor;
      },

      // Load current vendor (alias for backward compatibility)
      loadCurrentVendor: async () => {
        const vendor = get().vendor;
        if (vendor) {
          return vendor;
        }

        // If no vendor in state, this would require a user ID
        // This method assumes vendor data is already loaded
        throw new Error('No vendor data found. Please initialize dashboard first.');
      },

      // Bulk operations support
      bulkOperationInProgress: false,

      setBulkOperationInProgress: (inProgress) => {
        set({ bulkOperationInProgress: inProgress });
      },

      // Handle bulk operation results
      handleBulkOperationComplete: (operationType, results) => {
        // Add activity for bulk operation
        const newActivity = {
          id: `bulk-${operationType}-${Date.now()}`,
          type: 'bulk_operation',
          title: `Bulk ${operationType} completed`,
          description: `${results.successful?.length || 0} items processed successfully`,
          timestamp: new Date().toISOString(),
          relatedType: 'bulk_operation',
          metadata: {
            operationType,
            results
          }
        };

        get().addActivity(newActivity);

        // Refresh relevant data based on operation type
        const vendor = get().vendor;
        if (vendor) {
          if (operationType.includes('adventure')) {
            get().loadAdventures(vendor.id);
          }
          get().refreshDashboard();
        }
      },

      // Cleanup function
      cleanup: () => {
        const unsubscribe = get().realtimeSubscription;
        if (unsubscribe) {
          unsubscribe();
        }
        set({ realtimeSubscription: null });
        get().clearData();
      }
    }),
    {
      name: 'vendor-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not loading states or real-time subscriptions
      partialize: (state) => ({
        vendor: state.vendor,
        dashboardStats: state.dashboardStats,
        lastUpdated: state.lastUpdated
      }),
    }
  )
);

export default useVendorDashboardStore;