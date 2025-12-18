import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface GitHubFile {
  path: string;
  content: string;
  encoding?: "utf-8" | "base64";
}

interface CreateRepoParams {
  name: string;
  description?: string;
  private?: boolean;
}

interface CommitParams {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: GitHubFile[];
}

export class GitHubService {
  private async getToken(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { githubToken: true },
    });
    return user?.githubToken || null;
  }

  private async githubRequest(
    token: string,
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `https://api.github.com${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "TechFest-Platform",
    };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage =
        errorData && typeof errorData === "object" && "message" in errorData
          ? errorData.message
          : response.statusText;
      throw new Error(`GitHub API error: ${errorMessage}`);
    }

    return response.json();
  }

  async listRepositories(userId: string): Promise<any[]> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    const repos = await this.githubRequest(token, "GET", "/user/repos?per_page=100&sort=updated");
    return repos;
  }

  async getRepository(userId: string, owner: string, repo: string): Promise<any> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    return this.githubRequest(token, "GET", `/repos/${owner}/${repo}`);
  }

  async createRepository(userId: string, params: CreateRepoParams): Promise<any> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    return this.githubRequest(token, "POST", "/user/repos", {
      name: params.name,
      description: params.description || "",
      private: params.private || false,
      auto_init: true,
    });
  }

  async getBranches(userId: string, owner: string, repo: string): Promise<any[]> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    return this.githubRequest(token, "GET", `/repos/${owner}/${repo}/branches`);
  }

  async getFileContent(
    userId: string,
    owner: string,
    repo: string,
    path: string,
    branch: string = "main"
  ): Promise<any> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    return this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );
  }

  async commitFiles(userId: string, params: CommitParams): Promise<any> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    const { owner, repo, branch, message, files } = params;

    // Get the current tree SHA for the branch
    const ref = await this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/git/ref/heads/${branch}`
    );
    const baseTreeSha = ref.object.sha;

    // Get the commit SHA
    const commit = await this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/git/commits/${baseTreeSha}`
    );
    const baseCommitSha = commit.sha;

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const content = file.encoding === "base64" ? file.content : btoa(file.content);
        const blob = await this.githubRequest(token, "POST", `/repos/${owner}/${repo}/git/blobs`, {
          content,
          encoding: "base64",
        });
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      })
    );

    // Create a new tree
    const tree = await this.githubRequest(token, "POST", `/repos/${owner}/${repo}/git/trees`, {
      base_tree: baseTreeSha,
      tree: blobs,
    });

    // Create a new commit
    const newCommit = await this.githubRequest(
      token,
      "POST",
      `/repos/${owner}/${repo}/git/commits`,
      {
        message,
        tree: tree.sha,
        parents: [baseCommitSha],
      }
    );

    // Update the branch reference
    await this.githubRequest(token, "PATCH", `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      sha: newCommit.sha,
    });

    return newCommit;
  }

  async getCommits(
    userId: string,
    owner: string,
    repo: string,
    branch: string = "main",
    perPage: number = 30
  ): Promise<any[]> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    return this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}`
    );
  }

  async getRepoTree(
    userId: string,
    owner: string,
    repo: string,
    branch: string = "main",
    recursive: boolean = false
  ): Promise<any> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    // Get the branch SHA
    const ref = await this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/git/ref/heads/${branch}`
    );
    const treeSha = ref.object.sha;

    // Get the commit to get the tree SHA
    const commit = await this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/git/commits/${treeSha}`
    );
    const commitTreeSha = commit.tree.sha;

    // Get the tree recursively if requested
    const recursiveParam = recursive ? "?recursive=1" : "";
    const tree = await this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/git/trees/${commitTreeSha}${recursiveParam}`
    );

    // Transform the tree to match our frontend format
    // GitHub API returns items with 'path' field when recursive=1
    const transformedTree = tree.tree.map((item: any) => {
      const pathParts = item.path.split("/");
      return {
        name: pathParts[pathParts.length - 1] || item.path,
        path: item.path,
        type: item.type === "tree" ? "dir" : "file",
        size: item.size,
        sha: item.sha,
      };
    });

    return {
      tree: transformedTree,
      truncated: tree.truncated || false,
    };
  }
}

export const githubService = new GitHubService();
