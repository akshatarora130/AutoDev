import { useState, useEffect } from "react";
import { Github, FolderPlus, Search } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Textarea } from "../common/Textarea";
import { Modal } from "../common/Modal";
import { Loader } from "../common/Loader";
import { githubApi } from "../../utils/api";
import type { CreateProjectParams, ImportProjectParams, Repository } from "../../types";

interface CreateRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: CreateProjectParams) => void;
  onImportProject: (data: ImportProjectParams) => void;
  isImporting?: boolean;
}

export const CreateRepoModal = ({
  isOpen,
  onClose,
  onCreateProject,
  onImportProject,
  isImporting = false,
}: CreateRepoModalProps) => {
  const [mode, setMode] = useState<"create" | "import">("create");
  const [createForm, setCreateForm] = useState<CreateProjectParams>({
    name: "",
    description: "",
    source: "empty",
  });
  const [importForm, setImportForm] = useState<ImportProjectParams>({
    owner: "",
    repo: "",
    name: "",
    description: "",
  });
  const [githubRepos, setGithubRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  // Fetch GitHub repos when switching to import mode
  useEffect(() => {
    if (mode === "import" && isOpen && githubRepos.length === 0) {
      loadGithubRepos();
    }
  }, [mode, isOpen]);

  const loadGithubRepos = async () => {
    try {
      setLoadingRepos(true);
      const repos = await githubApi.listRepos();
      setGithubRepos(repos);
    } catch (error) {
      console.error("Failed to load GitHub repositories:", error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    const [owner] = repo.full_name.split("/");
    setImportForm({
      owner,
      repo: repo.name,
      name: repo.name,
      description: repo.description || "",
    });
  };

  const handleCreateSubmit = () => {
    if (!createForm.name) {
      alert("Project name is required");
      return;
    }
    onCreateProject(createForm);
    setCreateForm({ name: "", description: "", source: "empty" });
  };

  const handleImportSubmit = () => {
    if (!selectedRepo) {
      alert("Please select a repository to import");
      return;
    }
    onImportProject(importForm);
    // Reset state
    setImportForm({ owner: "", repo: "", name: "", description: "" });
    setSelectedRepo(null);
    setRepoSearchQuery("");
  };

  const handleModeChange = (newMode: "create" | "import") => {
    setMode(newMode);
    if (newMode === "create") {
      setSelectedRepo(null);
      setRepoSearchQuery("");
    }
  };

  const filteredRepos = githubRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Project">
      <div className="space-y-4">
        {/* Mode Selection */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => handleModeChange("create")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "create"
                ? "bg-accent-primary text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("import")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "import"
                ? "bg-accent-primary text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Import from GitHub</span>
          </button>
        </div>

        {mode === "create" ? (
          <>
            <Input
              label="Project Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. my-awesome-project"
              required
            />
            <Textarea
              label="Description"
              value={createForm.description || ""}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Brief description of your project..."
              rows={3}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={!createForm.name}>
                Create Project
              </Button>
            </div>
          </>
        ) : (
          <>
            {loadingRepos ? (
              <div className="py-8 flex items-center justify-center">
                <Loader text="Loading your repositories..." />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Input
                    icon={<Search className="w-3.5 h-3.5" />}
                    placeholder="Search repositories..."
                    value={repoSearchQuery}
                    onChange={(e) => setRepoSearchQuery(e.target.value)}
                    className="bg-background border-white/10"
                  />
                  <div className="max-h-64 overflow-y-auto border border-white/10 rounded-lg bg-background/50">
                    {filteredRepos.length === 0 ? (
                      <div className="p-4 text-center text-sm text-text-muted">
                        {repoSearchQuery ? "No repositories found" : "No repositories available"}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {filteredRepos.map((repo) => (
                          <button
                            key={repo.id}
                            type="button"
                            onClick={() => handleRepoSelect(repo)}
                            className={`w-full p-3 text-left hover:bg-white/5 transition-colors ${
                              selectedRepo?.id === repo.id
                                ? "bg-accent-primary/20 border-l-2 border-accent-primary"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Github className="w-4 h-4 text-text-muted shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-text-primary truncate">
                                  {repo.full_name}
                                </div>
                                {repo.description && (
                                  <div className="text-xs text-text-muted truncate mt-0.5">
                                    {repo.description}
                                  </div>
                                )}
                              </div>
                              {selectedRepo?.id === repo.id && (
                                <div className="w-2 h-2 rounded-full bg-accent-primary shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedRepo && (
                  <>
                    <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-lg">
                      <p className="text-xs font-medium text-accent-primary mb-1">
                        Selected: {selectedRepo.full_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        This will import the complete repository and store it in our database. All
                        files will be available for editing and agent processing.
                      </p>
                    </div>
                    <Input
                      label="Project Name (optional)"
                      value={importForm.name || ""}
                      onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                      placeholder="Leave empty to use repository name"
                    />
                    <Textarea
                      label="Description (optional)"
                      value={importForm.description || ""}
                      onChange={(e) =>
                        setImportForm({ ...importForm, description: e.target.value })
                      }
                      placeholder="Brief description..."
                      rows={3}
                    />
                  </>
                )}
                {isImporting ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader text="Importing repository... This may take a moment." />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="secondary" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button onClick={handleImportSubmit} disabled={!selectedRepo}>
                        Import Project
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
