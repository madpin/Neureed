# Modal Management System Guide

## Overview

This guide outlines the modal management architecture using Next.js Intercepting Routes and Parallel Routes for a better user experience.

## Architecture

### Current State
- Modals managed via React state
- URL doesn't reflect modal state
- No browser back button support
- No shareable modal URLs

### Target State
- Modals via Intercepting Routes (`@modal`)
- URL-based modal state
- Back button closes modals
- Share modal URLs
- Context API for simple modals

## Intercepting Routes Pattern

### Directory Structure

```
app/
├── @modal/
│   ├── (.)preferences/
│   │   └── page.tsx          # Intercept /preferences
│   ├── (.)feeds/[id]/
│   │   └── page.tsx          # Intercept /feeds/[id]
│   └── default.tsx            # Empty modal slot
├── preferences/
│   └── page.tsx              # Full page fallback
├── feeds/
│   └── [id]/
│       └── page.tsx          # Full page fallback
├── layout.tsx                 # Root layout with @modal slot
└── page.tsx                   # Home page
```

### Root Layout with Modal Slot

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

### Intercepting Route Modal

```tsx
// app/@modal/(.)preferences/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { PreferencesContent } from '@/app/preferences/PreferencesContent';
import { Modal } from '@/app/components/ui';

export default function PreferencesModal() {
  const router = useRouter();

  return (
    <Modal
      isOpen={true}
      onClose={() => router.back()}
      title="Preferences"
      size="large"
    >
      <PreferencesContent />
    </Modal>
  );
}
```

### Full Page Fallback

```tsx
// app/preferences/page.tsx
import { PreferencesContent } from './PreferencesContent';

export default function PreferencesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Preferences</h1>
      <PreferencesContent />
    </div>
  );
}
```

### Shared Content Component

```tsx
// app/preferences/PreferencesContent.tsx
'use client';

import { usePreferences, useUpdatePreferences } from '@/src/hooks/queries/use-user-preferences';
import { Form } from '@/app/components/ui';

export function PreferencesContent() {
  const { data: preferences } = usePreferences();
  const updatePreferences = useUpdatePreferences();

  // Shared logic for both modal and page
  return (
    <Form onSubmit={handleSubmit}>
      {/* Form fields */}
    </Form>
  );
}
```

## Context-Based Modal Manager

For simple modals (confirm, alert, prompt):

### Modal Context

```tsx
// app/contexts/ModalContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Modal } from '@/app/components/ui';

interface ModalConfig {
  title: string;
  content: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
  confirm: (message: string, onConfirm: () => void) => void;
  alert: (message: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalConfig | null>(null);

  const showModal = useCallback((config: ModalConfig) => {
    setModal(config);
  }, []);

  const hideModal = useCallback(() => {
    setModal(null);
  }, []);

  const confirm = useCallback((message: string, onConfirm: () => void) => {
    showModal({
      title: 'Confirm',
      content: <p>{message}</p>,
      onConfirm: () => {
        onConfirm();
        hideModal();
      },
      onCancel: hideModal,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });
  }, [showModal, hideModal]);

  const alert = useCallback((message: string) => {
    showModal({
      title: 'Alert',
      content: <p>{message}</p>,
      onConfirm: hideModal,
      confirmText: 'OK',
    });
  }, [showModal, hideModal]);

  return (
    <ModalContext.Provider value={{ showModal, hideModal, confirm, alert }}>
      {children}
      {modal && (
        <Modal
          isOpen={true}
          onClose={modal.onCancel || hideModal}
          title={modal.title}
        >
          <div className="space-y-4">
            {modal.content}
            <div className="flex justify-end gap-2">
              {modal.onCancel && (
                <button
                  onClick={modal.onCancel}
                  className="btn btn-secondary"
                >
                  {modal.cancelText || 'Cancel'}
                </button>
              )}
              {modal.onConfirm && (
                <button
                  onClick={modal.onConfirm}
                  className="btn btn-primary"
                >
                  {modal.confirmText || 'OK'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
```

### Usage

```tsx
// In a component
import { useModal } from '@/app/contexts/ModalContext';

function DeleteButton({ feedId }: { feedId: string }) {
  const { confirm } = useModal();
  const deleteFeed = useDeleteFeed();

  const handleDelete = () => {
    confirm('Are you sure you want to delete this feed?', () => {
      deleteFeed.mutate(feedId);
    });
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

## Migration Steps

### Step 1: Update Root Layout

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ModalProvider>
          {children}
          {modal}
        </ModalProvider>
      </body>
    </html>
  );
}
```

### Step 2: Create Default Modal Slot

```tsx
// app/@modal/default.tsx
export default function Default() {
  return null;
}
```

### Step 3: Migrate PreferencesModal

**Create intercepting route:**
```tsx
// app/@modal/(.)preferences/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Modal } from '@/app/components/ui';
import { PreferencesContent } from '@/app/preferences/PreferencesContent';

export default function PreferencesModal() {
  const router = useRouter();

  return (
    <Modal
      isOpen={true}
      onClose={() => router.back()}
      title="Preferences"
      size="large"
    >
      <PreferencesContent />
    </Modal>
  );
}
```

**Create full page:**
```tsx
// app/preferences/page.tsx
import { PreferencesContent } from './PreferencesContent';

export default function PreferencesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Preferences</h1>
      <PreferencesContent />
    </div>
  );
}
```

**Extract shared content:**
```tsx
// app/preferences/PreferencesContent.tsx
'use client';

import { PreferencesModal as OldPreferencesModal } from '@/app/components/preferences/PreferencesModal';

export function PreferencesContent() {
  // Extract the form logic from the old modal
  return <div>{/* Form content */}</div>;
}
```

**Update navigation:**
```tsx
// Before
<button onClick={() => setShowPreferences(true)}>
  Preferences
</button>

// After
<Link href="/preferences">
  Preferences
</Link>
```

### Step 4: Migrate Other Modals

Follow same pattern for:
- Feed Management Modal → `/feeds/[id]`
- Bulk Settings Modal → `/feeds/bulk-settings`
- OPML Import Modal → `/feeds/import`
- OPML Export Modal → `/feeds/export`

### Step 5: Update page.tsx

```tsx
// app/page.tsx (Before)
'use client';

export default function HomePage() {
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <div>
      <ArticleList />
      {showPreferences && (
        <PreferencesModal onClose={() => setShowPreferences(false)} />
      )}
    </div>
  );
}
```

```tsx
// app/page.tsx (After)
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <ArticleList />
      {/* Modal opens via routing */}
    </div>
  );
}
```

## Benefits

### 1. URL-Based State
- Modal state in URL
- Shareable URLs
- Direct navigation

### 2. Browser Integration
- Back button closes modal
- Forward button reopens
- History management

### 3. Progressive Enhancement
- Works without JavaScript
- Falls back to full page
- SEO friendly

### 4. Better UX
- Faster perceived performance
- Smooth transitions
- Consistent behavior

## Testing

### Test Intercepting Route

```typescript
import { render, screen } from '@testing-library/react';
import PreferencesModal from '@/app/@modal/(.)preferences/page';

describe('PreferencesModal', () => {
  it('renders modal content', () => {
    render(<PreferencesModal />);
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('closes on back navigation', async () => {
    const { user } = render(<PreferencesModal />);
    const closeButton = screen.getByLabelText('Close');

    await user.click(closeButton);

    expect(mockRouter.back).toHaveBeenCalled();
  });
});
```

### Test Full Page Fallback

```typescript
describe('PreferencesPage', () => {
  it('renders full page', () => {
    render(<PreferencesPage />);
    expect(screen.getByRole('heading', { name: 'Preferences' })).toBeInTheDocument();
  });
});
```

## Implementation Checklist

### Intercepting Routes
- [ ] Create `@modal` parallel route
- [ ] Create `default.tsx` for empty state
- [ ] Migrate PreferencesModal
- [ ] Migrate FeedManagementModal
- [ ] Migrate BulkSettingsModal
- [ ] Migrate OpmlImportModal
- [ ] Migrate OpmlExportModal

### Context Manager
- [ ] Create ModalContext
- [ ] Add ModalProvider to layout
- [ ] Create useModal hook
- [ ] Implement confirm dialog
- [ ] Implement alert dialog
- [ ] Update delete confirmations

### Page Updates
- [ ] Update page.tsx navigation
- [ ] Update MainLayout.tsx
- [ ] Remove modal state management
- [ ] Update all modal triggers to use Links

## Best Practices

### 1. Separate Concerns

Keep content separate from modal wrapper:

```tsx
// ✅ Good
<Modal>
  <SharedContent />
</Modal>

// ❌ Bad
<Modal>
  <div>{/* All logic here */}</div>
</Modal>
```

### 2. Handle Loading States

```tsx
<Suspense fallback={<ModalSkeleton />}>
  <ModalContent />
</Suspense>
```

### 3. Error Boundaries

```tsx
<ErrorBoundary fallback={<ErrorModal />}>
  <ModalContent />
</ErrorBoundary>
```

### 4. Accessibility

Ensure modals are accessible:
- Focus management
- Keyboard navigation
- ARIA attributes
- Screen reader support

## Conclusion

The modal management system provides:
- ✅ URL-based modal state
- ✅ Browser back button support
- ✅ Shareable modal URLs
- ✅ Progressive enhancement
- ✅ Better user experience
- ✅ Cleaner code organization

Follow this guide to migrate all modals to the new system.
