import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { jobsRouter } from "./api/jobs.js";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? "3001");
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? "./output");

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// Serve rendered videos
app.use("/output", express.static(OUTPUT_DIR));

// API routes
app.use("/api/jobs", jobsRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  logger.info(`[server] Running on http://localhost:${PORT}`);
  logger.info(`[server] Output dir: ${OUTPUT_DIR}`);
  logger.info(`[server] CORS origin: ${CLIENT_ORIGIN}`);
});
