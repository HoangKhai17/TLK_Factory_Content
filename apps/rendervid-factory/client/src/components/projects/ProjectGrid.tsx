import ProjectCard from "./ProjectCard";
import { SkeletonCard } from "../common/Skeleton";
import type { VideoJob } from "@shared/types";

interface ProjectGridProps {
  jobs: VideoJob[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export default function ProjectGrid({ jobs, loading, onDelete }: ProjectGridProps) {
  if (loading) {
    return (
      <div className="projects-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <p className="empty-title">No projects yet</p>
          <p className="empty-desc">Generate your first video using the form above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-grid">
      {jobs.map((job) => (
        <ProjectCard key={job.id} job={job} onDelete={onDelete} />
      ))}
    </div>
  );
}
