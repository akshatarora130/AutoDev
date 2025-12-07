import { useState, useEffect } from "react";
import { Loader } from "../../components/common/Loader";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { DashboardMainContent } from "../../components/dashboard/DashboardMainContent";
import { CreateRepoModal } from "../../components/dashboard/CreateRepoModal";
import { githubApi } from "../../utils/api";
import { useAuthStore } from "../../stores/authStore";
import type { Repository, CreateRepoParams } from "../../types";

export const DashboardPage = () => {
  const { user } = useAuthStore();

  const [projects, setProjects] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRepoParams>({
    name: "",
    description: "",
    private: false,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await githubApi.listRepos();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!createForm.name) {
        alert("Project name is required");
        return;
      }
      const newProject = await githubApi.createRepo(createForm);
      setProjects([newProject, ...projects]);
      setIsCreateModalOpen(false);
      setCreateForm({ name: "", description: "", private: false });
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create project");
    }
  };

  const handleRepoClick = (repo: Repository) => {
    setSelectedRepository(repo);
  };

  if (loading || !user) {
    return <Loader fullScreen text="Initializing Dashboard..." />;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          repositories={projects}
          onRepoClick={handleRepoClick}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
        <DashboardMainContent selectedRepository={selectedRepository} />
      </div>
      <CreateRepoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        formData={createForm}
        onFormChange={setCreateForm}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};
