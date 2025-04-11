import { NextResponse, type NextRequest } from 'next/server';
import { Detector } from '@spyglasses/sdk';
import patterns from '@spyglasses/sdk/patterns/agents.json';

const COLLECTOR_ENDPOINT = process.env.SPYGLASSES_COLLECTOR_ENDPOINT || 'https://api.spyglasses.io/v1/collect';
const API_KEY = process.env.SPYGLASSES_API_KEY;

export function createSpyglassesMiddleware(config: {
  apiKey?: string;
  collectorEndpoint?: string;
  debug?: boolean;
}) {
  const detector = new Detector(patterns.patterns);
  const endpoint = config.collectorEndpoint || COLLECTOR_ENDPOINT;
  const apiKey = config.apiKey || API_KEY;

  return async function middleware(request: NextRequest) {
    // Skip certain paths
    if (
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2)$/)
    ) {
      return NextResponse.next();
    }

    const userAgent = request.headers.get('user-agent') || '';
    const result = detector.detect(userAgent);

    // Create response early to minimize latency
    const response = NextResponse.next();

    // Add detection headers
    response.headers.set('x-spyglasses-bot', result.isBot.toString());
    if (result.agentName) {
      response.headers.set('x-spyglasses-agent', result.agentName);
    }

    // Fire and forget collector request
    if (apiKey) {
      const payload = {
        url: request.url,
        method: request.method,
        userAgent,
        headers: Object.fromEntries(request.headers),
        ip: request.ip,
        detectionResult: result
      };

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      }).catch(error => {
        if (config.debug) {
          console.error('Spyglasses collector error:', error);
        }
      });
    }

    return response;
  };
}

// Default middleware export
export default createSpyglassesMiddleware({}); 