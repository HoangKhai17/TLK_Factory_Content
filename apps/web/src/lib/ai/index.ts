import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { apiConfigs } from "@/lib/db/schema";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import type { AIProvider, ProviderType } from "./types";

export * from "./types";

/**
 * Returns the active AI provider for a user.
 * Falls back to env GEMINI_API_KEY if no config found.
 */
export function getAIProvider(
  userId: string | null,
  overrideProvider?: string,
  overrideModel?: string
): AIProvider {
  const db = getDb();

  // Try user's active config (or override by provider name)
  if (userId) {
    let config = null;

    if (overrideProvider) {
      // Use specific provider if override requested
      config = db
        .select()
        .from(apiConfigs)
        .where(
          and(
            eq(apiConfigs.userId, userId),
            eq(apiConfigs.provider, overrideProvider as ProviderType)
          )
        )
        .get();
    } else {
      // Use active provider
      config = db
        .select()
        .from(apiConfigs)
        .where(
          and(
            eq(apiConfigs.userId, userId),
            eq(apiConfigs.isActive, true)
          )
        )
        .get();
    }

    if (config) {
      const model = overrideModel ?? config.activeModel;
      return createProvider(config.provider as ProviderType, config.apiKey, model);
    }
  }

  // Fallback to env
  const fallbackKey = process.env.GEMINI_API_KEY;
  if (!fallbackKey) throw new Error("Chưa cấu hình API key. Vào Settings → API Keys để thêm.");
  return new GeminiProvider(fallbackKey, overrideModel ?? "gemini-2.0-flash");
}

function createProvider(type: ProviderType, apiKey: string, model: string): AIProvider {
  switch (type) {
    case "gemini":   return new GeminiProvider(apiKey, model);
    case "openai":   return new OpenAIProvider(apiKey, model);
    case "anthropic": return new AnthropicProvider(apiKey, model);
  }
}
