# Contributing to Spyglasses Next.js Plugin

Thank you for your interest in contributing to Spyglasses! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/orchestra-code/spyglasses-next.git
cd spyglasses-next
```

2. Install dependencies:
```bash
npm install
```

3. Create your environment file:
```bash
cp .env.example .env.local
```

4. Start development:
```bash
npm run dev
```

## Code Style

- We use TypeScript for type safety
- Format with Prettier
- Lint with ESLint
- Follow conventional commits

## Testing

1. Run the test suite:
```bash
npm test
```

2. For development with watch mode:
```bash
npm run test:watch
```

## Pull Request Process

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit using conventional commits:
```bash
git commit -m "feat: add new feature"
```

3. Push to your fork and create a Pull Request

4. Ensure your PR:
   - Passes all tests
   - Includes relevant tests
   - Updates documentation
   - Follows code style guidelines

## Release Process

We use changesets for version management:

1. Create a changeset:
```bash
npx changeset
```

2. Follow the prompts to describe your changes

3. Commit the changeset file

The release workflow will handle versioning and publishing.

## Getting Help

- Open an issue for bugs
- Discussions for questions
- Pull requests for code changes

## Security

Please report security issues directly to security@spyglasses.io 