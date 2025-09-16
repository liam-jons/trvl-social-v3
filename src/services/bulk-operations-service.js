import { supabase } from '../lib/supabase';
import { vendorService } from './vendor-service';

/**
 * Bulk Operations Service - Handles large-scale operations for adventures and bookings
 */
export const bulkOperationsService = {
  // BULK ADVENTURE OPERATIONS

  /**
   * Update multiple adventures with batch processing
   */
  async bulkUpdateAdventures(vendorId, adventureIds, updates) {
    try {
      const batchSize = 50; // Process in batches to avoid timeout
      const results = {
        successful: [],
        failed: [],
        total: adventureIds.length
      };

      // Process in batches
      for (let i = 0; i < adventureIds.length; i += batchSize) {
        const batch = adventureIds.slice(i, i + batchSize);

        const { data, error } = await supabase
          .from('adventures')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('vendor_id', vendorId)
          .in('id', batch)
          .select('id, title');

        if (error) {
          results.failed.push(...batch.map(id => ({ id, error: error.message })));
        } else {
          results.successful.push(...(data || []));
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Bulk update adventures error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Bulk pricing adjustments
   */
  async bulkUpdatePricing(vendorId, adventureIds, pricingAdjustment) {
    try {
      const results = {
        successful: [],
        failed: [],
        total: adventureIds.length
      };

      for (const adventureId of adventureIds) {
        try {
          // Get current pricing
          const { data: adventure, error: fetchError } = await supabase
            .from('adventures')
            .select('id, price_per_person, pricing_details')
            .eq('id', adventureId)
            .eq('vendor_id', vendorId)
            .single();

          if (fetchError) {
            results.failed.push({ id: adventureId, error: fetchError.message });
            continue;
          }

          let newPrice = adventure.price_per_person;

          // Apply pricing adjustment
          switch (pricingAdjustment.type) {
            case 'percentage':
              newPrice = newPrice * (1 + pricingAdjustment.value / 100);
              break;
            case 'fixed_amount':
              newPrice = newPrice + pricingAdjustment.value;
              break;
            case 'set_price':
              newPrice = pricingAdjustment.value;
              break;
            default:
              throw new Error('Invalid pricing adjustment type');
          }

          // Ensure minimum price
          newPrice = Math.max(newPrice, pricingAdjustment.minimumPrice || 0);

          // Update adventure pricing
          const { data: updatedAdventure, error: updateError } = await supabase
            .from('adventures')
            .update({
              price_per_person: Math.round(newPrice * 100) / 100, // Round to 2 decimal places
              updated_at: new Date().toISOString()
            })
            .eq('id', adventureId)
            .eq('vendor_id', vendorId)
            .select('id, title, price_per_person')
            .single();

          if (updateError) {
            results.failed.push({ id: adventureId, error: updateError.message });
          } else {
            results.successful.push({
              ...updatedAdventure,
              oldPrice: adventure.price_per_person,
              newPrice: updatedAdventure.price_per_person
            });
          }
        } catch (error) {
          results.failed.push({ id: adventureId, error: error.message });
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Bulk pricing update error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Bulk status updates (publish, unpublish, archive)
   */
  async bulkUpdateStatus(vendorId, adventureIds, newStatus) {
    try {
      const validStatuses = ['published', 'draft', 'archived', 'suspended'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status. Must be one of: ' + validStatuses.join(', '));
      }

      const { data, error } = await supabase
        .from('adventures')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('vendor_id', vendorId)
        .in('id', adventureIds)
        .select('id, title, status');

      if (error) {
        return { data: null, error };
      }

      return {
        data: {
          successful: data || [],
          failed: [],
          total: adventureIds.length,
          newStatus
        },
        error: null
      };
    } catch (error) {
      console.error('Bulk status update error:', error);
      return { data: null, error: error.message };
    }
  },

  // BULK BOOKING OPERATIONS

  /**
   * Get bookings for bulk operations
   */
  async getBulkBookingsData(vendorId, filters = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          booking_participants(
            id,
            user_id,
            profiles!booking_participants_user_id_fkey(id, full_name, email, avatar_url)
          ),
          adventures(
            id,
            title,
            vendor_id,
            price_per_person
          )
        `)
        .eq('adventures.vendor_id', vendorId);

      // Apply filters
      if (filters.status) {
        query = query.in('status', Array.isArray(filters.status) ? filters.status : [filters.status]);
      }

      if (filters.dateRange) {
        query = query
          .gte('booking_date', filters.dateRange.start)
          .lte('booking_date', filters.dateRange.end);
      }

      if (filters.adventureIds) {
        query = query.in('adventure_id', filters.adventureIds);
      }

      // Apply sorting
      query = query.order('booking_date', { ascending: false });

      // Apply pagination if specified
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Get bulk bookings data error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Bulk booking status updates
   */
  async bulkUpdateBookingStatus(vendorId, bookingIds, newStatus) {
    try {
      const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid booking status');
      }

      // First verify all bookings belong to vendor
      const { data: bookings, error: verifyError } = await supabase
        .from('bookings')
        .select('id, adventures!inner(vendor_id)')
        .in('id', bookingIds)
        .eq('adventures.vendor_id', vendorId);

      if (verifyError) {
        return { data: null, error: verifyError };
      }

      if (bookings.length !== bookingIds.length) {
        return { data: null, error: 'Some bookings not found or access denied' };
      }

      // Update booking statuses
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', bookingIds)
        .select('id, status');

      return { data, error };
    } catch (error) {
      console.error('Bulk booking status update error:', error);
      return { data: null, error: error.message };
    }
  },

  // BULK NOTIFICATION SYSTEM

  /**
   * Send bulk notifications to customers
   */
  async sendBulkNotifications(vendorId, notificationData) {
    try {
      const {
        recipientType, // 'booking_participants', 'adventure_followers', 'all_customers'
        bookingIds = [],
        adventureIds = [],
        message,
        notificationType = 'vendor_update',
        includeEmail = false,
        includeWhatsApp = false
      } = notificationData;

      let recipients = [];

      // Get recipients based on type
      switch (recipientType) {
        case 'booking_participants':
          const { data: bookingParticipants } = await this.getBulkBookingsData(vendorId, {
            ...(bookingIds.length > 0 && { bookingIds })
          });

          recipients = bookingParticipants?.flatMap(booking =>
            booking.booking_participants?.map(participant => ({
              userId: participant.user_id,
              email: participant.profiles?.email,
              fullName: participant.profiles?.full_name,
              bookingId: booking.id,
              adventureTitle: booking.adventures?.title
            }))
          ) || [];
          break;

        case 'adventure_followers':
          // Get users who have bookings for these adventures
          const { data: adventureBookings } = await this.getBulkBookingsData(vendorId, {
            adventureIds
          });

          recipients = adventureBookings?.flatMap(booking =>
            booking.booking_participants?.map(participant => ({
              userId: participant.user_id,
              email: participant.profiles?.email,
              fullName: participant.profiles?.full_name,
              adventureTitle: booking.adventures?.title
            }))
          ) || [];
          break;

        default:
          throw new Error('Invalid recipient type');
      }

      // Remove duplicates
      const uniqueRecipients = recipients.filter((recipient, index, self) =>
        index === self.findIndex(r => r.userId === recipient.userId)
      );

      // Send notifications
      const results = {
        successful: [],
        failed: [],
        total: uniqueRecipients.length
      };

      for (const recipient of uniqueRecipients) {
        try {
          // Create in-app notification
          const { data: notification, error: notificationError } = await supabase
            .from('notifications')
            .insert([{
              user_id: recipient.userId,
              type: notificationType,
              title: `Message from your adventure provider`,
              message: message,
              metadata: {
                vendor_id: vendorId,
                adventure_title: recipient.adventureTitle,
                booking_id: recipient.bookingId
              },
              created_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (notificationError) {
            results.failed.push({
              recipient: recipient.fullName,
              error: notificationError.message
            });
            continue;
          }

          // Send email if requested
          if (includeEmail && recipient.email) {
            // Integration point for email service
            console.log(`Would send email to ${recipient.email}: ${message}`);
          }

          // Send WhatsApp if requested
          if (includeWhatsApp) {
            // Integration point for WhatsApp service
            console.log(`Would send WhatsApp to ${recipient.fullName}: ${message}`);
          }

          results.successful.push({
            recipient: recipient.fullName,
            userId: recipient.userId,
            notificationId: notification.id
          });

        } catch (error) {
          results.failed.push({
            recipient: recipient.fullName,
            error: error.message
          });
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Bulk notifications error:', error);
      return { data: null, error: error.message };
    }
  },

  // CSV IMPORT/EXPORT FUNCTIONALITY

  /**
   * Export adventures to CSV format
   */
  async exportAdventuresToCSV(vendorId, filters = {}) {
    try {
      const { data: adventures, error } = await vendorService.getVendorAdventures(vendorId, {
        limit: 10000, // Export all
        ...filters
      });

      if (error) {
        return { data: null, error };
      }

      // Convert to CSV format
      const csvHeaders = [
        'ID',
        'Title',
        'Description',
        'Location',
        'Price Per Person',
        'Duration Hours',
        'Max Capacity',
        'Status',
        'Category',
        'Created At',
        'Updated At'
      ];

      const csvRows = adventures.map(adventure => [
        adventure.id,
        `"${adventure.title || ''}"`,
        `"${(adventure.description || '').replace(/"/g, '""')}"`,
        `"${adventure.location || ''}"`,
        adventure.price_per_person || 0,
        adventure.duration_hours || 0,
        adventure.max_capacity || 0,
        adventure.status || 'draft',
        `"${adventure.category || ''}"`,
        adventure.created_at || '',
        adventure.updated_at || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      return {
        data: {
          csvContent,
          filename: `adventures_export_${new Date().toISOString().split('T')[0]}.csv`,
          count: adventures.length
        },
        error: null
      };
    } catch (error) {
      console.error('Export adventures CSV error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Export bookings to CSV format
   */
  async exportBookingsToCSV(vendorId, filters = {}) {
    try {
      const { data: bookings, error } = await this.getBulkBookingsData(vendorId, filters);

      if (error) {
        return { data: null, error };
      }

      // Convert to CSV format
      const csvHeaders = [
        'Booking ID',
        'Adventure Title',
        'Customer Name',
        'Customer Email',
        'Booking Date',
        'Participants Count',
        'Total Amount',
        'Status',
        'Created At'
      ];

      const csvRows = bookings.flatMap(booking =>
        booking.booking_participants.map(participant => [
          booking.id,
          `"${booking.adventures?.title || ''}"`,
          `"${participant.profiles?.full_name || ''}"`,
          `"${participant.profiles?.email || ''}"`,
          booking.booking_date || '',
          booking.booking_participants.length,
          booking.total_amount || 0,
          booking.status || '',
          booking.created_at || ''
        ])
      );

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      return {
        data: {
          csvContent,
          filename: `bookings_export_${new Date().toISOString().split('T')[0]}.csv`,
          count: csvRows.length
        },
        error: null
      };
    } catch (error) {
      console.error('Export bookings CSV error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Import adventures from CSV data
   */
  async importAdventuresFromCSV(vendorId, csvData, options = {}) {
    try {
      const results = {
        successful: [],
        failed: [],
        total: 0
      };

      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      // Validate required headers
      const requiredHeaders = ['title', 'description', 'location', 'price_per_person'];
      const missingHeaders = requiredHeaders.filter(h =>
        !headers.some(header => header.toLowerCase().includes(h))
      );

      if (missingHeaders.length > 0) {
        return {
          data: null,
          error: `Missing required headers: ${missingHeaders.join(', ')}`
        };
      }

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const row = {};

          headers.forEach((header, index) => {
            row[header.toLowerCase().replace(/ /g, '_')] = values[index] || '';
          });

          // Create adventure data
          const adventureData = {
            vendor_id: vendorId,
            title: row.title,
            description: row.description,
            location: row.location,
            price_per_person: parseFloat(row.price_per_person) || 0,
            duration_hours: parseFloat(row.duration_hours) || 4,
            max_capacity: parseInt(row.max_capacity) || 10,
            status: row.status || 'draft',
            category: row.category || 'adventure',
            difficulty_level: row.difficulty_level || 'beginner',
            is_active: options.autoActivate || false
          };

          // Validate required fields
          if (!adventureData.title || !adventureData.description || !adventureData.location) {
            results.failed.push({
              row: i + 1,
              data: row,
              error: 'Missing required fields: title, description, or location'
            });
            continue;
          }

          // Create adventure
          const { data: adventure, error: createError } = await vendorService.createAdventure(
            vendorId,
            adventureData
          );

          if (createError) {
            results.failed.push({
              row: i + 1,
              data: row,
              error: createError.message
            });
          } else {
            results.successful.push({
              row: i + 1,
              adventure
            });
          }

        } catch (error) {
          results.failed.push({
            row: i + 1,
            error: error.message
          });
        }
      }

      results.total = lines.length - 1; // Exclude header row

      return { data: results, error: null };
    } catch (error) {
      console.error('Import adventures CSV error:', error);
      return { data: null, error: error.message };
    }
  },

  // BULK ACTION HISTORY

  /**
   * Log bulk action for history tracking
   */
  async logBulkAction(vendorId, actionData) {
    try {
      const { data, error } = await supabase
        .from('bulk_action_history')
        .insert([{
          vendor_id: vendorId,
          action_type: actionData.type,
          target_type: actionData.targetType,
          target_count: actionData.targetCount,
          details: actionData.details,
          results: actionData.results,
          performed_at: new Date().toISOString()
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Log bulk action error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get bulk action history
   */
  async getBulkActionHistory(vendorId, options = {}) {
    try {
      let query = supabase
        .from('bulk_action_history')
        .select('*')
        .eq('vendor_id', vendorId);

      if (options.actionType) {
        query = query.eq('action_type', options.actionType);
      }

      if (options.targetType) {
        query = query.eq('target_type', options.targetType);
      }

      if (options.dateRange) {
        query = query
          .gte('performed_at', options.dateRange.start)
          .lte('performed_at', options.dateRange.end);
      }

      // Apply sorting and pagination
      query = query
        .order('performed_at', { ascending: false })
        .limit(options.limit || 50);

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Get bulk action history error:', error);
      return { data: null, error: error.message };
    }
  },

  // BATCH PROCESSING QUEUE

  /**
   * Create a batch job for large operations
   */
  async createBatchJob(vendorId, jobData) {
    try {
      const { data, error } = await supabase
        .from('batch_jobs')
        .insert([{
          vendor_id: vendorId,
          job_type: jobData.type,
          job_data: jobData.data,
          status: 'pending',
          total_items: jobData.totalItems,
          processed_items: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Create batch job error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Update batch job progress
   */
  async updateBatchJobProgress(jobId, progress) {
    try {
      const { data, error } = await supabase
        .from('batch_jobs')
        .update({
          processed_items: progress.processedItems,
          status: progress.status,
          error_details: progress.errorDetails,
          completed_at: progress.status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Update batch job progress error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get batch job status
   */
  async getBatchJobStatus(jobId) {
    try {
      const { data, error } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Get batch job status error:', error);
      return { data: null, error: error.message };
    }
  }
};

export default bulkOperationsService;