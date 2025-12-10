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
   * MOCKED: Auto-approves all code with a simulated timeout
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

    // MOCK: Simulate review delay (1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // MOCK: Auto-approve all code
    await this.log("MOCKED_CODE_REVIEW", { artifactId, taskId: task.id });

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
        reviewNotes: "Mocked code review - auto-approved",
      },
    });

    // Save approved code to project files
    await this.saveApprovedCode(artifact);

    const result: CodeReviewResult = {
      approved: true,
      overallScore: 9,
      issues: [],
      summary: "Mocked code review - auto-approved for testing",
      strengths: ["Code generated successfully", "Mocked review passed"],
      requiredChanges: [],
    };

    await this.log("CODE_REVIEW_COMPLETED", {
      artifactId,
      taskId: task.id,
      approved: result.approved,
      score: result.overallScore,
      issueCount: result.issues.length,
    });

    // Publish event
    eventBus.publish("CODE_APPROVED", {
      taskId: task.id,
      projectId: this.projectId,
      artifactId,
      approved: true,
      score: result.overallScore,
      requiredChanges: [],
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
