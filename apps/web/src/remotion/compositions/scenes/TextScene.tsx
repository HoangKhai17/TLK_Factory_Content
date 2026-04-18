import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { parseBackground, hexToRgba, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface Props { scene: Scene; palette: ColorPalette }

function titleAnim(anim: string | undefined, frame: number, fps: number) {
  const op = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (anim === "zoomIn") {
    const sc = spring({ frame, fps, config: { mass: 0.5, damping: 11 }, from: 0.6, to: 1 });
    return { opacity: op, transform: `scale(${sc})` };
  }
  if (anim === "slideInDown") {
    const y = interpolate(frame, [0, 18], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { opacity: op, transform: `translateY(${y}px)` };
  }
  if (anim === "slideInLeft") {
    const x = interpolate(frame, [0, 18], [-60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { opacity: op, transform: `translateX(${x}px)` };
  }
  const y = interpolate(frame, [0, 18], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: op, transform: `translateY(${y}px)` };
}

export function TextScene({ scene, palette }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const tStyle = titleAnim(scene.title?.animation, frame, fps);
  const subDelay = Math.round(0.5 * fps);
  const subOp = interpolate(Math.max(0, frame - subDelay), [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bodyDelay = Math.round(0.9 * fps);
  const bodyOp = interpolate(Math.max(0, frame - bodyDelay), [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: layout.gap, overflow: "hidden", padding: `${layout.py}px ${layout.px}px` }}>
      {scene.title && (
        <div style={{ ...tStyle, fontSize: scene.title.fontSize ?? layout.titleSize, fontWeight: scene.title.fontWeight === "black" ? 900 : scene.title.fontWeight === "bold" ? 700 : 600, color: scene.title.color ?? palette.text, textAlign: (scene.title.align ?? "center") as React.CSSProperties["textAlign"], lineHeight: 1.15 }}>
          {scene.title.content}
        </div>
      )}
      {scene.subtitle && (
        <div style={{ opacity: subOp, fontSize: scene.subtitle.fontSize ?? layout.subtitleSize, color: scene.subtitle.color ?? hexToRgba(palette.text, 0.75), textAlign: "center", lineHeight: 1.5 }}>
          {scene.subtitle.content}
        </div>
      )}
      {scene.body && (
        <div style={{ opacity: bodyOp, fontSize: scene.body.fontSize ?? layout.bodySize, color: scene.body.color ?? hexToRgba(palette.text, 0.6), textAlign: "center", lineHeight: 1.6 }}>
          {scene.body.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
