import type { VideoJob, CreateJobRequest, CreateJobResponse, JobsResponse, JobResponse } from "../../../shared/types";

const BASE = "/api";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createJob: (data: CreateJobRequest) =>
    req<CreateJobResponse>("/jobs", { method: "POST", body: JSON.stringify(data) }),

  listJobs: () => req<JobsResponse>("/jobs").then((r) => r.jobs),

  getJob: (id: string) => req<JobResponse>(`/jobs/${id}`).then((r) => r.job),
};

export type { VideoJob };
