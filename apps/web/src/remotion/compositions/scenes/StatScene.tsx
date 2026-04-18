import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

function Counter({ target, frame, delay, fps }: { target: string; frame: number; delay: number; fps: number }) {
  const num = parseFloat(target.replace(/[^0-9.]/g, ""));
  const suffix = target.replace(/[0-9.]/g, "");
  if (isNaN(num)) return <>{target}</>;
  const eff = Math.max(0, frame - delay);
  const prog = interpolate(eff, [0, Math.round(fps * 1.2)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const val = Math.round(num * prog);
  return <>{val}{suffix}</>;
}

export function StatScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const stats = scene.stats ?? [];

  const titleOp = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY  = interpolate(frame, [0, 16], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `${layout.py}px ${layout.px}px`, gap: layout.gap, overflow: "hidden" }}>
      {scene.title && (
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: 700, color: scene.title.color ?? palette.text, textAlign: "center", lineHeight: 1.15 }}>
          {scene.title.content}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: Math.round(24 * layout.scale), justifyContent: "center", width: "100%" }}>
        {stats.map((stat, i) => {
          const delay = Math.round(0.3 * fps) + i * Math.round(0.25 * fps);
          const sc = spring({ frame: Math.max(0, frame - delay), fps, config: { mass: 0.5, damping: 10 }, from: 0.8, to: 1 });
          const op = interpolate(Math.max(0, frame - delay), [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const color = stat.color ?? palette.accent;
          return (
            <div key={i} style={{ opacity: op, transform: `scale(${sc})`, background: hexToRgba(color, 0.1), border: `1px solid ${hexToRgba(color, 0.3)}`, borderRadius: Math.round(16 * layout.scale), padding: `${Math.round(28 * layout.scale)}px ${Math.round(32 * layout.scale)}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(8 * layout.scale), minWidth: Math.round(180 * layout.scale) }}>
              <div style={{ fontSize: Math.round(56 * layout.scale), fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.03em" }}>
                <Counter target={stat.value} frame={frame} delay={delay} fps={fps} />
              </div>
              <div style={{ fontSize: layout.bodySize, color: hexToRgba(palette.text, 0.7), textAlign: "center" }}>{stat.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
