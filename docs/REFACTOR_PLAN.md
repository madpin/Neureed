# NeuReed Refactoring Plan

**Version:** 1.0
**Date:** 2025-01-25
**Status:** Planning Phase

---

## Executive Summary

NeuReed has grown organically and now contains several mega-components (2,500+ lines) with significant code duplication. This refactoring plan aims to improve maintainability, testability, and developer experience by extracting reusable UI components, splitting large files, and establishing consistent patterns.

**Key Metrics:**
- **Largest file:** `app/admin/dashboard/page.tsx` (2,588 lines)
- **Duplicate code:** ~2,250 lines identified
- **Modal implementations:** 9 different files with similar patterns
- **Card/container pattern:** Repeated 267 times across 39 files

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

---

## Main Wins

### 🎯 Immediate Benefits

1. **~2,250 Lines of Code Reduction**
   - UI component library: ~1,200 lines saved
   - Custom hooks: ~400 lines saved
   - Modal management: ~300 lines saved
   - Layout abstractions: ~200 lines saved
   - Tab component: ~150 lines saved

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
   - Test UI components in isolation
   - Mock fewer dependencies
   - Reusable test utilities
   - Higher confidence in refactors

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
   - Memoization at component level
   - Lazy load heavy modal content
   - Share component instances

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

2. **Performance Opportunities**
   - No component memoization strategy
   - Could optimize re-renders

3. **Accessibility Gaps**
   - Inconsistent keyboard navigation
   - Missing ARIA attributes in some places

---

## Refactoring Phases

### Phase 1: Foundation (Weeks 1-2)
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
#### Success Criteria

- [ ] All UI components exported from `ui/index.ts`
- [ ] Each component has TypeScript props interface
- [ ] At least 3 existing components migrated to use new UI library
- [ ] Storybook examples created (optional but recommended)
- [ ] ~500 lines of duplicate code removed

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

#### Success Criteria

- [ ] Modal management system in production
- [ ] Tabs component used in 2+ places
- [ ] At least 4 custom hooks extracted and reused
- [ ] Layout components reduce boilerplate by 50%
- [ ] ~600 additional lines of code removed


#### Strategic Decision: Modals vs Routes
- Evaluate replacing `FeedManagementModal`'s manual history manipulation with Next.js **Intercepting Routes**.
- Current manual implementation (`window.history.pushState`) is brittle.
- Intercepting routes would allow deep linking and native back button support without custom logic.
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

- **Lines of Code:** Reduce by ~2,250 lines (10% reduction)
- **File Size:** No file over 800 lines
- **Duplication:** Reduce duplicate code patterns by 80%
- **Component Reuse:** 15+ components reusing new UI library
- **PR Size:** Average PR reduces from 500 lines to 200 lines

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
Week 1-2: Phase 1 - Foundation
├─ Week 1: Setup + Extract ToggleSwitch, Modal, Button
└─ Week 2: Card, Form components + consolidate duplicates

Week 3-4: Phase 2 - Split Mega-Components
├─ Week 3: AdminDashboard + FeedManagementModal
└─ Week 4: PreferencesModal + CategoryList

Week 5-6: Phase 3 - Advanced Patterns
├─ Week 5: Modal management + Tabs component
└─ Week 6: Custom hooks + Layout abstractions

Week 7: Phase 4 - Polish & Documentation
└─ Documentation, accessibility, performance, cleanup
```

**Total Duration:** 7 weeks
**Effort:** 1-2 developers full-time

---

## Getting Started

### Prerequisites

1. Familiarize yourself with current codebase structure
2. Read through identified pain points
3. Review existing component patterns
4. Set up local development environment

### First Steps

1. **Create feature branch:** `git checkout -b refactor/ui-component-library`
2. **Start with Phase 1, Task 1:** Setup component library structure
3. **Extract ToggleSwitch:** Low-risk, high-impact quick win
4. **Create PR for review:** Get feedback early
5. **Iterate based on feedback**

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

**Phase 1 Priority:** ToggleSwitch, Modal, Button, Card, Form
**Phase 2 Priority:** AdminDashboard, FeedManagementModal
**Phase 3 Priority:** Modal management system
**Phase 4 Priority:** Documentation

---

**Document Maintained By:** Development Team
**Last Updated:** 2025-01-25
**Next Review:** After Phase 1 completion
