/**
 * Booking Modification Service - Comprehensive booking modification and cancellation system
 * Handles modification requests, vendor approval workflows, and policy enforcement
 */
import { supabase } from '../lib/supabase.js';
import { notificationService } from './notification-service.js';
import { refundPolicyEngine, manualRefundManager } from './payment-refund-service.js';
import { groupPaymentManager } from './split-payment-service.js';
// Modification configuration
const MODIFICATION_CONFIG = {
  types: {
    DATE_CHANGE: 'date_change',
    PARTICIPANT_UPDATE: 'participant_update',
    ITINERARY_ADJUSTMENT: 'itinerary_adjustment',
    ACCOMMODATION_CHANGE: 'accommodation_change',
    MEAL_PREFERENCE: 'meal_preference',
    SPECIAL_REQUESTS: 'special_requests',
    PARTIAL_CANCELLATION: 'partial_cancellation',
    FULL_CANCELLATION: 'full_cancellation',
  },
  autoApprovalRules: {
    dateChangeHours: 72, // Auto-approve date changes if requested 72+ hours before
    participantIncreaseLimit: 2, // Auto-approve participant increases up to 2 people
    minorAdjustmentTypes: ['meal_preference', 'special_requests'], // Auto-approve these types
    vendorResponseHours: 48, // Vendor has 48 hours to respond
  },
  restrictions: {
    maxDateChanges: 3, // Maximum date changes allowed per booking
    minAdvanceHours: 24, // Minimum hours before trip for modifications
    blackoutDays: [], // Days when modifications are not allowed
  },
  fees: {
    dateChangeFee: 2500, // $25.00 in cents
    participantChangeFee: 1500, // $15.00 per participant
    itineraryChangeFee: 3000, // $30.00 for itinerary changes
    lastMinuteFeeMultiplier: 2, // Double fees for last-minute changes
  },
};
/**
 * Booking modification manager
 */
export const bookingModificationManager = {
  /**
   * Create a modification request
   */
  async createModificationRequest(requestData) {
    const {
      bookingId,
      userId,
      modificationType,
      requestedChanges,
      reason,
      urgency = 'normal',
      metadata = {},
    } = requestData;
    try {
      // Validate booking exists and user has permission
      const booking = await this.validateModificationPermission(bookingId, userId);
      // Check modification restrictions
      const restrictions = await this.checkModificationRestrictions(booking, modificationType);
      if (!restrictions.allowed) {
        throw new Error(restrictions.reason);
      }
      // Calculate modification fees
      const fees = await this.calculateModificationFees(booking, modificationType, requestedChanges);
      // Determine if auto-approval applies
      const autoApproval = this.evaluateAutoApproval(modificationType, requestedChanges, booking);
      // Create modification request record
      const { data: modificationRequest, error } = await supabase
        .from('booking_modifications')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          modification_type: modificationType,
          requested_changes: requestedChanges,
          reason,
          urgency,
          status: autoApproval.eligible ? 'auto_approved' : 'pending_vendor_review',
          estimated_fees: fees.total,
          fee_breakdown: fees.breakdown,
          auto_approval_eligible: autoApproval.eligible,
          auto_approval_reason: autoApproval.reason,
          vendor_response_deadline: new Date(Date.now() + MODIFICATION_CONFIG.autoApprovalRules.vendorResponseHours * 60 * 60 * 1000).toISOString(),
          metadata: {
            ...metadata,
            booking_title: booking.adventures?.title,
            original_dates: booking.start_date && booking.end_date ? {
              start: booking.start_date,
              end: booking.end_date,
            } : null,
          },
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      // Process auto-approval if eligible
      if (autoApproval.eligible) {
        await this.processAutoApproval(modificationRequest);
      } else {
        // Send notification to vendor for manual review
        await this.notifyVendorOfModificationRequest(modificationRequest, booking);
      }
      // Create audit log entry
      await this.createAuditLogEntry({
        booking_id: bookingId,
        modification_request_id: modificationRequest.id,
        action: 'modification_requested',
        actor_id: userId,
        actor_type: 'user',
        details: {
          modification_type: modificationType,
          auto_approved: autoApproval.eligible,
          fees: fees,
        },
      });
      return {
        success: true,
        modificationRequest,
        autoApproved: autoApproval.eligible,
        estimatedFees: fees,
      };
    } catch (error) {
      throw new Error(`Failed to create modification request: ${error.message}`);
    }
  },
  /**
   * Validate user permission to modify booking
   */
  async validateModificationPermission(bookingId, userId) {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        adventures (
          id,
          title,
          start_date,
          end_date,
          vendor_id,
          modification_policy,
          vendors (id, name, modification_settings)
        ),
        split_payments (
          id,
          organizer_id,
          status
        )
      `)
      .eq('id', bookingId)
      .single();
    if (error) throw new Error('Booking not found');
    // Check if user is the booking owner or organizer
    const isOwner = booking.user_id === userId;
    const isOrganizer = booking.split_payments?.some(sp => sp.organizer_id === userId);
    if (!isOwner && !isOrganizer) {
      throw new Error('You do not have permission to modify this booking');
    }
    // Check booking status
    if (!['confirmed', 'paid', 'partially_paid'].includes(booking.status)) {
      throw new Error('Booking cannot be modified in its current status');
    }
    return booking;
  },
  /**
   * Check modification restrictions
   */
  async checkModificationRestrictions(booking, modificationType) {
    const config = MODIFICATION_CONFIG.restrictions;
    const now = new Date();
    const tripStart = new Date(booking.adventures.start_date);
    const hoursUntilTrip = (tripStart - now) / (1000 * 60 * 60);
    // Check minimum advance time
    if (hoursUntilTrip < config.minAdvanceHours) {
      return {
        allowed: false,
        reason: `Modifications must be requested at least ${config.minAdvanceHours} hours before the trip`,
      };
    }
    // Check for blackout days
    if (config.blackoutDays.some(blackout => {
      const blackoutDate = new Date(blackout);
      return blackoutDate.toDateString() === now.toDateString();
    })) {
      return {
        allowed: false,
        reason: 'Modifications are not allowed on this date',
      };
    }
    // Check maximum date changes for date modifications
    if (modificationType === MODIFICATION_CONFIG.types.DATE_CHANGE) {
      const { data: previousChanges } = await supabase
        .from('booking_modifications')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('modification_type', MODIFICATION_CONFIG.types.DATE_CHANGE)
        .in('status', ['approved', 'auto_approved']);
      if (previousChanges && previousChanges.length >= config.maxDateChanges) {
        return {
          allowed: false,
          reason: `Maximum of ${config.maxDateChanges} date changes allowed per booking`,
        };
      }
    }
    // Check vendor-specific restrictions
    const vendorSettings = booking.adventures.vendors?.modification_settings || {};
    if (vendorSettings.blacklistTypes?.includes(modificationType)) {
      return {
        allowed: false,
        reason: 'This type of modification is not allowed by the vendor',
      };
    }
    return { allowed: true };
  },
  /**
   * Calculate modification fees
   */
  async calculateModificationFees(booking, modificationType, requestedChanges) {
    const config = MODIFICATION_CONFIG.fees;
    const now = new Date();
    const tripStart = new Date(booking.adventures.start_date);
    const hoursUntilTrip = (tripStart - now) / (1000 * 60 * 60);
    const isLastMinute = hoursUntilTrip < 48;
    let baseFee = 0;
    let additionalFees = 0;
    const breakdown = [];
    // Calculate base fee by modification type
    switch (modificationType) {
      case MODIFICATION_CONFIG.types.DATE_CHANGE:
        baseFee = config.dateChangeFee;
        breakdown.push({ type: 'Date Change Fee', amount: baseFee });
        break;
      case MODIFICATION_CONFIG.types.PARTICIPANT_UPDATE:
        const participantChange = requestedChanges.participantCount || 0;
        if (participantChange > 0) {
          additionalFees = participantChange * config.participantChangeFee;
          breakdown.push({ type: 'Participant Addition Fee', amount: additionalFees });
        }
        break;
      case MODIFICATION_CONFIG.types.ITINERARY_ADJUSTMENT:
        baseFee = config.itineraryChangeFee;
        breakdown.push({ type: 'Itinerary Change Fee', amount: baseFee });
        break;
      default:
        // Minor modifications may have no fee
        if (!MODIFICATION_CONFIG.autoApprovalRules.minorAdjustmentTypes.includes(modificationType)) {
          baseFee = 1000; // $10 default fee
          breakdown.push({ type: 'Modification Fee', amount: baseFee });
        }
    }
    // Apply last-minute multiplier
    if (isLastMinute && (baseFee > 0 || additionalFees > 0)) {
      const lastMinuteFee = (baseFee + additionalFees) * (config.lastMinuteFeeMultiplier - 1);
      additionalFees += lastMinuteFee;
      breakdown.push({ type: 'Last-Minute Change Surcharge', amount: lastMinuteFee });
    }
    // Check vendor-specific fees
    const vendorSettings = booking.adventures.vendors?.modification_settings || {};
    if (vendorSettings.customFees?.[modificationType]) {
      const vendorFee = vendorSettings.customFees[modificationType];
      additionalFees += vendorFee;
      breakdown.push({ type: 'Vendor-Specific Fee', amount: vendorFee });
    }
    const total = baseFee + additionalFees;
    return {
      total,
      baseFee,
      additionalFees,
      breakdown,
      isLastMinute,
    };
  },
  /**
   * Evaluate if modification qualifies for auto-approval
   */
  evaluateAutoApproval(modificationType, requestedChanges, booking) {
    const config = MODIFICATION_CONFIG.autoApprovalRules;
    const now = new Date();
    const tripStart = new Date(booking.adventures.start_date);
    const hoursUntilTrip = (tripStart - now) / (1000 * 60 * 60);
    // Check if modification type is auto-approvable
    if (config.minorAdjustmentTypes.includes(modificationType)) {
      return {
        eligible: true,
        reason: 'Minor adjustment type - auto-approved',
      };
    }
    // Auto-approve date changes with sufficient advance notice
    if (modificationType === MODIFICATION_CONFIG.types.DATE_CHANGE &&
        hoursUntilTrip >= config.dateChangeHours) {
      return {
        eligible: true,
        reason: `Date change requested ${Math.floor(hoursUntilTrip)} hours in advance`,
      };
    }
    // Auto-approve small participant increases
    if (modificationType === MODIFICATION_CONFIG.types.PARTICIPANT_UPDATE) {
      const increase = requestedChanges.participantCount || 0;
      if (increase > 0 && increase <= config.participantIncreaseLimit) {
        return {
          eligible: true,
          reason: `Small participant increase (${increase} people)`,
        };
      }
    }
    // Check vendor auto-approval settings
    const vendorSettings = booking.adventures.vendors?.modification_settings || {};
    if (vendorSettings.autoApproveTypes?.includes(modificationType)) {
      return {
        eligible: true,
        reason: 'Vendor allows auto-approval for this modification type',
      };
    }
    return {
      eligible: false,
      reason: 'Requires vendor review',
    };
  },
  /**
   * Process auto-approved modification
   */
  async processAutoApproval(modificationRequest) {
    try {
      // Update modification status
      await supabase
        .from('booking_modifications')
        .update({
          status: 'auto_approved',
          approved_at: new Date().toISOString(),
          approved_by: 'system',
          approval_notes: 'Automatically approved based on policy',
          updated_at: new Date().toISOString(),
        })
        .eq('id', modificationRequest.id);
      // Apply the modification to the booking
      await this.applyModificationToBooking(modificationRequest);
      // Send confirmation notifications
      await this.sendModificationConfirmation(modificationRequest, true);
      // Create audit log
      await this.createAuditLogEntry({
        booking_id: modificationRequest.booking_id,
        modification_request_id: modificationRequest.id,
        action: 'modification_auto_approved',
        actor_id: 'system',
        actor_type: 'system',
        details: {
          reason: modificationRequest.auto_approval_reason,
        },
      });
    } catch (error) {
      throw new Error(`Failed to process auto-approval: ${error.message}`);
    }
  },
  /**
   * Apply approved modification to booking
   */
  async applyModificationToBooking(modificationRequest) {
    const { booking_id, modification_type, requested_changes } = modificationRequest;
    try {
      let updateData = {
        updated_at: new Date().toISOString(),
      };
      // Apply changes based on modification type
      switch (modification_type) {
        case MODIFICATION_CONFIG.types.DATE_CHANGE:
          if (requested_changes.newStartDate) {
            updateData.start_date = requested_changes.newStartDate;
          }
          if (requested_changes.newEndDate) {
            updateData.end_date = requested_changes.newEndDate;
          }
          break;
        case MODIFICATION_CONFIG.types.PARTICIPANT_UPDATE:
          if (requested_changes.participantCount !== undefined) {
            updateData.participant_count = requested_changes.participantCount;
          }
          if (requested_changes.participantDetails) {
            updateData.participant_details = requested_changes.participantDetails;
          }
          break;
        case MODIFICATION_CONFIG.types.ITINERARY_ADJUSTMENT:
          if (requested_changes.itinerary) {
            updateData.custom_itinerary = requested_changes.itinerary;
          }
          break;
        case MODIFICATION_CONFIG.types.ACCOMMODATION_CHANGE:
          if (requested_changes.accommodation) {
            updateData.accommodation_preferences = requested_changes.accommodation;
          }
          break;
        case MODIFICATION_CONFIG.types.MEAL_PREFERENCE:
          if (requested_changes.meals) {
            updateData.meal_preferences = requested_changes.meals;
          }
          break;
        case MODIFICATION_CONFIG.types.SPECIAL_REQUESTS:
          if (requested_changes.specialRequests) {
            updateData.special_requests = requested_changes.specialRequests;
          }
          break;
      }
      // Update booking record
      await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking_id);
      // Update related records if needed (e.g., split payments for participant changes)
      if (modification_type === MODIFICATION_CONFIG.types.PARTICIPANT_UPDATE) {
        await this.updateRelatedPaymentRecords(booking_id, requested_changes);
      }
    } catch (error) {
      throw new Error(`Failed to apply modification to booking: ${error.message}`);
    }
  },
  /**
   * Update payment records for participant changes
   */
  async updateRelatedPaymentRecords(bookingId, changes) {
    if (!changes.participantCount) return;
    try {
      // Get existing split payments
      const { data: splitPayments } = await supabase
        .from('split_payments')
        .select('*')
        .eq('booking_id', bookingId);
      for (const splitPayment of splitPayments || []) {
        // Recalculate payment amounts based on new participant count
        const newAmountPerPerson = Math.round(splitPayment.total_amount / changes.participantCount);
        await supabase
          .from('split_payments')
          .update({
            participant_count: changes.participantCount,
            amount_per_person: newAmountPerPerson,
            updated_at: new Date().toISOString(),
          })
          .eq('id', splitPayment.id);
      }
    } catch (error) {
    }
  },
  /**
   * Send modification confirmation notifications
   */
  async sendModificationConfirmation(modificationRequest, autoApproved = false) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          adventures (title, vendor_id),
          users (email, name)
        `)
        .eq('id', modificationRequest.booking_id)
        .single();
      // Notify user
      const userNotification = {
        userId: modificationRequest.user_id,
        type: autoApproved ? 'modification_approved' : 'modification_confirmed',
        title: autoApproved ? 'Modification Approved' : 'Modification Confirmed',
        message: `Your booking modification for "${booking.adventures.title}" has been ${autoApproved ? 'automatically approved' : 'confirmed'}.`,
        data: {
          booking_id: modificationRequest.booking_id,
          modification_id: modificationRequest.id,
          modification_type: modificationRequest.modification_type,
        },
        channels: ['push', 'email'],
        priority: 'normal',
      };
      await notificationService.sendNotification(userNotification);
      // Notify vendor if not auto-approved
      if (!autoApproved) {
        const vendorNotification = {
          userId: booking.adventures.vendor_id,
          type: 'modification_processed',
          title: 'Booking Modification Processed',
          message: `A booking modification has been processed for "${booking.adventures.title}".`,
          data: {
            booking_id: modificationRequest.booking_id,
            modification_id: modificationRequest.id,
            modification_type: modificationRequest.modification_type,
          },
          channels: ['push', 'email'],
          priority: 'normal',
        };
        await notificationService.sendNotification(vendorNotification);
      }
    } catch (error) {
    }
  },
  /**
   * Notify vendor of modification request
   */
  async notifyVendorOfModificationRequest(modificationRequest, booking) {
    try {
      const notification = {
        userId: booking.adventures.vendor_id,
        type: 'modification_request',
        title: 'Booking Modification Request',
        message: `A customer has requested a modification for booking "${booking.adventures.title}". Please review and respond within 48 hours.`,
        data: {
          booking_id: modificationRequest.booking_id,
          modification_id: modificationRequest.id,
          modification_type: modificationRequest.modification_type,
          deadline: modificationRequest.vendor_response_deadline,
        },
        channels: ['push', 'email'],
        priority: 'high',
      };
      await notificationService.sendNotification(notification);
    } catch (error) {
    }
  },
  /**
   * Get modification history for a booking
   */
  async getModificationHistory(bookingId, userId) {
    try {
      // Verify access
      await this.validateModificationPermission(bookingId, userId);
      const { data: modifications, error } = await supabase
        .from('booking_modifications')
        .select(`
          *,
          approved_by_user:users!booking_modifications_approved_by_fkey(name, email),
          audit_logs (*)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return modifications;
    } catch (error) {
      throw new Error(`Failed to get modification history: ${error.message}`);
    }
  },
  /**
   * Create audit log entry
   */
  async createAuditLogEntry(logData) {
    try {
      await supabase
        .from('booking_audit_logs')
        .insert({
          ...logData,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
    }
  },
};
/**
 * Vendor modification approval manager
 */
export const vendorModificationManager = {
  /**
   * Get pending modification requests for vendor
   */
  async getPendingModifications(vendorId) {
    try {
      const { data: modifications, error } = await supabase
        .from('booking_modifications')
        .select(`
          *,
          bookings!inner (
            id,
            adventures!inner (
              vendor_id,
              title,
              start_date
            ),
            users (name, email)
          )
        `)
        .eq('bookings.adventures.vendor_id', vendorId)
        .eq('status', 'pending_vendor_review')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return modifications;
    } catch (error) {
      throw new Error(`Failed to get pending modifications: ${error.message}`);
    }
  },
  /**
   * Approve or reject modification request
   */
  async processModificationRequest(modificationId, vendorId, decision, notes = '') {
    const { approved, rejectionReason } = decision;
    try {
      // Verify vendor permission
      const { data: modification, error: modError } = await supabase
        .from('booking_modifications')
        .select(`
          *,
          bookings!inner (
            adventures!inner (vendor_id)
          )
        `)
        .eq('id', modificationId)
        .single();
      if (modError) throw new Error('Modification request not found');
      if (modification.bookings.adventures.vendor_id !== vendorId) {
        throw new Error('You do not have permission to process this modification');
      }
      if (modification.status !== 'pending_vendor_review') {
        throw new Error('This modification has already been processed');
      }
      // Update modification status
      const updateData = {
        status: approved ? 'approved' : 'rejected',
        approved_by: vendorId,
        approval_notes: notes,
        rejection_reason: rejectionReason,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (approved) {
        updateData.approved_at = new Date().toISOString();
      } else {
        updateData.rejected_at = new Date().toISOString();
      }
      await supabase
        .from('booking_modifications')
        .update(updateData)
        .eq('id', modificationId);
      // Apply modification if approved
      if (approved) {
        await bookingModificationManager.applyModificationToBooking(modification);
      }
      // Send notifications
      await this.sendDecisionNotification(modification, approved, notes, rejectionReason);
      // Create audit log
      await bookingModificationManager.createAuditLogEntry({
        booking_id: modification.booking_id,
        modification_request_id: modificationId,
        action: approved ? 'modification_approved' : 'modification_rejected',
        actor_id: vendorId,
        actor_type: 'vendor',
        details: {
          notes,
          rejectionReason,
        },
      });
      return {
        success: true,
        approved,
        modificationId,
      };
    } catch (error) {
      throw new Error(`Failed to process modification request: ${error.message}`);
    }
  },
  /**
   * Send decision notification to user
   */
  async sendDecisionNotification(modification, approved, notes, rejectionReason) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          adventures (title),
          users (email, name)
        `)
        .eq('id', modification.booking_id)
        .single();
      const notification = {
        userId: modification.user_id,
        type: approved ? 'modification_approved' : 'modification_rejected',
        title: approved ? 'Modification Approved' : 'Modification Rejected',
        message: approved
          ? `Your modification request for "${booking.adventures.title}" has been approved.`
          : `Your modification request for "${booking.adventures.title}" has been rejected. ${rejectionReason || ''}`,
        data: {
          booking_id: modification.booking_id,
          modification_id: modification.id,
          approved,
          notes,
          rejectionReason,
        },
        channels: ['push', 'email'],
        priority: approved ? 'normal' : 'high',
      };
      await notificationService.sendNotification(notification);
    } catch (error) {
    }
  },
  /**
   * Set vendor auto-approval rules
   */
  async setAutoApprovalRules(vendorId, rules) {
    try {
      await supabase
        .from('vendors')
        .update({
          modification_settings: {
            autoApproveTypes: rules.autoApproveTypes || [],
            customFees: rules.customFees || {},
            blacklistTypes: rules.blacklistTypes || [],
            requireApprovalForFees: rules.requireApprovalForFees || false,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendorId);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to set auto-approval rules: ${error.message}`);
    }
  },
};
/**
 * Cancellation policy engine
 */
export const cancellationPolicyEngine = {
  /**
   * Evaluate cancellation policy for a booking
   */
  async evaluateCancellationPolicy(bookingId, cancellationType = 'full', requestedAt = new Date()) {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          adventures (
            id,
            title,
            start_date,
            end_date,
            cancellation_policy,
            vendor_id,
            vendors (
              id,
              name,
              cancellation_policy,
              refund_policy
            )
          ),
          split_payments (
            id,
            total_amount,
            status,
            individual_payments (*)
          )
        `)
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      // Use vendor policy if available, otherwise adventure policy, otherwise default
      const vendorPolicy = booking.adventures.vendors?.cancellation_policy || {};
      const adventurePolicy = booking.adventures.cancellation_policy || {};
      const defaultPolicy = {
        fullRefundHours: 72,
        partialRefundHours: 24,
        noRefundHours: 0,
        partialRefundPercentage: 50,
        emergencyRefundAllowed: true,
        medicalRefundAllowed: true,
        weatherRefundAllowed: true,
        vendorCancellationFullRefund: true,
        cancellationFeePercent: 0,
        processingFeeWaived: false,
      };
      const policy = { ...defaultPolicy, ...adventurePolicy, ...vendorPolicy };
      // Calculate time until trip starts
      const tripStart = new Date(booking.adventures.start_date);
      const hoursUntilStart = (tripStart - requestedAt) / (1000 * 60 * 60);
      // Calculate refund eligibility
      const eligibility = await refundPolicyEngine.evaluateRefundEligibility(bookingId, requestedAt);
      // Calculate fees and refund amounts
      const paymentStats = booking.split_payments?.length > 0
        ? groupPaymentManager.calculatePaymentStats(booking.split_payments[0].individual_payments)
        : { totalPaid: booking.total_amount || 0 };
      const refundCalculation = refundPolicyEngine.calculateRefundAmount(
        paymentStats.totalPaid,
        eligibility,
        {
          platformFee: policy.cancellationFeePercent * paymentStats.totalPaid,
          processingFee: policy.processingFeeWaived ? 0 : Math.round(paymentStats.totalPaid * 0.029),
        }
      );
      return {
        policy,
        eligibility,
        refundCalculation,
        hoursUntilStart: Math.max(0, hoursUntilStart),
        cancellationType,
        booking: {
          id: booking.id,
          title: booking.adventures.title,
          startDate: booking.adventures.start_date,
          totalAmount: paymentStats.totalPaid,
          status: booking.status,
        },
      };
    } catch (error) {
      throw new Error(`Failed to evaluate cancellation policy: ${error.message}`);
    }
  },
  /**
   * Process booking cancellation
   */
  async processCancellation(cancellationRequest) {
    const {
      bookingId,
      userId,
      cancellationType = 'full',
      reason,
      specialCircumstances,
      evidence = {},
    } = cancellationRequest;
    try {
      // Evaluate cancellation policy
      const policyEvaluation = await this.evaluateCancellationPolicy(bookingId, cancellationType);
      // Check special circumstances
      let finalEligibility = policyEvaluation.eligibility;
      if (specialCircumstances) {
        const specialRules = refundPolicyEngine.evaluateSpecialCircumstances(specialCircumstances, evidence);
        if (specialRules && specialRules.eligible) {
          finalEligibility = {
            eligible: true,
            refundType: 'special_circumstances',
            refundPercentage: specialRules.refundPercentage,
            reason: `Special circumstances: ${specialCircumstances}`,
            requiresEvidence: specialRules.requiresEvidence,
          };
        }
      }
      // Create cancellation record
      const { data: cancellation, error: cancelError } = await supabase
        .from('booking_cancellations')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          cancellation_type: cancellationType,
          reason,
          special_circumstances: specialCircumstances,
          evidence_provided: evidence,
          refund_eligible: finalEligibility.eligible,
          refund_percentage: finalEligibility.refundPercentage,
          refund_amount: policyEvaluation.refundCalculation.netRefund,
          policy_applied: policyEvaluation.policy,
          status: finalEligibility.requiresEvidence ? 'pending_evidence_review' : 'approved',
          created_at: new Date().toISOString(),
          metadata: {
            policy_evaluation: policyEvaluation,
            original_booking_amount: policyEvaluation.booking.totalAmount,
          },
        })
        .select()
        .single();
      if (cancelError) throw cancelError;
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
      // Process refund if eligible and approved
      if (finalEligibility.eligible && cancellation.status === 'approved') {
        await this.processRefund(cancellation, policyEvaluation);
      }
      // Send notifications
      await this.sendCancellationNotifications(cancellation, policyEvaluation);
      // Create audit log
      await bookingModificationManager.createAuditLogEntry({
        booking_id: bookingId,
        action: 'booking_cancelled',
        actor_id: userId,
        actor_type: 'user',
        details: {
          cancellation_type: cancellationType,
          reason,
          refund_eligible: finalEligibility.eligible,
          refund_amount: policyEvaluation.refundCalculation.netRefund,
        },
      });
      return {
        success: true,
        cancellation,
        refundEligible: finalEligibility.eligible,
        refundAmount: policyEvaluation.refundCalculation.netRefund,
        requiresEvidence: finalEligibility.requiresEvidence,
      };
    } catch (error) {
      throw new Error(`Failed to process cancellation: ${error.message}`);
    }
  },
  /**
   * Process partial cancellation for group bookings
   */
  async processPartialCancellation(partialCancellationRequest) {
    const {
      bookingId,
      userId,
      participantsToCancel,
      reason,
    } = partialCancellationRequest;
    try {
      // Get booking and validate group booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          split_payments (
            *,
            individual_payments (*)
          )
        `)
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      if (!booking.split_payments?.length) {
        throw new Error('Partial cancellation is only available for group bookings');
      }
      const splitPayment = booking.split_payments[0];
      // Validate participants to cancel
      const participantIds = participantsToCancel.map(p => p.userId);
      const validParticipants = splitPayment.individual_payments.filter(ip =>
        participantIds.includes(ip.user_id)
      );
      if (validParticipants.length !== participantsToCancel.length) {
        throw new Error('Some participants not found in this booking');
      }
      // Calculate refund for cancelled participants
      let totalRefundAmount = 0;
      const refundDetails = [];
      for (const participant of validParticipants) {
        if (participant.status === 'paid') {
          const paidAmount = participant.amount_paid || participant.amount_due;
          totalRefundAmount += paidAmount;
          refundDetails.push({
            userId: participant.user_id,
            originalAmount: paidAmount,
            refundAmount: paidAmount,
          });
        }
      }
      // Create partial cancellation record
      const { data: cancellation, error: cancelError } = await supabase
        .from('booking_cancellations')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          cancellation_type: 'partial',
          reason,
          participants_cancelled: participantsToCancel,
          refund_eligible: true,
          refund_amount: totalRefundAmount,
          status: 'approved',
          created_at: new Date().toISOString(),
          metadata: {
            refund_details: refundDetails,
            remaining_participants: splitPayment.participant_count - participantsToCancel.length,
          },
        })
        .select()
        .single();
      if (cancelError) throw cancelError;
      // Process individual refunds
      for (const participant of validParticipants) {
        if (participant.status === 'paid') {
          await manualRefundManager.processIndividualRefund(
            participant,
            {
              action: 'refund',
              refundType: 'full',
              refundAmount: participant.amount_paid || participant.amount_due,
              reason: 'partial_cancellation',
            },
            splitPayment.id
          );
        }
        // Update individual payment status
        await supabase
          .from('individual_payments')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', participant.id);
      }
      // Update split payment participant count
      const newParticipantCount = splitPayment.participant_count - participantsToCancel.length;
      await supabase
        .from('split_payments')
        .update({
          participant_count: newParticipantCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', splitPayment.id);
      // Send notifications
      await this.sendPartialCancellationNotifications(cancellation, booking, refundDetails);
      return {
        success: true,
        cancellation,
        refundAmount: totalRefundAmount,
        remainingParticipants: newParticipantCount,
      };
    } catch (error) {
      throw new Error(`Failed to process partial cancellation: ${error.message}`);
    }
  },
  /**
   * Process refund for approved cancellation
   */
  async processRefund(cancellation, policyEvaluation) {
    try {
      // Get split payments for this booking
      const { data: splitPayments } = await supabase
        .from('split_payments')
        .select('*, individual_payments (*)')
        .eq('booking_id', cancellation.booking_id);
      if (splitPayments?.length > 0) {
        // Process group payment refund
        await manualRefundManager.processManualRefund({
          splitPaymentId: splitPayments[0].id,
          organizerId: cancellation.user_id,
          reason: 'booking_cancelled',
          refundType: cancellation.refund_percentage === 100 ? 'full' : 'partial',
        });
      } else {
        // Process individual booking refund
        // This would integrate with individual payment processing
      }
    } catch (error) {
    }
  },
  /**
   * Send cancellation notifications
   */
  async sendCancellationNotifications(cancellation, policyEvaluation) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          adventures (title, vendor_id),
          users (email, name)
        `)
        .eq('id', cancellation.booking_id)
        .single();
      // Notify user
      const userNotification = {
        userId: cancellation.user_id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your booking for "${booking.adventures.title}" has been cancelled.`,
        data: {
          booking_id: cancellation.booking_id,
          cancellation_id: cancellation.id,
          refund_eligible: cancellation.refund_eligible,
          refund_amount: cancellation.refund_amount,
        },
        channels: ['push', 'email'],
        priority: 'normal',
      };
      await notificationService.sendNotification(userNotification);
      // Notify vendor
      const vendorNotification = {
        userId: booking.adventures.vendor_id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `A booking for "${booking.adventures.title}" has been cancelled by the customer.`,
        data: {
          booking_id: cancellation.booking_id,
          cancellation_id: cancellation.id,
          reason: cancellation.reason,
        },
        channels: ['push', 'email'],
        priority: 'normal',
      };
      await notificationService.sendNotification(vendorNotification);
    } catch (error) {
    }
  },
  /**
   * Send partial cancellation notifications
   */
  async sendPartialCancellationNotifications(cancellation, booking, refundDetails) {
    try {
      // Notify each cancelled participant
      for (const participant of refundDetails) {
        const notification = {
          userId: participant.userId,
          type: 'partial_cancellation',
          title: 'Booking Cancellation Confirmed',
          message: `Your participation in "${booking.adventures?.title}" has been cancelled. Your refund is being processed.`,
          data: {
            booking_id: cancellation.booking_id,
            cancellation_id: cancellation.id,
            refund_amount: participant.refundAmount,
          },
          channels: ['push', 'email'],
          priority: 'normal',
        };
        await notificationService.sendNotification(notification);
      }
    } catch (error) {
    }
  },
};
// Export configuration
export const getModificationConfig = () => MODIFICATION_CONFIG;
// Main export
export default {
  bookingModificationManager,
  vendorModificationManager,
  cancellationPolicyEngine,
  getModificationConfig,
};