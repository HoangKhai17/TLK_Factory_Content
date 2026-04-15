import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { scripts, scriptScenes } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";
import { generateVideoScript } from "@/lib/ai/script";

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

  const { ideaText, youtubeUrls: urlsOverride } = await request.json() as {
    ideaText?: string;
    youtubeUrls?: string[];
  };

  const idea = ideaText?.trim() ?? script.ideaText ?? "";
  if (!idea) return NextResponse.json({ error: "Cần có ý tưởng video" }, { status: 400 });

  const urls: string[] = urlsOverride ?? (script.youtubeUrls ? JSON.parse(script.youtubeUrls) : []);

  try {
    // Save input first
    db.update(scripts)
      .set({
        ideaText: idea,
        youtubeUrls: JSON.stringify(urls),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scripts.id, id))
      .run();

    // Generate script with AI
    const videoScript = await generateVideoScript(idea, urls, user.id);

    // Delete old scenes
    db.delete(scriptScenes).where(eq(scriptScenes.scriptId, id)).run();

    // Insert new scenes
    videoScript.scenes.forEach((scene, idx) => {
      db.insert(scriptScenes)
        .values({
          id: nanoid(),
          scriptId: id,
          orderIndex: idx,
          sectionType: scene.type,
          title: scene.title,
          duration: scene.duration,
          content: scene.content,
          visualNotes: scene.visualNotes,
          renderStatus: "pending",
        })
        .run();
    });

    // Update script
    db.update(scripts)
      .set({
        title: videoScript.title,
        fullScript: JSON.stringify(videoScript),
        status: "script-ready",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scripts.id, id))
      .run();

    const updatedScript = db.select().from(scripts).where(eq(scripts.id, id)).get()!;
    const scenes = db
      .select()
      .from(scriptScenes)
      .where(eq(scriptScenes.scriptId, id))
      .all();

    return NextResponse.json({ script: updatedScript, scenes });
  } catch (err) {
    console.error("generate-script error:", err);
    const msg = err instanceof Error ? err.message : "Lỗi AI generate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
