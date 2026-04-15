import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VideoSpec } from "@tlk/shared";
import { buildVideoSpecPrompt, SYSTEM_PROMPT } from "@/lib/gemini/prompts";
import type { AIMessage, AIProvider, VideoSpecResult } from "./types";

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = "gemini-2.0-flash") {
    this.ai = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async chat(history: AIMessage[], newMessage: string): Promise<string> {
    const geminiModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
    });

    const chat = geminiModel.startChat({
      history: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(newMessage);
    return result.response.text();
  }

  async generateVideoSpec(userPrompt: string): Promise<VideoSpecResult> {
    // Step 1: friendly message
    const chatModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
    });
    const chatRes = await chatModel.generateContent(
      `Người dùng yêu cầu: "${userPrompt}"\n\nHãy xác nhận ngắn gọn (2-3 câu) rằng bạn đang tạo video theo yêu cầu. Không trả về JSON.`
    );
    const assistantMessage =
      chatRes.response.text() || "Đang tạo video spec theo yêu cầu...";

    // Step 2: spec JSON
    const specModel = this.ai.getGenerativeModel({
      model: this.model,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 8192 },
    });
    const specRes = await specModel.generateContent(buildVideoSpecPrompt(userPrompt));
    const raw = specRes.response.text();
    const spec = extractJSON<VideoSpec>(raw);
    return { spec, assistantMessage };
  }
}

function extractJSON<T>(raw: string): T {
  const match =
    raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = match ? (match[1] ?? raw) : raw;
  return JSON.parse(jsonStr.trim()) as T;
}
