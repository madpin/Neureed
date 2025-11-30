# Bundle Analysis Guide

## Running Bundle Analysis

The bundle analyzer has been configured in [next.config.ts](../next.config.ts) and is ready to use.

### How to Run

⚠️ **Important:** Next.js 16 uses Turbopack by default, but the bundle analyzer only works with Webpack. You must use the `--webpack` flag.

**Option 1 - Using the npm script (recommended):**
```bash
npm run build:analyze
```

**Option 2 - Manual command:**
```bash
ANALYZE=true npm run build -- --webpack
```

This will:
1. Build your Next.js application for production using Webpack
2. Generate interactive HTML reports showing bundle sizes
3. Automatically open the reports in your browser

### What to Look For

The bundle analyzer shows:
- **Total JavaScript bundle size** - The total amount of JS sent to the browser
- **First Load JS per route** - Initial JS needed for each page
- **Chunk sizes** - Individual JavaScript chunks and their sizes
- **Package contributions** - Which npm packages contribute most to bundle size

### Optimization Targets (Phase 0 Baseline)

After running the analyzer, document these metrics:

1. **Total Bundle Size**
   - Current: ___ KB
   - Target after Phase 1-3: Reduce by 30-40%

2. **First Load JS (Main Page)**
   - Current: ___ KB
   - Target: < 250 KB

3. **Largest Chunks**
   - List top 5 largest chunks
   - Identify optimization opportunities

4. **Client Component Ratio**
   - Current: 96% (from [CLIENT_COMPONENT_AUDIT_BASELINE.md](./CLIENT_COMPONENT_AUDIT_BASELINE.md))
   - Target: ~30%

### Expected Impact of Refactoring

Based on the refactoring plan:

| Phase | Expected Bundle Reduction |
|-------|---------------------------|
| Phase 0 | Baseline established |
| Phase 1 | ~5-10% (UI component consolidation) |
| Phase 2 | ~10-15% (code splitting of mega-components) |
| Phase 3 | ~20-30% (Server Components + Server Actions) |
| **Total** | **~40-50% reduction** |

### Interpreting the Results

#### Bundle Size Categories

- **Excellent**: < 200 KB First Load JS
- **Good**: 200-300 KB First Load JS
- **Needs Improvement**: 300-500 KB First Load JS
- **Poor**: > 500 KB First Load JS

#### Common Issues to Look For

1. **Large Third-Party Packages**
   - Look for packages > 50 KB
   - Consider alternatives or lazy loading

2. **Duplicate Code**
   - Same package imported multiple times
   - Code shared across chunks

3. **Unused Code**
   - Tree-shaking opportunities
   - Dead code from dependencies

4. **Client-Only Code**
   - Components marked with 'use client'
   - Can any be converted to Server Components?

### Creating the Baseline Document

After running the analysis, create `BUNDLE_SIZE_BASELINE.md`:

```markdown
# Bundle Size Baseline

**Date:** YYYY-MM-DD
**Branch:** refactor/phase-0
**Next.js Version:** 16.0.3

## Overall Metrics

- **Total Bundle Size:** XXX KB
- **First Load JS (/):** XXX KB
- **First Load JS (/admin/dashboard):** XXX KB
- **First Load JS (/articles/[id]):** XXX KB

## Top 10 Largest Chunks

1. chunk-name.js - XXX KB
2. ...

## Top 10 Largest Packages

1. package-name - XXX KB
2. ...

## Client Component Analysis

From [CLIENT_COMPONENT_AUDIT_BASELINE.md](./CLIENT_COMPONENT_AUDIT_BASELINE.md):
- **Total Components:** 76
- **Client Components:** 73 (96%)
- **Server Components:** 3 (4%)

**Target:** 30% client components

## Optimization Opportunities

1. Convert static components to Server Components
2. Split mega-components (AdminDashboard: 2,588 lines)
3. Lazy load heavy modals
4. Tree-shake unused exports
5. Replace heavy dependencies with lighter alternatives

## Goals for Phase 1-3

- Reduce First Load JS by 40-50%
- Reduce client components from 96% to ~30%
- Split all components > 500 lines
- Achieve < 250 KB First Load JS for main page
```

### Continuous Monitoring

Run bundle analysis:
- **Before each phase** - Establish phase baseline
- **After each phase** - Measure improvements
- **Before major refactors** - Document current state
- **After optimization work** - Verify impact

### Tools

The bundle analyzer generates two HTML files:
- `client.html` - Client-side bundle analysis
- `server.html` - Server-side bundle analysis (if applicable)

Both open automatically in your browser.

### Comparing Before/After

To compare bundle sizes:

1. Run analysis on current branch
2. Document metrics
3. Make refactoring changes
4. Run analysis again
5. Calculate differences

Example comparison:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total JS | 850 KB | 500 KB | -41% |
| First Load JS | 340 KB | 210 KB | -38% |
| Client Components | 96% | 32% | -67% |

## Next Steps

1. **Run the baseline analysis:**
   ```bash
   ANALYZE=true npm run build
   ```

2. **Document the results** in `BUNDLE_SIZE_BASELINE.md`

3. **Commit the baseline:**
   ```bash
   git add docs/BUNDLE_SIZE_BASELINE.md
   git commit -m "docs: add Phase 0 bundle size baseline"
   ```

4. **Proceed to Phase 1** with confidence, knowing you can measure impact

---

**Related Documents:**
- [REFACTOR_PLAN.md](./REFACTOR_PLAN.md) - Overall refactoring strategy
- [CLIENT_COMPONENT_AUDIT_BASELINE.md](./CLIENT_COMPONENT_AUDIT_BASELINE.md) - Client component audit
- [SERVER_VS_CLIENT_COMPONENTS.md](./SERVER_VS_CLIENT_COMPONENTS.md) - Component guidelines
