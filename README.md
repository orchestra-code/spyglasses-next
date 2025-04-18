# Spyglasses for Next.js

[![npm version](https://badge.fury.io/js/@spyglasses%2Fnext.svg)](https://www.npmjs.com/package/@spyglasses/next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Detect and monitor AI agents, bots, and scrapers visiting your Next.js application.

## Installation

```bash
npm install @spyglasses/next
# or
yarn add @spyglasses/next
# or
pnpm add @spyglasses/next
```

## Quick Start

1. Create or update your `middleware.ts` file in your Next.js project root:

```typescript
import { createSpyglassesMiddleware } from '@spyglasses/next';

// Export the middleware
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY
});

// Configure matcher
export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|static|.*\\..*).*)',
  ],
};
```

2. Add your API key to your environment variables:

```env
SPYGLASSES_API_KEY=your_api_key_here
```

That's it! Spyglasses will now detect and monitor AI traffic to your site.

## Configuration

The middleware accepts the following options:

```typescript
interface SpyglassesConfig {
  // Your Spyglasses API key (required)
  apiKey?: string;
  
  // Override the default collector endpoint
  collectorEndpoint?: string;
  
  // Enable debug logging
  debug?: boolean;
}
```

### Environment Variables

- `SPYGLASSES_API_KEY`: Your Spyglasses API key
- `SPYGLASSES_COLLECTOR_ENDPOINT`: (Optional) Override the default collector endpoint

## Advanced Usage

### Custom Matcher Configuration

You can customize which routes are monitored by modifying the matcher configuration:

```typescript
export const config = {
  matcher: [
    // Monitor all routes except specific paths
    '/((?!_next|api|static|images|favicon.ico).*)',
  ],
};
```

### Debug Mode

Enable debug mode to log any collection errors:

```typescript
export default createSpyglassesMiddleware({
  apiKey: process.env.SPYGLASSES_API_KEY,
  debug: process.env.NODE_ENV === 'development'
});
```

## Development

To run the middleware in development:

1. Set up your environment variables:
```bash
cp .env.example .env.local
```

2. Add your API key to `.env.local`

3. Start your Next.js application as normal:
```bash
npm run dev
```

## Security

The middleware:
- Only monitors incoming requests
- Doesn't modify your application's responses
- Runs at the edge for minimal performance impact
- Only sends data for detected bot/AI traffic
- Uses secure HTTPS for all API communication

## Support

- [Documentation](https://docs.spyglasses.io)
- [Dashboard](https://app.spyglasses.io)
- [Issues](https://github.com/orchestra-code/spyglasses-next/issues)

## License

MIT License - see [LICENSE](LICENSE) for details 