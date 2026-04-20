import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import type { VideoSpec, Scene } from "../../shared/types.js";
import { logger } from "../utils/logger.js";

const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? "./output");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Build a color-fill + text overlay ffmpeg filter for a scene */
function buildSceneFilter(scene: Scene, spec: VideoSpec, sceneIndex: number): string {
  const bg = scene.background ?? spec.background;
  const fg = scene.textColor ?? spec.textColor;
  const accent = spec.accentColor;

  // Convert #rrggbb → 0xRRGGBB for drawbox
  const hex2ffmpeg = (h: string) => `0x${h.replace("#", "")}`;

  const lines: string[] = [];

  // Title
  if (scene.title) {
    lines.push(`drawtext=text='${escapeFfmpegText(scene.title)}':fontsize=64:fontcolor=${fg}:x=(w-text_w)/2:y=(h/2-80):fontfile=/Windows/Fonts/arial.ttf:box=0`);
  }

  // Content / bullets
  const bodyLines = scene.bullets?.length
    ? scene.bullets.map((b) => `• ${b}`).join("\\n")
    : scene.content ?? "";

  if (bodyLines) {
    lines.push(`drawtext=text='${escapeFfmpegText(bodyLines)}':fontsize=36:fontcolor=${fg}:x=(w-text_w)/2:y=(h/2+20):fontfile=/Windows/Fonts/arial.ttf:box=0:line_spacing=8`);
  }

  // Accent bar under title
  lines.push(`drawbox=x=0:y=0:w=iw:h=6:color=${hex2ffmpeg(accent)}:t=fill`);

  return lines.join(",");
}

function escapeFfmpegText(s: string): string {
  return s.replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/\n/g, "\\n").slice(0, 200);
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}/${g}/${b}`;
}

async function renderScene(
  scene: Scene,
  spec: VideoSpec,
  outputFile: string,
  sceneIndex: number
): Promise<void> {
  const { fps } = spec;
  const [w, h] = spec.resolution.split("x").map(Number) as [number, number];
  const frames = Math.round(scene.duration * fps);
  const bg = scene.background ?? spec.background;
  const rgb = hexToRgb(bg);

  const filter = buildSceneFilter(scene, spec, sceneIndex);

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(`color=c=${rgb}:size=${w}x${h}:rate=${fps}:duration=${scene.duration}`)
      .inputFormat("lavfi")
      .videoFilters(filter)
      .outputOptions([`-t ${scene.duration}`, `-r ${fps}`, "-pix_fmt yuv420p"])
      .output(outputFile)
      .on("end", () => resolve())
      .on("error", reject);
    cmd.run();
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
