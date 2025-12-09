import { Play, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "../common/Button";
import type { Story } from "../../types";

interface StoryListItemProps {
  story: Story;
  onProcess?: (story: Story) => void;
  onClick?: (story: Story) => void;
}

const statusConfig = {
  pending: {
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Pending",
  },
  processing: {
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Processing",
  },
  completed: {
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Completed",
  },
  failed: {
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Failed",
  },
};

const priorityConfig = {
  low: { color: "text-text-muted", label: "Low" },
  medium: { color: "text-yellow-500", label: "Medium" },
  high: { color: "text-orange-500", label: "High" },
  critical: { color: "text-red-500", label: "Critical" },
};

export const StoryListItem = ({ story, onProcess, onClick }: StoryListItemProps) => {
  const statusStyle = statusConfig[story.status];
  const priorityStyle = priorityConfig[story.priority];

  return (
    <div
      className={`group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-surface/30 hover:bg-surface/60 transition-all duration-200 hover:border-white/10 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={() => onClick?.(story)}
    >
      {/* Status Indicator Bar */}
      <div className={`w-1 h-8 rounded-full ${story.status === 'completed' ? 'bg-green-500' : story.status === 'processing' ? 'bg-blue-500' : story.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'} opacity-50 group-hover:opacity-100 transition-opacity`} />

      {/* Main Content */}
      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        {/* Title & Description */}
        <div className="col-span-6 min-w-0">
          <h3 className="font-medium text-sm text-text-primary truncate group-hover:text-accent-primary transition-colors">
            {story.title}
          </h3>
          <p className="text-xs text-text-muted truncate opacity-70">
            {story.description}
          </p>
        </div>

        {/* Status Badge */}
        <div className="col-span-2">
          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.color} border ${statusStyle.border}`}>
            {statusStyle.label}
          </span>
        </div>

        {/* Priority */}
        <div className="col-span-2">
           <span className={`text-xs font-medium ${priorityStyle.color}`}>
             {priorityStyle.label}
           </span>
        </div>

        {/* Date */}
        <div className="col-span-2 flex items-center gap-1.5 text-xs text-text-muted/60">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(story.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onProcess && story.status === "pending" && (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onProcess(story);
            }}
            className="flex items-center gap-1.5 h-7 px-3 text-[10px]"
          >
            <Play className="w-3 h-3" />
            <span>Process</span>
          </Button>
        )}
        <button className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
            <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
