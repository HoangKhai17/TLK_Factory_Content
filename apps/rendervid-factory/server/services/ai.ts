import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VideoSpec, Scene } from "../../shared/types.js";
import { hashKey, cacheGet, cacheSet } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const MODEL  = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";

// ─────────────────────────────────────────────────────────────────────────────
// COLOR NORMALIZER
// Gemini may return "#RGB", "rgb(...)", "0xRRGGBB", named colors, or garbage.
// We normalize everything to "#RRGGBB" or fall back to a safe default.
// ─────────────────────────────────────────────────────────────────────────────
const NAMED_COLORS: Record<string, string> = {
  black: "#000000", white: "#FFFFFF", red: "#FF0000",   blue: "#0000FF",
  green: "#008000", yellow:"#FFFF00", orange:"#FFA500",  purple:"#800080",
  gray:  "#808080", grey:  "#808080", pink:  "#FFC0CB",  cyan:  "#00FFFF",
  navy:  "#000080", teal:  "#008080", silver:"#C0C0C0",  gold:  "#FFD700",
  indigo:"#4B0082", violet:"#EE82EE", coral: "#FF7F50",  lime:  "#00FF00",
  maroon:"#800000", brown: "#A52A2A", magenta:"#FF00FF",
};

function normalizeColor(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const v = value.trim();

  // Already #RRGGBB
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase();
  // #RGB → #RRGGBB
  if (/^#[0-9A-Fa-f]{3}$/.test(v))
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase();
  // 0xRRGGBB
  if (/^0x[0-9A-Fa-f]{6}$/i.test(v)) return `#${v.slice(2).toUpperCase()}`;
  // rgb(r,g,b)
  const rgb = v.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return (
      "#" +
      [rgb[1], rgb[2], rgb[3]]
        .map((n) => Math.min(255, Number(n)).toString(16).padStart(2, "0"))
        .join("")
    ).toUpperCase();
  }
  // Named color
  const lower = v.toLowerCase();
  if (NAMED_COLORS[lower]) return NAMED_COLORS[lower];
  // Bare 6-digit hex without #
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v.toUpperCase()}`;
  // Bare 3-digit hex without #
  if (/^[0-9A-Fa-f]{3}$/.test(v))
    return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`.toUpperCase();

  logger.warn(`[spec] Cannot parse color "${v}", using fallback "${fallback}"`);
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT NORMALIZER
// Strip Unicode punctuation variants and limit length.
// The renderer will strip FFmpeg-specific chars on top of this.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeText(value: unknown, maxLen = 100): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\u02B9\uFF07]/g, "")  // curly single quotes
    .replace(/[\u201C\u201D\u201E\u201F\uFF02]/g, "")               // curly double quotes
    .replace(/[\u2013\u2014\u2015\u2212]/g, "-")                    // dashes
    .replace(/\u2026/g, "...")                                        // ellipsis
    .replace(/[\u00A0\u200B\u2009\u202F\u3000\u200C\u200D]/g, " ") // exotic spaces
    .replace(/[\u2022\u25CF\u25E6\u00B7\u2023]/g, "+")              // bullet variants
    .replace(/[^\x20-\x7E]/g, " ")                                   // any remaining non-ASCII
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEC NORMALIZER
// Receives any unknown value from JSON.parse() and returns a valid VideoSpec.
// Every field is validated and has a safe fallback — renderer never sees garbage.
// ─────────────────────────────────────────────────────────────────────────────
const VALID_RESOLUTIONS = new Set<VideoSpec["resolution"]>([
  "1920x1080", "1280x720", "1080x1920", "1080x1080",
]);

const VALID_SCENE_TYPES = new Set<Scene["type"]>([
  "intro", "text", "bullets", "cards", "split", "outro",
]);

function normalizeScene(raw: unknown, index: number): Scene {
  const s = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const type: Scene["type"] = VALID_SCENE_TYPES.has(s.type as Scene["type"])
    ? (s.type as Scene["type"])
    : "text";

  // Duration: integer, clamp [2, 15]
  const rawDur = typeof s.duration === "number" ? s.duration
               : typeof s.duration === "string" ? parseFloat(s.duration)
               : 5;
  const duration = Math.max(2, Math.min(15, Math.round(isFinite(rawDur) ? rawDur : 5)));

  // Background / textColor — optional, only keep if valid
  const bgRaw  = s.background != null ? normalizeColor(s.background, "") : "";
  const fgRaw  = s.textColor  != null ? normalizeColor(s.textColor, "")  : "";

  const scene: Scene = {
    id:       typeof s.id === "string" && s.id.trim() ? s.id.trim() : `scene-${index + 1}`,
    type,
    duration,
    title:    normalizeText(s.title, 80) || `Scene ${index + 1}`,
    ...(bgRaw ? { background: bgRaw } : {}),
    ...(fgRaw ? { textColor:  fgRaw } : {}),
  };

  // Content
  if (typeof s.content === "string" && s.content.trim())
    scene.content = normalizeText(s.content, 150);

  // Bullets: validate it's a non-empty string array
  if (Array.isArray(s.bullets)) {
    const bullets = (s.bullets as unknown[])
      .map((b) => normalizeText(b, 70))
      .filter(Boolean)
      .slice(0, 4);
    if (bullets.length > 0) scene.bullets = bullets;
  }

  // Cards
  if (Array.isArray(s.cards)) {
    const cards = (s.cards as unknown[])
      .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
      .map((c) => ({
        title: normalizeText(c.title, 50) || "Item",
        body:  normalizeText(c.body,  80),
        icon:  typeof c.icon === "string" ? c.icon.slice(0, 4) : undefined,
      }))
      .slice(0, 4);
    if (cards.length > 0) scene.cards = cards;
  }

  // Split
  if (typeof s.left  === "string") scene.left  = normalizeText(s.left,  80);
  if (typeof s.right === "string") scene.right = normalizeText(s.right, 80);

  return scene;
}

function normalizeSpec(raw: unknown, requestedResolution: VideoSpec["resolution"]): VideoSpec {
  if (typeof raw !== "object" || raw === null)
    throw new Error("Spec is not an object");

  const obj = raw as Record<string, unknown>;

  // Colors with sensible defaults (dark tech palette)
  const background   = normalizeColor(obj.background,   "#0F0F1A");
  const primaryColor = normalizeColor(obj.primaryColor, "#3A5AF7");
  const accentColor  = normalizeColor(obj.accentColor,  "#06B3ED");
  const textColor    = normalizeColor(obj.textColor,    "#FFFFFF");

  // Resolution: prefer the user-requested value
  const resolution = VALID_RESOLUTIONS.has(requestedResolution)
    ? requestedResolution
    : "1920x1080";

  // FPS
  const fps = [24, 25, 30, 60].includes(Number(obj.fps)) ? Number(obj.fps) : 30;

  // Scenes — must have at least 1
  if (!Array.isArray(obj.scenes) || obj.scenes.length === 0)
    throw new Error("Spec contains no scenes array");

  const scenes = (obj.scenes as unknown[]).slice(0, 10).map(normalizeScene);

  // Total duration: sum of scene durations (AI value may mismatch, recalculate)
  const duration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    title:       normalizeText(obj.title, 120)       || "Untitled Video",
    description: normalizeText(obj.description, 300) || "",
    resolution,
    fps,
    duration,
    background,
    primaryColor,
    accentColor,
    textColor,
    font: normalizeText(obj.font, 50) || "Inter",
    scenes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Strict rules + concrete example for any model
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional video script generator for an AI video creation platform.

Given a topic, generate a VideoSpec JSON object for a short explainer video.

STRICT OUTPUT RULES (must follow exactly):
1. Return ONLY raw JSON — NO markdown, NO code fences (\`\`\`), NO commentary
2. ALL color fields: hex string "#RRGGBB" — example: "#1A2B3C"
3. Scene "duration": integer between 3 and 8 (seconds)
4. Top-level "duration": sum of all scene durations (integer)
5. Number of scenes: 4 to 6
6. "fps": always 30
7. Every scene must have a non-empty "title" string (max 60 chars)
8. Text fields: plain English only, no apostrophes, no colons, max 80 chars
9. "bullets" scenes: 2–4 items, each item max 60 chars
10. Use high-contrast colors: dark background + light text, or vice versa

VALID SCENE TYPES: "intro", "text", "bullets", "cards", "split", "outro"

EXACT JSON SCHEMA TO FOLLOW:
{
  "title": "Video Title Here",
  "description": "One sentence description",
  "resolution": "1920x1080",
  "fps": 30,
  "duration": 24,
  "background": "#0F0F1A",
  "primaryColor": "#3A5AF7",
  "accentColor": "#06B3ED",
  "textColor": "#FFFFFF",
  "font": "Inter",
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro",
      "duration": 4,
      "title": "Introduction",
      "content": "Brief opening sentence here"
    },
    {
      "id": "scene-2",
      "type": "bullets",
      "duration": 6,
      "title": "Key Points",
      "bullets": ["First key point", "Second key point", "Third key point"]
    },
    {
      "id": "scene-3",
      "type": "text",
      "duration": 5,
      "title": "Main Concept",
      "content": "Core explanation text here"
    },
    {
      "id": "scene-4",
      "type": "bullets",
      "duration": 5,
      "title": "How It Works",
      "bullets": ["Step one explanation", "Step two explanation", "Step three explanation"]
    },
    {
      "id": "scene-5",
      "type": "outro",
      "duration": 4,
      "title": "Summary",
      "content": "Closing message here"
    }
  ]
}

Choose colors that match the topic theme. Make the content informative and engaging.`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function generateVideoSpec(
  prompt: string,
  resolution: VideoSpec["resolution"] = "1920x1080",
  targetDuration = 30
): Promise<VideoSpec> {
  const cacheKey = hashKey(`${prompt}|${resolution}|${targetDuration}`);
  const cached   = cacheGet<VideoSpec>(cacheKey);
  if (cached) {
    logger.info("[ai] Cache hit");
    return cached;
  }

  // responseMimeType forces the model to output valid JSON (no markdown fences)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    } as Record<string, unknown>,
  });

  const userPrompt = `Generate a VideoSpec JSON for a video about: "${prompt}"
Target total duration: approximately ${targetDuration} seconds
Resolution: ${resolution}
Adjust the number of scenes and their durations so the total is close to ${targetDuration} seconds.`;

  logger.info(`[ai] Calling ${MODEL}: "${prompt.slice(0, 60)}" | ${resolution} | ~${targetDuration}s`);

  let rawText: string;
  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);
    rawText = result.response.text().trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[ai] Gemini API call failed:", msg);
    throw new Error(`Gemini API error: ${msg}`);
  }

  logger.info(`[ai] Raw response (${rawText.length} chars): ${rawText.slice(0, 120)}…`);

  // Strip markdown fences defensively (model might ignore responseMimeType)
  const json = rawText
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let rawSpec: unknown;
  try {
    rawSpec = JSON.parse(json);
  } catch {
    logger.error("[ai] JSON.parse failed. Full response:\n", rawText.slice(0, 1000));
    throw new Error("AI returned unparseable response — not valid JSON");
  }

  logger.info("[ai] JSON parsed OK, normalizing spec…");

  let spec: VideoSpec;
  try {
    spec = normalizeSpec(rawSpec, resolution);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[ai] normalizeSpec failed:", msg);
    logger.error("[ai] Raw spec was:", JSON.stringify(rawSpec).slice(0, 800));
    throw new Error(`AI spec normalization failed: ${msg}`);
  }

  cacheSet(cacheKey, spec);
  logger.info(
    `[ai] Spec ready — "${spec.title}" | ${spec.scenes.length} scenes | ${spec.duration}s | ${spec.resolution}`
  );
  return spec;
}
