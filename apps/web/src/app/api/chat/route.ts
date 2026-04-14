import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { chatMessages, videos, projects } from "@/lib/db/schema";
import {
  generateVideoSpec,
  chatWithAssistant,
  isVideoCreationRequest,
} from "@/lib/gemini/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { projectId: string; message: string };
    const { projectId, message } = body;

    if (!projectId || !message?.trim()) {
      return NextResponse.json(
        { error: "projectId and message are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify project exists
    const project = db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Save user message
    const userMsgId = nanoid();
    db.insert(chatMessages)
      .values({
        id: userMsgId,
        projectId,
        role: "user",
        content: message.trim(),
      })
      .run();

    // Get chat history for context
    const history = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.projectId, projectId))
      .orderBy(chatMessages.createdAt)
      .all()
      .slice(-20); // Last 20 messages for context

    let assistantContent: string;
    let videoId: string | null = null;

    if (isVideoCreationRequest(message)) {
      // Generate video spec
      const { spec, assistantMessage } = await generateVideoSpec(message);

      // Create video record
      videoId = nanoid();
      db.insert(videos)
        .values({
          id: videoId,
          projectId,
          title: spec.title,
          prompt: message,
          spec: JSON.stringify(spec),
          status: "pending",
        })
        .run();

      // Update project timestamp
      db.update(projects)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(projects.id, projectId))
        .run();

      assistantContent =
        assistantMessage +
        `\n\n✅ **Video spec đã được tạo!** Nhấn **Render** để bắt đầu tạo video MP4.`;
    } else {
      // Normal chat
      const geminiHistory = history
        .filter((m) => m.role !== "system")
        .slice(0, -1) // Exclude the message we just saved
        .map((m) => ({
          role: m.role === "assistant" ? ("model" as const) : ("user" as const),
          parts: m.content,
        }));

      assistantContent = await chatWithAssistant(geminiHistory, message);
    }

    // Save assistant message
    const assistantMsgId = nanoid();
    db.insert(chatMessages)
      .values({
        id: assistantMsgId,
        projectId,
        role: "assistant",
        content: assistantContent,
        videoId: videoId,
      })
      .run();

    const assistantMsg = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, assistantMsgId))
      .get();

    return NextResponse.json({
      message: assistantMsg,
      videoId,
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
