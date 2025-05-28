/**
 * Example middleware.ts with blocking configuration
 * 
 * This example shows how to configure the middleware to block specific
 * bots and AI model trainers.
 */
import { createSpyglassesMiddleware } from '@spyglasses/next';
import type { BotPattern, AiReferrerInfo } from '@spyglasses/sdk';

// Parse patterns from environment variables set by next.config.js
let patterns: BotPattern[] | undefined;
let aiReferrers: AiReferrerInfo[] | undefined;

// Parse blocking configuration
let blockAiModelTrainers: boolean = false;
let customBlocks: string[] | undefined;
let customAllows: string[] | undefined;

try {
  // Parse patterns
  if (process.env.SPYGLASSES_PATTERNS) {
    patterns = JSON.parse(process.env.SPYGLASSES_PATTERNS);
  }
  
  if (process.env.SPYGLASSES_AI_REFERRERS) {
    aiReferrers = JSON.parse(process.env.SPYGLASSES_AI_REFERRERS);
  }
  
  // Parse blocking configuration
  if (process.env.SPYGLASSES_BLOCK_AI_MODEL_TRAINERS) {
    blockAiModelTrainers = process.env.SPYGLASSES_BLOCK_AI_MODEL_TRAINERS === 'true';
  }
  
  if (process.env.SPYGLASSES_CUSTOM_BLOCKS) {
    customBlocks = JSON.parse(process.env.SPYGLASSES_CUSTOM_BLOCKS);
  }
  
  if (process.env.SPYGLASSES_CUSTOM_ALLOWS) {
    customAllows = JSON.parse(process.env.SPYGLASSES_CUSTOM_ALLOWS);
  }
} catch (error) {
  console.error('Failed to parse Spyglasses configuration:', error);
  // Will fall back to defaults
}

/**
 * Create a middleware instance with blocking configuration
 */
export default createSpyglassesMiddleware({
  // API configuration
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.NODE_ENV !== 'production',
  
  // Patterns from build-time
  patterns,
  aiReferrers,
  
  // Blocking configuration
  blockAiModelTrainers,
  customBlocks,
  customAllows,
  
  // Path exclusions
  excludePaths: [
    '/admin',
    '/api',
    '/_next',
    /\.(jpg|png|gif|svg|ico|css|js)$/
  ]
});

/**
 * Configure the Next.js middleware matcher
 */
export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)',
  ],
}; 