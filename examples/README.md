# Spyglasses Next.js Examples

This directory contains examples showing how to use Spyglasses with Next.js in serverless environments.

## Examples

- [`basic/`](./basic/) - Minimal example without API key
- [`middleware-chaining/`](./middleware-chaining/) - Shows how to chain with existing middleware

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPYGLASSES_API_KEY` | Your Spyglasses API key | Required |
| `SPYGLASSES_CACHE_TTL` | Cache duration in seconds | `86400` (24 hours) |