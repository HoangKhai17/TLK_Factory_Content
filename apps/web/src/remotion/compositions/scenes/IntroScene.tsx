import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene } from "@tlk/shared";

interface IntroSceneProps {
  scene: Scene;
  primaryColor: string;
  accentColor: string;
}

function parseBackground(bg: string | undefined, fallback: string): React.CSSProperties {
  if (!bg) return { backgroundColor: fallback };
  if (bg.startsWith("gradient:")) {
    const colors = bg.replace("gradient:", "").split(",");
    return {
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    };
  }
  return { backgroundColor: bg };
}

export function IntroScene({ scene, primaryColor, accentColor }: IntroSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Accent line animation
  const lineWidth = interpolate(frame, [fps * 0.2, fps * 0.7], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleOpacity = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, fps * 0.5], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle with spring
  const subtitleScale = spring({
    frame: Math.max(0, frame - Math.round(fps * 0.4)),
    fps,
    config: { mass: 0.5, damping: 10 },
    from: 0.8,
    to: 1,
  });
  const subtitleOpacity = interpolate(
    frame,
    [fps * 0.4, fps * 0.8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Logo circle pulse
  const circleScale = spring({
    frame,
    fps,
    config: { mass: 0.6, damping: 8 },
    from: 0,
    to: 1,
  });

  return (
    <AbsoluteFill
      style={{
        ...parseBackground(scene.background, primaryColor),
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Decorative circle */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
          transform: `scale(${circleScale})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 40px ${accentColor}60`,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        />
      </div>

      {/* Title */}
      {scene.title && (
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontSize: scene.title.fontSize ?? 72,
            fontWeight: scene.title.fontWeight ?? "black",
            color: scene.title.color ?? "#ffffff",
            textAlign: "center",
            letterSpacing: "-0.03em",
            padding: "0 60px",
            lineHeight: 1.1,
          }}
        >
          {scene.title.content}
        </div>
      )}

      {/* Accent line */}
      <div
        style={{
          width: lineWidth,
          height: 4,
          backgroundColor: accentColor,
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      {scene.subtitle && (
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `scale(${subtitleScale})`,
            fontSize: scene.subtitle.fontSize ?? 28,
            fontWeight: scene.subtitle.fontWeight ?? "normal",
            color: scene.subtitle.color ?? "rgba(255,255,255,0.8)",
            textAlign: "center",
            padding: "0 80px",
            lineHeight: 1.5,
          }}
        >
          {scene.subtitle.content}
        </div>
      )}
    </AbsoluteFill>
  );
}
