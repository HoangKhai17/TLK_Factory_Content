import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json() as {
      name: string;
      email: string;
      password: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    const db = getDb();
    const existing = db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
    if (existing) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const userId = nanoid();
    db.insert(users)
      .values({
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        avatar: name.trim().charAt(0).toUpperCase(),
      })
      .run();

    await createSession(userId);

    const user = db.select().from(users).where(eq(users.id, userId)).get()!;
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
