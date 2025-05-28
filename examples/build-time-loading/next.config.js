/**
 * Optimized next.config.js for loading patterns at build time
 * 
 * This approach is RECOMMENDED for serverless environments (Vercel, Netlify, etc.)
 * as it loads patterns during build time, not during cold starts.
 */

/**
 * Fetch patterns from the Spyglasses API at build time
 */
async function fetchPatternsAtBuildTime() {
  try {
    const apiKey = process.env.SPYGLASSES_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  SPYGLASSES_API_KEY not found in environment, using default patterns');
      return { patterns: null, aiReferrers: null };
    }
    
    console.log('🔍 Fetching Spyglasses patterns at build time...');
    
    const response = await fetch('https://www.spyglasses.io/api/patterns', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch patterns: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Successfully fetched ${data.patterns.length} bot patterns and ${data.aiReferrers.length} AI referrers`);
    
    return {
      patterns: data.patterns,
      aiReferrers: data.aiReferrers
    };
  } catch (error) {
    console.error('❌ Error fetching Spyglasses patterns:', error);
    return { patterns: null, aiReferrers: null };
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // This function runs at build time only
  async rewrites() {
    // Fetch patterns at build time
    const { patterns, aiReferrers } = await fetchPatternsAtBuildTime();
    
    // Set environment variables for the middleware
    if (patterns) {
      process.env.SPYGLASSES_PATTERNS = JSON.stringify(patterns);
    }
    
    if (aiReferrers) {
      process.env.SPYGLASSES_AI_REFERRERS = JSON.stringify(aiReferrers);
    }
    
    return {
      beforeFiles: []
    };
  }
};

module.exports = nextConfig; 