export type JobStatus = "pending" | "generating" | "rendering" | "completed" | "failed";

export interface Scene {
  id: string;
  type: "intro" | "text" | "bullets" | "outro" | "split" | "cards";
  duration: number; // seconds
  title?: string;
  content?: string;
  bullets?: string[];
  left?: string;
  right?: string;
  cards?: Array<{ title: string; body?: string; icon?: string }>;
  background?: string;
  textColor?: string;
}

export interface VideoSpec {
  title: string;
  description: string;
  resolution: "1920x1080" | "1280x720" | "1080x1920" | "1080x1080";
  fps: number;
  duration: number; // total seconds
  background: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  font: string;
  scenes: Scene[];
}

export interface VideoJob {
  id: string;
  prompt: string;
  status: JobStatus;
  progress: number; // 0–100
  spec?: VideoSpec;
  outputPath?: string;
  thumbnailPath?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  prompt: string;
  resolution?: VideoSpec["resolution"];
  duration?: number;
}

export interface JobsResponse {
  jobs: VideoJob[];
}

export interface JobResponse {
  job: VideoJob;
}

export interface CreateJobResponse {
  jobId: string;
}
