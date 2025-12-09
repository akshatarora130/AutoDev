import { PrismaClient } from "@prisma/client";
import { fileService } from "./fileService.js";

const prisma = new PrismaClient();

interface GitHubFile {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
  size: number;
}

export class GitHubImportService {
  private async getToken(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { githubToken: true },
    });
    return user?.githubToken || null;
  }

  private async githubRequest(token: string, method: string, endpoint: string): Promise<any> {
    const url = `https://api.github.com${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "TechFest-Platform",
      },
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API error: ${errorData?.message || response.statusText}`);
    }

    return response.json();
  }

  private async getRepoTreeRecursive(
    token: string,
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<any[]> {
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

    // Get the tree recursively
    const tree = await this.githubRequest(
      token,
      "GET",
      `/repos/${owner}/${repo}/git/trees/${commitTreeSha}?recursive=1`
    );

    return tree.tree || [];
  }

  private async fetchFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    branch: string = "main"
  ): Promise<GitHubFile | null> {
    try {
      const fileData = await this.githubRequest(
        token,
        "GET",
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );

      if (fileData.type !== "file") {
        return null;
      }

      let content = "";
      if (fileData.encoding === "base64") {
        try {
          content = Buffer.from(fileData.content, "base64").toString("utf-8");
        } catch (e) {
          // Skip binary files
          return null;
        }
      } else {
        content = fileData.content || "";
      }

      return {
        path: fileData.path,
        content,
        encoding: "utf-8",
        size: fileData.size || content.length,
      };
    } catch (error: any) {
      // Skip files that can't be fetched (might be too large or binary)
      console.warn(`Failed to fetch file ${path}:`, error.message);
      return null;
    }
  }

  async importRepository(
    userId: string,
    owner: string,
    repo: string,
    projectName?: string,
    description?: string
  ): Promise<any> {
    const token = await this.getToken(userId);
    if (!token) {
      throw new Error("GitHub token not found. Please re-authenticate.");
    }

    // Get repository info
    const repoInfo = await this.githubRequest(token, "GET", `/repos/${owner}/${repo}`);

    // Create project
    const project = await prisma.project.create({
      data: {
        userId,
        name: projectName || repoInfo.name,
        description: description || repoInfo.description || null,
        source: "github",
        githubUrl: repoInfo.html_url,
      },
    });

    // Get all files recursively
    const treeItems = await this.getRepoTreeRecursive(token, owner, repo, repoInfo.default_branch);

    // Filter only files (not directories)
    const fileItems = treeItems.filter((item: any) => item.type === "blob");

    // Fetch and store files in batches
    const batchSize = 10;
    for (let i = 0; i < fileItems.length; i += batchSize) {
      const batch = fileItems.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (item: any) => {
          const fileData = await this.fetchFileContent(
            token,
            owner,
            repo,
            item.path,
            repoInfo.default_branch
          );

          if (fileData) {
            await fileService.createFile(
              project.id,
              fileData.path,
              fileData.content,
              fileData.encoding
            );
          }
        })
      );
    }

    return project;
  }
}

export const githubImportService = new GitHubImportService();
