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
   * Whether to block AI model trainers (GPTBot, Claude, etc.)
   * Defaults to false
   */
  blockAiModelTrainers?: boolean;

  /**
   * Custom patterns to block
   * Format: ['category:AI Crawler', 'pattern:SomeBot', 'subcategory:Scraper']
   */
  customBlocks?: string[];

  /**
   * Custom patterns to allow (overrides blocks)
   * Format: ['pattern:Googlebot', 'category:Search Crawler']
   */
  customAllows?: string[];

  /**
   * Specific paths to exclude from monitoring
   * Use glob patterns or regular expressions
   */
  excludePaths?: (string | RegExp)[];
}

/**
 * Middleware function type returned by createSpyglassesMiddleware
 */
export type SpyglassesMiddleware = (request: NextRequest) => Promise<NextResponse>;

/**
 * Type for the createSpyglassesMiddleware function
 */
export type CreateSpyglassesMiddleware = (config: SpyglassesConfig) => SpyglassesMiddleware; 