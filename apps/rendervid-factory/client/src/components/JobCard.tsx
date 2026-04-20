import type { VideoJob } from "../lib/api.js";

const STATUS_COLOR: Record<VideoJob["status"], string> = {
  pending: "#d97706",
  generating: "#3b82f6",
  rendering: "#6366f1",
  completed: "#10b981",
  failed: "#ef4444",
};

const STATUS_LABEL: Record<VideoJob["status"], string> = {
  pending: "Pending",
  generating: "Generating...",
  rendering: "Rendering...",
  completed: "Completed",
  failed: "Failed",
};

interface Props {
  job: VideoJob;
}

export function JobCard({ job }: Props) {
  const color = STATUS_COLOR[job.status];
  const isActive = job.status === "generating" || job.status === "rendering";
  const isCompleted = job.status === "completed";

  return (
    <div style={{
      background: "#161b27", border: "1px solid #1e2535",
      borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s",
    }}>
      {/* Thumbnail / placeholder */}
      <div style={{ position: "relative", background: "#1a2035", aspectRatio: "16/9", overflow: "hidden" }}>
        {job.thumbnailPath ? (
          <img src={job.thumbnailPath} alt={job.prompt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            {isActive && (
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: color,
                    animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        {isActive && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#0f1117" }}>
            <div style={{ height: "100%", width: `${job.progress}%`, background: `linear-gradient(90deg, #6366f1, #8b5cf6)`, transition: "width 0.5s" }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, flex: 1,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {job.prompt}
          </p>
          <span style={{
            flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "3px 8px",
            borderRadius: 20, background: `${color}20`, color,
          }}>
            {STATUS_LABEL[job.status]}
          </span>
        </div>

        {job.status === "failed" && job.errorMessage && (
          <div style={{ fontSize: 12, color: "#ef4444", background: "#fee2e222", border: "1px solid #fecaca33",
            borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
            {job.errorMessage}
          </div>
        )}

        {isActive && (
          <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 4 }}>
            {job.progress}% — {STATUS_LABEL[job.status]}
          </div>
        )}

        {isCompleted && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {job.outputPath && (
              <>
                <a
                  href={job.outputPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Watch
                </a>
                <a
                  href={job.outputPath}
                  download
                  className="btn btn-secondary btn-sm"
                >
                  Download
                </a>
              </>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: "#334155", marginTop: 10 }}>
          {new Date(job.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
