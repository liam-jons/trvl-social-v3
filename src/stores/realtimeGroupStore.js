import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useRealtimeGroupStore = create((set, get) => ({
  // State
  subscriptions: new Map(), // groupId -> subscription
  groupUpdates: new Map(), // groupId -> latest update data
  compatibilityCache: new Map(), // groupId -> compatibility scores
  optimisticUpdates: new Map(), // operationId -> optimistic state
  pendingOperations: new Set(), // Set of operation IDs
  connectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected', 'error'
  lastUpdate: null,

  // Debounce settings
  debounceTimeouts: new Map(),
  debounceDelay: 1000, // 1 second debounce

  // Connection management
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Subscribe to real-time updates for a group
  subscribeToGroup: async (groupId) => {
    const { subscriptions } = get();

    // Don't subscribe if already subscribed
    if (subscriptions.has(groupId)) {
      return;
    }

    try {
      set({ connectionStatus: 'connecting' });

      // Subscribe to group member changes
      const memberSubscription = supabase
        .channel(`group-${groupId}-members`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_members',
            filter: `group_id=eq.${groupId}`
          },
          (payload) => {
            console.log('Group member change:', payload);
            get().handleGroupMemberChange(groupId, payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'groups',
            filter: `id=eq.${groupId}`
          },
          (payload) => {
            console.log('Group update:', payload);
            get().handleGroupUpdate(groupId, payload);
          }
        )
        .subscribe((status) => {
          console.log(`Group ${groupId} subscription status:`, status);
          if (status === 'SUBSCRIBED') {
            set({ connectionStatus: 'connected' });
          } else if (status === 'CHANNEL_ERROR') {
            set({ connectionStatus: 'error' });
          }
        });

      // Store the subscription
      subscriptions.set(groupId, memberSubscription);
      set({ subscriptions: new Map(subscriptions) });

    } catch (error) {
      console.error('Failed to subscribe to group updates:', error);
      set({ connectionStatus: 'error' });
    }
  },

  // Unsubscribe from group updates
  unsubscribeFromGroup: (groupId) => {
    const { subscriptions, debounceTimeouts } = get();

    const subscription = subscriptions.get(groupId);
    if (subscription) {
      subscription.unsubscribe();
      subscriptions.delete(groupId);
      set({ subscriptions: new Map(subscriptions) });
    }

    // Clear any pending debounce timers
    const timeout = debounceTimeouts.get(groupId);
    if (timeout) {
      clearTimeout(timeout);
      debounceTimeouts.delete(groupId);
      set({ debounceTimeouts: new Map(debounceTimeouts) });
    }
  },

  // Handle group member changes
  handleGroupMemberChange: (groupId, payload) => {
    const { debounceTimeouts, debounceDelay } = get();

    // Clear existing debounce timer
    const existingTimeout = debounceTimeouts.get(groupId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new debounce timer
    const timeout = setTimeout(() => {
      get().processGroupMemberChange(groupId, payload);
      debounceTimeouts.delete(groupId);
      set({ debounceTimeouts: new Map(debounceTimeouts) });
    }, debounceDelay);

    debounceTimeouts.set(groupId, timeout);
    set({ debounceTimeouts: new Map(debounceTimeouts) });
  },

  // Process the actual group member change (after debounce)
  processGroupMemberChange: async (groupId, payload) => {
    try {
      // Recalculate compatibility scores
      await get().recalculateCompatibility(groupId);

      // Update group data
      const { groupUpdates } = get();
      groupUpdates.set(groupId, {
        type: 'member_change',
        payload,
        timestamp: Date.now()
      });

      set({
        groupUpdates: new Map(groupUpdates),
        lastUpdate: Date.now()
      });

      // Notify subscribers
      get().notifyCompatibilityChange(groupId, payload);

    } catch (error) {
      console.error('Failed to process group member change:', error);
    }
  },

  // Handle general group updates
  handleGroupUpdate: (groupId, payload) => {
    const { groupUpdates } = get();

    groupUpdates.set(groupId, {
      type: 'group_update',
      payload,
      timestamp: Date.now()
    });

    set({
      groupUpdates: new Map(groupUpdates),
      lastUpdate: Date.now()
    });
  },

  // Optimistic updates for member additions/removals
  addMemberOptimistic: (groupId, member, operationId) => {
    const { optimisticUpdates, pendingOperations } = get();

    optimisticUpdates.set(operationId, {
      type: 'add_member',
      groupId,
      member,
      timestamp: Date.now()
    });

    pendingOperations.add(operationId);

    set({
      optimisticUpdates: new Map(optimisticUpdates),
      pendingOperations: new Set(pendingOperations)
    });

    // Start optimistic compatibility calculation
    get().calculateOptimisticCompatibility(groupId, member, 'add');
  },

  removeMemberOptimistic: (groupId, memberId, operationId) => {
    const { optimisticUpdates, pendingOperations } = get();

    optimisticUpdates.set(operationId, {
      type: 'remove_member',
      groupId,
      memberId,
      timestamp: Date.now()
    });

    pendingOperations.add(operationId);

    set({
      optimisticUpdates: new Map(optimisticUpdates),
      pendingOperations: new Set(pendingOperations)
    });

    // Start optimistic compatibility calculation
    get().calculateOptimisticCompatibility(groupId, { id: memberId }, 'remove');
  },

  // Rollback optimistic update on error
  rollbackOptimisticUpdate: (operationId) => {
    const { optimisticUpdates, pendingOperations, compatibilityCache } = get();

    const update = optimisticUpdates.get(operationId);
    if (update) {
      // Rollback compatibility calculations
      const groupId = update.groupId;
      compatibilityCache.delete(`${groupId}-optimistic`);

      // Remove optimistic state
      optimisticUpdates.delete(operationId);
      pendingOperations.delete(operationId);

      set({
        optimisticUpdates: new Map(optimisticUpdates),
        pendingOperations: new Set(pendingOperations),
        compatibilityCache: new Map(compatibilityCache)
      });
    }
  },

  // Confirm optimistic update (remove from pending)
  confirmOptimisticUpdate: (operationId) => {
    const { optimisticUpdates, pendingOperations } = get();

    optimisticUpdates.delete(operationId);
    pendingOperations.delete(operationId);

    set({
      optimisticUpdates: new Map(optimisticUpdates),
      pendingOperations: new Set(pendingOperations)
    });
  },

  // Calculate optimistic compatibility scores
  calculateOptimisticCompatibility: (groupId, member, operation) => {
    const { compatibilityCache } = get();

    // This would normally call the actual compatibility service
    // For now, we'll simulate the calculation
    const baseCompatibility = compatibilityCache.get(groupId) || { avgScore: 70, pairs: [] };

    let newCompatibility;
    if (operation === 'add') {
      // Simulate adding a member increases or decreases avg compatibility
      const impact = Math.random() * 20 - 10; // -10 to +10
      newCompatibility = {
        ...baseCompatibility,
        avgScore: Math.max(0, Math.min(100, baseCompatibility.avgScore + impact)),
        optimistic: true
      };
    } else {
      // Simulate removing a member
      const impact = Math.random() * 15 - 5; // -5 to +10 (generally improves compatibility)
      newCompatibility = {
        ...baseCompatibility,
        avgScore: Math.max(0, Math.min(100, baseCompatibility.avgScore + impact)),
        optimistic: true
      };
    }

    compatibilityCache.set(`${groupId}-optimistic`, newCompatibility);
    set({ compatibilityCache: new Map(compatibilityCache) });
  },

  // Recalculate compatibility scores for a group
  recalculateCompatibility: async (groupId) => {
    try {
      // This would call the actual compatibility service
      // For now, we'll simulate the calculation
      const { compatibilityCache } = get();

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock compatibility data
      const newCompatibility = {
        avgScore: Math.random() * 40 + 50, // 50-90 range
        memberScores: new Map(),
        pairwiseScores: [],
        lastCalculated: Date.now()
      };

      compatibilityCache.set(groupId, newCompatibility);
      set({ compatibilityCache: new Map(compatibilityCache) });

      return newCompatibility;

    } catch (error) {
      console.error('Failed to recalculate compatibility:', error);
      throw error;
    }
  },

  // Get compatibility scores for a group
  getCompatibilityScores: (groupId, includeOptimistic = true) => {
    const { compatibilityCache } = get();

    if (includeOptimistic && compatibilityCache.has(`${groupId}-optimistic`)) {
      return compatibilityCache.get(`${groupId}-optimistic`);
    }

    return compatibilityCache.get(groupId);
  },

  // Notify about significant compatibility changes
  notifyCompatibilityChange: (groupId, payload) => {
    const compatibility = get().getCompatibilityScores(groupId);

    if (!compatibility) return;

    // Check if this is a significant change (>10 point swing)
    const prevCompatibility = get().compatibilityCache.get(`${groupId}-prev`);
    if (prevCompatibility) {
      const scoreDiff = Math.abs(compatibility.avgScore - prevCompatibility.avgScore);

      if (scoreDiff > 10) {
        // This would trigger a notification
        console.log(`Significant compatibility change in group ${groupId}: ${scoreDiff} points`);

        // You could emit a custom event here for components to listen to
        window.dispatchEvent(new CustomEvent('compatibilityChange', {
          detail: {
            groupId,
            oldScore: prevCompatibility.avgScore,
            newScore: compatibility.avgScore,
            change: compatibility.avgScore - prevCompatibility.avgScore
          }
        }));
      }
    }

    // Store current as previous for next comparison
    get().compatibilityCache.set(`${groupId}-prev`, { ...compatibility });
  },

  // Cleanup all subscriptions
  cleanup: () => {
    const { subscriptions, debounceTimeouts } = get();

    // Unsubscribe from all channels
    subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });

    // Clear all debounce timers
    debounceTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });

    set({
      subscriptions: new Map(),
      debounceTimeouts: new Map(),
      groupUpdates: new Map(),
      compatibilityCache: new Map(),
      optimisticUpdates: new Map(),
      pendingOperations: new Set(),
      connectionStatus: 'disconnected'
    });
  }
}));

export default useRealtimeGroupStore;