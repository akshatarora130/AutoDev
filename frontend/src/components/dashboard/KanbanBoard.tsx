import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { StoryCard } from "./StoryCard";
import type { Story } from "../../types";

interface KanbanBoardProps {
  stories: Story[];
  onStoryClick?: (story: Story) => void;
  onProcessStory?: (story: Story) => void;
  onStatusChange?: (storyId: string, newStatus: Story["status"]) => void;
}

interface SortableStoryCardProps {
  story: Story;
  onStoryClick?: (story: Story) => void;
  onProcessStory?: (story: Story) => void;
}

const statusColumns: Array<{ id: Story["status"]; title: string; color: string }> = [
  { id: "pending", title: "Pending", color: "yellow" },
  { id: "processing", title: "Processing", color: "blue" },
  { id: "completed", title: "Completed", color: "green" },
  { id: "failed", title: "Failed", color: "red" },
];

function SortableStoryCard({ story, onStoryClick, onProcessStory }: SortableStoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="w-4 h-4 text-text-muted" />
      </div>
      <StoryCard story={story} onClick={onStoryClick} onProcess={onProcessStory} />
    </div>
  );
}

export const KanbanBoard = ({
  stories,
  onStoryClick,
  onProcessStory,
  onStatusChange,
}: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const storiesByStatus = statusColumns.reduce(
    (acc, column) => {
      acc[column.id] = stories.filter((story) => story.status === column.id);
      return acc;
    },
    {} as Record<Story["status"], Story[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeStory = stories.find((s) => s.id === active.id);
    if (!activeStory) return;

    // Check if dropped on a column or another story
    const isColumn = statusColumns.some((col) => col.id === over.id);
    const overStory = stories.find((s) => s.id === over.id);

    if (isColumn) {
      // Dropped directly on a column
      const overColumnId = over.id as Story["status"];
      if (overColumnId !== activeStory.status) {
        onStatusChange?.(activeStory.id, overColumnId);
      }
    } else if (overStory) {
      // Dropped on another story - use that story's column
      if (overStory.status !== activeStory.status) {
        onStatusChange?.(activeStory.id, overStory.status);
      }
    }
  };

  const activeStory = activeId ? stories.find((s) => s.id === activeId) : null;

  return (
    <div className="h-full flex flex-col bg-background">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full min-w-max">
            {statusColumns.map((column) => {
              const columnStories = storiesByStatus[column.id] || [];
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  stories={columnStories}
                  onStoryClick={onStoryClick}
                  onProcessStory={onProcessStory}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="opacity-90 rotate-2">
              <StoryCard story={activeStory} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

interface KanbanColumnProps {
  column: { id: Story["status"]; title: string; color: string };
  stories: Story[];
  onStoryClick?: (story: Story) => void;
  onProcessStory?: (story: Story) => void;
}

function KanbanColumn({ column, stories, onStoryClick, onProcessStory }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const isPending = column.id === "pending";

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 rounded-xl border transition-all duration-300 ${
        isOver
          ? "bg-accent-primary/10 border-accent-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
          : "bg-surface/30 border-white/5 hover:border-white/10"
      }`}
    >
      {/* Column Header */}
      <div
        className={`p-4 border-b border-white/5 ${
          column.id === "pending"
            ? "bg-yellow-500/5"
            : column.id === "processing"
              ? "bg-blue-500/5"
              : column.id === "completed"
                ? "bg-green-500/5"
                : "bg-red-500/5"
        } rounded-t-xl`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                column.id === "pending"
                  ? "bg-yellow-500"
                  : column.id === "processing"
                    ? "bg-blue-500"
                    : column.id === "completed"
                      ? "bg-green-500"
                      : "bg-red-500"
              }`}
            />
            <h3 className="font-semibold text-sm text-text-primary tracking-wide">
              {column.title}
            </h3>
          </div>
          <span className="text-[10px] font-medium text-text-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            {stories.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <SortableContext
        items={stories.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
        id={column.id}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] custom-scrollbar">
          {stories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 text-xs text-text-muted border-2 border-dashed border-white/5 rounded-lg m-1">
              <p>No stories in {column.title}</p>
            </div>
          ) : (
            stories.map((story) => (
              <SortableStoryCard
                key={story.id}
                story={story}
                onStoryClick={onStoryClick}
                onProcessStory={onProcessStory}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Add Button for Pending */}
      {isPending && (
        <div className="p-3 pt-0">
          <button className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-xs text-text-muted hover:text-accent-primary hover:border-accent-primary/30 hover:bg-accent-primary/5 transition-all group">
            <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
