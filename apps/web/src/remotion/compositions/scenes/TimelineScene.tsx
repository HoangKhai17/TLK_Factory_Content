import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

export function TimelineScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const accent = scene.glowColor ?? palette.accent;
  const steps = scene.steps ?? [];

  const titleOp = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY  = interpolate(frame, [0, 16], [-20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", justifyContent: "center", padding: `${layout.py}px ${layout.px}px`, gap: layout.gap, overflow: "hidden" }}>
      {scene.title && (
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: 700, color: scene.title.color ?? palette.text, lineHeight: 1.15 }}>
          {scene.title.content}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: Math.round(18 * layout.scale) }}>
        {steps.map((step, i) => {
          const delay = Math.round(0.3 * fps) + i * Math.round(0.22 * fps);
          const sc = spring({ frame: Math.max(0, frame - delay), fps, config: { mass: 0.5, damping: 10 }, from: 0.85, to: 1 });
          const op = interpolate(Math.max(0, frame - delay), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x  = interpolate(Math.max(0, frame - delay), [0, 16], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const dotSize = Math.round(40 * layout.scale);
          return (
            <div key={i} style={{ opacity: op, transform: `translateX(${x}px) scale(${sc})`, display: "flex", alignItems: "flex-start", gap: Math.round(20 * layout.scale) }}>
              <div style={{ width: dotSize, height: dotSize, borderRadius: "50%", backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(16 * layout.scale), fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {step.number ?? i + 1}
              </div>
              <div style={{ flex: 1, paddingTop: Math.round(8 * layout.scale) }}>
                <div style={{ fontSize: Math.round(layout.bodySize * 1.1), fontWeight: 600, color: palette.text, lineHeight: 1.3 }}>{step.title}</div>
                {step.description && <div style={{ fontSize: layout.smallSize ?? Math.round(layout.bodySize * 0.9), color: hexToRgba(palette.text, 0.65), lineHeight: 1.4, marginTop: Math.round(4 * layout.scale) }}>{step.description}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
