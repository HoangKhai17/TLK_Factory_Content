import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { videoQueue } from "../queue/index.js";
import { createJob, getJob, listJobs } from "../utils/store.js";
import type { CreateJobResponse, JobResponse, JobsResponse } from "../../shared/types.js";

export const jobsRouter = Router();

const CreateJobSchema = z.object({
  prompt: z.string().min(1).max(1000),
  resolution: z.enum(["1920x1080", "1280x720", "1080x1920", "1080x1080"]).optional().default("1920x1080"),
  duration: z.number().int().min(5).max(120).optional().default(30),
});

jobsRouter.post("/", async (req, res) => {
  const parsed = CreateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { prompt, resolution, duration } = parsed.data;
  const jobId = uuidv4();

  createJob(jobId, prompt);

  await videoQueue.add("render", { jobId, prompt, resolution, duration }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  });

  const response: CreateJobResponse = { jobId };
  return res.status(201).json(response);
});

jobsRouter.get("/", (_req, res) => {
  const response: JobsResponse = { jobs: listJobs() };
  res.json(response);
});

jobsRouter.get("/:id", (req, res) => {
  const job = getJob(req.params.id!);
  if (!job) return res.status(404).json({ error: "Job not found" });
  const response: JobResponse = { job };
  return res.json(response);
});
