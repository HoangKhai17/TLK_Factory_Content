import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export const VIDEO_QUEUE = "video-render";

export const videoQueue = new Queue(VIDEO_QUEUE, { connection });

export const videoQueueEvents = new QueueEvents(VIDEO_QUEUE, { connection });

export interface VideoJobData {
  jobId: string;
  prompt: string;
  resolution: string;
  duration: number;
}
