/**
 * Story Activity Sidebar
 * Real-time log viewer for story pipeline execution
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Code2,
  FlaskConical,
  FileText,
} from "lucide-react";
import type { Story, AgentLog } from "../../types";

interface StoryActivitySidebarProps {
  story: Story | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Agent type icons and colors
const agentConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  ORCHESTRATOR: { icon: Activity, color: "text-purple-400", label: "Orchestrator" },
  TASK_DIVIDER: { icon: Sparkles, color: "text-violet-400", label: "Task Divider" },
  TASK_REVIEWER: { icon: CheckCircle, color: "text-blue-400", label: "Task Reviewer" },
  CODE_GENERATOR: { icon: Code2, color: "text-amber-400", label: "Code Generator" },
  CODE_REVIEWER: { icon: FileText, color: "text-orange-400", label: "Code Reviewer" },
  TEST_GENERATOR: { icon: FlaskConical, color: "text-pink-400", label: "Test Generator" },
  TEST_EXECUTOR: { icon: FlaskConical, color: "text-emerald-400", label: "Test Executor" },
  DOCUMENTATION: { icon: FileText, color: "text-cyan-400", label: "Documentation" },
  STORY_QUEUE: { icon: Clock, color: "text-slate-400", label: "Story Queue" },
  EVENT_BUS: { icon: Activity, color: "text-indigo-400", label: "Event Bus" },
};

// Status badge colors
const statusColors: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  dividing: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  reviewing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tasks_ready: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  generating: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  code_review: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  testing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  deploying: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

// Format relative time
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return time.toLocaleDateString();
};

export const StoryActivitySidebar = ({
  story,
  projectId,
  isOpen,
  onClose,
}: StoryActivitySidebarProps) => {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch logs for the story
  const fetchLogs = async () => {
    if (!story || !projectId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/projects/${projectId}/stories/${story.id}/logs`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (!isOpen || !story) return;

    setLoading(true);
    fetchLogs().finally(() => setLoading(false));

    // Poll every 2 seconds while processing
    const isProcessing = !["completed", "failed", "pending", "tasks_ready"].includes(story.status);
    if (isProcessing) {
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, story?.id, story?.status]);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  // Toggle log details expansion
  const toggleLog = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  // Group logs by agent type
  const groupedLogs = logs.reduce(
    (acc, log) => {
      const agent = log.agentType;
      if (!acc[agent]) acc[agent] = [];
      acc[agent].push(log);
      return acc;
    },
    {} as Record<string, AgentLog[]>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-96 bg-surface border-l border-white/10 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-primary" />
              <h3 className="font-semibold text-text-primary">Pipeline Activity</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {story && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text-primary truncate">{story.title}</h4>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[story.status] || statusColors.pending}`}
                >
                  {story.status.replace("_", " ")}
                </span>
                {story.tasks && (
                  <span className="text-xs text-text-muted">{story.tasks.length} tasks</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progress indicator for active phases */}
        {story && !["completed", "failed", "pending"].includes(story.status) && (
          <div className="px-4 py-2 border-b border-white/5 bg-accent-primary/5">
            <div className="flex items-center gap-2 text-xs text-accent-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing...</span>
            </div>
          </div>
        )}

        {/* Logs Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-text-muted">
              <Activity className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              <AnimatePresence>
                {logs.map((log) => (
                  <LogEntry
                    key={log.id}
                    log={log}
                    isExpanded={expandedLogs.has(log.id)}
                    onToggle={() => toggleLog(log.id)}
                  />
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Footer with stats */}
        {logs.length > 0 && (
          <div className="p-3 border-t border-white/5 bg-surface/50">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{logs.length} events</span>
              <span>{Object.keys(groupedLogs).length} agents</span>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

// Individual log entry component
interface LogEntryProps {
  log: AgentLog;
  isExpanded: boolean;
  onToggle: () => void;
}

const LogEntry = ({ log, isExpanded, onToggle }: LogEntryProps) => {
  const config = agentConfig[log.agentType] || {
    icon: Activity,
    color: "text-text-muted",
    label: log.agentType,
  };
  const Icon = config.icon;

  const isError =
    log.event.toLowerCase().includes("error") || log.event.toLowerCase().includes("failed");
  const isSuccess =
    log.event.toLowerCase().includes("completed") || log.event.toLowerCase().includes("approved");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`rounded-lg border transition-colors ${
        isError
          ? "bg-red-500/5 border-red-500/20"
          : isSuccess
            ? "bg-green-500/5 border-green-500/20"
            : "bg-white/5 border-white/5 hover:border-white/10"
      }`}
    >
      <button onClick={onToggle} className="w-full p-2.5 flex items-start gap-2.5 text-left">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-primary truncate">
              {log.event.replace(/_/g, " ")}
            </span>
            {isError && <AlertCircle className="w-3 h-3 text-red-400" />}
            {isSuccess && <CheckCircle className="w-3 h-3 text-green-400" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-text-muted">{config.label}</span>
            <span className="text-[10px] text-text-muted/50">•</span>
            <span className="text-[10px] text-text-muted">{formatRelativeTime(log.timestamp)}</span>
          </div>
        </div>
        {log.data && (
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
            )}
          </div>
        )}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && log.data && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="px-3 pb-2.5 text-[10px] text-text-muted overflow-x-auto custom-scrollbar">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StoryActivitySidebar;
