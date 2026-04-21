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
  const clean = hex.replace(/^#/, "").replace(/^0x/i, "").padEnd(6, "0").slice(0, 6);
  return `0x${clean}`;
}

/**
 * Sanitize text for FFmpeg drawtext text= option (single-quoted value).
 *
 * Root causes of filter crashes:
 *  1. Unicode curly quotes (U+2018/2019) from Gemini AI — NOT caught by basic regex
 *  2. Any ' breaks the single-quoted filter value
 *  3. Any \ triggers escape sequences inside FFmpeg filter parser
 *  4. : is the option separator — must not appear in the value
 *
 * Strategy: normalize Unicode → strip all filter-unsafe chars → limit length.
 * Tests confirmed text= with this sanitizer works reliably on Windows.
 */
function sanitizeText(s: string): string {
  return (
    s
      // ── Unicode → ASCII equivalents ──────────────────────────────────────
      // All single-quote / apostrophe variants → remove entirely
      .replace(/[\u2018\u2019\u201A\u201B\u02BC\u02B9\uFF07\u0060\u00B4]/g, "")
      // All double-quote variants → remove
      .replace(/[\u201C\u201D\u201E\u201F\uFF02]/g, "")
      // Em dash / en dash / minus sign → hyphen
      .replace(/[\u2013\u2014\u2015\u2212]/g, "-")
      // Ellipsis → three dots
      .replace(/\u2026/g, "...")
      // Non-breaking / zero-width / narrow spaces → regular space
      .replace(/[\u00A0\u200B\u2009\u202F\u200C\u200D\u3000]/g, " ")
      // Bullet variants → plus sign
      .replace(/[\u2022\u2023\u25CF\u25E6\u00B7\u2027]/g, "+")
      // ── Remove remaining non-ASCII ────────────────────────────────────────
      .replace(/[^\x20-\x7E]/g, " ")
      // ── Strip characters that break FFmpeg filter string ──────────────────
      // ' closes the single-quoted value
      // \ triggers escape sequences
      // : is the option separator inside drawtext
      // = is option assignment
      // [ ] { } | < > ; , are filter graph / lavfi syntax
      .replace(/['"\\:=[\]{};,|<>]/g, " ")
      // ── Normalize whitespace ──────────────────────────────────────────────
      .replace(/\s+/g, " ")
      .trim()
      // Keep to 100 chars so the filter string stays manageable
      .slice(0, 100)
  );
}

function buildVfFilter(scene: Scene, spec: VideoSpec, w: number, h: number): string {
  const fg     = hexToFfmpeg(scene.textColor ?? spec.textColor);
  const accent = hexToFfmpeg(spec.accentColor);
  const parts: string[] = [];

  // Accent bar at top
  parts.push(`drawbox=x=0:y=0:w=${w}:h=8:color=${accent}:t=fill`);

  const dt = (text: string, fontSize: number, x: string, y: number) => {
    const safe = sanitizeText(text);
    if (!safe) return null;
    return `drawtext=text='${safe}':fontsize=${fontSize}:fontcolor=${fg}:x=${x}:y=${y}`;
  };

  // Title
  if (scene.title) {
    const titleY = Math.round(h * 0.38);
    const f = dt(scene.title, 56, "(w-text_w)/2", titleY);
    if (f) parts.push(f);
  }

  // Body
  const bodyY = Math.round(h * 0.55);

  if (scene.bullets?.length) {
    const leftX = Math.round(w * 0.08);
    scene.bullets.slice(0, 4).forEach((bullet, i) => {
      const f = dt(`+ ${bullet}`, 26, String(leftX), bodyY + i * 44);
      if (f) parts.push(f);
    });
  } else if (scene.content) {
    const f = dt(scene.content, 30, "(w-text_w)/2", bodyY);
    if (f) parts.push(f);
  }

  return parts.join(",");
}

async function renderScene(
  scene: Scene,
  spec: VideoSpec,
  outputFile: string,
  sceneIndex: number
): Promise<void> {
  const { fps }  = spec;
  const [w, h]   = spec.resolution.split("x").map(Number) as [number, number];
  const bg       = hexToFfmpeg(scene.background ?? spec.background);
  const dur      = scene.duration;
  const vf       = buildVfFilter(scene, spec, w, h);

  logger.info(`[renderer] Scene ${sceneIndex} filter: ${vf}`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`color=c=${bg}:size=${w}x${h}:rate=${fps}:duration=${dur}`)
      .inputOptions(["-f lavfi"])
      .outputOptions([
        "-vf",      vf,
        "-t",       String(dur),
        "-r",       String(fps),
        "-pix_fmt", "yuv420p",
      ])
      .output(outputFile)
      .on("start",  (cmd) => logger.info(`[renderer] ffmpeg cmd: ${cmd}`))
      .on("end",    () => resolve())
      .on("error",  (err) => reject(err))
      .run();
  });
}

async function concatScenes(sceneFiles: string[], outputFile: string): Promise<void> {
  const listFile = outputFile + ".list.txt";
  const content  = sceneFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(listFile, content);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .output(outputFile)
      .on("end",   () => { fs.unlinkSync(listFile); resolve(); })
      .on("error", reject)
      .run();
  });
}

async function extractThumbnail(videoFile: string, thumbnailFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoFile)
      .screenshots({
        timestamps: ["00:00:01"],
        filename:   path.basename(thumbnailFile),
        folder:     path.dirname(thumbnailFile),
        size:       "640x?",
      })
      .on("end",   () => resolve())
      .on("error", reject);
  });
}

export interface RenderResult {
  outputPath:      string;
  thumbnailPath:   string;
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
    const scene     = spec.scenes[i]!;
    const sceneFile = path.join(jobDir, `scene_${i}.mp4`);
    logger.info(`[renderer] Scene ${i + 1}/${spec.scenes.length}: "${scene.title?.slice(0, 50) ?? "(no title)"}"`);
    await renderScene(scene, spec, sceneFile, i);
    sceneFiles.push(sceneFile);
    onProgress(Math.round(10 + ((i + 1) / spec.scenes.length) * 75));
  }

  const outputFile = path.join(jobDir, "output.mp4");
  logger.info("[renderer] Concatenating scenes…");
  await concatScenes(sceneFiles, outputFile);
  onProgress(90);

  const thumbnailFile = path.join(jobDir, "thumbnail.jpg");
  try {
    await extractThumbnail(outputFile, thumbnailFile);
  } catch (e) {
    logger.warn("[renderer] Thumbnail extraction failed:", e);
  }

  for (const f of sceneFiles) {
    try { fs.unlinkSync(f); } catch {}
  }

  onProgress(100);
  logger.info(`[renderer] Done: ${outputFile}`);

  return {
    outputPath:      `/output/${jobId}/output.mp4`,
    thumbnailPath:   `/output/${jobId}/thumbnail.jpg`,
    durationSeconds: spec.duration,
  };
}
