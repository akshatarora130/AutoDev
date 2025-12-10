/**
 * Code Generator Agent
 * Generates code for tasks, supports both new files and patches for modifications
 */

import { PrismaClient, type Task } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";
import { buildNewFilePrompt, buildPatchPrompt } from "../llm/prompts/codeGeneration.js";

const prisma = new PrismaClient();

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "modify" | "delete";
  patches?: CodePatch[];
}

export interface CodePatch {
  operation: "replace" | "insert" | "delete";
  search?: string;
  replace?: string;
  after?: string;
  content?: string;
}

export interface CodeGenerationResult {
  files: GeneratedFile[];
  dependencies: string[];
  notes: string;
  artifactId: string;
}

export class CodeGeneratorAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "CODE_GENERATOR");
  }

  /**
   * Generate code for a single task
   */
  async execute(task: Task): Promise<CodeGenerationResult> {
    await this.log("CODE_GENERATION_STARTED", {
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.type,
    });

    // Special handling for deletion and test_cleanup tasks
    if (task.type === "deletion" || task.type === "test_cleanup") {
      return this.handleDeletionTask(task);
    }

    // Get project context from Supermemory
    const projectContext = await this.getProjectContext(
      `Generate ${task.type} code for: ${task.title}. ${task.description}`
    );

    const existingFiles = await this.getExistingFiles();

    // Also check for files that might be created by other tasks in the same story
    const storyTasks = await prisma.task.findMany({
      where: {
        storyId: task.storyId,
        id: { not: task.id }, // Exclude current task
      },
      include: {
        codeArtifacts: {
          where: { status: { in: ["pending", "approved"] } },
        },
      },
    });

    // Extract file paths from other tasks' artifacts
    const otherTaskFiles = new Set<string>();
    for (const otherTask of storyTasks) {
      for (const artifact of otherTask.codeArtifacts) {
        const blocks = artifact.content.split("\n\n---\n\n");
        for (const block of blocks) {
          const pathMatch = block.match(/\/\/ File: (.+)/);
          if (pathMatch) {
            otherTaskFiles.add(pathMatch[1].trim());
          }
        }
      }
    }

    // Combine existing files and other task files
    const allExistingFiles = [...new Set([...existingFiles, ...Array.from(otherTaskFiles)])];

    // Check if we're modifying an existing file
    const targetFile = await this.findTargetFile(task);
    const isModification = !!targetFile;

    // Build appropriate prompt
    const prompt = isModification
      ? buildPatchPrompt({
          taskTitle: task.title,
          taskDescription: task.description,
          taskType: task.type as "frontend" | "backend" | "database" | "integration",
          projectContext,
          existingFiles,
          isModification: true,
          existingFileContent: targetFile?.content,
        })
      : buildNewFilePrompt({
          taskTitle: task.title,
          taskDescription: task.description,
          taskType: task.type as "frontend" | "backend" | "database" | "integration",
          projectContext,
          existingFiles: allExistingFiles,
          isModification: false,
        });

    // Call LLM for code generation
    const response = await this.callLLMJSON<{
      files: GeneratedFile[];
      dependencies?: string[];
      notes?: string;
    }>(prompt);

    if (!response || !response.files) {
      throw new Error("Failed to generate code: Invalid LLM response");
    }

    // Validate that package.json is included for backend/frontend tasks
    if ((task.type === "backend" || task.type === "frontend") && !isModification) {
      const hasPackageJson = response.files.some(
        (f) => f.path === "package.json" || f.path.endsWith("/package.json")
      );
      const taskDescription = task.description.toLowerCase();
      const needsPackageJson =
        taskDescription.includes("express") ||
        taskDescription.includes("node") ||
        taskDescription.includes("typescript") ||
        taskDescription.includes("javascript") ||
        taskDescription.includes("react") ||
        taskDescription.includes("next") ||
        taskDescription.includes("server");

      if (needsPackageJson && !hasPackageJson) {
        await this.log("MISSING_PACKAGE_JSON", {
          taskId: task.id,
          taskType: task.type,
          description: task.description,
        });

        // Add package.json if missing
        const defaultPackageJson = {
          path: "package.json",
          content: JSON.stringify(
            {
              name: "project",
              version: "1.0.0",
              type: "module",
              scripts: {
                dev: "node --watch src/index.js",
                start: "node src/index.js",
                build: "tsc",
                test: "jest",
              },
              dependencies: {},
              devDependencies: {},
            },
            null,
            2
          ),
          action: "create" as const,
        };

        // Check if Express is mentioned to add it as dependency
        if (taskDescription.includes("express")) {
          const pkg = JSON.parse(defaultPackageJson.content);
          pkg.dependencies = { express: "^4.18.2" };
          pkg.devDependencies = {
            "@types/express": "^4.17.21",
            "@types/node": "^20.10.0",
            typescript: "^5.3.3",
          };
          defaultPackageJson.content = JSON.stringify(pkg, null, 2);
        }

        response.files.push(defaultPackageJson);
        await this.log("ADDED_MISSING_PACKAGE_JSON", {
          taskId: task.id,
          packageJsonPath: defaultPackageJson.path,
        });
      }
    }

    // Apply patches if modification mode
    const processedFiles = await this.processFiles(response.files);

    // Deduplicate files by path (keep first occurrence)
    const uniqueFiles = this.deduplicateFiles(processedFiles);

    // Save as CodeArtifact
    const artifact = await this.saveArtifact(task, uniqueFiles, response.dependencies || []);

    await this.log("CODE_GENERATION_COMPLETED", {
      taskId: task.id,
      artifactId: artifact.id,
      fileCount: uniqueFiles.length,
      originalFileCount: processedFiles.length,
      isModification,
    });

    // Publish event
    eventBus.publish("CODE_GENERATED", {
      taskId: task.id,
      projectId: this.projectId,
      artifactId: artifact.id,
      fileCount: uniqueFiles.length,
    });

    return {
      files: uniqueFiles,
      dependencies: response.dependencies || [],
      notes: response.notes || "",
      artifactId: artifact.id,
    };
  }

  /**
   * Get list of existing files in project for context
   */
  private async getExistingFiles(): Promise<string[]> {
    const files = await prisma.file.findMany({
      where: { projectId: this.projectId },
      select: { path: true },
      take: 200, // Increased limit to better detect duplicates
      orderBy: { path: "asc" },
    });

    return files.map((f) => f.path);
  }

  /**
   * Deduplicate files by path (keep first occurrence)
   */
  private deduplicateFiles(files: GeneratedFile[]): GeneratedFile[] {
    const seen = new Set<string>();
    const unique: GeneratedFile[] = [];

    for (const file of files) {
      const normalizedPath = file.path.trim();
      if (!seen.has(normalizedPath)) {
        seen.add(normalizedPath);
        unique.push(file);
      } else {
        console.warn(`⚠️ Duplicate file detected and removed: ${normalizedPath}`);
      }
    }

    return unique;
  }

  /**
   * Find if task targets an existing file
   */
  private async findTargetFile(task: Task): Promise<{ path: string; content: string } | null> {
    // Look for file mentions in task description
    const filePatterns = [
      /modify\s+`?([^`\s]+\.(ts|tsx|js|jsx|py|css|html))`?/i,
      /update\s+`?([^`\s]+\.(ts|tsx|js|jsx|py|css|html))`?/i,
      /in\s+file\s+`?([^`\s]+\.(ts|tsx|js|jsx|py|css|html))`?/i,
      /edit\s+`?([^`\s]+\.(ts|tsx|js|jsx|py|css|html))`?/i,
    ];

    for (const pattern of filePatterns) {
      const match = task.description.match(pattern);
      if (match) {
        const filePath = match[1];
        const file = await prisma.file.findFirst({
          where: {
            projectId: this.projectId,
            path: { contains: filePath },
          },
        });

        if (file) {
          return { path: file.path, content: file.content };
        }
      }
    }

    return null;
  }

  /**
   * Process files - apply patches for modifications
   */
  private async processFiles(files: GeneratedFile[]): Promise<GeneratedFile[]> {
    const processed: GeneratedFile[] = [];

    for (const file of files) {
      // Ensure content is a string (handle JSON objects)
      let content = file.content;
      if (typeof content === "object" && content !== null) {
        content = JSON.stringify(content, null, 2);
      }

      if (file.action === "modify" && file.patches) {
        // Get current file content
        const existingFile = await prisma.file.findFirst({
          where: {
            projectId: this.projectId,
            path: file.path,
          },
        });

        if (existingFile) {
          // Apply patches
          let patchedContent = existingFile.content;
          for (const patch of file.patches) {
            patchedContent = this.applyPatch(patchedContent, patch);
          }

          processed.push({
            path: file.path,
            content: patchedContent,
            action: "modify",
          });
        } else {
          // File doesn't exist, treat as create
          processed.push({
            path: file.path,
            content: content || "",
            action: "create",
          });
        }
      } else {
        processed.push({
          ...file,
          content: content || "",
        });
      }
    }

    return processed;
  }

  /**
   * Apply a single patch to content
   */
  private applyPatch(content: string, patch: CodePatch): string {
    switch (patch.operation) {
      case "replace":
        if (patch.search && patch.replace !== undefined) {
          return content.replace(patch.search, patch.replace);
        }
        break;

      case "insert":
        if (patch.after && patch.content) {
          const index = content.indexOf(patch.after);
          if (index !== -1) {
            const insertPoint = index + patch.after.length;
            return (
              content.slice(0, insertPoint) + "\n" + patch.content + content.slice(insertPoint)
            );
          }
        }
        break;

      case "delete":
        if (patch.search) {
          return content.replace(patch.search, "");
        }
        break;
    }

    return content;
  }

  /**
   * Save generated code as CodeArtifact
   */
  private async saveArtifact(task: Task, files: GeneratedFile[], dependencies: string[]) {
    // Combine all file contents for storage
    // Ensure content is properly serialized (handle objects like package.json)
    const combinedContent = files
      .map((f) => {
        let content = f.content;
        // If content is an object (e.g., JSON that wasn't stringified), stringify it
        if (typeof content === "object" && content !== null) {
          content = JSON.stringify(content, null, 2);
        }
        return `// File: ${f.path}\n// Action: ${f.action}\n${content}`;
      })
      .join("\n\n---\n\n");

    const artifact = await prisma.codeArtifact.create({
      data: {
        taskId: task.id,
        agentType: "CODE_GENERATOR",
        content: combinedContent,
        status: "pending", // Awaiting code review
      },
    });

    // Store structured data in metadata (using notes field or separate table)
    // For now, we'll rely on the content format

    return artifact;
  }

  /**
   * Handle deletion and test_cleanup tasks
   * Parses file paths from task description and generates deletion artifact
   */
  private async handleDeletionTask(task: Task): Promise<CodeGenerationResult> {
    await this.log("DELETION_TASK_STARTED", { taskId: task.id });

    // Get existing project files
    const existingFiles = await prisma.file.findMany({
      where: { projectId: this.projectId },
      select: { path: true },
    });
    const existingPaths = new Set(existingFiles.map((f) => f.path));

    // Extract file paths from task description
    const filesToDelete = this.extractFilePaths(task.description, existingPaths);

    if (filesToDelete.length === 0) {
      // Use LLM to identify files to delete based on description
      const prompt = `You are identifying files to delete from a project.

Task: ${task.title}
Description: ${task.description}

Existing files in project:
${Array.from(existingPaths).join("\n")}

Based on the task description, identify which files should be deleted.

Respond with a JSON object:
\`\`\`json
{
  "files": [
    {"path": "path/to/file.ts", "reason": "Why this file should be deleted"}
  ]
}
\`\`\`

If no files match, return {"files": []}.
Only include files that exist in the project and should be deleted.`;

      const response = await this.callLLMJSON<{
        files: Array<{ path: string; reason: string }>;
      }>(prompt);

      if (response?.files) {
        for (const file of response.files) {
          if (existingPaths.has(file.path)) {
            filesToDelete.push(file.path);
          }
        }
      }
    }

    // Create GeneratedFile entries for deletions
    const files: GeneratedFile[] = filesToDelete.map((path) => ({
      path,
      content: "",
      action: "delete" as const,
    }));

    // Save as artifact
    const artifact = await this.saveArtifact(task, files, []);

    await this.log("DELETION_TASK_COMPLETED", {
      taskId: task.id,
      artifactId: artifact.id,
      filesToDelete: filesToDelete,
    });

    // Publish event
    eventBus.publish("CODE_GENERATED", {
      taskId: task.id,
      projectId: this.projectId,
      artifactId: artifact.id,
      fileCount: files.length,
    });

    return {
      files,
      dependencies: [],
      notes: `Identified ${files.length} files for deletion`,
      artifactId: artifact.id,
    };
  }

  /**
   * Extract file paths from text (task description)
   */
  private extractFilePaths(text: string, existingPaths: Set<string>): string[] {
    const paths: string[] = [];

    // Common patterns for file path mentions
    const patterns = [
      /`([^`]+\.(ts|tsx|js|jsx|css|json|md|py|html))`/g,
      /(['"])([^'"]+\.(ts|tsx|js|jsx|css|json|md|py|html))\1/g,
      /(?:delete|remove|cleanup)\s+(?:file[s]?\s+)?([^\s,]+\.(ts|tsx|js|jsx|css|json|md|py|html))/gi,
      /([a-zA-Z0-9_\-/.]+\.(ts|tsx|js|jsx|css|json|md|py|html))/g,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        // Get the path (might be in different capture groups)
        const path = match[2] || match[1];
        if (path && existingPaths.has(path)) {
          paths.push(path);
        }
      }
    }

    return [...new Set(paths)]; // Remove duplicates
  }

  /**
   * Regenerate code based on review feedback
   */
  async regenerate(
    task: Task,
    artifactId: string,
    feedback: string[]
  ): Promise<CodeGenerationResult> {
    await this.log("CODE_REGENERATION_STARTED", {
      taskId: task.id,
      artifactId,
      feedbackCount: feedback.length,
    });

    // Get previous artifact
    const previousArtifact = await prisma.codeArtifact.findUnique({
      where: { id: artifactId },
    });

    if (!previousArtifact) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    // Build revision prompt
    const projectContext = await this.getProjectContext(
      `Revise code for: ${task.title}. Feedback: ${feedback.join(", ")}`
    );

    const prompt = `You are revising code based on review feedback.

## Task
**Title**: ${task.title}
**Description**: ${task.description}

## Previous Code
${previousArtifact.content}

## Review Feedback
${feedback.map((f, i) => `${i + 1}. ${f}`).join("\n")}

## Project Context
${projectContext}

## Instructions
Provide the corrected code addressing ALL the feedback points.

## Output Format
\`\`\`json
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "// complete corrected file content",
      "action": "create"
    }
  ],
  "notes": "What was fixed"
}
\`\`\`

Generate the corrected code:`;

    const response = await this.callLLMJSON<{
      files: GeneratedFile[];
      notes?: string;
    }>(prompt);

    if (!response || !response.files) {
      throw new Error("Failed to regenerate code");
    }

    // Create new artifact (new version)
    const newArtifact = await this.saveArtifact(task, response.files, []);

    // Mark previous as rejected
    await prisma.codeArtifact.update({
      where: { id: artifactId },
      data: { status: "rejected" },
    });

    await this.log("CODE_REGENERATION_COMPLETED", {
      taskId: task.id,
      oldArtifactId: artifactId,
      newArtifactId: newArtifact.id,
    });

    eventBus.publish("CODE_REGENERATED", {
      taskId: task.id,
      projectId: this.projectId,
      artifactId: newArtifact.id,
    });

    return {
      files: response.files,
      dependencies: [],
      notes: response.notes || "",
      artifactId: newArtifact.id,
    };
  }
}

export default CodeGeneratorAgent;
