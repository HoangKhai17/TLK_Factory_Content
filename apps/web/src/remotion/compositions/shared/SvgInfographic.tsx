/**
 * Reusable animated SVG infographic primitives.
 * All animations driven by Remotion frame – no CSS animations.
 */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { hexToRgba } from "./palette";

// ─────────────────────────────────────────────
// 1. Circular progress ring (for % stats)
// ─────────────────────────────────────────────
interface ProgressRingProps {
  percent: number;      // 0–100
  color: string;
  size?: number;        // diameter px (default 180)
  strokeWidth?: number; // (default 14)
  startFrame?: number;
}

export function ProgressRing({
  percent,
  color,
  size = 180,
  strokeWidth = 14,
  startFrame = 0,
}: ProgressRingProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eff = Math.max(0, frame - startFrame);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = interpolate(eff, [0, fps * 1.2], [0, percent], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashOffset = circumference * (1 - animated / 100);

  const glowOpacity = interpolate(eff, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <defs>
        <filter id={`glow-${color.replace("#", "")}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={hexToRgba(color, 0.15)} strokeWidth={strokeWidth} />
      {/* Progress arc */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ opacity: glowOpacity, filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// 2. Animated bar chart (for numeric stats)
// ─────────────────────────────────────────────
interface BarChartProps {
  values: number[];     // 0–100 relative heights
  colors: string[];
  width?: number;
  height?: number;
  startFrame?: number;
}

export function BarChart({
  values,
  colors,
  width = 320,
  height = 160,
  startFrame = 0,
}: BarChartProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eff = Math.max(0, frame - startFrame);

  const barWidth = (width / values.length) * 0.55;
  const gap = width / values.length;

  return (
    <svg width={width} height={height} style={{ flexShrink: 0 }}>
      {/* Baseline */}
      <line x1={0} y1={height - 2} x2={width} y2={height - 2} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      {values.map((v, i) => {
        const delay = i * Math.round(fps * 0.15);
        const e = Math.max(0, eff - delay);
        const barH = interpolate(e, [0, fps * 0.6], [0, (v / 100) * (height - 20)], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const x = i * gap + gap / 2 - barWidth / 2;
        const y = height - barH - 2;
        const color = colors[i % colors.length] ?? "#ffffff";

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={6}
              fill={hexToRgba(color, 0.25)}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Glow cap */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.min(6, barH)}
              rx={4}
              fill={color}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// 3. Animated draw-on SVG path
// ─────────────────────────────────────────────
interface DrawPathProps {
  d: string;
  totalLength: number;
  color: string;
  strokeWidth?: number;
  startFrame?: number;
  durationFrames?: number;
  glow?: boolean;
}

export function DrawPath({
  d,
  totalLength,
  color,
  strokeWidth = 3,
  startFrame = 0,
  durationFrames,
  glow = false,
}: DrawPathProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationFrames ?? fps;
  const eff = Math.max(0, frame - startFrame);

  const progress = interpolate(eff, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashOffset = totalLength * (1 - progress);

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={totalLength}
      strokeDashoffset={dashOffset}
      style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
    />
  );
}

// ─────────────────────────────────────────────
// 4. Animated checkmark icon
// ─────────────────────────────────────────────
interface CheckIconProps {
  size?: number;
  color: string;
  startFrame?: number;
}

export function CheckIcon({ size = 28, color, startFrame = 0 }: CheckIconProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eff = Math.max(0, frame - startFrame);

  const circleScale = spring({ frame: eff, fps, config: { mass: 0.4, damping: 9 }, from: 0, to: 1 });
  const checkProgress = interpolate(Math.max(0, eff - Math.round(fps * 0.15)), [0, fps * 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const checkLength = 20;
  const dashOffset = checkLength * (1 - checkProgress);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      style={{ flexShrink: 0, transform: `scale(${circleScale})` }}
    >
      <circle cx={14} cy={14} r={13} fill={hexToRgba(color, 0.15)} stroke={color} strokeWidth={1.5} />
      <path
        d="M 8 14 L 12 18 L 20 10"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={checkLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// 5. Animated connector line (for Timeline)
// ─────────────────────────────────────────────
interface ConnectorLineProps {
  height: number;
  color: string;
  startFrame?: number;
}

export function ConnectorLine({ height, color, startFrame = 0 }: ConnectorLineProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eff = Math.max(0, frame - startFrame);

  const progress = interpolate(eff, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Traveling dot position
  const dotY = progress * height;

  return (
    <svg width={24} height={height} style={{ flexShrink: 0 }}>
      {/* Static line */}
      <line
        x1={12} y1={0}
        x2={12} y2={height * progress}
        stroke={hexToRgba(color, 0.5)}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      {/* Traveling glow dot */}
      {progress > 0 && progress < 1 && (
        <circle
          cx={12}
          cy={dotY}
          r={4}
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────
// 6. Animated number counter (count-up effect)
// ─────────────────────────────────────────────
interface AnimatedCounterProps {
  /** Value string — numeric part counts up, suffix stays. E.g. "10x", "95%", "1,200" */
  value: string;
  startFrame?: number;
  /** Duration in frames for the count (default: 1.2s) */
  durationFrames?: number;
}

export function AnimatedCounter({ value, startFrame = 0, durationFrames }: AnimatedCounterProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durationFrames ?? Math.round(fps * 1.2);
  const eff = Math.max(0, frame - startFrame);

  // Match: optional sign, digits (with commas), optional decimal, then any suffix
  const match = value.match(/^([+\-]?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return <>{value}</>;

  const rawStr  = match[1]!.replace(/,/g, "");
  const suffix  = match[2] ?? "";
  const target  = parseFloat(rawStr);
  const isFloat = rawStr.includes(".");
  const decimals = isFloat ? (rawStr.split(".")[1]?.length ?? 1) : 0;

  const progress = interpolate(eff, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const current = target * progress;
  const display = isFloat
    ? current.toFixed(decimals)
    : current >= 1000
      ? Math.round(current).toLocaleString("en-US")
      : String(Math.round(current));

  return <>{display}{suffix}</>;
}

// ─────────────────────────────────────────────
// 7. Decorative hexagon grid (infographic bg)
// ─────────────────────────────────────────────
interface HexGridProps {
  color: string;
  opacity?: number;
  width?: number;
  height?: number;
}

export function HexGrid({ color, opacity = 0.08, width = 400, height = 300 }: HexGridProps) {
  const size = 30;
  const cols = Math.ceil(width / (size * 1.7)) + 1;
  const rows = Math.ceil(height / (size * 1.5)) + 1;

  const hexPath = (cx: number, cy: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`;
    });
    return `M ${pts[0]} ${pts.slice(1).map((p) => `L ${p}`).join(" ")} Z`;
  };

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", opacity, pointerEvents: "none" }}
    >
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cx = c * size * 1.73 + (r % 2 === 0 ? 0 : size * 0.865);
          const cy = r * size * 1.5;
          return (
            <path
              key={`${r}-${c}`}
              d={hexPath(cx, cy)}
              fill="none"
              stroke={color}
              strokeWidth={1}
            />
          );
        })
      )}
    </svg>
  );
}
