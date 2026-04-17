/**
 * @tlk/motion — TLK Factory Remotion Utility Library
 *
 * Pre-built, quality-tested components for AI-generated videos.
 * Import: import { GlowText, ParticleField, ... } from "@tlk/motion"
 */

import React from "react";
import {
  interpolate, spring, useCurrentFrame, useVideoConfig, Easing,
} from "remotion";

// ─────────────────────────────────────────────────────────────────
// COLOR PALETTES
// ─────────────────────────────────────────────────────────────────

export interface ColorPalette {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  surface: string;
}

export const PALETTES: Record<string, ColorPalette> = {
  neonCyan: {
    bg: "#05050a", primary: "#00ffff", secondary: "#0088ff",
    accent: "#ff007f", text: "#ffffff", surface: "rgba(0,255,255,0.05)",
  },
  goldFinance: {
    bg: "#0a0800", primary: "#f7931a", secondary: "#ffd700",
    accent: "#ff6b00", text: "#ffffff", surface: "rgba(247,147,26,0.06)",
  },
  techBlue: {
    bg: "#060c1a", primary: "#3a5af7", secondary: "#00d4ff",
    accent: "#7c3aed", text: "#ffffff", surface: "rgba(58,90,247,0.06)",
  },
  purpleMagenta: {
    bg: "#0a0010", primary: "#8b5cf6", secondary: "#ec4899",
    accent: "#06b6d4", text: "#ffffff", surface: "rgba(139,92,246,0.05)",
  },
  emeraldDark: {
    bg: "#020f0a", primary: "#10b981", secondary: "#34d399",
    accent: "#f59e0b", text: "#ffffff", surface: "rgba(16,185,129,0.05)",
  },
  crimsonDark: {
    bg: "#0f0005", primary: "#ef4444", secondary: "#f97316",
    accent: "#fbbf24", text: "#ffffff", surface: "rgba(239,68,68,0.06)",
  },
  minimalLight: {
    bg: "#f8faff", primary: "#3a5af7", secondary: "#0f172a",
    accent: "#f59e0b", text: "#0f172a", surface: "rgba(58,90,247,0.06)",
  },
  minimalDark: {
    bg: "#0f172a", primary: "#ffffff", secondary: "#94a3b8",
    accent: "#3a5af7", text: "#ffffff", surface: "rgba(255,255,255,0.04)",
  },
};

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

/** Convert hex to rgba string */
export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Multi-layer neon text-shadow for a given color */
export function neonShadow(color: string, intensity = 1): string {
  const i = Math.max(0, intensity);
  return [
    `0 0 ${6 * i}px ${color}`,
    `0 0 ${20 * i}px ${color}`,
    `0 0 ${50 * i}px ${rgba(color, 0.5)}`,
    `0 0 ${100 * i}px ${rgba(color, 0.2)}`,
  ].join(", ");
}

/** Easing presets for common motion patterns */
export const EASE = {
  smooth:   Easing.out(Easing.cubic),
  bounce:   Easing.out(Easing.back(1.4)),
  snappy:   Easing.out(Easing.back(2.0)),
  elastic:  Easing.out(Easing.elastic(0.8)),
  linear:   Easing.linear,
  easeIn:   Easing.in(Easing.cubic),
  easeOut:  Easing.out(Easing.cubic),
} as const;

// ─────────────────────────────────────────────────────────────────
// TEXT COMPONENTS
// ─────────────────────────────────────────────────────────────────

/** Neon glowing text with animated pulse */
export function GlowText({
  children, color = "#00ffff", fontSize = 72, fontWeight = 900,
  intensity = 1, pulse = true, style,
}: {
  children: React.ReactNode;
  color?: string; fontSize?: number; fontWeight?: number | string;
  intensity?: number; pulse?: boolean; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glowI = pulse
    ? interpolate(frame % Math.max(1, fps * 2), [0, Math.max(1, fps), Math.max(2, fps * 2)], [0.7 * intensity, intensity, 0.7 * intensity], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : intensity;

  return (
    <div style={{
      color, fontSize, fontWeight, lineHeight: 1.1,
      letterSpacing: "-0.02em",
      textShadow: neonShadow(color, glowI),
      ...style,
    }}>
      {children}
    </div>
  );
}

/**
 * Masked slide-up reveal — classic kinetic typography effect.
 * Wrap in `overflow:"hidden"` container is handled internally.
 */
export function KineticWord({
  children, startFrame = 0, duration = 18,
  color = "#ffffff", fontSize = 96, fontWeight = 900,
  easing: easingFn, style,
}: {
  children: string; startFrame?: number; duration?: number;
  color?: string; fontSize?: number; fontWeight?: number | string;
  easing?: (t: number) => number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const eff = Math.max(0, frame - startFrame);
  const progress = interpolate(eff, [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: easingFn ?? Easing.out(Easing.back(1.4)),
  });
  const y = (1 - progress) * 80;
  const op = interpolate(eff, [0, Math.ceil(duration * 0.6)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{ overflow: "hidden", lineHeight: 1.05, display: "inline-block" }}>
      <div style={{
        transform: `translateY(${y}px)`, opacity: op,
        fontSize, fontWeight, color, letterSpacing: "-0.03em",
        ...style,
      }}>
        {children}
      </div>
    </div>
  );
}

/** Character-by-character stagger animation */
export function CharStagger({
  text, startFrame = 0, staggerFrames = 3, duration = 12,
  color = "#ffffff", fontSize = 96, fontWeight = 900, style,
}: {
  text: string; startFrame?: number; staggerFrames?: number; duration?: number;
  color?: string; fontSize?: number; fontWeight?: number | string; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", fontSize, fontWeight, color, ...style }}>
      {text.split("").map((char, i) => {
        const delay = startFrame + i * staggerFrames;
        const eff = Math.max(0, frame - delay);
        const op = interpolate(eff, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const y = interpolate(eff, [0, duration], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        return (
          <span key={i} style={{ opacity: op, transform: `translateY(${y}px)`, display: "inline-block", whiteSpace: "pre" }}>
            {char}
          </span>
        );
      })}
    </div>
  );
}

/** Animated number counter with easing */
export function AnimatedCounter({
  target, startFrame = 0, duration = 60,
  prefix = "", suffix = "", decimals = 0,
  color = "#ffffff", fontSize = 96, fontWeight = 900,
}: {
  target: number; startFrame?: number; duration?: number;
  prefix?: string; suffix?: string; decimals?: number;
  color?: string; fontSize?: number; fontWeight?: number | string;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(Math.max(0, frame - startFrame), [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = target * progress;
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");
  return (
    <span style={{ color, fontSize, fontWeight, letterSpacing: "-0.04em", lineHeight: 1 }}>
      {prefix}{display}{suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// ENTRANCE WRAPPERS
// ─────────────────────────────────────────────────────────────────

/** Simple fade-in wrapper */
export function FadeIn({
  children, startFrame = 0, duration = 15, style,
}: {
  children: React.ReactNode; startFrame?: number; duration?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const op = interpolate(Math.max(0, frame - startFrame), [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <div style={{ opacity: op, ...style }}>{children}</div>;
}

/** Directional slide + fade entrance */
export function SlideIn({
  children, startFrame = 0, duration = 20,
  direction = "up", distance = 60, style,
}: {
  children: React.ReactNode; startFrame?: number; duration?: number;
  direction?: "up" | "down" | "left" | "right"; distance?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const eff = Math.max(0, frame - startFrame);
  const progress = interpolate(eff, [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const op = interpolate(eff, [0, Math.ceil(duration * 0.5)], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const d = (1 - progress) * distance;
  const transform =
    direction === "up" ? `translateY(${d}px)` :
    direction === "down" ? `translateY(${-d}px)` :
    direction === "left" ? `translateX(${d}px)` :
    `translateX(${-d}px)`;
  return <div style={{ opacity: op, transform, ...style }}>{children}</div>;
}

/** Spring pop-in (natural bounce) */
export function ScaleIn({
  children, startFrame = 0, mass = 0.5, damping = 12, style,
}: {
  children: React.ReactNode; startFrame?: number; mass?: number; damping?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: Math.max(0, frame - startFrame), fps, config: { mass, damping }, from: 0, to: 1 });
  return <div style={{ transform: `scale(${sc})`, ...style }}>{children}</div>;
}

/** Wipe reveal (clipPath from left) */
export function WipeIn({
  children, startFrame = 0, duration = 25, style,
}: {
  children: React.ReactNode; startFrame?: number; duration?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const w = interpolate(Math.max(0, frame - startFrame), [0, duration], [0, width], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ clipPath: `inset(0 ${width - w}px 0 0)`, ...style }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DATA VISUALIZATION
// ─────────────────────────────────────────────────────────────────

/** SVG circular progress ring */
export function ProgressRing({
  percent, startFrame = 0, duration = 60, size = 200,
  strokeWidth = 12, color = "#00ffff",
  trackColor = "rgba(255,255,255,0.1)",
  showLabel = true, labelColor = "#ffffff", labelSize = 36,
}: {
  percent: number; startFrame?: number; duration?: number;
  size?: number; strokeWidth?: number; color?: string; trackColor?: string;
  showLabel?: boolean; labelColor?: string; labelSize?: number;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(Math.max(0, frame - startFrame), [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const displayPct = Math.round(percent * progress);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cx} r={r} fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - (percent / 100) * progress)}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: `${cx}px ${cx}px`,
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      {showLabel && (
        <span style={{ color: labelColor, fontSize: labelSize, fontWeight: 700, position: "relative", zIndex: 1 }}>
          {displayPct}%
        </span>
      )}
    </div>
  );
}

/** Animated vertical bar chart */
export function BarChart({
  bars, startFrame = 0, duration = 45,
  maxHeight = 280, barWidth = 80, gap = 24,
  defaultColor = "#3a5af7", labelColor = "rgba(255,255,255,0.6)",
  labelSize = 18, showValues = true,
}: {
  bars: Array<{ label: string; value: number; color?: string }>;
  startFrame?: number; duration?: number; maxHeight?: number;
  barWidth?: number; gap?: number; defaultColor?: string;
  labelColor?: string; labelSize?: number; showValues?: boolean;
}) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap, height: maxHeight + 60 }}>
      {bars.map((bar, i) => {
        const delay = startFrame + i * 8;
        const progress = interpolate(Math.max(0, frame - delay), [0, duration], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const h = (bar.value / 100) * maxHeight * progress;
        const color = bar.color ?? defaultColor;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: barWidth }}>
            {showValues && (
              <span style={{ color: labelColor, fontSize: labelSize, fontWeight: 700, opacity: progress, minHeight: 28, display: "flex", alignItems: "flex-end" }}>
                {bar.value}%
              </span>
            )}
            <div style={{
              width: "100%", height: Math.max(0, h),
              borderRadius: "6px 6px 0 0",
              background: color,
              boxShadow: `0 0 20px ${rgba(color, 0.5)}`,
            }} />
            <span style={{ color: labelColor, fontSize: labelSize, fontWeight: 500, whiteSpace: "nowrap" }}>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BACKGROUND / ATMOSPHERE EFFECTS
// ─────────────────────────────────────────────────────────────────

/** Floating particle system using golden-angle distribution */
export function ParticleField({
  count = 60, color = "#00ffff", speed = 0.4,
  maxSize = 3, opacity = 0.6,
}: {
  count?: number; color?: string; speed?: number; maxSize?: number; opacity?: number;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {Array.from({ length: count }).map((_, i) => {
        const angle = i * 137.508;
        const x = (Math.sin(angle) * 0.5 + 0.5) * width;
        const baseY = (Math.cos(angle * 1.3) * 0.5 + 0.5) * height;
        const y = ((baseY + frame * (speed + (i % 5) * 0.12)) % height + height) % height;
        const size = 0.5 + (i % Math.max(1, maxSize));
        const op = opacity * (0.3 + (Math.sin(frame * 0.05 + i * 0.8) * 0.5 + 0.5) * 0.7);
        return <circle key={i} cx={x} cy={y} r={size} fill={color} opacity={op} />;
      })}
    </svg>
  );
}

/** CRT scanline overlay */
export function Scanlines({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50,
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)",
      opacity,
    }} />
  );
}

/** Cyberpunk grid lines */
export function CyberGrid({
  color = "#00ffff", opacity = 0.08, cols = 24, rows = 14,
}: {
  color?: string; opacity?: number; cols?: number; rows?: number;
}) {
  const { width, height } = useVideoConfig();
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <line key={`v${i}`} x1={i * (width / cols)} y1={0} x2={i * (width / cols)} y2={height} stroke={color} strokeWidth="0.5" />
      ))}
      {Array.from({ length: rows }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * (height / rows)} x2={width} y2={i * (height / rows)} stroke={color} strokeWidth="0.5" />
      ))}
    </svg>
  );
}

/** Glowing radial ambient light */
export function AmbientGlow({
  color, x = "50%", y = "50%", size = 600, opacity = 0.3,
}: {
  color: string; x?: string | number; y?: string | number; size?: number; opacity?: number;
}) {
  return (
    <div style={{
      position: "absolute",
      left: x, top: y,
      width: size, height: size,
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${rgba(color, opacity)} 0%, transparent 70%)`,
      pointerEvents: "none",
    }} />
  );
}

/** RGB chromatic aberration on text */
export function ChromaText({
  children, color = "#ffffff", fontSize = 72, fontWeight = 900,
  spread = 2, style,
}: {
  children: string; color?: string; fontSize?: number; fontWeight?: number | string;
  spread?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }}>
      <div style={{ position: "absolute", color: `rgba(255,0,0,0.5)`, transform: `translate(${-spread}px,${-spread * 0.5}px)`, fontSize, fontWeight, whiteSpace: "nowrap" }}>{children}</div>
      <div style={{ position: "absolute", color: `rgba(0,255,255,0.5)`, transform: `translate(${spread}px,${spread * 0.5}px)`, fontSize, fontWeight, whiteSpace: "nowrap" }}>{children}</div>
      <div style={{ position: "relative", color, fontSize, fontWeight, whiteSpace: "nowrap" }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LOGO / ACCENT ELEMENTS
// ─────────────────────────────────────────────────────────────────

/** Expanding ring pulse (use inside SVG) — for logo reveals */
export function RingPulse({
  startFrame = 0, color = "#00ffff",
  cx, cy, maxRadius = 200,
}: {
  startFrame?: number; color?: string; cx: number; cy: number; maxRadius?: number;
}) {
  const frame = useCurrentFrame();
  const eff = Math.max(0, frame - startFrame);
  const r = interpolate(eff, [0, 45], [0, maxRadius], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = interpolate(eff, [0, 5, 45], [0, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1.5" opacity={op} />;
}

/** Growing horizontal accent line */
export function AccentLine({
  startFrame = 0, duration = 20, color = "#3a5af7",
  maxWidth = 120, height = 3, style,
}: {
  startFrame?: number; duration?: number; color?: string;
  maxWidth?: number; height?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const w = interpolate(Math.max(0, frame - startFrame), [0, duration], [0, maxWidth], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{
      width: Math.max(0, w), height, backgroundColor: color,
      borderRadius: height / 2,
      boxShadow: `0 0 12px ${color}`,
      ...style,
    }} />
  );
}

/** Rotating dashed ring (logo backdrop) */
export function RotatingRing({
  size = 200, color = "#00ffff", opacity = 0.4,
  dashArray = "8 6", speed = 0.5,
}: {
  size?: number; color?: string; opacity?: number; dashArray?: string; speed?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / Math.max(1, fps * 10)) * 360 * speed % 360;
  const r = size / 2 - 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="1.5"
        strokeDasharray={dashArray}
        opacity={opacity}
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// TIMING HELPERS
// ─────────────────────────────────────────────────────────────────

/** FadeOut — element fades to 0 opacity starting at exitFrame */
export function FadeOut({
  children, exitFrame, duration = 15, style,
}: {
  children: React.ReactNode; exitFrame: number; duration?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [exitFrame, exitFrame + duration], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <div style={{ opacity: op, ...style }}>{children}</div>;
}

/** Show element only within a frame range [inFrame, outFrame) */
export function ShowRange({
  children, inFrame, outFrame,
}: {
  children: React.ReactNode; inFrame: number; outFrame: number;
}) {
  const frame = useCurrentFrame();
  if (frame < inFrame || frame >= outFrame) return null;
  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────
// TEXT — ADVANCED
// ─────────────────────────────────────────────────────────────────

/** Word-by-word slide+fade entrance — maps "word_by_word slide_from_bottom" DSL */
export function WordByWord({
  text, startFrame = 0, wordDuration = 10, staggerFrames = 8,
  color = "#ffffff", fontSize = 68, fontWeight = 500,
  direction = "up", distance = 40, lineHeight = 1.2,
  style,
}: {
  text: string; startFrame?: number; wordDuration?: number; staggerFrames?: number;
  color?: string; fontSize?: number; fontWeight?: number | string;
  direction?: "up" | "down"; distance?: number; lineHeight?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 0.28em`, ...style }}>
      {words.map((word, i) => {
        const delay = startFrame + i * staggerFrames;
        const eff = Math.max(0, frame - delay);
        const op = interpolate(eff, [0, wordDuration], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const d = direction === "up" ? 1 : -1;
        const y = interpolate(eff, [0, wordDuration], [d * distance, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <span key={i} style={{
            opacity: op, transform: `translateY(${y}px)`,
            display: "inline-block", color, fontSize, fontWeight,
            lineHeight, whiteSpace: "pre",
          }}>
            {word}
          </span>
        );
      })}
    </div>
  );
}

/** Text with linear gradient fill (CSS WebkitTextFillColor trick) */
export function GradientText({
  children, from = "#a78bfa", to = "#06b6d4", angle = "to right",
  fontSize = 72, fontWeight = 800, letterSpacing, style,
}: {
  children: React.ReactNode; from?: string; to?: string; angle?: string;
  fontSize?: number; fontWeight?: number | string; letterSpacing?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      fontSize, fontWeight, lineHeight: 1.1,
      letterSpacing,
      background: `linear-gradient(${angle}, ${from}, ${to})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      display: "inline-block",
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Shimmer highlight that sweeps across text once */
export function ShimmerText({
  children, startFrame = 0, duration = 24,
  color = "rgba(255,255,255,0.7)", style,
}: {
  children: React.ReactNode; startFrame?: number; duration?: number;
  color?: string; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const pct = interpolate(Math.max(0, frame - startFrame), [0, duration], [-20, 120], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }}>
      {children}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `linear-gradient(105deg, transparent ${pct - 15}%, ${color} ${pct}%, transparent ${pct + 15}%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ANIMATION WRAPPERS
// ─────────────────────────────────────────────────────────────────

/** Looping float oscillation — maps "float y-oscillation ±Npx period Xs" DSL */
export function FloatLoop({
  children, amplitude = 8, period = 3, phaseOffset = 0, style,
}: {
  children: React.ReactNode; amplitude?: number; period?: number;
  phaseOffset?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(period * fps));
  const f = (frame + Math.round(phaseOffset * fps)) % totalFrames;
  const y = interpolate(f, [0, totalFrames / 2, totalFrames], [-amplitude, amplitude, -amplitude], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  return <div style={{ transform: `translateY(${y}px)`, ...style }}>{children}</div>;
}

/** Looping breathe scale — maps "breathe scale 1→1.02→1.0 loop" DSL */
export function BreatheLoop({
  children, minScale = 1, maxScale = 1.03, period = 2.5, style,
}: {
  children: React.ReactNode; minScale?: number; maxScale?: number;
  period?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(period * fps));
  const f = frame % totalFrames;
  const sc = interpolate(f, [0, totalFrames / 2, totalFrames], [minScale, maxScale, minScale], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  return <div style={{ transform: `scale(${sc})`, ...style }}>{children}</div>;
}

/** Spring bounce entrance — maps "spring_bounce scale 0→1.2→1.0" DSL */
export function SpringBounce({
  children, startFrame = 0, mass = 0.4, damping = 8,
  from = 0, to = 1, style,
}: {
  children: React.ReactNode; startFrame?: number; mass?: number; damping?: number;
  from?: number; to?: number; style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: Math.max(0, frame - startFrame), fps, config: { mass, damping }, from, to });
  return <div style={{ transform: `scale(${sc})`, ...style }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────
// EFFECTS
// ─────────────────────────────────────────────────────────────────

/** RGB split glitch flash overlay — maps "glitch flash overlay RGB split" DSL */
export function GlitchFlash({
  startFrame = 0, durationFrames = 4,
  rgbSpread = 8, maxOpacity = 0.9,
}: {
  startFrame?: number; durationFrames?: number; rgbSpread?: number; maxOpacity?: number;
}) {
  const frame = useCurrentFrame();
  const eff = Math.max(0, frame - startFrame);
  const op = interpolate(eff, [0, Math.ceil(durationFrames * 0.3), Math.ceil(durationFrames * 0.7), durationFrames], [0, maxOpacity, maxOpacity, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  if (op <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 100, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,0,0,0.35)", transform: `translateX(${rgbSpread}px)`, opacity: op, mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,100,255,0.35)", transform: `translateX(${-rgbSpread}px)`, opacity: op, mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,0.12)`, opacity: op }} />
    </div>
  );
}

/** Outward particle burst from a center point — maps "particle burst N hạt" DSL */
export function ParticleBurst({
  cx = 960, cy = 540, startFrame = 0, count = 60,
  colors = ["#7c3aed", "#06b6d4"], minSize = 3, maxSize = 6,
  maxRadius = 400, duration = 45,
}: {
  cx?: number; cy?: number; startFrame?: number; count?: number;
  colors?: string[]; minSize?: number; maxSize?: number;
  maxRadius?: number; duration?: number;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const eff = Math.max(0, frame - startFrame);
  if (eff > duration + 5) return null;
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + i * 0.37;
        const speed = 0.5 + (i % 7) * 0.1;
        const r = interpolate(eff, [0, duration], [0, maxRadius * speed], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const op = interpolate(eff, [0, duration * 0.25, duration], [0, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const size = minSize + (i % (maxSize - minSize + 1));
        const color = colors[i % colors.length] ?? "#ffffff";
        return (
          <circle key={i}
            cx={cx + Math.cos(angle) * r}
            cy={cy + Math.sin(angle) * r}
            r={size / 2} fill={color} opacity={op}
          />
        );
      })}
    </svg>
  );
}

/** Circular diagram node (icon + label circle) */
export function DiagramNode({
  label, icon, x, y, size = 78,
  borderColor = "#06b6d4", bg = "#1e1e4a",
  textColor = "#e2e8f0", fontSize = 20,
  startFrame = 0, glowColor,
}: {
  label: string; icon: string; x: number; y: number; size?: number;
  borderColor?: string; bg?: string; textColor?: string; fontSize?: number;
  startFrame?: number; glowColor?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: Math.max(0, frame - startFrame), fps, config: { mass: 0.4, damping: 8 }, from: 0, to: 1 });
  const labelOp = interpolate(Math.max(0, frame - startFrame - 15), [0, 9], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const glowStyle = glowColor ? { boxShadow: neonShadow(glowColor, 0.8) } : {};
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      transform: `translate(-50%, -50%) scale(${sc})`,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, border: `2px solid ${borderColor}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.45,
        ...glowStyle,
      }}>
        {icon}
      </div>
      <div style={{ opacity: labelOp, color: textColor, fontSize, fontWeight: 500, textAlign: "center", whiteSpace: "nowrap" }}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3D HELPERS
// ─────────────────────────────────────────────────────────────────

/** 3D card with animated tilt and optional flip-in entrance */
export function Card3D({
  children, startFrame = 0, flipDuration = 35,
  tiltAmplitude = 6, style,
}: {
  children: React.ReactNode; startFrame?: number;
  flipDuration?: number; tiltAmplitude?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flip-in entrance
  const rotateY = interpolate(Math.max(0, frame - startFrame), [0, flipDuration], [-90, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Gentle idle tilt
  const p4 = Math.max(1, fps * 4);
  const p3 = Math.max(1, fps * 3);
  const tiltX = interpolate(frame % p4, [0, p4 / 2, p4], [-tiltAmplitude, tiltAmplitude, -tiltAmplitude], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tiltY = interpolate(frame % p3, [0, p3 / 2, p3], [-tiltAmplitude * 0.6, tiltAmplitude * 0.6, -tiltAmplitude * 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const isFlipping = frame < startFrame + flipDuration;
  const transform = isFlipping
    ? `perspective(1200px) rotateY(${rotateY}deg)`
    : `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

  return (
    <div style={{ perspective: 1200 }}>
      <div style={{ transform, transformStyle: "preserve-3d", ...style }}>
        {children}
      </div>
    </div>
  );
}
