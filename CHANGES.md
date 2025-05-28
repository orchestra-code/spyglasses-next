# Changes in v0.3.0

This release includes significant improvements to the Spyglasses Next.js middleware, focusing on performance, flexibility, and blocking capabilities.

## Major Changes

### Build-time Pattern Loading
- Optimized for serverless environments by loading patterns during build time
- Uses `next.config.js` to fetch and inject patterns into the environment
- Zero runtime API calls for pattern loading in production

### Bot Blocking Capabilities
- Added ability to block AI model trainers (GPTBot, Claude-Bot, etc.)
- Added customizable blocking rules based on categories, subcategories, and patterns
- Added allow rules to create exceptions to block rules

### Performance Improvements
- Module-level caching of patterns and regex objects
- More efficient pattern matching
- Non-blocking API calls for logging visits

## API Changes

### New Configuration Options
- `blockAiModelTrainers`: Boolean to block AI model training bots
- `customBlocks`: Array of patterns to block
- `customAllows`: Array of patterns to allow (overrides blocks)
- Removed `trackAiReferrers` option (now always enabled)

### Type Changes
- Updated to use new SDK types (`BotPattern` instead of `ExportedPattern`)
- Updated to use new SDK types (`AiReferrerInfo` instead of `AiReferrerPattern`)

## Documentation Updates
- Comprehensive README with detailed examples
- Added examples for build-time pattern loading
- Added examples for blocking configuration
- Added performance considerations for serverless environments

## Dependencies
- Now depends on `@spyglasses/sdk` v0.3.1
- Requires Next.js 12.0.0 or later 