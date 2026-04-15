import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { scripts, scriptScenes } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";

// GET /api/studio/scripts — list all scripts
export async function GET(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const rows = db
    .select()
    .from(scripts)
    .where(eq(scripts.userId, user.id))
    .orderBy(desc(scripts.updatedAt))
    .all();

  return NextResponse.json({ scripts: rows });
}

// POST /api/studio/scripts — create new script
export async function POST(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const db = getDb();
  const id = nanoid();
  db.insert(scripts)
    .values({ id, userId: user.id, title: "Untitled Script" })
    .run();

  const created = db.select().from(scripts).where(eq(scripts.id, id)).get()!;
  return NextResponse.json({ script: created }, { status: 201 });
}
