# Spyglasses for Next.js

[![npm version](https://badge.fury.io/js/@spyglasses%2Fnext.svg)](https://www.npmjs.com/package/@spyglasses/next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A middleware for Next.js that detects and optionally blocks AI bots and trackers, while also tracking human visitors coming from AI platforms like ChatGPT, Claude, and Perplexity.

## Key Features

- **High Performance:** Uses runtime pattern loading with Next.js built-in fetch caching for optimal performance in serverless environments
- **Bot Detection:** Identifies and can block AI crawlers, model trainers, and other bots
- **AI Referrer Tracking:** Tracks human visitors coming from AI platforms
- **Customizable Rules:** Configure which bots to block or allow with fine-grained control
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

That's it! The middleware will now detect and log AI bots and referrers visiting your site.

## How It Works

Spyglasses uses **runtime pattern loading with Next.js caching**:

1. **First request**: Patterns are fetched from the Spyglasses API
2. **Automatic caching**: Next.js caches the response using built-in fetch caching
3. **Subsequent requests**: Use cached patterns until TTL expires
4. **Cache revalidation**: Automatically refreshes when cache expires

This approach is optimized for serverless environments where build-time data persistence isn't available.

## Usage Examples

We provide several example implementations to help you integrate Spyglasses into your Next.js application:

- **[Basic Example](./examples/basic)** - Simple integration with minimal configuration
- **[Custom Rules](./examples/custom-rules)** - Configure custom block and allow lists
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
| `blockAiModelTrainers` | `boolean` | `false` | Whether to block AI model trainers (GPTBot, Claude, etc.) |
| `customBlocks` | `string[]` | `[]` | Custom patterns to block |
| `customAllows` | `string[]` | `[]` | Custom patterns to allow (overrides blocks) |
| `excludePaths` | `(string \| RegExp)[]` | Default exclusions | Paths to exclude from monitoring |
| `collectEndpoint` | `string` | `process.env.SPYGLASSES_COLLECTOR_ENDPOINT` | Override the default endpoint |

## Advanced Usage

### Blocking AI Model Trainers

```typescript
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.SPYGLASSES_DEBUG === 'true',
  blockAiModelTrainers: true, // Blocks GPTBot, Claude-Bot, etc.
});
```

### Custom Block and Allow Rules

```typescript
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.SPYGLASSES_DEBUG === 'true',
  customBlocks: [
    'category:Scraper',        // Block all scrapers
    'pattern:SomeBot',         // Block specific bot
  ],
  customAllows: [
    'pattern:Googlebot',       // Always allow Googlebot
  ],
});
```

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