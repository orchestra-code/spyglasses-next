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
}

/**
 * Middleware function type returned by createSpyglassesMiddleware
 */
export type SpyglassesMiddleware = (request: NextRequest) => Promise<NextResponse>;

/**
 * Type for the createSpyglassesMiddleware function
 */
export type CreateSpyglassesMiddleware = (config: SpyglassesConfig) => SpyglassesMiddleware; 