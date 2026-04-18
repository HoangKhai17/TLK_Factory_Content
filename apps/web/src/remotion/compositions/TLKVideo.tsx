import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { VideoSpec, Scene } from "@tlk/shared";
import type { ColorPalette } from "./shared/palette";
import { IntroScene }        from "./scenes/IntroScene";
import { OutroScene }        from "./scenes/OutroScene";
import { TextScene }         from "./scenes/TextScene";
import { BulletListScene }   from "./scenes/BulletListScene";
import { StatScene }         from "./scenes/StatScene";
import { QuoteScene }        from "./scenes/QuoteScene";
import { TimelineScene }     from "./scenes/TimelineScene";
import { SplitScene }        from "./scenes/SplitScene";
import { MotionGraphicsScene } from "./scenes/MotionGraphicsScene";
import { CardsScene }        from "./scenes/CardsScene";

function renderScene(scene: Scene, palette: ColorPalette) {
  const p = { scene, palette };
  switch (scene.type) {
    case "intro":           return <IntroScene {...p} />;
    case "outro":           return <OutroScene {...p} />;
    case "bullet-list":     return <BulletListScene {...p} />;
    case "stat":            return <StatScene {...p} />;
    case "quote":           return <QuoteScene {...p} />;
    case "timeline":        return <TimelineScene {...p} />;
    case "split":
    case "split-screen":    return <SplitScene {...p} />;
    case "motion-graphics": return <MotionGraphicsScene {...p} />;
    case "cards":           return <CardsScene {...p} />;
    default:                return <TextScene {...p} />;
  }
}

export function TLKVideo({ spec }: { spec: VideoSpec }) {
  const { fps } = useVideoConfig();
  const { colorPalette, scenes } = spec;

  if (!scenes?.length) {
    return <AbsoluteFill style={{ backgroundColor: colorPalette.background }} />;
  }

  let frameOffset = 0;
  const items = scenes.map((scene) => {
    const dur = Math.max(fps, Math.round(scene.duration * fps));
    const from = frameOffset;
    frameOffset += dur;
    return { scene, from, dur };
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: colorPalette.background,
      fontFamily: spec.font?.heading ?? "Inter, sans-serif",
      overflow: "hidden",
    }}>
      {items.map(({ scene, from, dur }) => (
        <Sequence key={scene.id} from={from} durationInFrames={dur}>
          {renderScene(scene, colorPalette)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
