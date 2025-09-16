/**
 * Automated Payout Scheduler Service
 * Handles scheduled vendor payouts with configurable timing and rules
 */
import { supabase } from '../lib/supabase.js';
import { payoutProcessingService } from './payout-processing-service.js';
// Payout schedule configurations
const PAYOUT_SCHEDULES = {
  DAILY: {
    interval: 'daily',
    cronPattern: '0 2 * * *', // 2 AM daily
    description: 'Daily at 2:00 AM',
  },
  WEEKLY: {
    interval: 'weekly',
    cronPattern: '0 2 * * 1', // 2 AM every Monday
    description: 'Weekly on Monday at 2:00 AM',
  },
  BIWEEKLY: {
    interval: 'biweekly',
    cronPattern: '0 2 * * 1/2', // 2 AM every other Monday
    description: 'Bi-weekly on Monday at 2:00 AM',
  },
  MONTHLY: {
    interval: 'monthly',
    cronPattern: '0 2 1 * *', // 2 AM on 1st of month
    description: 'Monthly on the 1st at 2:00 AM',
  },
};
// Default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  schedule: PAYOUT_SCHEDULES.WEEKLY,
  minimumAmount: 2000, // $20.00 in cents
  maxRetries: 3,
  retryDelay: 3600000, // 1 hour in milliseconds
  batchSize: 50,
  processingTimeout: 300000, // 5 minutes
};
class PayoutSchedulerService {
  constructor() {
    this.isRunning = false;
    this.scheduledJobs = new Map();
    this.config = { ...DEFAULT_CONFIG };
    this.processingQueue = [];
    this.activeProcessors = 0;
    this.maxConcurrentProcessors = 3;
  }
  /**
   * Initialize the scheduler service
   */
  async initialize() {
    try {
      // Load configuration from database or environment
      await this.loadConfiguration();
      // Set up scheduled jobs for all vendors
      await this.setupScheduledJobs();
      // Start the main scheduler loop
      this.start();
      console.log('Payout scheduler service initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize payout scheduler:', error);
      throw error;
    }
  }
  /**
   * Load configuration from database
   */
  async loadConfiguration() {
    try {
      // Try to load global configuration
      const { data: globalConfig, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'payout_scheduler_config')
        .single();
      if (!error && globalConfig) {
        this.config = { ...this.config, ...JSON.parse(globalConfig.setting_value) };
      }
    } catch (error) {
      console.warn('Could not load payout scheduler configuration, using defaults:', error.message);
    }
  }
  /**
   * Setup scheduled jobs for all active vendors
   */
  async setupScheduledJobs() {
    try {
      const { data: vendors, error } = await supabase
        .from('vendor_stripe_accounts')
        .select(`
          id,
          user_id,
          stripe_account_id,
          payout_schedule_interval,
          minimum_payout_amount,
          payouts_enabled,
          status
        `)
        .eq('status', 'active')
        .eq('payouts_enabled', true);
      if (error) throw error;
      for (const vendor of vendors) {
        await this.scheduleVendorPayouts(vendor);
      }
      console.log(`Set up scheduled payouts for ${vendors.length} vendors`);
    } catch (error) {
      console.error('Failed to setup scheduled jobs:', error);
      throw error;
    }
  }
  /**
   * Schedule payouts for a specific vendor
   */
  async scheduleVendorPayouts(vendor) {
    const scheduleKey = vendor.stripe_account_id;
    const interval = vendor.payout_schedule_interval || 'weekly';
    const schedule = PAYOUT_SCHEDULES[interval.toUpperCase()] || PAYOUT_SCHEDULES.WEEKLY;
    // Calculate next execution time based on schedule
    const nextExecution = this.calculateNextExecution(schedule);
    const job = {
      vendorId: vendor.id,
      stripeAccountId: vendor.stripe_account_id,
      userId: vendor.user_id,
      schedule: schedule,
      nextExecution: nextExecution,
      minimumAmount: vendor.minimum_payout_amount || this.config.minimumAmount,
      retryCount: 0,
      lastExecuted: null,
      status: 'scheduled',
    };
    this.scheduledJobs.set(scheduleKey, job);
    console.log(`Scheduled ${interval} payouts for vendor ${vendor.stripe_account_id} at ${nextExecution}`);
  }
  /**
   * Calculate next execution time based on cron pattern
   */
  calculateNextExecution(schedule) {
    const now = new Date();
    const next = new Date(now);
    switch (schedule.interval) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(2, 0, 0, 0);
        break;
      case 'weekly':
        const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
        next.setDate(next.getDate() + daysUntilMonday);
        next.setHours(2, 0, 0, 0);
        break;
      case 'biweekly':
        const weekNumber = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        const weeksUntilNext = weekNumber % 2 === 0 ? 1 : 2;
        const daysUntilNextBiweekly = (8 - next.getDay()) % 7 || 7;
        next.setDate(next.getDate() + daysUntilNextBiweekly + (weeksUntilNext - 1) * 7);
        next.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1, 1);
        next.setHours(2, 0, 0, 0);
        break;
      default:
        next.setDate(next.getDate() + 7);
        next.setHours(2, 0, 0, 0);
    }
    return next;
  }
  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.warn('Payout scheduler is already running');
      return;
    }
    this.isRunning = true;
    console.log('Starting payout scheduler...');
    // Run scheduler check every 5 minutes
    this.schedulerInterval = setInterval(() => {
      this.processScheduledJobs();
    }, 5 * 60 * 1000);
    // Initial run
    setTimeout(() => this.processScheduledJobs(), 1000);
  }
  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.warn('Payout scheduler is not running');
      return;
    }
    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    console.log('Payout scheduler stopped');
  }
  /**
   * Process all scheduled jobs
   */
  async processScheduledJobs() {
    if (!this.config.enabled) {
      return;
    }
    const now = new Date();
    const jobsToExecute = [];
    for (const [key, job] of this.scheduledJobs) {
      if (job.status === 'scheduled' && job.nextExecution <= now) {
        jobsToExecute.push(job);
      }
    }
    if (jobsToExecute.length === 0) {
      return;
    }
    console.log(`Processing ${jobsToExecute.length} scheduled payout jobs`);
    for (const job of jobsToExecute) {
      try {
        await this.executePayoutJob(job);
      } catch (error) {
        console.error(`Failed to execute payout job for vendor ${job.stripeAccountId}:`, error);
        await this.handleJobFailure(job, error);
      }
    }
  }
  /**
   * Execute a single payout job
   */
  async executePayoutJob(job) {
    const { vendorId, stripeAccountId, minimumAmount } = job;
    // Update job status
    job.status = 'processing';
    job.lastExecuted = new Date();
    try {
      // Check if vendor has pending payouts above minimum threshold
      const pendingAmount = await this.calculatePendingPayoutAmount(vendorId);
      if (pendingAmount < minimumAmount) {
        console.log(`Vendor ${stripeAccountId} has ${pendingAmount} cents pending, below minimum ${minimumAmount} cents`);
        // Schedule next execution
        job.nextExecution = this.calculateNextExecution(job.schedule);
        job.status = 'scheduled';
        return;
      }
      // Add to processing queue
      this.processingQueue.push({
        job,
        pendingAmount,
        timestamp: Date.now(),
      });
      // Process queue if not at capacity
      if (this.activeProcessors < this.maxConcurrentProcessors) {
        this.processQueue();
      }
    } catch (error) {
      job.status = 'failed';
      throw error;
    }
  }
  /**
   * Process the payout queue
   */
  async processQueue() {
    if (this.processingQueue.length === 0 || this.activeProcessors >= this.maxConcurrentProcessors) {
      return;
    }
    this.activeProcessors++;
    try {
      const queueItem = this.processingQueue.shift();
      if (!queueItem) {
        return;
      }
      const { job, pendingAmount } = queueItem;
      // Process the actual payout
      const result = await payoutProcessingService.processVendorPayout({
        vendorStripeAccountId: job.vendorId,
        amount: pendingAmount,
        currency: 'usd',
        description: `Scheduled payout for ${job.schedule.interval} period`,
      });
      if (result.success) {
        // Update job for next execution
        job.nextExecution = this.calculateNextExecution(job.schedule);
        job.status = 'scheduled';
        job.retryCount = 0;
        console.log(`Successfully processed payout for vendor ${job.stripeAccountId}: ${pendingAmount} cents`);
      } else {
        throw new Error(result.error || 'Payout processing failed');
      }
    } catch (error) {
      console.error('Error processing payout queue item:', error);
    } finally {
      this.activeProcessors--;
      // Continue processing queue if items remain
      if (this.processingQueue.length > 0 && this.activeProcessors < this.maxConcurrentProcessors) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }
  /**
   * Calculate pending payout amount for a vendor
   */
  async calculatePendingPayoutAmount(vendorStripeAccountId) {
    try {
      const { data, error } = await supabase
        .from('booking_payments')
        .select(`
          net_amount,
          status,
          payout_status
        `)
        .eq('vendor_stripe_account_id', vendorStripeAccountId)
        .eq('status', 'completed')
        .in('payout_status', ['pending', 'eligible']);
      if (error) throw error;
      const totalPending = data.reduce((sum, payment) => sum + (payment.net_amount || 0), 0);
      return totalPending;
    } catch (error) {
      console.error('Failed to calculate pending payout amount:', error);
      return 0;
    }
  }
  /**
   * Handle job failure with retry logic
   */
  async handleJobFailure(job, error) {
    job.retryCount += 1;
    job.status = 'failed';
    if (job.retryCount < this.config.maxRetries) {
      // Schedule retry
      const retryDelay = this.config.retryDelay * Math.pow(2, job.retryCount - 1);
      job.nextExecution = new Date(Date.now() + retryDelay);
      job.status = 'scheduled';
      console.log(`Scheduling retry for vendor ${job.stripeAccountId} in ${retryDelay}ms (attempt ${job.retryCount})`);
    } else {
      console.error(`Max retries exceeded for vendor ${job.stripeAccountId}:`, error);
      // Log failure to database for manual review
      await this.logFailedPayout(job, error);
    }
  }
  /**
   * Log failed payout for manual review
   */
  async logFailedPayout(job, error) {
    try {
      await supabase
        .from('payout_failures')
        .insert({
          vendor_stripe_account_id: job.vendorId,
          error_message: error.message,
          error_details: JSON.stringify({
            job: job,
            error: error.stack,
            timestamp: new Date().toISOString(),
          }),
          retry_count: job.retryCount,
          requires_manual_review: true,
        });
    } catch (logError) {
      console.error('Failed to log payout failure:', logError);
    }
  }
  /**
   * Update vendor payout schedule
   */
  async updateVendorSchedule(stripeAccountId, scheduleConfig) {
    try {
      const { interval, minimumAmount, enabled } = scheduleConfig;
      // Update database
      const { error } = await supabase
        .from('vendor_stripe_accounts')
        .update({
          payout_schedule_interval: interval,
          minimum_payout_amount: minimumAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', stripeAccountId);
      if (error) throw error;
      // Update scheduled job
      const job = this.scheduledJobs.get(stripeAccountId);
      if (job) {
        job.schedule = PAYOUT_SCHEDULES[interval.toUpperCase()] || PAYOUT_SCHEDULES.WEEKLY;
        job.minimumAmount = minimumAmount;
        job.nextExecution = this.calculateNextExecution(job.schedule);
        if (!enabled) {
          job.status = 'disabled';
        } else if (job.status === 'disabled') {
          job.status = 'scheduled';
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to update vendor schedule:', error);
      throw error;
    }
  }
  /**
   * Get vendor payout schedule status
   */
  getVendorScheduleStatus(stripeAccountId) {
    const job = this.scheduledJobs.get(stripeAccountId);
    if (!job) {
      return { scheduled: false };
    }
    return {
      scheduled: true,
      status: job.status,
      nextExecution: job.nextExecution,
      schedule: job.schedule,
      minimumAmount: job.minimumAmount,
      retryCount: job.retryCount,
      lastExecuted: job.lastExecuted,
    };
  }
  /**
   * Manually trigger payout for a vendor
   */
  async triggerManualPayout(stripeAccountId, options = {}) {
    const job = this.scheduledJobs.get(stripeAccountId);
    if (!job) {
      throw new Error('Vendor not found in scheduler');
    }
    const { forceMinimum = false } = options;
    try {
      const pendingAmount = await this.calculatePendingPayoutAmount(job.vendorId);
      if (!forceMinimum && pendingAmount < job.minimumAmount) {
        throw new Error(`Pending amount ${pendingAmount} is below minimum ${job.minimumAmount}`);
      }
      // Process immediate payout
      const result = await payoutProcessingService.processVendorPayout({
        vendorStripeAccountId: job.vendorId,
        amount: pendingAmount,
        currency: 'usd',
        description: 'Manual payout request',
      });
      return result;
    } catch (error) {
      console.error('Failed to trigger manual payout:', error);
      throw error;
    }
  }
  /**
   * Get scheduler statistics
   */
  getStatistics() {
    const stats = {
      isRunning: this.isRunning,
      totalJobs: this.scheduledJobs.size,
      activeProcessors: this.activeProcessors,
      queueLength: this.processingQueue.length,
      config: this.config,
      jobs: {},
    };
    for (const [key, job] of this.scheduledJobs) {
      stats.jobs[key] = {
        status: job.status,
        nextExecution: job.nextExecution,
        retryCount: job.retryCount,
        lastExecuted: job.lastExecuted,
      };
    }
    return stats;
  }
}
// Create singleton instance
const payoutSchedulerService = new PayoutSchedulerService();
export { payoutSchedulerService, PAYOUT_SCHEDULES };
export default payoutSchedulerService;