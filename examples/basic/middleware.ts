/**
 * Basic example of Spyglasses middleware with minimal configuration
 * 
 * This is the simplest way to integrate Spyglasses into your Next.js application.
 */
import { createSpyglassesMiddleware } from '@spyglasses/next';

/**
 * Create a middleware instance with minimal configuration
 * 
 * This will use the default built-in patterns and configuration.
 */
export default createSpyglassesMiddleware({
  // Get API key from environment variables
  apiKey: process.env.SPYGLASSES_API_KEY,
  
  // Enable debug logging in development
  debug: process.env.NODE_ENV !== 'production'
});

/**
 * Configure the Next.js middleware matcher
 * 
 * This matcher excludes static files, API routes, and Next.js internals
 * while matching all other routes.
 */
export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)',
  ],
}; 