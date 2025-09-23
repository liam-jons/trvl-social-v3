import { supabase } from '../lib/supabase';
/**
 * Vendor Service - Handles all vendor-related database operations
 */
export const vendorService = {
  // Get vendor profile by user ID
  async getVendorByUserId(userId) {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_certifications(*),
        vendor_insurance(*)
      `)
      .eq('user_id', userId)
      .single();
    return { data, error };
  },
  // Get vendor profile by vendor ID
  async getVendorById(vendorId) {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_certifications(*),
        vendor_insurance(*)
      `)
      .eq('id', vendorId)
      .single();
    return { data, error };
  },
  // Create vendor profile
  async createVendor(vendorData) {
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single();
    return { data, error };
  },
  // Update vendor profile
  async updateVendor(vendorId, updates) {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single();
    return { data, error };
  },
  // Get vendor adventures
  async getVendorAdventures(vendorId, options = {}) {
    let query = supabase
      .from('adventures')
      .select(`
        *,
        adventure_media(*),
        adventure_availability(*)
      `)
      .eq('vendor_id', vendorId);
    // Apply filters
    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }
    // Apply sorting
    const { orderBy = 'created_at', ascending = false } = options;
    query = query.order(orderBy, { ascending });
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    const { data, error } = await query;
    return { data, error };
  },
  // Get vendor bookings with detailed information
  async getVendorBookings(vendorId, options = {}) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        booking_participants(
          id,
          user_id,
          profiles!booking_participants_user_id_fkey(id, full_name, avatar_url)
        ),
        adventures(
          id,
          title,
          duration_hours,
          max_capacity,
          adventure_media(media_url, is_primary)
        )
      `)
      .eq('adventures.vendor_id', vendorId);
    // Apply status filter
    if (options.status) {
      query = query.eq('status', options.status);
    }
    // Apply date filters
    if (options.startDate) {
      query = query.gte('booking_date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('booking_date', options.endDate);
    }
    // Apply sorting
    const { orderBy = 'booking_date', ascending = false } = options;
    query = query.order(orderBy, { ascending });
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    const { data, error } = await query;
    return { data, error };
  },
  // Get today's bookings
  async getTodaysBookings(vendorId) {
    const today = new Date().toISOString().split('T')[0];
    return this.getVendorBookings(vendorId, {
      startDate: today,
      endDate: today,
      status: 'confirmed'
    });
  },
  // Get upcoming bookings (next 7 days)
  async getUpcomingBookings(vendorId, days = 7) {
    const today = new Date();
    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return this.getVendorBookings(vendorId, {
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'confirmed',
      orderBy: 'booking_date',
      ascending: true
    });
  },
  // Get vendor dashboard statistics
  async getDashboardStats(vendorId) {
    try {
      // Get basic stats in parallel
      const [todaysBookingsResult, upcomingBookingsResult, totalAdventuresResult] = await Promise.all([
        this.getTodaysBookings(vendorId),
        this.getUpcomingBookings(vendorId),
        this.getVendorAdventures(vendorId, { limit: 1000 }) // Get all adventures for count
      ]);
      if (todaysBookingsResult.error || upcomingBookingsResult.error || totalAdventuresResult.error) {
        throw new Error('Failed to fetch dashboard stats');
      }
      // Get revenue stats for current month
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const monthlyBookingsResult = await this.getVendorBookings(vendorId, {
        startDate: firstDayOfMonth.toISOString().split('T')[0],
        endDate: lastDayOfMonth.toISOString().split('T')[0],
        status: 'confirmed'
      });
      const monthlyRevenue = monthlyBookingsResult.data?.reduce((total, booking) => {
        return total + (booking.total_amount || 0);
      }, 0) || 0;
      return {
        data: {
          todaysBookings: todaysBookingsResult.data || [],
          upcomingBookings: upcomingBookingsResult.data || [],
          totalAdventures: totalAdventuresResult.data?.length || 0,
          activeAdventures: totalAdventuresResult.data?.filter(a => a.is_active).length || 0,
          monthlyRevenue,
          monthlyBookingsCount: monthlyBookingsResult.data?.length || 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Get vendor recent activities (bookings, reviews, etc.)
  async getRecentActivities(vendorId, limit = 20) {
    try {
      // Get recent bookings
      const recentBookingsResult = await this.getVendorBookings(vendorId, {
        limit,
        orderBy: 'created_at',
        ascending: false
      });
      if (recentBookingsResult.error) {
        throw recentBookingsResult.error;
      }
      // Transform bookings into activity format
      const activities = recentBookingsResult.data?.map(booking => ({
        id: booking.id,
        type: 'booking',
        title: `New booking for ${booking.adventures?.title}`,
        description: `${booking.booking_participants?.length || 0} participants`,
        timestamp: booking.created_at,
        relatedId: booking.id,
        relatedType: 'booking',
        metadata: {
          adventureTitle: booking.adventures?.title,
          participantCount: booking.booking_participants?.length || 0,
          amount: booking.total_amount,
          bookingDate: booking.booking_date
        }
      })) || [];
      return { data: activities, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },
  // Subscribe to real-time vendor updates
  subscribeToVendorUpdates(vendorId, callbacks = {}) {
    const subscriptions = [];
    // Subscribe to bookings updates
    if (callbacks.onBookingUpdate) {
      const bookingsSubscription = supabase
        .channel(`vendor-bookings-${vendorId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `adventures.vendor_id=eq.${vendorId}`
          },
          (payload) => {
            callbacks.onBookingUpdate(payload);
          }
        )
        .subscribe();
      subscriptions.push(bookingsSubscription);
    }
    // Subscribe to adventure updates
    if (callbacks.onAdventureUpdate) {
      const adventuresSubscription = supabase
        .channel(`vendor-adventures-${vendorId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'adventures',
            filter: `vendor_id=eq.${vendorId}`
          },
          (payload) => {
            callbacks.onAdventureUpdate(payload);
          }
        )
        .subscribe();
      subscriptions.push(adventuresSubscription);
    }
    // Subscribe to trip requests (for new bid opportunities)
    if (callbacks.onTripRequestUpdate) {
      const tripRequestsSubscription = supabase
        .channel(`vendor-trip-requests-${vendorId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'trip_requests'
          },
          (payload) => {
            callbacks.onTripRequestUpdate(payload);
          }
        )
        .subscribe();
      subscriptions.push(tripRequestsSubscription);
    }
    // Return cleanup function
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  },
  // BID SUBMISSION SYSTEM METHODS
  // Get trip requests relevant to vendor based on location, services, and preferences
  async getTripRequestsForVendor(vendorId, options = {}) {
    try {
      // First get vendor details to match against trip requests
      const { data: vendor, error: vendorError } = await this.getVendorById(vendorId);
      if (vendorError) return { data: null, error: vendorError };
      let query = supabase
        .from('trip_requests')
        .select(`
          *,
          profiles!trip_requests_user_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          vendor_bids!left(
            id,
            vendor_id,
            proposed_price,
            status,
            created_at
          )
        `)
        .eq('status', 'open');
      // Filter by destination if vendor has location preferences
      if (vendor.service_areas && vendor.service_areas.length > 0) {
        query = query.in('destination', vendor.service_areas);
      }
      // Filter by date range
      if (options.startDate) {
        query = query.gte('start_date', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('end_date', options.endDate);
      }
      // Filter by budget range
      if (options.minBudget) {
        query = query.gte('budget_min', options.minBudget);
      }
      if (options.maxBudget) {
        query = query.lte('budget_max', options.maxBudget);
      }
      // Filter by group size if vendor has capacity preferences
      if (vendor.max_group_size) {
        query = query.lte('group_size', vendor.max_group_size);
      }
      // Apply sorting
      const { orderBy = 'created_at', ascending = false } = options;
      query = query.order(orderBy, { ascending });
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      const { data, error } = await query;
      if (error) {
        return { data: null, error };
      }
      // Process results to add vendor-specific information
      const processedRequests = data?.map(request => {
        const existingBid = request.vendor_bids?.find(bid => bid.vendor_id === vendorId);
        return {
          ...request,
          hasExistingBid: !!existingBid,
          existingBidStatus: existingBid?.status || null,
          matchScore: this.calculateRequestMatchScore(vendor, request)
        };
      }) || [];
      return { data: processedRequests, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Calculate how well a trip request matches vendor capabilities
  calculateRequestMatchScore(vendor, request) {
    let score = 0;
    // Location match (40% weight)
    if (vendor.service_areas?.includes(request.destination)) {
      score += 40;
    }
    // Group size compatibility (20% weight)
    if (request.group_size <= (vendor.max_group_size || 20)) {
      score += 20;
    }
    // Budget compatibility (20% weight)
    const vendorAvgPrice = vendor.average_price || 0;
    if (vendorAvgPrice >= request.budget_min && vendorAvgPrice <= request.budget_max) {
      score += 20;
    }
    // Service type match (20% weight)
    if (vendor.specialties?.some(specialty =>
      request.preferences?.activities?.includes(specialty.toLowerCase())
    )) {
      score += 20;
    }
    return Math.min(100, score);
  },
  // Submit a bid for a trip request
  async submitBid(bidData) {
    try {
      const {
        tripRequestId,
        vendorId,
        proposedPrice,
        priceBreakdown,
        customItinerary,
        message,
        templateId = null,
        attachments = [],
        validUntil = null
      } = bidData;
      // Validate required fields
      if (!tripRequestId || !vendorId || !proposedPrice) {
        throw new Error('Trip request ID, vendor ID, and proposed price are required');
      }
      // Check if vendor already has a bid for this request
      const { data: existingBid } = await supabase
        .from('vendor_bids')
        .select('id')
        .eq('trip_request_id', tripRequestId)
        .eq('vendor_id', vendorId)
        .single();
      if (existingBid) {
        throw new Error('You have already submitted a bid for this trip request');
      }
      // Set default expiration (72 hours from now)
      const defaultExpiration = new Date();
      defaultExpiration.setHours(defaultExpiration.getHours() + 72);
      const bidRecord = {
        trip_request_id: tripRequestId,
        vendor_id: vendorId,
        proposed_price: proposedPrice,
        price_breakdown: priceBreakdown,
        custom_itinerary: customItinerary,
        message: message,
        template_id: templateId,
        status: 'pending',
        valid_until: validUntil || defaultExpiration.toISOString(),
        created_at: new Date().toISOString()
      };
      const { data: bid, error: bidError } = await supabase
        .from('vendor_bids')
        .insert([bidRecord])
        .select()
        .single();
      if (bidError) {
        throw new Error(bidError.message);
      }
      // Handle file attachments if provided
      if (attachments.length > 0) {
        const attachmentResults = await this.attachFilesToBid(bid.id, attachments);
        if (attachmentResults.error) {
        }
      }
      return { data: bid, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Get vendor bids with detailed information
  async getVendorBids(vendorId, options = {}) {
    try {
      let query = supabase
        .from('vendor_bids')
        .select(`
          *,
          trip_requests!vendor_bids_trip_request_id_fkey(
            id,
            title,
            destination,
            start_date,
            end_date,
            group_size,
            budget_min,
            budget_max,
            profiles!trip_requests_user_id_fkey(
              full_name,
              avatar_url
            )
          ),
          bid_attachments(*)
        `)
        .eq('vendor_id', vendorId);
      // Apply status filter
      if (options.status) {
        query = query.eq('status', options.status);
      }
      // Apply date filters
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      // Apply sorting
      const { orderBy = 'created_at', ascending = false } = options;
      query = query.order(orderBy, { ascending });
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Manage bid templates
  async getBidTemplates(vendorId, options = {}) {
    let query = supabase
      .from('bid_templates')
      .select('*')
      .eq('vendor_id', vendorId);
    if (options.adventureType) {
      query = query.eq('adventure_type', options.adventureType);
    }
    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }
    const { data, error } = await query.order('name');
    return { data, error };
  },
  async createBidTemplate(templateData) {
    const { data, error } = await supabase
      .from('bid_templates')
      .insert([{
        ...templateData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },
  async updateBidTemplate(templateId, updates) {
    const { data, error } = await supabase
      .from('bid_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();
    return { data, error };
  },
  async deleteBidTemplate(templateId) {
    const { data, error } = await supabase
      .from('bid_templates')
      .delete()
      .eq('id', templateId);
    return { data, error };
  },
  // Handle bid expiration and withdrawal
  async withdrawBid(bidId, vendorId) {
    try {
      // Verify bid belongs to vendor
      const { data: bid, error: bidError } = await supabase
        .from('vendor_bids')
        .select('id, status')
        .eq('id', bidId)
        .eq('vendor_id', vendorId)
        .single();
      if (bidError || !bid) {
        throw new Error('Bid not found or access denied');
      }
      if (bid.status !== 'pending') {
        throw new Error('Only pending bids can be withdrawn');
      }
      const { data, error } = await supabase
        .from('vendor_bids')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString()
        })
        .eq('id', bidId)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  async updateBidStatus(bidId, status, vendorId = null) {
    let query = supabase
      .from('vendor_bids')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bidId);
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    const { data, error } = await query.select().single();
    return { data, error };
  },
  // Handle expired bids (to be called by a background job)
  async processExpiredBids() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('vendor_bids')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('valid_until', now)
      .select();
    return { data, error };
  },
  // Handle file attachments for bids
  async attachFilesToBid(bidId, files) {
    try {
      const attachmentResults = [];
      for (const file of files) {
        // Upload file to Supabase Storage
        const fileName = `bid-${bidId}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bid-attachments')
          .upload(fileName, file);
        if (uploadError) {
          attachmentResults.push({
            fileName: file.name,
            success: false,
            error: uploadError.message
          });
          continue;
        }
        // Save attachment metadata
        const { data: attachmentData, error: attachmentError } = await supabase
          .from('bid_attachments')
          .insert([{
            bid_id: bidId,
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            file_type: file.type,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        if (attachmentError) {
          attachmentResults.push({
            fileName: file.name,
            success: false,
            error: attachmentError.message
          });
        } else {
          attachmentResults.push({
            fileName: file.name,
            success: true,
            data: attachmentData
          });
        }
      }
      const successCount = attachmentResults.filter(r => r.success).length;
      const errorCount = attachmentResults.length - successCount;
      return {
        data: attachmentResults,
        error: errorCount > 0 ? `${errorCount} files failed to upload` : null,
        summary: { total: files.length, success: successCount, failed: errorCount }
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Get signed URLs for bid attachments
  async getBidAttachmentUrls(bidId, expirationHours = 24) {
    try {
      const { data: attachments, error: attachmentsError } = await supabase
        .from('bid_attachments')
        .select('*')
        .eq('bid_id', bidId);
      if (attachmentsError) {
        return { data: null, error: attachmentsError };
      }
      const urlPromises = attachments.map(async (attachment) => {
        const { data: urlData } = await supabase.storage
          .from('bid-attachments')
          .createSignedUrl(attachment.file_path, expirationHours * 3600);
        return {
          ...attachment,
          signedUrl: urlData?.signedUrl || null
        };
      });
      const attachmentsWithUrls = await Promise.all(urlPromises);
      return { data: attachmentsWithUrls, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Adventure CRUD Operations
  // Create new adventure
  async createAdventure(vendorId, adventureData) {
    try {
      const { data, error } = await supabase
        .from('adventures')
        .insert([{
          ...adventureData,
          vendor_id: vendorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Update adventure
  async updateAdventure(adventureId, updates) {
    try {
      const { data, error } = await supabase
        .from('adventures')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', adventureId)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // Delete adventure
  async deleteAdventure(adventureId) {
    try {
      const { error } = await supabase
        .from('adventures')
        .delete()
        .eq('id', adventureId);
      return { error };
    } catch (error) {
      return { error: error.message };
    }
  },
  // Get adventure by ID
  async getAdventureById(adventureId) {
    try {
      const { data, error } = await supabase
        .from('adventures')
        .select(`
          *,
          adventure_media(*),
          adventure_availability(*),
          vendors(business_name, contact_email)
        `)
        .eq('id', adventureId)
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // PERFORMANCE TRACKING METHODS
  /**
   * Get vendor performance overview for dashboard
   */
  async getPerformanceOverview(vendorId, timeRange = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRange * 24 * 60 * 60 * 1000);
      // Get key performance metrics
      const [bookingsResult, reviewsResult] = await Promise.all([
        this.getVendorBookings(vendorId, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }),
        this.getVendorReviews(vendorId, startDate, endDate)
      ]);
      const bookings = bookingsResult.data || [];
      const reviews = reviewsResult.data || [];
      // Calculate key metrics
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      const averageRating = reviews.length > 0 ?
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      const totalRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      return {
        data: {
          totalBookings,
          completedBookings,
          completionRate,
          averageRating,
          totalReviews: reviews.length,
          totalRevenue,
          timeRange
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get vendor reviews for performance analysis
   */
  async getVendorReviews(vendorId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('adventure_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          adventures!inner(
            id,
            title,
            vendor_id
          ),
          profiles!adventure_reviews_user_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('adventures.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Track vendor performance metrics over time
   */
  async trackPerformanceMetrics(vendorId, metrics) {
    try {
      const { data, error } = await supabase
        .from('vendor_performance_history')
        .insert([{
          vendor_id: vendorId,
          tracked_at: new Date().toISOString(),
          metrics: metrics,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get performance alerts for vendor
   */
  async getPerformanceAlerts(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_performance_alerts')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Create performance alert
   */
  async createPerformanceAlert(vendorId, alertData) {
    try {
      const { data, error } = await supabase
        .from('vendor_performance_alerts')
        .insert([{
          vendor_id: vendorId,
          alert_type: alertData.type,
          severity: alertData.severity,
          message: alertData.message,
          recommendation: alertData.recommendation,
          metric_value: alertData.metricValue,
          threshold_value: alertData.thresholdValue,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get performance improvement goals
   */
  async getPerformanceGoals(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_performance_goals')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Set performance goal
   */
  async setPerformanceGoal(vendorId, goalData) {
    try {
      const { data, error } = await supabase
        .from('vendor_performance_goals')
        .insert([{
          vendor_id: vendorId,
          metric_name: goalData.metricName,
          target_value: goalData.targetValue,
          current_value: goalData.currentValue,
          target_date: goalData.targetDate,
          description: goalData.description,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};
export default vendorService;