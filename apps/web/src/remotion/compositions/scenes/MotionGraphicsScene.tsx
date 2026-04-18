import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

function Particles({ count, color, opacity }: { count: number; color: string; opacity: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = Math.min(count, 60);
  const pts = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI * 2.618;
    const r = Math.sqrt(i / n);
    const cx = width / 2 + r * width * 0.44 * Math.cos(angle) + Math.sin(frame * 0.02 + i) * 6;
    const cy = height / 2 + r * height * 0.44 * Math.sin(angle) + Math.cos(frame * 0.015 + i) * 5;
    return { cx, cy, r: 1.5 + (i % 3) };
  });
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {pts.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={color} opacity={opacity} />)}
    </svg>
  );
}

export function MotionGraphicsScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const glow = scene.glowColor ?? palette.accent;
  const pc = scene.particles;

  const titleDelay = Math.round((scene.title?.animationDelay ?? 0.15) * fps);
  const sc = spring({ frame: Math.max(0, frame - titleDelay), fps, config: { mass: 0.55, damping: 12 }, from: 0.75, to: 1 });
  const titleOp = interpolate(Math.max(0, frame - titleDelay), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subDelay = Math.round((scene.subtitle?.animationDelay ?? 0.65) * fps);
  const subOp = interpolate(Math.max(0, frame - subDelay), [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY  = interpolate(Math.max(0, frame - subDelay), [0, 16], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineDelay = Math.round(0.45 * fps);
  const lineW = interpolate(Math.max(0, frame - lineDelay), [0, 20], [0, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const hasGradient = !!(scene.title?.gradientFrom && scene.title?.gradientTo);

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), overflow: "hidden" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${hexToRgba(glow, 0.2)} 0%, transparent 70%)`, pointerEvents: "none" }} />
      {/* Particles */}
      {pc && <Particles count={pc.count ?? 60} color={pc.color ?? glow} opacity={pc.opacity ?? 0.18} />}

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: layout.gap, padding: `${layout.py}px ${layout.px}px` }}>
        {scene.title && (
          <div style={{
            opacity: titleOp, transform: `scale(${sc})`,
            fontSize: scene.title.fontSize ?? Math.round(layout.titleSize * 1.5),
            fontWeight: scene.title.fontWeight === "black" ? 900 : 800,
            ...(hasGradient
              ? { background: `linear-gradient(135deg, ${scene.title.gradientFrom}, ${scene.title.gradientTo})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
              : { color: scene.title.color ?? palette.text, textShadow: `0 0 40px ${hexToRgba(glow, 0.5)}` }),
            textAlign: (scene.title.align ?? "center") as React.CSSProperties["textAlign"],
            lineHeight: 1.05, letterSpacing: scene.title.letterSpacing ?? "-0.03em",
          }}>
            {scene.title.content}
          </div>
        )}

        {(scene.subtitle || scene.body) && (
          <div style={{ width: lineW, height: Math.max(2, Math.round(3 * layout.scale)), background: `linear-gradient(to right, ${glow}, ${hexToRgba(glow, 0.2)})`, borderRadius: 2, boxShadow: `0 0 10px ${hexToRgba(glow, 0.6)}` }} />
        )}

        {scene.subtitle && (
          <div style={{ opacity: subOp, transform: `translateY(${subY}px)`, fontSize: scene.subtitle.fontSize ?? Math.round(layout.subtitleSize * 1.1), color: scene.subtitle.color ?? hexToRgba(palette.text, 0.8), textAlign: "center", lineHeight: 1.5 }}>
            {scene.subtitle.content}
          </div>
        )}

        {scene.body && (
          <div style={{ opacity: subOp, fontSize: scene.body.fontSize ?? layout.bodySize, color: scene.body.color ?? hexToRgba(palette.text, 0.65), textAlign: "center", lineHeight: 1.6 }}>
            {scene.body.content}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
