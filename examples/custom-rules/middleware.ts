/**
 * Example: Advanced Configuration with Custom Rules
 * 
 * This example shows how to use custom blocking and allowing rules
 * with runtime pattern loading. All patterns are still fetched and
 * cached at runtime using Next.js built-in fetch caching.
 * 
 * This is the same runtime approach as the basic example, but with
 * more advanced configuration options.
 */
import { createSpyglassesMiddleware } from '@spyglasses/next';

/**
 * Create middleware with advanced configuration
 */
export default createSpyglassesMiddleware({
  // Get API key from environment variables
  apiKey: process.env.SPYGLASSES_API_KEY,
  
  // Enable debug logging with SPYGLASSES_DEBUG environment variable
  debug: process.env.SPYGLASSES_DEBUG === 'true',
  
  // Block AI model trainers globally
  blockAiModelTrainers: true,
  
  // Custom blocking rules
  customBlocks: [
    'category:AI Crawler',  // Block all AI crawlers
    // 'pattern:GPTBot\\/[0-9]',  // Block specific pattern
  ],
  
  // Custom allow rules (override blocks)
  customAllows: [
    'pattern:Claude-User\\/[0-9]',  // Allow Claude user queries even if AI crawlers are blocked
    // 'subcategory:AI Agent:AI Assistants',  // Allow all AI assistants
  ],
  
  // Exclude specific paths from monitoring
  excludePaths: [
    '/admin',       // Admin dashboard
    '/api',         // API routes
    '/_next',       // Next.js internals
    /\.(jpg|png|gif|svg|ico|css|js)$/ // Static assets
  ]
});

/**
 * Configure Next.js middleware matcher
 */
export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)',
  ],
}; 