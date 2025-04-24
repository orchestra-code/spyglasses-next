# Deployment Guides

## Vercel

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

## Netlify

1. Install the package:
```bash
npm install @spyglasses/next
```

2. Add your API key in the Netlify dashboard:
   - Go to Site Settings > Build & Deploy > Environment
   - Add `SPYGLASSES_API_KEY`
   - Trigger a new deploy

## AWS Amplify

1. Install the package:
```bash
npm install @spyglasses/next
```

2. Add your API key:
   - Go to App Settings > Environment Variables
   - Add `SPYGLASSES_API_KEY`
   - Redeploy your application

## Docker

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

## Environment Variables at Runtime

For platforms that inject environment variables at runtime:

```typescript:middleware.ts
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  // Optional: override collector endpoint
  collectorEndpoint: process.env.SPYGLASSES_COLLECTOR_ENDPOINT,
  // Optional: enable debug logging
  debug: process.env.NODE_ENV === 'development'
});
```

## Wrapping existing middleware:

If you have existing middleware, you can compose it with Spyglasses in two ways:

1. Using Next.js middleware chaining:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSpyglassesMiddleware } from '@spyglasses/next'

// Create the Spyglasses middleware
const spyglassesMiddleware = createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
})

// Your existing middleware
async function existingMiddleware(request: NextRequest) {
  // Your custom logic here
  return NextResponse.next()
}

// Chain them together
export async function middleware(request: NextRequest) {
	// Run Spyglasses middleware first
	await spyglassesMiddleware(request);

  // Then run your middleware
  return existingMiddleware(request)
}

// Configure matchers for both middlewares
export const config = {
  matcher: [
    // Spyglasses matchers
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Your custom matchers
    '/protected/:path*',
  ],
}
```

2. Using middleware composition:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSpyglassesMiddleware } from '@spyglasses/next'

// Create the Spyglasses middleware
const spyglassesMiddleware = createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
})

// Your existing middleware
async function existingMiddleware(request: NextRequest) {
  // Your custom logic here
  return NextResponse.next()
}

// Compose middlewares
export async function middleware(request: NextRequest) {
  // Run both middlewares in sequence
  const [spyglassesResponse, existingResponse] = await Promise.all([
    spyglassesMiddleware(request),
    existingMiddleware(request),
  ])

  // Handle responses based on your needs
  if (spyglassesResponse?.status === 403) {
    return spyglassesResponse // Block bot traffic
  }

  if (existingResponse?.status === 401) {
    return existingResponse // Handle unauthorized access
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure matchers
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/protected/:path*',
  ],
}
```

Choose the approach that best fits your needs:
- Use chaining when you want to run middlewares in sequence and potentially stop early
- Use composition when you want to run middlewares in parallel and combine their results

Not sure which you need? Chaining is the more common pattern, so unless you know you need composition, use chaining.

## Troubleshooting

Common issues and solutions:

### API Key Not Found
- Verify environment variable is set
- Check for typos in variable name
- Ensure deployment includes environment variables

### Middleware Not Running
- Confirm `middleware.ts` is in the correct location
- Check matcher configuration
- Verify Next.js version (13.0.0 or higher required)

### Performance Issues
- Enable debug mode to check for errors
- Verify matcher configuration isn't too broad
- Check network latency to collector endpoint

Need help? Contact support@spyglasses.io 