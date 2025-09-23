/**
 * Age Verification Service Tests
 * Tests for server-side age verification functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyAgeServerSide, verifyAgeWithRetry, comprehensiveAgeVerification } from '../age-verification-service';

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock the client-side age verification
vi.mock('../../utils/age-verification', () => ({
  validateAge: vi.fn()
}));

describe('Age Verification Service', () => {
  let mockInvoke;
  let mockValidateAge;

  beforeEach(() => {
    mockInvoke = vi.fn();
    mockValidateAge = vi.fn();

    const { supabase } = require('../../lib/supabase');
    supabase.functions.invoke = mockInvoke;

    const { validateAge } = require('../../utils/age-verification');
    validateAge.mockImplementation(mockValidateAge);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyAgeServerSide', () => {
    it('should successfully verify valid age', async () => {
      const mockResponse = {
        success: true,
        age: 25,
        message: 'Age verification successful'
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await verifyAgeServerSide('1998-01-01', 13);

      expect(mockInvoke).toHaveBeenCalledWith('verify-age', {
        body: {
          dateOfBirth: '1998-01-01',
          minAge: 13
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle underage user rejection', async () => {
      const mockResponse = {
        success: false,
        error: 'COPPA_AGE_RESTRICTION',
        message: 'You must be at least 13 years old to create an account',
        age: 12
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await verifyAgeServerSide('2020-01-01', 13);

      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(false);
      expect(result.error).toBe('COPPA_AGE_RESTRICTION');
    });

    it('should handle Edge Function errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: new Error('Function timeout')
      });

      const result = await verifyAgeServerSide('1998-01-01', 13);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVER_ERROR');
    });

    it('should handle network errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Network failure'));

      const result = await verifyAgeServerSide('1998-01-01', 13);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
    });
  });

  describe('verifyAgeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockResponse = {
        success: true,
        age: 25
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await verifyAgeWithRetry('1998-01-01', 13, 3);

      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should not retry for age verification failures', async () => {
      const mockResponse = {
        success: false,
        error: 'COPPA_AGE_RESTRICTION',
        message: 'You must be at least 13 years old'
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await verifyAgeWithRetry('2020-01-01', 13, 3);

      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should retry on server errors', async () => {
      const errorResponse = {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      };

      const successResponse = {
        success: true,
        age: 25
      };

      mockInvoke
        .mockResolvedValueOnce({ data: errorResponse, error: null })
        .mockResolvedValueOnce({ data: successResponse, error: null });

      const result = await verifyAgeWithRetry('1998-01-01', 13, 3);

      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(result).toEqual(successResponse);
    });

    it('should give up after max retries', async () => {
      const errorResponse = {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error'
      };

      mockInvoke.mockResolvedValue({
        data: errorResponse,
        error: null
      });

      const result = await verifyAgeWithRetry('1998-01-01', 13, 2);

      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(result).toEqual(errorResponse);
    });
  });

  describe('comprehensiveAgeVerification', () => {
    it('should pass both client and server validation', async () => {
      const clientResponse = {
        isValid: true,
        age: 25,
        error: null,
        isOldEnough: true
      };

      const serverResponse = {
        success: true,
        age: 25,
        message: 'Age verification successful'
      };

      mockValidateAge.mockReturnValue(clientResponse);
      mockInvoke.mockResolvedValue({
        data: serverResponse,
        error: null
      });

      const result = await comprehensiveAgeVerification('1998-01-01', 13);

      expect(result.success).toBe(true);
      expect(result.clientValid).toBe(true);
      expect(result.serverValid).toBe(true);
      expect(result.age).toBe(25);
    });

    it('should fail if client validation fails', async () => {
      const clientResponse = {
        isValid: false,
        age: null,
        error: 'Please enter a valid date',
        isOldEnough: false
      };

      mockValidateAge.mockReturnValue(clientResponse);

      const result = await comprehensiveAgeVerification('invalid-date', 13);

      expect(result.success).toBe(false);
      expect(result.error).toBe('CLIENT_VALIDATION_FAILED');
      expect(result.clientValid).toBe(false);
      expect(result.serverValid).toBe(false);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should fail if server validation fails for age', async () => {
      const clientResponse = {
        isValid: true,
        age: 12,
        error: null,
        isOldEnough: false
      };

      const serverResponse = {
        success: false,
        error: 'COPPA_AGE_RESTRICTION',
        message: 'You must be at least 13 years old',
        age: 12
      };

      mockValidateAge.mockReturnValue(clientResponse);
      mockInvoke.mockResolvedValue({
        data: serverResponse,
        error: null
      });

      const result = await comprehensiveAgeVerification('2020-01-01', 13);

      expect(result.success).toBe(false);
      expect(result.error).toBe('COPPA_AGE_RESTRICTION');
      expect(result.clientValid).toBe(true);
      expect(result.serverValid).toBe(false);
      expect(result.age).toBe(12);
    });
  });

  describe('Edge cases', () => {
    it('should handle exactly 13 years old', async () => {
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
      const dateString = thirteenYearsAgo.toISOString().split('T')[0];

      const mockResponse = {
        success: true,
        age: 13,
        message: 'Age verification successful'
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await verifyAgeServerSide(dateString, 13);

      expect(result.success).toBe(true);
      expect(result.age).toBe(13);
    });

    it('should handle leap year birthdays', async () => {
      const mockResponse = {
        success: true,
        age: 20,
        message: 'Age verification successful'
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await verifyAgeServerSide('2004-02-29', 13);

      expect(result.success).toBe(true);
    });

    it('should reject invalid leap year dates', async () => {
      const mockResponse = {
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: 'Invalid date: February 29th is not valid for non-leap years'
      };

      mockInvoke.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      const result = await verifyAgeServerSide('2021-02-29', 13);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_DATE_FORMAT');
    });
  });
});