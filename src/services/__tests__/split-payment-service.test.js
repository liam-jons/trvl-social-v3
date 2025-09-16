/**
 * Split Payment Service Tests
 * Comprehensive test suite for payment splitting functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentSplitting, groupPaymentManager, paymentDeadlineManager } from '../split-payment-service';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-split-id' }, error: null }))
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-payment-id' }, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('Payment Splitting Algorithms', () => {
  describe('calculateEqualSplit', () => {
    it('should calculate equal split for even division', () => {
      const result = paymentSplitting.calculateEqualSplit(1000, 4);
      expect(result.splits).toEqual([250, 250, 250, 250]);
      expect(result.baseAmount).toBe(250);
      expect(result.remainder).toBe(0);
      expect(result.totalVerification).toBe(1000);
    });

    it('should handle remainder distribution', () => {
      const result = paymentSplitting.calculateEqualSplit(1001, 4);
      expect(result.splits).toEqual([251, 250, 250, 250]);
      expect(result.baseAmount).toBe(250);
      expect(result.remainder).toBe(1);
      expect(result.totalVerification).toBe(1001);
    });

    it('should throw error for invalid participant count', () => {
      expect(() => paymentSplitting.calculateEqualSplit(1000, 0)).toThrow();
      expect(() => paymentSplitting.calculateEqualSplit(1000, -1)).toThrow();
    });
  });

  describe('calculateCustomSplit', () => {
    it('should validate custom amounts match total', () => {
      const customAmounts = [300, 400, 300];
      const result = paymentSplitting.calculateCustomSplit(1000, customAmounts);
      expect(result.splits).toEqual(customAmounts);
      expect(result.totalVerification).toBe(1000);
      expect(result.isCustom).toBe(true);
    });

    it('should throw error when amounts dont match total', () => {
      const customAmounts = [300, 400, 200]; // Total: 900, expected: 1000
      expect(() => paymentSplitting.calculateCustomSplit(1000, customAmounts))
        .toThrow('Custom amounts (900) don\'t match total (1000)');
    });
  });

  describe('calculateSplitWithFees', () => {
    it('should calculate fees for organizer absorption', () => {
      const result = paymentSplitting.calculateSplitWithFees(1000, 4, 'organizer');
      expect(result.originalAmount).toBe(1000);
      expect(result.adjustedAmount).toBe(1000);
      expect(result.feeHandling).toBe('organizer');
      expect(result.totalFees).toBeGreaterThan(0);
    });

    it('should calculate fees for participant payment', () => {
      const result = paymentSplitting.calculateSplitWithFees(1000, 4, 'participants');
      expect(result.adjustedAmount).toBeGreaterThan(result.originalAmount);
      expect(result.feeHandling).toBe('participants');
    });

    it('should calculate fees for split payment', () => {
      const result = paymentSplitting.calculateSplitWithFees(1000, 4, 'split');
      expect(result.adjustedAmount).toBeGreaterThan(result.originalAmount);
      expect(result.feeHandling).toBe('split');
    });
  });

  describe('validateSplitConfiguration', () => {
    it('should validate correct configuration', () => {
      const participants = [
        { id: '1', name: 'John', email: 'john@test.com' },
        { id: '2', name: 'Jane', email: 'jane@test.com' }
      ];
      expect(() => paymentSplitting.validateSplitConfiguration(1000, participants)).not.toThrow();
    });

    it('should throw error for invalid total amount', () => {
      const participants = [{ id: '1', name: 'John', email: 'john@test.com' }];
      expect(() => paymentSplitting.validateSplitConfiguration(0, participants))
        .toThrow('Total amount must be greater than 0');
    });

    it('should throw error for no participants', () => {
      expect(() => paymentSplitting.validateSplitConfiguration(1000, []))
        .toThrow('At least one participant is required');
    });

    it('should throw error for too many participants', () => {
      const participants = Array.from({ length: 25 }, (_, i) => ({
        id: i.toString(),
        name: `User ${i}`,
        email: `user${i}@test.com`
      }));
      expect(() => paymentSplitting.validateSplitConfiguration(1000, participants))
        .toThrow('Group size exceeds maximum of 20');
    });

    it('should throw error for duplicate participants', () => {
      const participants = [
        { id: '1', name: 'John', email: 'john@test.com' },
        { id: '1', name: 'John Duplicate', email: 'john@test.com' }
      ];
      expect(() => paymentSplitting.validateSplitConfiguration(1000, participants))
        .toThrow('Duplicate participants detected');
    });
  });
});

describe('Group Payment Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSplitPayment', () => {
    it('should create split payment with valid data', async () => {
      const paymentData = {
        bookingId: 'booking-123',
        organizerId: 'organizer-123',
        totalAmount: 1000,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com' },
          { id: '2', name: 'Jane', email: 'jane@test.com' }
        ],
        splitType: 'equal',
        paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        vendorAccountId: 'vendor-123',
        description: 'Test booking'
      };

      const result = await groupPaymentManager.createSplitPayment(paymentData);
      expect(result.splitPaymentId).toBe('test-split-id');
      expect(mockSupabase.from).toHaveBeenCalledWith('split_payments');
    });

    it('should throw error for invalid split type', async () => {
      const paymentData = {
        bookingId: 'booking-123',
        organizerId: 'organizer-123',
        totalAmount: 1000,
        participants: [{ id: '1', name: 'John', email: 'john@test.com' }],
        splitType: 'invalid',
        paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        vendorAccountId: 'vendor-123',
        description: 'Test booking'
      };

      await expect(groupPaymentManager.createSplitPayment(paymentData))
        .rejects.toThrow('Invalid split type or missing custom splits');
    });
  });

  describe('calculatePaymentStats', () => {
    it('should calculate correct payment statistics', () => {
      const individualPayments = [
        { amount_due: 250, amount_paid: 250, status: 'paid' },
        { amount_due: 250, amount_paid: 0, status: 'pending' },
        { amount_due: 250, amount_paid: 250, status: 'paid' },
        { amount_due: 250, amount_paid: 0, status: 'failed' }
      ];

      const stats = groupPaymentManager.calculatePaymentStats(individualPayments);

      expect(stats.totalDue).toBe(1000);
      expect(stats.totalPaid).toBe(500);
      expect(stats.remainingAmount).toBe(500);
      expect(stats.participantCount).toBe(4);
      expect(stats.paidCount).toBe(2);
      expect(stats.pendingCount).toBe(1);
      expect(stats.failedCount).toBe(1);
      expect(stats.completionPercentage).toBe(50);
      expect(stats.meetsMinimumThreshold).toBe(false); // 50% < 80%
    });

    it('should identify when minimum threshold is met', () => {
      const individualPayments = [
        { amount_due: 250, amount_paid: 250, status: 'paid' },
        { amount_due: 250, amount_paid: 250, status: 'paid' },
        { amount_due: 250, amount_paid: 250, status: 'paid' },
        { amount_due: 250, amount_paid: 50, status: 'paid' } // 85% total
      ];

      const stats = groupPaymentManager.calculatePaymentStats(individualPayments);
      expect(stats.completionPercentage).toBe(85);
      expect(stats.meetsMinimumThreshold).toBe(true); // 85% >= 80%
    });
  });
});

describe('Payment Deadline Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendPaymentReminders', () => {
    it('should send reminders for payments approaching deadline', async () => {
      // Mock console.log to verify reminder sending
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      // Mock successful reminder sending
      const mockPaymentData = {
        id: 'payment-123',
        user_id: 'user-123',
        reminder_count: 0
      };

      await paymentDeadlineManager.sendIndividualReminder(mockPaymentData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Payment reminder sent to user user-123 for payment payment-123'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleExpiredSplitPayment', () => {
    it('should proceed with partial payment when threshold is met', async () => {
      const splitPayment = {
        id: 'split-123',
        booking_id: 'booking-123',
        individual_payments: [
          { amount_due: 250, amount_paid: 250, status: 'paid' },
          { amount_due: 250, amount_paid: 250, status: 'paid' },
          { amount_due: 250, amount_paid: 250, status: 'paid' },
          { amount_due: 250, amount_paid: 50, status: 'paid' } // 85% total
        ]
      };

      const stats = groupPaymentManager.calculatePaymentStats(splitPayment.individual_payments);
      expect(stats.meetsMinimumThreshold).toBe(true);

      // Should proceed with partial payment
      await paymentDeadlineManager.proceedWithPartialPayment(splitPayment, stats);
      expect(mockSupabase.from).toHaveBeenCalledWith('split_payments');
    });

    it('should cancel and refund when threshold is not met', async () => {
      const splitPayment = {
        id: 'split-123',
        booking_id: 'booking-123',
        individual_payments: [
          { amount_due: 250, amount_paid: 250, status: 'paid', stripe_payment_intent_id: 'pi_123' },
          { amount_due: 250, amount_paid: 0, status: 'pending' },
          { amount_due: 250, amount_paid: 0, status: 'pending' },
          { amount_due: 250, amount_paid: 0, status: 'pending' } // 25% total
        ]
      };

      const stats = groupPaymentManager.calculatePaymentStats(splitPayment.individual_payments);
      expect(stats.meetsMinimumThreshold).toBe(false);

      // Should cancel and refund
      await paymentDeadlineManager.cancelAndRefundSplitPayment(splitPayment, stats);
      expect(mockSupabase.from).toHaveBeenCalledWith('split_payments');
    });
  });
});

describe('Integration Tests', () => {
  describe('Full Split Payment Workflow', () => {
    it('should handle complete payment splitting workflow', async () => {
      // 1. Create split payment
      const paymentData = {
        bookingId: 'booking-123',
        organizerId: 'organizer-123',
        totalAmount: 1000,
        participants: [
          { id: '1', name: 'John', email: 'john@test.com' },
          { id: '2', name: 'Jane', email: 'jane@test.com' },
          { id: '3', name: 'Bob', email: 'bob@test.com' },
          { id: '4', name: 'Alice', email: 'alice@test.com' }
        ],
        splitType: 'equal',
        paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        vendorAccountId: 'vendor-123',
        description: 'Group Adventure Booking'
      };

      const splitResult = await groupPaymentManager.createSplitPayment(paymentData);
      expect(splitResult.splitPaymentId).toBeDefined();

      // 2. Verify split calculation
      expect(splitResult.splitCalculation.splits).toEqual([250, 250, 250, 250]);

      // 3. Calculate initial stats
      const initialStats = groupPaymentManager.calculatePaymentStats(splitResult.individualPayments);
      expect(initialStats.completionPercentage).toBe(0);
      expect(initialStats.pendingCount).toBe(4);

      // 4. Simulate partial payments
      const partiallyPaidPayments = splitResult.individualPayments.map((payment, index) => ({
        ...payment,
        status: index < 3 ? 'paid' : 'pending',
        amount_paid: index < 3 ? payment.amount_due : 0
      }));

      const partialStats = groupPaymentManager.calculatePaymentStats(partiallyPaidPayments);
      expect(partialStats.completionPercentage).toBe(75);
      expect(partialStats.meetsMinimumThreshold).toBe(false); // 75% < 80%

      // 5. Complete final payment
      const completePayments = partiallyPaidPayments.map(payment => ({
        ...payment,
        status: 'paid',
        amount_paid: payment.amount_due
      }));

      const finalStats = groupPaymentManager.calculatePaymentStats(completePayments);
      expect(finalStats.completionPercentage).toBe(100);
      expect(finalStats.meetsMinimumThreshold).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
          }))
        }))
      });

      const paymentData = {
        bookingId: 'booking-123',
        organizerId: 'organizer-123',
        totalAmount: 1000,
        participants: [{ id: '1', name: 'John', email: 'john@test.com' }],
        splitType: 'equal',
        paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        vendorAccountId: 'vendor-123',
        description: 'Test booking'
      };

      await expect(groupPaymentManager.createSplitPayment(paymentData))
        .rejects.toThrow('Failed to create split payment: Database error');
    });
  });
});

describe('Edge Cases', () => {
  describe('Single Participant', () => {
    it('should handle single participant split payment', () => {
      const result = paymentSplitting.calculateEqualSplit(1000, 1);
      expect(result.splits).toEqual([1000]);
      expect(result.totalVerification).toBe(1000);
    });
  });

  describe('Large Group', () => {
    it('should handle maximum group size', () => {
      const result = paymentSplitting.calculateEqualSplit(20000, 20); // $200 each
      expect(result.splits.length).toBe(20);
      expect(result.splits.every(amount => amount === 1000)).toBe(true);
      expect(result.totalVerification).toBe(20000);
    });
  });

  describe('Small Amounts', () => {
    it('should handle small amounts with many participants', () => {
      const result = paymentSplitting.calculateEqualSplit(100, 7); // $1.00 split 7 ways
      expect(result.splits).toEqual([15, 15, 15, 15, 14, 14, 14]); // 4 people get 15¢, 3 get 14¢
      expect(result.totalVerification).toBe(100);
      expect(result.remainder).toBe(2);
    });
  });
});