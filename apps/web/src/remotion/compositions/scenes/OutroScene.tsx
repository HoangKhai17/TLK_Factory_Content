import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene } from "@tlk/shared";

interface OutroSceneProps {
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

export function OutroScene({ scene, primaryColor, accentColor }: OutroSceneProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Rings animation
  const ring1Scale = spring({
    frame,
    fps,
    config: { mass: 0.8, damping: 6 },
    from: 0,
    to: 1,
  });

  const ring2Scale = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { mass: 0.8, damping: 6 },
    from: 0,
    to: 1,
  });

  const titleY = interpolate(frame, [fps * 0.3, fps * 0.7], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [fps * 0.3, fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [fps * 0.6, fps * 1.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        ...parseBackground(scene.background, primaryColor),
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 28,
        opacity: fadeIn,
      }}
    >
      {/* Concentric rings */}
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `2px solid ${accentColor}40`,
            transform: `scale(${ring2Scale})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 20,
            borderRadius: "50%",
            border: `2px solid ${accentColor}70`,
            transform: `scale(${ring1Scale})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 40,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
            transform: `scale(${ring1Scale})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          />
        </div>
      </div>

      {/* Title */}
      {scene.title && (
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontSize: scene.title.fontSize ?? 56,
            fontWeight: "bold",
            color: scene.title.color ?? "#ffffff",
            textAlign: "center",
            letterSpacing: "-0.02em",
            padding: "0 60px",
          }}
        >
          {scene.title.content}
        </div>
      )}

      {/* Subtitle / CTA */}
      {scene.subtitle && (
        <div
          style={{
            opacity: ctaOpacity,
            fontSize: scene.subtitle.fontSize ?? 24,
            color: scene.subtitle.color ?? "rgba(255,255,255,0.75)",
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          {scene.subtitle.content}
        </div>
      )}

      {/* Accent dot row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          opacity: ctaOpacity,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: i === 1 ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === 1 ? accentColor : `${accentColor}60`,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
