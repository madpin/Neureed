/**
 * Skeleton Component
 *
 * A loading placeholder component that mimics content shapes.
 * Follows accessibility best practices and provides smooth animations.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-full" />
 * <Skeleton variant="circular" className="w-12 h-12" />
 * <Skeleton variant="text" lines={3} />
 * ```
 */

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Variant type
   */
  variant?: 'rectangular' | 'circular' | 'text';

  /**
   * Number of lines for text variant
   */
  lines?: number;

  /**
   * Animation type
   */
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton component
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  lines,
  animation = 'pulse',
}: SkeletonProps) {
  // Animation classes
  const animationClass =
    animation === 'pulse'
      ? 'animate-pulse'
      : animation === 'wave'
      ? 'animate-shimmer'
      : '';

  // Variant-specific base styles
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded h-4'
      : 'rounded-md';

  // Base styles
  const baseStyles = cn(
    'bg-muted',
    variantClass,
    animationClass,
    className
  );

  // For text variant with multiple lines
  if (variant === 'text' && lines && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseStyles,
              i === lines - 1 ? 'w-3/4' : 'w-full' // Last line is shorter
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={baseStyles}
      aria-hidden="true"
      aria-label="Loading..."
    />
  );
}

/**
 * Article Card Skeleton
 */
export function ArticleCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

/**
 * Article List Skeleton
 */
export function ArticleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Feed Card Skeleton
 */
export function FeedCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <Skeleton variant="text" lines={2} />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * Feed List Skeleton
 */
export function FeedListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Category List Skeleton
 */
export function CategoryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton variant="circular" className="w-8 h-8" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-6 w-8" />
        </div>
      ))}
    </div>
  );
}

/**
 * Sidebar Skeleton
 */
export function SidebarSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <CategoryListSkeleton count={5} />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <CategoryListSkeleton count={3} />
      </div>
    </div>
  );
}

/**
 * Table Skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 4
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Grid Skeleton
 */
export function CardGridSkeleton({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
}) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid gap-4', gridClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton variant="text" lines={2} />
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard Stats Skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Profile Header Skeleton
 */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 p-6">
      <Skeleton variant="circular" className="w-20 h-20" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Form Skeleton
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
