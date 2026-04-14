import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { VideoSpec } from "@tlk/shared";
import { IntroScene } from "./scenes/IntroScene";
import { OutroScene } from "./scenes/OutroScene";
import { TextScene } from "./scenes/TextScene";

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
        const sceneDurationFrames = Math.round(scene.duration * fps);
        const sceneFrom = currentFrame;
        currentFrame += sceneDurationFrames;

        const sceneElement = (() => {
          switch (scene.type) {
            case "intro":
              return (
                <IntroScene
                  scene={scene}
                  primaryColor={colorPalette.primary}
                  accentColor={colorPalette.accent}
                />
              );
            case "outro":
              return (
                <OutroScene
                  scene={scene}
                  primaryColor={colorPalette.primary}
                  accentColor={colorPalette.accent}
                />
              );
            case "text-animation":
            case "image":
            case "split-screen":
            default:
              return <TextScene scene={scene} />;
          }
        })();

        return (
          <Sequence
            key={scene.id}
            from={sceneFrom}
            durationInFrames={sceneDurationFrames}
            layout="absolute-fill"
          >
            {sceneElement}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
