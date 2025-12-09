import { X, Filter, Search } from "lucide-react";
import { Button } from "../common/Button";
import { Select } from "../common/Select";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusCounts: Record<string, number>;
  variant?: "overlay" | "inline";
}

// All pipeline statuses
const statusOptions = [
  { value: "all", label: "All Stories" },
  { value: "pending", label: "Pending" },
  { value: "dividing", label: "Dividing" },
  { value: "reviewing", label: "Reviewing" },
  { value: "tasks_ready", label: "Tasks Ready" },
  { value: "generating", label: "Generating" },
  { value: "code_review", label: "Code Review" },
  { value: "testing", label: "Testing" },
  { value: "deploying", label: "Deploying" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export const FilterSidebar = ({
  isOpen,
  onClose,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  searchQuery,
  setSearchQuery,
  statusCounts,
  variant = "overlay",
}: FilterSidebarProps) => {
  if (variant === "inline") {
    if (!isOpen) return null;
    return (
      <div className="w-80 border-l border-white/5 bg-surface/50 h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-primary">
            <Filter className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Reuse Content Logic (move to reusable var or function?) - Duplicating for simplicity in tool call */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Search */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Search
            </label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
              <input
                type="text"
                placeholder="Search stories by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-all hover:bg-white/10"
              />
            </div>
          </div>

          {/* Content same as below */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Status
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {statusOptions
                .filter((opt) => (statusCounts[opt.value] || 0) > 0 || opt.value === "all")
                .map((option) => {
                  const count = statusCounts[option.value] || 0;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        statusFilter === option.value
                          ? "bg-accent-primary/10 border-accent-primary/50 text-text-primary"
                          : "bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
                      }`}
                    >
                      <span className="text-xs">{option.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          statusFilter === option.value
                            ? "bg-accent-primary/20 text-accent-primary"
                            : "bg-black/20"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Priority
            </label>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: "all", label: "Any Priority" },
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ]}
              className="bg-white/5 border-white/10 text-sm"
            />
          </div>
        </div>
        <div className="p-4 border-t border-white/5 bg-surface/30">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center"
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-surface border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-primary">
              <Filter className="w-5 h-5" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Search */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Search
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search stories by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-all hover:bg-white/10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Status
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {statusOptions
                  .filter((opt) => (statusCounts[opt.value] || 0) > 0 || opt.value === "all")
                  .map((option) => {
                    const count = statusCounts[option.value] || 0;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          statusFilter === option.value
                            ? "bg-accent-primary/10 border-accent-primary/50 text-text-primary"
                            : "bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
                        }`}
                      >
                        <span className="text-sm">{option.label}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            statusFilter === option.value
                              ? "bg-accent-primary/20 text-accent-primary"
                              : "bg-black/20"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Priority
              </label>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: "all", label: "Any Priority" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-surface/50">
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
