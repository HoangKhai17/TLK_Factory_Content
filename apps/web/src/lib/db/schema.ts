import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// === Projects ===
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === Videos ===
export const videos = sqliteTable("videos", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  spec: text("spec"), // JSON string of VideoSpec
  generationMode: text("generation_mode", { enum: ["template", "ai-code"] }).notNull().default("template"),
  generatedCode: text("generated_code"), // TSX source code when mode=ai-code
  status: text("status", {
    enum: ["pending", "generating", "rendering", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  outputPath: text("output_path"),
  thumbnailPath: text("thumbnail_path"),
  errorMessage: text("error_message"),
  durationSeconds: integer("duration_seconds"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === Chat Messages ===
export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  videoId: text("video_id").references(() => videos.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === Users ===
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar"), // emoji or initials
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === Sessions ===
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === API Configs ===
export const apiConfigs = sqliteTable("api_configs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", {
    enum: ["gemini", "openai", "anthropic"],
  }).notNull(),
  apiKey: text("api_key").notNull(),
  activeModel: text("active_model").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === Scripts (Script Studio) ===
export const scripts = sqliteTable("scripts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id),
  title: text("title").notNull().default("Untitled Script"),
  ideaText: text("idea_text"),
  youtubeUrls: text("youtube_urls"),  // JSON string[]
  fullScript: text("full_script"),    // JSON VideoScript
  videoMode: text("video_mode", { enum: ["animation", "slideshow"] }).notNull().default("animation"),
  status: text("status", {
    enum: ["draft", "script-ready", "prompts-ready", "rendering", "completed"],
  })
    .notNull()
    .default("draft"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === Script Scenes ===
export const scriptScenes = sqliteTable("script_scenes", {
  id: text("id").primaryKey(),
  scriptId: text("script_id")
    .notNull()
    .references(() => scripts.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  sectionType: text("section_type").notNull(), // hook|intro|content|cta|outro
  title: text("title").notNull(),
  duration: integer("duration").notNull().default(10), // seconds
  content: text("content"),      // script text for this scene
  visualNotes: text("visual_notes"),
  videoPrompt: text("video_prompt"),     // AI-generated animation prompt
  animationType: text("animation_type"), // Recommended VideoAnimationType for this scene
  videoId: text("video_id").references(() => videos.id),
  renderStatus: text("render_status", {
    enum: ["pending", "queued", "rendering", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// === Prompt Templates ===
export const promptTemplates = sqliteTable("prompt_templates", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type ProjectRow = typeof projects.$inferSelect;
export type VideoRow = typeof videos.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type ApiConfigRow = typeof apiConfigs.$inferSelect;
export type ScriptRow = typeof scripts.$inferSelect;
export type ScriptSceneRow = typeof scriptScenes.$inferSelect;
export type PromptTemplateRow = typeof promptTemplates.$inferSelect;
