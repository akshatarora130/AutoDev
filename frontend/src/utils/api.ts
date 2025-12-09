import axios from "axios";
import type {
  Repository,
  Branch,
  Commit,
  CreateRepoParams,
  CommitParams,
  RepoTreeResponse,
  Project,
  File,
  Story,
  CreateProjectParams,
  ImportProjectParams,
  CreateStoryParams,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const authApi = {
  getMe: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },
};

export const githubApi = {
  listRepos: async (): Promise<Repository[]> => {
    const response = await api.get("/api/github/repos");
    return response.data;
  },
  getRepo: async (owner: string, repo: string): Promise<Repository> => {
    const response = await api.get(`/api/github/repos/${owner}/${repo}`);
    return response.data;
  },
  createRepo: async (params: CreateRepoParams): Promise<Repository> => {
    const response = await api.post("/api/github/repos", params);
    return response.data;
  },
  getBranches: async (owner: string, repo: string): Promise<Branch[]> => {
    const response = await api.get(`/api/github/repos/${owner}/${repo}/branches`);
    return response.data;
  },
  getCommits: async (
    owner: string,
    repo: string,
    branch?: string,
    perPage?: number
  ): Promise<Commit[]> => {
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    if (perPage) params.append("per_page", perPage.toString());
    const response = await api.get(
      `/api/github/repos/${owner}/${repo}/commits?${params.toString()}`
    );
    return response.data;
  },
  getFileContent: async (
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    const response = await api.get(
      `/api/github/repos/${owner}/${repo}/contents/${path}?${params.toString()}`
    );
    return response.data;
  },
  commitFiles: async (params: CommitParams): Promise<any> => {
    const response = await api.post(
      `/api/github/repos/${params.owner}/${params.repo}/commit`,
      params
    );
    return response.data;
  },
  getRepoTree: async (
    owner: string,
    repo: string,
    branch?: string,
    recursive?: boolean
  ): Promise<RepoTreeResponse> => {
    const params = new URLSearchParams();
    if (branch) params.append("branch", branch);
    if (recursive) params.append("recursive", "1");
    const response = await api.get(`/api/github/repos/${owner}/${repo}/tree?${params.toString()}`);
    return response.data;
  },
};

export const projectApi = {
  create: async (params: CreateProjectParams): Promise<Project> => {
    const response = await api.post("/api/projects", params);
    return response.data;
  },
  import: async (params: ImportProjectParams): Promise<Project> => {
    const response = await api.post("/api/projects/import", params);
    return response.data;
  },
  list: async (): Promise<Project[]> => {
    const response = await api.get("/api/projects");
    return response.data;
  },
  get: async (id: string): Promise<Project> => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },
  getFiles: async (id: string): Promise<File[]> => {
    const response = await api.get(`/api/projects/${id}/files`);
    return response.data;
  },
  getFileTree: async (id: string): Promise<any> => {
    const response = await api.get(`/api/projects/${id}/tree`);
    return response.data;
  },
  getFile: async (id: string, path: string): Promise<File> => {
    const response = await api.get(`/api/projects/${id}/files/${path}`);
    return response.data;
  },
  updateFile: async (id: string, path: string, content: string): Promise<File> => {
    const response = await api.put(`/api/projects/${id}/files/${path}`, { content });
    return response.data;
  },
};

export const storyApi = {
  create: async (projectId: string, params: CreateStoryParams): Promise<Story> => {
    const response = await api.post(`/api/projects/${projectId}/stories`, params);
    return response.data;
  },
  list: async (projectId: string): Promise<Story[]> => {
    const response = await api.get(`/api/projects/${projectId}/stories`);
    return response.data;
  },
  get: async (projectId: string, id: string): Promise<Story> => {
    const response = await api.get(`/api/projects/${projectId}/stories/${id}`);
    return response.data;
  },
  update: async (projectId: string, id: string, data: Partial<Story>): Promise<Story> => {
    const response = await api.put(`/api/projects/${projectId}/stories/${id}`, data);
    return response.data;
  },
  delete: async (projectId: string, id: string): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/stories/${id}`);
  },
  process: async (projectId: string, id: string): Promise<{ message: string; storyId: string }> => {
    const response = await api.post(`/api/projects/${projectId}/stories/${id}/process`);
    return response.data;
  },
};
