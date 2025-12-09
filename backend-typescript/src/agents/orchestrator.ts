/**
 * Orchestrator
 * Central coordinator for agent execution
 * Processes stories through all phases (currently Phase 1 & 2)
 */

import { PrismaClient, type Story } from "@prisma/client";
import { StoryQueue } from "../services/storyQueue.js";
import { TaskDividerAgent } from "./taskDividerAgent.js";
import { TaskReviewerAgent } from "./taskReviewerAgent.js";
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
   * Currently implements Phase 1 & 2
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

      // ═══════════════════════════════════════════
      // PHASE 2: TASK REVIEW
      // ═══════════════════════════════════════════
      console.log("\n📌 PHASE 2: Task Review");
      await this.updateStoryStatus(story.id, "reviewing");
      await eventBus.publish("STORY_REVIEWING", { storyId: story.id, projectId });

      const reviewer = new TaskReviewerAgent(projectId);
      await reviewer.execute(story.id);

      // ═══════════════════════════════════════════
      // PHASE 3-6: FUTURE PHASES
      // ═══════════════════════════════════════════
      // Phase 3: Code Generation (FUTURE)
      // Phase 4: Code Review (FUTURE)
      // Phase 5: Testing (FUTURE)
      // Phase 6: Deployment (FUTURE)

      // ═══════════════════════════════════════════
      // COMPLETION (currently stops at tasks_ready)
      // ═══════════════════════════════════════════
      const taskCount = await prisma.task.count({
        where: {
          storyId: story.id,
          status: { in: ["reviewed", "subdivided"] },
        },
      });

      console.log("\n📌 Pipeline Complete (Phase 1 & 2)");
      await this.updateStoryStatus(story.id, "tasks_ready");
      await eventBus.publish("STORY_READY", {
        storyId: story.id,
        projectId,
        taskCount,
      });

      // Log completion
      await prisma.agentLog.create({
        data: {
          projectId,
          agentType: "ORCHESTRATOR",
          event: "PIPELINE_COMPLETED",
          data: {
            storyId: story.id,
            storyTitle: story.title,
            phase: "tasks_ready",
            taskCount,
          },
          timestamp: new Date(),
        },
      });

      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ Story "${story.title}" ready with ${taskCount} tasks`);
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
   * Handle pipeline errors
   */
  private async handlePipelineError(story: Story, error: Error): Promise<void> {
    const currentStory = await prisma.story.findUnique({
      where: { id: story.id },
      select: { status: true },
    });

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
        },
        timestamp: new Date(),
      },
    });

    console.error(`\n${"=".repeat(60)}`);
    console.error(`❌ Pipeline failed for "${story.title}"`);
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
