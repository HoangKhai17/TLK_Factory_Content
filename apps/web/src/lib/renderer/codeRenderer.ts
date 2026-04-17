import path from "path";
import fs from "fs";
import type { RenderResult } from "./index";
import { parseCodeMeta } from "@/lib/ai/codeValidator";

const OUTPUTS_DIR = path.join(process.cwd(), "public", "outputs");
const CODEGEN_DIR = path.join(process.cwd(), "src", "remotion", "code-gen");

export async function renderGeneratedCode(
  videoId: string,
  code: string,
  onProgress?: (progress: number) => void,
): Promise<RenderResult> {
  const meta = parseCodeMeta(code);

  const outputDir = path.join(OUTPUTS_DIR, videoId);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, "output.mp4");
  const thumbnailFile = path.join(outputDir, "thumbnail.jpg");

  // Write generated component to disk
  const genDir = path.join(CODEGEN_DIR, videoId);
  fs.mkdirSync(genDir, { recursive: true });

  const componentPath = path.join(genDir, "Component.tsx");
  const entryPath = path.join(genDir, "index.tsx");

  fs.writeFileSync(componentPath, code, "utf-8");

  // Write Remotion composition entry wrapper
  fs.writeFileSync(
    entryPath,
    `import React from "react";
import { Composition, registerRoot } from "remotion";
import GeneratedVideo from "./Component";

const RemotionRoot: React.FC = () => (
  <Composition
    id="GeneratedVideo"
    component={GeneratedVideo as React.ComponentType<Record<string, unknown>>}
    durationInFrames={${meta.duration * meta.fps}}
    fps={${meta.fps}}
    width={${meta.width}}
    height={${meta.height}}
    defaultProps={{}}
  />
);

registerRoot(RemotionRoot);
`,
    "utf-8",
  );

  onProgress?.(10);

  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");

  const bundleLocation = await bundle({
    entryPoint: entryPath,
    webpackOverride: (config) => config,
    enableCaching: false,
  });

  onProgress?.(30);

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "GeneratedVideo",
    inputProps: {},
    timeoutInMilliseconds: 30000,
  });

  onProgress?.(40);

  await renderMedia({
    composition: {
      ...composition,
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      durationInFrames: meta.duration * meta.fps,
    },
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputFile,
    inputProps: {},
    onProgress: ({ progress }) => onProgress?.(40 + Math.round(progress * 50)),
    timeoutInMilliseconds: 300000,
    concurrency: 2,
    jpegQuality: 85,
  });

  onProgress?.(90);

  const { renderStill } = await import("@remotion/renderer");
  await renderStill({
    composition: {
      ...composition,
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      durationInFrames: meta.duration * meta.fps,
    },
    serveUrl: bundleLocation,
    output: thumbnailFile,
    inputProps: {},
    frame: Math.min(meta.fps, meta.duration * meta.fps - 1),
    timeoutInMilliseconds: 30000,
  });

  onProgress?.(100);

  // Clean up generated source after render
  try {
    fs.rmSync(genDir, { recursive: true, force: true });
  } catch { /* best-effort cleanup */ }

  return {
    outputPath: `/outputs/${videoId}/output.mp4`,
    thumbnailPath: `/outputs/${videoId}/thumbnail.jpg`,
    durationSeconds: meta.duration,
  };
}
