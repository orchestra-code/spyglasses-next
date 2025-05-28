/**
 * ALTERNATIVE APPROACH: Dynamic pattern loading from API at runtime
 * 
 * ⚠️ WARNING: This approach is NOT RECOMMENDED for serverless environments (Vercel, Netlify, etc.)
 * as it can cause cold-start penalties and additional API calls. Use the build-time pattern
 * loading approach (see examples/build-time-loading) instead for production deployments.
 * 
 * Only use this approach if you have a long-running server (e.g., a dedicated Node.js server)
 * where the runtime API calls won't impact performance significantly.
 */
import { NextRequest } from 'next/server';
import { createSpyglassesMiddleware } from '@spyglasses/next';
import { 
  Spyglasses,
  BotPattern, 
  AiReferrerInfo 
} from '@spyglasses/sdk';

// Module-level cache for patterns and referrers
let patterns: BotPattern[] | undefined;
let aiReferrers: AiReferrerInfo[] | undefined;
let apiSyncPromise: Promise<void> | null = null;
let lastSyncTime = 0;

/**
 * Load patterns from API if not cached or stale
 */
async function ensurePatternsLoaded() {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const now = Date.now();
  
  // Only sync once per hour at most
  if (patterns && aiReferrers && now - lastSyncTime < ONE_HOUR_MS) {
    return { patterns, aiReferrers };
  }
  
  // If a sync is already in progress, wait for it
  if (apiSyncPromise) {
    await apiSyncPromise;
    return { patterns, aiReferrers };
  }
  
  // Start a new sync
  apiSyncPromise = (async () => {
    try {
      // Create a temporary instance to sync patterns
      const tempInstance = new Spyglasses({
        apiKey: process.env.SPYGLASSES_API_KEY,
        debug: process.env.NODE_ENV !== 'production'
      });
      
      // Sync patterns from API
      await tempInstance.syncPatterns();
      
      // Store in module-level cache
      patterns = tempInstance.getPatterns();
      aiReferrers = tempInstance.getAiReferrers();
      lastSyncTime = Date.now();
      
      console.log(`[Spyglasses] Loaded ${patterns.length} patterns and ${aiReferrers.length} AI referrers from API`);
    } catch (error) {
      console.error('[Spyglasses] Error loading patterns from API:', error);
      // Keep undefined to use defaults from SDK
    } finally {
      apiSyncPromise = null;
    }
  })();
  
  await apiSyncPromise;
  return { patterns, aiReferrers };
}

/**
 * Middleware factory function that loads patterns at runtime
 */
export default async function middleware(request: NextRequest) {
  console.log('[Spyglasses] ⚠️ Using runtime API pattern loading - not recommended for serverless environments');
  
  // Load patterns before creating middleware
  const { patterns, aiReferrers } = await ensurePatternsLoaded();
  
  // Create middleware with loaded patterns
  const spyglassesMiddleware = createSpyglassesMiddleware({
    apiKey: process.env.SPYGLASSES_API_KEY,
    debug: process.env.NODE_ENV !== 'production',
    patterns,
    aiReferrers,
    blockAiModelTrainers: true,
    excludePaths: [
      '/admin',
      '/api',
      '/_next',
      /\.(jpg|png|gif|svg|ico|css|js)$/
    ]
  });
  
  // Process the request
  return spyglassesMiddleware(request);
}

/**
 * Configure Next.js middleware matcher
 */
export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)',
  ],
}; 