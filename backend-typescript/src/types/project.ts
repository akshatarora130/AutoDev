export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  source: "github" | "empty";
  githubUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: string;
  projectId: string;
  path: string;
  content: string;
  encoding: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "processing" | "completed" | "failed";
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  storyId: string;
  title: string;
  description: string;
  type: string;
  priority: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  dependencies?: string[] | null;
  agentAssignments?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  source: "github" | "empty";
  githubUrl?: string;
}

export interface ImportProjectParams {
  owner: string;
  repo: string;
  name?: string;
  description?: string;
}

export interface CreateStoryParams {
  title: string;
  description: string;
  priority?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
}
