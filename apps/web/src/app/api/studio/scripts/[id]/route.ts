import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scripts, scriptScenes } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";

// GET /api/studio/scripts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const script = db.select().from(scripts).where(eq(scripts.id, id)).get();
  if (!script || script.userId !== user.id) {
    return NextResponse.json({ error: "Không tìm thấy script" }, { status: 404 });
  }

  const scenes = db
    .select()
    .from(scriptScenes)
    .where(eq(scriptScenes.scriptId, id))
    .orderBy(asc(scriptScenes.orderIndex))
    .all();

  return NextResponse.json({ script, scenes });
}

// PATCH /api/studio/scripts/[id] — update title, ideaText, youtubeUrls, scenes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const script = db.select().from(scripts).where(eq(scripts.id, id)).get();
  if (!script || script.userId !== user.id) {
    return NextResponse.json({ error: "Không tìm thấy script" }, { status: 404 });
  }

  const body = await request.json() as {
    title?: string;
    ideaText?: string;
    youtubeUrls?: string[];
    videoMode?: "animation" | "slideshow";
    status?: "draft" | "script-ready" | "prompts-ready" | "rendering" | "completed";
  };

  db.update(scripts)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.ideaText !== undefined && { ideaText: body.ideaText }),
      ...(body.youtubeUrls !== undefined && { youtubeUrls: JSON.stringify(body.youtubeUrls) }),
      ...(body.videoMode !== undefined && { videoMode: body.videoMode }),
      ...(body.status !== undefined && { status: body.status }),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(scripts.id, id))
    .run();

  const updated = db.select().from(scripts).where(eq(scripts.id, id)).get()!;
  return NextResponse.json({ script: updated });
}

// DELETE /api/studio/scripts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const script = db.select().from(scripts).where(eq(scripts.id, id)).get();
  if (!script || script.userId !== user.id) {
    return NextResponse.json({ error: "Không tìm thấy script" }, { status: 404 });
  }

  db.delete(scripts).where(eq(scripts.id, id)).run();
  return NextResponse.json({ ok: true });
}
