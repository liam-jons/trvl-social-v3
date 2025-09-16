import { supabase } from '../lib/supabase';
// Wishlist service for managing user's saved adventures
export class WishlistService {
  // Get all wishlist items for a user
  static async getUserWishlist(userId, options = {}) {
    try {
      let query = supabase
        .from('wishlists')
        .select(`
          *,
          adventure:adventures(*),
          collection:wishlist_collections(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (options.collectionId) {
        query = query.eq('collection_id', options.collectionId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user wishlist:', error);
      return { data: null, error };
    }
  }
  // Add adventure to wishlist
  static async addToWishlist(userId, adventureId, collectionId = null) {
    try {
      // Check if already in wishlist
      const { data: existing } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('adventure_id', adventureId)
        .single();
      if (existing) {
        return { data: existing, error: new Error('Adventure already in wishlist') };
      }
      const { data, error } = await supabase
        .from('wishlists')
        .insert([{
          user_id: userId,
          adventure_id: adventureId,
          collection_id: collectionId,
          added_at: new Date().toISOString()
        }])
        .select(`
          *,
          adventure:adventures(*),
          collection:wishlist_collections(*)
        `)
        .single();
      if (error) throw error;
      // Update user's activity log
      await this.logActivity(userId, 'wishlist_add', { adventure_id: adventureId });
      return { data, error: null };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { data: null, error };
    }
  }
  // Remove adventure from wishlist
  static async removeFromWishlist(userId, adventureId) {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('adventure_id', adventureId);
      if (error) throw error;
      // Update user's activity log
      await this.logActivity(userId, 'wishlist_remove', { adventure_id: adventureId });
      return { error: null };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { error };
    }
  }
  // Check if adventure is in user's wishlist
  static async isInWishlist(userId, adventureId) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('adventure_id', adventureId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return { isInWishlist: !!data, error: null };
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return { isInWishlist: false, error };
    }
  }
  // Move adventure to different collection
  static async moveToCollection(userId, adventureId, collectionId) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .update({ collection_id: collectionId })
        .eq('user_id', userId)
        .eq('adventure_id', adventureId)
        .select(`
          *,
          adventure:adventures(*),
          collection:wishlist_collections(*)
        `)
        .single();
      if (error) throw error;
      await this.logActivity(userId, 'wishlist_move', {
        adventure_id: adventureId,
        collection_id: collectionId
      });
      return { data, error: null };
    } catch (error) {
      console.error('Error moving to collection:', error);
      return { data: null, error };
    }
  }
  // Get user's wishlist collections
  static async getUserCollections(userId) {
    try {
      const { data, error } = await supabase
        .from('wishlist_collections')
        .select(`
          *,
          wishlists_count:wishlists(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching collections:', error);
      return { data: null, error };
    }
  }
  // Create new wishlist collection
  static async createCollection(userId, name, description = '', isPrivate = false) {
    try {
      const { data, error } = await supabase
        .from('wishlist_collections')
        .insert([{
          user_id: userId,
          name,
          description,
          is_private: isPrivate,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      if (error) throw error;
      await this.logActivity(userId, 'collection_create', { collection_id: data.id });
      return { data, error: null };
    } catch (error) {
      console.error('Error creating collection:', error);
      return { data: null, error };
    }
  }
  // Update wishlist collection
  static async updateCollection(userId, collectionId, updates) {
    try {
      const { data, error } = await supabase
        .from('wishlist_collections')
        .update(updates)
        .eq('id', collectionId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating collection:', error);
      return { data: null, error };
    }
  }
  // Delete wishlist collection
  static async deleteCollection(userId, collectionId) {
    try {
      // First, move all adventures in this collection to no collection
      await supabase
        .from('wishlists')
        .update({ collection_id: null })
        .eq('user_id', userId)
        .eq('collection_id', collectionId);
      // Then delete the collection
      const { error } = await supabase
        .from('wishlist_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', userId);
      if (error) throw error;
      await this.logActivity(userId, 'collection_delete', { collection_id: collectionId });
      return { error: null };
    } catch (error) {
      console.error('Error deleting collection:', error);
      return { error };
    }
  }
  // Get public wishlist for sharing
  static async getPublicWishlist(shareId) {
    try {
      const { data, error } = await supabase
        .from('wishlist_collections')
        .select(`
          *,
          user:profiles(id, full_name, avatar_url),
          wishlists(*,
            adventure:adventures(*)
          )
        `)
        .eq('share_id', shareId)
        .eq('is_private', false)
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching public wishlist:', error);
      return { data: null, error };
    }
  }
  // Generate share link for collection
  static async generateShareLink(userId, collectionId) {
    try {
      const shareId = `${collectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabase
        .from('wishlist_collections')
        .update({
          share_id: shareId,
          is_private: false
        })
        .eq('id', collectionId)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      const shareUrl = `${window.location.origin}/wishlist/shared/${shareId}`;
      return { data: { ...data, shareUrl }, error: null };
    } catch (error) {
      console.error('Error generating share link:', error);
      return { data: null, error };
    }
  }
  // Get wishlist statistics for user
  static async getWishlistStats(userId) {
    try {
      const { data: totalCount } = await supabase
        .from('wishlists')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      const { data: collectionsCount } = await supabase
        .from('wishlist_collections')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      const { data: recentActivity } = await supabase
        .from('wishlists')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      return {
        data: {
          totalItems: totalCount?.length || 0,
          totalCollections: collectionsCount?.length || 0,
          recentActivity: recentActivity || []
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching wishlist stats:', error);
      return { data: null, error };
    }
  }
  // Export wishlist to different formats
  static async exportWishlist(userId, format = 'json', collectionId = null) {
    try {
      let query = supabase
        .from('wishlists')
        .select(`
          *,
          adventure:adventures(*),
          collection:wishlist_collections(name)
        `)
        .eq('user_id', userId);
      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }
      const { data, error } = await query;
      if (error) throw error;
      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(data, null, 2),
            filename: `wishlist-${Date.now()}.json`,
            mimeType: 'application/json',
            error: null
          };
        case 'csv':
          const csvData = this.convertToCSV(data);
          return {
            data: csvData,
            filename: `wishlist-${Date.now()}.csv`,
            mimeType: 'text/csv',
            error: null
          };
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting wishlist:', error);
      return { data: null, error };
    }
  }
  // Helper method to convert data to CSV
  static convertToCSV(data) {
    if (!data || data.length === 0) return '';
    const headers = ['Adventure Name', 'Location', 'Price', 'Duration', 'Added Date', 'Collection'];
    const rows = data.map(item => [
      item.adventure?.title || '',
      item.adventure?.location || '',
      item.adventure?.price || '',
      item.adventure?.duration || '',
      new Date(item.created_at).toLocaleDateString(),
      item.collection?.name || 'Uncategorized'
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
  // Log user activity
  static async logActivity(userId, action, metadata = {}) {
    try {
      await supabase
        .from('user_activities')
        .insert([{
          user_id: userId,
          action,
          metadata,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
  // Price alert functionality
  static async setPriceAlert(userId, adventureId, targetPrice) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .insert([{
          user_id: userId,
          adventure_id: adventureId,
          target_price: targetPrice,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error setting price alert:', error);
      return { data: null, error };
    }
  }
  // Get user's price alerts
  static async getPriceAlerts(userId) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select(`
          *,
          adventure:adventures(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching price alerts:', error);
      return { data: null, error };
    }
  }
}
export default WishlistService;