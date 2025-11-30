# Testing Saved Searches

## Quick Start

### Run All Saved Search Tests

```bash
# Run all saved search tests
npm test -- saved-search

# Run with coverage
npm test -- saved-search --coverage

# Run in watch mode
npm test -- saved-search --watch
```

### Run Specific Test Suites

```bash
# Query parser tests
npm test -- search-query-parser.test

# Search execution tests
npm test -- saved-search-execution.test

# Service tests
npm test -- saved-search-service.test

# Matcher tests
npm test -- saved-search-matcher.test

# Template tests
npm test -- search-templates-service.test

# Integration tests
npm test -- saved-search-integration.test
```

---

## Test Structure

### Unit Tests

**Location**: `src/lib/services/__tests__/`

#### Query Parser Tests
File: `search-query-parser.test.ts` (Already exists)

Tests tokenization and parsing logic:
- Simple terms
- Phrases with quotes
- Operators (AND, OR, NOT)
- Nested parentheses
- Edge cases

#### Search Execution Tests
File: `saved-search-execution.test.ts`

Tests search algorithm:
- Query execution
- Threshold filtering
- Scoring accuracy
- Recency bias
- Performance

#### Service Tests
File: `saved-search-service.test.ts`

Tests CRUD operations:
- Create with validation
- Read with ownership checks
- Update with constraints
- Delete with cascade
- Statistics retrieval

#### Matcher Tests
File: `saved-search-matcher.test.ts`

Tests automatic matching:
- Batch matching
- Duplicate prevention
- Notification creation
- Performance benchmarks

#### Template Tests
File: `search-templates-service.test.ts`

Tests template management:
- Template retrieval
- Filtering and search
- Customization
- Import/export
- Validation

### Integration Tests

**Location**: `src/lib/services/__tests__/`

File: `saved-search-integration.test.ts`

Tests complete workflows:
- End-to-end creation → matching
- Multi-user scenarios
- Edit and rematch flows
- Notification workflows
- Archive and deletion
- Performance under load

---

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

describe('Feature Name', () => {
  let testUserId: string;
  let cleanupIds: string[] = [];

  beforeAll(async () => {
    // Setup test data
    testUserId = nanoid();
    await prisma.users.create({
      data: {
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        name: 'Test User',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.users.delete({ where: { id: testUserId } });
  });

  describe('Specific Functionality', () => {
    it('should do something expected', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await someFunction(input);

      // Assert
      expect(result).toBeDefined();
      expect(result).toBe('expected');
    });

    it('should handle error cases', async () => {
      // Test error handling
      await expect(
        someFunction('invalid')
      ).rejects.toThrow('Expected error message');
    });
  });
});
```

### Best Practices

1. **Cleanup**: Always cleanup test data in `afterAll`
2. **Isolation**: Each test should be independent
3. **Descriptive**: Use clear test names
4. **Fast**: Keep tests fast (< 5 seconds each)
5. **Deterministic**: Tests should not be flaky
6. **Coverage**: Aim for 80%+ code coverage

---

## Test Data Management

### Creating Test Data

```typescript
// Create test user
const testUserId = nanoid();
await prisma.users.create({
  data: {
    id: testUserId,
    email: `test-${testUserId}@example.com`,
    name: 'Test User',
  },
});

// Create test saved search
const search = await createSavedSearch({
  userId: testUserId,
  name: 'Test Search',
  query: 'test query',
  threshold: 0.5,
});

// Create test articles
const article = await prisma.articles.create({
  data: {
    id: nanoid(),
    title: 'Test Article',
    excerpt: 'Test excerpt',
    content: 'Test content',
    url: 'https://example.com/test',
    publishedAt: new Date(),
  },
});
```

### Cleanup Pattern

```typescript
// Track IDs for cleanup
let cleanupIds = {
  users: [] as string[],
  searches: [] as string[],
  articles: [] as string[],
};

// Add IDs as you create
cleanupIds.users.push(testUserId);
cleanupIds.searches.push(search.id);

// Cleanup in order (most dependent first)
afterAll(async () => {
  await prisma.saved_search_matches.deleteMany({
    where: { savedSearchId: { in: cleanupIds.searches } },
  });
  await prisma.saved_searches.deleteMany({
    where: { id: { in: cleanupIds.searches } },
  });
  await prisma.articles.deleteMany({
    where: { id: { in: cleanupIds.articles } },
  });
  await prisma.users.deleteMany({
    where: { id: { in: cleanupIds.users } },
  });
});
```

---

## Mocking

### Mocking Database

```typescript
import { jest } from '@jest/globals';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    saved_searches: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
```

### Mocking External Services

```typescript
// Mock embedding service
jest.mock('@/lib/embeddings', () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

// Mock cache service
jest.mock('@/lib/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));
```

---

## Performance Testing

### Measuring Execution Time

```typescript
it('should complete within reasonable time', async () => {
  const startTime = Date.now();

  await batchMatchArticles(articleIds, searchIds);

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(5000); // 5 seconds
});
```

### Load Testing

```typescript
it('should handle large batch efficiently', async () => {
  // Create 100 articles
  const articleIds = await createTestArticles(100);

  const startTime = Date.now();
  await matchNewArticles(articleIds);
  const duration = Date.now() - startTime;

  // Should process at least 20 articles/second
  const throughput = (articleIds.length / duration) * 1000;
  expect(throughput).toBeGreaterThan(20);
});
```

---

## Debugging Tests

### Enable Verbose Logging

```bash
# Run with verbose output
npm test -- saved-search --verbose

# Show console logs
npm test -- saved-search --silent=false
```

### Debug Single Test

```typescript
// Use .only to run single test
it.only('should debug this specific case', async () => {
  console.log('Debugging info');
  // Test code
});
```

### Inspect Test Database

```bash
# Connect to test database
docker exec -it neureed-postgres psql -U neureed -d neureed_test

# Query test data
SELECT * FROM saved_searches;
SELECT * FROM saved_search_matches;
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: ankane/pgvector:latest
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy

      - name: Run tests
        run: npm test -- saved-search --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Services | 90%+ |
| Components | 80%+ |
| API Routes | 85%+ |
| Utilities | 95%+ |
| Overall | 85%+ |

### Check Coverage

```bash
# Generate coverage report
npm test -- saved-search --coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Troubleshooting

### Tests Fail Locally But Pass in CI

**Possible causes:**
- Database state differences
- Timezone issues
- Different Node versions
- Environment variable differences

**Solutions:**
- Reset database: `npm run db:reset`
- Check Node version: `node --version`
- Review environment: `.env.test`

### Flaky Tests

**Symptoms:**
- Tests pass/fail randomly
- Timing-dependent failures

**Solutions:**
- Add proper awaits
- Increase timeouts
- Use deterministic test data
- Avoid race conditions

### Slow Tests

**Symptoms:**
- Test suite takes > 30 seconds

**Solutions:**
- Use `beforeAll` instead of `beforeEach`
- Reduce test data size
- Mock expensive operations
- Run tests in parallel

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Project Testing Standards](./TESTING.md)

---

## Next Steps

1. Run all tests: `npm test -- saved-search`
2. Review coverage: `npm test -- saved-search --coverage`
3. Fix any failing tests
4. Add tests for new features
5. Update documentation
