import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { vendorService } from '../services/vendor-service';
import { supabase } from '../lib/supabase';
/**
 * Offer Management Store
 * Manages user-side offer management: viewing, comparing, accepting/rejecting vendor bids
 */
const useOfferManagementStore = create(
  persist(
    (set, get) => ({
      // State
      offers: [],
      tripRequests: [],
      selectedOffers: [],
      savedOffers: [],
      comparisonMode: false,
      loading: {
        offers: false,
        requests: false,
        actions: false
      },
      error: null,
      filters: {
        status: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc',
        priceRange: [0, 10000],
        dateRange: null,
        vendorRating: 0
      },
      // Actions
      setOffers: (offers) => set({ offers, error: null }),
      setTripRequests: (requests) => set({ tripRequests }),
      setError: (error) => set({ error }),
      setLoading: (key, isLoading) => set((state) => ({
        loading: {
          ...state.loading,
          [key]: isLoading
        }
      })),
      setFilters: (newFilters) => set((state) => ({
        filters: {
          ...state.filters,
          ...newFilters
        }
      })),
      // Offer selection for comparison
      toggleOfferSelection: (offerId) => set((state) => {
        const isSelected = state.selectedOffers.includes(offerId);
        return {
          selectedOffers: isSelected
            ? state.selectedOffers.filter(id => id !== offerId)
            : [...state.selectedOffers, offerId]
        };
      }),
      clearOfferSelection: () => set({ selectedOffers: [] }),
      setComparisonMode: (enabled) => set({
        comparisonMode: enabled,
        selectedOffers: enabled ? get().selectedOffers : []
      }),
      // Load user's trip requests with offers
      loadUserTripRequests: async (userId) => {
        try {
          get().setLoading('requests', true);
          get().setError(null);
          const { data, error } = await supabase
            .from('trip_requests')
            .select(`
              *,
              profiles!trip_requests_user_id_fkey(
                id,
                full_name,
                avatar_url
              ),
              vendor_bids(
                *,
                vendors!vendor_bids_vendor_id_fkey(
                  id,
                  business_name,
                  rating,
                  total_reviews,
                  avatar_url,
                  specialties,
                  certifications
                )
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (error) throw error;
          set({ tripRequests: data || [] });
          // Extract and format offers
          const allOffers = [];
          data?.forEach(request => {
            request.vendor_bids?.forEach(bid => {
              allOffers.push({
                ...bid,
                trip_request: request,
                vendor: bid.vendors,
                is_expired: new Date(bid.valid_until) < new Date(),
                days_until_expiry: Math.ceil((new Date(bid.valid_until) - new Date()) / (1000 * 60 * 60 * 24))
              });
            });
          });
          set({ offers: allOffers });
        } catch (error) {
          console.error('Load trip requests error:', error);
          get().setError(error.message);
        } finally {
          get().setLoading('requests', false);
        }
      },
      // Get filtered and sorted offers
      getFilteredOffers: () => {
        const state = get();
        let filteredOffers = [...state.offers];
        // Apply status filter
        if (state.filters.status !== 'all') {
          filteredOffers = filteredOffers.filter(offer => offer.status === state.filters.status);
        }
        // Apply price range filter
        filteredOffers = filteredOffers.filter(offer =>
          offer.proposed_price >= state.filters.priceRange[0] &&
          offer.proposed_price <= state.filters.priceRange[1]
        );
        // Apply vendor rating filter
        if (state.filters.vendorRating > 0) {
          filteredOffers = filteredOffers.filter(offer =>
            (offer.vendor?.rating || 0) >= state.filters.vendorRating
          );
        }
        // Apply date range filter
        if (state.filters.dateRange) {
          const [startDate, endDate] = state.filters.dateRange;
          filteredOffers = filteredOffers.filter(offer => {
            const offerDate = new Date(offer.created_at);
            return offerDate >= startDate && offerDate <= endDate;
          });
        }
        // Apply sorting
        filteredOffers.sort((a, b) => {
          let aValue, bValue;
          switch (state.filters.sortBy) {
            case 'price':
              aValue = a.proposed_price;
              bValue = b.proposed_price;
              break;
            case 'rating':
              aValue = a.vendor?.rating || 0;
              bValue = b.vendor?.rating || 0;
              break;
            case 'expiry':
              aValue = new Date(a.valid_until);
              bValue = new Date(b.valid_until);
              break;
            case 'created_at':
            default:
              aValue = new Date(a.created_at);
              bValue = new Date(b.created_at);
              break;
          }
          if (state.filters.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        return filteredOffers;
      },
      // Accept an offer
      acceptOffer: async (offerId, userId) => {
        try {
          get().setLoading('actions', true);
          get().setError(null);
          // Update offer status to accepted
          const { data: updatedOffer, error: updateError } = await supabase
            .from('vendor_bids')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', offerId)
            .select('*, trip_requests(*)')
            .single();
          if (updateError) throw updateError;
          // Reject all other offers for the same trip request
          const { error: rejectError } = await supabase
            .from('vendor_bids')
            .update({
              status: 'rejected',
              rejected_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('trip_request_id', updatedOffer.trip_request_id)
            .neq('id', offerId);
          if (rejectError) {
            console.warn('Error rejecting other offers:', rejectError);
          }
          // Update trip request status to accepted
          await supabase
            .from('trip_requests')
            .update({
              status: 'accepted',
              selected_vendor_id: updatedOffer.vendor_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', updatedOffer.trip_request_id);
          // Refresh offers
          await get().loadUserTripRequests(userId);
          return { success: true, data: updatedOffer };
        } catch (error) {
          console.error('Accept offer error:', error);
          get().setError(error.message);
          return { success: false, error: error.message };
        } finally {
          get().setLoading('actions', false);
        }
      },
      // Reject an offer
      rejectOffer: async (offerId, reason = null) => {
        try {
          get().setLoading('actions', true);
          get().setError(null);
          const { data, error } = await supabase
            .from('vendor_bids')
            .update({
              status: 'rejected',
              rejection_reason: reason,
              rejected_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', offerId)
            .select()
            .single();
          if (error) throw error;
          // Update local state
          set((state) => ({
            offers: state.offers.map(offer =>
              offer.id === offerId
                ? { ...offer, status: 'rejected', rejection_reason: reason, rejected_at: new Date().toISOString() }
                : offer
            )
          }));
          return { success: true, data };
        } catch (error) {
          console.error('Reject offer error:', error);
          get().setError(error.message);
          return { success: false, error: error.message };
        } finally {
          get().setLoading('actions', false);
        }
      },
      // Submit counteroffer
      submitCounteroffer: async (offerId, counterOfferData) => {
        try {
          get().setLoading('actions', true);
          get().setError(null);
          const { proposed_price, message, modifications } = counterOfferData;
          // Create counteroffer record
          const { data, error } = await supabase
            .from('counter_offers')
            .insert([{
              original_bid_id: offerId,
              proposed_price,
              message,
              modifications,
              status: 'pending',
              created_at: new Date().toISOString()
            }])
            .select()
            .single();
          if (error) throw error;
          // Update original bid status
          await supabase
            .from('vendor_bids')
            .update({
              status: 'counter_offered',
              updated_at: new Date().toISOString()
            })
            .eq('id', offerId);
          // Update local state
          set((state) => ({
            offers: state.offers.map(offer =>
              offer.id === offerId
                ? { ...offer, status: 'counter_offered', counter_offer: data }
                : offer
            )
          }));
          return { success: true, data };
        } catch (error) {
          console.error('Submit counteroffer error:', error);
          get().setError(error.message);
          return { success: false, error: error.message };
        } finally {
          get().setLoading('actions', false);
        }
      },
      // Save offer for later
      saveOfferForLater: async (offerId, userId) => {
        try {
          const { data, error } = await supabase
            .from('saved_offers')
            .upsert([{
              user_id: userId,
              offer_id: offerId,
              saved_at: new Date().toISOString()
            }], { onConflict: 'user_id,offer_id' })
            .select()
            .single();
          if (error) throw error;
          // Update local state
          set((state) => ({
            savedOffers: [...state.savedOffers.filter(s => s.offer_id !== offerId), data]
          }));
          return { success: true };
        } catch (error) {
          console.error('Save offer error:', error);
          return { success: false, error: error.message };
        }
      },
      // Load saved offers
      loadSavedOffers: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('saved_offers')
            .select(`
              *,
              vendor_bids(
                *,
                vendors!vendor_bids_vendor_id_fkey(*),
                trip_requests!vendor_bids_trip_request_id_fkey(*)
              )
            `)
            .eq('user_id', userId)
            .order('saved_at', { ascending: false });
          if (error) throw error;
          set({ savedOffers: data || [] });
        } catch (error) {
          console.error('Load saved offers error:', error);
          get().setError(error.message);
        }
      },
      // Share offer with group members
      shareOfferWithGroup: async (offerId, groupId, message = null) => {
        try {
          const { data, error } = await supabase
            .from('offer_shares')
            .insert([{
              offer_id: offerId,
              group_id: groupId,
              message,
              shared_at: new Date().toISOString()
            }])
            .select()
            .single();
          if (error) throw error;
          return { success: true, data };
        } catch (error) {
          console.error('Share offer error:', error);
          return { success: false, error: error.message };
        }
      },
      // Get offers comparison data
      getComparisonData: () => {
        const state = get();
        const selectedOfferIds = state.selectedOffers;
        const selectedOffers = state.offers.filter(offer => selectedOfferIds.includes(offer.id));
        return {
          offers: selectedOffers,
          comparison: {
            priceRange: {
              min: Math.min(...selectedOffers.map(o => o.proposed_price)),
              max: Math.max(...selectedOffers.map(o => o.proposed_price)),
              average: selectedOffers.reduce((sum, o) => sum + o.proposed_price, 0) / selectedOffers.length
            },
            ratingRange: {
              min: Math.min(...selectedOffers.map(o => o.vendor?.rating || 0)),
              max: Math.max(...selectedOffers.map(o => o.vendor?.rating || 0)),
              average: selectedOffers.reduce((sum, o) => sum + (o.vendor?.rating || 0), 0) / selectedOffers.length
            },
            expirationDays: selectedOffers.map(o => ({
              id: o.id,
              days: Math.ceil((new Date(o.valid_until) - new Date()) / (1000 * 60 * 60 * 24))
            })).sort((a, b) => a.days - b.days)
          }
        };
      },
      // Clear all data
      clearData: () => set({
        offers: [],
        tripRequests: [],
        selectedOffers: [],
        savedOffers: [],
        comparisonMode: false,
        error: null
      })
    }),
    {
      name: 'offer-management-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        filters: state.filters,
        savedOffers: state.savedOffers
      })
    }
  )
);
export default useOfferManagementStore;