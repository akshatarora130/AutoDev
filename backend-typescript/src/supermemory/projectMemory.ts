/**
 * Project Memory Service
 * Manages per-project memory using Supermemory
 * Each project gets isolated memory via containerTag
 */

import { PrismaClient } from "@prisma/client";
import { getSupermemoryClient, isSupermemoryConfigured } from "./client.js";
import type { ContextResult, RelevantFile } from "../types/agent.js";
import path from "path";

const prisma = new PrismaClient();

/**
 * Detect programming language from file extension
 */
function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".md": "markdown",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".prisma": "prisma",
  };
  return langMap[ext] || "text";
}

/**
 * Project Memory class
 * Manages memory operations for a specific project
 */
export class ProjectMemory {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Index a single file into project memory
   */
  async indexFile(file: { path: string; content: string }): Promise<void> {
    if (!isSupermemoryConfigured()) {
      console.warn("⚠️ Supermemory not configured, skipping file indexing");
      return;
    }

    const client = getSupermemoryClient();
    const language = detectLanguage(file.path);

    try {
      await client.memories.add({
        content: file.content,
        containerTag: this.projectId,
        metadata: {
          type: "file",
          path: file.path,
          extension: path.extname(file.path),
          language,
        },
        customId: `${this.projectId}:${file.path}`,
      });
    } catch (error) {
      console.error(`Failed to index file ${file.path}:`, error);
      throw error;
    }
  }

  /**
   * Index all project files (called on project import)
   */
  async indexAllFiles(files: Array<{ path: string; content: string }>): Promise<void> {
    if (!isSupermemoryConfigured()) {
      console.warn("⚠️ Supermemory not configured, skipping file indexing");
      return;
    }

    console.log(`📚 Indexing ${files.length} files for project ${this.projectId}`);

    let indexed = 0;
    let failed = 0;

    for (const file of files) {
      try {
        await this.indexFile(file);
        indexed++;
      } catch {
        failed++;
      }
    }

    // Log indexing completion
    await prisma.agentLog.create({
      data: {
        projectId: this.projectId,
        agentType: "SUPERMEMORY",
        event: "FILES_INDEXED",
        data: {
          total: files.length,
          indexed,
          failed,
        },
        timestamp: new Date(),
      },
    });

    console.log(`✅ Indexed ${indexed}/${files.length} files (${failed} failed)`);
  }

  /**
   * Search for relevant context before agent execution
   */
  async getContext(query: string, limit = 5): Promise<ContextResult> {
    if (!isSupermemoryConfigured()) {
      console.warn("⚠️ Supermemory not configured, returning empty context");
      return { relevantFiles: [], summary: "" };
    }

    const client = getSupermemoryClient();

    try {
      const results = await client.search.documents({
        q: query,
        containerTags: [this.projectId],
        limit,
        rerank: true,
        includeSummary: true,
      });

      const relevantFiles: RelevantFile[] = results.results.map((result) => ({
        path: (result.metadata?.path as string) || "unknown",
        content: result.chunks?.map((c) => c.content).join("\n") || "",
        score: result.score || 0,
      }));

      return {
        relevantFiles,
        summary: relevantFiles.map((f) => f.path).join(", "),
      };
    } catch (error) {
      console.error("Failed to get context:", error);
      return { relevantFiles: [], summary: "" };
    }
  }

  /**
   * Add learned pattern after code is approved (learning loop)
   */
  async learnPattern(pattern: {
    type: "code_pattern" | "convention" | "dependency";
    description: string;
    example?: string;
  }): Promise<void> {
    if (!isSupermemoryConfigured()) {
      console.warn("⚠️ Supermemory not configured, skipping pattern learning");
      return;
    }

    const client = getSupermemoryClient();

    try {
      const content = pattern.example
        ? `${pattern.type}: ${pattern.description}\n\nExample:\n${pattern.example}`
        : `${pattern.type}: ${pattern.description}`;

      await client.memories.add({
        content,
        containerTag: this.projectId,
        metadata: {
          type: "learned_pattern",
          patternType: pattern.type,
        },
      });

      console.log(`🧠 Learned pattern: ${pattern.type}`);
    } catch (error) {
      console.error("Failed to learn pattern:", error);
    }
  }

  /**
   * Get project summary/profile
   */
  async getProjectProfile(): Promise<string> {
    if (!isSupermemoryConfigured()) {
      return "Project context not available (Supermemory not configured)";
    }

    const context = await this.getContext(
      "project structure, main features, technology stack, architecture patterns",
      10
    );

    if (context.relevantFiles.length === 0) {
      return "No project context available yet";
    }

    return context.relevantFiles.map((f) => `File: ${f.path}\n${f.content}`).join("\n\n---\n\n");
  }
}

export default ProjectMemory;
