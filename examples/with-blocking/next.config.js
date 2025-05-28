/**
 * Example next.config.js with blocking configuration
 * 
 * This example shows how to configure blocking for specific bot types,
 * categories, and patterns.
 */

// Fetch patterns at build time (same as build-time-loading example)
async function fetchPatternsAtBuildTime() {
  try {
    const apiKey = process.env.SPYGLASSES_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  SPYGLASSES_API_KEY not found in environment, using default patterns');
      return { patterns: null, aiReferrers: null };
    }
    
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
    console.log(`Successfully fetched ${data.patterns.length} bot patterns and ${data.aiReferrers.length} AI referrers`);
    
    return {
      patterns: data.patterns,
      aiReferrers: data.aiReferrers
    };
  } catch (error) {
    console.error('Error fetching Spyglasses patterns:', error);
    return { patterns: null, aiReferrers: null };
  }
}

/**
 * Blocking configuration
 * 
 * This configuration specifies which bots to block and which to allow.
 */
const blockingConfig = {
  // Block AI model trainers (GPTBot, Claude-Bot, etc.)
  // These are the bots that train AI models by crawling websites
  blockAiModelTrainers: true,
  
  // Block specific categories, subcategories, or patterns
  customBlocks: [
    // Block all scrapers
    'category:Scraper',
    
    // Block all AI assistants
    'subcategory:AI Agent:AI Assistants',
    
    // Block a specific bot by pattern
    'pattern:BadBot\\/[0-9]'
  ],
  
  // Allow specific patterns (overrides blocks)
  customAllows: [
    // Always allow Googlebot
    'pattern:Googlebot',
    
    // Allow specific search crawlers
    'type:Search Crawler:Search Engines:googlebot'
  ]
};

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
    
    // Set blocking configuration
    process.env.SPYGLASSES_BLOCK_AI_MODEL_TRAINERS = String(blockingConfig.blockAiModelTrainers);
    process.env.SPYGLASSES_CUSTOM_BLOCKS = JSON.stringify(blockingConfig.customBlocks);
    process.env.SPYGLASSES_CUSTOM_ALLOWS = JSON.stringify(blockingConfig.customAllows);
    
    return {
      beforeFiles: []
    };
  },
  
  // You can also set these in the env section
  env: {
    SPYGLASSES_BLOCK_AI_MODEL_TRAINERS: 'true',
    SPYGLASSES_CUSTOM_BLOCKS: JSON.stringify([
      'category:Scraper',
      'subcategory:AI Agent:AI Assistants'
    ]),
    SPYGLASSES_CUSTOM_ALLOWS: JSON.stringify([
      'pattern:Googlebot'
    ])
  }
};

module.exports = nextConfig; 