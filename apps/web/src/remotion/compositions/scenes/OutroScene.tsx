import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

export function OutroScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const accent = scene.glowColor ?? palette.accent;

  const sc = spring({ frame, fps, config: { mass: 0.5, damping: 11 }, from: 0.6, to: 1 });
  const op = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subDelay = Math.round(0.5 * fps);
  const subOp = interpolate(Math.max(0, frame - subDelay), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineDelay = Math.round(0.35 * fps);
  const lineW = interpolate(Math.max(0, frame - lineDelay), [0, 18], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: layout.gap, overflow: "hidden" }}>
      {scene.title && (
        <div style={{ opacity: op, transform: `scale(${sc})`, fontSize: scene.title.fontSize ?? Math.round(layout.titleSize * 1.2), fontWeight: scene.title.fontWeight === "black" ? 900 : 700, color: scene.title.color ?? palette.text, textAlign: (scene.title.align ?? "center") as React.CSSProperties["textAlign"], lineHeight: 1.1, padding: `0 ${layout.px}px`, letterSpacing: "-0.02em" }}>
          {scene.title.content}
        </div>
      )}
      <div style={{ width: lineW, height: Math.max(2, Math.round(3 * layout.scale)), background: `linear-gradient(to right, ${accent}, ${palette.primary ?? accent})`, borderRadius: 2 }} />
      {scene.subtitle && (
        <div style={{ opacity: subOp, fontSize: scene.subtitle.fontSize ?? layout.subtitleSize, color: scene.subtitle.color ?? hexToRgba(palette.text, 0.7), textAlign: "center", padding: `0 ${layout.px}px`, lineHeight: 1.5 }}>
          {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
