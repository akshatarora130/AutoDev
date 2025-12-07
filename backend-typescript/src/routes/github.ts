import { Router, type Request, type Response } from "express";
import { githubService } from "../services/github.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get("/repos", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const repos = await githubService.listRepositories(user.id);
    res.json(repos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch repositories" });
  }
});

router.get("/repos/:owner/:repo", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { owner, repo } = req.params;
    const repository = await githubService.getRepository(user.id, owner, repo);
    res.json(repository);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch repository" });
  }
});

router.post("/repos", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name, description, private: isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    const repository = await githubService.createRepository(user.id, {
      name,
      description,
      private: isPrivate,
    });

    res.status(201).json(repository);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create repository" });
  }
});

router.get("/repos/:owner/:repo/branches", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { owner, repo } = req.params;
    const branches = await githubService.getBranches(user.id, owner, repo);
    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch branches" });
  }
});

router.get("/repos/:owner/:repo/commits", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { owner, repo } = req.params;
    const branch = (req.query.branch as string) || "main";
    const perPage = parseInt((req.query.per_page as string) || "30", 10);

    const commits = await githubService.getCommits(user.id, owner, repo, branch, perPage);
    res.json(commits);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch commits" });
  }
});

// IMPORTANT: tree route must come BEFORE contents/* route to avoid route matching conflicts
router.get("/repos/:owner/:repo/tree", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { owner, repo } = req.params;
    const branch = (req.query.branch as string) || "main";
    const recursive = req.query.recursive === "1";

    const tree = await githubService.getRepoTree(user.id, owner, repo, branch, recursive);
    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch repository tree" });
  }
});

router.get("/repos/:owner/:repo/contents/*", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { owner, repo } = req.params;
    const path = req.params[0];
    const branch = (req.query.branch as string) || "main";

    if (!path) {
      return res.status(400).json({ error: "File path is required" });
    }

    const content = await githubService.getFileContent(user.id, owner, repo, path, branch);
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch file content" });
  }
});

router.post("/repos/:owner/:repo/commit", async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { owner, repo } = req.params;
    const { branch, message, files } = req.body;

    if (!branch || !message || !files || !Array.isArray(files)) {
      return res.status(400).json({
        error: "Branch, message, and files array are required",
      });
    }

    const commit = await githubService.commitFiles(user.id, {
      owner,
      repo,
      branch,
      message,
      files,
    });

    res.status(201).json(commit);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to commit files" });
  }
});

export default router;
