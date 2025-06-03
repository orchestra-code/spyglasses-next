import { NextResponse, type NextRequest } from 'next/server';
import { ApiPatternResponse, Spyglasses } from '@spyglasses/sdk';
import { SpyglassesConfig, SpyglassesMiddleware } from './types';

const COLLECTOR_ENDPOINT = 'https://www.spyglasses.io/api/collect';
const API_KEY = process.env.SPYGLASSES_API_KEY;

// Module-level instance cache
let spyglassesInstance: Spyglasses | null = null;
let patternSyncPromise: Promise<ApiPatternResponse | string> | null = null;

/**
 * Get or create a Spyglasses instance with the given configuration
 * Ensures we reuse the same instance for performance
 */
function getSpyglassesInstance(config: SpyglassesConfig): Spyglasses {
  if (!spyglassesInstance) {
    spyglassesInstance = new Spyglasses({
      apiKey: config.apiKey || API_KEY,
      debug: config.debug || false,
      blockAiModelTrainers: config.blockAiModelTrainers || false,
      customBlocks: config.customBlocks || [],
      customAllows: config.customAllows || [],
      collectEndpoint: COLLECTOR_ENDPOINT
    });
  }
  
  return spyglassesInstance;
}

/**
 * Sync and cache patterns
 */
async function syncPatterns(spyglasses: Spyglasses, debug: boolean = false): Promise<void> {
  // If there's already a sync in progress, wait for it
  if (patternSyncPromise) {
    await patternSyncPromise;
    return;
  }

  // If we have an API key, try to sync patterns
  if (spyglasses.hasApiKey()) {
    patternSyncPromise = spyglasses.syncPatterns();
    
    try {
      const result = await patternSyncPromise;
      if (debug && typeof result === 'string') {
        console.warn('Spyglasses: Pattern sync warning:', result);
      }
    } catch (error) {
      if (debug) {
        console.error('Spyglasses: Pattern sync failed, using defaults:', error);
      }
    } finally {
      // Clear the promise so future calls can sync again
      patternSyncPromise = null;
    }
  }
}

// Determine if a path should be excluded
function shouldExcludePath(path: string, excludePatterns: (string | RegExp)[] = []): boolean {
  // Default exclusions
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2)$/)
  ) {
    return true;
  }
  
  // Custom exclusions
  for (const pattern of excludePatterns) {
    if (typeof pattern === 'string' && path.includes(pattern)) {
      return true;
    } else if (pattern instanceof RegExp && pattern.test(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create a Spyglasses middleware for Next.js
 * @param config Configuration options
 * @returns A middleware function
 */
export function createSpyglassesMiddleware(config: SpyglassesConfig): SpyglassesMiddleware {
  // Create or get a Spyglasses instance
  const spyglasses = getSpyglassesInstance(config);
  const excludePaths = config.excludePaths || [];
  
  // Always try to sync patterns if we have an API key (using Next.js caching)
  if (spyglasses.hasApiKey()) {
    // Start pattern sync in background - don't await to avoid blocking
    syncPatterns(spyglasses, config.debug).catch(() => {
      // Ignore errors - will use default patterns
    });
  }
  
  return async function middleware(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Skip excluded paths
    if (shouldExcludePath(path, excludePaths)) {
      return NextResponse.next();
    }

    // Create response early to minimize latency
    const response = NextResponse.next();
    
    // Get user-agent and referrer
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || '';
    
    // Detect if it's a bot or AI referrer
    const detectionResult = spyglasses.detect(userAgent, referrer);
    
    // If we detected something and have an API key, log the visit
    if (detectionResult.sourceType !== 'none' && spyglasses.hasApiKey()) {
      // If it should be blocked, add block headers
      if (detectionResult.shouldBlock) {
        // Log the blocked visit first
        await spyglasses.logRequest(detectionResult, {
          url: request.url,
          method: request.method,
          path: url.pathname,
          query: url.search,
          userAgent,
          referrer,
          ip: request.ip || '',
          headers: Object.fromEntries(request.headers),
          responseStatus: 403
        }).catch(() => {
          // Ignore errors in serverless environments
          if (config.debug) {
            console.error('Spyglasses: Error logging blocked visit');
          }
        });
        
        // Return 403 Forbidden
        return new NextResponse('Access Denied', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
      
      // Otherwise, just log the visit
      spyglasses.logRequest(detectionResult, {
        url: request.url,
        method: request.method,
        path: url.pathname,
        query: url.search,
        userAgent,
        referrer,
        ip: request.ip || '',
        headers: Object.fromEntries(request.headers),
        responseStatus: 200
      }).catch(() => {
        // Ignore errors in serverless environments
        if (config.debug) {
          console.error('Spyglasses: Error logging visit');
        }
      });
    }

    return response;
  };
}

// Default middleware export with empty config
export default createSpyglassesMiddleware({});