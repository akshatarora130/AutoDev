import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { fileService } from "../services/fileService.js";
import { githubImportService } from "../services/githubImport.js";
import type { CreateProjectParams, ImportProjectParams } from "../types/project.js";

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(requireAuth);

// Create new empty project
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name, description, source, githubUrl }: CreateProjectParams = req.body;

    if (!name || !source) {
      return res.status(400).json({ error: "Name and source are required" });
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        source,
        githubUrl: githubUrl || null,
      },
    });

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create project" });
  }
});

// Import project from GitHub
router.post("/import", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { owner, repo, name, description }: ImportProjectParams = req.body;

    if (!owner || !repo) {
      return res.status(400).json({ error: "Owner and repo are required" });
    }

    const project = await githubImportService.importRepository(
      user.id,
      owner,
      repo,
      name,
      description
    );

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to import project" });
  }
});

// List user's projects
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch projects" });
  }
});

// Get project details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch project" });
  }
});

// Get all files in project
router.get("/:id/files", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const files = await fileService.getProjectFiles(id);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch files" });
  }
});

// Get file tree
router.get("/:id/tree", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const tree = await fileService.getFileTree(id);
    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch file tree" });
  }
});

// Get specific file content
router.get("/:id/files/*", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;
    const filePath = req.params[0];

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const file = await fileService.getFile(id, filePath);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(file);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch file" });
  }
});

// Update file content
router.put("/:id/files/*", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;
    const filePath = req.params[0];
    const { content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    if (content === undefined) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const file = await fileService.updateFile(id, filePath, content);
    res.json(file);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update file" });
  }
});

export default router;
