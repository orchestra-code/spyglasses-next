import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSpyglassesMiddleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock environment variables
vi.stubEnv('SPYGLASSES_API_KEY', 'default-api-key');

// Mock the SDK's detect function
vi.mock('@spyglasses/sdk', () => ({
  detect: vi.fn((userAgent: string) => ({
    isBot: userAgent.includes('Googlebot'),
    confidence: 0.9,
    type: 'crawler'
  }))
}));

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

    it('uses provided API key and debug settings', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response());
      global.fetch = fetchMock;

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key',
        debug: true
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      await middleware(request);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://www.spyglasses.io/api/collect',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-key'
          })
        })
      );
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
  });

  describe('Bot Detection', () => {
    it('processes non-bot traffic without collector call', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response());
      global.fetch = fetchMock;

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      await middleware(request);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('processes bot traffic with collector call', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response());
      global.fetch = fetchMock;

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key'
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      await middleware(request);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://www.spyglasses.io/api/collect',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-key'
          })
        })
      );

      const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(payload).toMatchObject({
        url: 'https://example.com/',
        user_agent: 'Googlebot',
        request_method: 'GET',
        request_path: '/',
        headers: expect.any(Object)
      });
    });

    it('does not call collector without API key', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response());
      global.fetch = fetchMock;

      const middleware = createSpyglassesMiddleware({});

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      await middleware(request);

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles collector errors gracefully with debug enabled', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = fetchMock;

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key',
        debug: true
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      await middleware(request);

      expect(consoleError).toHaveBeenCalledWith(
        'Spyglasses collector error:',
        expect.any(Error)
      );
    });

    it('handles collector errors silently without debug mode', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = fetchMock;

      const middleware = createSpyglassesMiddleware({
        apiKey: 'test-key',
        debug: false
      });

      const request = new NextRequest('https://example.com', {
        headers: { 'user-agent': 'Googlebot' }
      });

      await middleware(request);

      expect(consoleError).not.toHaveBeenCalled();
    });
  });
}); 