import { useState, useMemo } from "react";
import ProjectGrid from "../components/projects/ProjectGrid";
import { useJobs } from "../hooks/useJobs";

type Filter = "all" | "active" | "completed" | "failed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "active",    label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "failed",    label: "Failed" },
];

const RESOLUTIONS = [
  { value: "1920x1080", label: "1920×1080 (YouTube Landscape)" },
  { value: "1280x720",  label: "1280×720 (HD Landscape)" },
  { value: "1080x1920", label: "1080×1920 (Reels / Shorts)" },
  { value: "1080x1080", label: "1080×1080 (Square)" },
];

const STYLES = [
  { value: "cinematic",   label: "Cinematic" },
  { value: "minimalist",  label: "Minimalist" },
  { value: "animated",    label: "Animated" },
  { value: "documentary", label: "Documentary" },
];

export default function ProjectsPage() {
  const { jobs, loading, error, createJob, refresh } = useJobs();

  const [filter, setFilter] = useState<Filter>("all");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [localJobs, setLocalJobs] = useState<string[]>([]);

  // Form state
  const [prompt, setPrompt]         = useState("");
  const [resolution, setResolution] = useState("1920x1080");
  const [style, setStyle]           = useState("cinematic");
  const [duration, setDuration]     = useState(30);
  const [batch, setBatch]           = useState(1);

  const filtered = useMemo(() => {
    const base = jobs.filter((j) => !localJobs.includes(j.id) || true);
    const visible = base.filter((j) => !localJobs.includes("del:" + j.id));
    if (filter === "all")       return visible;
    if (filter === "active")    return visible.filter((j) => j.status === "generating" || j.status === "rendering" || j.status === "pending");
    if (filter === "completed") return visible.filter((j) => j.status === "completed");
    if (filter === "failed")    return visible.filter((j) => j.status === "failed");
    return visible;
  }, [jobs, filter, localJobs]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError(null);
    try {
      for (let i = 0; i < batch; i++) {
        await createJob(prompt.trim(), resolution as any, duration);
      }
      setPrompt("");
      await refresh();
    } catch (e: any) {
      setGenError(e.message ?? "Failed to create job");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    setLocalJobs((prev) => [...prev, "del:" + id]);
    refresh();
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">Generate and manage your AI videos</p>
      </div>

      {/* Generate form */}
      <div className="form-section" style={{ marginBottom: 28 }}>
        <h2 className="form-title">
          <span style={{
            width: 28, height: 28, borderRadius: "var(--r)",
            background: "var(--gradient-btn)", display: "inline-flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </span>
          Generate New Video
        </h2>

        {genError && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {genError}
          </div>
        )}

        {/* Prompt */}
        <div className="form-group">
          <label className="form-label">Prompt *</label>
          <textarea
            className="form-textarea"
            placeholder="Describe the video you want to generate…  e.g. 'A product explainer about AI tools with modern animations'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-row">
          {/* Resolution */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Resolution</label>
            <div style={{ position: "relative" }}>
              <select
                className="form-select"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                style={{ paddingRight: 36 }}
              >
                {RESOLUTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Style */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Style</label>
            <div style={{ position: "relative" }}>
              <select
                className="form-select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={{ paddingRight: 36 }}
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 16 }}>
          {/* Duration */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Duration
              <span style={{ fontWeight: 400, color: "var(--text-3)", marginLeft: 6 }}>{duration}s</span>
            </label>
            <input
              type="range" min={5} max={120} step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="form-hint">5s</span>
              <span className="form-hint">120s</span>
            </div>
          </div>

          {/* Batch */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Batch
              <span style={{ fontWeight: 400, color: "var(--text-3)", marginLeft: 6 }}>{batch} video{batch > 1 ? "s" : ""}</span>
            </label>
            <input
              type="range" min={1} max={10} step={1}
              value={batch}
              onChange={(e) => setBatch(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="form-hint">1</span>
              <span className="form-hint">10</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
          >
            {generating ? (
              <><span className="spinner" /> Generating…</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Generate Video
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter tabs + grid */}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
              style={filter !== f.value ? { border: "1px solid var(--border)" } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: "var(--text-3)" }}>
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <ProjectGrid jobs={filtered} loading={loading} onDelete={handleDelete} />
    </div>
  );
}
