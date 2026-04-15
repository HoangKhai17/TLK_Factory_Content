import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { scripts, scriptScenes, projects, videos } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";
import { getAIProvider } from "@/lib/ai";
import type { VideoSpec } from "@tlk/shared";

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
    .filter((s) => s.videoPrompt); // only scenes with prompts

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

    // 2. Link project to script
    db.update(scripts)
      .set({ projectId, status: "rendering", updatedAt: new Date().toISOString() })
      .where(eq(scripts.id, id))
      .run();

    // 3. For each scene: generate VideoSpec + create video record
    const ai = getAIProvider(user.id);
    const videoIds: string[] = [];

    for (const scene of scenes) {
      let spec: VideoSpec;
      try {
        const result = await ai.generateVideoSpec(scene.videoPrompt!);
        spec = result.spec;
      } catch {
        // If spec generation fails, use a minimal fallback spec
        spec = buildFallbackSpec(scene);
      }

      const videoId = nanoid();
      db.insert(videos)
        .values({
          id: videoId,
          projectId,
          title: scene.title,
          prompt: scene.videoPrompt!,
          spec: JSON.stringify(spec),
          status: "pending",
        })
        .run();

      // Link video to scene
      db.update(scriptScenes)
        .set({ videoId, renderStatus: "queued" })
        .where(eq(scriptScenes.id, scene.id))
        .run();

      videoIds.push(videoId);
    }

    // 4. Start batch render in background (sequential to avoid overwhelming CPU)
    batchRenderBackground(videoIds, id);

    return NextResponse.json({
      ok: true,
      projectId,
      videoIds,
      message: `Đang render ${videoIds.length} scenes. Chuyển đến project để xem tiến độ.`,
    });
  } catch (err) {
    console.error("batch-render error:", err);
    const msg = err instanceof Error ? err.message : "Lỗi batch render";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Background sequential render ──────────────────────────────
async function batchRenderBackground(videoIds: string[], scriptId: string) {
  const db = getDb();
  const { renderVideo } = await import("@/lib/renderer");

  for (const videoId of videoIds) {
    const video = db.select().from(videos).where(eq(videos.id, videoId)).get();
    if (!video?.spec) continue;

    // Update video + scene status
    db.update(videos)
      .set({ status: "rendering", updatedAt: new Date().toISOString() })
      .where(eq(videos.id, videoId))
      .run();

    const scene = db
      .select()
      .from(scriptScenes)
      .where(eq(scriptScenes.videoId, videoId))
      .get();
    if (scene) {
      db.update(scriptScenes)
        .set({ renderStatus: "rendering" })
        .where(eq(scriptScenes.id, scene.id))
        .run();
    }

    try {
      const spec: VideoSpec = JSON.parse(video.spec);
      const result = await renderVideo({ videoId, spec });

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

      if (scene) {
        db.update(scriptScenes)
          .set({ renderStatus: "completed" })
          .where(eq(scriptScenes.id, scene.id))
          .run();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Render error";
      db.update(videos)
        .set({ status: "failed", errorMessage: msg, updatedAt: new Date().toISOString() })
        .where(eq(videos.id, videoId))
        .run();

      if (scene) {
        db.update(scriptScenes)
          .set({ renderStatus: "failed" })
          .where(eq(scriptScenes.id, scene.id))
          .run();
      }
    }
  }

  // Check if all scenes done → mark script as completed
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

// ── Fallback spec when AI fails for a scene ───────────────────
function buildFallbackSpec(scene: { title: string; duration: number; sectionType: string }): VideoSpec {
  return {
    type: "text-animation",
    title: scene.title,
    duration: scene.duration,
    fps: 30,
    resolution: "1920x1080",
    colorPalette: {
      primary: "#3A5AF7",
      secondary: "#06B3ED",
      accent: "#5B4BFF",
      background: "#0F172A",
      text: "#FFFFFF",
    },
    font: { heading: "Inter", body: "Inter" },
    scenes: [
      {
        id: "s1",
        type: "intro",
        duration: scene.duration,
        background: "#0F172A",
        title: {
          content: scene.title,
          fontSize: 64,
          fontWeight: "bold",
          color: "#FFFFFF",
          align: "center",
          animation: "fadeIn",
          animationDelay: 0,
        },
      },
    ],
    audio: { backgroundMusic: "calm" },
  } as VideoSpec;
}
