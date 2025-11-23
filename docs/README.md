# NeuReed Documentation

Welcome to the NeuReed documentation! This guide will help you understand, deploy, configure, and extend NeuReed.

## 📖 Quick Navigation

### Getting Started
- **[Main README](../README.md)** - Project overview, quick start, and basic setup
- **[Deployment Guide](deployment/deployment.md)** - Deploy NeuReed to production
- **[Configuration Reference](configuration/configuration-reference.md)** - Complete settings guide

### For Users & Administrators
- **[Default Feeds](features/default-feeds.md)** - Understanding the default feed subscriptions
- **[Summarization Feature](features/summarization.md)** - AI-powered article summaries
- **[Summarization Setup](features/summarization-setup.md)** - Configure summarization for your instance
- **[Admin Provider Control](features/admin-provider-control.md)** - Manage AI providers

### For Developers
- **[Architecture Documentation](architecture/)** - System design and patterns
  - [Credentials Management](architecture/credentials-management.md) - Admin vs user credentials
  - [Caching Strategy](architecture/caching.md) - Redis cache implementation
- **[API Documentation](api/)** - API endpoints and integration
  - [Admin LLM Configuration API](api/admin-llm-config.md) - Manage LLM settings programmatically

### Deployment & Operations
- **[Deployment Guide](deployment/deployment.md)** - Complete deployment instructions
- **[Dokploy Setup](deployment/dokploy-setup.md)** - Deploy with Dokploy
- **[Production Configuration](deployment/production-config.md)** - Cron jobs and embeddings in production

## 📚 Documentation Structure

```
docs/
├── api/                    # API documentation
│   └── admin-llm-config.md
├── architecture/           # System architecture
│   ├── caching.md
│   └── credentials-management.md
├── configuration/          # Configuration guides
│   └── configuration-reference.md
├── deployment/             # Deployment guides
│   ├── deployment.md
│   ├── dokploy-setup.md
│   └── production-config.md
├── features/               # Feature documentation
│   ├── admin-provider-control.md
│   ├── default-feeds.md
│   ├── summarization-setup.md
│   └── summarization.md
├── BACKLOG.md             # Feature roadmap
└── README.md              # This file
```

## 🎯 Common Tasks

### I Want To...

**Deploy NeuReed**
→ Start with [Deployment Guide](deployment/deployment.md), then check [Production Configuration](deployment/production-config.md)

**Configure AI Features**
→ See [Configuration Reference](configuration/configuration-reference.md) and [Admin LLM Config API](api/admin-llm-config.md)

**Understand the Architecture**
→ Read [Credentials Management](architecture/credentials-management.md) and [Caching Strategy](architecture/caching.md)

**Set Up Summarization**
→ Follow [Summarization Setup](features/summarization-setup.md)

**Customize Default Feeds**
→ Check [Default Feeds](features/default-feeds.md)

**Deploy with Dokploy**
→ Follow [Dokploy Setup Guide](deployment/dokploy-setup.md)

## 🔍 Key Concepts

### Settings Hierarchy
NeuReed uses a cascading settings system:
- **Feed-level** settings override category settings
- **Category-level** settings override user defaults
- **User defaults** override system defaults
- **Admin settings** provide system-wide defaults

See [Configuration Reference](configuration/configuration-reference.md) for details.

### AI Provider Architecture
- **Admin** controls which providers are available
- **Users** configure their own credentials (optional)
- **System** credentials serve as fallback
- Supports OpenAI, local models, and custom endpoints

See [Credentials Management](architecture/credentials-management.md) for details.

### Caching Strategy
- Redis-based caching for performance
- Cache-aside pattern with automatic invalidation
- Configurable TTLs for different data types
- Semantic search caching for 95%+ speedup

See [Caching Strategy](architecture/caching.md) for implementation details.

## 🛠️ Development Resources

### Project Overview
See [CLAUDE.md](../CLAUDE.md) for:
- Common commands
- High-level architecture
- Service layer patterns
- Development guidelines

### Contributing
See [Main README](../README.md#-contributing) for contribution guidelines.

### Changelog
See [CHANGELOG.md](../CHANGELOG.md) for version history and recent changes.

## 📋 Planning & Roadmap

Check [BACKLOG.md](BACKLOG.md) for:
- Planned features
- Known issues
- Enhancement ideas
- Future improvements

## 💡 Tips

- **New to NeuReed?** Start with the [Main README](../README.md)
- **Deploying?** Check [Deployment Guide](deployment/deployment.md) first
- **Configuring features?** Use [Configuration Reference](configuration/configuration-reference.md)
- **Building integrations?** See [API Documentation](api/)
- **Understanding internals?** Read [Architecture docs](architecture/)

## 🔗 External Resources

- **GitHub Repository**: [https://github.com/madpin/neureed](https://github.com/madpin/neureed)
- **Issue Tracker**: [GitHub Issues](https://github.com/madpin/neureed/issues)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs**: [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **pgvector**: [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)

---

**Questions?** Check the relevant documentation section above, or [open an issue](https://github.com/madpin/neureed/issues)!
