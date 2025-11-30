import type { ReactNode } from "react";

export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  border?: boolean;
}

/**
 * CardHeader component - Header section for cards with title, subtitle, icon, and action
 *
 * @example
 * ```tsx
 * <CardHeader
 *   title="User Statistics"
 *   subtitle="Last 30 days"
 *   icon={<UserIcon />}
 *   action={<Button size="sm">View All</Button>}
 * />
 * ```
 */
export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
  border = true,
}: CardHeaderProps) {
  const classes = [
    "px-6 py-4",
    border && "border-b border-border",
    className,
  ].filter(Boolean).join(" ");

  if (children) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <div className={classes}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-lg font-medium text-foreground">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-foreground/60">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
