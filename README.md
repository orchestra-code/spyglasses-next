# Spyglasses for Next.js

[![npm version](https://badge.fury.io/js/@spyglasses%2Fnext.svg)](https://www.npmjs.com/package/@spyglasses/next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A middleware for Next.js that detects and optionally blocks AI bots and trackers, while also tracking human visitors coming from AI platforms like ChatGPT, Claude, and Perplexity.

## Key Features

- **High Performance:** Uses build-time pattern loading for optimal performance in serverless environments
- **Bot Detection:** Identifies and can block AI crawlers, model trainers, and other bots
- **AI Referrer Tracking:** Tracks human visitors coming from AI platforms
- **Customizable Rules:** Configure which bots to block or allow with fine-grained control
- **Zero Runtime Dependencies:** All patterns are loaded at build time for minimal runtime overhead

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
  debug: process.env.NODE_ENV !== 'production'
});

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\.(jpg|jpeg|gif|png|svg|ico|css|js)).*)'],
};
```

2. Add your API key to your environment variables (`.env.local`):

```
SPYGLASSES_API_KEY=your_api_key_here
```

That's it! The middleware will now detect and log AI bots and referrers visiting your site.

## Usage Examples

We provide several example implementations to help you integrate Spyglasses into your Next.js application:

- **[Basic Example](./examples/basic)** - Simple integration with minimal configuration
- **[Build-time Pattern Loading](./examples/build-time-loading)** - Optimized for serverless environments
- **[Blocking Configuration](./examples/with-blocking)** - Block AI model trainers and custom bot patterns
- **[Middleware Chaining](./examples/middleware-chaining)** - Integrate with existing middleware
- **[Runtime API Loading](./examples/runtime-api)** - Alternative approach (not recommended for serverless)

See the [examples directory](./examples) for more details.

## Deployment Guides

For platform-specific deployment instructions and advanced usage patterns, see the [Deployment Guide](./DEPLOYMENT.md).

Topics covered in the deployment guide:
- Platform-specific deployment (Vercel, Netlify, AWS Amplify, Docker)
- Build-time pattern loading configuration
- Middleware chaining with existing middleware
- Using with Edge Functions
- Troubleshooting common issues

## Configuration Options

The middleware accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `process.env.SPYGLASSES_API_KEY` | Your Spyglasses API key |
| `debug` | `boolean` | `false` | Enable debug logging |
| `patterns` | `BotPattern[]` | Built-in patterns | Custom bot patterns to use (loaded at build time) |
| `aiReferrers` | `AiReferrerInfo[]` | Built-in referrers | Custom AI referrer patterns to use (loaded at build time) |
| `blockAiModelTrainers` | `boolean` | `false` | Whether to block AI model trainers (GPTBot, Claude, etc.) |
| `customBlocks` | `string[]` | `[]` | Custom patterns to block |
| `customAllows` | `string[]` | `[]` | Custom patterns to allow (overrides blocks) |
| `excludePaths` | `(string \| RegExp)[]` | Default exclusions | Paths to exclude from monitoring |

## License

MIT License - see [LICENSE](LICENSE) for details 