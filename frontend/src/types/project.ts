export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  source: "github" | "empty";
  githubUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: string;
  projectId: string;
  path: string;
  content: string;
  encoding: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "processing" | "completed" | "failed";
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CodeArtifact {
  id: string;
  taskId: string;
  fileId: string | null;
  agentType: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  id: string;
  taskId: string;
  testType: "unit" | "integration" | "e2e";
  status: "passed" | "failed" | "error";
  coverage: number | null;
  results?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  projectId: string;
  taskId: string | null;
  agentType: string;
  event: string;
  data?: Record<string, unknown> | null;
  timestamp: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: "pending" | "deploying" | "success" | "failed";
  previewUrl: string | null;
  logs: string | null;
  createdAt: string;
  updatedAt: string;
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
