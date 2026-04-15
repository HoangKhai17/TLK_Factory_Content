import { useCurrentFrame, useVideoConfig } from "remotion";
import { hexToRgba } from "./palette";
import type { ColorPalette } from "./palette";

interface OrbConfig {
  cx: number;   // % from left
  cy: number;   // % from top
  r: number;    // radius px
  phase: number; // animation phase offset (0–1)
  opacity: number;
  colorKey: keyof ColorPalette;
}

const ORB_CONFIGS: OrbConfig[] = [
  { cx: 15,  cy: 20,  r: 320, phase: 0.0,  opacity: 0.25, colorKey: "accent"    },
  { cx: 85,  cy: 75,  r: 280, phase: 0.4,  opacity: 0.20, colorKey: "primary"   },
  { cx: 75,  cy: 15,  r: 200, phase: 0.7,  opacity: 0.18, colorKey: "secondary" },
  { cx: 30,  cy: 85,  r: 220, phase: 0.2,  opacity: 0.15, colorKey: "accent"    },
];

interface BackgroundDecorProps {
  palette: ColorPalette;
  /** 0–1: how strong the decorations are (default 1) */
  intensity?: number;
}

export function BackgroundDecor({ palette, intensity = 1 }: BackgroundDecorProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* ─── Dot-grid overlay ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${hexToRgba(palette.accent, 0.09)} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          opacity: intensity,
        }}
      />

      {/* ─── Floating glowing orbs ─── */}
      {ORB_CONFIGS.map((orb, i) => {
        const cycleFrames = fps * 5;
        const t = ((frame + orb.phase * cycleFrames) % cycleFrames) / cycleFrames;
        const sin = Math.sin(t * Math.PI * 2);
        const cos = Math.cos(t * Math.PI * 2 * 0.7);
        const floatX = sin * 18;
        const floatY = cos * 14;
        const scale  = 1 + sin * 0.06;
        const color  = palette[orb.colorKey] as string;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left:  `${orb.cx}%`,
              top:   `${orb.cy}%`,
              width:  orb.r * 2,
              height: orb.r * 2,
              borderRadius: "50%",
              transform: `translate(-50%, -50%) translate(${floatX}px, ${floatY}px) scale(${scale})`,
              background: `radial-gradient(circle at 40% 40%, ${hexToRgba(color, orb.opacity * intensity)}, ${hexToRgba(color, 0)} 70%)`,
              filter: `blur(${orb.r * 0.45}px)`,
            }}
          />
        );
      })}

      {/* ─── Subtle corner accent lines ─── */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* top-left corner bracket */}
        <path
          d="M 0 80 L 0 0 L 80 0"
          fill="none"
          stroke={hexToRgba(palette.accent, 0.3 * intensity)}
          strokeWidth="2"
        />
        {/* bottom-right corner bracket */}
        <path
          d={`M ${width} ${height - 80} L ${width} ${height} L ${width - 80} ${height}`}
          fill="none"
          stroke={hexToRgba(palette.accent, 0.3 * intensity)}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
