import { NextRequest, NextResponse } from 'next/server';

/**
 * Configuration options for the Spyglasses middleware
 */
export interface SpyglassesConfig {
  /**
   * Your Spyglasses API key
   * If not provided, will use the SPYGLASSES_API_KEY environment variable
   */
  apiKey?: string;
  
  /**
   * Enable debug logging
   * Defaults to false
   */
  debug?: boolean;

  /**
   * Custom collector endpoint URL
   * If not provided, will use SPYGLASSES_COLLECTOR_ENDPOINT environment variable
   * or default to 'https://www.spyglasses.io/api/collect'
   */
  collectEndpoint?: string;

  /**
   * Custom patterns endpoint URL  
   * If not provided, will use SPYGLASSES_PATTERNS_ENDPOINT environment variable
   * or default to 'https://www.spyglasses.io/api/patterns'
   */
  patternsEndpoint?: string;

  /**
   * Platform type identifier
   * Defaults to 'next.js' but can be overridden
   */
  platformType?: string;

  /**
   * Specific paths to exclude from monitoring
   * Use glob patterns or regular expressions
   */
  excludePaths?: (string | RegExp)[];

  /**
   * Logging performance options
   */
  logging?: {
    /**
     * Timeout for logging blocked requests (ms)
     * Set to 0 to disable timeout, null to skip logging entirely
     * Default: 2000ms
     */
    blockingTimeout?: number | null;
    
    /**
     * Whether to await logging for blocked requests
     * false = fire-and-forget (better performance)
     * true = ensure logging completes (better reliability)
     * Default: true
     */
    awaitBlockedLogging?: boolean;
  };
}

/**
 * Middleware function type returned by createSpyglassesMiddleware
 */
export type SpyglassesMiddleware = (request: NextRequest) => Promise<NextResponse>;

/**
 * Type for the createSpyglassesMiddleware function
 */
export type CreateSpyglassesMiddleware = (config: SpyglassesConfig) => SpyglassesMiddleware; 