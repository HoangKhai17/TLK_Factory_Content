import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { apiConfigs } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";
import { GeminiProvider } from "@/lib/ai/gemini";
import { OpenAIProvider } from "@/lib/ai/openai";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import type { ProviderType } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const { provider, apiKey: rawKey, model } = await request.json() as {
      provider: ProviderType;
      apiKey?: string;
      model?: string;
    };

    // Resolve API key: use provided or fall back to saved
    let apiKey = rawKey?.trim() ?? "";
    if (!apiKey) {
      const db = getDb();
      const saved = db.select().from(apiConfigs)
        .where(and(eq(apiConfigs.userId, user.id), eq(apiConfigs.provider, provider)))
        .get();
      if (!saved) return NextResponse.json({ error: "Chưa có API Key" }, { status: 400 });
      apiKey = saved.apiKey;
    }

    // Send a minimal chat message to verify the key works
    const testMessage = "Reply with just: OK";
    let reply: string;

    if (provider === "gemini") {
      const p = new GeminiProvider(apiKey, model ?? "gemini-2.0-flash");
      reply = await p.chat([], testMessage);
    } else if (provider === "openai") {
      const p = new OpenAIProvider(apiKey, model ?? "gpt-4o-mini");
      reply = await p.chat([], testMessage);
    } else {
      const p = new AnthropicProvider(apiKey, model ?? "claude-haiku-4-5-20251001");
      reply = await p.chat([], testMessage);
    }

    return NextResponse.json({ ok: true, reply: reply.slice(0, 100) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Test thất bại";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
