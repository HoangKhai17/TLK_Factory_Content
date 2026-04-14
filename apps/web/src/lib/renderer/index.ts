import path from "path";
import fs from "fs";
import type { VideoSpec } from "@tlk/shared";

export interface RenderOptions {
  videoId: string;
  spec: VideoSpec;
  onProgress?: (progress: number) => void;
}

export interface RenderResult {
  outputPath: string;
  thumbnailPath: string;
  durationSeconds: number;
}

const OUTPUTS_DIR = path.join(process.cwd(), "public", "outputs");

// Ensure outputs dir exists
if (!fs.existsSync(OUTPUTS_DIR)) {
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

export async function renderVideo(options: RenderOptions): Promise<RenderResult> {
  const { videoId, spec, onProgress } = options;

  const outputDir = path.join(OUTPUTS_DIR, videoId);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, "output.mp4");
  const thumbnailFile = path.join(outputDir, "thumbnail.jpg");

  onProgress?.(5);

  // Dynamic import to avoid issues with Next.js SSR
  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");

  onProgress?.(10);

  // Bundle the composition entry point
  const compositionsEntryPath = path.join(
    process.cwd(),
    "src",
    "remotion",
    "index.tsx"
  );

  const bundleLocation = await bundle({
    entryPoint: compositionsEntryPath,
    webpackOverride: (config) => config,
  });

  onProgress?.(30);

  // Parse resolution
  const [width, height] = spec.resolution.split("x").map(Number) as [
    number,
    number
  ];

  const durationInFrames = spec.duration * spec.fps;

  // Select the composition
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "TLKVideo",
    inputProps: { spec },
    timeoutInMilliseconds: 30000,
  });

  onProgress?.(40);

  // Render the video
  await renderMedia({
    composition: {
      ...composition,
      width,
      height,
      fps: spec.fps,
      durationInFrames,
    },
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputFile,
    inputProps: { spec },
    onProgress: ({ progress }) => {
      onProgress?.(40 + Math.round(progress * 55));
    },
    timeoutInMilliseconds: 300000,
    concurrency: 2,
    jpegQuality: 85,
  });

  onProgress?.(95);

  // Extract thumbnail (frame 1)
  const { renderStill } = await import("@remotion/renderer");
  await renderStill({
    composition: {
      ...composition,
      width,
      height,
      fps: spec.fps,
      durationInFrames,
    },
    serveUrl: bundleLocation,
    output: thumbnailFile,
    inputProps: { spec },
    frame: Math.min(spec.fps, durationInFrames - 1),
    timeoutInMilliseconds: 30000,
  });

  onProgress?.(100);

  return {
    outputPath: `/outputs/${videoId}/output.mp4`,
    thumbnailPath: `/outputs/${videoId}/thumbnail.jpg`,
    durationSeconds: spec.duration,
  };
}
