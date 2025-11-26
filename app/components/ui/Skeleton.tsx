import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of skeleton lines/blocks to render
   * @default 1
   */
  count?: number;
}

export function Skeleton({ 
  count = 1, 
  className = "",
  ...props 
}: SkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}

