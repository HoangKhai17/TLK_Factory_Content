import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

export function QuoteScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const accent = scene.glowColor ?? palette.accent;

  const op = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y  = interpolate(frame, [0, 20], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineDelay = Math.round(0.4 * fps);
  const lineW = interpolate(Math.max(0, frame - lineDelay), [0, 20], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subDelay = Math.round(0.65 * fps);
  const subOp = interpolate(Math.max(0, frame - subDelay), [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: layout.gap, overflow: "hidden", padding: `${layout.py}px ${layout.px}px` }}>
      <div style={{ fontSize: Math.round(80 * layout.scale), lineHeight: 0.8, color: accent, opacity: 0.35, fontFamily: "Georgia, serif", alignSelf: "flex-start" }}>"</div>

      {scene.title && (
        <div style={{ opacity: op, transform: `translateY(${y}px)`, fontSize: scene.title.fontSize ?? Math.round(layout.titleSize * 1.05), fontWeight: 600, color: scene.title.color ?? palette.text, textAlign: "center", lineHeight: 1.35, fontStyle: "italic" }}>
          {scene.title.content}
        </div>
      )}

      <div style={{ width: lineW, height: Math.max(2, Math.round(3 * layout.scale)), backgroundColor: accent, borderRadius: 2 }} />

      {scene.subtitle && (
        <div style={{ opacity: subOp, fontSize: scene.subtitle.fontSize ?? layout.subtitleSize, color: scene.subtitle.color ?? hexToRgba(palette.text, 0.6), textAlign: "center" }}>
          — {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
