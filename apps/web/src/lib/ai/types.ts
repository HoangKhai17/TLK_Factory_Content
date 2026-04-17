import type { VideoSpec } from "@tlk/shared";
import type { VideoAnimationType } from "./codegenSystemPrompt";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface VideoSpecResult {
  spec: VideoSpec;
  assistantMessage: string;
}

export interface AIProvider {
  chat(history: AIMessage[], newMessage: string): Promise<string>;
  generateVideoSpec(userPrompt: string): Promise<VideoSpecResult>;
  generateRemotionCode(userPrompt: string, videoType?: VideoAnimationType | null): Promise<RemotionCodeResult>;
}

export interface RemotionCodeResult {
  code: string;
  assistantMessage: string;
}

export type ProviderType = "gemini" | "openai" | "anthropic";

export const PROVIDER_NAMES: Record<ProviderType, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI ChatGPT",
  anthropic: "Anthropic Claude",
};

export const PROVIDER_MODELS: Record<ProviderType, { id: string; name: string }[]> = {
  gemini: [
    { id: "gemini-2.5-pro",         name: "Gemini 2.5 Pro ✦ (Tốt nhất — cần Paid)" },
    { id: "gemini-2.5-flash",       name: "Gemini 2.5 Flash ✦ (Thinking — cần Paid)" },
    { id: "gemini-2.5-flash-lite",  name: "Gemini 2.5 Flash Lite (Nhanh — cần Paid)" },
    { id: "gemini-2.0-flash",       name: "Gemini 2.0 Flash (Khuyến nghị)" },
    { id: "gemini-2.0-flash-lite",  name: "Gemini 2.0 Flash Lite (Nhanh nhất, miễn phí)" },
    { id: "gemini-2.0-pro-exp",     name: "Gemini 2.0 Pro Exp (Thử nghiệm)" },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
  ],
};
