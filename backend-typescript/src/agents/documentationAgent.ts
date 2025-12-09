/**
 * Documentation Agent
 * Generates and incrementally updates project README after each story
 */

import { PrismaClient, type Story, type Task } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";
import { buildDocumentationPrompt } from "../llm/prompts/documentation.js";

const prisma = new PrismaClient();

export class DocumentationAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "DOCUMENTATION");
  }

  /**
   * Update documentation after a story is completed
   */
  async execute(storyId: string): Promise<void> {
    await this.log("DOCUMENTATION_UPDATE_STARTED", { storyId });

    // Get story with its tasks
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        tasks: {
          where: {
            status: { in: ["tests_passed", "code_approved", "deployed"] },
          },
        },
      },
    });

    if (!story) {
      throw new Error(`Story not found: ${storyId}`);
    }

    // Get existing README
    const existingReadme = await prisma.file.findFirst({
      where: {
        projectId: this.projectId,
        path: { in: ["README.md", "readme.md", "Readme.md"] },
      },
    });

    // Get generated files for this story
    const generatedFiles = await this.getGeneratedFiles(story.tasks.map((t) => t.id));

    // Get project context
    const projectContext = await this.getProjectContext(
      `Documentation for project after implementing: ${story.title}`
    );

    // Build prompt
    const prompt = buildDocumentationPrompt({
      existingReadme: existingReadme?.content || null,
      storyTitle: story.title,
      storyDescription: story.description,
      implementedTasks: story.tasks.map((t) => ({
        title: t.title,
        description: t.description,
        type: t.type,
      })),
      generatedFiles,
      projectContext,
    });

    // Generate updated README via LLM
    const response = await this.callLLM(prompt);

    // Extract markdown content from response
    const readmeContent = this.extractMarkdown(response);

    // Save README
    await this.saveReadme(readmeContent);

    await this.log("DOCUMENTATION_UPDATE_COMPLETED", {
      storyId,
      readmeSize: readmeContent.length,
    });

    eventBus.publish("DOCUMENTATION_UPDATED", {
      projectId: this.projectId,
      storyId,
      storyTitle: story.title,
    });
  }

  /**
   * Get list of files generated for tasks
   */
  private async getGeneratedFiles(taskIds: string[]): Promise<string[]> {
    const artifacts = await prisma.codeArtifact.findMany({
      where: {
        taskId: { in: taskIds },
        status: "approved",
      },
      select: { content: true },
    });

    const files: string[] = [];

    for (const artifact of artifacts) {
      // Parse file paths from artifact content
      const pathMatches = artifact.content.matchAll(/\/\/ File: (.+)/g);
      for (const match of pathMatches) {
        files.push(match[1]);
      }
    }

    return [...new Set(files)]; // Dedupe
  }

  /**
   * Extract markdown from LLM response
   */
  private extractMarkdown(response: string): string {
    // Try to extract from code block
    const codeBlockMatch = response.match(/```markdown\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try generic code block
    const genericBlockMatch = response.match(/```\n([\s\S]*?)```/);
    if (genericBlockMatch) {
      return genericBlockMatch[1].trim();
    }

    // Return raw response if no code blocks (might already be markdown)
    return response.trim();
  }

  /**
   * Save README to project files
   */
  private async saveReadme(content: string): Promise<void> {
    await prisma.file.upsert({
      where: {
        projectId_path: {
          projectId: this.projectId,
          path: "README.md",
        },
      },
      create: {
        projectId: this.projectId,
        path: "README.md",
        content,
        encoding: "utf-8",
        size: Buffer.byteLength(content, "utf-8"),
      },
      update: {
        content,
        size: Buffer.byteLength(content, "utf-8"),
        updatedAt: new Date(),
      },
    });

    // Index in Supermemory
    try {
      await this.memory.indexFile({ path: "README.md", content });
    } catch (error) {
      console.error("Failed to index README:", error);
    }
  }

  /**
   * Generate changelog entry for a story
   */
  async generateChangelogEntry(story: Story, tasks: Task[]): Promise<string> {
    const date = new Date().toISOString().split("T")[0];
    const types = [...new Set(tasks.map((t) => t.type))];

    let entry = `\n## [${date}] ${story.title}\n\n`;

    if (types.includes("frontend")) {
      entry += "### Frontend\n";
      entry += tasks
        .filter((t) => t.type === "frontend")
        .map((t) => `- ${t.title}`)
        .join("\n");
      entry += "\n\n";
    }

    if (types.includes("backend")) {
      entry += "### Backend\n";
      entry += tasks
        .filter((t) => t.type === "backend")
        .map((t) => `- ${t.title}`)
        .join("\n");
      entry += "\n\n";
    }

    if (types.includes("database")) {
      entry += "### Database\n";
      entry += tasks
        .filter((t) => t.type === "database")
        .map((t) => `- ${t.title}`)
        .join("\n");
      entry += "\n\n";
    }

    return entry;
  }
}

export default DocumentationAgent;
