import { Book, Lock } from "lucide-react";
import { cn } from "../../utils/cn";
import type { Repository } from "../../types";

interface RepoListItemProps {
  repo: Repository;
  onClick?: () => void;
}

export const RepoListItem = ({ repo, onClick }: RepoListItemProps) => {
  return (
    <div
      className="group flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {repo.owner?.avatar_url ? (
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="w-5 h-5 rounded-full shrink-0 border border-white/10"
        />
      ) : (
        <Book
          className={cn(
            "w-4 h-4 shrink-0 transition-colors",
            repo.private
              ? "text-accent-secondary"
              : "text-text-muted group-hover:text-text-secondary"
          )}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary group-hover:text-accent-primary truncate transition-colors">
            {repo.name}
          </span>
        </div>
      </div>

      {repo.private && <Lock className="w-3 h-3 text-text-muted/40" />}
    </div>
  );
};
