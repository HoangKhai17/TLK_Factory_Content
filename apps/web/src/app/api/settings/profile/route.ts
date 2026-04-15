import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/auth/session";

export async function PATCH(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  try {
    const { name, avatar } = await request.json() as { name?: string; avatar?: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên không được để trống" }, { status: 400 });
    }

    const db = getDb();
    db.update(users)
      .set({
        name: name.trim(),
        avatar: avatar?.trim() || name.trim().charAt(0).toUpperCase(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id))
      .run();

    const updated = db.select().from(users).where(eq(users.id, user.id)).get()!;
    return NextResponse.json({
      user: { id: updated.id, name: updated.name, email: updated.email, avatar: updated.avatar },
    });
  } catch (err) {
    console.error("PATCH /api/settings/profile error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
