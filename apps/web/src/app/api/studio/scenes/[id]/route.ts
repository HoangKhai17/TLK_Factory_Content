import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scriptScenes, scripts } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";

// PATCH /api/studio/scenes/[id] — update content or videoPrompt
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const scene = db.select().from(scriptScenes).where(eq(scriptScenes.id, id)).get();
  if (!scene) return NextResponse.json({ error: "Không tìm thấy scene" }, { status: 404 });

  // Verify user owns the script
  const script = db.select().from(scripts).where(eq(scripts.id, scene.scriptId)).get();
  if (!script || script.userId !== user.id) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const body = await request.json() as { content?: string; videoPrompt?: string };
  db.update(scriptScenes)
    .set({
      ...(body.content !== undefined && { content: body.content }),
      ...(body.videoPrompt !== undefined && { videoPrompt: body.videoPrompt }),
    })
    .where(eq(scriptScenes.id, id))
    .run();

  const updated = db.select().from(scriptScenes).where(eq(scriptScenes.id, id)).get()!;
  return NextResponse.json({ scene: updated });
}
