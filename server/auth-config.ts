// Secret path configuration for admin and CRM access
export const AUTH_CONFIG = {
  // Admin access secret path - change this to your desired secret
  ADMIN_SECRET_PATH: process.env.ADMIN_SECRET_PATH || 'ciwomplefoadm867945',
  
  // CRM access secret path - for CRM team access
  CRM_SECRET_PATH: process.env.CRM_SECRET_PATH || 'csdfjkjfoascivomrm867945',
  
  // Base URL rejection message
  ACCESS_DENIED_MESSAGE: 'دسترسی غیرمجاز - Access Denied',
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow'
  }
};

// Path validation functions
export function isValidAdminPath(path: string): boolean {
  return path === `/${AUTH_CONFIG.ADMIN_SECRET_PATH}` || 
         path.startsWith(`/${AUTH_CONFIG.ADMIN_SECRET_PATH}/`);
}

export function isValidCrmPath(path: string): boolean {
  return path === `/${AUTH_CONFIG.CRM_SECRET_PATH}` || 
         path.startsWith(`/${AUTH_CONFIG.CRM_SECRET_PATH}/`);
}

export function isAuthorizedPath(path: string): boolean {
  return isValidAdminPath(path) || isValidCrmPath(path);
}