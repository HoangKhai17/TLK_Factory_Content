type JobStatus = "pending" | "generating" | "rendering" | "completed" | "failed";

interface BadgeProps {
  status: JobStatus;
}

const LABEL: Record<JobStatus, string> = {
  pending:    "Pending",
  generating: "Generating",
  rendering:  "Rendering",
  completed:  "Completed",
  failed:     "Failed",
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {LABEL[status]}
    </span>
  );
}
