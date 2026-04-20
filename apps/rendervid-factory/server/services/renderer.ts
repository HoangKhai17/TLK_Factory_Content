import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import type { VideoSpec, Scene } from "../../shared/types.js";
import { logger } from "../utils/logger.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? "./output");

/**
 * FFmpeg drawtext on Windows REQUIRES an explicit fontfile= — it has no fontconfig.
 * We detect the first available font at startup and reuse it for all drawtext calls.
 */
function detectFont(): string {
  const candidates = [
    // Windows
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/verdana.ttf",
    // Linux
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSans-Regular.ttf",
    // macOS
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      logger.info(`[renderer] Using font: ${p}`);
      return p;
    }
  }
  logger.warn("[renderer] No system font found — drawtext may fail on Windows");
  return "";
}

const SYSTEM_FONT = detectFont();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function hexToFfmpeg(hex: string): string {
  const clean = hex.replace(/^#/, "").replace(/^0x/i, "").padEnd(6, "0").slice(0, 6);
  return `0x${clean}`;
}

/**
 * Normalize text to safe ASCII before passing to FFmpeg.
 * Converts Unicode punctuation (curly quotes, dashes, ellipsis…) to plain ASCII.
 * This prevents FFmpeg drawtext from crashing on unexpected characters.
 */
function normalizeText(s: string): string {
  return s
    // Curly / smart single quotes → straight apostrophe
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\u02B9\uFF07]/g, "'")
    // Curly double quotes → straight
    .replace(/[\u201C\u201D\u201E\u201F\uFF02]/g, '"')
    // Em dash / en dash → hyphen
    .replace(/[\u2013\u2014\u2015\u2212]/g, "-")
    // Ellipsis → three dots
    .replace(/\u2026/g, "...")
    // Non-breaking space, thin space, etc. → regular space
    .replace(/[\u00A0\u200B\u2009\u202F\u3000]/g, " ")
    // Bullet, middle dot → asterisk
    .replace(/[\u2022\u00B7\u2027]/g, "*")
    // Remove any remaining non-printable / non-ASCII chars that FFmpeg can't handle
    .replace(/[^\x20-\x7E]/g, " ")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * Write text to a temp file and return the POSIX path (forward slashes).
 * Using textfile= instead of text= completely bypasses FFmpeg filter escaping.
 */
function writeTextFile(text: string, filePath: string): string {
  fs.writeFileSync(filePath, normalizeText(text), "utf8");
  // FFmpeg requires forward slashes even on Windows
  return filePath.replace(/\\/g, "/");
}

/**
 * Escape a file path for use inside an FFmpeg single-quoted option.
 * Handles the rare case of apostrophes in directory names.
 */
function escapeFfmpegPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/'/g, "'\\''");
}

/**
 * Build the fontfile= option for drawtext.
 * On Windows, this is required — no fontconfig available.
 * Returns empty string on platforms where fontconfig works (Linux/Mac without explicit font).
 */
function fontfileOption(): string {
  if (!SYSTEM_FONT) return "";
  return `:fontfile='${escapeFfmpegPath(SYSTEM_FONT)}'`;
}

interface TextFileEntry {
  path: string;
}

function buildVfFilter(
  scene: Scene,
  spec: VideoSpec,
  w: number,
  h: number,
  textFiles: TextFileEntry[]
): string {
  const fg     = hexToFfmpeg(scene.textColor ?? spec.textColor);
  const accent = hexToFfmpeg(spec.accentColor);
  const parts: string[] = [];

  // Accent bar at top
  parts.push(`drawbox=x=0:y=0:w=${w}:h=8:color=${accent}:t=fill`);

  const font = fontfileOption();

  // Title
  if (scene.title) {
    const titleY = Math.round(h * 0.38);
    const entry  = textFiles.shift()!;
    const p      = escapeFfmpegPath(writeTextFile(scene.title, entry.path));
    parts.push(`drawtext=textfile='${p}'${font}:fontsize=56:fontcolor=${fg}:x=(w-text_w)/2:y=${titleY}`);
  }

  // Body
  const bodyY = Math.round(h * 0.55);

  if (scene.bullets?.length) {
    scene.bullets.slice(0, 4).forEach((bullet, i) => {
      const entry = textFiles.shift()!;
      const p     = escapeFfmpegPath(writeTextFile(`* ${bullet}`, entry.path));
      parts.push(
        `drawtext=textfile='${p}'${font}:fontsize=26:fontcolor=${fg}:x=${Math.round(w * 0.08)}:y=${bodyY + i * 44}`
      );
    });
  } else if (scene.content) {
    const entry = textFiles.shift()!;
    const p     = escapeFfmpegPath(writeTextFile(scene.content, entry.path));
    parts.push(`drawtext=textfile='${p}'${font}:fontsize=30:fontcolor=${fg}:x=(w-text_w)/2:y=${bodyY}`);
  }

  return parts.join(",");
}

/** Pre-allocate temp text file paths before building the filter */
function allocTextFiles(scene: Scene, baseDir: string, prefix: string): TextFileEntry[] {
  const files: TextFileEntry[] = [];
  const add = (name: string) =>
    files.push({ path: path.join(baseDir, `${prefix}_${name}.txt`) });

  if (scene.title) add("title");

  if (scene.bullets?.length) {
    scene.bullets.slice(0, 4).forEach((_, i) => add(`bullet${i}`));
  } else if (scene.content) {
    add("content");
  }

  return files;
}

function cleanTextFiles(files: TextFileEntry[]) {
  for (const f of files) {
    try { fs.unlinkSync(f.path); } catch { /* ignore */ }
  }
}

async function renderScene(
  scene: Scene,
  spec: VideoSpec,
  outputFile: string,
  sceneIndex: number
): Promise<void> {
  const { fps } = spec;
  const [w, h] = spec.resolution.split("x").map(Number) as [number, number];
  const bg     = hexToFfmpeg(scene.background ?? spec.background);
  const dur    = scene.duration;

  const jobDir   = path.dirname(outputFile);
  const txtFiles = allocTextFiles(scene, jobDir, `s${sceneIndex}`);

  const vf = buildVfFilter(scene, spec, w, h, [...txtFiles]);

  logger.info(`[renderer] Scene ${sceneIndex} vf: ${vf.slice(0, 120)}…`);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(`color=c=${bg}:size=${w}x${h}:rate=${fps}:duration=${dur}`)
        .inputOptions(["-f lavfi"])
        .outputOptions([
          "-vf", vf,
          "-t",  String(dur),
          "-r",  String(fps),
          "-pix_fmt", "yuv420p",
        ])
        .output(outputFile)
        .on("end",   () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
  } finally {
    cleanTextFiles(txtFiles);
  }
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
      .on("end", () => { fs.unlinkSync(listFile); resolve(); })
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
    logger.info(`[renderer] Rendering scene ${i + 1}/${spec.scenes.length}: "${scene.title?.slice(0, 40) ?? "(no title)"}"`);
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
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }

  onProgress(100);
  logger.info(`[renderer] Done: ${outputFile}`);

  return {
    outputPath:      `/output/${jobId}/output.mp4`,
    thumbnailPath:   `/output/${jobId}/thumbnail.jpg`,
    durationSeconds: spec.duration,
  };
}
