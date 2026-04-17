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

// Number of frames each pair of scenes overlaps for cross-dissolve.
// Must match CROSS_DISSOLVE_FRAMES in renderer/index.ts
const CROSS_DISSOLVE = 12;

// ── Cross-dissolve scene wrapper ────────────────────────────────
// Each scene fades in (except the first) and fades out (except the last).
// Paired with overlapping Sequence start times this creates a smooth dissolve.
function SceneWrapper({
  durationFrames,
  isFirst,
  isLast,
  children,
}: {
  durationFrames: number;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();

  if (isFirst && isLast) return <AbsoluteFill>{children}</AbsoluteFill>;

  // Fade in (not applied to first scene — starts at full opacity)
  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, CROSS_DISSOLVE], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  // Fade out (not applied to last scene — ends at full opacity)
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [durationFrames - CROSS_DISSOLVE, durationFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
}

// ── Subtle animated overlay ──────────────────────────────────────
// Very subtle color wash that breathes in/out during each scene.
function AnimatedGradientOverlay({
  colors,
  durationFrames,
}: {
  colors: [string, string];
  durationFrames: number;
}) {
  const frame = useCurrentFrame();

  const angle = interpolate(frame, [0, durationFrames], [135, 165], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(
    frame,
    [0, durationFrames * 0.25, durationFrames * 0.75, durationFrames],
    [0, 0.05, 0.05, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
        opacity,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
}

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
  if (typeof bg === "string" && bg.startsWith("#")) return [bg, bg];
  return [palette.background, palette.primary];
}

// ── Main composition ────────────────────────────────────────────
export function TLKVideo({ spec }: TLKVideoProps) {
  const { fps } = useVideoConfig();
  const { colorPalette, scenes } = spec;

  // Pre-calculate frame ranges with dissolve overlap
  let offset = 0;
  const sceneEntries = scenes.map((scene, i) => {
    const durationFrames = Math.round(scene.duration * fps);
    const from = offset;
    // All scenes except last: offset advances by (duration - dissolve), creating overlap
    if (i < scenes.length - 1) {
      offset += durationFrames - CROSS_DISSOLVE;
    }
    return {
      scene,
      from,
      durationFrames,
      isFirst: i === 0,
      isLast: i === scenes.length - 1,
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colorPalette.background }}>
      {sceneEntries.map(({ scene, from, durationFrames, isFirst, isLast }) => {
        const gradientColors = parseGradientColors(scene.background, colorPalette);
        const common = { scene, palette: colorPalette, accentColor: colorPalette.accent };

        const el = (() => {
          switch (scene.type) {
            case "intro":         return <IntroScene {...common} primaryColor={colorPalette.primary} />;
            case "outro":         return <OutroScene {...common} primaryColor={colorPalette.primary} />;
            case "bullet-list":   return <BulletListScene {...common} />;
            case "stat":          return <StatScene {...common} />;
            case "quote":         return <QuoteScene {...common} />;
            case "timeline":      return <TimelineScene {...common} />;
            case "split":
            case "split-screen":  return <SplitScene {...common} />;
            default:              return <TextScene scene={scene} palette={colorPalette} />;
          }
        })();

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationFrames}
            layout="absolute-fill"
          >
            <AnimatedGradientOverlay colors={gradientColors} durationFrames={durationFrames} />
            <SceneWrapper durationFrames={durationFrames} isFirst={isFirst} isLast={isLast}>
              {el}
            </SceneWrapper>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
