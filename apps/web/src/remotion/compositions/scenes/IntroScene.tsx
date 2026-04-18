import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

export function IntroScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const accent = scene.glowColor ?? palette.accent;

  const titleSc = spring({ frame, fps, config: { mass: 0.6, damping: 12 }, from: 0.7, to: 1 });
  const titleOp = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const subDelay = Math.round(0.5 * fps);
  const subOp = interpolate(Math.max(0, frame - subDelay), [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY  = interpolate(Math.max(0, frame - subDelay), [0, 16], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineDelay = Math.round(0.3 * fps);
  const lineW = interpolate(Math.max(0, frame - lineDelay), [0, 20], [0, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: layout.gap, overflow: "hidden" }}>
      {scene.title && (
        <div style={{ opacity: titleOp, transform: `scale(${titleSc})`, fontSize: scene.title.fontSize ?? Math.round(layout.titleSize * 1.3), fontWeight: scene.title.fontWeight === "black" ? 900 : scene.title.fontWeight === "bold" ? 700 : 600, color: scene.title.color ?? palette.text, textAlign: (scene.title.align ?? "center") as React.CSSProperties["textAlign"], lineHeight: 1.1, padding: `0 ${layout.px}px`, letterSpacing: "-0.02em" }}>
          {scene.title.content}
        </div>
      )}
      <div style={{ width: lineW, height: Math.max(2, Math.round(3 * layout.scale)), background: `linear-gradient(to right, ${accent}, ${palette.secondary ?? accent})`, borderRadius: 2 }} />
      {scene.subtitle && (
        <div style={{ opacity: subOp, transform: `translateY(${subY}px)`, fontSize: scene.subtitle.fontSize ?? layout.subtitleSize, color: scene.subtitle.color ?? hexToRgba(palette.text, 0.75), textAlign: "center", padding: `0 ${layout.px}px`, lineHeight: 1.5 }}>
          {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
