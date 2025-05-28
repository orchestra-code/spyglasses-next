import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpyglassesMiddleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock environment variables
vi.stubEnv('SPYGLASSES_API_KEY', 'default-api-key');

// Mock the SDK
vi.mock('@spyglasses/sdk', () => {
  const mockDetect = vi.fn().mockImplementation((userAgent) => {
    const isBot = userAgent.includes('Googlebot');
    return {
      isBot,
      shouldBlock: false,
      sourceType: isBot ? 'bot' : 'none',
      matchedPattern: isBot ? 'Googlebot' : undefined,
      info: isBot ? {
        type: 'crawler',
        category: 'Search Crawler',
        subcategory: 'Search Engines',
        company: 'Google',
        isCompliant: true,
        isAiModelTrainer: false,
        intent: 'Search'
      } : undefined
    };
  });

  const mockLogRequest = vi.fn().mockResolvedValue({});
  const mockHasApiKey = vi.fn().mockImplementation((apiKey) => !!apiKey);

  return {
    Spyglasses: vi.fn().mockImplementation((config) => {
      return {
        apiKey: config.apiKey,
        debug: config.debug,
        detect: mockDetect,
        logRequest: mockLogRequest,
        hasApiKey: () => !!config.apiKey
      };
    }),
    // Export the mocks for direct access in tests
    _mocks: {
      detect: mockDetect,
      logRequest: mockLogRequest,
      hasApiKey: mockHasApiKey
    }
  };
});

describe('Spyglasses Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('uses default values when no config provided', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com');
      const response = await middleware(request);
      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('Path Filtering', () => {
    it('skips static assets', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com/image.png');
      const response = await middleware(request);
      expect(response).toEqual(NextResponse.next());
    });

    it('skips API routes', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com/api/test');
      const response = await middleware(request);
      expect(response).toEqual(NextResponse.next());
    });

    it('skips Next.js internal routes', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com/_next/static/test.js');
      const response = await middleware(request);
      expect(response).toEqual(NextResponse.next());
    });

    it('processes regular routes', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com/about');
      const response = await middleware(request);
      expect(response).toEqual(NextResponse.next());
    });

    it('skips custom excluded paths', async () => {
      const middleware = createSpyglassesMiddleware({
        excludePaths: ['/admin', /^\/private\/.*/]
      });
      
      const adminRequest = new NextRequest('https://example.com/admin/dashboard');
      const privateRequest = new NextRequest('https://example.com/private/profile');
      
      const adminResponse = await middleware(adminRequest);
      const privateResponse = await middleware(privateRequest);
      
      expect(adminResponse).toEqual(NextResponse.next());
      expect(privateResponse).toEqual(NextResponse.next());
    });
  });

  describe('Bot Detection', () => {
    it('processes non-bot traffic with next response', async () => {
      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      const response = await middleware(request);
      expect(response).toEqual(NextResponse.next());
    });

    it('processes bot traffic with next response', async () => {
      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      const response = await middleware(request);
      expect(response).toEqual(NextResponse.next());
    });
  });
}); 