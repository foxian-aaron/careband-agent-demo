import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { getDb } from "./db.js";
import { agentRouter } from "./routes/agent.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { eldersRouter } from "./routes/elders.js";
import { eventsRouter } from "./routes/events.js";
import { importRouter } from "./routes/import.js";
import { snapshotsRouter } from "./routes/snapshots.js";
import { tasksRouter } from "./routes/tasks.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const distPath = path.join(projectRoot, "dist");
const app = express();
const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  const db = getDb();
  const elderCount = db.prepare("SELECT COUNT(*) AS count FROM elders").get().count;
  res.json({
    ok: true,
    service: "careband-agent-backend",
    version: "0.2.0",
    elders: elderCount,
    agent_mode:
      !process.env.OPENAI_API_KEY || process.env.USE_MOCK_AGENT === "true"
        ? "mock"
        : "openai",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/elders", eldersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/snapshots", snapshotsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/import", importRouter);
app.use("/api/agent", agentRouter);
app.use("/api/tasks", tasksRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "API route not found." });
});

if (fs.existsSync(path.join(distPath, "index.html"))) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ ok: false, error: "请求格式不正确", details: error.flatten() });
    return;
  }

  res.status(500).json({
    ok: false,
    error: error.message ?? "未知错误",
  });
});

getDb();

app.listen(port, () => {
  console.log(`CareBand Agent backend listening on http://localhost:${port}`);
});
