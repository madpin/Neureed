# NeuReed Documentation

This directory contains all technical documentation for the NeuReed project.

## 📁 Documentation Structure

### Root Documentation

#### Deployment & Operations
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide (Dokploy, Railway, Docker)
- **[DOKPLOY_SETUP_GUIDE.md](./DOKPLOY_SETUP_GUIDE.md)** - Detailed Dokploy setup with GitHub Actions
- **[PRODUCTION_CRON_AND_EMBEDDINGS.md](./PRODUCTION_CRON_AND_EMBEDDINGS.md)** - Production configuration for cron jobs and embeddings
- **[GITHUB_ACTIONS_OPTIMIZATIONS.md](./GITHUB_ACTIONS_OPTIMIZATIONS.md)** - CI/CD pipeline optimizations

#### Admin & Features
- **[ADMIN_LLM_CONFIG_API.md](./ADMIN_LLM_CONFIG_API.md)** - Admin API documentation for LLM configuration
- **[ADMIN_PANEL_PROVIDER_CONTROL.md](./ADMIN_PANEL_PROVIDER_CONTROL.md)** - Embedding provider control features
- **[ADMIN_VS_USER_CREDENTIALS.md](./ADMIN_VS_USER_CREDENTIALS.md)** - Architecture documentation for credential management

#### Planning
- **[BACKLOG.md](./BACKLOG.md)** - Feature roadmap and known issues

### Subdirectories

#### `/guides/` - How-To Guides
Step-by-step guides for specific tasks:
- **[CONTENT_EXTRACTION.md](./guides/CONTENT_EXTRACTION.md)** - Content extraction strategies
- **[COOKIE_EXTRACTION_GUIDE.md](./guides/COOKIE_EXTRACTION_GUIDE.md)** - Cookie handling for authenticated feeds
- **[STORAGE_MANAGEMENT_GUIDE.md](./guides/STORAGE_MANAGEMENT_GUIDE.md)** - Managing storage and cleanup

#### `/implementation/` - Implementation Details
Technical implementation documentation for features:
- **[ADMIN_RECENCY_SETTINGS.md](./implementation/ADMIN_RECENCY_SETTINGS.md)** - Recency scoring implementation
- **[ADMIN_USER_SETTINGS_IMPLEMENTATION_SUMMARY.md](./implementation/ADMIN_USER_SETTINGS_IMPLEMENTATION_SUMMARY.md)** - Admin vs user settings
- **[ADMIN_USER_SETTINGS_SEPARATION.md](./implementation/ADMIN_USER_SETTINGS_SEPARATION.md)** - Settings architecture
- **[CRON_DIAGNOSIS_RESULTS.md](./implementation/CRON_DIAGNOSIS_RESULTS.md)** - Cron job debugging results
- **[CRON_IMPLEMENTATION_SUMMARY.md](./implementation/CRON_IMPLEMENTATION_SUMMARY.md)** - Cron system implementation
- **[FEATURE_SPECIFIC_LLM_MODELS.md](./implementation/FEATURE_SPECIFIC_LLM_MODELS.md)** - Per-feature LLM model configuration
- **[RECENCY_SCORING_IMPLEMENTATION.md](./implementation/RECENCY_SCORING_IMPLEMENTATION.md)** - Recency scoring algorithm
- **[TIMEZONE_FIX_SUMMARY.md](./implementation/TIMEZONE_FIX_SUMMARY.md)** - Timezone handling implementation
- **[USER_EMBEDDING_PREFERENCES.md](./implementation/USER_EMBEDDING_PREFERENCES.md)** - User-level embedding preferences

## 🚀 Quick Start

### For New Deployments
1. Start with **[DEPLOYMENT.md](./DEPLOYMENT.md)** for general deployment guidance
2. Follow **[DOKPLOY_SETUP_GUIDE.md](./DOKPLOY_SETUP_GUIDE.md)** if using Dokploy
3. Configure production features with **[PRODUCTION_CRON_AND_EMBEDDINGS.md](./PRODUCTION_CRON_AND_EMBEDDINGS.md)**

### For Feature Development
1. Check **[BACKLOG.md](./BACKLOG.md)** for planned features
2. Review relevant implementation docs in `/implementation/`
3. Follow guides in `/guides/` for specific implementations

### For Troubleshooting
1. Check the relevant main documentation file
2. Review implementation details in `/implementation/`
3. Consult the appropriate guide in `/guides/`

## 📝 Documentation Standards

- All documentation uses Markdown format
- Code examples include language tags for syntax highlighting
- Each document includes a clear title and purpose
- Guides are action-oriented with step-by-step instructions
- Implementation docs explain technical decisions and architecture

## 🔄 Keeping Documentation Updated

- Update docs when implementing new features
- Move completed items from BACKLOG.md to implementation docs
- Keep deployment guides current with infrastructure changes
- Document troubleshooting steps when resolving issues

## 📚 Additional Resources

- **[Main README](../README.md)** - Project overview and setup
- **[CHANGELOG](../CHANGELOG.md)** - Version history and changes
- **[Prisma Schema](../prisma/schema.prisma)** - Database schema documentation

