import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { DrawPath } from "../shared/SvgInfographic";
import { hexToRgba, parseBackground, useLayout } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface QuoteSceneProps {
  scene: Scene;
  accentColor: string;
  palette: ColorPalette;
}

export function QuoteScene({ scene, accentColor, palette }: QuoteSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const markScale   = spring({ frame, fps, config: { mass: 0.4, damping: 8 }, from: 0, to: 1 });
  const quoteOpacity = interpolate(frame, [fps * 0.25, fps * 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const quoteY       = interpolate(frame, [fps * 0.25, fps * 0.75], [25, 0],  { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const authorOpacity = interpolate(frame, [fps * 0.7, fps * 1.1], [0, 1],  { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW        = interpolate(frame, [fps * 0.55, fps * 1.05], [0, Math.round(200 * layout.scale)], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const quoteMarkSz = Math.round(130 * layout.scale);
  const hPad        = Math.round(130 * layout.scale);

  return (
    <AbsoluteFill style={{
      ...parseBackground(scene.background, palette),
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: `${layout.py}px ${hPad}px`,
      gap: Math.round(24 * layout.scale),
      overflow: "hidden",
    }}>
      <BackgroundDecor palette={palette} intensity={0.5} />

      {/* Decorative arc at bottom */}
      <svg style={{ position: "absolute", bottom: Math.round(60 * layout.scale), left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}
        width={Math.round(500 * layout.scale)} height={Math.round(50 * layout.scale)}>
        <DrawPath
          d={`M ${Math.round(40 * layout.scale)} ${Math.round(35 * layout.scale)} Q ${Math.round(250 * layout.scale)} ${Math.round(8 * layout.scale)} ${Math.round(460 * layout.scale)} ${Math.round(35 * layout.scale)}`}
          totalLength={450}
          color={hexToRgba(accentColor, 0.25)}
          strokeWidth={2}
          startFrame={Math.round(fps * 0.3)}
          durationFrames={Math.round(fps * 0.8)}
        />
      </svg>

      {/* Opening quote */}
      <div style={{
        transform: `scale(${markScale})`, alignSelf: "flex-start",
        fontSize: quoteMarkSz, lineHeight: 0.6, color: accentColor,
        opacity: 0.3, fontFamily: "Georgia, serif", marginBottom: Math.round(-8 * layout.scale),
        userSelect: "none", textShadow: `0 0 60px ${hexToRgba(accentColor, 0.6)}`,
        position: "relative", zIndex: 1,
      }}>
        "
      </div>

      {scene.title && (
        <div style={{
          opacity: quoteOpacity, transform: `translateY(${quoteY}px)`,
          fontSize: scene.title.fontSize ?? Math.round(44 * layout.scale), fontWeight: "bold",
          color: scene.title.color ?? palette.text,
          textAlign: "center", lineHeight: 1.5, letterSpacing: "-0.01em", fontStyle: "italic",
          position: "relative", zIndex: 1,
        }}>
          {scene.title.content}
        </div>
      )}

      {/* Closing quote */}
      <div style={{
        transform: `scale(${markScale})`, alignSelf: "flex-end",
        fontSize: quoteMarkSz, lineHeight: 0.6, color: accentColor,
        opacity: 0.3, fontFamily: "Georgia, serif", marginTop: Math.round(-8 * layout.scale),
        userSelect: "none", position: "relative", zIndex: 1,
      }}>
        "
      </div>

      {/* Divider line */}
      <div style={{
        width: lineW, height: 3, backgroundColor: accentColor, borderRadius: 2,
        boxShadow: `0 0 12px ${accentColor}`, position: "relative", zIndex: 1,
      }} />

      {scene.subtitle && (
        <div style={{
          opacity: authorOpacity,
          fontSize: scene.subtitle.fontSize ?? layout.subtitleSize, fontWeight: 600,
          color: scene.subtitle.color ?? accentColor,
          textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase",
          position: "relative", zIndex: 1,
        }}>
          — {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
