import express, { type Request, type Response } from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import githubRoutes from "./routes/github.js";
import projectRoutes from "./routes/projects.js";
import storyRoutes from "./routes/stories.js";
import taskRoutes from "./routes/tasks.js";
import logsRoutes from "./routes/logs.js";
import { getRedisClient, closeRedisConnections, startListening } from "./redis/index.js";
import { getOrchestrator } from "./agents/orchestrator.js";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "typescript-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", storyRoutes);
app.use("/api/projects", logsRoutes);
app.use("/api", taskRoutes);

const PORT = parseInt(process.env.PORT || "3000", 10);

/**
 * Initialize Redis and Orchestrator
 */
async function initializeAgentSystem(): Promise<void> {
  try {
    // Connect to Redis
    await getRedisClient();
    console.log("✅ Redis connected");

    // Start event bus listener
    await startListening();
    console.log("✅ Event bus listening");

    // Start the orchestrator
    const orchestrator = getOrchestrator();
    await orchestrator.start();
    console.log("✅ Orchestrator started");
  } catch (error) {
    console.error("⚠️ Failed to initialize agent system:", error);
    console.log("⚠️ Server will run without agent processing");
  }
}

const server = app.listen(PORT, async () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🚀 TypeScript Backend starting...`);
  console.log(`[${timestamp}] ✅ Server running on http://localhost:${PORT}`);
  console.log(`[${timestamp}] 📊 Health check: http://localhost:${PORT}/health`);

  // Initialize agent system after server is ready
  await initializeAgentSystem();
});

const shutdown = async () => {
  console.log("\n🛑 Shutting down server...");

  // Stop orchestrator
  const orchestrator = getOrchestrator();
  orchestrator.stop();

  // Close Redis connections
  await closeRedisConnections();

  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { app };
