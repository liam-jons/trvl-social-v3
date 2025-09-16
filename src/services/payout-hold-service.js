/**
 * Payout Hold Service
 * Manages payout holds and releases for vendor accounts
 */

import { supabase } from '../lib/supabase.js';

// Hold types and reasons
const HOLD_TYPES = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  DISPUTE: 'dispute',
  COMPLIANCE: 'compliance',
  RISK: 'risk',
};

const HOLD_REASONS = {
  MANUAL_REVIEW: 'manual_review',
  HIGH_RISK_TRANSACTION: 'high_risk_transaction',
  DISPUTE_INVESTIGATION: 'dispute_investigation',
  COMPLIANCE_CHECK: 'compliance_check',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ACCOUNT_VERIFICATION: 'account_verification',
  POLICY_VIOLATION: 'policy_violation',
  CUSTOMER_COMPLAINT: 'customer_complaint',
};

class PayoutHoldService {
  constructor() {
    this.activeHolds = new Map();
  }

  /**
   * Initialize the hold service
   */
  async initialize() {
    try {
      await this.loadActiveHolds();
      console.log('Payout hold service initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize payout hold service:', error);
      throw error;
    }
  }

  /**
   * Load all active holds into memory
   */
  async loadActiveHolds() {
    try {
      const { data: holds, error } = await supabase
        .from('payout_holds')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      this.activeHolds.clear();
      for (const hold of holds) {
        this.activeHolds.set(hold.vendor_stripe_account_id, hold);
      }

      console.log(`Loaded ${holds.length} active payout holds`);
    } catch (error) {
      console.error('Failed to load active holds:', error);
      throw error;
    }
  }

  /**
   * Place a hold on vendor payouts
   */
  async placeHold(holdData) {
    const {
      vendorStripeAccountId,
      type = HOLD_TYPES.MANUAL,
      reason = HOLD_REASONS.MANUAL_REVIEW,
      description,
      duration = null, // null for indefinite hold
      metadata = {},
      placedBy = null,
    } = holdData;

    if (!vendorStripeAccountId) {
      throw new Error('Vendor Stripe account ID is required');
    }

    try {
      // Check if hold already exists
      const existingHold = this.activeHolds.get(vendorStripeAccountId);
      if (existingHold) {
        throw new Error('Payout hold already exists for this vendor');
      }

      // Calculate release date if duration specified
      let releaseDate = null;
      if (duration) {
        releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + duration);
      }

      // Create hold record
      const holdRecord = {
        vendor_stripe_account_id: vendorStripeAccountId,
        type,
        reason,
        description: description || `${reason} hold`,
        status: 'active',
        placed_at: new Date().toISOString(),
        release_date: releaseDate?.toISOString(),
        placed_by: placedBy,
        metadata: {
          ...metadata,
          original_duration_days: duration,
        },
      };

      const { data, error } = await supabase
        .from('payout_holds')
        .insert(holdRecord)
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      this.activeHolds.set(vendorStripeAccountId, data);

      // Log the hold action
      await this.logHoldAction(data.id, 'placed', {
        type,
        reason,
        description,
        placed_by: placedBy,
      });

      console.log(`Placed ${type} payout hold for vendor ${vendorStripeAccountId}: ${reason}`);

      return {
        success: true,
        holdId: data.id,
        holdData: data,
      };

    } catch (error) {
      console.error('Failed to place payout hold:', error);
      throw error;
    }
  }

  /**
   * Release a payout hold
   */
  async releaseHold(vendorStripeAccountId, releaseData = {}) {
    const {
      reason = 'Manual release',
      releasedBy = null,
      metadata = {},
    } = releaseData;

    try {
      const hold = this.activeHolds.get(vendorStripeAccountId);
      if (!hold) {
        throw new Error('No active hold found for this vendor');
      }

      // Update hold record
      const { error } = await supabase
        .from('payout_holds')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          release_reason: reason,
          released_by: releasedBy,
          metadata: {
            ...hold.metadata,
            ...metadata,
            release_details: {
              reason,
              released_by: releasedBy,
              released_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', hold.id);

      if (error) throw error;

      // Remove from active holds
      this.activeHolds.delete(vendorStripeAccountId);

      // Log the release action
      await this.logHoldAction(hold.id, 'released', {
        reason,
        released_by: releasedBy,
      });

      // Check if there are pending payouts to process
      await this.processPendingPayoutsAfterRelease(vendorStripeAccountId);

      console.log(`Released payout hold for vendor ${vendorStripeAccountId}: ${reason}`);

      return {
        success: true,
        holdId: hold.id,
      };

    } catch (error) {
      console.error('Failed to release payout hold:', error);
      throw error;
    }
  }

  /**
   * Check if vendor has an active hold
   */
  hasActiveHold(vendorStripeAccountId) {
    return this.activeHolds.has(vendorStripeAccountId);
  }

  /**
   * Get active hold details
   */
  getActiveHold(vendorStripeAccountId) {
    return this.activeHolds.get(vendorStripeAccountId) || null;
  }

  /**
   * Get all active holds
   */
  getAllActiveHolds() {
    return Array.from(this.activeHolds.values());
  }

  /**
   * Update hold details
   */
  async updateHold(vendorStripeAccountId, updates) {
    try {
      const hold = this.activeHolds.get(vendorStripeAccountId);
      if (!hold) {
        throw new Error('No active hold found for this vendor');
      }

      const { error } = await supabase
        .from('payout_holds')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hold.id);

      if (error) throw error;

      // Update local cache
      const updatedHold = { ...hold, ...updates };
      this.activeHolds.set(vendorStripeAccountId, updatedHold);

      // Log the update
      await this.logHoldAction(hold.id, 'updated', updates);

      return {
        success: true,
        holdData: updatedHold,
      };

    } catch (error) {
      console.error('Failed to update payout hold:', error);
      throw error;
    }
  }

  /**
   * Extend hold duration
   */
  async extendHold(vendorStripeAccountId, extensionData) {
    const {
      additionalDays,
      reason = 'Hold extension',
      extendedBy = null,
    } = extensionData;

    try {
      const hold = this.activeHolds.get(vendorStripeAccountId);
      if (!hold) {
        throw new Error('No active hold found for this vendor');
      }

      const currentReleaseDate = hold.release_date ? new Date(hold.release_date) : new Date();
      const newReleaseDate = new Date(currentReleaseDate);
      newReleaseDate.setDate(newReleaseDate.getDate() + additionalDays);

      await this.updateHold(vendorStripeAccountId, {
        release_date: newReleaseDate.toISOString(),
        metadata: {
          ...hold.metadata,
          extensions: [
            ...(hold.metadata.extensions || []),
            {
              extended_at: new Date().toISOString(),
              additional_days: additionalDays,
              reason,
              extended_by: extendedBy,
            },
          ],
        },
      });

      console.log(`Extended payout hold for vendor ${vendorStripeAccountId} by ${additionalDays} days`);

      return { success: true };

    } catch (error) {
      console.error('Failed to extend payout hold:', error);
      throw error;
    }
  }

  /**
   * Check for expired holds and auto-release them
   */
  async processExpiredHolds() {
    try {
      const now = new Date();
      const expiredHolds = [];

      for (const [vendorId, hold] of this.activeHolds) {
        if (hold.release_date && new Date(hold.release_date) <= now) {
          expiredHolds.push({ vendorId, hold });
        }
      }

      if (expiredHolds.length === 0) {
        return { processed: 0 };
      }

      console.log(`Processing ${expiredHolds.length} expired holds`);

      for (const { vendorId, hold } of expiredHolds) {
        try {
          await this.releaseHold(vendorId, {
            reason: 'Automatic release - hold expired',
            releasedBy: 'system',
          });
        } catch (error) {
          console.error(`Failed to auto-release expired hold for vendor ${vendorId}:`, error);
        }
      }

      return { processed: expiredHolds.length };

    } catch (error) {
      console.error('Failed to process expired holds:', error);
      throw error;
    }
  }

  /**
   * Log hold action for audit trail
   */
  async logHoldAction(holdId, action, details) {
    try {
      await supabase
        .from('payout_hold_logs')
        .insert({
          hold_id: holdId,
          action,
          details: JSON.stringify(details),
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log hold action:', error);
    }
  }

  /**
   * Process pending payouts after hold release
   */
  async processPendingPayoutsAfterRelease(vendorStripeAccountId) {
    try {
      // Check if vendor has automatic payouts enabled
      const { data: account, error } = await supabase
        .from('vendor_stripe_accounts')
        .select('payouts_enabled, payout_schedule_interval')
        .eq('id', vendorStripeAccountId)
        .single();

      if (error || !account.payouts_enabled) {
        return;
      }

      // Import the scheduler service to trigger immediate payout check
      const { payoutSchedulerService } = await import('./payout-scheduler-service.js');

      // Trigger manual payout if minimum threshold is met
      try {
        await payoutSchedulerService.triggerManualPayout(vendorStripeAccountId, {
          forceMinimum: false,
        });
      } catch (error) {
        console.log('No immediate payout needed after hold release:', error.message);
      }

    } catch (error) {
      console.error('Failed to process pending payouts after hold release:', error);
    }
  }

  /**
   * Get hold history for a vendor
   */
  async getHoldHistory(vendorStripeAccountId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      includeActive = true,
    } = options;

    try {
      let query = supabase
        .from('payout_holds')
        .select(`
          *,
          payout_hold_logs (
            action,
            details,
            timestamp
          )
        `)
        .eq('vendor_stripe_account_id', vendorStripeAccountId)
        .order('placed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!includeActive) {
        query = query.neq('status', 'active');
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Failed to get hold history:', error);
      throw error;
    }
  }

  /**
   * Get hold statistics
   */
  async getHoldStatistics() {
    try {
      const { data: allHolds, error } = await supabase
        .from('payout_holds')
        .select('type, reason, status, placed_at, released_at');

      if (error) throw error;

      const stats = {
        totalHolds: allHolds.length,
        activeHolds: this.activeHolds.size,
        releasedHolds: allHolds.filter(h => h.status === 'released').length,
        holdsByType: {},
        holdsByReason: {},
        averageHoldDuration: 0,
      };

      // Calculate breakdowns
      allHolds.forEach(hold => {
        stats.holdsByType[hold.type] = (stats.holdsByType[hold.type] || 0) + 1;
        stats.holdsByReason[hold.reason] = (stats.holdsByReason[hold.reason] || 0) + 1;
      });

      // Calculate average hold duration for released holds
      const releasedHolds = allHolds.filter(h => h.status === 'released' && h.released_at);
      if (releasedHolds.length > 0) {
        const totalDuration = releasedHolds.reduce((sum, hold) => {
          const duration = new Date(hold.released_at) - new Date(hold.placed_at);
          return sum + duration;
        }, 0);
        stats.averageHoldDuration = Math.round(totalDuration / releasedHolds.length / (1000 * 60 * 60 * 24)); // days
      }

      return stats;

    } catch (error) {
      console.error('Failed to get hold statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk release holds
   */
  async bulkReleaseHolds(vendorStripeAccountIds, releaseReason = 'Bulk release') {
    const results = [];

    for (const vendorId of vendorStripeAccountIds) {
      try {
        const result = await this.releaseHold(vendorId, {
          reason: releaseReason,
          releasedBy: 'admin',
        });
        results.push({ vendorId, success: true, result });
      } catch (error) {
        results.push({ vendorId, success: false, error: error.message });
      }
    }

    return results;
  }
}

// Create singleton instance
const payoutHoldService = new PayoutHoldService();

export { payoutHoldService, HOLD_TYPES, HOLD_REASONS };
export default payoutHoldService;