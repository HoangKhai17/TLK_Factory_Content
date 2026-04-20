import type { VideoJob, CreateJobRequest, CreateJobResponse, JobsResponse, JobResponse } from "../../../shared/types";

const BASE = "/api";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot connect to server. Make sure the backend is running.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errField = (body as { error?: unknown }).error;
    const msg =
      typeof errField === "string"
        ? errField
        : errField != null
        ? JSON.stringify(errField)
        : `HTTP ${res.status}`;
    throw new Error(msg);
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
