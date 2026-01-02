# Changelog

All notable changes to NeuReed will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Performance Improvements
- **Content Extraction Optimization**: Feed refresh now checks for duplicate articles BEFORE performing expensive content extraction (Readability/Playwright)
  - Reduces CPU usage by 80-95% for typical feeds
  - Prevents unnecessary network requests to article pages
  - Significantly reduces risk of rate limiting and IP blocking
  - See: docs/guides/development/content-extraction-optimization.md

### Documentation
- Added comprehensive guide for content extraction optimization
- Updated CLAUDE.md with duplicate detection information

## [0.3.0] - 2025-11-29

### Added
- Comprehensive refactoring of core components (AdminDashboard, FeedManagementModal, PreferencesModal)
- 7 custom hooks for state management (useUnsavedChanges, useFormChanges, useMobileMenu, useViewNavigation, useFileDrop, useConfirmation, useFeedNavigation)
- Unified Tabs component with WAI-ARIA compliance and keyboard navigation
- 46 Server Actions replacing API routes for improved type safety and performance
- 12 Skeleton components for Suspense boundaries and loading states
- Comprehensive testing infrastructure with 86+ tests using Vitest
- Storybook integration for component development and documentation
- Refactored FeedManagementModal with view-based architecture (253 lines from 1,919)
- 4 reusable form field components (NumberSettingField, SelectSettingField, ToggleSettingField, TextInputField)

### Changed
- Reorganized documentation structure into logical subdirectories (guides/, planning/, archive/)
- Consolidated duplicate documentation files
- Archived historical refactoring artifacts to docs/archive/
- AdminDashboard reduced from 2,588 lines to 280 lines (91% reduction)
- PreferencesModal refactored with custom hooks (388 lines)
- Enhanced documentation navigation with comprehensive README

### Improved
- Documentation navigation and cross-linking with emoji-enhanced sections
- Bundle size through Server Components architecture
- Component reusability and testability across the application
- Code organization with 68% reduction in root-level documentation files

### Fixed
- Broken internal documentation links
- Removed references to non-existent documentation files
- Updated all cross-references to reflect new documentation structure

## [0.2.0] - 2025-11-23

### Added
- Enhanced LLM configuration handling in summarization service
- Default feed subscriptions for new users (9 curated feeds across tech, news, science)
- Automatic article summarization feature with configurable models
- Semantic search with missing embeddings alert
- Admin dashboard with authentication and role-based access
- In-app notification system for feed refresh events
- Article display customization settings and preferences
- OPML import/export functionality
- Feed management modal with consolidated settings
- Sidebar width preference and dynamic layout adjustment
- User preferences for feed display settings
- Admin dashboard with cron job history and user role management
- Logging functionality for cron job runs with dashboard display

### Changed
- Migrated to Node.js 24 for better Prisma compatibility
- Updated Dockerfile for improved dependency management
- Simplified GitHub Actions workflow for dependency installation
- Updated Docker entrypoint and configurations for database migrations
- Migrated feed parser from rss-parser to @rowanmanning/feed-parser
- Enhanced project setup and workflow
- Optimized feed data fetching and loading states
- Integrated React Query for improved data fetching and state management
- Updated Prisma fields to use @updatedAt attribute
- Improved image handling in ArticleCard and HTML image processing

### Fixed
- Dokploy deployment instructions and configuration files
- Node.js version configuration for Prisma compatibility
- Default value for id fields in Session and User models
- Account model default values and user preferences creation logic
- Feed article logging to use correct property name
- Layout responsiveness in MainLayout and PreferencesModal
- Z-index values for mobile menu and layout
- Mobile navigation and layout issues

### Removed
- Nixpacks and Railpack configurations (switched to Docker)
- Manual updatedAt assignments in seed and service files
- Obsolete configuration files

## [0.1.5] - 2025-11-20

### Added
- Enhanced embedding service validation for EMBEDDING_BATCH_SIZE
- Detailed logging for article embedding process
- Empty article filtering in embedding generation
- WASM support for local embeddings with ONNX Runtime
- Modern button styles and reusable LoadingSpinner component
- Dynamic export to API routes for improved caching
- AUTH_TRUST_HOST environment variable for NextAuth

### Changed
- Improved logging in article-embedding-service with text previews
- Enhanced error handling in LocalEmbeddingProvider
- Updated Dockerfile and Nixpacks for WASM-only transformers
- Refactored API route handlers to use underscore for unused parameters
- Updated Prisma model references to plural forms

### Fixed
- Auto-run Prisma migrations on deployment
- Prisma migrations included in Docker image and Nixpacks build
- Global-error SSR prerender issue
- Missing migrations folder handling in Nixpacks
- Date formatting in article page
- Redis password support
- Error logging for related articles retrieval

## [0.1.0] - 2025-11-19

### Added
- Initial project setup with Next.js 16 and App Router
- PostgreSQL database with pgvector extension
- Prisma ORM with comprehensive schema
- NextAuth.js authentication (Google, GitHub, Generic OAuth)
- RSS/Atom feed parsing and management
- Article storage and retrieval
- User preferences system
- Feed categorization and organization
- Tailwind CSS with dark mode support
- Docker and Docker Compose configuration
- Automated setup script
- Health check endpoint
- Type-safe environment variable validation
- Basic admin dashboard
- Feed refresh cron jobs
- Article cleanup jobs
- Semantic search infrastructure
- Embedding generation (OpenAI and local providers)
- User pattern learning system
- Article scoring based on user preferences
- Cache implementation with Redis
- Comprehensive documentation

### Security
- Encrypted API key storage
- SSRF protection in feed parser
  - Input sanitization and validation
- Secure session management

---

## Version History Summary

- **0.3.0** (Nov 29, 2025): Major refactoring release with component architecture improvements, custom hooks, Server Actions, and comprehensive documentation reorganization
- **0.2.0** (Nov 23, 2025): Major feature release with summarization, notifications, OPML support, and improved admin dashboard
- **0.1.5** (Nov 20, 2025): WASM support, embedding improvements, and bug fixes
- **0.1.0** (Nov 19, 2025): Initial release with core RSS reader functionality, semantic search, and AI features
