import { useState } from "react";
import { Plus, Filter, Menu, FileCode, ExternalLink } from "lucide-react";
import { Button } from "../common/Button";
import { PipelineKanbanBoard } from "./PipelineKanbanBoard";
import { CreateStoryModal } from "./CreateStoryModal";
import { FilterSidebar } from "./FilterSidebar";
import type { Story, CreateStoryParams } from "../../types";

interface StoryListProps {
  stories: Story[];
  onStoryClick?: (story: Story) => void;
  onCreateStory: (data: CreateStoryParams) => Promise<void>;
  onStatusChange?: (storyId: string, newStatus: Story["status"]) => Promise<void>;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  projectId?: string;
}

export const StoryList = ({
  stories,
  onStoryClick,
  onCreateStory,
  onStatusChange,
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  projectId,
}: StoryListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStoryForm, setCreateStoryForm] = useState<CreateStoryParams>({
    title: "",
    description: "",
    priority: "medium",
  });

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || story.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || story.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Count all pipeline statuses
  const statusCounts = {
    all: stories.length,
    pending: stories.filter((s) => s.status === "pending").length,
    dividing: stories.filter((s) => s.status === "dividing").length,
    reviewing: stories.filter((s) => s.status === "reviewing").length,
    tasks_ready: stories.filter((s) => s.status === "tasks_ready").length,
    generating: stories.filter((s) => s.status === "generating").length,
    code_review: stories.filter((s) => s.status === "code_review").length,
    testing: stories.filter((s) => s.status === "testing").length,
    deploying: stories.filter((s) => s.status === "deploying").length,
    completed: stories.filter((s) => s.status === "completed").length,
    failed: stories.filter((s) => s.status === "failed").length,
  };

  return (
    <div className="h-full flex flex-row bg-background relative overflow-hidden w-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 w-full">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-surface/50 backdrop-blur-sm z-10 shrink-0">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onToggleSidebar}
                  className="p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                    {projectName ? `${projectName} Stories` : "Stories"}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    Manage and track your project tasks
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Integrations - Coming Soon */}
                <div className="flex gap-2 mr-4 border-r border-white/10 pr-6">
                  <div className="relative flex items-center gap-2 px-3 py-1.5 pr-8 rounded-lg border border-yellow-500/30 bg-yellow-500/10 opacity-80 hover:opacity-100 transition-opacity cursor-not-allowed group">
                    <div className="w-4 h-4 rounded bg-[#0052CC] flex items-center justify-center shrink-0">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11.571 12.016l-5.8 5.815c-.275.275-.275.72 0 .996l3.666 3.666c.275.275.72.275.996 0l5.8-5.815-4.662-4.662zM21.436.564l-3.666-3.666a.706.706 0 00-.996 0l-5.8 5.815 4.662 4.662 5.8-5.815a.706.706 0 000-.996zM11.571 5.354l-3.666-3.666a.706.706 0 00-.996 0L1.109 7.503a.706.706 0 000 .996l5.8 5.815 4.662-4.662v-.302l-.004-.004.004-.298V5.354z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-text-secondary">Jira</span>
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-yellow-500/90 text-yellow-100 text-[8px] font-bold rounded-full border border-yellow-400/50 leading-tight whitespace-nowrap">
                      SOON
                    </span>
                  </div>
                  <div className="relative flex items-center gap-2 px-3 py-1.5 pr-8 rounded-lg border border-yellow-500/30 bg-yellow-500/10 opacity-80 hover:opacity-100 transition-opacity cursor-not-allowed group">
                    <div className="w-4 h-4 rounded bg-[#0078D7] flex items-center justify-center shrink-0">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path d="M3.45 6.09l5.02 1.48L3.45 20.91 9.42 22 22 19V6.09l-5.02-1.48-1.04 4.57-4.47-1.32.96-4.24-4.47-1.32L3.45 6.09z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-text-secondary">ADO</span>
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-yellow-500/90 text-yellow-100 text-[8px] font-bold rounded-full border border-yellow-400/50 leading-tight whitespace-nowrap">
                      SOON
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 transition-all ${showFilters ? "bg-white/10 text-text-primary" : ""}`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>

                {projectId && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const url = `/files?projectId=${projectId}&projectName=${encodeURIComponent(projectName || "Project")}`;
                      window.open(url, "_blank");
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>View Files</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Story</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Kanban Board */}
        <PipelineKanbanBoard
          stories={filteredStories}
          onStoryClick={onStoryClick}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusCounts={statusCounts}
        variant="overlay"
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        formData={createStoryForm}
        onFormChange={setCreateStoryForm}
        onSubmit={async () => {
          await onCreateStory(createStoryForm);
          setIsCreateModalOpen(false);
          setCreateStoryForm({ title: "", description: "", priority: "medium" });
        }}
      />
    </div>
  );
};
