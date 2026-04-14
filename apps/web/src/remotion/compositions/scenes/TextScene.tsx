import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene, TextElement } from "@tlk/shared";

interface TextSceneProps {
  scene: Scene;
}

interface AnimatedTextProps {
  element: TextElement;
  startFrame: number;
}

function AnimatedText({ element, startFrame }: AnimatedTextProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = element.animationDelay ?? 0;
  const effectiveFrame = Math.max(0, frame - startFrame - delay * fps);

  let opacity = 1;
  let translateY = 0;
  let translateX = 0;
  let scale = 1;

  switch (element.animation) {
    case "fadeIn":
      opacity = interpolate(effectiveFrame, [0, fps * 0.5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "slideInUp":
      opacity = interpolate(effectiveFrame, [0, fps * 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      translateY = interpolate(effectiveFrame, [0, fps * 0.5], [60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "slideInDown":
      opacity = interpolate(effectiveFrame, [0, fps * 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      translateY = interpolate(effectiveFrame, [0, fps * 0.5], [-60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "slideInLeft":
      opacity = interpolate(effectiveFrame, [0, fps * 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      translateX = interpolate(effectiveFrame, [0, fps * 0.5], [-80, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "slideInRight":
      opacity = interpolate(effectiveFrame, [0, fps * 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      translateX = interpolate(effectiveFrame, [0, fps * 0.5], [80, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    case "zoomIn":
      opacity = interpolate(effectiveFrame, [0, fps * 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      scale = spring({
        frame: effectiveFrame,
        fps,
        config: { mass: 0.5, damping: 12 },
        from: 0.5,
        to: 1,
      });
      break;
    case "typewriter":
      // Will use character clipping approach
      break;
  }

  const content =
    element.animation === "typewriter"
      ? element.content.slice(
          0,
          Math.floor(
            interpolate(effectiveFrame, [0, fps * 1.5], [0, element.content.length], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          )
        )
      : element.content;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`,
        fontSize: element.fontSize ?? 48,
        fontWeight: element.fontWeight ?? "bold",
        color: element.color ?? "#ffffff",
        textAlign: element.align ?? "center",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        padding: "0 40px",
        textShadow: "0 2px 20px rgba(0,0,0,0.3)",
      }}
    >
      {content}
    </div>
  );
}

function parseBackground(bg: string | undefined): React.CSSProperties {
  if (!bg) return { backgroundColor: "#0f0f0f" };
  if (bg.startsWith("gradient:")) {
    const colors = bg.replace("gradient:", "").split(",");
    return {
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    };
  }
  return { backgroundColor: bg };
}

export function TextScene({ scene }: TextSceneProps) {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        ...parseBackground(scene.background),
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {scene.overlay && (
        <AbsoluteFill style={{ backgroundColor: scene.overlay }} />
      )}
      {scene.title && (
        <AnimatedText element={scene.title} startFrame={0} />
      )}
      {scene.subtitle && (
        <AnimatedText
          element={scene.subtitle}
          startFrame={Math.round(fps * 0.3)}
        />
      )}
      {scene.body && (
        <AnimatedText
          element={scene.body}
          startFrame={Math.round(fps * 0.6)}
        />
      )}
    </AbsoluteFill>
  );
}
