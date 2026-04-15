import type { ComponentType } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { VideoSpec } from "@tlk/shared";
import { IntroScene }      from "./scenes/IntroScene";
import { OutroScene }      from "./scenes/OutroScene";
import { TextScene }       from "./scenes/TextScene";
import { BulletListScene } from "./scenes/BulletListScene";
import { StatScene }       from "./scenes/StatScene";
import { QuoteScene }      from "./scenes/QuoteScene";
import { TimelineScene }   from "./scenes/TimelineScene";
import { SplitScene }      from "./scenes/SplitScene";

interface TLKVideoProps {
  spec: VideoSpec;
}

export function TLKVideo({ spec }: TLKVideoProps) {
  const { fps } = useVideoConfig();
  const { colorPalette, scenes } = spec;

  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: colorPalette.background }}>
      {scenes.map((scene) => {
        const durationFrames = Math.round(scene.duration * fps);
        const from = currentFrame;
        currentFrame += durationFrames;

        const el = (() => {
          // Common props passed to every scene
          const common = { scene, palette: colorPalette, accentColor: colorPalette.accent };

          switch (scene.type) {
            case "intro":
              return <IntroScene {...common} primaryColor={colorPalette.primary} />;
            case "outro":
              return <OutroScene {...common} primaryColor={colorPalette.primary} />;
            case "bullet-list":
              return <BulletListScene {...common} />;
            case "stat":
              return <StatScene {...common} />;
            case "quote":
              return <QuoteScene {...common} />;
            case "timeline":
              return <TimelineScene {...common} />;
            case "split":
            case "split-screen":
              return <SplitScene {...common} />;
            case "text-animation":
            case "image":
            case "transition":
            default:
              return <TextScene scene={scene} palette={colorPalette} />;
          }
        })();

        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationFrames} layout="absolute-fill">
            {el}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
