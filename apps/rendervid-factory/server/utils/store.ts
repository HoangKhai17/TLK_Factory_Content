import type { VideoJob, JobStatus } from "../../shared/types.js";

const jobs = new Map<string, VideoJob>();

export function createJob(id: string, prompt: string): VideoJob {
  const now = new Date().toISOString();
  const job: VideoJob = { id, prompt, status: "pending", progress: 0, createdAt: now, updatedAt: now };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): VideoJob | undefined {
  return jobs.get(id);
}

export function listJobs(): VideoJob[] {
  return [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateJob(id: string, patch: Partial<Omit<VideoJob, "id" | "createdAt">>): VideoJob | null {
  const job = jobs.get(id);
  if (!job) return null;
  const updated: VideoJob = { ...job, ...patch, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
}

export function setStatus(id: string, status: JobStatus, progress?: number): void {
  updateJob(id, { status, ...(progress !== undefined ? { progress } : {}) });
}
