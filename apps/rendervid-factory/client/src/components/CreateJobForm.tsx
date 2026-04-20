import { useState, FormEvent } from "react";

interface Props {
  onSubmit: (prompt: string, resolution: string, duration: number) => Promise<void>;
}

const RESOLUTIONS = [
  { value: "1920x1080", label: "1920×1080 — Landscape (YouTube)" },
  { value: "1280x720", label: "1280×720 — HD Landscape" },
  { value: "1080x1920", label: "1080×1920 — Portrait (Reels/Shorts)" },
  { value: "1080x1080", label: "1080×1080 — Square" },
];

export function CreateJobForm({ onSubmit }: Props) {
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("1920x1080");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(prompt.trim(), resolution, duration);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
          Video Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to create... e.g. 'Explain how blockchain works in simple terms'"
          rows={4}
          required
          style={{
            width: "100%", background: "#1e2535", border: "1px solid #2d3748",
            borderRadius: 10, padding: "12px 14px", color: "#e2e8f0",
            fontSize: 14, resize: "vertical", fontFamily: "inherit", outline: "none",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
            Resolution
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            style={{
              width: "100%", background: "#1e2535", border: "1px solid #2d3748",
              borderRadius: 10, padding: "10px 12px", color: "#e2e8f0",
              fontSize: 13, outline: "none", cursor: "pointer",
            }}
          >
            {RESOLUTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
            Duration — {duration}s
          </label>
          <input
            type="range" min={5} max={120} value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={{ width: "100%", marginTop: 6, accentColor: "#6366f1" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginTop: 2 }}>
            <span>5s</span><span>120s</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={loading || !prompt.trim()}>
        {loading ? "Creating..." : "Generate Video"}
      </button>
    </form>
  );
}
