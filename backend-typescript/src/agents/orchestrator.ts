/**
 * Orchestrator
 * Central coordinator for agent execution
 * Processes stories through all phases (Phase 1-5)
 */

import { PrismaClient, type Story, type Task } from "@prisma/client";
import { StoryQueue } from "../services/storyQueue.js";
import { TaskDividerAgent } from "./taskDividerAgent.js";
import { TaskReviewerAgent } from "./taskReviewerAgent.js";
import { TaskPrioritizerAgent } from "./taskPrioritizerAgent.js";
import { CodeGeneratorAgent } from "./codeGeneratorAgent.js";
import { CodeReviewerAgent } from "./codeReviewerAgent.js";
import { ProjectAnalyzerAgent } from "./projectAnalyzerAgent.js";
import { TestGeneratorAgent } from "./testGeneratorAgent.js";
import { TestExecutorAgent } from "./testExecutorAgent.js";
import { DocumentationAgent } from "./documentationAgent.js";
import { rollbackService } from "../services/rollbackService.js";
import { eventBus } from "../redis/eventBus.js";
import type { StoryStatus } from "../types/agent.js";

const prisma = new PrismaClient();

/**
 * Orchestrator - coordinates the agent pipeline
 */
export class Orchestrator {
  private storyQueue: StoryQueue;
  private isProcessing = false;
  private checkInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.storyQueue = new StoryQueue();
    this.checkInterval = parseInt(process.env.QUEUE_CHECK_INTERVAL_MS || "10000");
  }

  /**
   * Start the orchestrator
   * Begins monitoring for pending stories
   */
  async start(): Promise<void> {
    console.log("🚀 Orchestrator started");
    console.log(`⏰ Queue check interval: ${this.checkInterval}ms`);

    // Subscribe to queue check events
    eventBus.subscribe("QUEUE_CHECK", async (event) => {
      console.log(`📥 Queue check triggered for project: ${event.payload.projectId}`);
      await this.processNextStory(event.payload.projectId);
    });

    // Subscribe to story completion to pick up next story
    eventBus.subscribe("STORY_COMPLETED", async (event) => {
      console.log(`✅ Story completed, checking for next: ${event.payload.projectId}`);
      await this.processNextStory(event.payload.projectId);
    });

    // Start periodic queue check
    this.intervalId = setInterval(async () => {
      await this.checkAllProjects();
    }, this.checkInterval);

    // Do initial check
    await this.checkAllProjects();
  }

  /**
   * Stop the orchestrator
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("🛑 Orchestrator stopped");
  }

  /**
   * Check all projects for pending stories
   */
  private async checkAllProjects(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    try {
      // Get all projects with pending stories
      const projectsWithPending = await prisma.project.findMany({
        where: {
          stories: {
            some: { status: "pending" },
          },
        },
        select: { id: true, name: true },
      });

      for (const project of projectsWithPending) {
        // Check if any story is currently being processed
        const hasActive = await this.storyQueue.hasActiveStory(project.id);
        if (!hasActive) {
          await this.processNextStory(project.id);
        }
      }
    } catch (error) {
      console.error("Error checking projects:", error);
    }
  }

  /**
   * Process the next pending story for a project
   */
  async processNextStory(projectId: string): Promise<void> {
    if (this.isProcessing) {
      console.log("⏳ Already processing a story, skipping");
      return;
    }

    // Check if there's already an active story
    const hasActive = await this.storyQueue.hasActiveStory(projectId);
    if (hasActive) {
      console.log("⏳ Project already has an active story");
      return;
    }

    this.isProcessing = true;
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 Processing next story for project: ${projectId}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      const story = await this.storyQueue.getNextStory(projectId);

      if (!story) {
        console.log("📭 No pending stories to process");
        return;
      }

      await this.runPipeline(story);
    } catch (error) {
      console.error("Error processing story:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Run the full pipeline for a story
   * Implements Phases 1-5 (excludes Phase 6: Deployment)
   */
  private async runPipeline(story: Story): Promise<void> {
    const projectId = story.projectId;

    try {
      // ═══════════════════════════════════════════
      // PHASE 1: TASK DIVISION
      // ═══════════════════════════════════════════
      console.log("\n📌 PHASE 1: Task Division");
      await this.updateStoryStatus(story.id, "dividing");
      await eventBus.publish("STORY_DIVIDING", { storyId: story.id, projectId });

      const divider = new TaskDividerAgent(projectId);
      await divider.execute(story);

      // Check for cancellation
      if (await this.checkCancellation(story.id, projectId)) return;

      // ═══════════════════════════════════════════
      // PHASE 2: TASK REVIEW
      // ═══════════════════════════════════════════
      console.log("\n📌 PHASE 2: Task Review");
      await this.updateStoryStatus(story.id, "reviewing");
      await eventBus.publish("STORY_REVIEWING", { storyId: story.id, projectId });

      const taskReviewer = new TaskReviewerAgent(projectId);
      await taskReviewer.execute(story.id);

      // Mark ready for generation
      await this.updateStoryStatus(story.id, "tasks_ready");
      await eventBus.publish("STORY_READY", { storyId: story.id, projectId });

      // Check for cancellation
      if (await this.checkCancellation(story.id, projectId)) return;

      // ═══════════════════════════════════════════
      // CREATE SNAPSHOT BEFORE CODE CHANGES
      // ═══════════════════════════════════════════
      console.log("\n📸 Creating file snapshot for rollback...");
      await rollbackService.createStorySnapshot(story.id, projectId);

      // ═══════════════════════════════════════════
      // PHASE 3: CODE GENERATION
      // ═══════════════════════════════════════════
      console.log("\n📌 PHASE 3: Code Generation");
      await this.updateStoryStatus(story.id, "generating");
      await eventBus.publish("STORY_GENERATING", { storyId: story.id, projectId });

      // Analyze project first
      const analyzer = new ProjectAnalyzerAgent(projectId);
      await analyzer.execute();

      // Prioritize tasks by dependencies
      const prioritizer = new TaskPrioritizerAgent(projectId);
      const { batches } = await prioritizer.execute(story.id);

      // Generate code for each batch
      const codeGenerator = new CodeGeneratorAgent(projectId);
      for (const batch of batches) {
        console.log(
          `   Generating batch ${batch.batchNumber + 1}/${batches.length} (${batch.tasks.length} tasks)`
        );

        // Process tasks in batch (could be parallelized)
        for (const task of batch.tasks) {
          await codeGenerator.execute(task);
        }
      }

      // Check for cancellation
      if (await this.checkCancellation(story.id, projectId)) return;

      // ═══════════════════════════════════════════
      // PHASE 4: CODE REVIEW
      // ═══════════════════════════════════════════
      console.log("\n📌 PHASE 4: Code Review");
      await this.updateStoryStatus(story.id, "code_review");
      await eventBus.publish("STORY_CODE_REVIEW", { storyId: story.id, projectId });

      const codeReviewer = new CodeReviewerAgent(projectId);

      // Get all pending artifacts for this story
      const pendingArtifacts = await prisma.codeArtifact.findMany({
        where: {
          task: { storyId: story.id },
          status: "pending",
        },
        include: { task: true },
      });

      let maxRetries = 3;
      let failedTaskCount = 0;

      for (const artifact of pendingArtifacts) {
        // Check for cancellation between tasks
        if (await this.checkCancellation(story.id, projectId)) return;

        let approved = false;
        let retries = 0;

        while (!approved && retries < maxRetries) {
          const reviewResult = await codeReviewer.execute(artifact.id);

          if (reviewResult.approved) {
            approved = true;
          } else if (retries < maxRetries - 1) {
            // Regenerate code based on feedback
            console.log(`   Regenerating code for task: ${artifact.task.title}`);
            await codeGenerator.regenerate(
              artifact.task,
              artifact.id,
              reviewResult.requiredChanges
            );
            retries++;
          } else {
            // Max retries reached, mark as failed and trigger rollback
            failedTaskCount++;
            await prisma.task.update({
              where: { id: artifact.taskId },
              data: { status: "failed" },
            });
            console.log(`   ❌ Task "${artifact.task.title}" failed after ${maxRetries} retries`);
          }
        }
      }

      // If any tasks failed after max retries, rollback and fail the story
      if (failedTaskCount > 0) {
        console.log(`\n⚠️ ${failedTaskCount} task(s) failed after max retries - rolling back...`);
        await rollbackService.rollbackStory(story.id, projectId);
        throw new Error(`${failedTaskCount} task(s) failed after ${maxRetries} retries`);
      }

      // Check for cancellation
      if (await this.checkCancellation(story.id, projectId)) return;

      // ═══════════════════════════════════════════
      // PHASE 5: TESTING
      // ═══════════════════════════════════════════
      console.log("\n📌 PHASE 5: Testing");
      await this.updateStoryStatus(story.id, "testing");
      await eventBus.publish("STORY_TESTING", { storyId: story.id, projectId });

      // Get tasks with approved code (excluding deletion tasks which don't need tests)
      const approvedTasks = await prisma.task.findMany({
        where: {
          storyId: story.id,
          status: "code_approved",
          type: { notIn: ["deletion", "test_cleanup"] },
        },
      });

      const testGenerator = new TestGeneratorAgent(projectId);
      const testExecutor = new TestExecutorAgent(projectId);
      let testFailedCount = 0;

      for (const task of approvedTasks) {
        // Check for cancellation between tasks
        if (await this.checkCancellation(story.id, projectId)) return;

        // Generate tests
        await testGenerator.execute(task.id);

        // Execute tests
        const testResult = await testExecutor.execute(task.id);

        if (!testResult.passed) {
          testFailedCount++;
          console.log(`   ⚠️ Tests failed for task: ${task.title}`);
          console.log(`   Error: ${testResult.failures.map((f) => f.error).join(", ")}`);
        } else {
          // Update task status to tests_passed
          await prisma.task.update({
            where: { id: task.id },
            data: { status: "tests_passed" },
          });
        }
      }

      // If any tests failed, rollback and fail the story
      if (testFailedCount > 0) {
        console.log(`\n⚠️ ${testFailedCount} task(s) failed tests - rolling back...`);
        await rollbackService.rollbackStory(story.id, projectId);
        throw new Error(`${testFailedCount} task(s) failed tests`);
      }

      // ═══════════════════════════════════════════
      // DOCUMENTATION UPDATE
      // ═══════════════════════════════════════════
      console.log("\n📌 Updating Documentation");
      const docAgent = new DocumentationAgent(projectId);
      await docAgent.execute(story.id);

      // ═══════════════════════════════════════════
      // COMPLETION
      // ═══════════════════════════════════════════
      const taskCount = await prisma.task.count({
        where: {
          storyId: story.id,
          status: { in: ["tests_passed", "code_approved"] },
        },
      });

      await this.updateStoryStatus(story.id, "completed");
      await prisma.story.update({
        where: { id: story.id },
        data: { completedAt: new Date() },
      });

      // Clean up snapshots - story completed successfully, no need for rollback
      await rollbackService.cleanupSnapshots(story.id);

      await prisma.agentLog.create({
        data: {
          projectId,
          agentType: "ORCHESTRATOR",
          event: "PIPELINE_COMPLETED",
          data: {
            storyId: story.id,
            storyTitle: story.title,
            phase: "completed",
            taskCount,
          },
          timestamp: new Date(),
        },
      });

      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ Story "${story.title}" completed with ${taskCount} tasks`);
      console.log(`${"=".repeat(60)}\n`);

      // Check for next story
      await eventBus.publish("STORY_COMPLETED", { storyId: story.id, projectId });
    } catch (error) {
      await this.handlePipelineError(story, error as Error);
    }
  }

  /**
   * Update story status
   */
  private async updateStoryStatus(storyId: string, status: StoryStatus): Promise<void> {
    await prisma.story.update({
      where: { id: storyId },
      data: { status },
    });
  }

  /**
   * Check if story has been cancelled
   * If cancelled, performs rollback and returns true
   */
  private async checkCancellation(storyId: string, projectId: string): Promise<boolean> {
    const isCancelled = await rollbackService.isStoryCancelled(storyId);

    if (isCancelled) {
      console.log(`\n⚠️ Story ${storyId} was cancelled - rolling back changes...`);
      await rollbackService.rollbackStory(storyId, projectId);
      console.log("🔄 Rollback completed");
      return true;
    }

    return false;
  }

  /**
   * Handle pipeline errors - now includes rollback
   */
  private async handlePipelineError(story: Story, error: Error): Promise<void> {
    const currentStory = await prisma.story.findUnique({
      where: { id: story.id },
      select: { status: true },
    });

    // Rollback all changes made during this story
    console.log("\n🔄 Rolling back changes due to pipeline failure...");
    try {
      await rollbackService.rollbackStory(story.id, story.projectId);
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    await prisma.story.update({
      where: { id: story.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        failedPhase: currentStory?.status || "unknown",
        failedReason: error.message,
      },
    });

    await eventBus.publish("STORY_FAILED", {
      storyId: story.id,
      projectId: story.projectId,
      phase: currentStory?.status || "unknown",
      reason: error.message,
    });

    await prisma.agentLog.create({
      data: {
        projectId: story.projectId,
        agentType: "ORCHESTRATOR",
        event: "PIPELINE_FAILED",
        data: {
          storyId: story.id,
          storyTitle: story.title,
          phase: currentStory?.status,
          error: error.message,
          rolledBack: true,
        },
        timestamp: new Date(),
      },
    });

    console.error(`\n${"=".repeat(60)}`);
    console.error(`❌ Pipeline failed for "${story.title}" - changes rolled back`);
    console.error(`   Phase: ${currentStory?.status}`);
    console.error(`   Error: ${error.message}`);
    console.error(`${"=".repeat(60)}\n`);
  }

  /**
   * Force process a specific story (bypasses queue)
   */
  async forceProcess(storyId: string): Promise<void> {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error(`Story not found: ${storyId}`);
    }

    // Reset story status to pending first
    await prisma.story.update({
      where: { id: storyId },
      data: { status: "pending" },
    });

    await this.storyQueue.getNextStory(story.projectId); // Select the story
    await this.runPipeline(story);
  }
}

// Singleton instance
let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}

export default Orchestrator;
