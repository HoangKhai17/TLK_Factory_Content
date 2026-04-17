import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { scripts, scriptScenes } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";
import { generateScenePrompts } from "@/lib/ai/script";
import type { VideoScript } from "@/lib/ai/script";

export async function POST(
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
  if (!script.fullScript) {
    return NextResponse.json({ error: "Chưa có kịch bản. Hãy generate script trước." }, { status: 400 });
  }

  const scenes = db
    .select()
    .from(scriptScenes)
    .where(eq(scriptScenes.scriptId, id))
    .orderBy(asc(scriptScenes.orderIndex))
    .all();

  try {
    const videoScript = JSON.parse(script.fullScript) as VideoScript;

    // Sync scenes into videoScript
    videoScript.scenes = scenes.map((s) => ({
      id: s.id,
      type: s.sectionType as VideoScript["scenes"][0]["type"],
      title: s.title,
      duration: s.duration,
      content: s.content ?? "",
      visualNotes: s.visualNotes ?? "",
    }));

    const promptResults = await generateScenePrompts(videoScript, user.id);

    // Map by sceneId and update DB
    const promptMap = new Map(promptResults.map((p) => [p.sceneId, p]));

    for (const scene of scenes) {
      const result = promptMap.get(scene.id);
      if (result?.videoPrompt) {
        db.update(scriptScenes)
          .set({
            videoPrompt: result.videoPrompt,
            animationType: result.animationType ?? null,
          })
          .where(eq(scriptScenes.id, scene.id))
          .run();
      }
    }

    // Update script status
    db.update(scripts)
      .set({ status: "prompts-ready", updatedAt: new Date().toISOString() })
      .where(eq(scripts.id, id))
      .run();

    const updatedScenes = db
      .select()
      .from(scriptScenes)
      .where(eq(scriptScenes.scriptId, id))
      .orderBy(asc(scriptScenes.orderIndex))
      .all();

    const updatedScript = db.select().from(scripts).where(eq(scripts.id, id)).get()!;
    return NextResponse.json({ script: updatedScript, scenes: updatedScenes });
  } catch (err) {
    console.error("generate-prompts error:", err);
    const msg = err instanceof Error ? err.message : "Lỗi AI generate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
