import type { VideoSpec } from "@tlk/shared";
import { getSystemChatPrompt, buildVideoSpecPrompt } from "@/lib/gemini/promptService";
import { CODEGEN_SYSTEM_PROMPT } from "./codegenSystemPrompt";
import type { AIMessage, AIProvider, VideoSpecResult, RemotionCodeResult } from "./types";

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "claude-sonnet-4-6") {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async callAPI(
    messages: { role: string; content: string }[],
    systemPrompt: string,
    maxTokens = 1024
  ): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      content: { type: string; text: string }[];
    };
    return data.content.find((b) => b.type === "text")?.text ?? "";
  }

  async chat(history: AIMessage[], newMessage: string): Promise<string> {
    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: newMessage },
    ];
    return this.callAPI(messages, getSystemChatPrompt(), 1024);
  }

  async generateVideoSpec(userPrompt: string): Promise<VideoSpecResult> {
    // Step 1: friendly message
    const assistantMessage = await this.callAPI(
      [
        {
          role: "user",
          content: `Người dùng yêu cầu: "${userPrompt}"\n\nHãy xác nhận ngắn gọn (2-3 câu) rằng bạn đang tạo video theo yêu cầu. Không trả về JSON.`,
        },
      ],
      getSystemChatPrompt(),
      512
    );

    // Step 2: spec JSON
    const raw = await this.callAPI(
      [{ role: "user", content: buildVideoSpecPrompt(userPrompt) }],
      "Bạn là video spec generator. Chỉ trả về JSON thuần, không markdown.",
      8192
    );

    const spec = extractJSON<VideoSpec>(raw);
    return { spec, assistantMessage };
  }

  async generateRemotionCode(userPrompt: string): Promise<RemotionCodeResult> {
    const assistantMessage = await this.callAPI(
      [{ role: "user", content: `Người dùng yêu cầu tạo video motion graphics: "${userPrompt}"\n\nXác nhận ngắn gọn bạn đang tạo video với code Remotion tùy chỉnh. Không trả về code.` }],
      getSystemChatPrompt(),
      256,
    );

    const raw = await this.callAPI(
      [{ role: "user", content: `Create a Remotion video component for: ${userPrompt}\n\nReturn ONLY the code starting with // META:{...}` }],
      CODEGEN_SYSTEM_PROMPT,
      16384,
    );

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
