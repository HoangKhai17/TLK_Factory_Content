import type { VideoSpec } from "@tlk/shared";
import { getSystemChatPrompt, buildVideoSpecPrompt } from "@/lib/gemini/promptService";
import { getTypeCodegenPrompt } from "./codegenSystemPrompt";
import type { VideoAnimationType } from "./codegenSystemPrompt";
import type { AIMessage, AIProvider, VideoSpecResult, RemotionCodeResult } from "./types";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o") {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async callAPI(messages: { role: string; content: string }[], maxTokens = 1024): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message.content ?? "";
  }

  async chat(history: AIMessage[], newMessage: string): Promise<string> {
    const messages = [
      { role: "system", content: getSystemChatPrompt() },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: newMessage },
    ];
    return this.callAPI(messages, 1024);
  }

  async generateVideoSpec(userPrompt: string): Promise<VideoSpecResult> {
    // Step 1: friendly message
    const assistantMessage = await this.callAPI([
      { role: "system", content: getSystemChatPrompt() },
      {
        role: "user",
        content: `Người dùng yêu cầu: "${userPrompt}"\n\nHãy xác nhận ngắn gọn (2-3 câu) rằng bạn đang tạo video theo yêu cầu. Không trả về JSON.`,
      },
    ], 512);

    // Step 2: spec JSON
    const raw = await this.callAPI([
      { role: "system", content: "Bạn là video spec generator. Chỉ trả về JSON thuần, không markdown." },
      { role: "user", content: buildVideoSpecPrompt(userPrompt) },
    ], 8192);

    const spec = extractJSON<VideoSpec>(raw);
    return { spec, assistantMessage };
  }

  async generateRemotionCode(userPrompt: string, videoType?: VideoAnimationType | null): Promise<RemotionCodeResult> {
    const assistantMessage = await this.callAPI([
      { role: "system", content: getSystemChatPrompt() },
      { role: "user", content: `Người dùng yêu cầu tạo video: "${userPrompt}"\n\nXác nhận ngắn gọn bạn đang tạo video với code Remotion tùy chỉnh. Không trả về code.` },
    ], 256);

    const raw = await this.callAPI([
      { role: "system", content: getTypeCodegenPrompt(videoType ?? null) },
      { role: "user", content: `Create a Remotion video component for: ${userPrompt}\n\nReturn ONLY the code starting with // META:{...}` },
    ], 16384);

    const code = extractCode(raw);
    return { code, assistantMessage };
  }
}

function extractCode(raw: string): string {
  const fenced = raw.match(/```(?:tsx?|jsx?)?\s*([\s\S]*?)```/);
  return fenced ? (fenced[1] ?? raw).trim() : raw.trim();
}

function extractJSON<T>(raw: string): T {
  const match =
    raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = match ? (match[1] ?? raw) : raw;
  return JSON.parse(jsonStr.trim()) as T;
}
