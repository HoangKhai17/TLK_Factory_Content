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

export type ProjectRow = typeof projects.$inferSelect;
export type VideoRow = typeof videos.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
