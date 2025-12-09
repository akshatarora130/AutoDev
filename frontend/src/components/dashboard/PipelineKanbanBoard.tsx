/**
 * Pipeline Kanban Board
 * Modern Kanban board showing story pipeline phases with animations
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  Sparkles,
  CheckCircle,
  ListTodo,
  Code2,
  MessageSquare,
  FlaskConical,
  Rocket,
  AlertTriangle,
  GripVertical,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { Story } from "../../types";
import { PipelineStoryCard } from "./PipelineStoryCard";

interface PipelineKanbanBoardProps {
  stories: Story[];
  onStoryClick?: (story: Story) => void;
  onStatusChange?: (storyId: string, newStatus: Story["status"]) => void;
}

// Pipeline phases configuration
const pipelinePhases: Array<{
  id: Story["status"];
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
}> = [
  {
    id: "pending",
    title: "Pending",
    icon: Clock,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    glowColor: "shadow-slate-500/20",
    description: "Waiting to be processed",
  },
  {
    id: "dividing",
    title: "Dividing",
    icon: Sparkles,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    glowColor: "shadow-violet-500/30",
    description: "Breaking into subtasks",
  },
  {
    id: "reviewing",
    title: "Reviewing",
    icon: MessageSquare,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/30",
    description: "Validating tasks",
  },
  {
    id: "tasks_ready",
    title: "Tasks Ready",
    icon: ListTodo,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    glowColor: "shadow-cyan-500/30",
    description: "Ready for code generation",
  },
  {
    id: "generating",
    title: "Generating",
    icon: Code2,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/30",
    description: "Writing code",
  },
  {
    id: "code_review",
    title: "Code Review",
    icon: CheckCircle,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    glowColor: "shadow-orange-500/30",
    description: "Reviewing code quality",
  },
  {
    id: "testing",
    title: "Testing",
    icon: FlaskConical,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    glowColor: "shadow-pink-500/30",
    description: "Running tests",
  },
  {
    id: "deploying",
    title: "Deploying",
    icon: Rocket,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/30",
    description: "Deploying to preview",
  },
  {
    id: "completed",
    title: "Completed",
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    glowColor: "shadow-green-500/30",
    description: "Done!",
  },
  {
    id: "failed",
    title: "Failed",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    glowColor: "shadow-red-500/30",
    description: "Needs attention",
  },
];

// Active phases (ones with stories or always shown)
const getVisiblePhases = (stories: Story[]) => {
  const activeStatuses = new Set(stories.map((s) => s.status));
  // Always show these phases
  const alwaysShow = new Set(["pending", "tasks_ready", "completed", "failed"]);

  return pipelinePhases.filter((phase) => alwaysShow.has(phase.id) || activeStatuses.has(phase.id));
};

export const PipelineKanbanBoard = ({
  stories,
  onStoryClick,
  onStatusChange,
}: PipelineKanbanBoardProps) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [visiblePhases, setVisiblePhases] = useState(getVisiblePhases(stories));

  useEffect(() => {
    setVisiblePhases(getVisiblePhases(stories));
  }, [stories]);

  const sensors = useSensors(useSensor(PointerSensor));

  const storiesByStatus = pipelinePhases.reduce(
    (acc, phase) => {
      acc[phase.id] = stories.filter((story) => story.status === phase.id);
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

    const isPhase = pipelinePhases.some((p) => p.id === over.id);
    const overStory = stories.find((s) => s.id === over.id);

    if (isPhase) {
      const overPhaseId = over.id as Story["status"];
      if (overPhaseId !== activeStory.status) {
        onStatusChange?.(activeStory.id, overPhaseId);
      }
    } else if (overStory && overStory.status !== activeStory.status) {
      onStatusChange?.(activeStory.id, overStory.status);
    }
  };

  const activeStory = activeId ? stories.find((s) => s.id === activeId) : null;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Pipeline Progress Bar */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {pipelinePhases.slice(0, -1).map((phase, index) => {
            const hasStories = storiesByStatus[phase.id]?.length > 0;
            const Icon = phase.icon;
            return (
              <div key={phase.id} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    hasStories
                      ? `${phase.bgColor} ${phase.color} ${phase.borderColor} border`
                      : "bg-white/5 text-text-muted border border-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{phase.title}</span>
                  {hasStories && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
                      {storiesByStatus[phase.id].length}
                    </span>
                  )}
                </motion.div>
                {index < pipelinePhases.length - 2 && (
                  <ChevronRight className="w-4 h-4 text-text-muted/30 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full min-w-max">
            <AnimatePresence mode="popLayout">
              {visiblePhases.map((phase, index) => {
                const phaseStories = storiesByStatus[phase.id] || [];
                return (
                  <PipelineColumn
                    key={phase.id}
                    phase={phase}
                    stories={phaseStories}
                    onStoryClick={onStoryClick}
                    index={index}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <DragOverlay>
          {activeStory ? (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.05, rotate: 2 }}
              className="opacity-95"
            >
              <PipelineStoryCard story={activeStory} />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

interface PipelineColumnProps {
  phase: (typeof pipelinePhases)[0];
  stories: Story[];
  onStoryClick?: (story: Story) => void;
  index: number;
}

function PipelineColumn({ phase, stories, onStoryClick, index }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: phase.id });
  const Icon = phase.icon;
  const isProcessing = [
    "dividing",
    "reviewing",
    "generating",
    "code_review",
    "testing",
    "deploying",
  ].includes(phase.id);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className={`flex flex-col w-80 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        isOver
          ? `${phase.bgColor} ${phase.borderColor} shadow-lg ${phase.glowColor}`
          : "bg-surface/30 border-white/5 hover:border-white/10"
      }`}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-white/5 ${phase.bgColor} rounded-t-xl`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isProcessing && stories.length > 0 ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className={`p-1.5 rounded-lg ${phase.bgColor}`}
            >
              <Icon className={`w-4 h-4 ${phase.color}`} />
            </motion.div>
            <h3 className="font-semibold text-sm text-text-primary tracking-wide">{phase.title}</h3>
            {isProcessing && stories.length > 0 && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </motion.div>
            )}
          </div>
          <span className="text-[10px] font-medium text-text-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            {stories.length}
          </span>
        </div>
        <p className="text-[10px] text-text-muted">{phase.description}</p>
      </div>

      {/* Column Content */}
      <SortableContext
        items={stories.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
        id={phase.id}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {stories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-8 text-xs text-text-muted border-2 border-dashed border-white/5 rounded-lg m-1"
              >
                <Icon className={`w-8 h-8 ${phase.color} opacity-20 mb-2`} />
                <p>No stories</p>
              </motion.div>
            ) : (
              stories.map((story, idx) => (
                <SortableStoryCard
                  key={story.id}
                  story={story}
                  onStoryClick={onStoryClick}
                  index={idx}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </SortableContext>
    </motion.div>
  );
}

interface SortableStoryCardProps {
  story: Story;
  onStoryClick?: (story: Story) => void;
  index: number;
}

function SortableStoryCard({ story, onStoryClick, index }: SortableStoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      className="relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="w-4 h-4 text-text-muted" />
      </div>
      <PipelineStoryCard story={story} onClick={onStoryClick} />
    </motion.div>
  );
}

export default PipelineKanbanBoard;
