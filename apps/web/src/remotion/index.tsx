import type { ComponentType } from "react";
import { Composition } from "remotion";
import type { VideoSpec } from "@tlk/shared";
import { TLKVideo } from "./compositions/TLKVideo";

const DEFAULT_SPEC: VideoSpec = {
  type: "youtube",
  title: "TLK Factory Preview",
  duration: 10,
  fps: 30,
  resolution: "1920x1080",
  colorPalette: {
    primary: "#1a1a2e",
    secondary: "#16213e",
    accent: "#0f3460",
    background: "#0a0a0f",
    text: "#ffffff",
  },
  font: { heading: "Inter", body: "Inter" },
  scenes: [
    {
      id: "scene-1",
      type: "intro",
      duration: 5,
      background: "gradient:#1a1a2e,#0f3460",
      title: {
        content: "TLK Factory",
        fontSize: 80,
        fontWeight: "black",
        color: "#ffffff",
        align: "center",
        animation: "slideInUp",
      },
      subtitle: {
        content: "Video Automation Platform",
        fontSize: 32,
        fontWeight: "normal",
        color: "rgba(255,255,255,0.7)",
        align: "center",
        animation: "fadeIn",
        animationDelay: 0.3,
      },
    },
    {
      id: "scene-2",
      type: "outro",
      duration: 5,
      background: "gradient:#0f3460,#1a1a2e",
      title: {
        content: "Bắt đầu ngay hôm nay",
        fontSize: 60,
        fontWeight: "bold",
        color: "#ffffff",
        align: "center",
        animation: "zoomIn",
      },
      subtitle: {
        content: "Tạo video tự động với AI",
        fontSize: 28,
        fontWeight: "normal",
        color: "rgba(255,255,255,0.7)",
        align: "center",
        animation: "fadeIn",
      },
    },
  ],
  audio: { backgroundMusic: "none" },
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TLKVideo"
      component={TLKVideo as unknown as ComponentType<Record<string, unknown>>}
      durationInFrames={DEFAULT_SPEC.duration * DEFAULT_SPEC.fps}
      fps={DEFAULT_SPEC.fps}
      width={1920}
      height={1080}
      defaultProps={{ spec: DEFAULT_SPEC }}
    />
  );
};
