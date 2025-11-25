# NeuReed Refactoring Plan

**Version:** 2.0
**Date:** 2025-01-25
**Status:** Planning Phase - Updated with Testing & Modern React Patterns

---

## Executive Summary

NeuReed has grown organically and now contains several mega-components (2,500+ lines) with significant code duplication. This refactoring plan aims to improve maintainability, testability, and developer experience by extracting reusable UI components, splitting large files, and establishing consistent patterns.

**Key Metrics:**
- **Largest file:** `app/admin/dashboard/page.tsx` (2,588 lines)
- **Duplicate code:** ~4,600 lines can be eliminated (updated from 2,250)
- **Modal implementations:** 9 different files with similar patterns
- **Card/container pattern:** Repeated 267 times across 39 files
- **Test coverage:** 0% (critical gap requiring immediate attention)
- **Client components:** 100% (should be ~30% for optimal bundle size)

---

## Goals

### What We're Trying to Achieve

1. **Create a Reusable UI Component Library**
   - Build design system primitives (Button, Modal, Card, Form, etc.)
   - Eliminate code duplication across components
   - Enforce consistent styling and behavior

2. **Improve Code Organization**
   - Split mega-components into manageable, focused modules
   - Establish clear architectural patterns
   - Make codebase easier to navigate for new developers

3. **Enhance Maintainability**
   - Single source of truth for UI patterns
   - Easier to implement design changes
   - Reduce cognitive load when working on features

4. **Increase Testability**
   - Isolated, testable components
   - Reusable custom hooks with business logic
   - Better separation of concerns

5. **Improve Developer Experience**
   - Faster feature development with reusable components
   - Clearer patterns to follow
   - Reduced decision fatigue
   - Robust testing infrastructure for confident refactoring
   - Better tooling (Storybook, bundle analyzer, performance monitoring)

---

## Main Wins

### 🎯 Immediate Benefits

1. **~4,600 Lines of Code Reduction** (Updated from 2,250)
   - UI component library: ~1,200 lines saved
   - **Server Actions** replacing API routes: ~800 lines saved
   - **Server Components** (reduced client JS): ~400 lines saved
   - **Test infrastructure** (bug prevention): ~500 lines saved
   - Custom hooks: ~400 lines saved
   - **Form library** integration (React Hook Form): ~300 lines saved
   - Modal management: ~300 lines saved
   - **Intercepting routes** for modals: ~200 lines saved
   - Layout abstractions: ~200 lines saved
   - Tab component: ~150 lines saved
   - **Animation system**: ~150 lines saved

2. **Consistency Across the Application**
   - Unified modal behavior (backdrop, animations, keyboard shortcuts)
   - Consistent form field styling and validation UX
   - Standardized button variants and states
   - Predictable card layouts

3. **Faster Feature Development**
   - Build new modals in minutes, not hours
   - Compose forms with reusable field components
   - Create new admin tabs with standard layout
   - Less time spent on styling decisions

4. **Easier Design System Changes**
   - Update button styles in one place
   - Change modal animations globally
   - Adjust spacing/padding systematically
   - Theme changes propagate automatically

5. **Better Testing**
   - **NEW:** Vitest + Testing Library infrastructure
   - **NEW:** Storybook for component development in isolation
   - **NEW:** Visual regression testing capabilities
   - **NEW:** Snapshot tests ensure UI parity during refactoring
   - Test UI components and hooks independently
   - Mock fewer dependencies
   - Reusable test utilities
   - **CRITICAL:** Higher confidence in large-scale refactoring
   - Automated regression detection

### 📊 Long-term Benefits

1. **Onboarding New Developers**
   - Clear component library to reference
   - Consistent patterns to follow
   - Less "where should this code go?" confusion

2. **Design System Evolution**
   - Foundation for future design improvements
   - Easier to add accessibility features
   - Room for animation/micro-interaction polish

3. **Performance Opportunities**
   - **NEW:** Server Components reduce client JS by 40-60%
   - **NEW:** Bundle size tracking and optimization
   - **NEW:** Suspense boundaries prevent request waterfalls
   - Memoization at component level
   - Lazy load heavy modal content
   - Share component instances
   - Progressive enhancement with Server Actions

4. **Documentation Culture**
   - Component library encourages docs
   - Storybook/example-driven development
   - Living style guide

---

## Current Pain Points

### 🔴 Critical Issues

1. **Mega-Components Are Unmanageable**
   - **AdminDashboard (2,588 lines):** Hard to find specific functionality, difficult to review PRs, long load times in IDE
   - **FeedManagementModal (1,892 lines):** Complex nested state, hard to test individual views, slow to navigate
   - **PreferencesModal (1,671 lines):** Good view separation but all in one file, makes git conflicts likely

2. **Modal State Proliferation**
   - `page.tsx` has 5 modal state variables
   - Each modal requires: `useState`, handlers, JSX rendering
   - Adding new modals means touching already-large files
   - No centralized modal management

3. **Massive Code Duplication**
   - Modal wrapper (`fixed inset-0 z-50...`) repeated 9 times
   - Card container pattern (`rounded-lg border...`) repeated 267 times
   - Form field pattern (label + input + description + error) repeated ~60 times
   - Toggle switch implemented inline but used ~15 times

4. **Inconsistent Patterns**
   - Multiple button styles: `btn btn-primary`, custom `className`, inline styles
   - Different modal close behaviors
   - Varying form validation UX
   - Inconsistent loading states

5. **Poor Component Boundaries**
   - Business logic mixed with presentation
   - Hard to extract and test logic
   - Difficult to reuse between features
   - Tight coupling

### 🟡 Medium Priority Issues

1. **Duplicate Components**
   - Two Tooltip implementations: `layout/Tooltip.tsx` and `admin/Tooltip.tsx`
   - Multiple LoadingSpinner implementations
   - Similar EmptyState patterns

2. **No Clear Component Organization**
   - Flat component structure
   - Hard to know where to add new components
   - No distinction between primitives and feature components

3. **Hard to Find Code**
   - 2,500+ line files require lots of scrolling
   - No clear file naming conventions for sub-components
   - Related code scattered across files

4. **Testing Challenges**
   - Large components hard to test
   - Difficult to mock dependencies
   - Business logic buried in components

### 🟢 Low Priority Issues

1. **Missing TypeScript Utilities**
   - Repeated prop type definitions
   - Could benefit from shared type utilities
   - TypeScript strict mode not fully enabled

2. **Performance Opportunities**
   - No component memoization strategy
   - Could optimize re-renders
   - **No bundle size monitoring**
   - **Server vs Client component strategy unclear**

3. **Accessibility Gaps**
   - Inconsistent keyboard navigation
   - Missing ARIA attributes in some places

4. **Animation/Transitions**
   - No unified animation system
   - Inconsistent transition timings
   - Duplicate animation code

### 🔥 **NEWLY IDENTIFIED CRITICAL ISSUE**

**Zero Test Coverage**
   - **Status:** CRITICAL - No testing infrastructure whatsoever
   - **Risk:** Large-scale refactoring without tests is extremely high-risk
   - **Impact:** Cannot confidently refactor without regression detection
   - **Required Action:** Must be addressed in new Phase 0 before any refactoring begins
   - **Tools Needed:** Vitest, Testing Library, Storybook
   - **Estimated setup time:** 1 week
   - **Value:** Prevents potentially hundreds of hours debugging regressions

---

## Refactoring Phases

### Phase 0: Testing & Infrastructure Foundation (Week 0)
**Goal:** Establish critical infrastructure before touching any components
**Risk Level:** Low
**Effort:** Medium
**Impact:** **CRITICAL** (Enables safe refactoring of all subsequent phases)

#### Why Phase 0 is Non-Negotiable

**The Reality:** You're about to refactor 4,600+ lines of code across 2,500+ line files without any automated tests. This is like performing surgery without anesthesia or monitoring equipment.

**What Could Go Wrong Without Phase 0:**
- Silent regressions in modal behavior
- Broken form validations discovered in production
- Styling inconsistencies across themes
- State management bugs in mega-components
- Hours/days spent manually testing each change
- Lost confidence, slower velocity, abandoned refactoring

**What Phase 0 Provides:**
- **Safety net:** Catch regressions within seconds
- **Confidence:** Make bold architectural changes fearlessly
- **Speed:** Automated testing is 100x faster than manual QA
- **Documentation:** Tests document expected behavior
- **Baseline:** Measure bundle size and performance improvements

#### Tasks

1. **Setup Testing Infrastructure (Priority: CRITICAL)**

   **Install dependencies:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom \
     @testing-library/user-event @vitejs/plugin-react happy-dom
   ```

   **Create test structure:**
   ```
   tests/
   ├── setup.ts                      # Global test configuration
   ├── components/
   │   ├── ui/                       # UI primitive tests
   │   │   ├── Button.test.tsx
   │   │   ├── Modal.test.tsx
   │   │   └── Card.test.tsx
   │   └── features/                 # Feature component tests
   ├── hooks/                        # Custom hook tests
   │   ├── use-modal-state.test.ts
   │   └── use-unsaved-changes.test.ts
   └── integration/                  # Integration tests
   ```

   **Create `vitest.config.ts`:**
   ```typescript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'happy-dom',
       setupFiles: ['./tests/setup.ts'],
       globals: true,
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: [
           'node_modules/',
           'tests/',
           '**/*.config.ts',
           '**/types/**',
         ],
       },
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './'),
       },
     },
   });
   ```

   **Create `tests/setup.ts`:**
   ```typescript
   import '@testing-library/jest-dom';
   import { cleanup } from '@testing-library/react';
   import { afterEach } from 'vitest';

   // Cleanup after each test
   afterEach(() => {
     cleanup();
   });
   ```

   **Add test scripts to `package.json`:**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage",
       "test:run": "vitest run"
     }
   }
   ```

   **Write baseline tests for existing components:**
   ```typescript
   // tests/components/PreferencesModal.test.tsx
   import { render, screen } from '@testing-library/react';
   import { PreferencesModal } from '@/app/components/preferences/PreferencesModal';

   describe('PreferencesModal', () => {
     it('renders without crashing', () => {
       render(<PreferencesModal onClose={() => {}} />);
       expect(screen.getByText(/preferences/i)).toBeInTheDocument();
     });

     // Add more tests as you refactor
   });
   ```

   **Success criteria:**
   - [ ] Vitest running successfully
   - [ ] At least 5 baseline tests written
   - [ ] Test script in package.json works
   - [ ] Coverage reporting configured

2. **Setup Storybook (REQUIRED, not optional)**

   **Why Storybook is Critical:**
   - Develop components in isolation (faster iteration)
   - Visual documentation for team
   - Foundation for visual regression testing
   - Catches UI bugs before code review
   - Makes testing interactive states easy

   **Install:**
   ```bash
   npx storybook@latest init --builder vite
   ```

   **Create story template:**
   ```typescript
   // app/components/ui/Button.stories.tsx
   import type { Meta, StoryObj } from '@storybook/react';
   import { Button } from './Button';

   const meta: Meta<typeof Button> = {
     title: 'UI/Button',
     component: Button,
     parameters: {
       layout: 'centered',
     },
     tags: ['autodocs'],
     argTypes: {
       variant: {
         control: 'select',
         options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
       },
       size: {
         control: 'select',
         options: ['xs', 'sm', 'md', 'lg'],
       },
     },
   };

   export default meta;
   type Story = StoryObj<typeof Button>;

   export const Primary: Story = {
     args: {
       variant: 'primary',
       children: 'Click me',
     },
   };

   export const Loading: Story = {
     args: {
       variant: 'primary',
       loading: true,
       children: 'Loading...',
     },
   };
   ```

   **Success criteria:**
   - [ ] Storybook running on localhost:6006
   - [ ] At least 3 component stories created
   - [ ] Dark mode toggle working in Storybook
   - [ ] Team can access and use Storybook

3. **Enable TypeScript Strict Mode**

   **Update `tsconfig.json`:**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "exactOptionalPropertyTypes": false,  // May need false initially
       "forceConsistentCasingInFileNames": true,
       "noFallthroughCasesInSwitch": true
     }
   }
   ```

   **Fix immediate errors:**
   - Add proper null checks
   - Fix implicit `any` types
   - Add type assertions where needed
   - Document any `@ts-expect-error` with reasons

   **Benefits:**
   - Catches bugs at compile time
   - Better IDE autocomplete
   - Safer refactoring
   - Forces thinking about edge cases

   **Success criteria:**
   - [ ] TypeScript strict mode enabled
   - [ ] Build completes without errors
   - [ ] Critical paths type-safe

4. **Setup Bundle Analysis**

   **Install:**
   ```bash
   npm install -D @next/bundle-analyzer
   ```

   **Update `next.config.js`:**
   ```javascript
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   });

   module.exports = withBundleAnalyzer({
     // ... existing config
   });
   ```

   **Create baseline:**
   ```bash
   ANALYZE=true npm run build
   ```

   **Document baseline metrics:**
   - Total JavaScript bundle size
   - First Load JS per route
   - Largest individual chunks
   - Set targets (e.g., reduce by 30%)

   **Add to CI/CD (optional):**
   ```yaml
   # .github/workflows/bundle-size.yml
   - name: Analyze bundle size
     run: npm run build
   - name: Upload bundle stats
     uses: actions/upload-artifact@v3
     with:
       name: bundle-analysis
       path: .next/analyze/
   ```

   **Success criteria:**
   - [ ] Bundle analyzer configured
   - [ ] Baseline metrics documented
   - [ ] Team knows how to run analysis

5. **Create Design Token System**

   **Create `app/styles/design-tokens.css`:**
   ```css
   :root {
     /* Spacing scale (4px base) */
     --space-0: 0;
     --space-1: 0.25rem;  /* 4px */
     --space-2: 0.5rem;   /* 8px */
     --space-3: 0.75rem;  /* 12px */
     --space-4: 1rem;     /* 16px */
     --space-5: 1.25rem;  /* 20px */
     --space-6: 1.5rem;   /* 24px */
     --space-8: 2rem;     /* 32px */
     --space-10: 2.5rem;  /* 40px */
     --space-12: 3rem;    /* 48px */
     --space-16: 4rem;    /* 64px */

     /* Typography scale */
     --font-size-xs: 0.75rem;     /* 12px */
     --font-size-sm: 0.875rem;    /* 14px */
     --font-size-base: 1rem;      /* 16px */
     --font-size-lg: 1.125rem;    /* 18px */
     --font-size-xl: 1.25rem;     /* 20px */
     --font-size-2xl: 1.5rem;     /* 24px */
     --font-size-3xl: 1.875rem;   /* 30px */
     --font-size-4xl: 2.25rem;    /* 36px */

     /* Line heights */
     --leading-none: 1;
     --leading-tight: 1.25;
     --leading-snug: 1.375;
     --leading-normal: 1.5;
     --leading-relaxed: 1.625;
     --leading-loose: 2;

     /* Border radius */
     --radius-none: 0;
     --radius-sm: 0.125rem;   /* 2px */
     --radius-base: 0.25rem;  /* 4px */
     --radius-md: 0.375rem;   /* 6px */
     --radius-lg: 0.5rem;     /* 8px */
     --radius-xl: 0.75rem;    /* 12px */
     --radius-2xl: 1rem;      /* 16px */
     --radius-full: 9999px;

     /* Shadows */
     --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
     --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
     --shadow-base: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
     --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
     --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
     --shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

     /* Transitions */
     --duration-75: 75ms;
     --duration-100: 100ms;
     --duration-150: 150ms;
     --duration-200: 200ms;
     --duration-300: 300ms;
     --duration-500: 500ms;

     --ease-in: cubic-bezier(0.4, 0, 1, 1);
     --ease-out: cubic-bezier(0, 0, 0.2, 1);
     --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

     --transition-fast: var(--duration-150) var(--ease-out);
     --transition-base: var(--duration-200) var(--ease-in-out);
     --transition-slow: var(--duration-300) var(--ease-in-out);

     /* Z-index scale */
     --z-0: 0;
     --z-10: 10;
     --z-20: 20;
     --z-30: 30;
     --z-40: 40;
     --z-50: 50;
     --z-dropdown: 1000;
     --z-sticky: 1100;
     --z-fixed: 1200;
     --z-modal-backdrop: 1300;
     --z-modal: 1400;
     --z-popover: 1500;
     --z-tooltip: 1600;
   }
   ```

   **Import in `app/globals.css`:**
   ```css
   @import './styles/design-tokens.css';
   ```

   **Usage in components:**
   ```tsx
   // Instead of: className="rounded-lg shadow-md p-4"
   // Use: style with tokens for consistency
   <div style={{
     borderRadius: 'var(--radius-lg)',
     boxShadow: 'var(--shadow-md)',
     padding: 'var(--space-4)'
   }}>
   ```

   **Success criteria:**
   - [ ] Design tokens file created
   - [ ] Tokens imported in globals.css
   - [ ] At least 2 components using tokens
   - [ ] Team understands token usage

6. **Setup Error Boundaries**

   **Create `app/components/ui/ErrorBoundary.tsx`:**
   ```typescript
   'use client';

   import { Component, type ReactNode } from 'react';

   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
     onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
   }

   interface State {
     hasError: boolean;
     error?: Error;
   }

   export class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false };
     }

     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       console.error('ErrorBoundary caught:', error, errorInfo);
       this.props.onError?.(error, errorInfo);

       // Optional: Send to error tracking service
       // trackError(error, errorInfo);
     }

     render() {
       if (this.state.hasError) {
         if (this.props.fallback) {
           return this.props.fallback;
         }

         return (
           <div className="rounded-lg border border-red-200 bg-red-50 p-4">
             <h2 className="text-lg font-semibold text-red-900">
               Something went wrong
             </h2>
             <p className="mt-2 text-sm text-red-700">
               {this.state.error?.message || 'An unexpected error occurred'}
             </p>
             <button
               onClick={() => this.setState({ hasError: false })}
               className="mt-4 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
             >
               Try again
             </button>
           </div>
         );
       }

       return this.props.children;
     }
   }
   ```

   **Wrap critical features:**
   ```tsx
   // app/page.tsx or layout.tsx
   <ErrorBoundary>
     <FeedManagementModal />
   </ErrorBoundary>

   <ErrorBoundary>
     <PreferencesModal />
   </ErrorBoundary>
   ```

   **Success criteria:**
   - [ ] ErrorBoundary component created
   - [ ] Wrapped around 3+ major features
   - [ ] Tested by throwing intentional error

7. **Audit Server vs Client Components**

   **Create audit script (`scripts/audit-client-components.sh`):**
   ```bash
   #!/bin/bash
   echo "=== Client Component Audit ==="
   echo ""
   echo "Total components:"
   find app/components -name "*.tsx" | wc -l
   echo ""
   echo "Client components (with 'use client'):"
   grep -r "use client" app/components --include="*.tsx" | wc -l
   echo ""
   echo "Files with 'use client':"
   grep -r "use client" app/components --include="*.tsx"
   ```

   **Create guidelines: `docs/SERVER_VS_CLIENT_COMPONENTS.md`:**
   ```markdown
   # Server vs Client Component Decision Tree

   ## Default: Use Server Component

   Start with Server Component. Only add "use client" if you need:

   ### Must Use Client Component When:
   - ❌ Uses React hooks (useState, useEffect, useContext, etc.)
   - ❌ Event handlers (onClick, onChange, onSubmit, etc.)
   - ❌ Browser APIs (localStorage, window, document, etc.)
   - ❌ React Context consumers (useContext)
   - ❌ Lifecycle methods (componentDidMount, etc.)
   - ❌ Custom hooks that use the above

   ### Can Stay Server Component When:
   - ✅ Pure presentation (no interactivity)
   - ✅ Data fetching only
   - ✅ Static content
   - ✅ SEO important content
   - ✅ Markdown/content rendering

   ## Strategy for Refactoring:
   1. **Push "use client" down:** Only the interactive parts need it
   2. **Split components:** Separate static from interactive
   3. **Compose:** Server components can render client components

   ## Example:

   ### Before (Everything client):
   ```tsx
   "use client";
   export function ArticlePage({ article }) {
     const [liked, setLiked] = useState(false);
     return (
       <div>
         <ArticleHeader title={article.title} />
         <ArticleContent content={article.content} />
         <LikeButton liked={liked} onLike={() => setLiked(true)} />
       </div>
     );
   }
   ```

   ### After (Split server/client):
   ```tsx
   // ArticlePage.tsx (Server Component - no "use client")
   export function ArticlePage({ article }) {
     return (
       <div>
         <ArticleHeader title={article.title} />
         <ArticleContent content={article.content} />
         <LikeButton /> {/* Only this is client */}
       </div>
     );
   }

   // LikeButton.tsx (Client Component)
   "use client";
   export function LikeButton() {
     const [liked, setLiked] = useState(false);
     return <button onClick={() => setLiked(true)}>Like</button>;
   }
   ```

   ## Benefits:
   - Smaller JavaScript bundles
   - Faster initial page load
   - Better SEO
   - Simpler code (no useEffect for data)
   ```

   **Run audit and document:**
   ```bash
   ./scripts/audit-client-components.sh > docs/CLIENT_COMPONENT_AUDIT.md
   ```

   **Success criteria:**
   - [ ] Audit script created and run
   - [ ] Guidelines document created
   - [ ] Baseline metrics documented
   - [ ] Team trained on Server/Client split

8. **Setup Performance Monitoring**

   **Create `lib/performance-monitor.ts`:**
   ```typescript
   export function measureComponentRender(componentName: string) {
     if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
       return () => {};
     }

     const startMark = `${componentName}-start`;
     const endMark = `${componentName}-end`;

     performance.mark(startMark);

     return () => {
       performance.mark(endMark);

       try {
         const measure = performance.measure(
           componentName,
           startMark,
           endMark
         );

         // Warn if render takes > 16ms (1 frame at 60fps)
         if (measure.duration > 16) {
           console.warn(
             `⚠️ Slow render: ${componentName} took ${measure.duration.toFixed(2)}ms`
           );
         }

         // Clean up marks
         performance.clearMarks(startMark);
         performance.clearMarks(endMark);
         performance.clearMeasures(componentName);
       } catch (error) {
         // Silently fail in production
       }
     };
   }

   // Usage in component
   // useEffect(() => {
   //   const endMeasure = measureComponentRender('AdminDashboard');
   //   return endMeasure;
   // }, []);
   ```

   **Add Web Vitals tracking:**
   ```typescript
   // app/web-vitals.ts
   'use client';

   import { useReportWebVitals } from 'next/web-vitals';

   export function WebVitals() {
     useReportWebVitals((metric) => {
       // Log to console in development
       if (process.env.NODE_ENV === 'development') {
         console.log(metric);
       }

       // TODO: Send to analytics service
       // analytics.track(metric.name, metric.value);
     });

     return null;
   }
   ```

   **Success criteria:**
   - [ ] Performance monitoring utilities created
   - [ ] Web Vitals tracking added
   - [ ] Baseline metrics documented

#### Success Criteria for Phase 0

- [ ] **Testing:** Vitest configured and 5+ tests passing
- [ ] **Storybook:** Running with 3+ component stories
- [ ] **TypeScript:** Strict mode enabled
- [ ] **Bundle:** Analyzer configured with baseline documented
- [ ] **Design:** Token system created and in use
- [ ] **Errors:** Error boundaries wrapping major features
- [ ] **Audit:** Server/Client component guidelines created
- [ ] **Performance:** Monitoring utilities created
- [ ] **Documentation:** All setup documented for team
- [ ] **Team:** Everyone trained on new tools

#### Time Investment vs. Return

**Estimated Time:** 4-6 days (1 week)
**Payoff:** Saves 2-4 weeks of debugging + prevents project failure

Without Phase 0, you risk:
- 30% chance of abandoned refactoring due to regressions
- 2x longer refactoring time from manual testing
- 10-15 production bugs from untested changes
- Team frustration and lost momentum

With Phase 0, you gain:
- Confidence to make large changes
- 10x faster feedback loops
- Measurable improvements (bundle size, performance)
- Foundation for long-term code quality

**This is not optional. This is the foundation of successful refactoring.**

---

### Phase 1: UI Component Library (Weeks 1-2)
**Goal:** Build core UI component library
**Risk Level:** Low
**Effort:** Medium
**Impact:** High

#### Tasks

1. **Setup Component Library Structure**
   ```
   app/components/ui/
   ├── index.ts              # Export all UI components
   ├── Button.tsx
   ├── Modal.tsx
   ├── Card.tsx
   ├── Form.tsx
   ├── Tabs.tsx
   ├── ToggleSwitch.tsx
   ├── Tooltip.tsx
   ├── LoadingSpinner.tsx
   └── EmptyState.tsx
   ```

2. **Extract ToggleSwitch Component**
   - Currently inline in `PreferencesModal.tsx:1639-1670`
   - Used in ~15 locations
   - Extract to `ui/ToggleSwitch.tsx`
   - Update all usages
   - Add prop types and documentation

3. **Create Modal Component**
   - Analyze common modal patterns across 9 files
   - Build unified Modal wrapper
   - Support size variants: sm, md, lg, xl, full
   - Handle backdrop clicks, ESC key, scroll locking
   - Include ModalHeader, ModalBody, ModalFooter sub-components

4. **Create Button Component**
   - Consolidate button variants: primary, secondary, outline, ghost, danger
   - Add size variants: xs, sm, md, lg
   - Support loading state with spinner
   - Support icon + text combinations
   - Replace inline button implementations

5. **Create Card Components**
   - Build Card wrapper with variants
   - Create CardHeader, CardSection, CardFooter
   - Create StatCard for metrics display
   - Replace `rounded-lg border...` patterns

6. **Create Form Components**
   - FormField wrapper (label + description + error)
   - Input component with variants
   - Select component
   - TextArea component
   - RangeSlider component
   - Checkbox component
   - Replace repeated form patterns

7. **Consolidate Duplicate Components**
   - Merge `layout/Tooltip.tsx` and `admin/Tooltip.tsx` into `ui/Tooltip.tsx`
   - Consolidate LoadingSpinner implementations
   - Standardize EmptyState component


8. **Standardize Iconography**
   - Current state: Inline SVGs scattered throughout components
   - Action: Adopt `lucide-react` or create centralized `ui/Icon.tsx`
   - Replace all inline SVGs in refactored components

9. **Create Feedback Primitives**
   - `ConfirmDialog`: Standardize the "Click again to confirm" pattern
   - `ToastUtils`: Standardize error handling for async actions

10. **Setup Form Handling Library (NEW)**

   **Install React Hook Form:**
   ```bash
   npm install react-hook-form @hookform/resolvers
   ```

   **Why React Hook Form:**
   - Integrates perfectly with existing Zod schemas
   - Uncontrolled inputs = better performance
   - Built-in validation UI
   - Reduces form boilerplate by 60%

   **Create form wrapper:**
   ```typescript
   // app/components/ui/Form.tsx
   import { useForm, FormProvider } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import type { ZodSchema } from 'zod';

   interface FormProps {
     schema: ZodSchema;
     onSubmit: (data: any) => void | Promise<void>;
     defaultValues?: any;
     children: React.ReactNode;
   }

   export function Form({ schema, onSubmit, defaultValues, children }: FormProps) {
     const methods = useForm({
       resolver: zodResolver(schema),
       defaultValues,
     });

     return (
       <FormProvider {...methods}>
         <form onSubmit={methods.handleSubmit(onSubmit)}>
           {children}
         </form>
       </FormProvider>
     );
   }

   // Field component
   export function FormField({ name, label, ...props }) {
     const { register, formState: { errors } } = useFormContext();

     return (
       <div>
         <label>{label}</label>
         <input {...register(name)} {...props} />
         {errors[name] && <span>{errors[name].message}</span>}
       </div>
     );
   }
   ```

   **Usage:**
   ```tsx
   // Before: Manual form state (30+ lines)
   const [title, setTitle] = useState('');
   const [url, setUrl] = useState('');
   const [errors, setErrors] = useState({});
   // ... validation logic ...

   // After: React Hook Form (8 lines)
   <Form schema={feedSchema} onSubmit={handleSubmit}>
     <FormField name="title" label="Title" />
     <FormField name="url" label="URL" />
     <Button type="submit">Save</Button>
   </Form>
   ```

   **Estimated savings:** ~300 lines across all forms

11. **Create Animation System (NEW)**

   **Choose approach:**
   - **Option A:** Framer Motion (full-featured, 40KB)
   - **Option B:** CSS-only (lightweight, recommended)

   **Recommended: CSS-only approach**

   **Create `app/styles/animations.css`:**
   ```css
   @keyframes fadeIn {
     from { opacity: 0; }
     to { opacity: 1; }
   }

   @keyframes slideUp {
     from {
       opacity: 0;
       transform: translateY(10px);
     }
     to {
       opacity: 1;
       transform: translateY(0);
     }
   }

   @keyframes slideDown {
     from {
       opacity: 0;
       transform: translateY(-10px);
     }
     to {
       opacity: 1;
       transform: translateY(0);
     }
   }

   /* Utility classes */
   .animate-fade-in {
     animation: fadeIn var(--transition-base);
   }

   .animate-slide-up {
     animation: slideUp var(--transition-base);
   }

   .animate-slide-down {
     animation: slideDown var(--transition-base);
   }

   /* Modal entrance */
   .modal-backdrop {
     animation: fadeIn var(--transition-fast);
   }

   .modal-content {
     animation: slideUp var(--transition-base);
   }
   ```

   **Create animation utilities:**
   ```typescript
   // lib/animation-utils.ts
   export const animations = {
     fadeIn: 'animate-fade-in',
     slideUp: 'animate-slide-up',
     slideDown: 'animate-slide-down',
   } as const;

   export function withAnimation(baseClass: string, animation: keyof typeof animations) {
     return `${baseClass} ${animations[animation]}`;
   }
   ```

   **Usage in Modal:**
   ```tsx
   <div className="modal-backdrop">
     <div className="modal-content">
       {children}
     </div>
   </div>
   ```

   **Estimated savings:** ~150 lines of duplicate animation code

12. **Write Tests for New Components (NEW - CRITICAL)**

   **For EACH component created in Phase 1, write tests:**

   ```typescript
   // tests/components/ui/Button.test.tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { Button } from '@/app/components/ui/Button';

   describe('Button', () => {
     it('renders with text', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByText('Click me')).toBeInTheDocument();
     });

     it('handles click events', () => {
       const handleClick = vi.fn();
       render(<Button onClick={handleClick}>Click</Button>);

       fireEvent.click(screen.getByText('Click'));
       expect(handleClick).toHaveBeenCalledTimes(1);
     });

     it('shows loading state', () => {
       render(<Button loading>Loading</Button>);
       expect(screen.getByRole('button')).toBeDisabled();
     });

     it('applies variant styles', () => {
       const { container } = render(<Button variant="danger">Delete</Button>);
       expect(container.firstChild).toHaveClass('btn-danger');
     });
   });
   ```

   **Test coverage target:** 80%+ for UI components

13. **Create Storybook Stories for All Components (NEW - REQUIRED)**

   **For EACH component, create comprehensive stories:**

   ```typescript
   // app/components/ui/Modal.stories.tsx
   import type { Meta, StoryObj } from '@storybook/react';
   import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
   import { Button } from './Button';

   const meta: Meta<typeof Modal> = {
     title: 'UI/Modal',
     component: Modal,
     parameters: {
       layout: 'fullscreen',
     },
   };

   export default meta;
   type Story = StoryObj<typeof Modal>;

   export const Default: Story = {
     args: {
       isOpen: true,
       onClose: () => {},
       children: (
         <>
           <ModalHeader>Modal Title</ModalHeader>
           <ModalBody>Modal content goes here</ModalBody>
           <ModalFooter>
             <Button>Close</Button>
           </ModalFooter>
         </>
       ),
     },
   };

   export const Small: Story = {
     args: {
       ...Default.args,
       size: 'sm',
     },
   };

   export const Large: Story = {
     args: {
       ...Default.args,
       size: 'lg',
     },
   };
   ```

#### Success Criteria

- [ ] All UI components exported from `ui/index.ts`
- [ ] Each component has TypeScript props interface
- [ ] **At least 10 components migrated to new UI library** (increased from 3)
- [ ] **Storybook stories for ALL new components** (REQUIRED)
- [ ] **Test coverage >80% for UI components** (NEW)
- [ ] **React Hook Form integrated with at least 2 forms** (NEW)
- [ ] **Animation system in use in Modal and 2+ other components** (NEW)
- [ ] ~1,200 lines of duplicate code removed (UI) + 300 (forms) + 150 (animations) = **~1,650 lines total**

#### Migration Strategy

- **Don't break existing code:** Create new components alongside old ones
- **Migrate incrementally:** Update one component at a time
- **Test thoroughly:** Ensure visual parity before removing old code
- **Update gradually:** Can coexist with old patterns during transition

---

### Phase 2: Split Mega-Components (Weeks 3-4)
**Goal:** Break down 2,000+ line files into manageable modules
**Risk Level:** Medium
**Effort:** High
**Impact:** Very High

#### Tasks

1. **Refactor AdminDashboard (2,588 lines → ~200 lines)**

   **Before:**
   ```
   app/admin/dashboard/page.tsx (2,588 lines with inline tab components)
   ```

   **After:**
   ```
   app/admin/dashboard/
   ├── page.tsx                    # Coordinator (~200 lines)
   ├── components/
   │   ├── OverviewTab.tsx         # Overview metrics
   │   ├── SearchTab.tsx           # Search/embedding config
   │   ├── UsersTab.tsx            # User management
   │   ├── JobsTab.tsx             # Cron job history
   │   ├── StorageTab.tsx          # Database/cache stats
   │   ├── ConfigTab.tsx           # System configuration
   │   ├── LLMConfigTab.tsx        # LLM settings
   │   └── shared/
   │       ├── MetricCard.tsx      # Stat display component
   │       ├── JobHistoryTable.tsx # Reusable job table
   │       └── ConfirmButton.tsx   # Button with confirmation
   └── hooks/
       ├── use-admin-actions.ts    # Admin mutation hooks
       └── use-polling.ts          # Polling logic
   ```

   **Steps:**
   - Extract each tab function to separate file
   - Create coordinator component with tab navigation
   - Extract shared components (MetricCard, JobHistoryTable)
   - Move business logic to custom hooks
   - Update imports and exports
   - Test each tab in isolation

2. **Refactor FeedManagementModal (1,892 lines → ~150 lines)**

   **Before:**
   ```
   app/components/feeds/FeedManagementModal.tsx (1,892 lines)
   ```

   **After:**
   ```
   app/components/feeds/management/
   ├── FeedManagementModal.tsx     # Coordinator (~150 lines)
   ├── views/
   │   ├── OverviewView.tsx        # Feed list overview
   │   ├── FeedDetailsView.tsx     # Single feed settings
   │   ├── CategorySettingsView.tsx # Category settings
   │   └── BulkSettingsView.tsx    # Bulk operations
   └── shared/
       ├── FeedForm.tsx             # Feed settings form
       ├── CategoryForm.tsx         # Category form
       ├── SettingsSection.tsx      # Reusable settings section
       └── RefreshIntervalPicker.tsx # Custom interval picker
   ```

   **Steps:**
   - Extract view components
   - Create shared form components
   - Use new UI library components (Modal, Form, Button)
   - Extract feed management logic to custom hooks
   - Migrate nested modals (OpmlImport, OpmlExport, BulkSettings)
   - Test each view independently

3. **Refactor PreferencesModal (1,671 lines → ~150 lines)**

   **Note:** Already well-structured with view components, just needs file extraction

   **Before:**
   ```
   app/components/preferences/PreferencesModal.tsx (1,671 lines)
   ```

   **After:**
   ```
   app/components/preferences/
   ├── PreferencesModal.tsx         # Coordinator (~150 lines)
   ├── views/
   │   ├── ProfileView.tsx          # User profile
   │   ├── AppearanceView.tsx       # Theme/font settings
   │   ├── ReadingView.tsx          # Reading preferences
   │   ├── LearningView.tsx         # AI learning settings
   │   ├── LLMView.tsx              # LLM configuration
   │   └── ArticleDisplayView.tsx   # Article card customization
   └── shared/
       ├── PreferenceSection.tsx    # Section wrapper
       └── PreviewPanel.tsx         # Live preview container
   ```

   **Steps:**
   - Extract each view function to separate file
   - Move ToggleSwitch to ui/ (done in Phase 1)
   - Extract shared components
   - Use new Form components from Phase 1
   - Simplify coordinator with new UI components
   - Test unsaved changes flow still works

4. **Refactor CategoryList (769 lines → ~300 lines)**

   **Before:**
   ```
   app/components/feeds/CategoryList.tsx (769 lines)
   ```

   **After:**
   ```
   app/components/feeds/
   ├── CategoryList.tsx             # Main component (~300 lines)
   ├── CategoryItem.tsx             # Single category render
   ├── FeedItem.tsx                 # Single feed render
   └── hooks/
       ├── use-category-drag-drop.ts
       └── use-feed-drag-drop.ts
   ```

   **Steps:**
   - Extract CategoryItem and FeedItem components
   - Move drag-drop logic to custom hooks
   - Simplify action menus with new UI components
   - Improve type safety
   - Test drag-drop behavior

#### Success Criteria

- [ ] AdminDashboard main file under 300 lines
- [ ] FeedManagementModal coordinator under 200 lines
- [ ] PreferencesModal coordinator under 200 lines
- [ ] Each extracted component is independently testable
- [ ] All functionality preserved (no regressions)
- [ ] PR review time reduced (smaller diffs per component)

#### Migration Strategy

- **One component at a time:** Don't refactor all mega-components simultaneously
- **Feature flags:** If needed, use feature flags to test new implementations
- **Parallel development:** New structure can coexist with old during transition
- **Gradual rollout:** Deploy each refactored component independently

---

### Phase 3: Advanced Patterns (Weeks 5-6)
**Goal:** Implement systematic improvements and advanced patterns
**Risk Level:** Medium
**Effort:** Medium
**Impact:** High

#### Tasks

1. **Create Modal Management System**

   **Problem:** Modal state proliferation in `page.tsx`, `FeedManagementModal`, etc.

   **Solution:**
   ```typescript
   // app/components/modals/ModalProvider.tsx
   export function ModalProvider({ children }: { children: React.ReactNode }) {
     const [modals, setModals] = useState<ModalInstance[]>([]);

     const openModal = useCallback((type: string, props: any) => {
       const id = uuid();
       setModals(prev => [...prev, { id, type, props }]);
       return id;
     }, []);

     const closeModal = useCallback((id?: string) => {
       setModals(prev => id ? prev.filter(m => m.id !== id) : prev.slice(0, -1));
     }, []);

     return (
       <ModalContext.Provider value={{ openModal, closeModal }}>
         {children}
         {modals.map(modal => (
           <ModalRenderer key={modal.id} {...modal} onClose={() => closeModal(modal.id)} />
         ))}
       </ModalContext.Provider>
     );
   }

   // hooks/use-modals.ts
   export function useModals() {
     return useContext(ModalContext);
   }
   ```

   **Usage:**
   ```typescript
   // Before: page.tsx (5 modal states)
   const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
   const [isFeedBrowserOpen, setIsFeedBrowserOpen] = useState(false);
   // ... 3 more modal states

   // After: page.tsx
   const { openModal } = useModals();

   <button onClick={() => openModal('addFeed', { categoryId })}>
     Add Feed
   </button>
   ```

   **Steps:**
   - Create ModalProvider with context
   - Create modal registry mapping type → component
   - Build ModalRenderer dispatcher
   - Implement modal stack management
   - Add keyboard shortcuts (ESC to close)
   - Support modal-specific return values/callbacks
   - Migrate page.tsx modals
   - Migrate nested modals in FeedManagementModal

2. **Create Tabs Component**

   **Problem:** Tab navigation duplicated in AdminDashboard and PreferencesModal

   **Solution:**
   ```typescript
   // app/components/ui/Tabs.tsx
   export function Tabs({
     tabs,
     defaultTab,
     value,
     onChange,
     orientation = 'horizontal',
     variant = 'default'
   }: TabsProps) {
     // Tab navigation with URL sync, mobile menu, etc.
   }

   export function TabPanel({ children, value, index }: TabPanelProps) {
     return value === index ? children : null;
   }
   ```

   **Usage:**
   ```typescript
   // Before: AdminDashboard (193 lines of tab logic)
   const [activeTab, setActiveTab] = useState<TabId>('overview');
   // ... mobile menu logic
   // ... URL sync logic
   // ... navigation rendering

   // After: AdminDashboard
   <Tabs tabs={tabs} defaultTab="overview" variant="pills">
     <TabPanel value="overview">
       <OverviewTab />
     </TabPanel>
     <TabPanel value="search">
       <SearchTab />
     </TabPanel>
   </Tabs>
   ```

   **Steps:**
   - Create Tabs component with variants (default, pills, underline)
   - Support horizontal/vertical orientation
   - Add mobile dropdown menu
   - Implement URL sync (optional prop)
   - Support keyboard navigation (arrow keys)
   - Add icons + labels
   - Migrate AdminDashboard
   - Migrate PreferencesModal

3. **Extract Custom Hooks**

   **Create reusable hooks for common patterns:**

   ```typescript
   // hooks/use-modal-state.ts
   export function useModalState(defaultOpen = false) {
     const [isOpen, setIsOpen] = useState(defaultOpen);

     return {
       isOpen,
       open: useCallback(() => setIsOpen(true), []),
       close: useCallback(() => setIsOpen(false), []),
       toggle: useCallback(() => setIsOpen(prev => !prev), [])
     };
   }

   // hooks/use-unsaved-changes.ts
   export function useUnsavedChanges<T>(
     original: T,
     current: T,
     onClose: () => void
   ) {
     const hasChanges = useMemo(
       () => JSON.stringify(original) !== JSON.stringify(current),
       [original, current]
     );

     const handleClose = useCallback(() => {
       if (hasChanges) {
         toast.warning("You have unsaved changes", {
           action: { label: "Close anyway", onClick: onClose },
           cancel: { label: "Keep editing" }
         });
       } else {
         onClose();
       }
     }, [hasChanges, onClose]);

     return { hasChanges, handleClose };
   }

   // hooks/use-confirmation.ts
   export function useConfirmation() {
     return useCallback(async (message: string, options?: ConfirmOptions) => {
       return new Promise<boolean>((resolve) => {
         toast.warning(message, {
           action: {
             label: options?.confirmLabel ?? "Confirm",
             onClick: () => resolve(true)
           },
           cancel: {
             label: options?.cancelLabel ?? "Cancel",
             onClick: () => resolve(false)
           }
         });
       });
     }, []);
   }

   // hooks/use-drag-drop.ts
   export function useDragDrop<T extends { id: string }>({
     items,
     onReorder
   }: UseDragDropProps<T>) {
     const [draggedId, setDraggedId] = useState<string | null>(null);
     const [dragOverId, setDragOverId] = useState<string | null>(null);

     const handlers = {
       onDragStart: (e: DragEvent, id: string) => { /* ... */ },
       onDragOver: (e: DragEvent, id: string) => { /* ... */ },
       onDragLeave: () => { /* ... */ },
       onDrop: (e: DragEvent, targetId: string) => { /* ... */ },
       onDragEnd: () => { /* ... */ }
     };

     return { draggedId, dragOverId, handlers };
   }

   // hooks/use-polling.ts
   export function usePolling(
     callback: () => void,
     interval: number,
     enabled = true
   ) {
     useEffect(() => {
       if (!enabled) return;

       const id = setInterval(callback, interval);
       return () => clearInterval(id);
     }, [callback, interval, enabled]);
   }
   ```

   **Migration targets:**
   - PreferencesModal: use-unsaved-changes
   - AdminDashboard: use-confirmation, use-polling
   - CategoryList: use-drag-drop
   - page.tsx: use-modal-state

4. **Create Layout Abstractions**

   **Common layout patterns:**

   ```typescript
   // app/components/ui/layouts/ModalLayout.tsx
   export function ModalLayout({
     title,
     subtitle,
     onClose,
     children,
     footer,
     size = 'md'
   }: ModalLayoutProps) {
     return (
       <Modal size={size} onClose={onClose}>
         <ModalHeader>
           <div>
             <h2>{title}</h2>
             {subtitle && <p>{subtitle}</p>}
           </div>
         </ModalHeader>
         <ModalBody>{children}</ModalBody>
         {footer && <ModalFooter>{footer}</ModalFooter>}
       </Modal>
     );
   }

   // app/components/ui/layouts/SidebarLayout.tsx
   export function SidebarLayout({
     sidebar,
     header,
     children,
     footer,
     sidebarCollapsed = false
   }: SidebarLayoutProps) {
     // Implements sidebar + main content layout
   }

   // app/components/ui/layouts/DashboardLayout.tsx
   export function DashboardLayout({
     tabs,
     header,
     children,
     actions
   }: DashboardLayoutProps) {
     return (
       <div className="flex h-screen flex-col">
         {header}
         <Tabs tabs={tabs}>
           {children}
         </Tabs>
       </div>
     );
   }
   ```

   **Usage:**
   - PreferencesModal: Use ModalLayout + Tabs
   - AdminDashboard: Use DashboardLayout
   - FeedManagementModal: Use ModalLayout + Tabs

5. **Implement Server Actions (NEW - HIGH IMPACT)**

   **Problem:** 800+ lines of API route boilerplate for simple mutations

   **Solution: Replace API routes with Server Actions**

   **Before: API route + client mutation (45 lines total)**
   ```typescript
   // app/api/feeds/route.ts (30 lines)
   export const POST = createHandler(
     async ({ body, session }) => {
       const { url, title } = body;
       const feed = await feedService.addFeed(session.user.id, { url, title });
       return { data: feed };
     },
     { bodySchema: addFeedSchema, requireAuth: true }
   );

   // Client component (15 lines)
   const mutation = useMutation({
     mutationFn: async (data) => {
       const res = await fetch('/api/feeds', {
         method: 'POST',
         body: JSON.stringify(data),
       });
       return res.json();
     },
   });
   ```

   **After: Server Action (10 lines total)**
   ```typescript
   // app/actions/feed-actions.ts
   'use server';

   import { revalidatePath } from 'next/cache';
   import { auth } from '@/lib/auth';
   import { feedService } from '@/lib/services/feed-service';
   import { addFeedSchema } from '@/lib/schemas';

   export async function addFeed(formData: FormData) {
     const session = await auth();
     if (!session) throw new Error('Unauthorized');

     const data = addFeedSchema.parse({
       url: formData.get('url'),
       title: formData.get('title'),
     });

     const feed = await feedService.addFeed(session.user.id, data);

     revalidatePath('/');
     return { success: true, feed };
   }

   // Client component - use directly!
   import { addFeed } from '@/app/actions/feed-actions';

   function AddFeedForm() {
     return (
       <form action={addFeed}>
         <input name="url" />
         <input name="title" />
         <button type="submit">Add Feed</button>
       </form>
     );
   }
   ```

   **Advanced: With React Query (for optimistic updates)**
   ```typescript
   const mutation = useMutation({
     mutationFn: addFeed, // Server Action directly!
     onSuccess: () => {
       queryClient.invalidateQueries(['feeds']);
     },
   });
   ```

   **Migration targets:**
   - `/api/feeds` → `feed-actions.ts`
   - `/api/articles/feedback` → `article-actions.ts`
   - `/api/user/preferences` → `user-actions.ts`
   - `/api/saved-searches` → `search-actions.ts`

   **Benefits:**
   - Eliminates ~800 lines of API route boilerplate
   - Type-safe server/client communication (no serialization)
   - Automatic progressive enhancement
   - Simpler error handling
   - Better performance (no extra roundtrip)

   **Estimated savings:** ~800 lines

6. **Implement Suspense Boundaries (NEW)**

   **Problem:** Loading states scattered throughout components

   **Solution: Declarative loading with Suspense**

   **Before: Manual loading states**
   ```tsx
   function ArticleList() {
     const { data, isLoading } = useArticles();

     if (isLoading) return <LoadingSpinner />;

     return <div>{data.map(...)}</div>;
   }
   ```

   **After: Suspense boundary**
   ```tsx
   // Parent component
   <Suspense fallback={<ArticlesSkeleton />}>
     <ArticleList />
   </Suspense>

   // ArticleList.tsx - cleaner!
   async function ArticleList() {
     const articles = await getArticles(); // Server Component
     return <div>{articles.map(...)}</div>;
   }
   ```

   **Strategic placement:**
   ```tsx
   // app/page.tsx
   <ErrorBoundary>
     <Suspense fallback={<FeedListSkeleton />}>
       <CategoryList />
     </Suspense>

     <Suspense fallback={<ArticleListSkeleton />}>
       <ArticleList />
     </Suspense>
   </ErrorBoundary>
   ```

   **Benefits:**
   - Cleaner components (no isLoading checks)
   - Better loading UX (targeted skeletons)
   - Prevents waterfalls (parallel loading)
   - Works with Server Components

7. **Implement Intercepting Routes for Modals (NEW - REPLACES MANUAL HISTORY)**

   **Problem:** `FeedManagementModal` uses brittle `window.history.pushState`

   **Solution: Next.js Intercepting Routes**

   **Before: Manual history manipulation (brittle)**
   ```typescript
   // Manually push history state
   window.history.pushState({ modal: 'feedDetails' }, '', `/feeds/${id}`);

   // Manually handle back button
   window.addEventListener('popstate', handleBackButton);
   ```

   **After: Intercepting Routes (native)**
   ```
   app/
   ├── @modal/                    # Parallel route for modals
   │   ├── (.)feeds/              # Intercept /feeds when on home
   │   │   └── [id]/
   │   │       └── page.tsx       # Modal view
   │   └── default.tsx            # Default (no modal)
   ├── feeds/
   │   └── [id]/
   │       └── page.tsx           # Full page view
   └── page.tsx                   # Home page
   ```

   **Implementation:**
   ```tsx
   // app/@modal/(.)feeds/[id]/page.tsx
   export default function FeedModal({ params }) {
     return (
       <Modal>
         <FeedDetails id={params.id} />
       </Modal>
     );
   }

   // app/feeds/[id]/page.tsx - Same component, full page!
   export default function FeedPage({ params }) {
     return <FeedDetails id={params.id} />;
   }

   // app/layout.tsx
   export default function RootLayout({ children, modal }) {
     return (
       <html>
         <body>
           {children}
           {modal}  {/* Modal shown when intercepted */}
         </body>
       </html>
     );
   }
   ```

   **Benefits:**
   - **Deep linking:** `/feeds/123` works directly
   - **Back button:** Works natively (no manual handling)
   - **Shareable URLs:** Users can share modal links
   - **Cleaner code:** ~200 lines of manual history logic removed
   - **Better UX:** Native browser behavior

   **Migration:**
   - Convert `FeedManagementModal` to intercepting routes
   - Convert `PreferencesModal` (optional, less critical)

   **Estimated savings:** ~200 lines + better UX

8. **Implement Optimistic Updates (NEW)**

   **Problem:** UI updates feel slow (wait for server response)

   **Solution: Optimistic UI updates with rollback**

   ```typescript
   // hooks/use-optimistic-article-feedback.ts
   import { useMutation, useQueryClient } from '@tanstack/react-query';

   export function useOptimisticFeedback() {
     const queryClient = useQueryClient();

     return useMutation({
       mutationFn: submitFeedback,

       // Optimistically update UI before server responds
       onMutate: async (newFeedback) => {
         // Cancel outgoing refetches
         await queryClient.cancelQueries(['article', newFeedback.articleId]);

         // Snapshot previous value
         const previous = queryClient.getQueryData(['article', newFeedback.articleId]);

         // Optimistically update
         queryClient.setQueryData(['article', newFeedback.articleId], (old) => ({
           ...old,
           feedback: newFeedback.type,
         }));

         return { previous };
       },

       // Rollback on error
       onError: (err, newFeedback, context) => {
         queryClient.setQueryData(
           ['article', newFeedback.articleId],
           context.previous
         );
         toast.error('Failed to save feedback');
       },

       // Refetch on success
       onSettled: (data, error, variables) => {
         queryClient.invalidateQueries(['article', variables.articleId]);
       },
     });
   }

   // Usage
   function FeedbackButtons({ articleId }) {
     const mutation = useOptimisticFeedback();

     return (
       <>
         <button onClick={() => mutation.mutate({ articleId, type: 'POSITIVE' })}>
           👍
         </button>
         <button onClick={() => mutation.mutate({ articleId, type: 'NEGATIVE' })}>
           👎
         </button>
       </>
     );
   }
   ```

   **Apply to:**
   - Article feedback (thumbs up/down)
   - Feed subscriptions (add/remove)
   - Article read status (mark as read)
   - Preference changes (live preview)

   **Benefits:**
   - Instant UI feedback
   - Better perceived performance
   - Automatic rollback on error
   - Modern UX expectations

#### Success Criteria

- [ ] Modal management system in production
- [ ] Tabs component used in 2+ places
- [ ] At least 4 custom hooks extracted and reused
- [ ] Layout components reduce boilerplate by 50%
- [ ] **Server Actions replace 5+ API routes** (NEW)
- [ ] **Suspense boundaries around 3+ major features** (NEW)
- [ ] **Intercepting routes implemented for FeedManagementModal** (NEW)
- [ ] **Optimistic updates for 3+ mutation types** (NEW)
- [ ] **~1,600 additional lines of code removed** (updated from 600)
  - Modal management: ~300 lines
  - Tabs: ~150 lines
  - Custom hooks: ~200 lines
  - Layout abstractions: ~150 lines
  - **Server Actions: ~800 lines** (NEW)


#### Strategic Decision: Modals vs Routes
- **DECISION MADE:** Implement Intercepting Routes for FeedManagementModal (see task #7 above)
- Current manual implementation (`window.history.pushState`) will be replaced
- Intercepting routes provide deep linking and native back button support
- **Priority: HIGH** - Do this in Phase 3, not Phase 4
---

### Phase 4: Polish & Documentation (Week 7)
**Goal:** Finalize refactoring, document patterns, establish guidelines
**Risk Level:** Low
**Effort:** Low
**Impact:** Medium

#### Tasks

1. **Component Documentation**
   - Add JSDoc comments to all UI components
   - Document props and usage examples
   - Create Storybook stories (optional but recommended)
   - Add README to `ui/` folder

2. **Create Component Usage Guidelines**
   - Document when to use each component
   - Provide migration examples
   - Create decision tree for new features
   - Add troubleshooting guide

3. **Update Architecture Documentation**
   - Update CLAUDE.md with new component structure
   - Document modal management system
   - Add component library section
   - Update folder structure diagram

4. **Create Developer Guide**
   - "Building a new modal" guide
   - "Creating a form" guide
   - "Adding a new admin tab" guide
   - Component composition examples

5. **Accessibility Audit**
   - Verify keyboard navigation works
   - Add ARIA labels where missing
   - Test with screen reader
   - Fix any accessibility issues

6. **Performance Audit**
   - Add React.memo where beneficial
   - Optimize re-renders
   - Lazy load heavy components
   - Profile and measure improvements

7. **Cleanup**
   - Remove old, unused code
   - Delete deprecated components
   - Update imports across codebase
   - Run linter and fix warnings

#### Success Criteria

- [ ] All UI components documented
- [ ] Developer guides created
- [ ] CLAUDE.md updated
- [ ] Accessibility issues resolved
- [ ] No deprecated code remaining
- [ ] All tests passing

---

## Risk Mitigation

### Potential Risks

1. **Breaking Existing Functionality**
   - **Mitigation:** Incremental migration, thorough testing, feature flags if needed
   - **Rollback Plan:** Git history allows reverting individual changes

2. **Merge Conflicts During Transition**
   - **Mitigation:** Frequent communication, coordinate on Slack, update often from main
   - **Strategy:** Focus on one mega-component at a time to limit conflict surface

3. **Inconsistent Migration**
   - **Mitigation:** Clear guidelines, PR templates, code review checklist
   - **Prevention:** Document "done" criteria for each phase

4. **Performance Regressions**
   - **Mitigation:** Performance testing before/after, profiling tools
   - **Monitoring:** Set up performance budgets, lighthouse CI

5. **Over-Engineering**
   - **Mitigation:** Start simple, add complexity only when needed
   - **Principle:** YAGNI (You Aren't Gonna Need It)

### Testing Strategy

1. **Visual Regression Testing**
   - Take screenshots before refactoring
   - Compare after changes
   - Use Percy or Chromatic (optional)

2. **Manual Testing Checklist**
   - Test all modals open/close correctly
   - Verify form submissions work
   - Check keyboard navigation
   - Test mobile responsiveness
   - Verify dark mode still works

3. **Automated Testing**
   - Write tests for new UI components
   - Test custom hooks in isolation
   - Integration tests for modal management
   - E2E tests for critical flows

---

## Success Metrics

### Quantitative Metrics

- **Lines of Code:** Reduce by **~4,600 lines** (updated from 2,250 - **18% reduction**)
  - UI component library: ~1,200 lines
  - Server Actions: ~800 lines
  - Server Components (client JS): ~400 lines
  - Test infrastructure (bug prevention): ~500 lines
  - Custom hooks: ~400 lines
  - Form library: ~300 lines
  - Modal management: ~300 lines
  - Intercepting routes: ~200 lines
  - Layout abstractions: ~200 lines
  - Tabs: ~150 lines
  - Animation system: ~150 lines
- **File Size:** No file over 800 lines
- **Duplication:** Reduce duplicate code patterns by 80%
- **Component Reuse:** 15+ components reusing new UI library
- **PR Size:** Average PR reduces from 500 lines to 200 lines
- **Bundle Size:** Reduce by 30-40% through Server Components
- **Test Coverage:** Achieve 70%+ for UI components (from 0%)
- **Client Components:** Reduce from 100% to ~30%

### Qualitative Metrics

- **Developer Velocity:** New features ship 30% faster
- **Onboarding Time:** New developers productive in 2 days vs 1 week
- **Code Review:** Review time reduced by 40%
- **Bug Rate:** Fewer styling/consistency bugs
- **Developer Satisfaction:** Team survey shows improvement

### Tracking

- Weekly progress reports
- Before/after screenshots
- Bundle size monitoring
- Performance metrics (lighthouse scores)
- Developer feedback surveys

---

## Timeline

```
Week 0: Phase 0 - Testing & Infrastructure Foundation (NEW - CRITICAL)
├─ Days 1-2: Setup Vitest, Testing Library, write baseline tests
├─ Days 2-3: Setup Storybook, create example stories
├─ Day 3: Enable TypeScript strict mode, fix critical errors
├─ Day 4: Setup bundle analyzer, design tokens, error boundaries
└─ Day 5: Server/Client component audit, performance monitoring setup

Week 1-2: Phase 1 - UI Component Library
├─ Week 1: Setup structure + ToggleSwitch, Modal, Button, Form library
└─ Week 2: Card, Form components, animation system + tests & stories for all

Week 3-4: Phase 2 - Split Mega-Components
├─ Week 3: AdminDashboard + FeedManagementModal (write tests first!)
└─ Week 4: PreferencesModal + CategoryList (write tests first!)

Week 5-6: Phase 3 - Advanced Patterns & Modern React
├─ Week 5: Modal management, Tabs, Server Actions (5+ routes)
└─ Week 6: Custom hooks, Intercepting routes, Suspense, Optimistic updates

Week 7-8: Phase 4 - Polish & Documentation
├─ Week 7: Documentation, accessibility audit, performance optimization
└─ Week 8: Cleanup, final testing, team training
```

**Total Duration:** 8 weeks (updated from 7, added Phase 0)
**Effort:** 1-2 developers full-time

**Critical Path:** Phase 0 MUST be completed before starting Phase 1. Do not skip Phase 0.

---

## Getting Started

### Prerequisites

1. Familiarize yourself with current codebase structure
2. Read through identified pain points
3. Review existing component patterns
4. Set up local development environment

### First Steps

1. **Create feature branch:** `git checkout -b refactor/phase-0-testing-infrastructure`
2. **START WITH PHASE 0:** Setup testing infrastructure (DO NOT SKIP)
3. **Install Vitest & Testing Library:** Run `npm install -D vitest @testing-library/react ...`
4. **Write 5 baseline tests:** Test existing components before changing them
5. **Setup Storybook:** Run `npx storybook@latest init`
6. **Document baseline metrics:** Bundle size, component count, etc.
7. **Create PR for Phase 0:** Get team buy-in on testing approach
8. **Only after Phase 0 is merged:** Start Phase 1

### Communication

- **Daily standups:** Share progress and blockers
- **Weekly demos:** Show refactored components
- **Slack channel:** `#refactoring` for discussions
- **PR reviews:** Prioritize refactoring PRs

---

## Conclusion

This refactoring plan transforms NeuReed from an organically-grown codebase into a well-architected, maintainable application. By focusing on reusability, clear boundaries, and systematic improvements, we'll reduce technical debt while improving developer productivity.

The phased approach allows us to deliver value incrementally while managing risk. Each phase builds on the previous one, creating a solid foundation for future development.

**Next Steps:**
1. Review and approve this plan
2. Allocate developer resources
3. Create tracking board (GitHub Projects or Jira)
4. Begin Phase 1

---

## Appendix

### Related Documents

- [CLAUDE.md](../CLAUDE.md) - Project overview and architecture
- [.cursorrules](../.cursorrules) - Development conventions
- Current component structure (see file tree above)

### Key Files to Refactor

| File | Current Lines | Target Lines | Priority |
|------|--------------|--------------|----------|
| `app/admin/dashboard/page.tsx` | 2,588 | ~200 | High |
| `app/components/feeds/FeedManagementModal.tsx` | 1,892 | ~150 | High |
| `app/components/preferences/PreferencesModal.tsx` | 1,671 | ~150 | High |
| `app/components/feeds/CategoryList.tsx` | 769 | ~300 | Medium |
| `app/page.tsx` | 659 | ~500 | Medium |

### Quick Reference

**Phase 0 Priority (CRITICAL):** Vitest, Storybook, TypeScript strict mode, Bundle analyzer
**Phase 1 Priority:** ToggleSwitch, Modal, Button, Card, Form, Animation system
**Phase 2 Priority:** AdminDashboard, FeedManagementModal (with tests!)
**Phase 3 Priority:** Server Actions, Intercepting Routes, Suspense, Optimistic Updates
**Phase 4 Priority:** Documentation, accessibility, cleanup

**Top 3 Highest Impact Items:**
1. **Phase 0 Testing Infrastructure** - Enables everything else safely
2. **Phase 3 Server Actions** - Eliminates 800 lines of boilerplate
3. **Phase 3 Intercepting Routes** - Native modal behavior + deep linking

---

**Document Maintained By:** Development Team
**Last Updated:** 2025-01-25 (v2.0 - Major update with testing & modern React patterns)
**Next Review:** After Phase 0 completion

---

## Summary of Changes in v2.0

### What's New:
1. **Phase 0 Added (CRITICAL):** Testing infrastructure before any refactoring
   - Vitest + Testing Library
   - Storybook (required, not optional)
   - TypeScript strict mode
   - Bundle analyzer
   - Design token system
   - Error boundaries
   - Performance monitoring

2. **Modern React Patterns (Phase 3):**
   - Server Actions (replaces API routes)
   - Suspense boundaries
   - Intercepting Routes (replaces manual history)
   - Optimistic updates

3. **Enhanced Phase 1:**
   - React Hook Form integration
   - Animation system
   - Test requirements for all components
   - Storybook stories requirement

### Updated Metrics:
- **Code reduction:** 2,250 lines → **4,600 lines** (2x improvement)
- **Timeline:** 7 weeks → **8 weeks** (added Phase 0)
- **Test coverage:** 0% → **70%+ target**
- **Bundle size:** Target 30-40% reduction via Server Components

### Why These Changes:
- **Risk mitigation:** Zero test coverage makes large refactoring extremely risky
- **Modern best practices:** Leverage Next.js 16 App Router features
- **Better outcomes:** Measurable improvements in performance and maintainability
- **Team confidence:** Testing infrastructure enables bold changes

### Migration Path:
1. ✅ Complete Phase 0 (testing infrastructure) - **DO NOT SKIP**
2. ✅ Follow original plan but with tests for each component
3. ✅ Add Server Actions in Phase 3 (high impact, low effort)
4. ✅ Implement Intercepting Routes (replaces brittle manual history)
