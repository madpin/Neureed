# Architecture Guides

This directory contains architectural decision guides and patterns for building scalable React applications with Next.js.

## Available Guides

- **[server-vs-client-components.md](server-vs-client-components.md)** - Decision tree for Server vs Client Components
- **[bundle-analysis.md](bundle-analysis.md)** - Analyzing and optimizing bundle size

## Overview

These guides help you make informed architectural decisions when building features in NeuReed.

### Server vs Client Components

Learn when to use Server Components (default) vs Client Components:
- Decision tree for component type selection
- Performance implications
- Migration strategies
- Common pitfalls and solutions

### Bundle Analysis

Understand and optimize your application's JavaScript bundle:
- Running bundle analysis
- Interpreting results
- Optimization strategies
- Measuring improvements

## Related Resources

- [Development Guides](../development/) - Implementation patterns
- [CLAUDE.md](../../../CLAUDE.md) - Project architecture overview
- [Archive: 2024 Refactoring](../../archive/2024-refactoring/) - Historical context

## Key Principles

1. **Default to Server Components** - Only use Client Components when necessary
2. **Measure First** - Use bundle analysis before optimizing
3. **Progressive Enhancement** - Build features that work without JavaScript
4. **Type Safety** - Leverage TypeScript for architectural decisions

## Support

For architectural questions:
1. Review the specific guide
2. Check [CLAUDE.md](../../../CLAUDE.md) for project-specific patterns
3. See [Refactoring Report](../../archive/2024-refactoring/REFACTORING_2024_REPORT.md) for decisions made
