# Deployment Guides

## Vercel

1. Install the package:
```bash
npm install @spyglasses/next
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