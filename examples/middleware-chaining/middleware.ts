/**
 * Example of middleware chaining with existing middleware
 * 
 * This is the RECOMMENDED approach for integrating Spyglasses with
 * existing Next.js middleware.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSpyglassesMiddleware } from '@spyglasses/next';
import type { BotPattern, AiReferrerInfo } from '@spyglasses/sdk';

// Parse patterns from environment variables (similar to other examples)
let patterns: BotPattern[] | undefined;
let aiReferrers: AiReferrerInfo[] | undefined;
let blockAiModelTrainers = false;

try {
  if (process.env.SPYGLASSES_PATTERNS) {
    patterns = JSON.parse(process.env.SPYGLASSES_PATTERNS);
  }
  
  if (process.env.SPYGLASSES_AI_REFERRERS) {
    aiReferrers = JSON.parse(process.env.SPYGLASSES_AI_REFERRERS);
  }
  
  if (process.env.SPYGLASSES_BLOCK_AI_MODEL_TRAINERS) {
    blockAiModelTrainers = process.env.SPYGLASSES_BLOCK_AI_MODEL_TRAINERS === 'true';
  }
} catch (error) {
  console.error('Failed to parse Spyglasses configuration:', error);
}

/**
 * Create the Spyglasses middleware instance
 */
const spyglassesMiddleware = createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.NODE_ENV !== 'production',
  patterns,
  aiReferrers,
  blockAiModelTrainers,
  excludePaths: [
    '/admin',
    '/api',
    '/_next',
    /\.(jpg|png|gif|svg|ico|css|js)$/
  ]
});

/**
 * Your existing custom middleware function
 * 
 * This is just an example - replace with your actual middleware logic.
 */
async function customMiddleware(request: NextRequest) {
  // Example: Check auth header and redirect if missing
  const authHeader = request.headers.get('authorization');
  
  if (request.nextUrl.pathname.startsWith('/protected') && !authHeader) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Example: Add custom headers
  const response = NextResponse.next();
  response.headers.set('x-my-custom-header', 'custom-value');
  
  return response;
}

/**
 * Main middleware function that chains both middlewares
 */
export async function middleware(request: NextRequest) {
  // Run Spyglasses middleware first
  const spyglassesResponse = await spyglassesMiddleware(request);
  
  // If Spyglasses blocked the request, return that response
  if (spyglassesResponse.status === 403) {
    console.log('Bot request blocked by Spyglasses middleware');
    return spyglassesResponse;
  }
  
  // Otherwise, run your custom middleware
  return customMiddleware(request);
}

/**
 * Configure Next.js middleware matcher
 */
export const config = {
  matcher: [
    // Combined matchers for both middlewares
    '/((?!_next/static|_next/image|favicon.ico).*)', // Spyglasses paths
    '/protected/:path*',                             // Custom middleware paths
  ],
}; 