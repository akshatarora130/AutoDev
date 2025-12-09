/**
 * Base Agent
 * Abstract base class for all agents with shared functionality
 */

import { PrismaClient } from "@prisma/client";
import { ProjectMemory } from "../supermemory/projectMemory.js";
import { llmClient } from "../llm/client.js";
import type { ContextResult } from "../types/agent.js";

const prisma = new PrismaClient();

/**
 * Abstract base class for all agents
 */
export abstract class BaseAgent {
  protected projectId: string;
  protected name: string;
  protected memory: ProjectMemory;

  constructor(projectId: string, name: string) {
    this.projectId = projectId;
    this.name = name;
    this.memory = new ProjectMemory(projectId);
  }

  /**
   * Get project context from Supermemory before execution
   */
  protected async getProjectContext(query: string): Promise<string> {
    try {
      const context: ContextResult = await this.memory.getContext(query);

      if (context.relevantFiles.length === 0) {
        return "No existing project context available.";
      }

      return context.relevantFiles.map((f) => `File: ${f.path}\n${f.content}`).join("\n\n---\n\n");
    } catch (error) {
      console.error("Failed to get project context:", error);
      return "Failed to retrieve project context.";
    }
  }

  /**
   * Call LLM with a prompt
   */
  protected async callLLM(prompt: string, options?: { model?: string }): Promise<string> {
    return llmClient.complete(prompt, options);
  }

  /**
   * Call LLM and parse JSON response
   */
  protected async callLLMJSON<T>(prompt: string, options?: { model?: string }): Promise<T> {
    return llmClient.completeJSON<T>(prompt, {
      ...options,
      // Always use a JSON-focused system prompt for JSON responses
      systemPrompt:
        "You are a helpful AI assistant. You ALWAYS respond with valid JSON only. No explanations, no markdown code blocks, no text before or after the JSON. Just pure, valid JSON.",
      temperature: 0.3, // Lower temperature for more consistent JSON output
    });
  }

  /**
   * Log agent action to database
   */
  protected async log(
    event: string,
    data: Record<string, unknown>,
    taskId?: string
  ): Promise<void> {
    try {
      await prisma.agentLog.create({
        data: {
          projectId: this.projectId,
          taskId,
          agentType: this.name,
          event,
          data: data as object,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to log agent action: ${event}`, error);
    }
  }

  /**
   * Execute the agent's main task
   * Must be implemented by each agent
   */
  abstract execute(input: unknown): Promise<unknown>;
}

export default BaseAgent;
