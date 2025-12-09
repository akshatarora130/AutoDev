import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import type { CreateStoryParams } from "../types/project.js";
import { eventBus } from "../redis/eventBus.js";

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// Create new story
router.post("/:projectId/stories", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId } = req.params;
    const { title, description, priority, metadata }: CreateStoryParams = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

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

    const story = await prisma.story.create({
      data: {
        projectId,
        title,
        description,
        priority: priority || "medium",
        status: "pending",
        metadata: (metadata || {}) as any,
      },
    });

    // Trigger queue check to start processing (non-blocking)
    eventBus.publish("QUEUE_CHECK", { projectId }).catch((err) => {
      console.error("Failed to publish QUEUE_CHECK event:", err);
    });

    res.status(201).json(story);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create story" });
  }
});

// List all stories for a project
router.get("/:projectId/stories", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId } = req.params;

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

    const stories = await prisma.story.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          orderBy: { priority: "asc" },
        },
      },
    });

    res.json(stories);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch stories" });
  }
});

// Get story details
router.get("/:projectId/stories/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId, id } = req.params;

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

    const story = await prisma.story.findFirst({
      where: {
        id,
        projectId,
      },
      include: {
        tasks: {
          orderBy: { priority: "asc" },
          include: {
            codeArtifacts: true,
            testResults: true,
          },
        },
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    res.json(story);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch story" });
  }
});

// Update story
router.put("/:projectId/stories/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId, id } = req.params;
    const { title, description, priority, status, metadata } = req.body;

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

    const story = await prisma.story.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(metadata !== undefined && { metadata: metadata as any }),
      },
    });

    res.json(story);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update story" });
  }
});

// Delete story
router.delete("/:projectId/stories/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId, id } = req.params;

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

    await prisma.story.delete({
      where: { id },
    });

    res.json({ message: "Story deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete story" });
  }
});

// Trigger agent workflow for a story
router.post("/:projectId/stories/:id/process", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId, id } = req.params;

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

    const story = await prisma.story.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    await prisma.story.update({
      where: { id },
      data: { status: "processing" },
    });

    // TODO: Trigger Typescript backend agent workflow
    // This will be implemented when we set up the Typescript backend
    // For now, just return success
    // In production, this would publish an event to Redis or call the Typescript API

    res.json({ message: "Story processing started", storyId: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to start processing" });
  }
});

// Cancel story execution and rollback changes
router.post("/:projectId/stories/:id/cancel", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { projectId, id } = req.params;
    const { rollback = true } = req.body; // Default to rollback

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

    const story = await prisma.story.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Check if story can be cancelled
    const cancellableStatuses = [
      "pending",
      "dividing",
      "reviewing",
      "tasks_ready",
      "generating",
      "code_review",
      "testing",
    ];
    if (!cancellableStatuses.includes(story.status)) {
      return res.status(400).json({
        error: `Cannot cancel story in '${story.status}' status`,
        message: "Story is already completed, failed, or cancelled",
      });
    }

    // Update story status to cancelled
    await prisma.story.update({
      where: { id },
      data: {
        status: "cancelled",
        failedAt: new Date(),
        failedReason: "Cancelled by user",
      },
    });

    // Update all pending/in-progress tasks to cancelled
    await prisma.task.updateMany({
      where: {
        storyId: id,
        status: { notIn: ["completed", "failed", "tests_passed"] },
      },
      data: { status: "failed" },
    });

    // Perform rollback if requested (and if there are snapshots)
    let rollbackResult: { filesRestored: number; filesDeleted: number } | null = null;
    if (rollback) {
      const snapshots = await prisma.fileSnapshot.count({
        where: { storyId: id },
      });

      if (snapshots > 0) {
        // Import rollback service dynamically to avoid circular deps
        const { rollbackService } = await import("../services/rollbackService.js");
        const result = await rollbackService.rollbackStory(id, projectId);
        rollbackResult = {
          filesRestored: result.filesRestored,
          filesDeleted: result.filesDeleted,
        };
      }
    }

    // Publish cancellation event
    await eventBus.publish("STORY_CANCELLED", {
      storyId: id,
      projectId,
      rolledBack: rollback,
    });

    res.json({
      message: "Story cancelled successfully",
      storyId: id,
      rolledBack: rollback,
      rollbackResult,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to cancel story" });
  }
});

export default router;
