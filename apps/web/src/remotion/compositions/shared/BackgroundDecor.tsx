import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { hexToRgba } from "./palette";
import type { ColorPalette } from "./palette";

interface BackgroundDecorProps {
  palette: ColorPalette;
  /** 0–1: overall intensity (default 1) */
  intensity?: number;
}

export function BackgroundDecor({ palette, intensity = 1 }: BackgroundDecorProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = Math.min(width, height) / 1080; // scale factor

  // ── Orb configs (positions are % of width/height) ──────────────
  const orbs = [
    { cx: 12,  cy: 18,  r: 340 * s, phase: 0.0,  opacity: 0.22, color: palette.accent    },
    { cx: 88,  cy: 78,  r: 290 * s, phase: 0.4,  opacity: 0.18, color: palette.primary   },
    { cx: 78,  cy: 12,  r: 210 * s, phase: 0.7,  opacity: 0.15, color: palette.secondary },
    { cx: 28,  cy: 88,  r: 230 * s, phase: 0.2,  opacity: 0.13, color: palette.accent    },
  ];

  const cycleFrames = fps * 5;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>

      {/* ── Dot grid ── */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, ${hexToRgba(palette.accent, 0.08 * intensity)} 1px, transparent 1px)`,
        backgroundSize: `${Math.round(52 * s)}px ${Math.round(52 * s)}px`,
      }} />

      {/* ── Subtle mesh lines ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 * intensity }}
        viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {Array.from({ length: 6 }).map((_, i) => {
          const x = (width / 5) * (i + 0.5);
          return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={height} stroke={palette.accent} strokeWidth={1} />;
        })}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = (height / 3) * (i + 0.5);
          return <line key={`h${i}`} x1={0} y1={y} x2={width} y2={y} stroke={palette.accent} strokeWidth={1} />;
        })}
      </svg>

      {/* ── Floating glowing orbs ── */}
      {orbs.map((orb, i) => {
        const t = ((frame + orb.phase * cycleFrames) % cycleFrames) / cycleFrames;
        const floatX = Math.sin(t * Math.PI * 2) * 18;
        const floatY = Math.cos(t * Math.PI * 2 * 0.7) * 12;
        const scale  = 1 + Math.sin(t * Math.PI * 2) * 0.05;
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${orb.cx}%`, top: `${orb.cy}%`,
            width: orb.r * 2, height: orb.r * 2, borderRadius: "50%",
            transform: `translate(-50%,-50%) translate(${floatX}px,${floatY}px) scale(${scale})`,
            background: `radial-gradient(circle at 40% 40%, ${hexToRgba(orb.color, orb.opacity * intensity)}, ${hexToRgba(orb.color, 0)} 70%)`,
            filter: `blur(${orb.r * 0.44}px)`,
          }} />
        );
      })}

      {/* ── Light beams (diagonal) ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 * intensity }}
        viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="beam1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0" />
            <stop offset="50%" stopColor={palette.accent} stopOpacity="1" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0" />
            <stop offset="50%" stopColor={palette.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={palette.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Beam 1: top-left to bottom-right */}
        <polygon
          points={`0,0 ${width * 0.35},0 ${width},${height * 0.65} ${width * 0.65},${height}`}
          fill="url(#beam1)"
        />
        {/* Beam 2: top-right to bottom-left */}
        <polygon
          points={`${width * 0.65},0 ${width},0 ${width * 0.35},${height} 0,${height * 0.65}`}
          fill="url(#beam2)"
        />
      </svg>

      {/* ── Corner brackets ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {(() => {
          const b = Math.round(70 * s);
          const stroke = hexToRgba(palette.accent, 0.28 * intensity);
          return (
            <>
              <path d={`M 0 ${b} L 0 0 L ${b} 0`}                                       fill="none" stroke={stroke} strokeWidth="2" />
              <path d={`M ${width} ${height - b} L ${width} ${height} L ${width - b} ${height}`} fill="none" stroke={stroke} strokeWidth="2" />
            </>
          );
        })()}
      </svg>
    </div>
  );
}
