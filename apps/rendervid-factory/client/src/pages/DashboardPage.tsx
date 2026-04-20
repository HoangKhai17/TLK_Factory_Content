import { useMemo } from "react";
import { Link } from "react-router-dom";
import StatsCard from "../components/dashboard/StatsCard";
import Badge from "../components/common/Badge";
import { Skeleton } from "../components/common/Skeleton";
import { useJobs } from "../hooks/useJobs";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const { jobs, loading } = useJobs();

  const stats = useMemo(() => ({
    total:     jobs.length,
    inProgress: jobs.filter((j) => j.status === "generating" || j.status === "rendering" || j.status === "pending").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed:    jobs.filter((j) => j.status === "failed").length,
  }), [jobs]);

  const recentJobs = useMemo(() =>
    [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [jobs]
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your AI video generation activity</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatsCard
          icon={<IconVideo />}
          iconBg="var(--primary-soft)"
          iconColor="var(--primary)"
          value={stats.total}
          label="Total Videos"
        />
        <StatsCard
          icon={<IconClock />}
          iconBg="#ECFEFF"
          iconColor="var(--cyan)"
          value={stats.inProgress}
          label="In Progress"
        />
        <StatsCard
          icon={<IconCheck />}
          iconBg="#ECFDF5"
          iconColor="#10B981"
          value={stats.completed}
          label="Completed"
        />
        <StatsCard
          icon={<IconX />}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          value={stats.failed}
          label="Failed"
        />
      </div>

      {/* Recent Jobs */}
      <div className="card">
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Jobs</h2>
          <Link
            to="/projects"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}
          >
            View all
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton width={36} height={36} borderRadius="var(--r)" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton height={13} width="60%" />
                  <Skeleton height={11} width="30%" />
                </div>
                <Skeleton height={22} width={72} borderRadius="var(--r-full)" />
              </div>
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 24px" }}>
            <p className="empty-desc">No jobs yet. Head to Projects to generate your first video.</p>
          </div>
        ) : (
          <div className="jobs-table-wrap" style={{ padding: "12px 20px 20px" }}>
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Prompt</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job, idx) => (
                  <tr key={job.id}>
                    <td style={{ color: "var(--text-3)", width: 32 }}>{idx + 1}</td>
                    <td style={{ maxWidth: 320 }}>
                      <span style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontWeight: 500,
                      }}>
                        {job.prompt}
                      </span>
                    </td>
                    <td><Badge status={job.status} /></td>
                    <td style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>{timeAgo(job.createdAt)}</td>
                    <td>
                      <Link
                        to={`/projects/${job.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12, padding: "5px 10px" }}
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* Icons */
function IconVideo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
