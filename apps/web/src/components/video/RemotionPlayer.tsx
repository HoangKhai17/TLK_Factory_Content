"use client";

import { Player } from "@remotion/player";
import type { VideoSpec } from "@tlk/shared";
import { TLKVideo } from "@/remotion/compositions/TLKVideo";

interface Props {
  spec: VideoSpec;
  style?: React.CSSProperties;
  controls?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
}

function calcDurationInFrames(spec: VideoSpec): number {
  const total = spec.scenes.reduce(
    (sum, s) => sum + Math.max(spec.fps, Math.round(s.duration * spec.fps)),
    0
  );
  return Math.max(total, spec.fps);
}

export function RemotionPlayer({ spec, style, controls = true, loop = false, autoPlay = false }: Props) {
  const [w, h] = spec.resolution.split("x").map(Number) as [number, number];
  const durationInFrames = calcDurationInFrames(spec);

  return (
    <Player
      component={TLKVideo}
      inputProps={{ spec }}
      durationInFrames={durationInFrames}
      fps={spec.fps}
      compositionWidth={w || 1920}
      compositionHeight={h || 1080}
      style={{ width: "100%", borderRadius: 12, ...style }}
      controls={controls}
      loop={loop}
      autoPlay={autoPlay}
      clickToPlay={!controls}
    />
  );
}
