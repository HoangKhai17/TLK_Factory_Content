/**
 * promptService.ts
 *
 * Loads prompt templates from the DB with fallback to hardcoded defaults.
 * This is the ONLY place that touches the DB for prompts — all providers import from here.
 *
 * Architecture:
 *   Schema / JSON structure   → stays in code  (mirrors TypeScript types + Remotion components)
 *   Style / brand instruction → stored in DB   (customisable per deployment / white-label)
 *   Chat system personality   → stored in DB   (customisable per deployment / white-label)
 */

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { promptTemplates } from "@/lib/db/schema";
import {
  SYSTEM_PROMPT_DEFAULT,
  VIDEO_SPEC_STYLE_DEFAULT,
  buildVideoSpecSchemaPrompt,
} from "./prompts";

/** Load the chat system instruction from DB (falls back to default). */
export function getSystemChatPrompt(): string {
  try {
    const row = getDb()
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.key, "system_chat"))
      .get();
    return row?.content ?? SYSTEM_PROMPT_DEFAULT;
  } catch {
    return SYSTEM_PROMPT_DEFAULT;
  }
}

/**
 * Build the full video-spec generation prompt.
 * Style instruction comes from DB; JSON schema stays in code.
 */
export function buildVideoSpecPrompt(userPrompt: string): string {
  let styleInstruction = VIDEO_SPEC_STYLE_DEFAULT;
  try {
    const row = getDb()
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.key, "video_spec_style"))
      .get();
    if (row?.content) styleInstruction = row.content;
  } catch {
    // fallback already assigned
  }

  return `Người dùng muốn tạo video với yêu cầu sau:
"${userPrompt}"

${styleInstruction}

Phân tích yêu cầu và tạo video spec JSON. Trả về CHÍNH XÁC một JSON object.

${buildVideoSpecSchemaPrompt()}`;
}
