# Prisma 7 Migration Plan

**Current Version:** Prisma 6.1.0  
**Target Version:** Prisma 7.x  
**Project:** NeuReed  
**Date:** November 22, 2025

## Executive Summary

This document outlines the migration plan from Prisma 6.1.0 to Prisma 7.x for the NeuReed project. Prisma 7 introduces significant architectural changes including a new generator system, configuration file structure, and improved performance. This migration requires careful planning due to the project's use of pgvector extension and complex relationships.

## Table of Contents

1. [Pre-Migration Assessment](#pre-migration-assessment)
2. [Breaking Changes Analysis](#breaking-changes-analysis)
3. [Migration Steps](#migration-steps)
4. [Testing Strategy](#testing-strategy)
5. [Rollback Plan](#rollback-plan)
6. [Post-Migration Validation](#post-migration-validation)

---

## Pre-Migration Assessment

### Current Prisma Usage in NeuReed

The project currently uses the following Prisma features that need assessment:

#### **Schema Features**
- ✅ PostgreSQL with pgvector extension (`extensions = [vector]`)
- ✅ Preview feature: `postgresqlExtensions`
- ✅ Custom vector type: `Unsupported("vector")`
- ✅ Raw SQL queries for vector operations (`$queryRaw`, `$executeRaw`)
- ✅ Multiple indexes (standard, unique, compound)
- ✅ Cascade delete operations
- ✅ JSON fields
- ✅ Enums (CronJobStatus, CronJobTrigger, UserRole)
- ✅ Timestamp with timezone (`@db.Timestamptz`)

#### **Key Models**
- 17 models with complex relationships
- Vector embeddings in `articles` table
- Multi-tenancy pattern (user-scoped data)
- Many-to-many relationships via junction tables

#### **Current Generator Configuration**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

#### **Dependencies**
- `@prisma/client`: 6.1.0
- `prisma`: 6.1.0
- `@auth/prisma-adapter`: ^2.11.1 (NextAuth.js integration)

---

## Breaking Changes Analysis

### 1. Generator Configuration Changes

**Prisma 6:**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

**Prisma 7:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/client"
  runtime  = "nodejs"
  moduleFormat = "esm"  // or "cjs" based on project needs
  generatedFileExtension = "ts"
  importFileExtension = "ts"
}
```

**Impact:** 
- Generator name change from `prisma-client-js` to `prisma-client`
- New configuration options available
- May affect import paths throughout the codebase

### 2. Configuration File Introduction

Prisma 7 introduces `prisma.config.ts` for centralized configuration:

```typescript
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DATABASE_URL_UNPOOLED"),
  },
  engine: "classic", // or "js" based on requirements
});
```

**Impact:**
- New file to create and maintain
- Potential for better environment variable handling
- Configuration outside of schema file

### 3. Preview Features

**Status of `postgresqlExtensions`:**
- Need to verify if this preview feature is now GA (Generally Available) in Prisma 7
- If GA, remove from `previewFeatures` array
- If still preview, keep the configuration

### 4. NextAuth.js Adapter Compatibility

**Current:** `@auth/prisma-adapter@^2.11.1`

**Action Required:**
- Verify compatibility with Prisma 7
- Check for adapter updates
- Test authentication flow post-migration

### 5. Raw SQL Queries

**Current Usage:**
- Vector similarity search: ```sql
  SELECT * FROM articles 
  ORDER BY embedding <=> $1::vector 
  LIMIT $2
  ```
- Vector updates: ```sql
  UPDATE articles 
  SET embedding = $1::vector 
  WHERE id = $2
  ```

**Impact:**
- Raw SQL should remain compatible
- Verify type casting still works
- Test all vector operations

---

## Migration Steps

### Phase 1: Preparation (Pre-Migration)

#### Step 1.1: Create Migration Branch
```bash
git checkout -b feature/prisma-7-migration
```

#### Step 1.2: Backup Database
```bash
# Create database backup
docker exec neureed-postgres pg_dump -U neureed neureed > backup_pre_prisma7_$(date +%Y%m%d).sql

# Verify backup
ls -lh backup_pre_prisma7_*.sql
```

#### Step 1.3: Document Current State
```bash
# Generate current schema documentation
npx prisma format
npx prisma validate

# Run tests to establish baseline
npm run lint
npm run build
```

#### Step 1.4: Review Dependencies
```bash
# Check for Prisma 7 compatible versions
npm outdated | grep prisma
npm outdated | grep @auth/prisma-adapter
```

### Phase 2: Version Update

#### Step 2.1: Update Package Versions
Update `package.json`:

```json
{
  "dependencies": {
    "@prisma/client": "^7.0.0",
    "prisma": "^7.0.0"
  }
}
```

**Note:** Keep Prisma in `dependencies` (not `devDependencies`) as per project convention for CI/CD compatibility.

#### Step 2.2: Update NextAuth Adapter
```bash
npm install @auth/prisma-adapter@latest
```

#### Step 2.3: Install Dependencies
```bash
npm install
```

### Phase 3: Configuration Migration

#### Step 3.1: Create `prisma.config.ts`

Create `/Users/tpinto/madpin/neureed/prisma/prisma.config.ts`:

```typescript
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
  engine: "classic", // Start with classic, evaluate "js" later
  generator: {
    output: "../node_modules/@prisma/client",
  },
});
```

#### Step 3.2: Update Generator Configuration

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  // Check if postgresqlExtensions is still a preview feature in Prisma 7
  // If GA, remove the line below
  // previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```

#### Step 3.3: Verify Module Format

Check `package.json` for module type:
- If `"type": "module"` → use `moduleFormat = "esm"` in generator
- If not specified or `"type": "commonjs"` → use `moduleFormat = "cjs"`

### Phase 4: Code Migration

#### Step 4.1: Regenerate Prisma Client
```bash
npx prisma generate
```

#### Step 4.2: Update Import Paths (if changed)

If generator output path changed, update imports across the codebase:

**Current:**
```typescript
import { PrismaClient } from '@prisma/client';
```

**If output path changed:**
```typescript
import { PrismaClient } from './generated/client';
```

Search and update:
```bash
# Find all Prisma client imports
grep -r "from '@prisma/client'" src/ app/

# Update as needed (automated with search_replace tool)
```

#### Step 4.3: Verify Database Client Initialization

Check `/Users/tpinto/madpin/neureed/src/lib/db.ts`:
- Ensure singleton pattern still works
- Verify connection pooling settings
- Test database connection

#### Step 4.4: Update Migration Scripts

Verify npm scripts still work:
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset"
  }
}
```

### Phase 5: Testing

#### Step 5.1: Run Prisma Validation
```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format
```

#### Step 5.2: Test Database Operations
```bash
# Generate client
npm run db:generate

# Check migrations status
npx prisma migrate status

# Open Prisma Studio
npm run db:studio
```

#### Step 5.3: Test Vector Operations

Create test script `scripts/test-prisma7-vectors.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVectorOperations() {
  try {
    // Test 1: Query articles with embeddings
    const articlesWithEmbeddings = await prisma.$queryRaw`
      SELECT id, title 
      FROM articles 
      WHERE embedding IS NOT NULL 
      LIMIT 5
    `;
    console.log('✓ Query articles with embeddings:', articlesWithEmbeddings);

    // Test 2: Vector similarity search
    const testVector = Array(384).fill(0); // Adjust dimension based on model
    const similarArticles = await prisma.$queryRaw`
      SELECT id, title, (embedding <=> ${testVector}::vector) as distance
      FROM articles 
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${testVector}::vector
      LIMIT 5
    `;
    console.log('✓ Vector similarity search:', similarArticles);

    // Test 3: Update embedding (dry run)
    console.log('✓ Vector operations working correctly');
  } catch (error) {
    console.error('✗ Vector operation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testVectorOperations();
```

Run test:
```bash
tsx scripts/test-prisma7-vectors.ts
```

#### Step 5.4: Test Core Services

Priority services to test:
1. `src/lib/services/semantic-search-service.ts`
2. `src/lib/services/article-embedding-service.ts`
3. `src/lib/services/feed-refresh-service.ts`
4. `src/lib/services/article-scoring-service.ts`

#### Step 5.5: Test API Routes
```bash
# Start development server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Test article search
curl http://localhost:3000/api/articles/search

# Test semantic search
curl http://localhost:3000/api/articles/semantic-search
```

#### Step 5.6: Test Authentication
- Test OAuth login (Google, GitHub)
- Verify session creation
- Check user creation with default feeds
- Test protected API routes

#### Step 5.7: Test Cron Jobs
```bash
# Test feed refresh
curl -X POST http://localhost:3000/api/jobs/refresh-feeds

# Test embedding generation
curl -X POST http://localhost:3000/api/jobs/generate-embeddings

# Check cron job logs in admin dashboard
```

### Phase 6: Build & Deploy Testing

#### Step 6.1: Test Local Build
```bash
# Clean build
npm run build

# Start production server
npm run start

# Verify production endpoints
curl http://localhost:3000/api/health
```

#### Step 6.2: Test Docker Build
```bash
# Build Docker image
docker build -t neureed:prisma7-test .

# Run container
docker run -p 3000:3000 \
  --env-file .env.local \
  --link neureed-postgres:postgres \
  neureed:prisma7-test

# Test endpoints
curl http://localhost:3000/api/health
```

#### Step 6.3: Verify CI/CD Compatibility

Check GitHub Actions workflows:
- `.github/workflows/main.yml`
- `.github/workflows/release.yml`

Ensure:
- Prisma CLI available during build
- Migration generation works
- Docker build includes Prisma client

---

## Testing Strategy

### Unit Testing Focus Areas

1. **Database Operations**
   - Model creation, updates, deletes
   - Query optimization
   - Transaction handling

2. **Vector Operations**
   - Embedding storage
   - Similarity searches
   - Index usage

3. **Relations**
   - Cascade deletes
   - Join operations
   - Many-to-many relationships

4. **Authentication**
   - Session storage
   - User creation
   - Role-based access

### Integration Testing

1. **Feed Refresh Pipeline**
   - Feed parsing → Article creation → Embedding generation
   - Notification creation
   - Cleanup operations

2. **Search Functionality**
   - Semantic search with vectors
   - Keyword search
   - Filtered searches (by feed, category, date)

3. **User Flows**
   - Registration → Default feeds subscription
   - Feed management
   - Article reading and feedback
   - Preferences management

### Performance Testing

1. **Query Performance**
   - Measure query execution times
   - Compare with Prisma 6 baseline
   - Verify index usage

2. **Vector Operations**
   - Similarity search performance
   - Batch embedding updates
   - Large dataset queries

3. **Connection Pooling**
   - Concurrent request handling
   - Connection limits
   - Timeout behavior

---

## Rollback Plan

### Immediate Rollback (if critical issues found)

#### Step 1: Stop Application
```bash
# Local development
# Press Ctrl+C in terminal

# Production (if deployed)
# Follow deployment platform rollback procedure
```

#### Step 2: Restore Previous Version
```bash
# Revert to previous git commit
git revert HEAD

# Or checkout previous version
git checkout <commit-hash-before-migration>
```

#### Step 3: Reinstall Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Step 4: Restore Database (if schema changed)
```bash
# Restore from backup
docker exec -i neureed-postgres psql -U neureed neureed < backup_pre_prisma7_*.sql

# Or rollback migrations
npx prisma migrate reset
```

#### Step 5: Verify Functionality
```bash
npm run dev
# Test critical endpoints
```

### Database Rollback Considerations

**If migrations were run:**
- Prisma 7 migrations should be compatible with Prisma 6
- If not, restore from backup
- Document any schema changes

**If no schema changes:**
- Simple package version rollback
- No database restoration needed

---

## Post-Migration Validation

### Validation Checklist

#### ✅ Schema & Database
- [ ] Schema validates: `npx prisma validate`
- [ ] Database connection working
- [ ] All migrations applied
- [ ] pgvector extension functional
- [ ] Indexes present and used

#### ✅ Code Generation
- [ ] Prisma Client generated successfully
- [ ] No TypeScript errors
- [ ] Import paths correct
- [ ] Types available in IDE

#### ✅ Core Functionality
- [ ] User authentication working
- [ ] Feed management operational
- [ ] Article fetching and parsing
- [ ] Semantic search functional
- [ ] Embedding generation working
- [ ] Cron jobs executing

#### ✅ Performance
- [ ] Query performance acceptable
- [ ] No significant latency increase
- [ ] Connection pooling working
- [ ] Memory usage normal

#### ✅ Integration Points
- [ ] NextAuth.js adapter working
- [ ] Redis caching functional
- [ ] Job scheduler operational
- [ ] Email notifications working (if applicable)

#### ✅ Build & Deployment
- [ ] Development build successful
- [ ] Production build successful
- [ ] Docker build successful
- [ ] CI/CD pipeline passes
- [ ] Deployment to staging successful

### Monitoring Plan (Post-Deployment)

#### Week 1: Intensive Monitoring
- Check error logs daily
- Monitor query performance
- Track user-reported issues
- Verify cron job execution

#### Week 2-4: Regular Monitoring
- Weekly log review
- Performance trend analysis
- User feedback collection

#### Key Metrics to Track
1. Database query times
2. API response times
3. Error rates
4. Memory/CPU usage
5. User authentication success rate
6. Cron job completion rates

---

## Risk Assessment

### High Risk Areas

1. **Vector Operations**
   - **Risk:** pgvector compatibility issues
   - **Mitigation:** Thorough testing of vector queries
   - **Fallback:** Keep detailed documentation of working queries

2. **NextAuth.js Integration**
   - **Risk:** Adapter incompatibility
   - **Mitigation:** Test authentication flows extensively
   - **Fallback:** Pin to compatible adapter version

3. **Production Deployment**
   - **Risk:** Unexpected behavior in production
   - **Mitigation:** Deploy to staging first, gradual rollout
   - **Fallback:** Quick rollback procedure documented

### Medium Risk Areas

1. **Import Path Changes**
   - **Risk:** Broken imports if output path changes
   - **Mitigation:** Automated search-replace, build verification
   
2. **Performance Regression**
   - **Risk:** Slower queries with new engine
   - **Mitigation:** Benchmark before/after, optimize if needed

3. **Cron Job Execution**
   - **Risk:** Jobs fail with new client
   - **Mitigation:** Test jobs manually before relying on scheduler

---

## Timeline Estimate

### Preparation Phase: 1-2 days
- Environment setup
- Documentation review
- Backup creation

### Migration Phase: 2-3 days
- Package updates
- Configuration changes
- Code updates

### Testing Phase: 3-5 days
- Unit testing
- Integration testing
- Performance testing

### Deployment Phase: 1-2 days
- Staging deployment
- Validation
- Production deployment

**Total Estimated Time: 7-12 days**

*Note: Timeline assumes no major blockers. Complex issues may extend testing phase.*

---

## Resources & References

### Official Documentation
- [Prisma 7 Release Notes](https://www.prisma.io/docs/about/releases)
- [Prisma 7 Migration Guide](https://www.prisma.io/docs/guides/upgrade-guides)
- [Prisma Configuration Reference](https://www.prisma.io/docs/reference/prisma-config)

### Project-Specific Resources
- [NeuReed CLAUDE.md](/Users/tpinto/madpin/neureed/CLAUDE.md)
- [NeuReed .cursorrules](/Users/tpinto/madpin/neureed/.cursorrules)
- [Prisma Schema](/Users/tpinto/madpin/neureed/prisma/schema.prisma)
- [Database Service](/Users/tpinto/madpin/neureed/src/lib/db.ts)

### Support Channels
- Prisma GitHub Issues
- Prisma Discord Community
- NextAuth.js Discussions

---

## Sign-off

### Pre-Migration Approval
- [ ] Technical lead review
- [ ] Database backup confirmed
- [ ] Rollback plan tested
- [ ] Stakeholders notified

### Post-Migration Sign-off
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] No critical issues
- [ ] Documentation updated
- [ ] Team trained on changes

---

## Notes & Observations

### During Migration
*Document any unexpected issues, workarounds, or insights here*

### Lessons Learned
*Post-migration reflection*

---

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Next Review:** After Prisma 7 stable release

