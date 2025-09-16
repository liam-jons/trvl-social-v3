import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { groupBuilderService } from '../services/group-builder-service';
const useGroupBuilderStore = create(
  persist(
    (set, get) => ({
      // State
      participants: [],
      groups: [],
      selectedAdventure: null,
      availableParticipants: [],
      currentGroup: null,
      draggedParticipant: null,
      groupConfigurations: [],
      optimizationSuggestions: [],
      loading: {
        participants: false,
        groups: false,
        optimization: false,
        saving: false
      },
      error: null,
      history: [], // For undo/redo functionality
      historyIndex: -1,
      // Actions
      setParticipants: (participants) => set({ participants, error: null }),
      setGroups: (groups) => {
        set({ groups });
        get().saveToHistory();
      },
      setSelectedAdventure: (adventure) => set({
        selectedAdventure: adventure,
        participants: [],
        groups: [],
        error: null
      }),
      setAvailableParticipants: (participants) => set({ availableParticipants: participants }),
      setCurrentGroup: (group) => set({ currentGroup: group }),
      setDraggedParticipant: (participant) => set({ draggedParticipant: participant }),
      setLoading: (loadingKey, isLoading) => set((state) => ({
        loading: {
          ...state.loading,
          [loadingKey]: isLoading
        }
      })),
      setError: (error) => set({ error }),
      // Load participants for group building
      loadParticipants: async (adventureId) => {
        try {
          get().setLoading('participants', true);
          set({ error: null });
          const { data: participants, error } = await groupBuilderService.getAdventureParticipants(
            adventureId
          );
          if (error) {
            throw new Error(error);
          }
          set({
            participants: participants || [],
            availableParticipants: participants || []
          });
          return { success: true, data: participants };
        } catch (error) {
          console.error('Load participants error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('participants', false);
        }
      },
      // Create a new group
      createGroup: (name, maxSize = 6) => {
        const groups = get().groups;
        const newGroup = {
          id: `group-${Date.now()}`,
          name: name || `Group ${groups.length + 1}`,
          participants: [],
          maxSize,
          compatibility: {
            averageScore: 0,
            pairwiseScores: [],
            groupDynamics: null
          },
          created: new Date().toISOString()
        };
        set({ groups: [...groups, newGroup] });
        get().saveToHistory();
        return newGroup;
      },
      // Add participant to group
      addParticipantToGroup: async (participantId, groupId) => {
        const { groups, availableParticipants } = get();
        const participant = availableParticipants.find(p => p.id === participantId);
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (!participant || groupIndex === -1) {
          return { success: false, error: 'Participant or group not found' };
        }
        const group = groups[groupIndex];
        // Check if group is full
        if (group.participants.length >= group.maxSize) {
          return { success: false, error: 'Group is full' };
        }
        // Check if participant is already in a group
        const isInAnyGroup = groups.some(g =>
          g.participants.some(p => p.id === participantId)
        );
        if (isInAnyGroup) {
          return { success: false, error: 'Participant is already in a group' };
        }
        // Add participant to group
        const updatedGroups = [...groups];
        updatedGroups[groupIndex] = {
          ...group,
          participants: [...group.participants, participant]
        };
        // Calculate new compatibility
        const compatibility = await groupBuilderService.calculateGroupCompatibility(
          updatedGroups[groupIndex].participants
        );
        updatedGroups[groupIndex].compatibility = compatibility;
        set({ groups: updatedGroups });
        get().saveToHistory();
        return { success: true, data: updatedGroups[groupIndex] };
      },
      // Remove participant from group
      removeParticipantFromGroup: async (participantId, groupId) => {
        const { groups } = get();
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) {
          return { success: false, error: 'Group not found' };
        }
        const group = groups[groupIndex];
        const updatedParticipants = group.participants.filter(p => p.id !== participantId);
        const updatedGroups = [...groups];
        updatedGroups[groupIndex] = {
          ...group,
          participants: updatedParticipants
        };
        // Recalculate compatibility
        if (updatedParticipants.length > 0) {
          const compatibility = await groupBuilderService.calculateGroupCompatibility(
            updatedParticipants
          );
          updatedGroups[groupIndex].compatibility = compatibility;
        } else {
          updatedGroups[groupIndex].compatibility = {
            averageScore: 0,
            pairwiseScores: [],
            groupDynamics: null
          };
        }
        set({ groups: updatedGroups });
        get().saveToHistory();
        return { success: true, data: updatedGroups[groupIndex] };
      },
      // Move participant between groups
      moveParticipant: async (participantId, fromGroupId, toGroupId) => {
        try {
          // Remove from source group
          const removeResult = await get().removeParticipantFromGroup(participantId, fromGroupId);
          if (!removeResult.success) {
            return removeResult;
          }
          // Add to destination group
          const addResult = await get().addParticipantToGroup(participantId, toGroupId);
          if (!addResult.success) {
            // Rollback: add back to original group
            await get().addParticipantToGroup(participantId, fromGroupId);
            return addResult;
          }
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      // Delete a group
      deleteGroup: (groupId) => {
        const { groups } = get();
        const updatedGroups = groups.filter(g => g.id !== groupId);
        set({ groups: updatedGroups });
        get().saveToHistory();
      },
      // Auto-generate optimal groups
      generateOptimalGroups: async (options = {}) => {
        try {
          get().setLoading('optimization', true);
          set({ error: null });
          const availableParticipants = get().availableParticipants.filter(p =>
            !get().groups.some(group =>
              group.participants.some(gp => gp.id === p.id)
            )
          );
          if (availableParticipants.length === 0) {
            throw new Error('No available participants to group');
          }
          const result = await groupBuilderService.generateOptimalGroups(
            availableParticipants,
            options
          );
          if (result.error) {
            throw new Error(result.error);
          }
          // Replace current groups with optimized ones
          set({ groups: result.groups || [] });
          get().saveToHistory();
          return { success: true, data: result };
        } catch (error) {
          console.error('Group optimization error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('optimization', false);
        }
      },
      // Save group configuration
      saveGroupConfiguration: async (name, description = '') => {
        try {
          get().setLoading('saving', true);
          const { groups, selectedAdventure } = get();
          const configData = {
            name,
            description,
            adventure_id: selectedAdventure?.id,
            vendor_id: selectedAdventure?.vendor_id,
            group_count: groups.length,
            total_participants: groups.reduce((sum, g) => sum + g.participants.length, 0),
            configuration_data: {
              groups: groups.map(g => ({
                id: g.id,
                name: g.name,
                maxSize: g.maxSize,
                participants: g.participants.map(p => ({
                  id: p.id,
                  userId: p.userId,
                  name: p.profile?.full_name
                })),
                compatibility: g.compatibility
              }))
            }
          };
          const { data, error } = await groupBuilderService.createGroupConfiguration(configData);
          if (error) {
            throw new Error(error.message);
          }
          // Update local configurations list
          const configurations = get().groupConfigurations;
          set({ groupConfigurations: [data, ...configurations] });
          return { success: true, data };
        } catch (error) {
          console.error('Save configuration error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        } finally {
          get().setLoading('saving', false);
        }
      },
      // Load saved group configurations
      loadGroupConfigurations: async (vendorId) => {
        try {
          const { data, error } = await groupBuilderService.getVendorGroupConfigurations(vendorId);
          if (error) {
            throw new Error(error.message);
          }
          set({ groupConfigurations: data || [] });
          return { success: true, data };
        } catch (error) {
          console.error('Load configurations error:', error);
          set({ error: error.message });
          return { success: false, error: error.message };
        }
      },
      // Load a saved configuration
      loadConfiguration: (configId) => {
        const { groupConfigurations } = get();
        const config = groupConfigurations.find(c => c.id === configId);
        if (!config) {
          set({ error: 'Configuration not found' });
          return;
        }
        const groups = config.configuration_data?.groups || [];
        set({ groups });
        get().saveToHistory();
      },
      // History management for undo/redo
      saveToHistory: () => {
        const { groups, history, historyIndex } = get();
        const newHistoryEntry = JSON.parse(JSON.stringify(groups));
        // Remove any history after current index (when making new changes after undo)
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newHistoryEntry);
        // Limit history to 20 entries
        if (newHistory.length > 20) {
          newHistory.shift();
        }
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1
        });
      },
      // Undo last action
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const previousState = history[newIndex];
          set({
            groups: JSON.parse(JSON.stringify(previousState)),
            historyIndex: newIndex
          });
        }
      },
      // Redo last undone action
      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const nextState = history[newIndex];
          set({
            groups: JSON.parse(JSON.stringify(nextState)),
            historyIndex: newIndex
          });
        }
      },
      // Check if undo is available
      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },
      // Check if redo is available
      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },
      // Get group statistics
      getGroupStatistics: () => {
        const { groups } = get();
        const totalParticipants = groups.reduce((sum, g) => sum + g.participants.length, 0);
        const averageGroupSize = groups.length > 0 ? totalParticipants / groups.length : 0;
        const averageCompatibility = groups.length > 0
          ? groups.reduce((sum, g) => sum + g.compatibility.averageScore, 0) / groups.length
          : 0;
        const compatibilityDistribution = {
          excellent: groups.filter(g => g.compatibility.averageScore >= 85).length,
          good: groups.filter(g => g.compatibility.averageScore >= 70 && g.compatibility.averageScore < 85).length,
          moderate: groups.filter(g => g.compatibility.averageScore >= 50 && g.compatibility.averageScore < 70).length,
          poor: groups.filter(g => g.compatibility.averageScore < 50).length
        };
        return {
          totalGroups: groups.length,
          totalParticipants,
          averageGroupSize: Math.round(averageGroupSize * 10) / 10,
          averageCompatibility: Math.round(averageCompatibility),
          compatibilityDistribution,
          emptyGroups: groups.filter(g => g.participants.length === 0).length,
          fullGroups: groups.filter(g => g.participants.length === g.maxSize).length
        };
      },
      // Clear all data
      clearAll: () => {
        set({
          participants: [],
          groups: [],
          availableParticipants: [],
          currentGroup: null,
          draggedParticipant: null,
          history: [],
          historyIndex: -1,
          error: null
        });
      },
      // Reset to initial state
      reset: () => {
        get().clearAll();
        set({
          selectedAdventure: null,
          groupConfigurations: [],
          optimizationSuggestions: []
        });
      }
    }),
    {
      name: 'group-builder-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not loading states or temporary data
      partialize: (state) => ({
        selectedAdventure: state.selectedAdventure,
        groupConfigurations: state.groupConfigurations,
        groups: state.groups,
        participants: state.participants
      }),
    }
  )
);
export default useGroupBuilderStore;