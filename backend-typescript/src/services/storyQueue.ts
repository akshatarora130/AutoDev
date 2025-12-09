/**
 * Story Queue Service
 * Manages priority-based story selection with LLM tie-breaking
 */

import { PrismaClient, type Story } from "@prisma/client";
import { ProjectMemory } from "../supermemory/projectMemory.js";
import { llmClient } from "../llm/client.js";
import {
  buildStoryPriorityPrompt,
  STORY_PRIORITY_SYSTEM_PROMPT,
} from "../llm/prompts/storyPriority.js";
import { eventBus } from "../redis/eventBus.js";
import { PRIORITY_ORDER, type StoryPriority } from "../types/agent.js";

const prisma = new PrismaClient();

/**
 * Story Queue - manages which story to process next
 */
export class StoryQueue {
  /**
   * Get the next story to process for a project
   * Returns null if no pending stories
   */
  async getNextStory(projectId: string): Promise<Story | null> {
    // 1. Fetch all pending stories ordered by priority
    const pendingStories = await prisma.story.findMany({
      where: {
        projectId,
        status: "pending",
      },
      orderBy: [
        { priority: "desc" }, // critical > high > medium > low (alphabetically)
        { createdAt: "asc" }, // older first as tie-breaker
      ],
    });

    if (pendingStories.length === 0) {
      console.log(`📭 No pending stories for project ${projectId}`);
      return null;
    }

    // 2. Sort by actual priority order (PRIORITY_ORDER map)
    const sortedStories = [...pendingStories].sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.priority as StoryPriority] || 0;
      const priorityB = PRIORITY_ORDER[b.priority as StoryPriority] || 0;
      return priorityB - priorityA; // Higher priority first
    });

    // 3. Get highest priority stories
    const topPriority = sortedStories[0].priority;
    const samePriorityStories = sortedStories.filter((s) => s.priority === topPriority);

    console.log(
      `📋 Found ${pendingStories.length} pending stories, ` +
        `${samePriorityStories.length} with "${topPriority}" priority`
    );

    // 4. If only one, select it by priority
    if (samePriorityStories.length === 1) {
      return this.selectStory(samePriorityStories[0], "priority");
    }

    // 5. Multiple same-priority stories - use LLM to decide
    return this.llmTieBreaker(projectId, samePriorityStories);
  }

  /**
   * Use LLM to decide between same-priority stories
   */
  private async llmTieBreaker(projectId: string, stories: Story[]): Promise<Story> {
    console.log(`🤖 LLM tie-breaker for ${stories.length} stories`);

    try {
      // Get project context from Supermemory
      const memory = new ProjectMemory(projectId);
      const context = await memory.getContext(
        "project structure, main features, technology stack, current implementation status"
      );

      const projectContext = context.relevantFiles.map((f) => `File: ${f.path}`).join("\n");

      // Build and send prompt
      const prompt = buildStoryPriorityPrompt(
        stories.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          priority: s.priority,
        })),
        projectContext
      );

      const response = await llmClient.completeJSON<{
        selectedStoryId: string;
        reasoning: string;
      }>(prompt, {
        model: process.env.LLM_MODEL,
      });

      // Find the selected story
      const selectedStory = stories.find((s) => s.id === response.selectedStoryId);

      if (!selectedStory) {
        console.warn("⚠️ LLM selected invalid story ID, falling back to first");
        return this.selectStory(stories[0], "priority");
      }

      return this.selectStory(selectedStory, "llm_tiebreaker", response.reasoning);
    } catch (error) {
      console.error("LLM tie-breaker failed:", error);
      // Fallback to first story (oldest with highest priority)
      return this.selectStory(stories[0], "priority");
    }
  }

  /**
   * Mark a story as selected and update its metadata
   */
  private async selectStory(
    story: Story,
    selectedBy: "priority" | "llm_tiebreaker",
    reasoning?: string
  ): Promise<Story> {
    // Update story with selection info
    const updated = await prisma.story.update({
      where: { id: story.id },
      data: {
        selectedAt: new Date(),
        selectedBy,
        llmReasoning: reasoning,
      },
    });

    // Log selection
    await prisma.agentLog.create({
      data: {
        projectId: story.projectId,
        agentType: "STORY_QUEUE",
        event: "STORY_SELECTED",
        data: {
          storyId: story.id,
          storyTitle: story.title,
          selectedBy,
          reasoning,
        },
        timestamp: new Date(),
      },
    });

    // Publish event
    await eventBus.publish("STORY_SELECTED", {
      storyId: story.id,
      projectId: story.projectId,
      selectedBy,
      reasoning,
    });

    console.log(`✅ Selected story: "${story.title}" (${selectedBy})`);
    return updated;
  }

  /**
   * Check if there's a story currently being processed
   */
  async hasActiveStory(projectId: string): Promise<boolean> {
    const activeStory = await prisma.story.findFirst({
      where: {
        projectId,
        status: {
          in: ["dividing", "reviewing", "generating", "code_review", "testing", "deploying"],
        },
      },
    });
    return !!activeStory;
  }
}

export default StoryQueue;
