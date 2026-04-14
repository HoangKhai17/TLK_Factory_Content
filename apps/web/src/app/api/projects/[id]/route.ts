import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { projects, videos, chatMessages } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const project = db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectVideos = db
      .select()
      .from(videos)
      .where(eq(videos.projectId, id))
      .orderBy(videos.createdAt)
      .all()
      .reverse();

    const messages = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.projectId, id))
      .orderBy(chatMessages.createdAt)
      .all();

    return NextResponse.json({ project, videos: projectVideos, messages });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { name?: string; description?: string; status?: "active" | "archived" };
    const db = getDb();

    db.update(projects)
      .set({
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, id))
      .run();

    const project = db.select().from(projects).where(eq(projects.id, id)).get();
    return NextResponse.json({ project });
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
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

    db.delete(projects).where(eq(projects.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
