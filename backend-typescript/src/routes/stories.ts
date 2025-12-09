import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import type { CreateStoryParams } from "../types/project.js";

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

    // TODO: Trigger Python backend agent workflow
    // This will be implemented when we set up the Python backend
    // For now, just return success
    // In production, this would publish an event to Redis or call the Python API

    res.json({ message: "Story processing started", storyId: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to start processing" });
  }
});

export default router;
