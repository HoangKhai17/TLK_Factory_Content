import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { DrawPath } from "../shared/SvgInfographic";
import { hexToRgba, parseBackground, LAYOUT } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface QuoteSceneProps {
  scene: Scene;
  accentColor: string;
  palette: ColorPalette;
}

export function QuoteScene({ scene, accentColor, palette }: QuoteSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Large quote mark bursts in
  const markScale = spring({ frame, fps, config: { mass: 0.4, damping: 8 }, from: 0, to: 1 });

  // Quote text
  const quoteOpacity = interpolate(frame, [fps * 0.25, fps * 0.75], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const quoteY = interpolate(frame, [fps * 0.25, fps * 0.75], [30, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Author
  const authorOpacity = interpolate(frame, [fps * 0.7, fps * 1.1], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Horizontal line grows
  const lineW = interpolate(frame, [fps * 0.55, fps * 1.05], [0, 220], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `${LAYOUT.py}px 140px`, gap: 28 }}>
      <BackgroundDecor palette={palette} intensity={0.5} />

      {/* SVG decorative underline arc */}
      <svg style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} width="600" height="60">
        <DrawPath
          d="M 50 40 Q 300 10 550 40"
          totalLength={520}
          color={hexToRgba(accentColor, 0.25)}
          strokeWidth={2}
          startFrame={Math.round(fps * 0.3)}
          durationFrames={Math.round(fps * 0.8)}
        />
      </svg>

      {/* Opening quote mark */}
      <div style={{
        transform: `scale(${markScale})`, alignSelf: "flex-start",
        fontSize: 160, lineHeight: 0.6, color: accentColor,
        opacity: 0.3, fontFamily: "Georgia, serif", marginBottom: -10, userSelect: "none",
        textShadow: `0 0 60px ${hexToRgba(accentColor, 0.6)}`,
        position: "relative", zIndex: 1,
      }}>
        "
      </div>

      {/* Quote text */}
      {scene.title && (
        <div style={{
          opacity: quoteOpacity, transform: `translateY(${quoteY}px)`,
          fontSize: scene.title.fontSize ?? 46, fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          textAlign: "center", lineHeight: 1.5, letterSpacing: "-0.01em",
          fontStyle: "italic",
          position: "relative", zIndex: 1,
        }}>
          {scene.title.content}
        </div>
      )}

      {/* Closing quote mark */}
      <div style={{
        transform: `scale(${markScale})`, alignSelf: "flex-end",
        fontSize: 160, lineHeight: 0.6, color: accentColor,
        opacity: 0.3, fontFamily: "Georgia, serif", marginTop: -10, userSelect: "none",
        position: "relative", zIndex: 1,
      }}>
        "
      </div>

      {/* Accent divider line */}
      <div style={{ width: lineW, height: 3, backgroundColor: accentColor, borderRadius: 2, boxShadow: `0 0 12px ${accentColor}`, position: "relative", zIndex: 1 }} />

      {/* Author */}
      {scene.subtitle && (
        <div style={{
          opacity: authorOpacity,
          fontSize: scene.subtitle.fontSize ?? 26, fontWeight: "600",
          color: scene.subtitle.color ?? accentColor,
          textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase",
          position: "relative", zIndex: 1,
        }}>
          — {scene.subtitle.content}
        </div>
      )}

      {scene.body && (
        <div style={{
          opacity: authorOpacity,
          fontSize: scene.body.fontSize ?? 20,
          color: hexToRgba(palette.text, 0.5),
          textAlign: "center", position: "relative", zIndex: 1,
        }}>
          {scene.body.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
