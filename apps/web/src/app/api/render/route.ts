import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import type { VideoSpec } from "@tlk/shared";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { videoId: string };
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const db = getDb();
    const video = db.select().from(videos).where(eq(videos.id, videoId)).get();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.status === "rendering") {
      return NextResponse.json(
        { error: "Video is already being rendered" },
        { status: 409 }
      );
    }

    if (!video.spec) {
      return NextResponse.json(
        { error: "Video spec not found" },
        { status: 400 }
      );
    }

    // Update status to rendering and clear previous error
    db.update(videos)
      .set({ status: "rendering", errorMessage: null, updatedAt: new Date().toISOString() })
      .where(eq(videos.id, videoId))
      .run();

    const spec: VideoSpec = JSON.parse(video.spec);

    // Render in background (non-blocking response)
    renderInBackground(videoId, spec);

    return NextResponse.json({
      message: "Rendering started",
      videoId,
      status: "rendering",
    });
  } catch (error) {
    console.error("POST /api/render error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function renderInBackground(videoId: string, spec: VideoSpec) {
  const db = getDb();
  try {
    const { renderVideo } = await import("@/lib/renderer");
    const result = await renderVideo({
      videoId,
      spec,
      onProgress: (progress) => {
        console.log(`[${videoId}] Render progress: ${progress}%`);
      },
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

    console.log(`[${videoId}] Render completed: ${result.outputPath}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${videoId}] Render failed:`, error);

    db.update(videos)
      .set({
        status: "failed",
        errorMessage: errorMsg,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(videos.id, videoId))
      .run();
  }
}
