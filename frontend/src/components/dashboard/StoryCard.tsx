import { Clock, AlertCircle, CheckCircle2, XCircle, Play, Calendar } from "lucide-react";
import { Button } from "../common/Button";
import type { Story } from "../../types";

interface StoryCardProps {
  story: Story;
  onProcess?: (story: Story) => void;
  onClick?: (story: Story) => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Pending",
  },
  dividing: {
    icon: AlertCircle,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    label: "Dividing",
  },
  reviewing: {
    icon: AlertCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Reviewing",
  },
  tasks_ready: {
    icon: CheckCircle2,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    label: "Tasks Ready",
  },
  generating: {
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Generating",
  },
  code_review: {
    icon: AlertCircle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    label: "Code Review",
  },
  testing: {
    icon: AlertCircle,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    label: "Testing",
  },
  deploying: {
    icon: AlertCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Deploying",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Failed",
  },
};

const priorityConfig = {
  low: { color: "text-text-muted", bg: "bg-text-muted/10", label: "Low" },
  medium: { color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Medium" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10", label: "High" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", label: "Critical" },
};

export const StoryCard = ({ story, onProcess, onClick }: StoryCardProps) => {
  const StatusIcon = statusConfig[story.status].icon;
  const statusStyle = statusConfig[story.status];
  const priorityStyle = priorityConfig[story.priority];

  return (
    <div
      className={`group relative p-4 rounded-xl border border-white/5 bg-surface/50 hover:bg-surface/80 hover:border-accent-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={() => onClick?.(story)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-text-primary mb-1.5 line-clamp-2 group-hover:text-accent-primary transition-colors leading-snug">
            {story.title}
          </h3>
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
            {story.description}
          </p>
        </div>
        <div
          className={`px-2 py-1.5 rounded-lg ${statusStyle.bg} ${statusStyle.border} border shrink-0 backdrop-blur-sm`}
        >
          <StatusIcon className={`w-3.5 h-3.5 ${statusStyle.color}`} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${priorityStyle.bg} ${priorityStyle.color} border-white/5`}
          >
            {priorityStyle.label}
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

        {onProcess && story.status === "pending" && (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onProcess(story);
            }}
            className="flex items-center gap-1.5 shrink-0 text-[10px] h-6 px-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
          >
            <Play className="w-2.5 h-2.5" />
            <span>Process</span>
          </Button>
        )}
        {["dividing", "reviewing", "generating", "code_review", "testing", "deploying"].includes(
          story.status
        ) && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            <span className="text-[10px] uppercase tracking-wide">
              {statusConfig[story.status].label}
            </span>
          </div>
        )}
        {story.status === "completed" && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}
        {story.status === "tasks_ready" && (
          <div className="flex items-center gap-1.5 text-xs text-cyan-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wide">Ready</span>
          </div>
        )}
      </div>
    </div>
  );
};
