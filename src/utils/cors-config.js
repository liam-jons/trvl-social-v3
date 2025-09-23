/**
 * CORS Configuration Utility
 * Provides secure CORS configuration for API routes and Supabase functions
 */

/**
 * Get allowed origins from environment variables
 * @returns {string[]} Array of allowed origins
 */
function getAllowedOrigins() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;

  if (!allowedOrigins) {
    // Fallback for development environment
    if (process.env.NODE_ENV === 'development') {
      return [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ];
    }

    // Production should always have ALLOWED_ORIGINS set
    throw new Error('ALLOWED_ORIGINS environment variable is required for production');
  }

  return allowedOrigins.split(',').map(origin => origin.trim());
}

/**
 * Validate if origin is allowed
 * @param {string} origin - The origin to validate
 * @returns {boolean} True if origin is allowed
 */
function isOriginAllowed(origin) {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for a specific origin
 * @param {string} origin - The requesting origin
 * @returns {Object} CORS headers object
 */
function getCorsHeaders(origin) {
  const allowedOrigin = isOriginAllowed(origin) ? origin : null;

  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Enhanced CORS headers with additional security headers
 * @param {string} origin - The requesting origin
 * @returns {Object} Enhanced headers object with security headers
 */
function getSecureCorsHeaders(origin) {
  const corsHeaders = getCorsHeaders(origin);

  return {
    ...corsHeaders,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
  };
}

/**
 * Handle CORS preflight requests
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} True if preflight was handled
 */
function handleCorsPreflightRequest(req, res) {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const headers = getCorsHeaders(origin);

    // Set CORS headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Apply CORS headers to response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {boolean} secure - Whether to include additional security headers
 */
function applyCorsHeaders(req, res, secure = false) {
  const origin = req.headers.origin;
  const headers = secure ? getSecureCorsHeaders(origin) : getCorsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * CORS middleware for API routes
 * @param {boolean} secure - Whether to include additional security headers
 * @returns {Function} Middleware function
 */
function corsMiddleware(secure = false) {
  return (req, res, next) => {
    // Handle preflight requests
    if (handleCorsPreflightRequest(req, res)) {
      return;
    }

    // Apply CORS headers
    applyCorsHeaders(req, res, secure);

    // Check if origin is allowed for non-preflight requests
    const origin = req.headers.origin;
    if (origin && !isOriginAllowed(origin)) {
      console.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
      res.status(403).json({
        error: 'CORS policy violation',
        message: 'Origin not allowed',
        origin: origin
      });
      return;
    }

    if (next) next();
  };
}

/**
 * Log CORS violations for monitoring
 * @param {string} origin - The blocked origin
 * @param {string} endpoint - The endpoint that was accessed
 * @param {string} method - The HTTP method used
 * @param {Object} additionalData - Additional metadata for monitoring
 */
async function logCorsViolation(origin, endpoint, method, additionalData = {}) {
  const violation = {
    timestamp: new Date().toISOString(),
    origin: origin,
    endpoint: endpoint,
    method: method,
    severity: 'warning',
    type: 'cors_violation',
    ...additionalData
  };

  console.warn('CORS Violation:', JSON.stringify(violation, null, 2));

  // Enhanced monitoring in production
  if (typeof window === 'undefined') {
    try {
      // Use enhanced monitoring service if available
      const { logCorsViolation: enhancedLog } = await import('../services/cors-monitoring-service.js');
      await enhancedLog(origin, endpoint, method, additionalData);
    } catch (error) {
      // Fallback to basic logging if monitoring service unavailable
      console.warn('Enhanced CORS monitoring unavailable:', error.message);
    }
  }
}

export {
  getAllowedOrigins,
  isOriginAllowed,
  getCorsHeaders,
  getSecureCorsHeaders,
  handleCorsPreflightRequest,
  applyCorsHeaders,
  corsMiddleware,
  logCorsViolation
};