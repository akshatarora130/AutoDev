import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "deployment-service" });
});

const PORT = parseInt(process.env.PORT || "3002", 10);

const server = app.listen(PORT, () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🚀 Deployment Service starting...`);
  console.log(`[${timestamp}] ✅ Server running on http://localhost:${PORT}`);
  console.log(`[${timestamp}] 📊 Health check: http://localhost:${PORT}/health`);
});

const shutdown = () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { app };
