import axios from "axios";
import type {
  Repository,
  Branch,
  Commit,
  CreateRepoParams,
  CommitParams,
  RepoTreeResponse,
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
