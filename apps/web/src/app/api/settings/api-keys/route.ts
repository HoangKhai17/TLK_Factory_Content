import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { apiConfigs } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";
import type { ProviderType } from "@/lib/ai/types";

// GET /api/settings/api-keys — list all configs for the user
export async function GET(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const configs = db.select().from(apiConfigs).where(eq(apiConfigs.userId, user.id)).all();

  // Mask api keys: show last 4 chars only
  return NextResponse.json({
    configs: configs.map((c) => ({
      id: c.id,
      provider: c.provider,
      apiKeyMasked: maskKey(c.apiKey),
      activeModel: c.activeModel,
      isActive: c.isActive,
    })),
  });
}

// PUT /api/settings/api-keys — upsert a provider config
export async function PUT(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const { provider, apiKey, activeModel, isActive } = await request.json() as {
      provider: ProviderType;
      apiKey: string;
      activeModel: string;
      isActive: boolean;
    };

    if (!provider || !activeModel) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .select()
      .from(apiConfigs)
      .where(and(eq(apiConfigs.userId, user.id), eq(apiConfigs.provider, provider)))
      .get();

    // "KEEP" means don't change the key, only update model/active
    const isKeepKey = apiKey?.trim() === "KEEP";
    const resolvedKey = isKeepKey ? existing?.apiKey ?? "" : apiKey?.trim() ?? "";

    if (!resolvedKey) {
      return NextResponse.json({ error: "Vui lòng nhập API Key" }, { status: 400 });
    }

    if (isActive) {
      // Deactivate all others for this user
      db.update(apiConfigs)
        .set({ isActive: false, updatedAt: new Date().toISOString() })
        .where(eq(apiConfigs.userId, user.id))
        .run();
    }

    if (existing) {
      db.update(apiConfigs)
        .set({
          apiKey: resolvedKey,
          activeModel,
          isActive,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(apiConfigs.id, existing.id))
        .run();
    } else {
      db.insert(apiConfigs)
        .values({
          id: nanoid(),
          userId: user.id,
          provider,
          apiKey: resolvedKey,
          activeModel,
          isActive,
        })
        .run();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/settings/api-keys error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE /api/settings/api-keys?provider=gemini
export async function DELETE(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const provider = request.nextUrl.searchParams.get("provider") as ProviderType | null;
  if (!provider) return NextResponse.json({ error: "Thiếu provider" }, { status: 400 });

  const db = getDb();
  db.delete(apiConfigs)
    .where(and(eq(apiConfigs.userId, user.id), eq(apiConfigs.provider, provider)))
    .run();

  return NextResponse.json({ ok: true });
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return "••••••••" + key.slice(-4);
}
