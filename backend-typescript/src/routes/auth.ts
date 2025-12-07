import { Router, type Request, type Response } from "express";
import passport from "../config/passport.js";

const router = Router();

router.get("/github", passport.authenticate("github", { scope: ["user:email", "repo"] }));

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/dashboard`);
  }
);

router.get("/me", (req: Request, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const user = req.user as
      | {
          id: string;
          username: string;
          githubId: string;
          email?: string | null;
          avatarUrl?: string | null;
        }
      | undefined;
    res.json({
      id: user?.id,
      username: user?.username,
      githubId: user?.githubId,
      email: user?.email,
      avatarUrl: user?.avatarUrl,
    });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.logout((err: any) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return res.status(500).json({ error: "Session destruction failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

export default router;
