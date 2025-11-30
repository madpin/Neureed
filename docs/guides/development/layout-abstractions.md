# Layout Abstractions Guide

## Overview

This guide outlines reusable layout abstractions for consistent page structure across the NeuReed application.

## Layout Architecture

### Layout Hierarchy

```
RootLayout (app/layout.tsx)
├── AuthLayout (auth pages)
├── DashboardLayout (main app)
│   ├── Sidebar
│   ├── Header
│   └── Content Area
├── ModalLayout (modal routes)
└── EmptyLayout (standalone pages)
```

## Core Layout Components

### 1. Dashboard Layout

**Purpose**: Main application layout with sidebar, header, and content area

```tsx
// app/components/layouts/DashboardLayout.tsx
'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/app/components/navigation/Sidebar';
import { Header } from '@/app/components/navigation/Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode | false;
  header?: ReactNode | false;
  className?: string;
}

export function DashboardLayout({
  children,
  sidebar = <Sidebar />,
  header = <Header />,
  className = '',
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {sidebar !== false && (
        <aside className="w-64 border-r bg-muted/10 overflow-y-auto">
          {sidebar}
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {header !== false && (
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {header}
          </header>
        )}

        {/* Content area */}
        <main className={cn('flex-1 overflow-y-auto p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Usage:**

```tsx
// app/articles/page.tsx
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';

export default function ArticlesPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Articles</h1>
      <ArticleList />
    </DashboardLayout>
  );
}
```

**Variations:**

```tsx
// Without sidebar
<DashboardLayout sidebar={false}>
  <Content />
</DashboardLayout>

// Custom sidebar
<DashboardLayout sidebar={<CustomSidebar />}>
  <Content />
</DashboardLayout>

// Without header
<DashboardLayout header={false}>
  <Content />
</DashboardLayout>
```

### 2. Modal Layout

**Purpose**: Consistent layout for modal content

```tsx
// app/components/layouts/ModalLayout.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
}

export function ModalLayout({
  children,
  title,
  description,
  footer,
  className = '',
}: ModalLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Content */}
      <div>{children}</div>

      {/* Footer */}
      {footer && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          {footer}
        </div>
      )}
    </div>
  );
}
```

**Usage:**

```tsx
// app/@modal/(.)preferences/page.tsx
import { ModalLayout } from '@/app/components/layouts/ModalLayout';
import { Modal } from '@/app/components/ui';

export default function PreferencesModal() {
  return (
    <Modal isOpen onClose={handleClose} size="large">
      <ModalLayout
        title="Preferences"
        description="Customize your reading experience"
        footer={
          <>
            <button onClick={handleCancel}>Cancel</button>
            <button onClick={handleSave}>Save</button>
          </>
        }
      >
        <PreferencesForm />
      </ModalLayout>
    </Modal>
  );
}
```

### 3. Settings Layout

**Purpose**: Layout for settings pages with tabs or sections

```tsx
// app/components/layouts/SettingsLayout.tsx
'use client';

import { ReactNode } from 'react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/app/components/ui';

interface SettingsSection {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface SettingsLayoutProps {
  title: string;
  description?: string;
  sections: SettingsSection[];
  defaultSection?: string;
}

export function SettingsLayout({
  title,
  description,
  sections,
  defaultSection,
}: SettingsLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      <Tabs defaultValue={defaultSection || sections[0].id} orientation="horizontal">
        <TabList>
          {sections.map(section => (
            <Tab key={section.id} value={section.id} icon={section.icon}>
              {section.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {sections.map(section => (
            <TabPanel key={section.id} value={section.id}>
              {section.content}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  );
}
```

**Usage:**

```tsx
// app/settings/page.tsx
import { SettingsLayout } from '@/app/components/layouts/SettingsLayout';
import { Settings, User, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsLayout
        title="Settings"
        description="Manage your account and preferences"
        sections={[
          {
            id: 'general',
            label: 'General',
            icon: <Settings size={16} />,
            content: <GeneralSettings />,
          },
          {
            id: 'profile',
            label: 'Profile',
            icon: <User size={16} />,
            content: <ProfileSettings />,
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell size={16} />,
            content: <NotificationSettings />,
          },
        ]}
      />
    </DashboardLayout>
  );
}
```

### 4. Card Grid Layout

**Purpose**: Responsive grid layout for cards

```tsx
// app/components/layouts/CardGridLayout.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardGridLayoutProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CardGridLayout({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}: CardGridLayoutProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap];

  return (
    <div className={cn('grid', gridClass, gapClass, className)}>
      {children}
    </div>
  );
}
```

**Usage:**

```tsx
// app/feeds/page.tsx
import { CardGridLayout } from '@/app/components/layouts/CardGridLayout';

export default function FeedsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Feeds</h1>
      <CardGridLayout columns={3}>
        {feeds.map(feed => (
          <FeedCard key={feed.id} feed={feed} />
        ))}
      </CardGridLayout>
    </DashboardLayout>
  );
}
```

### 5. List Layout

**Purpose**: Layout for lists with filters and actions

```tsx
// app/components/layouts/ListLayout.tsx
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ListLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ListLayout({
  children,
  title,
  description,
  filters,
  actions,
  className = '',
}: ListLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || description || filters || actions) && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            {filters}
            {actions}
          </div>
        </div>
      )}

      {/* List content */}
      <div className={cn('space-y-4', className)}>{children}</div>
    </div>
  );
}
```

**Usage:**

```tsx
// app/articles/page.tsx
import { ListLayout } from '@/app/components/layouts/ListLayout';
import { FilterBar } from '@/app/components/filters/FilterBar';
import { Button } from '@/app/components/ui';

export default function ArticlesPage() {
  return (
    <DashboardLayout>
      <ListLayout
        title="Articles"
        description="Browse your latest articles"
        filters={<FilterBar />}
        actions={
          <Button onClick={handleRefresh}>
            Refresh
          </Button>
        }
      >
        <ArticleList />
      </ListLayout>
    </DashboardLayout>
  );
}
```

### 6. Split Layout

**Purpose**: Two-panel layout (sidebar + content)

```tsx
// app/components/layouts/SplitLayout.tsx
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SplitLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  sidebarWidth?: 'narrow' | 'medium' | 'wide';
  sidebarPosition?: 'left' | 'right';
  className?: string;
}

export function SplitLayout({
  sidebar,
  content,
  sidebarWidth = 'medium',
  sidebarPosition = 'left',
  className = '',
}: SplitLayoutProps) {
  const widthClass = {
    narrow: 'w-64',
    medium: 'w-80',
    wide: 'w-96',
  }[sidebarWidth];

  const orderClass = sidebarPosition === 'right' ? 'order-2' : '';

  return (
    <div className={cn('flex gap-6', className)}>
      <aside className={cn('flex-shrink-0', widthClass, orderClass)}>
        {sidebar}
      </aside>
      <div className="flex-1 min-w-0">{content}</div>
    </div>
  );
}
```

**Usage:**

```tsx
// app/article/[id]/page.tsx
import { SplitLayout } from '@/app/components/layouts/SplitLayout';

export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <SplitLayout
        sidebar={<ArticleMetadata articleId={params.id} />}
        content={<ArticleContent articleId={params.id} />}
        sidebarPosition="right"
      />
    </DashboardLayout>
  );
}
```

### 7. Empty State Layout

**Purpose**: Layout for empty states

```tsx
// app/components/layouts/EmptyStateLayout.tsx
import { ReactNode } from 'react';
import { EmptyState } from '@/app/components/ui';

interface EmptyStateLayoutProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyStateLayout({
  icon,
  title,
  description,
  action,
}: EmptyStateLayoutProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
}
```

## Implementation Checklist

### Core Layouts
- [ ] Create DashboardLayout
- [ ] Create ModalLayout
- [ ] Create SettingsLayout
- [ ] Create CardGridLayout
- [ ] Create ListLayout
- [ ] Create SplitLayout
- [ ] Create EmptyStateLayout

### Page Migrations
- [ ] Migrate home page to DashboardLayout
- [ ] Migrate articles page to ListLayout
- [ ] Migrate feeds page to CardGridLayout
- [ ] Migrate settings page to SettingsLayout
- [ ] Migrate article detail to SplitLayout
- [ ] Migrate empty states to EmptyStateLayout

### Documentation
- [ ] Document layout patterns
- [ ] Create usage examples
- [ ] Add Storybook stories
- [ ] Write migration guide

## Benefits

### 1. Consistency
- Uniform layouts across pages
- Predictable structure
- Reusable patterns

### 2. Maintainability
- Centralized layout logic
- Easy to update globally
- Less code duplication

### 3. Flexibility
- Composable layouts
- Easy customization
- Support for variations

### 4. Accessibility
- Consistent ARIA structure
- Proper heading hierarchy
- Keyboard navigation

## Best Practices

### 1. Composition Over Configuration

```tsx
// ✅ Good - Composable
<DashboardLayout>
  <ListLayout title="Articles">
    <ArticleList />
  </ListLayout>
</DashboardLayout>

// ❌ Bad - Too many props
<PageLayout
  hasSidebar
  hasHeader
  title="Articles"
  showFilters
  showActions
>
  <ArticleList />
</PageLayout>
```

### 2. Sensible Defaults

```tsx
// Provide defaults but allow overrides
export function DashboardLayout({
  sidebar = <Sidebar />,
  header = <Header />,
  children,
}: Props) {
  // ...
}
```

### 3. Responsive Design

```tsx
// Make layouts mobile-friendly
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {children}
</div>
```

### 4. Loading States

```tsx
<Suspense fallback={<LayoutSkeleton />}>
  <DashboardLayout>
    <Content />
  </DashboardLayout>
</Suspense>
```

## Conclusion

Layout abstractions provide:
- ✅ Consistent page structure
- ✅ Reusable patterns
- ✅ Better maintainability
- ✅ Faster development
- ✅ Improved accessibility

Use these layouts to build pages quickly and consistently.
