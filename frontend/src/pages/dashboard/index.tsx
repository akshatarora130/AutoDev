import { useState, useEffect } from "react";
import { Loader } from "../../components/common/Loader";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { DashboardMainContent } from "../../components/dashboard/DashboardMainContent";
import { CreateRepoModal } from "../../components/dashboard/CreateRepoModal";
import { CreateStoryModal } from "../../components/dashboard/CreateStoryModal";
import { StoryList } from "../../components/dashboard/StoryList";
import { projectApi, storyApi } from "../../utils/api";
import { useAuthStore } from "../../stores/authStore";
import type {
  Project,
  Story,
  CreateProjectParams,
  ImportProjectParams,
  CreateStoryParams,
} from "../../types";

export const DashboardPage = () => {
  const { user } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [_loadingStories, setLoadingStories] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [createStoryForm, setCreateStoryForm] = useState<CreateStoryParams>({
    title: "",
    description: "",
    priority: "medium",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadStories(selectedProject.id);

      // Auto-refresh stories every 3 seconds to show pipeline progress
      const interval = setInterval(() => {
        loadStories(selectedProject.id);
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setStories([]);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.list();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async (projectId: string) => {
    try {
      setLoadingStories(true);
      const data = await storyApi.list(projectId);
      setStories(data);
    } catch (error) {
      console.error("Failed to load stories:", error);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleCreateProject = async (data: CreateProjectParams) => {
    try {
      const newProject = await projectApi.create(data);
      setProjects([newProject, ...projects]);
      setIsCreateModalOpen(false);
      setSelectedProject(newProject);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create project");
    }
  };

  const handleImportProject = async (data: ImportProjectParams) => {
    try {
      setIsImporting(true);
      const newProject = await projectApi.import(data);
      setProjects([newProject, ...projects]);
      setIsCreateModalOpen(false);
      setSelectedProject(newProject);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to import project");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateStory = async (data: CreateStoryParams) => {
    if (!selectedProject) return;
    try {
      const newStory = await storyApi.create(selectedProject.id, data);
      setStories([newStory, ...stories]);
      setCreateStoryForm({ title: "", description: "", priority: "medium" });
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create story");
    }
  };

  const handleStatusChange = async (storyId: string, newStatus: Story["status"]) => {
    if (!selectedProject) return;
    try {
      const story = stories.find((s) => s.id === storyId);
      if (!story) return;

      await storyApi.update(selectedProject.id, storyId, { status: newStatus });
      // Reload stories to get updated status
      await loadStories(selectedProject.id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update story status");
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ... existing useEffects ...

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsSidebarOpen(false);
  };

  // ... (rest of functions) ...

  if (loading || !user) {
    return <Loader fullScreen text="Initializing Dashboard..." />;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          repositories={projects}
          onRepoClick={handleProjectClick}
          onCreateClick={() => setIsCreateModalOpen(true)}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        {selectedProject ? (
          <StoryList
            stories={stories}
            onCreateStory={async (data: CreateStoryParams) => {
              await handleCreateStory(data);
            }}
            onStatusChange={handleStatusChange}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            projectName={selectedProject.name}
          />
        ) : (
          <DashboardMainContent />
        )}
      </div>
      <CreateRepoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
        onImportProject={handleImportProject}
        isImporting={isImporting}
      />
      <CreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        formData={createStoryForm}
        onFormChange={setCreateStoryForm}
        onSubmit={() => handleCreateStory(createStoryForm)}
      />
    </div>
  );
};
