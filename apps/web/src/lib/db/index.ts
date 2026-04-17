import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
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
      generation_mode TEXT NOT NULL DEFAULT 'template',
      generated_code TEXT,
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

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_configs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      active_model TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, provider)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_configs_user_id ON api_configs(user_id);

    -- Fix deprecated model IDs (1.5-pro and 1.5-flash removed by Google Oct 2025)
    UPDATE api_configs SET active_model = 'gemini-2.0-flash'
      WHERE provider = 'gemini'
        AND active_model NOT IN (
          'gemini-2.5-pro', 'gemini-2.5-flash',
          'gemini-2.0-flash', 'gemini-2.0-flash-lite'
        );

    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id),
      title TEXT NOT NULL DEFAULT 'Untitled Script',
      idea_text TEXT,
      youtube_urls TEXT,
      full_script TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS script_scenes (
      id TEXT PRIMARY KEY,
      script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      section_type TEXT NOT NULL,
      title TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 10,
      content TEXT,
      visual_notes TEXT,
      video_prompt TEXT,
      video_id TEXT REFERENCES videos(id),
      render_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
    CREATE INDEX IF NOT EXISTS idx_script_scenes_script_id ON script_scenes(script_id);

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_prompt_templates_key ON prompt_templates(key);
  `);

  // Safe column additions (ignored if already exist)
  for (const ddl of [
    "ALTER TABLE videos ADD COLUMN generation_mode TEXT NOT NULL DEFAULT 'template'",
    "ALTER TABLE videos ADD COLUMN generated_code TEXT",
    "ALTER TABLE scripts ADD COLUMN video_mode TEXT NOT NULL DEFAULT 'animation'",
    "ALTER TABLE script_scenes ADD COLUMN animation_type TEXT",
  ]) {
    try { sqlite.exec(ddl); } catch { /* column already exists */ }
  }

  // Seed default prompt templates (INSERT OR IGNORE — never overwrites user edits)
  const seedPrompt = sqlite.prepare(`
    INSERT OR IGNORE INTO prompt_templates (id, key, name, description, content, is_default)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  seedPrompt.run(
    nanoid(),
    "system_chat",
    "Chat System Prompt",
    "Nhân cách và giới thiệu AI trong cuộc trò chuyện",
    `Bạn là TLK Factory AI - một chuyên gia thiết kế video automation.
Nhiệm vụ của bạn là giúp người dùng tạo ra các video chuyên nghiệp dựa trên mô tả của họ.

Bạn hỗ trợ các loại video:
- **YouTube**: Video dài, nội dung phong phú, tỷ lệ 16:9 (1920x1080)
- **Social Media**: Video ngắn, bắt mắt cho TikTok/Instagram/Facebook (1080x1920 hoặc 1080x1080)
- **Text Animation**: Video chữ động, typography đẹp
- **Marketing**: Video quảng cáo sản phẩm/dịch vụ

Khi người dùng mô tả video họ muốn tạo, bạn cần:
1. Xác nhận yêu cầu và hỏi thêm nếu cần
2. Khi đủ thông tin, trả về JSON spec theo format quy định

Hãy giao tiếp thân thiện bằng tiếng Việt, trừ khi người dùng dùng ngôn ngữ khác.`
  );

  seedPrompt.run(
    nanoid(),
    "video_spec_style",
    "Video Style Instruction",
    "Hướng dẫn phong cách và thương hiệu cho video được tạo ra",
    `Tạo video chuyên nghiệp, hiện đại với phong cách visual cao cấp.
Ưu tiên:
- Gradient màu sắc đậm, tối (dark theme) tạo cảm giác sang trọng
- Typography rõ ràng, dễ đọc, font size phù hợp
- Bố cục cân đối, có trật tự, không rối mắt
- Màu accent nổi bật để highlight thông tin quan trọng
- Nội dung súc tích, đúng trọng tâm, không dài dòng`
  );
}
