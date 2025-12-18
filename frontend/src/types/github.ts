export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  encoding?: "utf-8" | "base64";
}

export interface CreateRepoParams {
  name: string;
  description?: string;
  private?: boolean;
}

export interface CommitParams {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: GitHubFile[];
}

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  sha?: string;
  children?: TreeNode[];
}

export interface RepoTreeResponse {
  tree: TreeNode[];
  truncated: boolean;
}
