import type { ReactNode } from "react";

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  scrollable?: boolean;
}

/**
 * CardBody component - Main content area for cards
 *
 * @example
 * ```tsx
 * <CardBody>
 *   <p>Main content goes here</p>
 * </CardBody>
 * ```
 */
export function CardBody({
  children,
  className = "",
  padding = true,
  scrollable = false,
}: CardBodyProps) {
  const classes = [
    padding && "p-6",
    scrollable && "overflow-y-auto",
    className,
  ].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
}
