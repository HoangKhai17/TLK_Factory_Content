import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

export function BulletListScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const accent = scene.glowColor ?? palette.accent;
  const bullets = scene.bullets ?? [];

  const titleOp = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY  = interpolate(frame, [0, 16], [-24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", justifyContent: "center", padding: `${layout.py}px ${layout.px}px`, gap: layout.gap, overflow: "hidden" }}>
      {scene.title && (
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: 700, color: scene.title.color ?? palette.text, lineHeight: 1.15 }}>
          {scene.title.content}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: Math.round(14 * layout.scale) }}>
        {bullets.map((bullet, i) => {
          const delay = Math.round(0.35 * fps) + i * Math.round(0.18 * fps);
          const op = interpolate(Math.max(0, frame - delay), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x  = interpolate(Math.max(0, frame - delay), [0, 16], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: op, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: Math.round(16 * layout.scale), borderLeft: `${Math.max(2, Math.round(3 * layout.scale))}px solid ${accent}`, paddingLeft: Math.round(16 * layout.scale), minHeight: Math.round(36 * layout.scale) }}>
              {bullet.icon && <span style={{ fontSize: Math.round(28 * layout.scale), lineHeight: 1 }}>{bullet.icon}</span>}
              <span style={{ fontSize: layout.bodySize, color: palette.text, lineHeight: 1.4 }}>{bullet.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
