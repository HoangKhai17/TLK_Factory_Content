import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../common/Badge";
import Modal from "../common/Modal";
import type { VideoJob } from "@shared/types";

interface ProjectCardProps {
  job: VideoJob;
  onDelete: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProjectCard({ job, onDelete }: ProjectCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    } catch {
      /* ignore */
    }
    onDelete(job.id);
    setConfirmOpen(false);
  };

  const isActive = job.status === "generating" || job.status === "rendering";

  return (
    <>
      <div className="card project-card card-hover">
        {/* Thumbnail */}
        <div className="project-thumb">
          {job.thumbnailPath ? (
            <img src={`/output/${job.id}/thumbnail.jpg`} alt={job.prompt} />
          ) : (
            <div className="project-thumb-placeholder">
              {isActive ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div className="spinner spinner-dark" />
                  <span style={{ fontSize: 11 }}>Processing…</span>
                </div>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <span style={{ fontSize: 11 }}>No preview</span>
                </>
              )}
            </div>
          )}

          {/* Progress overlay */}
          {isActive && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
              padding: "12px 12px 8px",
            }}>
              <div className="progress-bar-wrap" style={{ height: 3 }}>
                <div className="progress-bar-fill" style={{ width: `${job.progress}%` }} />
              </div>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 600, marginTop: 4, display: "block" }}>
                {job.progress}%
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="project-body">
          <p className="project-title" title={job.prompt}>{job.prompt}</p>
          <div className="project-meta">
            <Badge status={job.status} />
            <span className="project-time">{timeAgo(job.createdAt)}</span>
          </div>

          {job.errorMessage && (
            <p style={{ fontSize: 11.5, color: "var(--s-failed-fg)", marginBottom: 10, lineHeight: 1.4 }}>
              {job.errorMessage}
            </p>
          )}

          <div className="project-actions">
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => navigate(`/projects/${job.id}`)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              View
            </button>
            <button
              className="btn btn-danger btn-sm btn-icon"
              onClick={() => setConfirmOpen(true)}
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      <Modal
        open={confirmOpen}
        title="Delete Project"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><span className="spinner" style={{ width: 13, height: 13, borderColor: "rgba(239,68,68,0.3)", borderTopColor: "#EF4444" }} /> Deleting…</> : "Delete"}
            </button>
          </>
        }
      >
        Are you sure you want to delete this project? This action cannot be undone.
      </Modal>
    </>
  );
}
