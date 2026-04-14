import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const result = db
      .select()
      .from(projects)
      .orderBy(projects.updatedAt)
      .all();

    return NextResponse.json({ projects: result.reverse() });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body as { name: string; description?: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const db = getDb();
    const id = nanoid();

    db.insert(projects)
      .values({
        id,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .run();

    const project = db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .get();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
