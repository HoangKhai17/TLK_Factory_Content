import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
  trend?: string;
}

export default function StatsCard({ icon, iconBg, iconColor, value, label, trend }: StatsCardProps) {
  return (
    <div className="card stat-card card-hover">
      <div className="stat-icon-wrap" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      {trend && (
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: "auto" }}>
          {trend}
        </div>
      )}
    </div>
  );
}
