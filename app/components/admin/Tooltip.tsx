/**
 * Tooltip Component for Admin Dashboard
 * Simple, accessible tooltip with CSS-based positioning
 */

import { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        className={`pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100 dark:bg-gray-700 ${
          position === "top"
            ? "bottom-full left-1/2 mb-2 -translate-x-1/2"
            : position === "bottom"
            ? "top-full left-1/2 mt-2 -translate-x-1/2"
            : position === "left"
            ? "right-full top-1/2 mr-2 -translate-y-1/2"
            : "left-full top-1/2 ml-2 -translate-y-1/2"
        }`}
        role="tooltip"
      >
        {content}
        <div
          className={`absolute h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-700 ${
            position === "top"
              ? "bottom-[-4px] left-1/2 -translate-x-1/2"
              : position === "bottom"
              ? "top-[-4px] left-1/2 -translate-x-1/2"
              : position === "left"
              ? "right-[-4px] top-1/2 -translate-y-1/2"
              : "left-[-4px] top-1/2 -translate-y-1/2"
          }`}
        ></div>
      </div>
    </div>
  );
}

