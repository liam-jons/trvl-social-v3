import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ageVerificationMetricsService from '../age-verification-metrics-service';

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn(() => mockSupabaseQuery),
  gte: vi.fn(() => mockSupabaseQuery),
  lte: vi.fn(() => mockSupabaseQuery),
  lt: vi.fn(() => mockSupabaseQuery),
  eq: vi.fn(() => mockSupabaseQuery),
  order: vi.fn(() => {
    // Return different mock data based on the table being queried
    const tableName = vi.mocked(mockSupabase.from).mock.calls.slice(-1)[0]?.[0];

    if (tableName === 'compliance_metrics') {
      return Promise.resolve({
        data: [
          {
            id: '1',
            date: '2024-01-01',
            event_type: 'age_verification_attempt',
            event_count: 10,
            success_count: 9,
            failure_count: 1,
            underage_attempts: 0,
            avg_age: 25
          }
        ],
        error: null
      });
    } else if (tableName === 'compliance_logs') {
      return Promise.resolve({
        data: [
          {
            id: '1',
            created_at: '2024-01-01T10:00:00Z',
            event_type: 'age_verification_attempt',
            event_data: {
              result: 'success',
              calculated_age: '25',
              processing_time_ms: '250'
            },
            session_id: 'session123'
          }
        ],
        error: null
      });
    }

    return Promise.resolve({ data: [], error: null });
  })
};

const mockSupabase = {
  from: vi.fn(() => mockSupabaseQuery)
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('AgeVerificationMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ageVerificationMetricsService.clearCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getVerificationMetrics', () => {
    it('should fetch and calculate verification metrics', async () => {
      const metrics = await ageVerificationMetricsService.getVerificationMetrics('30d');

      expect(metrics).toBeDefined();
      expect(metrics.totalAttempts).toBeDefined();
      expect(metrics.successRate).toBeDefined();
      expect(metrics.complianceScore).toBeDefined();
      expect(typeof metrics.totalAttempts).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.complianceScore).toBe('number');
    });

    it('should cache results', async () => {
      const metrics1 = await ageVerificationMetricsService.getVerificationMetrics('30d');
      const metrics2 = await ageVerificationMetricsService.getVerificationMetrics('30d');

      expect(metrics1).toEqual(metrics2);
    });

    it('should handle different date ranges', async () => {
      const metrics7d = await ageVerificationMetricsService.getVerificationMetrics('7d');
      const metrics30d = await ageVerificationMetricsService.getVerificationMetrics('30d');

      expect(metrics7d).toBeDefined();
      expect(metrics30d).toBeDefined();
    });
  });

  describe('calculateComplianceScore', () => {
    it('should calculate compliance score correctly', () => {
      const score = ageVerificationMetricsService.calculateComplianceScore({
        successRate: 95,
        underageRate: 0.5,
        systemUptime: 99.9,
        dataIntegrity: 100
      });

      expect(score).toBeGreaterThan(90);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize high underage rates', () => {
      const scoreHighUnderage = ageVerificationMetricsService.calculateComplianceScore({
        successRate: 95,
        underageRate: 5, // High underage rate
        systemUptime: 99.9,
        dataIntegrity: 100
      });

      const scoreLowUnderage = ageVerificationMetricsService.calculateComplianceScore({
        successRate: 95,
        underageRate: 0.5, // Low underage rate
        systemUptime: 99.9,
        dataIntegrity: 100
      });

      expect(scoreHighUnderage).toBeLessThan(scoreLowUnderage);
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score correctly', () => {
      const riskScore = ageVerificationMetricsService.calculateRiskScore({
        underageRate: 1,
        failureRate: 2,
        systemUptime: 99.5
      });

      expect(riskScore).toBeGreaterThanOrEqual(0);
      expect(riskScore).toBeLessThanOrEqual(10);
    });

    it('should increase risk with higher underage rate', () => {
      const lowRisk = ageVerificationMetricsService.calculateRiskScore({
        underageRate: 0.5,
        failureRate: 1,
        systemUptime: 99.9
      });

      const highRisk = ageVerificationMetricsService.calculateRiskScore({
        underageRate: 3,
        failureRate: 1,
        systemUptime: 99.9
      });

      expect(highRisk).toBeGreaterThan(lowRisk);
    });
  });

  describe('parseDateRange', () => {
    it('should parse date ranges correctly', () => {
      const ranges = ['7d', '30d', '90d', '1y'];

      ranges.forEach(range => {
        const { startDate, endDate } = ageVerificationMetricsService.parseDateRange(range);
        expect(new Date(startDate)).toBeInstanceOf(Date);
        expect(new Date(endDate)).toBeInstanceOf(Date);
        expect(new Date(startDate)).toBeBefore(new Date(endDate));
      });
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for low success rate', () => {
      const recommendations = ageVerificationMetricsService.generateRecommendations({
        successRate: 90, // Below 95%
        underageRate: 0.5,
        avgProcessingTime: 500
      });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toContain('Success Rate');
      expect(recommendations[0].priority).toBe('high');
    });

    it('should generate recommendations for high underage rate', () => {
      const recommendations = ageVerificationMetricsService.generateRecommendations({
        successRate: 96,
        underageRate: 3, // Above 2%
        avgProcessingTime: 500
      });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toContain('Underage Attempt');
      expect(recommendations[0].priority).toBe('medium');
    });

    it('should generate recommendations for slow processing', () => {
      const recommendations = ageVerificationMetricsService.generateRecommendations({
        successRate: 96,
        underageRate: 0.5,
        avgProcessingTime: 1500 // Above 1000ms
      });

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toContain('Processing Time');
      expect(recommendations[0].priority).toBe('low');
    });

    it('should return no recommendations for good metrics', () => {
      const recommendations = ageVerificationMetricsService.generateRecommendations({
        successRate: 96,
        underageRate: 0.5,
        avgProcessingTime: 500
      });

      expect(recommendations).toHaveLength(0);
    });
  });

  describe('exportComplianceData', () => {
    it('should export data in JSON format', async () => {
      const jsonData = await ageVerificationMetricsService.exportComplianceData('json', '30d');
      expect(() => JSON.parse(jsonData)).not.toThrow();
    });

    it('should export data in CSV format', async () => {
      const csvData = await ageVerificationMetricsService.exportComplianceData('csv', '30d');
      expect(typeof csvData).toBe('string');
      expect(csvData).toContain(','); // Should have CSV delimiters
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        ageVerificationMetricsService.exportComplianceData('xml', '30d')
      ).rejects.toThrow('Unsupported export format');
    });
  });
});

// Helper matchers
expect.extend({
  toBeBefore(received, expected) {
    const pass = received < expected;
    if (pass) {
      return {
        message: () => `expected ${received} not to be before ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be before ${expected}`,
        pass: false,
      };
    }
  }
});