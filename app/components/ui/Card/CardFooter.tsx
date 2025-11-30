import type { ReactNode } from "react";

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
  align?: "left" | "center" | "right" | "between";
}

/**
 * CardFooter component - Footer section for cards with optional border and alignment
 *
 * @example
 * ```tsx
 * <CardFooter align="right">
 *   <Button variant="outline">Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </CardFooter>
 * ```
 */
export function CardFooter({
  children,
  className = "",
  border = true,
  align = "right",
}: CardFooterProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  const classes = [
    "flex items-center gap-3 px-6 py-4",
    border && "border-t border-border",
    alignClasses[align],
    className,
  ].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
}
