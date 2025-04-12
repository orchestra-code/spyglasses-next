import { NextResponse, type NextRequest } from 'next/server';
import { Detector } from '@spyglasses/sdk';
import patterns from '@spyglasses/sdk/patterns/agents.json';

const COLLECTOR_ENDPOINT = process.env.SPYGLASSES_COLLECTOR_ENDPOINT || 'https://www.spyglasses.io/api/collect';
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

    // Only send to collector if it's bot traffic
    if (result.isBot && apiKey) {
      const url = new URL(request.url);
      const payload = {
        url: request.url,
        user_agent: userAgent,
        ip_address: request.ip || '',
        request_method: request.method,
        request_path: url.pathname,
        request_query: url.search,
        headers: Object.fromEntries(request.headers),
        response_status: 200,
        response_time_ms: 0,
        timestamp: new Date().toISOString()
      };

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
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