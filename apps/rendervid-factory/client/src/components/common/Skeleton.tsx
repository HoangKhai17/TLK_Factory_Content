interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height = 16, borderRadius = "var(--r)", style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <Skeleton height={160} borderRadius="var(--r-xl) var(--r-xl) 0 0" />
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton height={14} width="80%" />
        <Skeleton height={12} width="50%" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Skeleton height={22} width={80} borderRadius="var(--r-full)" />
          <Skeleton height={28} width={90} borderRadius="var(--r)" />
        </div>
      </div>
    </div>
  );
}
