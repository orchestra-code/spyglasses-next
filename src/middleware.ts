import { NextResponse, type NextRequest } from 'next/server';
import { ApiPatternResponse, Spyglasses } from '@spyglasses/sdk';
import { SpyglassesConfig, SpyglassesMiddleware } from './types';

const COLLECTOR_ENDPOINT = process.env.SPYGLASSES_COLLECTOR_ENDPOINT || 'https://www.spyglasses.io/api/collect';
const API_KEY = process.env.SPYGLASSES_API_KEY;
const DEBUG = process.env.SPYGLASSES_DEBUG === 'true';

// Module-level pattern sync cache (shared across instances)
let patternSyncPromise: Promise<ApiPatternResponse | string> | null = null;

/**
 * Sync and cache patterns
 */
async function syncPatterns(spyglasses: Spyglasses, debug: boolean = false): Promise<void> {
  // If there's already a sync in progress, wait for it
  if (patternSyncPromise) {
    if (debug) {
      console.log('Spyglasses: Pattern sync already in progress, waiting...');
    }
    await patternSyncPromise;
    return;
  }

  // If we have an API key, try to sync patterns
  if (spyglasses.hasApiKey()) {
    if (debug) {
      console.log('Spyglasses: Starting pattern sync...');
    }
    
    patternSyncPromise = spyglasses.syncPatterns();
    
    try {
      const result = await patternSyncPromise;
      if (debug) {
        if (typeof result === 'string') {
          console.warn('Spyglasses: Pattern sync warning:', result);
        } else {
          console.log(`Spyglasses: Successfully synced ${result.patterns?.length || 0} patterns and ${result.aiReferrers?.length || 0} AI referrers`);
        }
      }
    } catch (error) {
      if (debug) {
        console.error('Spyglasses: Pattern sync failed, using defaults:', error);
      }
    } finally {
      // Clear the promise so future calls can sync again
      patternSyncPromise = null;
    }
  } else if (debug) {
    console.warn('Spyglasses: No API key provided, using default patterns only');
  }
}

// Determine if a path should be excluded
function shouldExcludePath(path: string, excludePatterns: (string | RegExp)[] = [], debug: boolean = false): boolean {
  // Default exclusions
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2)$/)
  ) {
    if (debug) {
      console.log(`Spyglasses: Excluding path due to default exclusions: ${path}`);
    }
    return true;
  }
  
  // Custom exclusions
  for (const pattern of excludePatterns) {
    if (typeof pattern === 'string' && path.includes(pattern)) {
      if (debug) {
        console.log(`Spyglasses: Excluding path due to custom string pattern "${pattern}": ${path}`);
      }
      return true;
    } else if (pattern instanceof RegExp && pattern.test(path)) {
      if (debug) {
        console.log(`Spyglasses: Excluding path due to custom regex pattern "${pattern}": ${path}`);
      }
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
  // Determine debug mode - explicit config takes precedence over environment variable
  const debugMode = config.debug !== undefined ? config.debug : DEBUG;
  
  // Create a new Spyglasses instance for each middleware with its specific config
  const spyglasses = new Spyglasses({
    apiKey: config.apiKey || API_KEY,
    debug: debugMode,
    blockAiModelTrainers: config.blockAiModelTrainers || false,
    customBlocks: config.customBlocks || [],
    customAllows: config.customAllows || [],
    collectEndpoint: COLLECTOR_ENDPOINT
  });
  
  const excludePaths = config.excludePaths || [];
  
  // Always try to sync patterns if we have an API key (using Next.js caching)
  if (spyglasses.hasApiKey()) {
    // Start pattern sync in background - don't await to avoid blocking
    syncPatterns(spyglasses, debugMode).catch(() => {
      // Ignore errors - will use default patterns
      if (debugMode) {
        console.error('Spyglasses: Background pattern sync failed, continuing with defaults');
      }
    });
  }
  
  return async function middleware(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Skip excluded paths
    if (shouldExcludePath(path, excludePaths, debugMode)) {
      return NextResponse.next();
    }

    // Create response early to minimize latency
    const response = NextResponse.next();
    
    // Get user-agent and referrer
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || '';
    
    if (debugMode) {
      console.log(`Spyglasses: Processing request to ${path}`);
      console.log(`Spyglasses: User-Agent: ${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}`);
      if (referrer) {
        console.log(`Spyglasses: Referrer: ${referrer}`);
      }
    }
    
    // Detect if it's a bot or AI referrer
    const detectionResult = spyglasses.detect(userAgent, referrer);
    
    if (debugMode && detectionResult.sourceType !== 'none') {
      console.log(`Spyglasses: Detection result:`, {
        sourceType: detectionResult.sourceType,
        isBot: detectionResult.isBot,
        shouldBlock: detectionResult.shouldBlock,
        matchedPattern: detectionResult.matchedPattern,
        info: detectionResult.info
      });
    }
    
    // If we detected something and have an API key, log the visit
    if (detectionResult.sourceType !== 'none' && spyglasses.hasApiKey()) {
      // If it should be blocked, add block headers
      if (detectionResult.shouldBlock) {
        if (debugMode) {
          console.log(`Spyglasses: Blocking request from ${detectionResult.sourceType}: ${detectionResult.matchedPattern}`);
        }
        
        // For blocked requests, we can afford a small delay to ensure logging
        // but we'll set a reasonable timeout to avoid hanging
        const logBlockedRequest = async () => {
          try {
            // Set a timeout for logging to avoid hanging the response
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Logging timeout')), 2000)
            );
            
            await Promise.race([
              spyglasses.logRequest(detectionResult, {
                url: request.url,
                method: request.method,
                path: url.pathname,
                query: url.search,
                userAgent,
                referrer,
                ip: request.ip || '',
                headers: Object.fromEntries(request.headers),
                responseStatus: 403
              }),
              timeoutPromise
            ]);
            
            if (debugMode) {
              console.log(`Spyglasses: ✅ Successfully logged blocked ${detectionResult.sourceType} visit`);
            }
          } catch (error) {
            if (debugMode) {
              console.error(`Spyglasses: ❌ Error logging blocked ${detectionResult.sourceType} visit:`, error);
            }
            // Continue with blocking even if logging fails
          }
        };
        
        // Await the logging but with timeout protection
        await logBlockedRequest();
        
        // Return 403 Forbidden
        return new NextResponse('Access Denied', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
      
      if (debugMode) {
        console.log(`Spyglasses: Logging ${detectionResult.sourceType} visit: ${detectionResult.matchedPattern}`);
      }
      
      // For non-blocked requests, use fire-and-forget but with serverless considerations
      // In serverless environments, we need to be more careful about promises being cut off
      const logPromise = spyglasses.logRequest(detectionResult, {
        url: request.url,
        method: request.method,
        path: url.pathname,
        query: url.search,
        userAgent,
        referrer,
        ip: request.ip || '',
        headers: Object.fromEntries(request.headers),
        responseStatus: 200
      });
      
      // Handle the promise without awaiting to avoid blocking the response
      logPromise.then(() => {
        if (debugMode) {
          console.log(`Spyglasses: ✅ Successfully logged ${detectionResult.sourceType} visit`);
        }
      }).catch((error) => {
        if (debugMode) {
          console.error(`Spyglasses: ❌ Error logging ${detectionResult.sourceType} visit:`, error);
          
          // Additional debugging for AI referrer failures
          if (detectionResult.sourceType === 'ai_referrer') {
            console.error('Spyglasses: AI referrer logging failed');
            console.error('Spyglasses: Detection result was:', detectionResult);
          }
        }
      });
    }

    return response;
  };
}

// Default middleware export with empty config
export default createSpyglassesMiddleware({});