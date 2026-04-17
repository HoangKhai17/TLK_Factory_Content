import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VideoSpec } from "@tlk/shared";
import { getSystemChatPrompt, buildVideoSpecPrompt } from "@/lib/gemini/promptService";
import { getTypeCodegenPrompt } from "./codegenSystemPrompt";
import type { VideoAnimationType } from "./codegenSystemPrompt";
import type { AIMessage, AIProvider, VideoSpecResult, RemotionCodeResult } from "./types";

// Gemini models — update this list as Google releases new versions
// gemini-1.5-x were removed Oct 2025; gemini-2.5-x require Paid tier / project approval
const VALID_GEMINI_MODELS = new Set([
  // Gemini 2.5 (latest, thinking models — requires billing/approved project)
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  // Gemini 2.0 (stable, free tier available)
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-pro-exp",
]);

const FALLBACK_MODEL = "gemini-2.0-flash";

// Max retries for transient errors (503 overload, 429 rate-limit)
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1500;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = /503|502|529|overload|rate.?limit|too many/i.test(msg);
      if (!isTransient || attempt === retries) throw err;
      const delay = RETRY_BASE_MS * 2 ** attempt + Math.random() * 500;
      console.warn(`[Gemini] Transient error (attempt ${attempt + 1}/${retries}), retrying in ${Math.round(delay)}ms: ${msg}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = FALLBACK_MODEL) {
    this.ai = new GoogleGenerativeAI(apiKey);
    // Guard: if model ID is no longer valid, fall back to stable default
    this.model = VALID_GEMINI_MODELS.has(model) ? model : FALLBACK_MODEL;
    if (this.model !== model) {
      console.warn(`[Gemini] Model "${model}" is deprecated/invalid, falling back to "${FALLBACK_MODEL}"`);
    }
  }

  async chat(history: AIMessage[], newMessage: string): Promise<string> {
    const geminiModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction: getSystemChatPrompt(),
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
    });

    const chat = geminiModel.startChat({
      history: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    return withRetry(() => chat.sendMessage(newMessage).then((r) => r.response.text()));
  }

  async generateVideoSpec(userPrompt: string): Promise<VideoSpecResult> {
    // Step 1: friendly message (conversational, uses SYSTEM_PROMPT)
    const chatModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction: getSystemChatPrompt(),
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
    });
    const assistantMessage = await withRetry(async () => {
      const res = await chatModel.generateContent(
        `Người dùng yêu cầu: "${userPrompt}"\n\nHãy xác nhận ngắn gọn (2-3 câu) rằng bạn đang tạo video theo yêu cầu. Không trả về JSON.`
      );
      return res.response.text() || "Đang tạo video spec theo yêu cầu...";
    });

    // Step 2: spec JSON — strict JSON-only system instruction, no conversational prompt
    const specModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction:
        "You are a JSON generator. Output ONLY valid JSON with no markdown fences, no explanations, no greeting. Return exactly one JSON object matching the requested schema.",
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        maxOutputTokens: 8192,
        // Force JSON output on models that support it
        responseMimeType: "application/json",
      },
    });
    const raw = await withRetry(() =>
      specModel.generateContent(buildVideoSpecPrompt(userPrompt)).then((r) => r.response.text())
    );
    const spec = extractJSON<VideoSpec>(raw);
    return { spec, assistantMessage };
  }

  async generateRemotionCode(userPrompt: string, videoType?: VideoAnimationType | null): Promise<RemotionCodeResult> {
    const chatModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction: getSystemChatPrompt(),
      generationConfig: { temperature: 0.8, maxOutputTokens: 256 },
    });
    const assistantMessage = await withRetry(async () => {
      const res = await chatModel.generateContent(
        `Người dùng yêu cầu tạo video motion graphics: "${userPrompt}"\n\nXác nhận ngắn gọn bạn đang tạo video với code Remotion tùy chỉnh. Không trả về code.`
      );
      return res.response.text() || "Đang tạo video motion graphics với AI code...";
    });

    const codeModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction: getTypeCodegenPrompt(videoType ?? null),
      generationConfig: { temperature: 0.6, topP: 0.95, maxOutputTokens: 16384 },
    });
    const raw = await withRetry(() =>
      codeModel.generateContent(
        `Create a Remotion video component for: ${userPrompt}\n\n` +
        `CRITICAL: Your response must begin with EXACTLY this pattern (no text before it):\n` +
        `// META:{"duration":10,"fps":30,"width":1920,"height":1080,"title":"..."}\n` +
        `Then immediately the import statements and component code. NO markdown fences. NO explanation text.`
      ).then((r) => r.response.text())
    );
    const code = extractCode(raw);
    return { code, assistantMessage };
  }
}

function extractCode(raw: string): string {
  // Try fenced block first, fall back to raw
  const fenced = raw.match(/```(?:tsx?|jsx?)?\s*([\s\S]*?)```/s);
  const stripped = fenced ? (fenced[1] ?? raw).trim() : raw.trim();
  // Find // META: anywhere (AI sometimes prepends explanation text)
  const metaIdx = stripped.indexOf("// META:");
  if (metaIdx < 0) {
    // No META found at all — log full raw for debugging
    console.error("[extractCode] No // META: found in AI response. Raw (500 chars):", raw.slice(0, 500));
  }
  return metaIdx > 0 ? stripped.slice(metaIdx) : stripped;
}

function extractJSON<T>(raw: string): T {
  const match =
    raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = match ? (match[1] ?? raw) : raw;
  return JSON.parse(jsonStr.trim()) as T;
}
