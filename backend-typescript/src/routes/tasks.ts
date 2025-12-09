/**
 * Tasks API Routes
 * CRUD operations for tasks
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * Middleware to ensure user is authenticated
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * GET /projects/:projectId/stories/:storyId/tasks
 * List all tasks for a story
 */
router.get(
  "/projects/:projectId/stories/:storyId/tasks",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { projectId, storyId } = req.params;
      const { status, type } = req.query;

      // Verify story belongs to project and user has access
      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          projectId,
          project: {
            userId: (req.user as { id: string }).id,
          },
        },
      });

      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Build filter
      const where: Record<string, unknown> = { storyId };
      if (status) where.status = status;
      if (type) where.type = type;

      const tasks = await prisma.task.findMany({
        where,
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        include: {
          childTasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: {
              codeArtifacts: true,
              testResults: true,
            },
          },
        },
      });

      res.json(tasks);
    } catch (error: unknown) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  }
);

/**
 * GET /projects/:projectId/tasks/:taskId
 * Get a single task with full details
 */
router.get(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { projectId, taskId } = req.params;

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          story: {
            projectId,
            project: {
              userId: (req.user as { id: string }).id,
            },
          },
        },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          childTasks: true,
          codeArtifacts: {
            where: { isLatest: true },
            orderBy: { createdAt: "desc" },
          },
          testResults: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          logs: {
            orderBy: { timestamp: "desc" },
            take: 20,
          },
        },
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(task);
    } catch (error: unknown) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  }
);

/**
 * PATCH /projects/:projectId/tasks/:taskId
 * Update a task
 */
router.patch(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { projectId, taskId } = req.params;
      const { title, description, type, priority, status } = req.body;

      // Verify task exists and user has access
      const existingTask = await prisma.task.findFirst({
        where: {
          id: taskId,
          story: {
            projectId,
            project: {
              userId: (req.user as { id: string }).id,
            },
          },
        },
      });

      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(type && { type }),
          ...(priority !== undefined && { priority }),
          ...(status && { status }),
        },
      });

      res.json(updated);
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  }
);

/**
 * GET /projects/:projectId/agent-logs
 * Get agent activity logs for a project
 */
router.get("/projects/:projectId/agent-logs", requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { agentType, taskId, limit = "50" } = req.query;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: (req.user as { id: string }).id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Build filter
    const where: Record<string, unknown> = { projectId };
    if (agentType) where.agentType = agentType;
    if (taskId) where.taskId = taskId;

    const logs = await prisma.agentLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: parseInt(limit as string),
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json(logs);
  } catch (error: unknown) {
    console.error("Error fetching agent logs:", error);
    res.status(500).json({ error: "Failed to fetch agent logs" });
  }
});

/**
 * GET /projects/:projectId/tasks/:taskId/versions
 * Get all code artifact versions for a task
 */
router.get(
  "/projects/:projectId/tasks/:taskId/versions",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { projectId, taskId } = req.params;
      const { agentType } = req.query;

      // Verify task access
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          story: {
            projectId,
            project: {
              userId: (req.user as { id: string }).id,
            },
          },
        },
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const where: Record<string, unknown> = { taskId };
      if (agentType) where.agentType = agentType;

      const versions = await prisma.codeArtifact.findMany({
        where,
        orderBy: [{ agentType: "asc" }, { version: "desc" }],
        select: {
          id: true,
          agentType: true,
          version: true,
          status: true,
          isLatest: true,
          reviewNotes: true,
          createdAt: true,
          // Don't include full content in list
        },
      });

      res.json(versions);
    } catch (error: unknown) {
      console.error("Error fetching versions:", error);
      res.status(500).json({ error: "Failed to fetch versions" });
    }
  }
);

export default router;
