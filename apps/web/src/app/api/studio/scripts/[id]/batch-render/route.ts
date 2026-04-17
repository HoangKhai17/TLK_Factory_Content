import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { scripts, scriptScenes, projects, videos } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";

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
  if (script.status === "rendering") {
    return NextResponse.json({ error: "Đang render rồi" }, { status: 409 });
  }

  const scenes = db
    .select()
    .from(scriptScenes)
    .where(eq(scriptScenes.scriptId, id))
    .orderBy(asc(scriptScenes.orderIndex))
    .all()
    .filter((s) => s.videoPrompt);

  if (scenes.length === 0) {
    return NextResponse.json({ error: "Chưa có scene prompts. Hãy generate prompts trước." }, { status: 400 });
  }

  try {
    // 1. Create a project for this script
    const projectId = nanoid();
    db.insert(projects)
      .values({
        id: projectId,
        name: script.title,
        description: `Script Studio: ${script.ideaText?.slice(0, 100) ?? ""}`,
        status: "active",
      })
      .run();

    // 2. Link project to script, set rendering status
    db.update(scripts)
      .set({ projectId, status: "rendering", updatedAt: new Date().toISOString() })
      .where(eq(scripts.id, id))
      .run();

    // 3. Create video stubs (no code yet — code generated in background)
    const videoIds: string[] = [];
    for (const scene of scenes) {
      const videoId = nanoid();
      db.insert(videos)
        .values({
          id: videoId,
          projectId,
          title: scene.title,
          prompt: scene.videoPrompt!,
          generationMode: "ai-code",
          status: "pending",
        })
        .run();

      db.update(scriptScenes)
        .set({ videoId, renderStatus: "queued" })
        .where(eq(scriptScenes.id, scene.id))
        .run();

      videoIds.push(videoId);
    }

    // 4. Generate code + render each scene sequentially in background
    batchRenderBackground(scenes.map((s, i) => ({
      sceneId: s.id,
      videoId: videoIds[i]!,
      prompt: s.videoPrompt!,
      animationType: s.animationType ?? null,
    })), id, user.id);

    return NextResponse.json({
      ok: true,
      projectId,
      videoIds,
      message: `Đang render ${videoIds.length} scenes. Theo dõi tiến độ trên trang này.`,
    });
  } catch (err) {
    console.error("batch-render error:", err);
    const msg = err instanceof Error ? err.message : "Lỗi batch render";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Background: generate code then render, sequentially ──────
interface SceneTask {
  sceneId: string;
  videoId: string;
  prompt: string;
  animationType: string | null;
}

async function batchRenderBackground(tasks: SceneTask[], scriptId: string, userId: string) {
  const db = getDb();

  for (const task of tasks) {
    const { sceneId, videoId, prompt, animationType } = task;

    try {
      // Step A — Generate code
      db.update(videos)
        .set({ status: "generating", updatedAt: new Date().toISOString() })
        .where(eq(videos.id, videoId))
        .run();
      db.update(scriptScenes)
        .set({ renderStatus: "rendering" })
        .where(eq(scriptScenes.id, sceneId))
        .run();

      const { getAIProvider } = await import("@/lib/ai");
      const { validateGeneratedCode, parseCodeMeta } = await import("@/lib/ai/codeValidator");
      const { renderGeneratedCode } = await import("@/lib/renderer/codeRenderer");

      const ai = getAIProvider(userId);
      const { code } = await ai.generateRemotionCode(
        prompt,
        animationType as import("@/lib/ai/codegenSystemPrompt").VideoAnimationType | null
      );

      const validation = validateGeneratedCode(code);
      if (!validation.valid) throw new Error(`Code invalid: ${validation.error}`);

      const meta = parseCodeMeta(code);

      // Save code to video record
      db.update(videos)
        .set({
          generatedCode: code,
          title: meta.title,
          status: "rendering",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(videos.id, videoId))
        .run();

      // Step B — Render
      const result = await renderGeneratedCode(videoId, code, (progress) => {
        console.log(`[batch:${videoId}] ${progress}%`);
      });

      db.update(videos)
        .set({
          status: "completed",
          outputPath: result.outputPath,
          thumbnailPath: result.thumbnailPath,
          durationSeconds: result.durationSeconds,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(videos.id, videoId))
        .run();

      db.update(scriptScenes)
        .set({ renderStatus: "completed" })
        .where(eq(scriptScenes.id, sceneId))
        .run();

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      console.error(`[batch:${videoId}] failed:`, msg);

      db.update(videos)
        .set({ status: "failed", errorMessage: msg, updatedAt: new Date().toISOString() })
        .where(eq(videos.id, videoId))
        .run();

      db.update(scriptScenes)
        .set({ renderStatus: "failed" })
        .where(eq(scriptScenes.id, sceneId))
        .run();
    }
  }

  // Mark script completed when all scenes done
  const remaining = db
    .select()
    .from(scriptScenes)
    .where(eq(scriptScenes.scriptId, scriptId))
    .all()
    .filter((s) => s.renderStatus !== "completed" && s.renderStatus !== "failed");

  if (remaining.length === 0) {
    db.update(scripts)
      .set({ status: "completed", updatedAt: new Date().toISOString() })
      .where(eq(scripts.id, scriptId))
      .run();
  }
}
