"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

type Position = "right" | "left" | "top" | "bottom";

interface ResizableSplitPaneProps {
  children: ReactNode;
  panel: ReactNode;
  position: Position;
  size: number; // percentage (0-100)
  onResize?: (newSize: number) => void;
  minSize?: number; // minimum percentage
  maxSize?: number; // maximum percentage
}

export function ResizableSplitPane({
  children,
  panel,
  position,
  size,
  onResize,
  minSize = 30,
  maxSize = 70,
}: ResizableSplitPaneProps) {
  const [currentSize, setCurrentSize] = useState(size);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHorizontal = position === "left" || position === "right";

  useEffect(() => {
    setCurrentSize(size);
  }, [size]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newSize: number;

      if (isHorizontal) {
        const totalWidth = rect.width;
        if (position === "right") {
          const distanceFromRight = rect.right - e.clientX;
          newSize = (distanceFromRight / totalWidth) * 100;
        } else {
          // left
          const distanceFromLeft = e.clientX - rect.left;
          newSize = (distanceFromLeft / totalWidth) * 100;
        }
      } else {
        const totalHeight = rect.height;
        if (position === "bottom") {
          const distanceFromBottom = rect.bottom - e.clientY;
          newSize = (distanceFromBottom / totalHeight) * 100;
        } else {
          // top
          const distanceFromTop = e.clientY - rect.top;
          newSize = (distanceFromTop / totalHeight) * 100;
        }
      }

      // Clamp size between min and max
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setCurrentSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onResize?.(currentSize);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position, isHorizontal, currentSize, minSize, maxSize, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const getContainerStyle = () => {
    if (isHorizontal) {
      return {
        display: "flex",
        flexDirection: position === "left" ? ("row" as const) : ("row-reverse" as const),
        height: "100%",
        width: "100%",
      };
    } else {
      return {
        display: "flex",
        flexDirection: position === "top" ? ("column" as const) : ("column-reverse" as const),
        height: "100%",
        width: "100%",
      };
    }
  };

  const getListStyle = () => {
    if (isHorizontal) {
      return {
        flex: `0 0 ${100 - currentSize}%`,
        overflow: "auto",
        minWidth: 0,
      };
    } else {
      return {
        flex: `0 0 ${100 - currentSize}%`,
        overflow: "auto",
        minHeight: 0,
      };
    }
  };

  const getPanelStyle = () => {
    if (isHorizontal) {
      return {
        flex: `0 0 ${currentSize}%`,
        overflow: "auto",
        minWidth: 0,
      };
    } else {
      return {
        flex: `0 0 ${currentSize}%`,
        overflow: "auto",
        minHeight: 0,
      };
    }
  };

  const getDividerStyle = () => {
    const baseStyle = {
      flexShrink: 0,
      cursor: isHorizontal ? "col-resize" : "row-resize",
      backgroundColor: isDragging ? "rgb(59, 130, 246)" : "rgb(229, 231, 235)",
      transition: isDragging ? "none" : "background-color 0.2s",
      userSelect: "none" as const,
    };

    if (isHorizontal) {
      return {
        ...baseStyle,
        width: "4px",
        height: "100%",
      };
    } else {
      return {
        ...baseStyle,
        height: "4px",
        width: "100%",
      };
    }
  };

  return (
    <div ref={containerRef} style={getContainerStyle()}>
      {/* Panel */}
      <div style={getPanelStyle()} className="bg-background">
        {panel}
      </div>

      {/* Divider */}
      <div
        style={getDividerStyle()}
        onMouseDown={handleMouseDown}
        className="hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-600"
        role="separator"
        aria-orientation={isHorizontal ? "vertical" : "horizontal"}
        aria-valuenow={currentSize}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
      />

      {/* List/Main Content */}
      <div style={getListStyle()} className="bg-muted">
        {children}
      </div>
    </div>
  );
}

