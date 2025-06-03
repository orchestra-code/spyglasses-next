/**
 * Example: Advanced Configuration with Custom Cache TTL
 * 
 * This example shows how to configure a shorter cache TTL for
 * more frequent pattern updates. Useful if you need patterns
 * to update more frequently than the default 24 hours.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables for Spyglasses configuration
  env: {
    // Cache patterns for 30 minutes (1800 seconds)
    // Shorter cache = more up-to-date patterns, but more API calls
    // Longer cache = fewer API calls, but potentially stale patterns
    SPYGLASSES_CACHE_TTL: '1800',
  }
};

module.exports = nextConfig; 