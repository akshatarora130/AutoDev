import { Github, Folder } from "lucide-react";
import { cn } from "../../utils/cn";
import type { Project } from "../../types";

interface RepoListItemProps {
  repo: Project;
  onClick?: () => void;
}

export const RepoListItem = ({ repo, onClick }: RepoListItemProps) => {
  const Icon = repo.source === "github" ? Github : Folder;

  return (
    <div
      className="group flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <Icon
          className={cn(
            "w-4 h-4 shrink-0 transition-colors",
          repo.source === "github"
            ? "text-text-muted group-hover:text-accent-primary"
              : "text-text-muted group-hover:text-text-secondary"
          )}
        />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary group-hover:text-accent-primary truncate transition-colors">
            {repo.name}
          </span>
        </div>
        {repo.description && (
          <p className="text-xs text-text-muted truncate mt-0.5">{repo.description}</p>
        )}
      </div>
    </div>
  );
};
