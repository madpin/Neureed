"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", text, className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-primary border-t-transparent mx-auto`}
        />
        {text && (
          <p className="mt-3 text-sm text-foreground/70">{text}</p>
        )}
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ count = 5, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}

