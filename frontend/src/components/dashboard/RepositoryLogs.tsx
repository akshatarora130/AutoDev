import { useState, useEffect } from "react";
import { GitBranch, GitCommit, Clock, FileText } from "lucide-react";
import { Loader } from "../common/Loader";
import { githubApi } from "../../utils/api";
import type { Repository, Commit, Branch } from "../../types";

interface RepositoryLogsProps {
  repo: Repository;
}

export const RepositoryLogs = ({ repo }: RepositoryLogsProps) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>(repo.default_branch);
  const [activeTab, setActiveTab] = useState<"commits" | "branches">("commits");

  useEffect(() => {
    loadData();
  }, [repo, selectedBranch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [owner, repoName] = repo.full_name.split("/");

      const [commitsData, branchesData] = await Promise.all([
        githubApi.getCommits(owner, repoName, selectedBranch, 30),
        githubApi.getBranches(owner, repoName),
      ]);

      setCommits(commitsData);
      setBranches(branchesData);
    } catch (error: any) {
      console.error("Failed to load repository data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader text="Loading repository activity..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tabs */}
      <div className="px-4 py-3 border-b border-white/5 bg-surface/50 backdrop-blur-sm flex items-center gap-4 shrink-0">
        <button
          onClick={() => setActiveTab("commits")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "commits"
              ? "bg-accent-primary/10 text-accent-primary"
              : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4" />
            <span>Commits</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("branches")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "branches"
              ? "bg-accent-primary/10 text-accent-primary"
              : "text-text-muted hover:text-text-primary hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <span>Branches</span>
          </div>
        </button>

        {activeTab === "commits" && (
          <div className="ml-auto flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 bg-background border border-white/10 rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "commits" ? (
          <div className="p-4 space-y-3">
            {commits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted">No commits found</p>
              </div>
            ) : (
              commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="p-4 rounded-lg border border-white/5 bg-surface/30 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shrink-0">
                      {commit.author?.avatar_url ? (
                        <img
                          src={commit.author.avatar_url}
                          alt={commit.author.login}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {commit.author?.login?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">
                          {commit.author?.login || commit.commit.author.name}
                        </span>
                        <span className="text-xs text-text-muted">committed</span>
                        <span className="text-xs text-text-muted/60 font-mono">
                          {commit.sha.substring(0, 7)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                        {commit.commit.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(commit.commit.author.date)}</span>
                        </div>
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-primary hover:text-accent-secondary transition-colors"
                        >
                          View on GitHub →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {branches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted">No branches found</p>
              </div>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch.name}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    branch.name === selectedBranch
                      ? "border-accent-primary/50 bg-accent-primary/10"
                      : "border-white/5 bg-surface/30 hover:bg-surface/50"
                  }`}
                  onClick={() => {
                    setSelectedBranch(branch.name);
                    setActiveTab("commits");
                  }}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-accent-secondary" />
                    <span className="text-sm font-medium text-text-primary">{branch.name}</span>
                    {branch.name === selectedBranch && (
                      <span className="text-xs text-accent-primary px-2 py-0.5 rounded bg-accent-primary/10">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1 font-mono">
                    {branch.commit.sha.substring(0, 7)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Repository Info Footer */}
      <div className="px-4 py-3 border-t border-white/5 bg-surface/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{repo.language || "No language detected"}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            <span>{branches.length} branches</span>
          </div>
          <div className="flex items-center gap-1">
            <GitCommit className="w-3 h-3" />
            <span>{commits.length} recent commits</span>
          </div>
        </div>
      </div>
    </div>
  );
};
