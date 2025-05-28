# Spyglasses for Next.js Examples

This directory contains examples demonstrating different ways to use the Spyglasses middleware in Next.js applications.

## Example Structure

- **basic/** - Basic middleware setup with minimal configuration
- **build-time-loading/** - Optimized setup with build-time pattern loading for serverless environments
- **with-blocking/** - Configuration for blocking AI model trainers and custom bot patterns
- **middleware-chaining/** - Example of combining Spyglasses with existing middleware
- **runtime-api/** - Alternative approach using runtime API pattern loading (not recommended for serverless)

## Which Example Should I Use?

For most production applications, we recommend:

1. Use **build-time-loading/** as your base implementation for optimal performance
2. Add blocking configuration from **with-blocking/** if you want to block AI bots
3. Use the middleware chaining pattern from **middleware-chaining/** if you have existing middleware

## Important Notes

- The **runtime-api/** example is NOT recommended for serverless environments (Vercel, Netlify) as it will cause cold-start penalties
- For detailed deployment instructions for specific platforms, see the [DEPLOYMENT.md](../DEPLOYMENT.md) file in the root directory 