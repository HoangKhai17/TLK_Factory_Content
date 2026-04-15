import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, TextElement } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { hexToRgba, parseBackground, LAYOUT } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface AnimatedTextProps {
  element: TextElement;
  startFrame: number;
  palette: ColorPalette;
}

function AnimatedText({ element, startFrame, palette }: AnimatedTextProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = element.animationDelay ?? 0;
  const eff = Math.max(0, frame - startFrame - delay * fps);

  let opacity = 1;
  let translateY = 0;
  let translateX = 0;
  let scale = 1;

  switch (element.animation) {
    case "fadeIn":
      opacity = interpolate(eff, [0, fps * 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      break;
    case "slideInUp":
      opacity = interpolate(eff, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      translateY = interpolate(eff, [0, fps * 0.5], [60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      break;
    case "slideInDown":
      opacity = interpolate(eff, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      translateY = interpolate(eff, [0, fps * 0.5], [-60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      break;
    case "slideInLeft":
      opacity = interpolate(eff, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      translateX = interpolate(eff, [0, fps * 0.5], [-80, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      break;
    case "slideInRight":
      opacity = interpolate(eff, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      translateX = interpolate(eff, [0, fps * 0.5], [80, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      break;
    case "zoomIn":
      opacity = interpolate(eff, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      scale = spring({ frame: eff, fps, config: { mass: 0.5, damping: 12 }, from: 0.5, to: 1 });
      break;
    case "typewriter":
      break;
  }

  const content =
    element.animation === "typewriter"
      ? element.content.slice(0, Math.floor(interpolate(eff, [0, fps * 1.5], [0, element.content.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))
      : element.content;

  return (
    <div style={{
      opacity, transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`,
      fontSize: element.fontSize ?? 48, fontWeight: element.fontWeight ?? "bold",
      color: element.color ?? palette.text,
      textAlign: element.align ?? "center", lineHeight: 1.2,
      letterSpacing: "-0.02em", padding: "0 40px",
    }}>
      {content}
    </div>
  );
}

interface TextSceneProps {
  scene: Scene;
  palette: ColorPalette;
}

export function TextScene({ scene, palette }: TextSceneProps) {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      ...parseBackground(scene.background, palette),
      justifyContent: "center", alignItems: "center",
      flexDirection: "column", gap: 20,
    }}>
      <BackgroundDecor palette={palette} />

      {scene.overlay && <AbsoluteFill style={{ backgroundColor: scene.overlay }} />}

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>
        {scene.title && <AnimatedText element={scene.title} startFrame={0} palette={palette} />}
        {scene.subtitle && <AnimatedText element={scene.subtitle} startFrame={Math.round(fps * 0.3)} palette={palette} />}
        {scene.body && <AnimatedText element={scene.body} startFrame={Math.round(fps * 0.6)} palette={palette} />}
      </div>
    </AbsoluteFill>
  );
}
