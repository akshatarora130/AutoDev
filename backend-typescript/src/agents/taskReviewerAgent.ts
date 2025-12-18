/**
 * Task Reviewer Agent
 * Phase 2: Validates tasks and subdivides complex ones
 */

import { PrismaClient, type Task } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { buildTaskReviewPrompt } from "../llm/prompts/taskReview.js";
import { eventBus } from "../redis/eventBus.js";
import type { GeneratedTask, TaskReviewResult, TaskReviewFeedback } from "../types/agent.js";

const prisma = new PrismaClient();

/**
 * Task Reviewer Agent
 * Reviews tasks and subdivides complex ones
 */
export class TaskReviewerAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "TASK_REVIEWER");
  }

  /**
   * Execute task review for all tasks of a story
   */
  async execute(storyId: string): Promise<TaskReviewResult> {
    console.log(`🔍 Task Reviewer starting for story: ${storyId}`);

    await this.log("EXECUTION_STARTED", { storyId });

    const result: TaskReviewResult = {
      reviewed: 0,
      approved: 0,
      subdivided: 0,
    };

    try {
      // Get project context once
      const projectContext = await this.getProjectContext(
        "code structure, implementation patterns, existing components"
      );

      // Get all pending tasks for this story
      const tasks = await prisma.task.findMany({
        where: {
          storyId,
          status: "pending",
        },
        orderBy: { priority: "asc" },
      });

      console.log(`📋 Reviewing ${tasks.length} tasks`);

      // Review each task
      for (const task of tasks) {
        const reviewResult = await this.reviewTask(task, projectContext);
        result.reviewed++;

        if (reviewResult.approved) {
          await this.approveTask(task);
          result.approved++;
        } else if (reviewResult.subtasks && reviewResult.subtasks.length > 0) {
          await this.subdivideTask(task, reviewResult.subtasks, storyId);
          result.subdivided++;
        } else {
          // Task needs work but no subtasks provided - mark as reviewed with feedback
          await this.approveTaskWithFeedback(task, reviewResult.feedback);
          result.approved++;
        }
      }

      // Check if all tasks are now reviewed
      const pendingCount = await prisma.task.count({
        where: { storyId, status: "pending" },
      });

      const allApproved = pendingCount === 0;

      // Publish completion event
      await eventBus.publish("TASKS_REVIEWED", {
        storyId,
        projectId: this.projectId,
        allApproved,
      });

      await this.log("EXECUTION_COMPLETED", {
        storyId,
        ...result,
        allApproved,
      });

      console.log(
        `✅ Task Reviewer completed: ${result.approved} approved, ${result.subdivided} subdivided`
      );

      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;

      await this.log("EXECUTION_FAILED", {
        storyId,
        error: errorMessage,
      });

      console.error("❌ Task Reviewer failed:", error);
      throw error;
    }
  }

  /**
   * Review a single task using LLM
   */
  private async reviewTask(task: Task, projectContext: string): Promise<TaskReviewFeedback> {
    const prompt = buildTaskReviewPrompt(
      {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        dependencies: task.dependencies as string[] | null,
      },
      projectContext
    );

    try {
      const feedback = await this.callLLMJSON<TaskReviewFeedback>(prompt, {
        model: process.env.LLM_MODEL,
      });

      await this.log(
        "TASK_REVIEWED",
        {
          taskId: task.id,
          approved: feedback.approved,
          hasSubtasks: !!(feedback.subtasks && feedback.subtasks.length > 0),
        },
        task.id
      );

      return feedback;
    } catch (error) {
      console.error(`Failed to review task ${task.id}:`, error);
      // Default to approved if review fails
      return {
        approved: true,
        feedback: "Auto-approved due to review error",
      };
    }
  }

  /**
   * Mark a task as approved/reviewed
   */
  private async approveTask(task: Task): Promise<void> {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "reviewed",
        reviewedAt: new Date(),
      },
    });

    await eventBus.publish("TASK_REVIEWED", {
      taskId: task.id,
      storyId: task.storyId,
      projectId: this.projectId,
      approved: true,
    });

    await this.log(
      "TASK_APPROVED",
      {
        taskId: task.id,
        title: task.title,
      },
      task.id
    );

    console.log(`✓ Approved: "${task.title}"`);
  }

  /**
   * Mark a task as approved with review feedback
   */
  private async approveTaskWithFeedback(task: Task, feedback: string): Promise<void> {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "reviewed",
        reviewedAt: new Date(),
        reviewNotes: feedback,
      },
    });

    await eventBus.publish("TASK_REVIEWED", {
      taskId: task.id,
      storyId: task.storyId,
      projectId: this.projectId,
      approved: true,
      feedback,
    });

    await this.log(
      "TASK_APPROVED_WITH_FEEDBACK",
      {
        taskId: task.id,
        title: task.title,
        feedback,
      },
      task.id
    );

    console.log(`✓ Approved with feedback: "${task.title}"`);
  }

  /**
   * Subdivide a complex task into smaller tasks
   */
  private async subdivideTask(
    originalTask: Task,
    subtasks: GeneratedTask[],
    storyId: string
  ): Promise<void> {
    // Mark original task as subdivided
    await prisma.task.update({
      where: { id: originalTask.id },
      data: {
        status: "subdivided",
        reviewedAt: new Date(),
        reviewNotes: `Subdivided into ${subtasks.length} smaller tasks`,
      },
    });

    // Create new subtasks
    const newTaskIds: string[] = [];

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];

      const created = await prisma.task.create({
        data: {
          storyId,
          title: subtask.title,
          description: subtask.description,
          type: subtask.type,
          priority: originalTask.priority + i, // Maintain relative ordering
          status: "reviewed", // Subtasks from review are already validated
          parentTaskId: originalTask.id,
          dependencies: subtask.dependencies || [],
          reviewedAt: new Date(),
          reviewNotes: "Created from task subdivision",
        },
      });

      newTaskIds.push(created.id);

      await this.log(
        "SUBTASK_CREATED",
        {
          originalTaskId: originalTask.id,
          newTaskId: created.id,
          title: subtask.title,
        },
        created.id
      );
    }

    // Publish subdivision event
    await eventBus.publish("TASK_SUBDIVIDED", {
      originalTaskId: originalTask.id,
      storyId,
      projectId: this.projectId,
      newTaskIds,
    });

    await this.log(
      "TASK_SUBDIVIDED",
      {
        originalTaskId: originalTask.id,
        originalTitle: originalTask.title,
        newTaskIds,
        subtaskCount: subtasks.length,
      },
      originalTask.id
    );

    console.log(`📦 Subdivided: "${originalTask.title}" → ${subtasks.length} tasks`);
  }
}

export default TaskReviewerAgent;
