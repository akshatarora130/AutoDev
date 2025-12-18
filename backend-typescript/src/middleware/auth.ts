import { type Request, type Response, type NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    githubId: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};
