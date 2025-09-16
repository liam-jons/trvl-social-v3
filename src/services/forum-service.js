import sentryService from './sentry-service.js';
import { supabase } from '../config/supabase';

class ForumService {
  // Thread operations
  async getThreads(options = {}) {
    try {
      const {
        category = null,
        searchQuery = null,
        sortBy = 'last_reply_at',
        sortOrder = 'desc',
        limit = 20,
        offset = 0
      } = options;

      let query = supabase
        .from('vendor_forum_threads')
        .select(`
          id,
          title,
          content,
          category,
          tags,
          is_pinned,
          is_locked,
          is_moderated,
          view_count,
          upvotes,
          downvotes,
          reply_count,
          last_reply_at,
          created_at,
          vendor:vendors!vendor_id (
            id,
            business_name,
            reputation:vendor_forum_reputation (
              reputation_level,
              total_points
            )
          ),
          last_reply_vendor:vendors!last_reply_vendor_id (
            id,
            business_name
          )
        `)
        .eq('is_moderated', false);

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pinned threads first
      if (sortBy !== 'is_pinned') {
        query = query.order('is_pinned', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      return { threads: data, error: null };
    } catch (error) {
      // console.error('Error fetching threads:', error);
      return { threads: [], error: error.message };
    }
  }

  async getThread(threadId) {
    try {
      const { data, error } = await supabase
        .from('vendor_forum_threads')
        .select(`
          id,
          title,
          content,
          category,
          tags,
          is_pinned,
          is_locked,
          is_moderated,
          view_count,
          upvotes,
          downvotes,
          reply_count,
          created_at,
          vendor:vendors!vendor_id (
            id,
            business_name,
            reputation:vendor_forum_reputation (
              reputation_level,
              total_points
            )
          )
        `)
        .eq('id', threadId)
        .single();

      if (error) throw error;

      // Increment view count
      await this.incrementViewCount(threadId);

      return { thread: data, error: null };
    } catch (error) {
      // console.error('Error fetching thread:', error);
      return { thread: null, error: error.message };
    }
  }

  async createThread(threadData) {
    try {
      const { data, error } = await supabase
        .from('vendor_forum_threads')
        .insert([threadData])
        .select()
        .single();

      if (error) throw error;

      return { thread: data, error: null };
    } catch (error) {
      // console.error('Error creating thread:', error);
      return { thread: null, error: error.message };
    }
  }

  async incrementViewCount(threadId) {
    try {
      const { error } = await supabase
        .from('vendor_forum_threads')
        .update({ view_count: supabase.raw('view_count + 1') })
        .eq('id', threadId);

      if (error) throw error;
    } catch (error) {
      // console.error('Error incrementing view count:', error);
    }
  }

  // Reply operations
  async getReplies(threadId) {
    try {
      const { data, error } = await supabase
        .from('vendor_forum_replies')
        .select(`
          id,
          content,
          upvotes,
          downvotes,
          is_solution,
          created_at,
          parent_reply_id,
          vendor:vendors!vendor_id (
            id,
            business_name,
            reputation:vendor_forum_reputation (
              reputation_level,
              total_points
            )
          )
        `)
        .eq('thread_id', threadId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { replies: data, error: null };
    } catch (error) {
      // console.error('Error fetching replies:', error);
      return { replies: [], error: error.message };
    }
  }

  async createReply(replyData) {
    try {
      const { data, error } = await supabase
        .from('vendor_forum_replies')
        .insert([replyData])
        .select()
        .single();

      if (error) throw error;

      return { reply: data, error: null };
    } catch (error) {
      // console.error('Error creating reply:', error);
      return { reply: null, error: error.message };
    }
  }

  async markSolution(replyId, threadId) {
    try {
      // First, unmark any existing solutions for this thread
      await supabase
        .from('vendor_forum_replies')
        .update({ is_solution: false })
        .eq('thread_id', threadId);

      // Mark the new solution
      const { error } = await supabase
        .from('vendor_forum_replies')
        .update({ is_solution: true })
        .eq('id', replyId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      // console.error('Error marking solution:', error);
      return { error: error.message };
    }
  }

  // Voting operations
  async vote(targetId, targetType, voteType, vendorId) {
    try {
      const tableName = 'vendor_forum_votes';
      const targetColumn = targetType === 'thread' ? 'thread_id' : 'reply_id';

      // Check for existing vote
      const { data: existingVote } = await supabase
        .from(tableName)
        .select('id, vote_type')
        .eq('vendor_id', vendorId)
        .eq(targetColumn, targetId)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if same type
          await supabase
            .from(tableName)
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote type
          await supabase
            .from(tableName)
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        const voteData = {
          vendor_id: vendorId,
          vote_type: voteType,
          [targetColumn]: targetId
        };

        await supabase
          .from(tableName)
          .insert([voteData]);
      }

      return { error: null };
    } catch (error) {
      // console.error('Error voting:', error);
      return { error: error.message };
    }
  }

  // Reputation operations
  async getVendorReputation(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_forum_reputation')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return { reputation: data, error: null };
    } catch (error) {
      // console.error('Error fetching reputation:', error);
      return { reputation: null, error: error.message };
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('vendor_forum_reputation')
        .select(`
          *,
          vendor:vendors!vendor_id (
            id,
            business_name
          )
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { leaderboard: data, error: null };
    } catch (error) {
      // console.error('Error fetching leaderboard:', error);
      return { leaderboard: [], error: error.message };
    }
  }

  // Moderation operations
  async getFlaggedContent() {
    try {
      // This would typically be restricted to moderators
      const { data, error } = await supabase
        .from('vendor_forum_threads')
        .select(`
          id,
          title,
          content,
          vendor:vendors!vendor_id (
            id,
            business_name
          ),
          created_at
        `)
        .eq('is_moderated', true);

      if (error) throw error;

      return { flaggedContent: data, error: null };
    } catch (error) {
      // console.error('Error fetching flagged content:', error);
      return { flaggedContent: [], error: error.message };
    }
  }

  async moderateContent(contentId, contentType, action, reason, moderatorId) {
    try {
      const tableName = contentType === 'thread' ? 'vendor_forum_threads' : 'vendor_forum_replies';

      let updateData = {};

      switch (action) {
        case 'moderate':
          updateData.is_moderated = true;
          break;
        case 'unmoderate':
          updateData.is_moderated = false;
          break;
        case 'pin':
          if (contentType === 'thread') {
            updateData.is_pinned = true;
          }
          break;
        case 'unpin':
          if (contentType === 'thread') {
            updateData.is_pinned = false;
          }
          break;
        case 'lock':
          if (contentType === 'thread') {
            updateData.is_locked = true;
          }
          break;
        case 'unlock':
          if (contentType === 'thread') {
            updateData.is_locked = false;
          }
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', contentId);

      if (error) throw error;

      // Log moderation action
      await supabase
        .from('vendor_forum_moderation_log')
        .insert([{
          moderator_vendor_id: moderatorId,
          [contentType === 'thread' ? 'thread_id' : 'reply_id']: contentId,
          action_type: `${action}_${contentType}`,
          reason: reason
        }]);

      return { error: null };
    } catch (error) {
      // console.error('Error moderating content:', error);
      return { error: error.message };
    }
  }

  // Search operations
  async searchForum(query, options = {}) {
    try {
      const {
        category = null,
        sortBy = 'relevance',
        limit = 20,
        offset = 0
      } = options;

      let threadsQuery = supabase
        .from('vendor_forum_threads')
        .select(`
          id,
          title,
          content,
          category,
          tags,
          view_count,
          upvotes,
          reply_count,
          created_at,
          vendor:vendors!vendor_id (
            business_name
          )
        `)
        .eq('is_moderated', false);

      if (query) {
        threadsQuery = threadsQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`);
      }

      if (category) {
        threadsQuery = threadsQuery.eq('category', category);
      }

      if (sortBy === 'relevance') {
        threadsQuery = threadsQuery.order('upvotes', { ascending: false });
      } else {
        threadsQuery = threadsQuery.order(sortBy, { ascending: false });
      }

      threadsQuery = threadsQuery.range(offset, offset + limit - 1);

      const { data, error } = await threadsQuery;

      if (error) throw error;

      return { results: data, error: null };
    } catch (error) {
      // console.error('Error searching forum:', error);
      return { results: [], error: error.message };
    }
  }

  // Notification operations
  async getForumNotifications(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_forum_notifications')
        .select(`
          id,
          notification_type,
          message,
          is_read,
          created_at,
          thread:vendor_forum_threads!thread_id (
            id,
            title
          ),
          reply:vendor_forum_replies!reply_id (
            id,
            content
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return { notifications: data, error: null };
    } catch (error) {
      // console.error('Error fetching forum notifications:', error);
      return { notifications: [], error: error.message };
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const { error } = await supabase
        .from('vendor_forum_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      // console.error('Error marking notification as read:', error);
      return { error: error.message };
    }
  }
}

export default new ForumService();