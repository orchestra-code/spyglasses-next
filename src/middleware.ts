import { NextResponse, type NextRequest } from 'next/server';
import { Spyglasses } from '@spyglasses/sdk';
import { SpyglassesConfig, SpyglassesMiddleware } from './types';

const COLLECTOR_ENDPOINT = 'https://www.spyglasses.io/api/collect';
const API_KEY = process.env.SPYGLASSES_API_KEY;

// Module-level instance cache
let spyglassesInstance: Spyglasses | null = null;

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
      collectEndpoint: COLLECTOR_ENDPOINT,
      autoSync: false, // Disable auto-sync for serverless environments
    });
    
    // Use build-time patterns if provided
    if (config.patterns && Array.isArray(config.patterns)) {
      // Override default patterns with build-time patterns
      spyglassesInstance['patterns'] = config.patterns;
    }
    
    // Use build-time AI referrers if provided
    if (config.aiReferrers && Array.isArray(config.aiReferrers)) {
      // Override default AI referrers with build-time referrers
      spyglassesInstance['aiReferrers'] = config.aiReferrers;
    }
  }
  
  return spyglassesInstance;
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