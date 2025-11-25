/**
 * Environment type definitions
 */
export type Environment = 'development' | 'production' | 'test' | 'staging' | 'preview';

/**
 * Get VERCEL_ENV value directly
 * This is the most accurate environment indicator on Vercel platform
 * @returns VERCEL_ENV value or undefined if not set
 */
export function getVercelEnv(): Environment | undefined {
  const vercelEnv = process.env.VERCEL_ENV;
  if (!vercelEnv) {
    return undefined;
  }
  if (vercelEnv === 'preview') {
    return 'preview';
  }
  if (vercelEnv === 'production' || vercelEnv === 'development') {
    return vercelEnv;
  }
  return undefined;
}

/**
 * Get NODE_ENV value directly
 * Standard Node.js environment variable
 * @returns NODE_ENV value or undefined if not set
 */
export function getNodeEnv(): Environment | undefined {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    return undefined;
  }
  if (nodeEnv === 'production' || nodeEnv === 'development' || nodeEnv === 'test') {
    return nodeEnv;
  }
  return undefined;
}

/**
 * Get server-side environment with priority
 * Priority: VERCEL_ENV > NODE_ENV > default
 *
 * This function uses a priority system:
 * 1. If VERCEL_ENV exists, use it (most accurate on Vercel)
 * 2. Otherwise, use NODE_ENV (for local development or non-Vercel)
 * 3. Default to 'development'
 *
 * For explicit control, use getVercelEnv() or getNodeEnv() directly.
 *
 * @returns Current server-side environment
 */
export function getServerEnv(): Environment {
  // On Vercel, VERCEL_ENV is the most accurate source
  // because NODE_ENV is always 'production' even for preview deployments
  const vercelEnv = getVercelEnv();
  if (vercelEnv) {
    return vercelEnv;
  }

  // Fallback to NODE_ENV for local development or non-Vercel deployments
  const nodeEnv = getNodeEnv();
  if (nodeEnv) {
    return nodeEnv;
  }

  // Default fallback
  return 'development';
}

/**
 * Get client-side environment
 * Uses client-side environment variables:
 * - NEXT_PUBLIC_ENV (automatically set in next.config.ts based on VERCEL_ENV)
 *
 * Note: NEXT_PUBLIC_ENV is automatically configured in next.config.ts:
 * - On Vercel: uses VERCEL_ENV (preview/production/development)
 * - Locally: defaults to 'development'
 *
 * @returns Current client-side environment
 */
export function getClientEnv(): Environment {
  // Client-side can only access NEXT_PUBLIC_ prefixed variables
  const publicEnv = process.env.NEXT_PUBLIC_ENV;
  if (publicEnv) {
    if (publicEnv === 'development' || publicEnv === 'production' || publicEnv === 'preview' || publicEnv === 'staging' || publicEnv === 'test') {
      return publicEnv as Environment;
    }
  }

  // Default fallback (client-side doesn't have access to NODE_ENV)
  return 'development';
}

/**
 * Get current environment (auto-detects server/client)
 * This is a convenience function that calls getServerEnv() or getClientEnv() based on runtime.
 *
 * For explicit control, use getServerEnv() or getClientEnv() directly.
 *
 * @returns Current environment string
 */
export function getEnv(): Environment {
  if (typeof window === 'undefined') {
    return getServerEnv();
  }
  return getClientEnv();
}

/**
 * Check if current environment is development
 * @returns true if in development mode
 */
export function isDevelopment(): boolean {
  return getEnv() === 'development';
}

/**
 * Check if current environment is production
 * @returns true if in production mode
 */
export function isProduction(): boolean {
  return getEnv() === 'production';
}

/**
 * Check if current environment is test
 * @returns true if in test mode
 */
export function isTest(): boolean {
  return getEnv() === 'test';
}

/**
 * Check if current environment is staging
 * @returns true if in staging mode
 */
export function isStaging(): boolean {
  return getEnv() === 'staging';
}

/**
 * Check if current environment is preview (Vercel preview deployments)
 * @returns true if in preview mode
 */
export function isPreview(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check VERCEL_ENV directly
    return process.env.VERCEL_ENV === 'preview' || getServerEnv() === 'preview';
  }
  // Client-side: use getClientEnv
  return getClientEnv() === 'preview';
}

/**
 * Check if running on Vercel platform
 * @returns true if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

/**
 * Get Vercel deployment URL
 * @returns Vercel URL or undefined
 */
export function getVercelUrl(): string | undefined {
  return process.env.VERCEL_URL;
}

/**
 * Check if running on server side
 * @returns true if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if running on client side
 * @returns true if running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get environment variable (server-side only)
 * Use this for server-side code to access any environment variable
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default value
 */
export function getServerEnvVar(key: string, defaultValue?: string): string | undefined {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnvVar can only be used on the server side');
  }
  return process.env[key] || defaultValue;
}

/**
 * Get public environment variable (client-side accessible)
 * Only variables prefixed with NEXT_PUBLIC_ are available on the client
 * @param key - Environment variable key (without NEXT_PUBLIC_ prefix)
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default value
 */
export function getPublicEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
}

/**
 * Get environment variable with automatic detection
 * @deprecated Use getServerEnvVar or getPublicEnvVar instead for clarity
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default value
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  if (isServer()) {
    return process.env[key] || defaultValue;
  }
  // For client-side, use NEXT_PUBLIC_ prefix
  return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
}
