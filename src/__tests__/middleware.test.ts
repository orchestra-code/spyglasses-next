import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSpyglassesMiddleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock environment variables
vi.stubEnv('SPYGLASSES_API_KEY', 'default-api-key');

// Mock the SDK - need to create mocks inside the factory to avoid hoisting issues
vi.mock('@spyglasses/sdk', () => {
  const mockDetect = vi.fn();
  const mockLogRequest = vi.fn();
  const mockSyncPatterns = vi.fn();
  const mockHasApiKey = vi.fn();

  return {
    Spyglasses: vi.fn().mockImplementation((config) => {
      return {
        apiKey: config.apiKey,
        debug: config.debug,
        detect: mockDetect,
        logRequest: mockLogRequest,
        syncPatterns: mockSyncPatterns,
        hasApiKey: mockHasApiKey
      };
    }),
    // Export mock functions for test access
    _mocks: {
      detect: mockDetect,
      logRequest: mockLogRequest,
      syncPatterns: mockSyncPatterns,
      hasApiKey: mockHasApiKey
    }
  };
});

describe('Spyglasses Middleware', () => {
  // Access mocks from the module
  let mockDetect: any;
  let mockLogRequest: any;
  let mockSyncPatterns: any;
  let mockHasApiKey: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocks from the mocked module
    const { _mocks } = await import('@spyglasses/sdk') as any;
    mockDetect = _mocks.detect;
    mockLogRequest = _mocks.logRequest;
    mockSyncPatterns = _mocks.syncPatterns;
    mockHasApiKey = _mocks.hasApiKey;
    
    // Set up default mock implementations
    mockHasApiKey.mockReturnValue(true);
    mockSyncPatterns.mockResolvedValue({
      version: '1.0.0',
      patterns: [],
      aiReferrers: [],
      propertySettings: {
        blockAiModelTrainers: false,
        customBlocks: [],
        customAllows: []
      }
    });
    mockLogRequest.mockResolvedValue({});
    
    // Default detection result: non-bot, no blocking
    mockDetect.mockReturnValue({
      isBot: false,
      shouldBlock: false,
      sourceType: 'none',
      matchedPattern: undefined,
      info: undefined
    });
  });

  afterEach(() => {
    // Reset module-level cache between tests
    vi.resetModules();
  });

  describe('Configuration', () => {
    it('uses default values when no config provided', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com');
      const response = await middleware(request);
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('creates middleware with provided config', async () => {
      const config = {
        apiKey: 'custom-key',
        debug: true
      };
      
      const middleware = createSpyglassesMiddleware(config);
      
      // Verify that the middleware is a function
      expect(typeof middleware).toBe('function');
      
      // Test that it can process a request
      const request = new NextRequest('https://example.com');
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('Pattern Syncing', () => {
    it('triggers pattern sync when API key is available', async () => {
      mockHasApiKey.mockReturnValue(true);
      
      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });
      
      // Give sync a moment to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSyncPatterns).toHaveBeenCalled();
    });

    it('does not trigger pattern sync when no API key', async () => {
      mockHasApiKey.mockReturnValue(false);
      
      const middleware = createSpyglassesMiddleware({});
      
      // Give sync a moment to potentially start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSyncPatterns).not.toHaveBeenCalled();
    });

    it('handles pattern sync errors gracefully', async () => {
      mockHasApiKey.mockReturnValue(true);
      mockSyncPatterns.mockRejectedValue(new Error('Sync failed'));
      
      // Should not throw an error
      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });
      
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
      expect(mockDetect).not.toHaveBeenCalled();
    });

    it('skips API routes', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com/api/test');
      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(mockDetect).not.toHaveBeenCalled();
    });

    it('skips Next.js internal routes', async () => {
      const middleware = createSpyglassesMiddleware({});
      const request = new NextRequest('https://example.com/_next/static/test.js');
      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(mockDetect).not.toHaveBeenCalled();
    });

    it('processes regular routes', async () => {
      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });
      const request = new NextRequest('https://example.com/about');
      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(mockDetect).toHaveBeenCalled();
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
      expect(mockDetect).not.toHaveBeenCalled();
    });
  });

  describe('Bot Detection and Logging', () => {
    it('processes non-bot traffic without logging', async () => {
      mockDetect.mockReturnValue({
        isBot: false,
        shouldBlock: false,
        sourceType: 'none'
      });

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(mockDetect).toHaveBeenCalledWith(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ''
      );
      expect(mockLogRequest).not.toHaveBeenCalled();
    });

    it('logs bot traffic when detected', async () => {
      mockDetect.mockReturnValue({
        isBot: true,
        shouldBlock: false,
        sourceType: 'bot',
        info: {
          type: 'crawler',
          category: 'Search Crawler',
          subcategory: 'Search Engines',
          company: 'Google'
        }
      });

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 
          'user-agent': 'Googlebot',
          'referer': 'https://google.com'
        }
      });

      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(mockLogRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          isBot: true,
          sourceType: 'bot'
        }),
        expect.objectContaining({
          url: 'https://example.com/',
          method: 'GET',
          path: '/',
          userAgent: 'Googlebot',
          referrer: 'https://google.com',
          responseStatus: 200
        })
      );
    });

    it('logs AI referrer traffic when detected', async () => {
      mockDetect.mockReturnValue({
        isBot: false,
        shouldBlock: false,
        sourceType: 'ai_referrer',
        info: {
          id: 'chatgpt',
          name: 'ChatGPT',
          company: 'OpenAI'
        }
      });

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'referer': 'https://chat.openai.com'
        }
      });

      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(mockLogRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          isBot: false,
          sourceType: 'ai_referrer'
        }),
        expect.objectContaining({
          url: 'https://example.com/',
          referrer: 'https://chat.openai.com',
          responseStatus: 200
        })
      );
    });

    it('does not log when no API key available', async () => {
      mockHasApiKey.mockReturnValue(false);
      mockDetect.mockReturnValue({
        isBot: true,
        shouldBlock: false,
        sourceType: 'bot'
      });

      const middleware = createSpyglassesMiddleware({});

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(mockLogRequest).not.toHaveBeenCalled();
    });

    it('handles logging errors gracefully', async () => {
      mockDetect.mockReturnValue({
        isBot: true,
        shouldBlock: false,
        sourceType: 'bot'
      });
      mockLogRequest.mockRejectedValue(new Error('Logging failed'));

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      // Should not throw an error
      const response = await middleware(request);
      expect(response).toEqual(NextResponse.next());
    });
  });

  describe('Blocking Behavior', () => {
    it('blocks traffic when shouldBlock is true', async () => {
      mockDetect.mockReturnValue({
        isBot: true,
        shouldBlock: true,
        sourceType: 'bot',
        info: {
          type: 'ai-trainer',
          category: 'AI Crawler',
          company: 'Example'
        }
      });

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'AITrainer/1.0' }
      });

      const response = await middleware(request);
      
      expect(response.status).toBe(403);
      expect(await response.text()).toBe('Access Denied');
      expect(response.headers.get('Content-Type')).toBe('text/plain');
    });

    it('logs blocked visits with 403 status', async () => {
      mockDetect.mockReturnValue({
        isBot: true,
        shouldBlock: true,
        sourceType: 'bot'
      });

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'AITrainer/1.0' }
      });

      await middleware(request);
      
      expect(mockLogRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldBlock: true
        }),
        expect.objectContaining({
          responseStatus: 403
        })
      );
    });

    it('handles blocking log errors gracefully', async () => {
      mockDetect.mockReturnValue({
        isBot: true,
        shouldBlock: true,
        sourceType: 'bot'
      });
      mockLogRequest.mockRejectedValue(new Error('Logging failed'));

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key',
        debug: true
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'AITrainer/1.0' }
      });

      // Should still block even if logging fails
      const response = await middleware(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Header Handling', () => {
    it('processes both referer and referrer headers', async () => {
      mockDetect.mockReturnValue({
        isBot: false,
        shouldBlock: false,
        sourceType: 'ai_referrer'
      });

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      // Test with 'referrer' header
      const request1 = new NextRequest('https://example.com', {
        headers: { 
          'user-agent': 'Mozilla/5.0',
          'referrer': 'https://chat.openai.com'
        }
      });

      await middleware(request1);
      
      expect(mockDetect).toHaveBeenCalledWith(
        'Mozilla/5.0',
        'https://chat.openai.com'
      );

      // Test with 'referer' header (more common)
      const request2 = new NextRequest('https://example.com', {
        headers: { 
          'user-agent': 'Mozilla/5.0',
          'referer': 'https://chat.openai.com'
        }
      });

      await middleware(request2);
      
      expect(mockDetect).toHaveBeenCalledWith(
        'Mozilla/5.0',
        'https://chat.openai.com'
      );
    });

    it('handles missing headers gracefully', async () => {
      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com');

      const response = await middleware(request);
      
      expect(mockDetect).toHaveBeenCalledWith('', '');
      expect(response).toEqual(NextResponse.next());
    });
  });
}); 