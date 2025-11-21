"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getSectionLabel } from './DraggableOrderEditor';

interface SortableSectionItemProps {
  id: string;
}

export function SortableSectionItem({ id }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 rounded-lg border border-border bg-background p-3
        ${isDragging ? 'opacity-50 shadow-lg z-50' : 'hover:bg-muted cursor-grab active:cursor-grabbing'}
        transition-shadow
      `}
      {...attributes}
      {...listeners}
    >
      {/* Drag handle icon */}
      <svg 
        className="h-5 w-5 text-muted-foreground flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 8h16M4 16h16" 
        />
      </svg>
      
      {/* Section name */}
      <span className="flex-1 font-medium text-sm text-foreground">
        {getSectionLabel(id)}
      </span>

      {/* Optional: Section icon/preview */}
      <div className="text-xs text-foreground/40 font-mono">
        {id}
      </div>
    </div>
  );
}

