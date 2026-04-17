import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { chatMessages, videos, projects } from "@/lib/db/schema";
import { getAIProvider } from "@/lib/ai";
import { isVideoCreationRequest } from "@/lib/gemini/client";
import { getRequestUser } from "@/lib/auth/session";

// DELETE /api/chat?projectId=xxx — clear all chat messages for a project
export async function DELETE(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const db = getDb();
  // Verify project belongs to user (via any video or just existence check)
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  db.delete(chatMessages).where(eq(chatMessages.projectId, projectId)).run();
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      projectId: string;
      message: string;
      provider?: string;
      model?: string;
      generationMode?: "template" | "ai-code";
      videoType?: string | null;
    };
    const { projectId, message, provider, model, generationMode = "template", videoType = null } = body;

    if (!projectId || !message?.trim()) {
      return NextResponse.json(
        { error: "projectId and message are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify project exists
    const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get AI provider (user config or env fallback)
    const user = getRequestUser(request);
    const ai = getAIProvider(user?.id ?? null, provider, model);

    // Save user message
    const userMsgId = nanoid();
    db.insert(chatMessages)
      .values({ id: userMsgId, projectId, role: "user", content: message.trim() })
      .run();

    // Get chat history for context
    const history = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.projectId, projectId))
      .orderBy(chatMessages.createdAt)
      .all()
      .slice(-20);

    let assistantContent: string;
    let videoId: string | null = null;

    if (isVideoCreationRequest(message)) {
      videoId = nanoid();

      if (generationMode === "ai-code") {
        // AI Code Generation mode: AI writes Remotion JSX
        const { code, assistantMessage } = await ai.generateRemotionCode(message, videoType as import("@/lib/ai/codegenSystemPrompt").VideoAnimationType | null);
        console.log("[ai-code] raw first 200 chars:", JSON.stringify(code.slice(0, 200)));
        const { validateGeneratedCode, parseCodeMeta } = await import("@/lib/ai/codeValidator");
        const validation = validateGeneratedCode(code);
        if (!validation.valid) throw new Error(`Code validation failed: ${validation.error}`);
        const meta = parseCodeMeta(code);

        db.insert(videos)
          .values({
            id: videoId,
            projectId,
            title: meta.title,
            prompt: message,
            generationMode: "ai-code",
            generatedCode: code,
            status: "pending",
          })
          .run();

        assistantContent = assistantMessage +
          `\n\n✅ **Motion graphics code đã được tạo!** Nhấn **Render** để bắt đầu render video MP4.`;
      } else {
        // Template mode: AI generates VideoSpec JSON
        const { spec, assistantMessage } = await ai.generateVideoSpec(message);

        db.insert(videos)
          .values({
            id: videoId,
            projectId,
            title: spec.title,
            prompt: message,
            spec: JSON.stringify(spec),
            generationMode: "template",
            status: "pending",
          })
          .run();

        assistantContent = assistantMessage +
          `\n\n✅ **Video spec đã được tạo!** Nhấn **Render** để bắt đầu tạo video MP4.`;
      }

      db.update(projects)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(projects.id, projectId))
        .run();
    } else {
      // Normal chat
      const aiHistory = history
        .filter((m) => m.role !== "system")
        .slice(0, -1)
        .map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        }));

      assistantContent = await ai.chat(aiHistory, message);
    }

    // Save assistant message
    const assistantMsgId = nanoid();
    db.insert(chatMessages)
      .values({ id: assistantMsgId, projectId, role: "assistant", content: assistantContent, videoId })
      .run();

    const assistantMsg = db.select().from(chatMessages).where(eq(chatMessages.id, assistantMsgId)).get();

    return NextResponse.json({ message: assistantMsg, videoId });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
