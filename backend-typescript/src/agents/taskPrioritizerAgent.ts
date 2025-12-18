/**
 * Task Prioritizer Agent
 * Orders tasks into execution batches based on dependencies using topological sort
 */

import { PrismaClient, type Task } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";

const prisma = new PrismaClient();

export interface TaskBatch {
  batchNumber: number;
  tasks: Task[];
  dependencyIds: string[]; // Task IDs from previous batches this depends on
}

export interface PrioritizationResult {
  batches: TaskBatch[];
  totalTasks: number;
  hasCycles: boolean;
  cycleDetails?: string;
}

export class TaskPrioritizerAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "TASK_PRIORITIZER");
  }

  /**
   * Execute task prioritization for a story
   * Returns tasks ordered by dependency in batches for parallel execution
   */
  async execute(storyId: string): Promise<PrioritizationResult> {
    await this.log("PRIORITIZATION_STARTED", { storyId });

    // Fetch all reviewed tasks for the story (excluding subdivided parent tasks)
    const tasks = await prisma.task.findMany({
      where: {
        storyId,
        status: "reviewed",
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (tasks.length === 0) {
      await this.log("NO_TASKS_TO_PRIORITIZE", { storyId });
      return { batches: [], totalTasks: 0, hasCycles: false };
    }

    await this.log("TASKS_FOUND", { storyId, count: tasks.length });

    // Build dependency graph
    const graph = this.buildDependencyGraph(tasks);

    // Check for cycles
    const cycleCheck = this.detectCycles(graph, tasks);
    if (cycleCheck.hasCycle) {
      await this.log("CYCLE_DETECTED", { storyId, cycle: cycleCheck.cyclePath });
      return {
        batches: [],
        totalTasks: tasks.length,
        hasCycles: true,
        cycleDetails: `Circular dependency detected: ${cycleCheck.cyclePath?.join(" -> ")}`,
      };
    }

    // Topological sort into batches
    const batches = this.topologicalSort(graph, tasks);

    await this.log("PRIORITIZATION_COMPLETED", {
      storyId,
      batchCount: batches.length,
      taskOrder: batches.map((b) => ({
        batch: b.batchNumber,
        tasks: b.tasks.map((t) => t.id),
      })),
    });

    // Publish event
    eventBus.publish("TASKS_PRIORITIZED", {
      storyId,
      projectId: this.projectId,
      batchCount: batches.length,
      totalTasks: tasks.length,
    });

    return { batches, totalTasks: tasks.length, hasCycles: false };
  }

  /**
   * Build adjacency list for dependency graph
   */
  private buildDependencyGraph(tasks: Task[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    const taskIds = new Set(tasks.map((t) => t.id));

    // Initialize all nodes
    for (const task of tasks) {
      graph.set(task.id, new Set());
    }

    // Add edges (task depends on dependency)
    for (const task of tasks) {
      const deps = (task.dependencies as string[]) || [];
      for (const depId of deps) {
        // Only include dependencies that are in our task set
        if (taskIds.has(depId)) {
          graph.get(task.id)!.add(depId);
        }
      }
    }

    return graph;
  }

  /**
   * Detect cycles using DFS
   */
  private detectCycles(
    graph: Map<string, Set<string>>,
    tasks: Task[]
  ): { hasCycle: boolean; cyclePath?: string[] } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const dfs = (nodeId: string, path: string[]): string[] | null => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies = graph.get(nodeId) || new Set();
      for (const depId of dependencies) {
        if (!visited.has(depId)) {
          const cyclePath = dfs(depId, [...path, depId]);
          if (cyclePath) return cyclePath;
        } else if (recursionStack.has(depId)) {
          // Found cycle - return path from depId to current node
          const cycleStart = path.indexOf(depId);
          return [...path.slice(cycleStart), depId];
        }
      }

      recursionStack.delete(nodeId);
      return null;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        const cyclePath = dfs(task.id, [task.id]);
        if (cyclePath) {
          // Convert IDs to task titles for readability
          const namedPath = cyclePath.map((id) => taskMap.get(id)?.title || id);
          return { hasCycle: true, cyclePath: namedPath };
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Topological sort into batches for parallel execution
   */
  private topologicalSort(graph: Map<string, Set<string>>, tasks: Task[]): TaskBatch[] {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const batches: TaskBatch[] = [];

    // Calculate in-degree for each node
    const inDegree = new Map<string, number>();
    for (const task of tasks) {
      inDegree.set(task.id, 0);
    }

    for (const [_nodeId, deps] of graph) {
      for (const depId of deps) {
        inDegree.set(depId, (inDegree.get(depId) || 0) + 1);
      }
    }

    // Wait, this is backwards. In our graph, edges go from task -> dependency
    // We need reverse: dependency -> task (which tasks depend on this one)
    const reversedGraph = new Map<string, Set<string>>();
    for (const task of tasks) {
      reversedGraph.set(task.id, new Set());
    }

    for (const [taskId, deps] of graph) {
      for (const depId of deps) {
        reversedGraph.get(depId)!.add(taskId);
      }
    }

    // Recalculate in-degree: how many dependencies does each task have?
    for (const taskId of graph.keys()) {
      inDegree.set(taskId, graph.get(taskId)!.size);
    }

    const processed = new Set<string>();
    let batchNumber = 0;

    while (processed.size < tasks.length) {
      // Find all tasks with no unprocessed dependencies
      const ready: Task[] = [];
      const dependencyIds: string[] = [];

      for (const [taskId, depCount] of inDegree) {
        if (!processed.has(taskId)) {
          // Check if all dependencies are processed
          const deps = graph.get(taskId) || new Set();
          const allDepsProcessed = Array.from(deps).every((d) => processed.has(d));

          if (allDepsProcessed) {
            const task = taskMap.get(taskId);
            if (task) ready.push(task);
            dependencyIds.push(...Array.from(deps));
          }
        }
      }

      if (ready.length === 0) {
        // Should not happen if no cycles, but safety check
        break;
      }

      // Sort within batch by priority then creation date
      ready.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      batches.push({
        batchNumber,
        tasks: ready,
        dependencyIds: [...new Set(dependencyIds)],
      });

      // Mark as processed
      for (const task of ready) {
        processed.add(task.id);
      }

      batchNumber++;
    }

    return batches;
  }
}

export default TaskPrioritizerAgent;
