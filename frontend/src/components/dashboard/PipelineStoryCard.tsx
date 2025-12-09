/**
 * Pipeline Story Card
 * Enhanced story card with pipeline status visualization and animations
 */

import { motion } from "framer-motion";
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
  Calendar,
  Zap,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import type { Story, Task } from "../../types";
import { useState } from "react";

interface PipelineStoryCardProps {
  story: Story;
  onClick?: (story: Story) => void;
}

// Status configuration with icons and colors
const statusConfig: Record<
  Story["status"],
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
    isProcessing?: boolean;
  }
> = {
  pending: {
    icon: Clock,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    label: "Pending",
  },
  dividing: {
    icon: Sparkles,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    label: "Dividing",
    isProcessing: true,
  },
  reviewing: {
    icon: MessageSquare,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "Reviewing",
    isProcessing: true,
  },
  tasks_ready: {
    icon: ListTodo,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    label: "Tasks Ready",
  },
  generating: {
    icon: Code2,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    label: "Generating",
    isProcessing: true,
  },
  code_review: {
    icon: CheckCircle,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    label: "Code Review",
    isProcessing: true,
  },
  testing: {
    icon: FlaskConical,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    label: "Testing",
    isProcessing: true,
  },
  deploying: {
    icon: Rocket,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    label: "Deploying",
    isProcessing: true,
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    label: "Completed",
  },
  failed: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    label: "Failed",
  },
};

const priorityConfig = {
  low: { color: "text-slate-400", bg: "bg-slate-500/10", label: "Low" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Medium" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10", label: "High" },
  critical: { color: "text-red-400", bg: "bg-red-500/10", label: "Critical" },
};

const taskTypeIcons = {
  frontend: "🎨",
  backend: "⚙️",
  database: "🗄️",
  integration: "🔗",
};

export const PipelineStoryCard = ({ story, onClick }: PipelineStoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = statusConfig[story.status];
  const priority = priorityConfig[story.priority];
  const StatusIcon = status.icon;
  const tasks = story.tasks || [];

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative rounded-xl border backdrop-blur-sm transition-all duration-300 overflow-hidden ${
        onClick ? "cursor-pointer" : ""
      } ${
        status.isProcessing
          ? `${status.borderColor} ${status.bgColor} shadow-lg`
          : "border-white/5 bg-surface/50 hover:border-accent-primary/30 hover:shadow-lg hover:shadow-black/20"
      }`}
      onClick={() => onClick?.(story)}
    >
      {/* Processing Glow Effect */}
      {status.isProcessing && (
        <motion.div
          className={`absolute inset-0 ${status.bgColor} opacity-50`}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-text-primary mb-1.5 line-clamp-2 group-hover:text-accent-primary transition-colors leading-snug">
              {story.title}
            </h3>
            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
              {story.description}
            </p>
          </div>

          {/* Status Badge */}
          <motion.div
            className={`px-2 py-1.5 rounded-lg ${status.bgColor} ${status.borderColor} border shrink-0 backdrop-blur-sm flex items-center gap-1.5`}
            animate={status.isProcessing ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
            {status.isProcessing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-3 h-3 text-amber-400" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Selection Info (if LLM selected) */}
        {story.selectedBy === "llm_tiebreaker" && story.llmReasoning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-3 px-2.5 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] font-medium text-violet-400">AI Selected</span>
            </div>
            <p className="text-[10px] text-text-muted line-clamp-2">{story.llmReasoning}</p>
          </motion.div>
        )}

        {/* Failed Reason */}
        {story.status === "failed" && story.failedReason && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-3 px-2.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-medium text-red-400">
                Failed at: {story.failedPhase}
              </span>
            </div>
            <p className="text-[10px] text-text-muted line-clamp-2">{story.failedReason}</p>
          </motion.div>
        )}

        {/* Preview URL */}
        {story.previewUrl && (
          <motion.a
            href={story.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mb-3 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">View Preview</span>
            <ExternalLink className="w-3 h-3 text-emerald-400 ml-auto" />
          </motion.a>
        )}

        {/* Tasks Preview (if available) */}
        {tasks.length > 0 && (
          <motion.div
            className="mb-3"
            initial={false}
            animate={{ height: isExpanded ? "auto" : "auto" }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-text-secondary">{tasks.length} Tasks</span>
                <div className="flex -space-x-1">
                  {Object.entries(
                    tasks.reduce(
                      (acc, t) => {
                        acc[t.type] = (acc[t.type] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  )
                    .slice(0, 4)
                    .map(([type]) => (
                      <span key={type} className="text-[10px]">
                        {taskTypeIcons[type as keyof typeof taskTypeIcons]}
                      </span>
                    ))}
                </div>
              </div>
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
              </motion.div>
            </button>

            {/* Expanded Tasks List */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar"
              >
                {tasks.slice(0, 5).map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {tasks.length > 5 && (
                  <div className="text-[10px] text-text-muted text-center py-1">
                    +{tasks.length - 5} more tasks
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${priority.bg} ${priority.color} border-white/5`}
            >
              {priority.label}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(story.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Status Label */}
          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${status.color}`}>
            {status.isProcessing && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-current"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            <span className="uppercase tracking-wide">{status.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Task Item Component
function TaskItem({ task }: { task: Task }) {
  const statusColors: Record<Task["status"], string> = {
    pending: "bg-slate-500",
    reviewed: "bg-cyan-500",
    subdivided: "bg-violet-500",
    in_progress: "bg-blue-500",
    code_generated: "bg-amber-500",
    code_approved: "bg-orange-500",
    tests_generated: "bg-pink-500",
    tests_passed: "bg-emerald-500",
    deployed: "bg-green-500",
    failed: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/5">
      <span className="text-xs">{taskTypeIcons[task.type]}</span>
      <span className="flex-1 text-[11px] text-text-secondary truncate">{task.title}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${statusColors[task.status]}`} />
    </div>
  );
}

export default PipelineStoryCard;
