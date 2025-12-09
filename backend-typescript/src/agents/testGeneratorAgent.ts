/**
 * Test Generator Agent
 * Generates unit, integration, and E2E tests for approved code
 */

import { PrismaClient, type Task } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";
import { buildTestGenerationPrompt } from "../llm/prompts/testGeneration.js";

const prisma = new PrismaClient();

export interface GeneratedTest {
  path: string;
  content: string;
  testType: "unit" | "integration" | "e2e";
}

export interface TestGenerationResult {
  files: GeneratedTest[];
  testCommands: {
    unit?: string;
    integration?: string;
    e2e?: string;
  };
  coverage: string[];
}

export class TestGeneratorAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "TEST_GENERATOR");
  }

  /**
   * Generate tests for a task's approved code
   */
  async execute(taskId: string): Promise<TestGenerationResult> {
    await this.log("TEST_GENERATION_STARTED", { taskId });

    // Get task and its approved code artifact
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        codeArtifacts: {
          where: { status: "approved" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const approvedArtifact = task.codeArtifacts[0];
    if (!approvedArtifact) {
      throw new Error(`No approved code artifact found for task: ${taskId}`);
    }

    // Get project config for frameworks
    const configFile = await prisma.file.findFirst({
      where: {
        projectId: this.projectId,
        path: "autodev.config.json",
      },
    });

    let frameworks: string[] = [];
    try {
      if (configFile) {
        const config = JSON.parse(configFile.content);
        frameworks = config.frameworks || [];
      }
    } catch {
      // Default frameworks
      frameworks = ["jest"];
    }

    // Get project context
    const projectContext = await this.getProjectContext(
      `Generate tests for: ${task.title}. Task type: ${task.type}`
    );

    // Build prompt
    const prompt = buildTestGenerationPrompt({
      taskTitle: task.title,
      taskType: task.type,
      codeContent: approvedArtifact.content,
      projectContext,
      frameworks,
    });

    // Generate tests via LLM
    const response = await this.callLLMJSON<TestGenerationResult>(prompt);

    if (!response || !response.files) {
      throw new Error("Failed to generate tests");
    }

    // Save test files
    await this.saveTestFiles(response.files);

    // Update task status
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "tests_generated" },
    });

    await this.log("TEST_GENERATION_COMPLETED", {
      taskId,
      fileCount: response.files.length,
      testTypes: [...new Set(response.files.map((f) => f.testType))],
    });

    eventBus.publish("TESTS_GENERATED", {
      taskId,
      projectId: this.projectId,
      fileCount: response.files.length,
      testCommands: response.testCommands,
    });

    return response;
  }

  /**
   * Save generated test files to project
   */
  private async saveTestFiles(files: GeneratedTest[]): Promise<void> {
    for (const file of files) {
      await prisma.file.upsert({
        where: {
          projectId_path: {
            projectId: this.projectId,
            path: file.path,
          },
        },
        create: {
          projectId: this.projectId,
          path: file.path,
          content: file.content,
          encoding: "utf-8",
          size: Buffer.byteLength(file.content, "utf-8"),
        },
        update: {
          content: file.content,
          size: Buffer.byteLength(file.content, "utf-8"),
          updatedAt: new Date(),
        },
      });

      // Index in Supermemory
      try {
        await this.memory.indexFile({ path: file.path, content: file.content });
      } catch (error) {
        console.error(`Failed to index test file ${file.path}:`, error);
      }
    }
  }

  /**
   * Generate additional tests based on coverage report
   */
  async generateAdditionalTests(
    taskId: string,
    uncoveredAreas: string[]
  ): Promise<GeneratedTest[]> {
    await this.log("ADDITIONAL_TEST_GENERATION_STARTED", {
      taskId,
      uncoveredCount: uncoveredAreas.length,
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        codeArtifacts: {
          where: { status: "approved" },
          take: 1,
        },
      },
    });

    if (!task || !task.codeArtifacts[0]) {
      throw new Error(`Task or approved artifact not found: ${taskId}`);
    }

    const prompt = `Generate additional unit tests to cover the following uncovered areas:

## Uncovered Areas
${uncoveredAreas.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Code Being Tested
\`\`\`
${task.codeArtifacts[0].content}
\`\`\`

## Output Format
\`\`\`json
{
  "files": [
    {
      "path": "tests/unit/additional.test.ts",
      "content": "// test content",
      "testType": "unit"
    }
  ]
}
\`\`\`

Generate targeted tests for the uncovered areas:`;

    const response = await this.callLLMJSON<{ files: GeneratedTest[] }>(prompt);

    if (response?.files) {
      await this.saveTestFiles(response.files);
      return response.files;
    }

    return [];
  }
}

export default TestGeneratorAgent;
