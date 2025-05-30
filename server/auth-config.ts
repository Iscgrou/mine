// Clean authentication configuration - username/password only
export const AUTH_CONFIG = {
  // Security headers for all responses
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow'
  }
};