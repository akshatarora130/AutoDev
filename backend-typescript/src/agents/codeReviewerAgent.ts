/**
 * Code Reviewer Agent
 * Reviews generated code for quality, security, and correctness
 */

import { PrismaClient, type Task, type CodeArtifact } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";
import { buildCodeReviewPrompt } from "../llm/prompts/codeReview.js";

const prisma = new PrismaClient();

export interface ReviewIssue {
  severity: "error" | "warning" | "suggestion";
  category: "correctness" | "quality" | "security" | "performance" | "type-safety";
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface CodeReviewResult {
  approved: boolean;
  overallScore: number;
  issues: ReviewIssue[];
  summary: string;
  strengths: string[];
  requiredChanges: string[];
}

export class CodeReviewerAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "CODE_REVIEWER");
  }

  /**
   * Review a code artifact
   */
  async execute(artifactId: string): Promise<CodeReviewResult> {
    await this.log("CODE_REVIEW_STARTED", { artifactId });

    // Get the artifact and its associated task
    const artifact = await prisma.codeArtifact.findUnique({
      where: { id: artifactId },
      include: { task: true },
    });

    if (!artifact) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const task = artifact.task;

    // Auto-approve deletion and test_cleanup tasks - they don't need code review
    if (task.type === "deletion" || task.type === "test_cleanup") {
      await this.log("AUTO_APPROVED_DELETION", { artifactId, taskType: task.type });

      // Update artifact status
      await prisma.codeArtifact.update({
        where: { id: artifactId },
        data: { status: "approved" },
      });

      // Update task status
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "code_approved",
          reviewedAt: new Date(),
          reviewNotes: `Auto-approved ${task.type} task`,
        },
      });

      // Process the deletions
      await this.saveApprovedCode(artifact);

      // Publish event
      eventBus.publish("CODE_APPROVED", {
        taskId: task.id,
        projectId: this.projectId,
        artifactId,
        approved: true,
        score: 10,
        requiredChanges: [],
      });

      return {
        approved: true,
        overallScore: 10,
        issues: [],
        summary: `Auto-approved ${task.type} task - file operations executed`,
        strengths: ["File operations completed successfully"],
        requiredChanges: [],
      };
    }

    // Get project context
    const projectContext = await this.getProjectContext(
      `Code review for: ${task.title}. Check for quality, security, and correctness.`
    );

    // Build review prompt
    const prompt = buildCodeReviewPrompt({
      taskTitle: task.title,
      taskDescription: task.description,
      taskType: task.type,
      codeContent: artifact.content,
      projectContext,
    });

    // Call LLM for review
    const response = await this.callLLMJSON<CodeReviewResult>(prompt);

    if (!response) {
      throw new Error("Failed to get code review response");
    }

    // Ensure proper structure
    const result: CodeReviewResult = {
      approved: response.approved ?? false,
      overallScore: response.overallScore ?? 0,
      issues: response.issues ?? [],
      summary: response.summary ?? "Review completed",
      strengths: response.strengths ?? [],
      requiredChanges: response.requiredChanges ?? [],
    };

    // Update artifact status based on review
    await prisma.codeArtifact.update({
      where: { id: artifactId },
      data: {
        status: result.approved ? "approved" : "rejected",
      },
    });

    // Update task status if approved
    if (result.approved) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "code_approved",
          reviewedAt: new Date(),
          reviewNotes: result.summary,
        },
      });

      // Save approved code to project files
      await this.saveApprovedCode(artifact);
    }

    await this.log("CODE_REVIEW_COMPLETED", {
      artifactId,
      taskId: task.id,
      approved: result.approved,
      score: result.overallScore,
      issueCount: result.issues.length,
    });

    // Publish appropriate event
    eventBus.publish(result.approved ? "CODE_APPROVED" : "CODE_REJECTED", {
      taskId: task.id,
      projectId: this.projectId,
      artifactId,
      approved: result.approved,
      score: result.overallScore,
      requiredChanges: result.requiredChanges,
    });

    return result;
  }

  /**
   * Save approved code to project files and index in Supermemory
   */
  private async saveApprovedCode(artifact: CodeArtifact): Promise<void> {
    // Parse the combined content format
    // Format: // File: path\n// Action: action\ncontent
    const fileBlocks = artifact.content.split("\n\n---\n\n");

    // Deduplicate by file path (keep first occurrence)
    const uniqueBlocks = new Map<string, { path: string; action: string; content: string }>();

    for (const block of fileBlocks) {
      const lines = block.split("\n");
      const pathMatch = lines[0]?.match(/\/\/ File: (.+)/);
      const actionMatch = lines[1]?.match(/\/\/ Action: (.+)/);

      if (!pathMatch) continue;

      const filePath = pathMatch[1].trim();
      const action = actionMatch?.[1] || "create";
      const content = lines.slice(2).join("\n");

      // Only keep first occurrence of each file path
      if (!uniqueBlocks.has(filePath)) {
        uniqueBlocks.set(filePath, { path: filePath, action, content });
      } else {
        console.warn(`⚠️ Duplicate file path detected in artifact and skipped: ${filePath}`);
      }
    }

    // Process unique files
    for (const { path: filePath, action, content } of uniqueBlocks.values()) {
      if (action === "delete") {
        await prisma.file.deleteMany({
          where: {
            projectId: this.projectId,
            path: filePath,
          },
        });
      } else {
        // Upsert file (this handles duplicates at DB level too)
        await prisma.file.upsert({
          where: {
            projectId_path: {
              projectId: this.projectId,
              path: filePath,
            },
          },
          create: {
            projectId: this.projectId,
            path: filePath,
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

        // Index in Supermemory for future context
        try {
          await this.memory.indexFile({
            path: filePath,
            content,
          });
        } catch (error) {
          console.error(`Failed to index file ${filePath}:`, error);
        }
      }
    }
  }

  /**
   * Quick review for simple changes (less thorough)
   */
  async quickReview(artifactId: string): Promise<{ approved: boolean; notes: string }> {
    const artifact = await prisma.codeArtifact.findUnique({
      where: { id: artifactId },
      include: { task: true },
    });

    if (!artifact) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    // Simple checks
    const issues: string[] = [];

    // Check for 'any' types
    if (artifact.content.includes(": any") || artifact.content.includes(": any[]")) {
      issues.push("Contains 'any' type - use proper TypeScript types");
    }

    // Check for console.log (should use proper logging)
    if (artifact.content.includes("console.log(")) {
      issues.push("Contains console.log - use proper logging mechanism");
    }

    // Check for TODO comments
    if (artifact.content.includes("TODO") || artifact.content.includes("FIXME")) {
      issues.push("Contains TODO/FIXME comments - implementation may be incomplete");
    }

    // Check for hardcoded credentials
    const credPatterns = [/password\s*=\s*['"][^'"]+['"]/i, /api_key\s*=\s*['"][^'"]+['"]/i];
    for (const pattern of credPatterns) {
      if (pattern.test(artifact.content)) {
        issues.push("Possible hardcoded credentials detected");
        break;
      }
    }

    const approved = issues.length === 0;

    return {
      approved,
      notes: approved
        ? "Quick review passed - no obvious issues found"
        : `Quick review failed: ${issues.join("; ")}`,
    };
  }
}

export default CodeReviewerAgent;
