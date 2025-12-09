/**
 * Logs Routes
 * API endpoints for accessing agent activity logs
 */

import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/projects/:projectId/stories/:storyId/logs
 * Get all agent logs for a specific story
 */
router.get("/:projectId/stories/:storyId/logs", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId, storyId } = req.params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Verify story exists in project
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        projectId,
      },
      include: {
        tasks: {
          select: { id: true },
        },
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Get task IDs for this story
    const taskIds = story.tasks.map((t) => t.id);

    // Fetch logs for:
    // 1. Story-level logs (via projectId and matching storyId in data)
    // 2. Task-level logs (via taskId)
    const logs = await prisma.agentLog.findMany({
      where: {
        projectId,
        OR: [
          // Task-specific logs
          { taskId: { in: taskIds } },
          // Story-level logs (check data.storyId)
          {
            data: {
              path: ["storyId"],
              equals: storyId,
            },
          },
        ],
      },
      orderBy: { timestamp: "asc" },
      take: 200, // Limit to last 200 logs
    });

    res.json(logs);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch logs";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/projects/:projectId/logs
 * Get all agent logs for a project (for project-level activity view)
 */
router.get("/:projectId/logs", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Fetch recent logs for the project
    const logs = await prisma.agentLog.findMany({
      where: { projectId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    res.json(logs.reverse()); // Return in chronological order
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch logs";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
