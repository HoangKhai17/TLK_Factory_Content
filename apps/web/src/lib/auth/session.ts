import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import type { UserRow } from "@/lib/db/schema";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "tlk_session";
const SESSION_DAYS = 30;

// ── Create + set cookie ────────────────────────────────────────
export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = nanoid(32);
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 86_400_000
  ).toISOString();

  db.insert(sessions).values({ id: sessionId, userId, expiresAt }).run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return sessionId;
}

// ── Get user from server-side cookie (pages / server components) ─
export async function getSessionUser(): Promise<UserRow | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  return sessionId ? lookupSession(sessionId) : null;
}

// ── Get user from request object (API routes) ──────────────────
export function getRequestUser(request: NextRequest): UserRow | null {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  return sessionId ? lookupSession(sessionId) : null;
}

// ── Delete session ─────────────────────────────────────────────
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const db = getDb();
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
  }
  cookieStore.delete(SESSION_COOKIE);
}

// ── Internal: validate session + return user ───────────────────
function lookupSession(sessionId: string): UserRow | null {
  const db = getDb();
  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    return null;
  }

  return db.select().from(users).where(eq(users.id, session.userId)).get() ?? null;
}
