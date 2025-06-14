# Spyglasses for Next.js

[![npm version](https://badge.fury.io/js/@spyglasses%2Fnext.svg)](https://www.npmjs.com/package/@spyglasses/next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A middleware for Next.js that detects and optionally blocks AI bots and trackers, while also tracking human visitors coming from AI platforms like ChatGPT, Claude, and Perplexity.

## Key Features

- **High Performance:** Uses runtime pattern loading with Next.js built-in fetch caching for optimal performance in serverless environments
- **Bot Detection:** Identifies and can block AI crawlers, model trainers, and other bots
- **AI Referrer Tracking:** Tracks human visitors coming from AI platforms
- **Serverless Ready:** Designed specifically for serverless deployments (Vercel, Netlify, etc.)

## Installation

```bash
npm install @spyglasses/next
# or
yarn add @spyglasses/next
# or
pnpm add @spyglasses/next
```

## Quick Start

1. Create a `middleware.ts` file in the root of your Next.js project:

```typescript
// middleware.ts
import { createSpyglassesMiddleware } from '@spyglasses/next';

export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.SPYGLASSES_DEBUG === 'true'
});

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)'],
};
```

2. Add your API key to your environment variables (`.env.local`):

```
SPYGLASSES_API_KEY=your_api_key_here
SPYGLASSES_CACHE_TTL=86400
SPYGLASSES_DEBUG=true
```

That's it! The middleware will now detect and log AI bots and referrers visiting your site. Blocking rules are configured through the Spyglasses platform web interface.

## How It Works

Spyglasses uses **runtime pattern loading with Next.js caching**:

1. **First request**: Patterns and property settings are fetched from the Spyglasses API
2. **Automatic caching**: Next.js caches the response using built-in fetch caching
3. **Subsequent requests**: Use cached patterns and settings until TTL expires
4. **Cache expiry**: After TTL expires, next request triggers refresh
5. **Background refresh**: New patterns and settings fetched in background, cache updated

This approach is optimized for serverless environments where build-time data persistence isn't available.

## Configuring Blocking Rules

Blocking rules are now managed through the Spyglasses platform web interface rather than in code. To configure blocking:

1. Log into your Spyglasses dashboard
2. Navigate to your property
3. Go to the "Traffic Control" section
4. Configure your blocking preferences:
   - **Global AI Model Trainer Blocking**: Block all AI model training bots
   - **Custom Block Rules**: Block specific categories, subcategories, or patterns
   - **Custom Allow Rules**: Create exceptions to allow specific bots

The middleware will automatically load and apply these settings when it syncs patterns from the API.

## Usage Examples

We provide several example implementations to help you integrate Spyglasses into your Next.js application:

- **[Basic Example](./examples/basic)** - Simple integration with minimal configuration
- **[Middleware Chaining](./examples/middleware-chaining)** - Integrate with existing middleware

See the [examples directory](./examples) for more details.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPYGLASSES_API_KEY` | Your Spyglasses API key | Required |
| `SPYGLASSES_CACHE_TTL` | Cache duration in seconds | `86400` (24 hours) |
| `SPYGLASSES_DEBUG` | Enable debug logging (`true`/`false`) | `false` |
| `SPYGLASSES_COLLECTOR_ENDPOINT` | Override the default endpoint | Optional |

## Configuration Options

The middleware accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `process.env.SPYGLASSES_API_KEY` | Your Spyglasses API key |
| `debug` | `boolean` | `false` | Enable debug logging |
| `excludePaths` | `(string \| RegExp)[]` | Default exclusions | Paths to exclude from monitoring |
| `collectEndpoint` | `string` | `process.env.SPYGLASSES_COLLECTOR_ENDPOINT` | Override the default endpoint |

## Advanced Usage

### Path Exclusions

```typescript
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.SPYGLASSES_DEBUG === 'true',
  excludePaths: [
    '/health',                 // Exclude health check
    /^\/admin/,               // Exclude admin paths (regex)
  ],
});
```

## License

MIT License - see [LICENSE](LICENSE) for details 