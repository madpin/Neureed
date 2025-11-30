# Saved Searches Feature Documentation

This directory contains comprehensive documentation for the Saved Searches feature in NeuReed.

---

## 📚 Available Documentation

### For Users
- **[User Guide](USER_GUIDE_SAVED_SEARCHES.md)** - Complete guide on creating and using saved searches
  - Query syntax and operators
  - Creating and managing saved searches
  - Understanding relevance scores
  - Mobile usage tips

### For Developers
- **[Technical Specification](TECHNICAL_SPEC.md)** - Architecture and implementation details
  - Core features and components
  - Database schema
  - Performance benchmarks
  - API routes
  - Integration points

### For Optimization
- **[Performance Guide](SAVED_SEARCH_PERFORMANCE_GUIDE.md)** - Optimization tips and best practices
  - Query optimization strategies
  - Caching mechanisms
  - Batch processing
  - Performance monitoring

### For Testing
- **[Testing Guide](TESTING_SAVED_SEARCHES.md)** - Testing strategies and patterns
  - Unit tests (60+ tests)
  - Integration tests
  - Performance benchmarks
  - Test coverage

---

## 🚀 Quick Start

**As a User:**
1. Read the [User Guide](USER_GUIDE_SAVED_SEARCHES.md)
2. Create your first saved search
3. Explore query syntax examples

**As a Developer:**
1. Review the [Technical Spec](TECHNICAL_SPEC.md)
2. Check the [Testing Guide](TESTING_SAVED_SEARCHES.md) for test patterns
3. See [Performance Guide](SAVED_SEARCH_PERFORMANCE_GUIDE.md) for optimization

---

## 🔍 Feature Overview

Saved Searches enable dynamic, persistent monitoring of topics across all your RSS feeds using:
- **Semantic Search** - Vector embeddings for meaning-based matching
- **Keyword Matching** - Boolean operators for precise control
- **Real-time Updates** - Automatically populated as new articles arrive
- **Relevance Scoring** - Visual indicators of match quality

---

## 🏗️ Architecture

**Key Services:**
- `search-query-parser.ts` - Query syntax parsing
- `saved-search-execution.ts` - Search execution engine
- `saved-search-matcher.ts` - Automatic matching for new articles
- `saved-search-cache-service.ts` - Multi-level caching
- `saved-search-batch-processor.ts` - Efficient batch processing

**Performance:**
- 1000+ articles/minute processing
- 80%+ cache hit rate
- <100ms vector similarity search
- 5-minute result caching

---

## 📖 Related Documentation

- **[Semantic Search Service](../../../CLAUDE.md#embedding--semantic-search-flow)** - Core search architecture
- **[pgvector Integration](../../../CLAUDE.md)** - Vector database setup
- **[Service Layer Pattern](../../architecture/)** - Application architecture
- **[Planning Backlog](../../planning/backlog.md)** - Future enhancements

---

## 🎯 Use Cases

- **Topic Monitoring** - Track specific topics across all feeds
- **Brand Mentions** - Monitor company or product names
- **Research** - Collect articles on specific themes
- **Trend Detection** - Identify emerging topics
- **Content Curation** - Build focused reading lists

---

**Questions or issues?** Check the relevant guide above or [open an issue](https://github.com/madpin/neureed/issues).
