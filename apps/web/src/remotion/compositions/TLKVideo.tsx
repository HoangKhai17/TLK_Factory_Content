import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoSpec } from "@tlk/shared";
import { IntroScene }      from "./scenes/IntroScene";
import { OutroScene }      from "./scenes/OutroScene";
import { TextScene }       from "./scenes/TextScene";
import { BulletListScene } from "./scenes/BulletListScene";
import { StatScene }       from "./scenes/StatScene";
import { QuoteScene }      from "./scenes/QuoteScene";
import { TimelineScene }   from "./scenes/TimelineScene";
import { SplitScene }      from "./scenes/SplitScene";
import type { ColorPalette } from "./shared/palette";

interface TLKVideoProps {
  spec: VideoSpec;
}

// ── Scene fade wrapper ──────────────────────────────────────────
// Only fades OUT at the end of a scene (dip-to-dark transition).
// No fade-IN — avoids the "black flash" artifact caused by opacity:0 at scene start.
const FADE_OUT = 10; // frames (~0.33s at 30fps)

function SceneWrapper({
  durationFrames,
  children,
  isLast,
}: {
  durationFrames: number;
  children: React.ReactNode;
  isFirst: boolean; // kept for API compat, unused
  isLast: boolean;
}) {
  const frame = useCurrentFrame();

  // Last scene never fades out (clean ending)
  if (isLast) return <AbsoluteFill>{children}</AbsoluteFill>;

  const fadeOut = Math.min(FADE_OUT, Math.floor(durationFrames * 0.15));
  if (fadeOut === 0) return <AbsoluteFill>{children}</AbsoluteFill>;

  const holdEnd = durationFrames - fadeOut;
  const opacity = interpolate(frame, [0, holdEnd, durationFrames], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
}

// ── Animated gradient overlay ────────────────────────────────────
// Slowly pulsing color wash on top of scene content — subtle premium effect.
// Uses blend mode so it tints without fully obscuring the scene.
function AnimatedGradientOverlay({
  colors,
  durationFrames,
}: {
  colors: [string, string];
  durationFrames: number;
}) {
  const frame = useCurrentFrame();

  // Angle slowly shifts 30° over the scene duration
  const angle = interpolate(frame, [0, durationFrames], [135, 165], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Opacity gently breathes: 0 → peak → 0
  const opacity = interpolate(
    frame,
    [0, durationFrames * 0.25, durationFrames * 0.75, durationFrames],
    [0, 0.06, 0.06, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
        opacity,
        mixBlendMode: "screen",
        zIndex: 100,
        pointerEvents: "none",
      }}
    />
  );
}

// Parse "gradient:#hex1,#hex2" → [color1, color2] | null
function parseGradientColors(
  bg: string | undefined | null | unknown,
  palette: ColorPalette
): [string, string] {
  if (typeof bg === "string" && bg.startsWith("gradient:")) {
    const parts = bg.replace("gradient:", "").split(",");
    const c1 = parts[0]?.trim() ?? palette.background;
    const c2 = parts[1]?.trim() ?? c1;
    return [c1, c2];
  }
  if (typeof bg === "string" && bg.startsWith("#")) {
    return [bg, bg];
  }
  // Fallback: use palette
  return [palette.background, palette.primary];
}

// ── Main composition ────────────────────────────────────────────
export function TLKVideo({ spec }: TLKVideoProps) {
  const { fps } = useVideoConfig();
  const { colorPalette, scenes } = spec;

  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: colorPalette.background }}>
      {scenes.map((scene, i) => {
        const durationFrames = Math.round(scene.duration * fps);
        const from = currentFrame;
        currentFrame += durationFrames;

        const isFirst = i === 0;
        const isLast  = i === scenes.length - 1;
        const gradientColors = parseGradientColors(scene.background, colorPalette);

        const el = (() => {
          const common = { scene, palette: colorPalette, accentColor: colorPalette.accent };
          switch (scene.type) {
            case "intro":       return <IntroScene {...common} primaryColor={colorPalette.primary} />;
            case "outro":       return <OutroScene {...common} primaryColor={colorPalette.primary} />;
            case "bullet-list": return <BulletListScene {...common} />;
            case "stat":        return <StatScene {...common} />;
            case "quote":       return <QuoteScene {...common} />;
            case "timeline":    return <TimelineScene {...common} />;
            case "split":
            case "split-screen": return <SplitScene {...common} />;
            case "text-animation":
            case "image":
            case "transition":
            default:            return <TextScene scene={scene} palette={colorPalette} />;
          }
        })();

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationFrames}
            layout="absolute-fill"
          >
            {/* Animated gradient overlay — subtle color wash */}
            <AnimatedGradientOverlay colors={gradientColors} durationFrames={durationFrames} />

            {/* Scene content with fade in/out */}
            <SceneWrapper durationFrames={durationFrames} isFirst={isFirst} isLast={isLast}>
              {el}
            </SceneWrapper>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
