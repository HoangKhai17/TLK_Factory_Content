import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api.js";
import type { VideoJob } from "../lib/api.js";

const POLL_MS = 3000;

export function useJobs() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await api.listJobs();
      setJobs(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        fetchJobs().finally(schedule);
      }, POLL_MS);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fetchJobs]);

  const createJob = useCallback(async (prompt: string, resolution: string, duration: number) => {
    const { jobId } = await api.createJob({
      prompt,
      resolution: resolution as "1920x1080" | "1280x720" | "1080x1920" | "1080x1080",
      duration,
    });
    await fetchJobs();
    return jobId;
  }, [fetchJobs]);

  const hasActive = jobs.some((j) => j.status === "generating" || j.status === "rendering");

  return { jobs, loading, error, createJob, refresh: fetchJobs, hasActive };
}
