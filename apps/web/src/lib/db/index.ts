import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "tlk_factory.db");

// Singleton pattern for SQLite connection
let db: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!db) {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite, { schema });
    runMigrations(sqlite);
  }
  return db;
}

function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      thumbnail_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      spec TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      output_path TEXT,
      thumbnail_path TEXT,
      error_message TEXT,
      duration_seconds INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      video_id TEXT REFERENCES videos(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
  `);
}
