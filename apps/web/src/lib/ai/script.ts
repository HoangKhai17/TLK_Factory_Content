import { getAIProvider } from "./index";
import { SYSTEM_PROMPT } from "@/lib/gemini/prompts";

// ── Types ──────────────────────────────────────────────────────
export type SceneType = "hook" | "intro" | "content" | "cta" | "outro";

export interface VideoScriptScene {
  id: string;
  type: SceneType;
  title: string;
  duration: number;    // seconds
  content: string;     // full script text for this scene
  visualNotes: string; // visual/animation suggestions
}

export interface VideoScript {
  title: string;
  totalDuration: number;
  style: string;        // visual style (e.g. "modern, dark, energetic")
  colorTheme: string;   // color palette description
  scenes: VideoScriptScene[];
}

export interface ScenePromptResult {
  sceneId: string;
  videoPrompt: string; // ready to feed into generateVideoSpec()
}

// ── Script generation ──────────────────────────────────────────
export async function generateVideoScript(
  ideaText: string,
  youtubeUrls: string[],
  userId: string | null
): Promise<VideoScript> {
  const ai = getAIProvider(userId);

  const youtubeSection =
    youtubeUrls.length > 0
      ? `\n\nVideo YouTube tham khảo (hãy phân tích phong cách, nhịp điệu, cấu trúc):\n${youtubeUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}`
      : "";

  const prompt = `${SYSTEM_PROMPT}

Người dùng muốn tạo một video với ý tưởng sau:
"${ideaText}"${youtubeSection}

Hãy viết một kịch bản video hoàn chỉnh, chuyên nghiệp bao gồm các phần:
- hook: Câu mở đầu cực kỳ thu hút (3-8 giây), tạo sự tò mò ngay lập tức
- intro: Giới thiệu chủ đề và những gì khán giả sẽ nhận được (8-20 giây)
- content: 3-5 phần nội dung chính với thông tin có giá trị (mỗi phần 20-60 giây)
- cta: Lời kêu gọi hành động rõ ràng (5-10 giây)
- outro: Kết video gợi nhớ thương hiệu (5-10 giây)

Trả về JSON theo schema sau (không có markdown, không giải thích thêm):
{
  "title": "Tiêu đề video hấp dẫn",
  "totalDuration": <tổng giây>,
  "style": "Mô tả phong cách visual (ví dụ: modern dark, minimalist, energetic)",
  "colorTheme": "Mô tả palette màu (ví dụ: gradient xanh Navy to Cyan, nền tối text trắng)",
  "scenes": [
    {
      "id": "scene-1",
      "type": "hook",
      "title": "Tên ngắn của phân đoạn",
      "duration": <giây>,
      "content": "Nội dung kịch bản chi tiết cho phân đoạn này — viết như đang nói chuyện với khán giả...",
      "visualNotes": "Gợi ý hình ảnh/animation: text xuất hiện như thế nào, màu nền, hiệu ứng..."
    }
  ]
}`;

  const raw = await ai.chat([], prompt);
  return extractJSON<VideoScript>(raw);
}

// ── Scene prompt generation ────────────────────────────────────
export async function generateScenePrompts(
  script: VideoScript,
  userId: string | null
): Promise<ScenePromptResult[]> {
  const ai = getAIProvider(userId);

  const prompt = `Bạn là chuyên gia tạo video animation cho TLK Factory Content.

Dưới đây là kịch bản video đã được viết:
Tiêu đề: "${script.title}"
Phong cách visual: "${script.style}"
Theme màu: "${script.colorTheme}"
Tổng thời lượng: ${script.totalDuration}s

Hãy tạo prompt video animation chi tiết cho từng scene, đảm bảo:
- Phong cách nhất quán xuyên suốt
- Mỗi scene có animation riêng phù hợp với nội dung
- Prompts tương thích với hệ thống TLK Factory (Remotion-based)
- Liên kết chặt chẽ về màu sắc, font, và nhịp điệu

Các scenes cần tạo prompt:
${script.scenes
  .map(
    (s, i) => `
Scene ${i + 1} — "${s.title}" (type: ${s.type}, ${s.duration}s):
Nội dung: ${s.content}
Gợi ý visual: ${s.visualNotes}`
  )
  .join("\n")}

Trả về JSON (không markdown):
{
  "scenePrompts": [
    {
      "sceneId": "scene-1",
      "videoPrompt": "Tạo video [type] animation [duration]s: [mô tả chi tiết về chữ, màu sắc, animation, nhịp điệu, font, hiệu ứng chuyển cảnh...]"
    }
  ]
}`;

  const raw = await ai.chat([], prompt);
  const result = extractJSON<{ scenePrompts: ScenePromptResult[] }>(raw);
  return result.scenePrompts;
}

// ── Helper ─────────────────────────────────────────────────────
function extractJSON<T>(raw: string): T {
  const match =
    raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = match ? (match[1] ?? raw) : raw;
  try {
    return JSON.parse(jsonStr.trim()) as T;
  } catch {
    throw new Error(`AI trả về JSON không hợp lệ: ${jsonStr.slice(0, 300)}`);
  }
}
