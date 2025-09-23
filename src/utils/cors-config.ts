/**
 * CORS Configuration Utility - TypeScript Version
 * Provides secure CORS configuration for Supabase Edge Functions
 */

interface CorsHeaders {
  [key: string]: string;
}

/**
 * Get allowed origins from environment variables
 * @returns Array of allowed origins
 */
function getAllowedOrigins(): string[] {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS');

  if (!allowedOrigins) {
    // Fallback for development environment
    const nodeEnv = Deno.env.get('NODE_ENV') || Deno.env.get('DENO_ENV');
    if (nodeEnv === 'development') {
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
 * @param origin - The origin to validate
 * @returns True if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for a specific origin
 * @param origin - The requesting origin
 * @returns CORS headers object
 */
function getCorsHeaders(origin: string | null): CorsHeaders {
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
 * @param origin - The requesting origin
 * @returns Enhanced headers object with security headers
 */
function getSecureCorsHeaders(origin: string | null): CorsHeaders {
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
 * Handle CORS preflight requests for Supabase Edge Functions
 * @param request - The incoming request
 * @returns Response object for preflight or null if not a preflight request
 */
function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const headers = getCorsHeaders(origin);

    return new Response('ok', { headers });
  }

  return null;
}

/**
 * Create a response with CORS headers
 * @param data - Response data
 * @param request - The incoming request
 * @param options - Additional response options
 * @returns Response with CORS headers
 */
function createCorsResponse(
  data: any,
  request: Request,
  options: {
    status?: number;
    secure?: boolean;
    contentType?: string;
  } = {}
): Response {
  const origin = request.headers.get('origin');
  const headers = options.secure ? getSecureCorsHeaders(origin) : getCorsHeaders(origin);

  // Check if origin is allowed
  if (origin && !isOriginAllowed(origin)) {
    logCorsViolation(origin, request.url, request.method);
    return new Response(
      JSON.stringify({
        error: 'CORS policy violation',
        message: 'Origin not allowed',
        origin: origin
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    );
  }

  const responseHeaders = {
    'Content-Type': options.contentType || 'application/json',
    ...headers
  };

  const responseData = typeof data === 'string' ? data : JSON.stringify(data);

  return new Response(responseData, {
    status: options.status || 200,
    headers: responseHeaders
  });
}

/**
 * Log CORS violations for monitoring in Supabase Edge Functions
 * @param origin - The blocked origin
 * @param endpoint - The endpoint that was accessed
 * @param method - The HTTP method used
 */
function logCorsViolation(origin: string, endpoint: string, method: string): void {
  const violation = {
    timestamp: new Date().toISOString(),
    origin: origin,
    endpoint: endpoint,
    method: method,
    severity: 'warning',
    type: 'cors_violation'
  };

  console.warn('CORS Violation:', JSON.stringify(violation, null, 2));

  // In production, you might want to send this to a logging service
  // like Sentry, DataDog, or CloudWatch
}

/**
 * Wrapper function for Supabase Edge Functions with CORS handling
 * @param handler - The actual function handler
 * @param options - CORS options
 * @returns Wrapped handler with CORS support
 */
function withCors(
  handler: (request: Request) => Promise<Response>,
  options: { secure?: boolean } = {}
) {
  return async (request: Request): Promise<Response> => {
    // Handle preflight requests
    const preflightResponse = handleCorsPreflightRequest(request);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Check origin for non-preflight requests
    const origin = request.headers.get('origin');
    if (origin && !isOriginAllowed(origin)) {
      logCorsViolation(origin, request.url, request.method);
      return createCorsResponse(
        {
          error: 'CORS policy violation',
          message: 'Origin not allowed',
          origin: origin
        },
        request,
        { status: 403, secure: options.secure }
      );
    }

    try {
      // Execute the handler
      const response = await handler(request);

      // If the handler returns a Response object, add CORS headers
      if (response instanceof Response) {
        const origin = request.headers.get('origin');
        const corsHeaders = options.secure ? getSecureCorsHeaders(origin) : getCorsHeaders(origin);

        // Clone response and add CORS headers
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }

      return response;
    } catch (error) {
      console.error('Handler error:', error);
      return createCorsResponse(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred'
        },
        request,
        { status: 500, secure: options.secure }
      );
    }
  };
}

export {
  getAllowedOrigins,
  isOriginAllowed,
  getCorsHeaders,
  getSecureCorsHeaders,
  handleCorsPreflightRequest,
  createCorsResponse,
  logCorsViolation,
  withCors
};