import { useState } from "react";
import { CreateJobForm } from "./components/CreateJobForm.js";
import { JobCard } from "./components/JobCard.js";
import { useJobs } from "./hooks/useJobs.js";

export default function App() {
  const { jobs, loading, error, createJob, hasActive } = useJobs();
  const [showForm, setShowForm] = useState(true);

  async function handleCreate(prompt: string, resolution: string, duration: number) {
    await createJob(prompt, resolution, duration);
    setShowForm(false);
  }

  const completed = jobs.filter((j) => j.status === "completed");
  const active = jobs.filter((j) => j.status === "generating" || j.status === "rendering" || j.status === "pending");
  const failed = jobs.filter((j) => j.status === "failed");

  return (
    <div style={{ minHeight: "100vh", padding: "0 0 60px" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #161b27, #1e2535)",
        borderBottom: "1px solid #1e2535", padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>AI Video Factory</h1>
            <p style={{ fontSize: 12, color: "#475569" }}>Powered by Gemini + ffmpeg</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {hasActive && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6366f1" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
              {active.length} job{active.length !== 1 ? "s" : ""} running
            </div>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Hide Form" : "+ New Video"}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Create form */}
        {showForm && (
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 16, padding: 24, marginBottom: 32,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#e2e8f0" }}>
              Create New Video
            </h2>
            <CreateJobForm onSubmit={handleCreate} />
          </div>
        )}

        {error && (
          <div style={{ background: "#fee2e222", border: "1px solid #fecaca33", borderRadius: 10,
            padding: "12px 16px", color: "#ef4444", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Active jobs */}
        {active.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#6366f1", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              In Progress ({active.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {active.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Completed jobs */}
        {completed.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#10b981", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Completed ({completed.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {completed.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Failed jobs */}
        {failed.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Failed ({failed.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {failed.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#334155" }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: "0 auto 16px" }}>
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No videos yet</p>
            <p style={{ fontSize: 13 }}>Create your first AI video above</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#475569", fontSize: 14 }}>
            Loading...
          </div>
        )}
      </main>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
