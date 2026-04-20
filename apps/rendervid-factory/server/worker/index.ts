import "dotenv/config";
import { Worker } from "bullmq";
import { connection, VIDEO_QUEUE } from "../queue/index.js";
import type { VideoJobData } from "../queue/index.js";
import { generateVideoSpec } from "../services/ai.js";
import { renderVideo } from "../services/renderer.js";
import { setStatus, updateJob } from "../utils/store.js";
import { logger } from "../utils/logger.js";
import type { VideoSpec } from "../../shared/types.js";

const worker = new Worker<VideoJobData>(
  VIDEO_QUEUE,
  async (job) => {
    const { jobId, prompt, resolution, duration } = job.data;
    logger.info(`[worker] Processing job ${jobId}: "${prompt.slice(0, 50)}..."`);

    try {
      // Step 1: Generate AI spec
      setStatus(jobId, "generating", 5);
      const spec = await generateVideoSpec(prompt, resolution as VideoSpec["resolution"], duration);
      updateJob(jobId, { spec, status: "rendering", progress: 10 });

      // Step 2: Render video
      setStatus(jobId, "rendering", 10);
      const result = await renderVideo(jobId, spec, (progress) => {
        updateJob(jobId, { progress });
      });

      // Step 3: Done
      updateJob(jobId, {
        status: "completed",
        progress: 100,
        outputPath: result.outputPath,
        thumbnailPath: result.thumbnailPath,
      });
      logger.info(`[worker] Job ${jobId} completed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[worker] Job ${jobId} failed:`, msg);
      updateJob(jobId, { status: "failed", errorMessage: msg });
      throw err;
    }
  },
  {
    connection,
    concurrency: 2,
    limiter: { max: 5, duration: 60_000 },
  }
);

worker.on("completed", (job) => logger.info(`[worker] ✓ ${job.id}`));
worker.on("failed", (job, err) => logger.error(`[worker] ✗ ${job?.id}:`, err.message));

logger.info("[worker] Started — waiting for jobs...");
