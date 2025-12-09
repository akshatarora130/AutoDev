/**
 * Task Divider Agent
 * Phase 1: Breaks user stories into atomic, implementable subtasks
 */

import { PrismaClient, type Story } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { buildTaskDivisionPrompt } from "../llm/prompts/taskDivision.js";
import { eventBus } from "../redis/eventBus.js";
import type { GeneratedTask, TaskDivisionResult } from "../types/agent.js";

const prisma = new PrismaClient();

/**
 * Task Divider Agent
 * Breaks stories into subtasks using LLM with project context
 */
export class TaskDividerAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "TASK_DIVIDER");
  }

  /**
   * Execute task division for a story
   */
  async execute(story: Story): Promise<TaskDivisionResult> {
    console.log(`📝 Task Divider starting for story: "${story.title}"`);

    await this.log("EXECUTION_STARTED", {
      storyId: story.id,
      storyTitle: story.title,
    });

    try {
      // 1. Get project context from Supermemory
      const projectContext = await this.getProjectContext(
        `${story.title} ${story.description} implementation patterns code structure`
      );

      await this.log("CONTEXT_RETRIEVED", {
        storyId: story.id,
        contextLength: projectContext.length,
      });

      // 2. Build prompt and call LLM
      const prompt = buildTaskDivisionPrompt(
        {
          id: story.id,
          title: story.title,
          description: story.description,
          priority: story.priority,
        },
        projectContext
      );

      const tasks = await this.callLLMJSON<GeneratedTask[]>(prompt, {
        model: process.env.LLM_MODEL,
      });

      await this.log("TASKS_GENERATED", {
        storyId: story.id,
        taskCount: tasks.length,
        taskTitles: tasks.map((t) => t.title),
      });

      // 3. Save tasks to database
      const taskIds: string[] = [];
      const taskTitleToId = new Map<string, string>();

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        // Create task in database
        const created = await prisma.task.create({
          data: {
            storyId: story.id,
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority || i + 1,
            status: "pending",
            dependencies: task.dependencies || [],
          },
        });

        taskIds.push(created.id);
        taskTitleToId.set(task.title, created.id);

        // Log each task creation
        await this.log(
          "TASK_CREATED",
          {
            taskId: created.id,
            title: task.title,
            type: task.type,
            priority: task.priority,
            dependencies: task.dependencies,
          },
          created.id
        );

        // Publish event for each task
        await eventBus.publish("TASK_CREATED", {
          taskId: created.id,
          storyId: story.id,
          projectId: this.projectId,
          title: task.title,
        });
      }

      // 4. Update dependencies from titles to IDs
      for (const task of tasks) {
        if (task.dependencies && task.dependencies.length > 0) {
          const taskId = taskTitleToId.get(task.title);
          if (taskId) {
            const dependencyIds = task.dependencies
              .map((depTitle) => taskTitleToId.get(depTitle))
              .filter((id): id is string => !!id);

            if (dependencyIds.length > 0) {
              await prisma.task.update({
                where: { id: taskId },
                data: { dependencies: dependencyIds },
              });
            }
          }
        }
      }

      // 5. Publish completion event
      await eventBus.publish("TASKS_CREATED", {
        storyId: story.id,
        projectId: this.projectId,
        taskIds,
        count: taskIds.length,
      });

      await this.log("EXECUTION_COMPLETED", {
        storyId: story.id,
        taskIds,
        taskCount: taskIds.length,
      });

      console.log(`✅ Task Divider completed: ${taskIds.length} tasks created`);

      return {
        tasks,
        taskIds,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      await this.log("EXECUTION_FAILED", {
        storyId: story.id,
        error: errorMessage,
      });

      console.error("❌ Task Divider failed:", error);
      throw error;
    }
  }
}

export default TaskDividerAgent;
