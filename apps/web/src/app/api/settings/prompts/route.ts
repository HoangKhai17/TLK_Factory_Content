import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { promptTemplates } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";

// GET /api/settings/prompts — list all prompt templates
export async function GET(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const rows = db.select().from(promptTemplates).orderBy(promptTemplates.key).all();
  return NextResponse.json({ prompts: rows });
}

// PUT /api/settings/prompts — update (or create) a prompt template by key
export async function PUT(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await request.json() as { key: string; content: string };
  const { key, content } = body;

  if (!key || !content?.trim()) {
    return NextResponse.json({ error: "key và content là bắt buộc" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.select().from(promptTemplates).where(eq(promptTemplates.key, key)).get();

  if (existing) {
    db.update(promptTemplates)
      .set({ content: content.trim(), isDefault: false, updatedAt: new Date().toISOString() })
      .where(eq(promptTemplates.key, key))
      .run();
  } else {
    db.insert(promptTemplates)
      .values({
        id: nanoid(),
        key,
        name: key,
        content: content.trim(),
        isDefault: false,
      })
      .run();
  }

  const updated = db.select().from(promptTemplates).where(eq(promptTemplates.key, key)).get();
  return NextResponse.json({ prompt: updated });
}

// POST /api/settings/prompts/reset — reset a prompt to default
export async function POST(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await request.json() as { key: string; defaultContent: string };
  const { key, defaultContent } = body;

  if (!key || !defaultContent) {
    return NextResponse.json({ error: "key và defaultContent là bắt buộc" }, { status: 400 });
  }

  const db = getDb();
  db.update(promptTemplates)
    .set({ content: defaultContent, isDefault: true, updatedAt: new Date().toISOString() })
    .where(eq(promptTemplates.key, key))
    .run();

  const updated = db.select().from(promptTemplates).where(eq(promptTemplates.key, key)).get();
  return NextResponse.json({ prompt: updated });
}
