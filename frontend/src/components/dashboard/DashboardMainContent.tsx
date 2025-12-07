import { GitBranch } from "lucide-react";
import { RepositoryLogs } from "./RepositoryLogs";
import type { Repository } from "../../types";

interface DashboardMainContentProps {
  selectedRepository: Repository | null;
}

export const DashboardMainContent = ({ selectedRepository }: DashboardMainContentProps) => {
  if (selectedRepository) {
    return (
      <main className="flex-1 bg-background overflow-hidden">
        <RepositoryLogs repo={selectedRepository} />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background relative flex items-center justify-center p-8">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="text-center max-w-md mx-auto relative z-10 opacity-50 hover:opacity-100 transition-opacity duration-500">
        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <GitBranch className="w-10 h-10 text-white/20 group-hover:text-accent-primary transition-colors" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Select a Repository</h3>
        <p className="text-sm text-text-muted">
          Choose a repository from the sidebar to view details, <br /> manage agents, or deploy
          workflows.
        </p>
      </div>
    </main>
  );
};
