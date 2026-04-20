import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import type { VideoSpec, Scene } from "../../shared/types.js";
import { logger } from "../utils/logger.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? "./output");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function hexToFfmpeg(hex: string): string {
  return `0x${hex.replace("#", "").padEnd(6, "0")}`;
}

function escapeFfmpegText(s: string): string {
  // Strip characters that break ffmpeg filter parsing
  return s
    .replace(/[':=\\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function buildVfFilter(scene: Scene, spec: VideoSpec, w: number, h: number): string {
  const fg = hexToFfmpeg(scene.textColor ?? spec.textColor);
  const accent = hexToFfmpeg(spec.accentColor);
  const parts: string[] = [];

  // Accent bar
  parts.push(`drawbox=x=0:y=0:w=${w}:h=8:color=${accent}:t=fill`);

  // Title — fixed center position
  if (scene.title) {
    const titleY = Math.round(h * 0.38);
    parts.push(`drawtext=text='${escapeFfmpegText(scene.title)}':fontsize=56:fontcolor=${fg}:x=(w-text_w)/2:y=${titleY}`);
  }

  // Body lines — fixed y offsets, no expressions
  const bodyY = Math.round(h * 0.55);
  if (scene.bullets?.length) {
    scene.bullets.slice(0, 4).forEach((b, i) => {
      parts.push(`drawtext=text='${escapeFfmpegText("- " + b)}':fontsize=26:fontcolor=${fg}:x=${Math.round(w * 0.08)}:y=${bodyY + i * 40}`);
    });
  } else if (scene.content) {
    parts.push(`drawtext=text='${escapeFfmpegText(scene.content)}':fontsize=30:fontcolor=${fg}:x=(w-text_w)/2:y=${bodyY}`);
  }

  // Join with comma — passed via -vf directly (not through fluent-ffmpeg parser)
  return parts.join(",");
}

async function renderScene(
  scene: Scene,
  spec: VideoSpec,
  outputFile: string,
  sceneIndex: number
): Promise<void> {
  const { fps } = spec;
  const [w, h] = spec.resolution.split("x").map(Number) as [number, number];
  const bg = hexToFfmpeg(scene.background ?? spec.background);
  const duration = scene.duration;
  const vf = buildVfFilter(scene, spec, w, h);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`color=c=${bg}:size=${w}x${h}:rate=${fps}:duration=${duration}`)
      .inputOptions(["-f lavfi"])
      .outputOptions(["-vf", vf, `-t`, String(duration), `-r`, String(fps), "-pix_fmt", "yuv420p"])
      .output(outputFile)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

async function concatScenes(sceneFiles: string[], outputFile: string): Promise<void> {
  const listFile = outputFile + ".list.txt";
  const content = sceneFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(listFile, content);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .output(outputFile)
      .on("end", () => {
        fs.unlinkSync(listFile);
        resolve();
      })
      .on("error", reject)
      .run();
  });
}

async function extractThumbnail(videoFile: string, thumbnailFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoFile)
      .screenshots({ timestamps: ["00:00:01"], filename: path.basename(thumbnailFile), folder: path.dirname(thumbnailFile), size: "640x?" })
      .on("end", () => resolve())
      .on("error", reject);
  });
}

export interface RenderResult {
  outputPath: string;
  thumbnailPath: string;
  durationSeconds: number;
}

export async function renderVideo(
  jobId: string,
  spec: VideoSpec,
  onProgress: (p: number) => void
): Promise<RenderResult> {
  const jobDir = path.join(OUTPUT_DIR, jobId);
  ensureDir(jobDir);

  const sceneFiles: string[] = [];

  for (let i = 0; i < spec.scenes.length; i++) {
    const scene = spec.scenes[i]!;
    const sceneFile = path.join(jobDir, `scene_${i}.mp4`);
    logger.info(`[renderer] Rendering scene ${i + 1}/${spec.scenes.length}`);
    await renderScene(scene, spec, sceneFile, i);
    sceneFiles.push(sceneFile);
    onProgress(Math.round(10 + (i + 1) / spec.scenes.length * 75));
  }

  const outputFile = path.join(jobDir, "output.mp4");
  logger.info("[renderer] Concatenating scenes...");
  await concatScenes(sceneFiles, outputFile);
  onProgress(90);

  const thumbnailFile = path.join(jobDir, "thumbnail.jpg");
  try {
    await extractThumbnail(outputFile, thumbnailFile);
  } catch (e) {
    logger.warn("[renderer] Thumbnail extraction failed:", e);
  }

  // Cleanup scene files
  for (const f of sceneFiles) {
    try { fs.unlinkSync(f); } catch {}
  }

  onProgress(100);
  logger.info(`[renderer] Done: ${outputFile}`);

  return {
    outputPath: `/output/${jobId}/output.mp4`,
    thumbnailPath: `/output/${jobId}/thumbnail.jpg`,
    durationSeconds: spec.duration,
  };
}
