import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { videos, chatMessages, scriptScenes } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const video = db.select().from(videos).where(eq(videos.id, id)).get();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("GET /api/videos/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Clear FK references before deleting to avoid constraint violation
    db.update(chatMessages).set({ videoId: null }).where(eq(chatMessages.videoId, id)).run();
    db.update(scriptScenes).set({ videoId: null }).where(eq(scriptScenes.videoId, id)).run();

    db.delete(videos).where(eq(videos.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/videos/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
