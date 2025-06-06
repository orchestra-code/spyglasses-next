# Deployment Guide

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
   - Add `SPYGLASSES_API_KEY` with your API key
   - Optionally add `SPYGLASSES_CACHE_TTL` (defaults to 86400 seconds / 24 hours)
   - Deploy to apply changes

3. Create your middleware:
```typescript
// middleware.ts
import { createSpyglassesMiddleware } from '@spyglasses/next';

export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.NODE_ENV !== 'production'
});

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)'],
};
```

### Netlify

1. Install the package:
```bash
npm install @spyglasses/next
```

2. Add your API key in the Netlify dashboard:
   - Go to Site Settings > Build & Deploy > Environment
   - Add `SPYGLASSES_API_KEY` with your API key
   - Optionally add `SPYGLASSES_CACHE_TTL`
   - Trigger a new deploy

3. The middleware will automatically handle pattern caching using Next.js built-in mechanisms.

### AWS Amplify

1. Install the package:
```bash
npm install @spyglasses/next
```

2. Add your API key:
   - Go to App Settings > Environment Variables
   - Add `SPYGLASSES_API_KEY` with your API key
   - Optionally add `SPYGLASSES_CACHE_TTL`
   - Redeploy your application

### Docker

1. Add environment variables to your Dockerfile:
```dockerfile
ENV SPYGLASSES_API_KEY=your_api_key_here
ENV SPYGLASSES_CACHE_TTL=86400
```

Or use docker-compose:
```yaml
services:
  web:
    environment:
      - SPYGLASSES_API_KEY=your_api_key_here
      - SPYGLASSES_CACHE_TTL=86400
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SPYGLASSES_API_KEY` | Your Spyglasses API key | None | Yes |
| `SPYGLASSES_CACHE_TTL` | Cache duration in seconds | `86400` (24 hours) | No |

## Blocking Configuration

You can configure Spyglasses to block specific bots or AI model trainers:

```typescript
// middleware.ts
import { createSpyglassesMiddleware } from '@spyglasses/next';

export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  
  // Block AI model trainers (GPTBot, Claude-Bot, etc.)
  blockAiModelTrainers: true,
  
  // Block specific categories, subcategories, or patterns
  customBlocks: [
    'category:Scraper',                    // Block all scrapers
    'subcategory:AI Agent',               // Block all AI agents
    'pattern:SomeSpecificBot'             // Block specific bot
  ],
  
  // Allow specific patterns (overrides blocks)
  customAllows: [
    'pattern:Googlebot',                  // Always allow Googlebot
    'pattern:Bingbot'                     // Always allow Bingbot
  ],
  
  // Exclude specific paths from monitoring
  excludePaths: [
    '/health',                            // Health checks
    '/api/webhooks',                      // Webhook endpoints
    /^\/admin/                           // Admin paths (regex)
  ]
});
```

## Integrating with Existing Middleware

Most Next.js applications already have custom middleware. Here's how to integrate Spyglasses:

### Middleware Chaining (Recommended)

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
    // Standard Spyglasses matcher
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)',
    // Your custom matchers
    '/protected/:path*',
  ],
}
```

### Conditional Middleware

Run different middleware based on path:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSpyglassesMiddleware } from '@spyglasses/next'

const spyglassesMiddleware = createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  blockAiModelTrainers: true
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only run Spyglasses on public pages
  if (!pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
    return spyglassesMiddleware(request);
  }
  
  // Run your custom middleware for other paths
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',]
}
```

## Using with Edge Functions

The middleware is fully compatible with Edge Functions:

```typescript
// middleware.ts
import { createSpyglassesMiddleware } from '@spyglasses/next';

// Create middleware with edge-optimized config
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: false // Keep debug off in production edge functions
});

// Export runtime config for Edge
export const config = {
  runtime: 'edge',
  matcher: ['/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)']
};
```

## Cache Configuration

### Default Caching

By default, patterns are cached for 24 hours (86400 seconds):

```typescript
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  // Uses SPYGLASSES_CACHE_TTL environment variable or 86400 default
});
```

### Custom Cache Duration

Set a custom cache duration via environment variable:

```bash
# Cache for 1 hour
SPYGLASSES_CACHE_TTL=3600

# Cache for 30 minutes  
SPYGLASSES_CACHE_TTL=1800

# Cache for 1 week
SPYGLASSES_CACHE_TTL=604800
```

### How Caching Works

1. **First Request**: Middleware fetches patterns from Spyglasses API
2. **Next.js Caching**: Response is automatically cached by Next.js fetch
3. **Subsequent Requests**: Use cached patterns (no API calls)
4. **Cache Expiry**: After TTL expires, next request triggers refresh
5. **Background Refresh**: New patterns fetched in background, cache updated

## Troubleshooting

### Common Issues

**API Key Not Found**
- Verify `SPYGLASSES_API_KEY` is set in your deployment environment
- Check for typos in the environment variable name
- Ensure the environment variable is available at runtime

**Middleware Not Running**
- Confirm `middleware.ts` is in your project root (same level as `app/` or `pages/`)
- Check your matcher configuration
- Verify Next.js version is 12.0.0 or higher

**Pattern Loading Issues**
- Check that your API key has access to the patterns API
- Enable debug mode to see error messages: `debug: true`
- Verify network connectivity from your deployment environment

**Performance Issues**
- Monitor cache hit rates in debug mode
- Consider adjusting `SPYGLASSES_CACHE_TTL` based on your traffic patterns
- Optimize your middleware matcher to exclude unnecessary paths

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: true // Enable debug logging
});
```

This will log:
- Pattern sync attempts and results
- Cache hits and misses
- Detection results
- Error messages

### Getting Help

Need assistance? Contact support@spyglasses.io with:
- Your deployment platform
- Debug logs (if available)
- Configuration details
- Description of the issue 