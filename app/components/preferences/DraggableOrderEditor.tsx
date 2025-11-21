"use client";

import { DndContext, closestCenter, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableSectionItem } from './SortableSectionItem';

interface DraggableOrderEditorProps {
  sections: string[];
  onReorder: (newOrder: string[]) => void;
}

// Human-readable labels for section IDs
export function getSectionLabel(sectionId: string): string {
  const labels: Record<string, string> = {
    feedInfo: "Feed Info & Date",
    title: "Article Title",
    image: "Article Image",
    excerpt: "Article Excerpt",
    actions: "Action Buttons",
  };
  return labels[sectionId] || sectionId;
}

export function DraggableOrderEditor({ sections, onReorder }: DraggableOrderEditorProps) {
  // Configure sensors for better accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.indexOf(active.id as string);
      const newIndex = sections.indexOf(over.id as string);
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h4 className="text-sm font-medium text-foreground mb-1">Section Order</h4>
        <p className="text-xs text-foreground/60">
          Drag sections to reorder how they appear in article cards
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSectionItem key={section} id={section} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="mt-3 text-xs text-foreground/60">
        💡 Tip: Use keyboard (Space to grab, arrows to move, Enter to drop)
      </p>
    </div>
  );
}

