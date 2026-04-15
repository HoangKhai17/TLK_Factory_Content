import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "@tlk/shared";
import { BackgroundDecor } from "../shared/BackgroundDecor";
import { hexToRgba, parseBackground, LAYOUT } from "../shared/palette";
import type { ColorPalette } from "../shared/palette";

interface IntroSceneProps {
  scene: Scene;
  primaryColor: string;
  accentColor: string;
  palette: ColorPalette;
}

export function IntroScene({ scene, accentColor, palette }: IntroSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animated outer ring
  const ringScale = spring({ frame, fps, config: { mass: 0.7, damping: 12 }, from: 0.2, to: 1 });
  const ringOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Rotating ring
  const rotation = interpolate(frame, [0, fps * 10], [0, 360], {
    extrapolateLeft: "clamp", extrapolateRight: "wrap",
  });

  // Title
  const titleOpacity = interpolate(frame, [fps * 0.2, fps * 0.6], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [fps * 0.2, fps * 0.6], [50, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Subtitle
  const subOpacity = interpolate(frame, [fps * 0.5, fps * 0.9], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const subScale = spring({ frame: Math.max(0, frame - Math.round(fps * 0.5)), fps, config: { mass: 0.4, damping: 10 }, from: 0.85, to: 1 });

  // Line grow
  const lineW = interpolate(frame, [fps * 0.4, fps * 0.85], [0, 140], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...parseBackground(scene.background, palette), justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}>
      <BackgroundDecor palette={palette} intensity={0.7} />

      {/* Animated SVG rings */}
      <div style={{ position: "relative", width: 130, height: 130, opacity: ringOpacity, transform: `scale(${ringScale})` }}>
        <svg viewBox="0 0 130 130" style={{ position: "absolute", inset: 0, transform: `rotate(${rotation}deg)` }}>
          {/* Outer dashed ring */}
          <circle cx={65} cy={65} r={60} fill="none" stroke={hexToRgba(accentColor, 0.4)} strokeWidth={1.5} strokeDasharray="8 6" />
          {/* Inner ring */}
          <circle cx={65} cy={65} r={46} fill="none" stroke={hexToRgba(accentColor, 0.25)} strokeWidth={1} />
          {/* Accent dots on ring */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <circle key={deg} cx={65 + 60 * Math.cos(rad)} cy={65 + 60 * Math.sin(rad)} r={4} fill={accentColor} style={{ filter: `drop-shadow(0 0 6px ${accentColor})` }} />
            );
          })}
        </svg>
        {/* Center filled circle */}
        <div style={{
          position: "absolute", inset: 20, borderRadius: "50%",
          background: `linear-gradient(135deg, ${accentColor}, ${palette.primary})`,
          boxShadow: `0 0 40px ${hexToRgba(accentColor, 0.5)}, 0 0 80px ${hexToRgba(accentColor, 0.2)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: "50%", height: "50%", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>

      {/* Title */}
      {scene.title && (
        <div style={{
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          fontSize: scene.title.fontSize ?? 76,
          fontWeight: scene.title.fontWeight ?? "black",
          color: scene.title.color ?? palette.text,
          textAlign: "center", letterSpacing: "-0.03em",
          lineHeight: 1.1, padding: "0 80px",
          textShadow: `0 4px 30px ${hexToRgba(accentColor, 0.3)}`,
        }}>
          {scene.title.content}
        </div>
      )}

      {/* Accent line */}
      <div style={{ width: lineW, height: 3, backgroundColor: accentColor, borderRadius: 2, boxShadow: `0 0 12px ${accentColor}` }} />

      {/* Subtitle */}
      {scene.subtitle && (
        <div style={{
          opacity: subOpacity, transform: `scale(${subScale})`,
          fontSize: scene.subtitle.fontSize ?? LAYOUT.subtitleSize,
          fontWeight: "normal",
          color: scene.subtitle.color ?? hexToRgba(palette.text, 0.75),
          textAlign: "center", padding: "0 100px", lineHeight: 1.5,
        }}>
          {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
