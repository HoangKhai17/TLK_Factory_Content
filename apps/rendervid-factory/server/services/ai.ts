import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VideoSpec } from "../../shared/types.js";
import { hashKey, cacheGet, cacheSet } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

const SYSTEM_PROMPT = `You are a video script generator. Given a topic/prompt, generate a structured JSON VideoSpec for a short explainer video.

Rules:
- Return ONLY valid JSON, no markdown, no code blocks
- scenes array: 3–6 scenes, each 3–8 seconds
- scene types: "intro", "text", "bullets", "cards", "split", "outro"
- resolution: "1920x1080" for landscape, "1080x1920" for portrait/reels
- fps: 30
- Choose a coherent color palette (hex colors)
- font: use a Google Fonts safe name like "Inter" or "Poppins"

JSON schema:
{
  "title": string,
  "description": string,
  "resolution": "1920x1080" | "1280x720" | "1080x1920" | "1080x1080",
  "fps": 30,
  "duration": number,
  "background": "#hex",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "textColor": "#hex",
  "font": string,
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro"|"text"|"bullets"|"cards"|"split"|"outro",
      "duration": number,
      "title": string,
      "content": string,
      "bullets": string[],
      "left": string,
      "right": string,
      "cards": [{"title":string,"body":string,"icon":string}],
      "background": "#hex or null",
      "textColor": "#hex or null"
    }
  ]
}`;

export async function generateVideoSpec(
  prompt: string,
  resolution: VideoSpec["resolution"] = "1920x1080",
  targetDuration = 30
): Promise<VideoSpec> {
  const cacheKey = hashKey(`${prompt}|${resolution}|${targetDuration}`);
  const cached = cacheGet<VideoSpec>(cacheKey);
  if (cached) return cached;

  const model = genAI.getGenerativeModel({ model: MODEL });

  const userPrompt = `Create a video about: "${prompt}"
Target duration: ~${targetDuration} seconds
Resolution: ${resolution}
Generate the VideoSpec JSON now.`;

  logger.info(`[ai] Generating spec for: "${prompt.slice(0, 60)}..."`);

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: userPrompt },
  ]);

  const raw = result.response.text().trim();

  // Strip markdown fences if model wraps in them
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

  let spec: VideoSpec;
  try {
    spec = JSON.parse(json) as VideoSpec;
  } catch {
    logger.error("[ai] Failed to parse JSON from model response:", raw.slice(0, 500));
    throw new Error("AI returned invalid JSON");
  }

  // Ensure scene ids exist
  spec.scenes = spec.scenes.map((s, i) => ({ ...s, id: s.id ?? `scene-${i + 1}` }));

  cacheSet(cacheKey, spec);
  logger.info(`[ai] Spec ready: ${spec.scenes.length} scenes, ${spec.duration}s`);
  return spec;
}
