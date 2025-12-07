import { useState } from "react";
import { Plus, Search, ChevronDown } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { RepoListItem } from "./RepoListItem";
import type { Repository } from "../../types";

interface DashboardSidebarProps {
  repositories: Repository[];
  onRepoClick?: (repo: Repository) => void;
  onCreateClick: () => void;
}

export const DashboardSidebar = ({
  repositories,
  onRepoClick,
  onCreateClick,
}: DashboardSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllRepos, setShowAllRepos] = useState(false);

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedRepos = showAllRepos ? filteredRepos : filteredRepos.slice(0, 8);

  return (
    <aside className="w-[280px] bg-surface border-r border-white/5 flex flex-col shrink-0 z-10">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Repositories</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40 h-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium text-xs">Add</span>
          </Button>
        </div>

        <div className="relative">
          <Input
            icon={<Search className="w-3.5 h-3.5" />}
            placeholder="Find a repository..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background border-white/10 text-xs py-1.5 !rounded-md placeholder:text-text-muted/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        <div className="px-2 space-y-0.5">
          {displayedRepos.map((repo) => (
            <RepoListItem key={repo.id} repo={repo} onClick={() => onRepoClick?.(repo)} />
          ))}

          {displayedRepos.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-text-muted mb-2">No repositories found.</p>
              <Button
                variant="link"
                size="sm"
                onClick={onCreateClick}
                className="text-xs !text-accent-primary hover:underline !p-0 h-auto font-normal"
              >
                Create your first repo
              </Button>
            </div>
          )}
        </div>

        {!showAllRepos && filteredRepos.length > 8 && (
          <div className="px-4 pt-2">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowAllRepos(true)}
              className="w-full flex items-center gap-2 text-xs !text-text-muted hover:!text-text-primary !no-underline !py-1 justify-start h-auto"
            >
              <ChevronDown className="w-3 h-3" />
              <span>Show {filteredRepos.length - 8} more</span>
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 text-[10px] text-text-muted/40 font-mono text-center">
        AutoDev v1.0.0
      </div>
    </aside>
  );
};
