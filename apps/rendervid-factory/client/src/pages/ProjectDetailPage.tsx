import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import { Skeleton } from "../components/common/Skeleton";
import { api } from "../lib/api";
import type { VideoJob } from "@shared/types";

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob]               = useState<VideoJob | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        const data = await api.getJob(id);
        if (active) setJob(data);
      } catch (e: any) {
        if (active) setError(e.message ?? "Failed to load job");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    // Poll while active
    const interval = setInterval(async () => {
      try {
        const data = await api.getJob(id!);
        if (active) setJob(data);
      } catch {
        /* ignore */
      }
    }, 3000);

    return () => { active = false; clearInterval(interval); };
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      navigate("/projects");
    } catch (e: any) {
      setError(e.message ?? "Delete failed");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <Skeleton height={28} width={200} />
        </div>
        <div className="detail-layout">
          <Skeleton height={360} borderRadius="var(--r-xl)" />
          <div className="card detail-meta-card">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="detail-meta-item">
                <Skeleton height={11} width={60} />
                <Skeleton height={14} width="80%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div>
        <div className="alert alert-error" style={{ marginTop: 24 }}>
          {error ?? "Job not found."}
        </div>
        <Link to="/projects" className="btn btn-secondary btn-sm">← Back to Projects</Link>
      </div>
    );
  }

  const isActive    = job.status === "generating" || job.status === "rendering";
  const isCompleted = job.status === "completed";

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Link to="/projects" style={{ color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </Link>
            <span style={{ color: "var(--text-3)" }}>/</span>
            <Badge status={job.status} />
          </div>
          <h1 className="page-title" style={{ fontSize: 18 }}>Project Detail</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isCompleted && (
            <a
              className="btn btn-primary"
              href={`/output/${job.id}/output.mp4`}
              download
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </a>
          )}
          <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="detail-layout">
        {/* Left: video player */}
        <div>
          <div className="video-player-wrap" style={{ marginBottom: 16 }}>
            {isCompleted ? (
              <video
                controls
                preload="metadata"
                src={`/output/${job.id}/output.mp4`}
                poster={job.thumbnailPath ? `/output/${job.id}/thumbnail.jpg` : undefined}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 16, background: "#0a0a0a",
                minHeight: 240,
              }}>
                {isActive ? (
                  <>
                    <div style={{ position: "relative" }}>
                      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: "rgba(6,179,237,0.2)", borderTopColor: "var(--cyan)" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                        {job.status === "generating" ? "Generating script…" : "Rendering video…"}
                      </p>
                      <div style={{ width: 200, margin: "0 auto" }}>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{ width: `${job.progress}%` }} />
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 6 }}>
                          {job.progress}% complete
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10, opacity: 0.5 }}>
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <p style={{ fontSize: 13 }}>No video available</p>
                    {job.errorMessage && (
                      <p style={{ fontSize: 12, color: "#EF4444", marginTop: 8, maxWidth: 280 }}>{job.errorMessage}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prompt */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
              Prompt
            </p>
            <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.6 }}>{job.prompt}</p>
          </div>
        </div>

        {/* Right: metadata */}
        <div>
          <div className="card detail-meta-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text-1)" }}>
              Metadata
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>Job information</p>

            <div className="detail-meta-item">
              <span className="detail-meta-key">Job ID</span>
              <span className="detail-meta-value" style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-2)" }}>
                {job.id.slice(0, 16)}…
              </span>
            </div>

            <div className="detail-meta-item">
              <span className="detail-meta-key">Status</span>
              <span className="detail-meta-value"><Badge status={job.status} /></span>
            </div>

            {job.spec && (
              <>
                <div className="detail-meta-item">
                  <span className="detail-meta-key">Title</span>
                  <span className="detail-meta-value">{job.spec.title}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-key">Resolution</span>
                  <span className="detail-meta-value">{job.spec.resolution}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-key">Duration</span>
                  <span className="detail-meta-value">{job.spec.duration}s</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-key">FPS</span>
                  <span className="detail-meta-value">{job.spec.fps}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-key">Scenes</span>
                  <span className="detail-meta-value">{job.spec.scenes.length} scenes</span>
                </div>
              </>
            )}

            {isActive && (
              <div className="detail-meta-item">
                <span className="detail-meta-key">Progress</span>
                <div style={{ marginTop: 6 }}>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill" style={{ width: `${job.progress}%` }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, display: "block" }}>
                    {job.progress}%
                  </span>
                </div>
              </div>
            )}

            <div className="detail-meta-item">
              <span className="detail-meta-key">Created</span>
              <span className="detail-meta-value" style={{ fontSize: 12 }}>{fmt(job.createdAt)}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-key">Updated</span>
              <span className="detail-meta-value" style={{ fontSize: 12 }}>{fmt(job.updatedAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {isCompleted && (
              <a
                className="btn btn-primary"
                href={`/output/${job.id}/output.mp4`}
                download
                style={{ justifyContent: "center" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Video
              </a>
            )}
            <button
              className="btn btn-danger"
              style={{ justifyContent: "center" }}
              onClick={() => setDeleteOpen(true)}
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        title="Delete Project"
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        This will permanently delete the project and its video file. This action cannot be undone.
      </Modal>
    </div>
  );
}
