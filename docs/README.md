# NeuReed Documentation

Welcome to the NeuReed documentation! This guide will help you navigate all available documentation for using, deploying, and developing NeuReed.

---

## 🚀 Quick Start

- **[Installation & Setup](../README.md#installation)** - Get NeuReed running locally
- **[Deployment Guide](deployment/deployment.md)** - Deploy to production
- **[Configuration Reference](configuration/configuration-reference.md)** - Complete settings guide

---

## 📚 User Guides

### Features
- **[Saved Searches](features/saved-searches/)** - Create and manage persistent search queries
  - [User Guide](features/saved-searches/USER_GUIDE_SAVED_SEARCHES.md) - How to use saved searches
  - [Performance Guide](features/saved-searches/SAVED_SEARCH_PERFORMANCE_GUIDE.md) - Optimization tips
- **[Article Summarization](features/summarization.md)** - AI-powered article summaries
- **[Admin Provider Control](features/admin-provider-control.md)** - Manage AI providers
- **[Default Feeds](features/default-feeds.md)** - Understanding default subscriptions

---

## 🏗️ Architecture

### System Design
- **[Credentials Management](architecture/credentials-management.md)** - Admin vs user credentials architecture
- **[Caching Strategy](architecture/caching.md)** - Redis cache implementation and patterns

### Key Concepts
- **Settings Hierarchy**: Feed-level → Category-level → User defaults → System defaults
- **AI Provider Architecture**: Admin controls + user credentials + system fallback
- **Caching Pattern**: Cache-aside with automatic invalidation

---

## 🔧 Developer Guides

### Development Patterns
- **[Development Guides](guides/development/)** - Modern React and Next.js patterns
  - [Server Actions Migration](guides/development/server-actions-migration.md) - Migrate API routes to Server Actions
  - [Server Actions Testing](guides/development/server-actions-testing.md) - Testing strategies
  - [Optimistic Updates](guides/development/optimistic-updates.md) - Implement optimistic UI
  - [Modal Management](guides/development/modal-management.md) - Intercepting Routes + Context API
  - [Suspense Boundaries](guides/development/suspense-boundaries.md) - Loading states with skeletons
  - [Layout Abstractions](guides/development/layout-abstractions.md) - Reusable page layouts

### Architecture Patterns
- **[Architecture Guides](guides/architecture/)** - Architectural decisions and patterns
  - [Server vs Client Components](guides/architecture/server-vs-client-components.md) - Decision tree
  - [Bundle Analysis](guides/architecture/bundle-analysis.md) - Optimize JavaScript bundles

### Testing
- **[Testing Saved Searches](features/saved-searches/TESTING_SAVED_SEARCHES.md)** - Testing strategies
- **[Test Infrastructure](archive/2024-refactoring/PHASE_0_COMPLETION.md)** - Vitest + Testing Library setup

---

## 🚀 Deployment

- **[General Deployment](deployment/deployment.md)** - Complete deployment instructions
- **[Dokploy Setup](deployment/dokploy-setup.md)** - Deploy with Dokploy
- **[Production Configuration](deployment/production-config.md)** - Cron jobs and production settings
- **[Production Migration Guide](deployment/PRODUCTION_MIGRATION_GUIDE.md)** - Migrating to production

---

## 📖 API Reference

- **[Admin LLM Configuration](api/admin-llm-config.md)** - Manage LLM settings programmatically

---

## ⚙️ Configuration

- **[Complete Configuration Reference](configuration/configuration-reference.md)** - All environment variables and settings

---

## 📋 Planning & Roadmap

- **[Feature Backlog](planning/backlog.md)** - Planned features and enhancements
- **[Animation System Plan](planning/animation-system-plan.md)** - Proposed animation architecture
- **[React Hook Form Plan](planning/react-hook-form-plan.md)** - Form library integration proposal

---

## 📦 Archive

### 2024 Refactoring
- **[Refactoring Report](archive/2024-refactoring/REFACTORING_2024_REPORT.md)** - Complete refactoring summary
- **[Refactoring Completion Summary](REFACTOR_COMPLETION_SUMMARY.md)** - Final completion status
- **[Phase Documentation](archive/2024-refactoring/)** - Historical phase reports

### Bundle Analysis
- **[Historical Bundle Analysis](archive/bundle-analysis/2024-11-25/)** - Baseline bundle metrics

---

## 🔗 External Links

- **[Main README](../README.md)** - Project overview and quick start
- **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute
- **[Changelog](../CHANGELOG.md)** - Version history and changes
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant development guide

---

## 📊 Documentation Structure

```
docs/
├── api/                             # API documentation
│   └── admin-llm-config.md
├── architecture/                    # System architecture
│   ├── caching.md
│   └── credentials-management.md
├── configuration/                   # Configuration guides
│   └── configuration-reference.md
├── deployment/                      # Deployment guides
│   ├── deployment.md
│   ├── dokploy-setup.md
│   └── production-config.md
├── features/                        # Feature documentation
│   ├── saved-searches/             # Saved searches feature
│   ├── admin-provider-control.md
│   ├── default-feeds.md
│   ├── summarization-setup.md
│   └── summarization.md
├── guides/                          # Developer guides
│   ├── development/                # Development patterns
│   └── architecture/               # Architecture patterns
├── planning/                        # Future work and roadmap
│   ├── backlog.md
│   ├── animation-system-plan.md
│   └── react-hook-form-plan.md
├── archive/                         # Historical documentation
│   ├── 2024-refactoring/          # Refactoring reports
│   └── bundle-analysis/           # Bundle analysis reports
├── screenshots/                     # Application screenshots
└── README.md                        # This file
```

---

## 🎯 Common Tasks

### I Want To...

**Deploy NeuReed**
→ Start with [Deployment Guide](deployment/deployment.md), then [Production Configuration](deployment/production-config.md)

**Configure AI Features**
→ See [Configuration Reference](configuration/configuration-reference.md) and [Admin LLM Config API](api/admin-llm-config.md)

**Understand the Architecture**
→ Read [Credentials Management](architecture/credentials-management.md) and [Caching Strategy](architecture/caching.md)

**Set Up Summarization**
→ Follow [Summarization Setup](features/summarization-setup.md)

**Use Saved Searches**
→ Check [Saved Searches User Guide](features/saved-searches/USER_GUIDE_SAVED_SEARCHES.md)

**Implement Modern React Patterns**
→ Browse [Development Guides](guides/development/)

**Optimize Bundle Size**
→ See [Bundle Analysis Guide](guides/architecture/bundle-analysis.md) and [Server vs Client Components](guides/architecture/server-vs-client-components.md)

**Deploy with Dokploy**
→ Follow [Dokploy Setup Guide](deployment/dokploy-setup.md)

---

## 🛠️ Development Resources

### For Developers

- **[CLAUDE.md](../CLAUDE.md)** - Complete development guide for AI assistants
  - Common commands
  - High-level architecture
  - Service layer patterns
  - Development guidelines
  - Important notes

### For Contributors

- **[Contributing Guide](../CONTRIBUTING.md)** - Contribution guidelines and standards
- **[Changelog](../CHANGELOG.md)** - Version history and recent changes

### Historical Context

- **[2024 Refactoring Report](archive/2024-refactoring/REFACTORING_2024_REPORT.md)** - Major refactoring completed in November 2024
- **[Refactoring Completion Summary](REFACTOR_COMPLETION_SUMMARY.md)** - Achievement summary and metrics

---

## 💡 Tips

- **New to NeuReed?** Start with the [Main README](../README.md)
- **Deploying?** Check [Deployment Guide](deployment/deployment.md) first
- **Configuring features?** Use [Configuration Reference](configuration/configuration-reference.md)
- **Building features?** See [Development Guides](guides/development/)
- **Understanding internals?** Read [Architecture docs](architecture/) and [CLAUDE.md](../CLAUDE.md)
- **Optimizing performance?** Check [Bundle Analysis](guides/architecture/bundle-analysis.md) and [Caching Strategy](architecture/caching.md)

---

## 🔍 Search Tips

Can't find what you're looking for? Try:
1. Use `Ctrl+F` / `Cmd+F` to search this page
2. Check the [Documentation Structure](#-documentation-structure) above
3. Browse specific sections: [Guides](guides/), [Features](features/), [API](api/)
4. Review [CLAUDE.md](../CLAUDE.md) for development-specific information
5. Check [archived documentation](archive/) for historical context

---

## 📞 Support

**Questions or Issues?**
- Check the relevant documentation section above
- Review [CLAUDE.md](../CLAUDE.md) for development guidance
- Search [existing issues](https://github.com/madpin/neureed/issues)
- [Open a new issue](https://github.com/madpin/neureed/issues/new) if needed

---

**Last Updated:** November 29, 2025 (v0.3.0 release)
