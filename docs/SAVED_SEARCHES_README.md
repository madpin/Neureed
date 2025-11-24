# Saved Searches Documentation

**Quick Links**: [User Guide](#user-guide) • [Feature Spec](#feature-specification) • [Implementation](#implementation-details) • [Performance](#performance-guide) • [Testing](#testing-guide)

---

## Overview

Saved Searches is a powerful feature in NeuReed that enables **dynamic content monitoring** through persistent queries. Instead of manually searching repeatedly, users create searches that automatically match new articles as they arrive.

### Key Capabilities

- ✅ **Advanced Query Syntax**: AND/OR/NOT operators, phrase matching, grouped expressions
- ✅ **Semantic Matching**: AI-powered relevance scoring (0-1 scale)
- ✅ **Auto-Matching**: New articles automatically matched against all saved searches
- ✅ **Smart Notifications**: Get alerted only for high-relevance matches (>85%)
- ✅ **Templates**: 14 pre-built searches across 4 categories
- ✅ **Mobile Optimized**: Swipe gestures, offline support, responsive design
- ✅ **Performance**: Multi-level caching, batch processing, 750+ articles/minute

### Query Examples

```
Basic:    "AI"                              # Semantic search
OR:       "AI, machine learning"            # Match any term
AND:      "AI +ethics"                      # Required term
NOT:      "AI -cryptocurrency"              # Excluded term
Phrase:   "machine learning"                # Exact phrase
Groups:   "(AI, ML) +ethics"                # Grouped expressions
Complex:  "(Anthropic, OpenAI) +safety -marketing"
```

---

## Documentation Index

### 📖 User Guide
**File**: [USER_GUIDE_SAVED_SEARCHES.md](USER_GUIDE_SAVED_SEARCHES.md)

Complete user manual covering:
- Getting started and creating searches
- Query syntax reference with examples
- Managing and organizing searches
- Understanding relevance scores
- Mobile experience and gestures
- Tips and best practices
- Troubleshooting and FAQ

**Audience**: End users
**Length**: ~600 lines

---

### 🎯 Feature Specification
**File**: [FEATURE_SAVED_SEARCHES.md](FEATURE_SAVED_SEARCHES.md)

Comprehensive feature design document including:
- User value proposition
- Core functionality details
- Query syntax specification
- UI/UX integration points
- Secondary features (templates, insights)
- Mobile experience design
- Edge cases and considerations
- User stories and use cases

**Audience**: Product managers, designers, developers
**Length**: ~360 lines

---

### 🏗️ Implementation Details
**File**: [SAVED_SEARCHES_IMPLEMENTATION.md](SAVED_SEARCHES_IMPLEMENTATION.md)

Complete implementation summary covering:
- All 10 phases completed
- Architecture overview
- Core components and services
- Database schema
- API routes
- File structure
- Performance benchmarks
- Testing summary
- Deployment checklist

**Audience**: Developers, DevOps
**Length**: ~550 lines

---

### 📋 Implementation Plan
**File**: [IMPLEMENTATION_PLAN_SAVED_SEARCHES.md](IMPLEMENTATION_PLAN_SAVED_SEARCHES.md)

Original development plan outlining:
- 10 implementation phases
- Service architecture design
- API route structure
- Component hierarchy
- Testing strategy
- Timeline estimates
- Risk mitigation

**Audience**: Technical leads, project managers
**Length**: ~720 lines

---

### ⚡ Performance Guide
**File**: [SAVED_SEARCH_PERFORMANCE_GUIDE.md](SAVED_SEARCH_PERFORMANCE_GUIDE.md)

Performance optimization documentation including:
- Caching strategies (multi-level)
- Batch processing techniques
- Database optimization
- Vector search tuning
- Frontend optimizations
- Monitoring and metrics
- Troubleshooting slow queries

**Audience**: DevOps, performance engineers
**Length**: ~350 lines

---

### 🧪 Testing Guide
**File**: [TESTING_SAVED_SEARCHES.md](TESTING_SAVED_SEARCHES.md)

Testing documentation covering:
- Running tests (unit, integration)
- Test structure and organization
- Coverage requirements
- Manual testing scenarios
- Performance benchmarks
- Common test issues

**Audience**: QA engineers, developers
**Length**: ~240 lines

---

## Quick Start Guides

### For Users

1. **Read**: [USER_GUIDE_SAVED_SEARCHES.md](USER_GUIDE_SAVED_SEARCHES.md)
2. **Try**: Create your first search with a simple query like `"AI"`
3. **Explore**: Browse templates for inspiration
4. **Advanced**: Learn complex syntax with grouped queries

### For Developers

1. **Architecture**: Read [SAVED_SEARCHES_IMPLEMENTATION.md](SAVED_SEARCHES_IMPLEMENTATION.md)
2. **Code**: Explore `src/lib/services/saved-search-*.ts`
3. **API**: Check routes in `app/api/saved-searches/`
4. **Tests**: Run `npm test -- saved-search`

### For Administrators

1. **Performance**: Read [SAVED_SEARCH_PERFORMANCE_GUIDE.md](SAVED_SEARCH_PERFORMANCE_GUIDE.md)
2. **Monitor**: Check cache hit rates and query execution times
3. **Optimize**: Tune HNSW index and batch processing settings
4. **Scale**: Review Redis configuration for multi-server deployments

---

## Implementation Statistics

- **Total Code**: ~5000+ lines (excluding tests)
- **Tests**: ~2000+ lines across 6 test suites
- **Documentation**: ~2800+ lines across 6 documents
- **Components**: 10+ React components
- **Services**: 8 service files
- **API Routes**: 7 route files
- **Performance**: 5-10x improvement with optimizations

---

## Architecture at a Glance

```
┌─────────────┐
│  User Input │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         Query Parser (AST Generator)        │
│  Tokenize → Parse → Validate → Cache (24h) │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│       Search Execution Engine               │
│  Semantic Search + Keyword Match + Score    │
│  Cache Results (5min) + Apply Filters       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│        Article Matcher (Background)         │
│  Batch Process (100/batch) + Create Matches │
│  Trigger Notifications (>85% relevance)     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Database + Cache                    │
│  saved_searches + saved_search_matches      │
│  Redis Cache (Multi-level)                  │
└─────────────────────────────────────────────┘
```

---

## Key Files Reference

### Service Layer
- `src/lib/services/search-query-parser.ts` - Query parser with AST
- `src/lib/services/saved-search-execution.ts` - Search execution
- `src/lib/services/saved-search-matcher.ts` - Article matching
- `src/lib/services/saved-search-service.ts` - CRUD operations
- `src/lib/services/saved-search-cache-service.ts` - Caching
- `src/lib/services/saved-search-batch-processor.ts` - Batch processing
- `src/lib/services/search-templates-service.ts` - Templates
- `src/lib/services/offline-cache-service.ts` - Offline support

### API Routes
- `app/api/saved-searches/route.ts` - List/create
- `app/api/saved-searches/[id]/route.ts` - Get/update/delete
- `app/api/saved-searches/[id]/articles/route.ts` - Matching articles
- `app/api/saved-searches/[id]/rematch/route.ts` - Trigger rematch
- `app/api/saved-searches/preview/route.ts` - Preview without saving
- `app/api/saved-searches/templates/route.ts` - Browse templates
- `app/api/saved-searches/insights/route.ts` - Performance insights

### Components
- `app/components/saved-searches/SavedSearchModal.tsx` - Create/edit
- `app/components/saved-searches/SavedSearchList.tsx` - Sidebar
- `app/components/saved-searches/QueryBuilder.tsx` - Query input
- `app/components/saved-searches/QuerySyntaxHelper.tsx` - Syntax help
- `app/components/saved-searches/RelevanceScoreBadge.tsx` - Scores
- `app/components/saved-searches/VisualQueryBuilder.tsx` - Visual builder
- `app/components/saved-searches/SearchTemplateGallery.tsx` - Templates
- `app/components/saved-searches/SearchInsights.tsx` - Insights
- `app/components/saved-searches/SavedSearchOnboarding.tsx` - Tutorial
- `app/components/saved-searches/SavedSearchEmptyState.tsx` - Empty state
- `app/components/saved-searches/HelpTooltip.tsx` - Contextual help

### Tests
- `src/lib/services/__tests__/search-query-parser.test.ts`
- `src/lib/services/__tests__/saved-search-execution.test.ts`
- `src/lib/services/__tests__/saved-search-service.test.ts`
- `src/lib/services/__tests__/saved-search-matcher.test.ts`
- `src/lib/services/__tests__/search-templates-service.test.ts`
- `src/lib/services/__tests__/saved-search-integration.test.ts`

### Database
- `prisma/schema.prisma` - Models: `saved_searches`, `saved_search_matches`
- `prisma/migrations/20251124173839_add_saved_searches/` - Migration

---

## Common Tasks

### Creating a Saved Search (User)
1. Click "+ New Saved Search" in sidebar
2. Enter name and query (e.g., `"AI" +ethics`)
3. Adjust threshold if needed (default: 60%)
4. Save and wait for matching to complete

### Debugging Performance (Developer)
1. Check Redis cache hit rate: `redis-cli INFO stats`
2. Monitor query execution: Check logs for `saved_search_execution`
3. Review batch processing: Look for `batch_match` duration
4. Verify indexes: `\d saved_search_matches` in psql

### Running Tests (Developer)
```bash
# All tests
npm test -- saved-search

# Specific suite
npm test -- search-query-parser.test

# With coverage
npm test -- saved-search --coverage

# Watch mode
npm test -- saved-search --watch
```

---

## Support & Troubleshooting

### Common Issues

**Query syntax error**
- Check [USER_GUIDE_SAVED_SEARCHES.md](USER_GUIDE_SAVED_SEARCHES.md) for syntax reference
- Use preview mode to test queries before saving
- Ensure parentheses are balanced

**No matches found**
- Lower relevance threshold (try 50%)
- Broaden query terms (add OR alternatives)
- Check if articles have embeddings generated

**Slow performance**
- Review [SAVED_SEARCH_PERFORMANCE_GUIDE.md](SAVED_SEARCH_PERFORMANCE_GUIDE.md)
- Check cache hit rates
- Verify Redis is running
- Monitor batch processing throughput

### Getting Help

1. Check relevant documentation above
2. Review implementation guide for architecture details
3. Check test files for usage examples
4. Look at service file JSDoc comments

---

## Version History

- **v1.0** (November 2024): Initial production release
  - All 10 phases completed
  - 60+ tests passing
  - Performance optimized (5-10x improvements)
  - Mobile responsive with offline support
  - Comprehensive documentation

---

## Future Roadmap

Planned enhancements (not yet implemented):
- Natural language query parsing ("articles about AI from last week")
- AI-suggested searches based on reading patterns
- Collaborative filtering (suggestions from similar users)
- Search chains (pipe results between searches)
- Multi-workspace support (searches across accounts)
- Enhanced analytics and insights

---

## Contributing

When working on Saved Searches:

1. **Read** the implementation guide first
2. **Follow** existing patterns in service files
3. **Add tests** for any new functionality
4. **Update docs** if changing behavior
5. **Check performance** impact with benchmarks

---

**Need Help?** Start with the [User Guide](USER_GUIDE_SAVED_SEARCHES.md) or [Implementation Details](SAVED_SEARCHES_IMPLEMENTATION.md) depending on your role.
