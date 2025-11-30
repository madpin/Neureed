"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { scale, useReducedMotion } from "@/lib/animations";

export interface TooltipProps {
  /**
   * Tooltip content to display
   */
  content: string;

  /**
   * Children element that triggers the tooltip
   */
  children: ReactNode;

  /**
   * Position of the tooltip relative to the trigger
   */
  position?: "top" | "bottom" | "left" | "right";

  /**
   * Whether to use portal-based rendering (for overflow cases)
   */
  usePortal?: boolean;

  /**
   * Delay in milliseconds before showing the tooltip
   */
  delay?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Tooltip component for displaying contextual information
 *
 * Provides a hybrid approach:
 * - CSS-based positioning by default (lightweight, 90% of use cases)
 * - Optional portal-based rendering for edge cases (prevents overflow issues)
 *
 * Consolidated from layout/Tooltip.tsx and admin/Tooltip.tsx
 *
 * @example
 * ```tsx
 * <Tooltip content="Click to edit" position="top">
 *   <button>Edit</button>
 * </Tooltip>
 *
 * // With portal for overflow cases
 * <Tooltip content="Settings" position="right" usePortal>
 *   <IconButton />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  position = "top",
  usePortal = false,
  delay = 200,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);

      if (usePortal && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipWidth = 200; // Approximate tooltip width
        const tooltipHeight = 40; // Approximate tooltip height

        let top = rect.top;
        let left = rect.left + rect.width / 2;

        // Position based on placement
        switch (position) {
          case "top":
            top = rect.top - tooltipHeight - 8;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top = rect.bottom + 8;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - 8;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + 8;
            break;
        }

        setCoords({ top, left });
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Position classes for CSS-based tooltip
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  // Arrow classes for CSS-based tooltip
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-foreground",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-foreground",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-foreground",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-foreground",
  };

  const tooltipContent = (
    <motion.div
      className={`pointer-events-none z-tooltip rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg ${className}`}
      role="tooltip"
      style={
        usePortal
          ? {
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: "var(--z-tooltip)",
            }
          : undefined
      }
      {...(prefersReducedMotion ? {} : scale)}
    >
      {content}
      {!usePortal && (
        <div
          className={`absolute h-0 w-0 border-4 ${arrowClasses[position]}`}
        />
      )}
    </motion.div>
  );

  if (usePortal && isVisible && mounted) {
    return (
      <>
        <div
          ref={triggerRef}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          className="inline-block"
        >
          {children}
        </div>
        <AnimatePresence>
          {isVisible && createPortal(tooltipContent, document.body)}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className="group relative inline-block"
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <div className={`absolute ${positionClasses[position]}`}>
            {tooltipContent}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
