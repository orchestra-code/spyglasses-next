/**
 * Optimized middleware.ts for using patterns loaded at build time
 * 
 * This approach is RECOMMENDED for serverless environments (Vercel, Netlify, etc.)
 * as it loads patterns during build time, not during cold starts.
 */
import { createSpyglassesMiddleware } from '@spyglasses/next';
import type { BotPattern, AiReferrerInfo } from '@spyglasses/sdk';

// Parse patterns from environment variables set by next.config.js
let patterns: BotPattern[] | undefined;
let aiReferrers: AiReferrerInfo[] | undefined;

try {
  if (process.env.SPYGLASSES_PATTERNS) {
    patterns = JSON.parse(process.env.SPYGLASSES_PATTERNS);
    console.log(`Loaded ${patterns.length} bot patterns from build-time config`);
  }
  
  if (process.env.SPYGLASSES_AI_REFERRERS) {
    aiReferrers = JSON.parse(process.env.SPYGLASSES_AI_REFERRERS);
    console.log(`Loaded ${aiReferrers.length} AI referrers from build-time config`);
  }
} catch (error) {
  console.error('Failed to parse Spyglasses patterns:', error);
  // Will fall back to default patterns
}

/**
 * Create a middleware instance with build-time patterns
 */
export default createSpyglassesMiddleware({
  // Get API key from environment variables
  apiKey: process.env.SPYGLASSES_API_KEY,
  
  // Enable debug logging in development
  debug: process.env.NODE_ENV !== 'production',
  
  // Use patterns from build-time (if available)
  patterns,
  aiReferrers,
  
  // Exclude specific paths from monitoring
  excludePaths: [
    '/admin',       // Admin dashboard
    '/api',         // API routes
    '/_next',       // Next.js internals
    /\.(jpg|png|gif|svg|ico|css|js)$/ // Static assets
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