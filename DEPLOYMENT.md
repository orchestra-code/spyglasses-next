# Deployment Guides

This guide provides platform-specific deployment instructions and advanced usage patterns for the Spyglasses Next.js middleware.

## Platform-Specific Deployment

### Vercel

1. Install the package:
```bash
npm install @spyglasses/next
```

with yarn:
```
yarn add @spyglasses/next
```

with pnpm:
```
pnpm add @spyglasses/next
```

2. Add your API key in the Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add `SPYGLASSES_API_KEY`
   - Deploy to apply changes

3. For optimal performance with build-time pattern loading:
   - Configure your `next.config.js` to fetch patterns at build time
   - See the [Build-Time Pattern Loading](#build-time-pattern-loading) section below

### Netlify

1. Install the package:
```bash
npm install @spyglasses/next
```

2. Add your API key in the Netlify dashboard:
   - Go to Site Settings > Build & Deploy > Environment
   - Add `SPYGLASSES_API_KEY`
   - Trigger a new deploy

3. For optimal performance, add the build-time pattern loading in your `next.config.js`

### AWS Amplify

1. Install the package:
```bash
npm install @spyglasses/next
```

2. Add your API key:
   - Go to App Settings > Environment Variables
   - Add `SPYGLASSES_API_KEY`
   - Redeploy your application

### Docker

1. Add to your Dockerfile:
```dockerfile
ENV SPYGLASSES_API_KEY=your_api_key_here
```

Or use docker-compose:
```yaml
services:
  web:
    environment:
      - SPYGLASSES_API_KEY=your_api_key_here
```

## Build-Time Pattern Loading

For optimal performance in serverless environments, load bot patterns and AI referrers at build time:

```javascript
// next.config.js
async function fetchPatternsAtBuildTime() {
  try {
    const apiKey = process.env.SPYGLASSES_API_KEY;
    
    if (!apiKey) {
      console.warn('SPYGLASSES_API_KEY not found in environment, using default patterns');
      return { patterns: null, aiReferrers: null };
    }
    
    console.log('Fetching Spyglasses patterns at build time...');
    
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config...
  
  // This function runs at build time
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
```

## Blocking Configuration

You can configure Spyglasses to block specific bots or AI model trainers:

```javascript
// next.config.js
module.exports = {
  env: {
    // Block AI model trainers (GPTBot, Claude-Bot, etc.)
    SPYGLASSES_BLOCK_AI_MODEL_TRAINERS: 'true',
    
    // Block specific categories, subcategories, or patterns
    SPYGLASSES_CUSTOM_BLOCKS: JSON.stringify([
      'category:Scraper',                  // Block all scrapers
      'subcategory:AI Agent:AI Assistants' // Block all AI assistants
    ]),
    
    // Allow specific patterns (overrides blocks)
    SPYGLASSES_CUSTOM_ALLOWS: JSON.stringify([
      'pattern:Googlebot'                  // Always allow Googlebot
    ])
  }
};
```

## Integrating with Existing Middleware

Most Next.js applications already have custom middleware. Here are two ways to integrate Spyglasses with your existing middleware:

### 1. Middleware Chaining (Recommended)

Run multiple middleware functions in sequence:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSpyglassesMiddleware } from '@spyglasses/next'

// Create the Spyglasses middleware
const spyglassesMiddleware = createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  blockAiModelTrainers: true,
  customBlocks: ['category:Scraper'],
  customAllows: ['pattern:Googlebot']
});

// Your existing middleware
async function existingMiddleware(request: NextRequest) {
  // Your custom logic here
  return NextResponse.next()
}

// Chain them together
export async function middleware(request: NextRequest) {
  // Run Spyglasses middleware first
  const spyglassesResponse = await spyglassesMiddleware(request);
  
  // If Spyglasses is blocking the request, return early
  if (spyglassesResponse.status === 403) {
    return spyglassesResponse;
  }

  // Otherwise run your middleware
  return existingMiddleware(request)
}

// Configure matchers for both middlewares
export const config = {
  matcher: [
    // Spyglasses matchers
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)',
    // Your custom matchers
    '/protected/:path*',
  ],
}
```

### 2. Middleware Composition

Run middleware functions in parallel and combine their results:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSpyglassesMiddleware } from '@spyglasses/next'

// Create the Spyglasses middleware
const spyglassesMiddleware = createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  blockAiModelTrainers: true
});

// Your existing middleware
async function existingMiddleware(request: NextRequest) {
  // Your custom logic here
  return NextResponse.next()
}

// Compose middlewares
export async function middleware(request: NextRequest) {
  // Run both middlewares in parallel
  const [spyglassesResponse, existingResponse] = await Promise.all([
    spyglassesMiddleware(request),
    existingMiddleware(request),
  ])

  // Handle responses based on your needs
  if (spyglassesResponse.status === 403) {
    return spyglassesResponse // Block bot traffic
  }

  if (existingResponse.status === 401) {
    return existingResponse // Handle unauthorized access
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure matchers
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)',
    '/protected/:path*',
  ],
}
```

Choose the approach that best fits your needs:
- Use chaining when you want to run middlewares in sequence and potentially stop early
- Use composition when you want to run middlewares in parallel and combine their results

Not sure which you need? Chaining is the more common pattern, so unless you know you need composition, use chaining.

## Using with Edge Functions

If you're deploying to Edge Functions (Vercel Edge, Cloudflare Workers), the middleware is fully compatible:

```typescript
// middleware.ts
import { createSpyglassesMiddleware } from '@spyglasses/next';

// Create middleware with edge-optimized config
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  // Parse patterns from build-time environment variables
  patterns: process.env.SPYGLASSES_PATTERNS ? JSON.parse(process.env.SPYGLASSES_PATTERNS) : undefined,
  aiReferrers: process.env.SPYGLASSES_AI_REFERRERS ? JSON.parse(process.env.SPYGLASSES_AI_REFERRERS) : undefined
});

// Export runtime config for Edge
export const config = {
  runtime: 'edge',
  matcher: ['/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)']
};
```

## Troubleshooting

Common issues and solutions:

### API Key Not Found
- Verify environment variable is set
- Check for typos in variable name
- Ensure deployment includes environment variables

### Middleware Not Running
- Confirm `middleware.ts` is in the correct location
- Check matcher configuration
- Verify Next.js version (12.0.0 or higher required)

### Pattern Loading Issues
- Check that `next.config.js` is properly configured
- Verify API key has access to patterns API
- Add error handling in your pattern loading function

### Performance Issues
- Enable debug mode to check for errors
- Use build-time pattern loading for serverless environments
- Optimize your middleware matcher configuration

Need help? Contact support@spyglasses.io 