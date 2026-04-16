import type { VideoType } from "@tlk/shared";

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CONSTANTS
// These are the fallback values used when no DB override exists.
// They are also seeded into the DB on first run (see db/index.ts).
// ─────────────────────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT_DEFAULT = `Bạn là TLK Factory AI - một chuyên gia thiết kế video automation.
Nhiệm vụ của bạn là giúp người dùng tạo ra các video chuyên nghiệp dựa trên mô tả của họ.

Bạn hỗ trợ các loại video:
- **YouTube**: Video dài, nội dung phong phú, tỷ lệ 16:9 (1920x1080)
- **Social Media**: Video ngắn, bắt mắt cho TikTok/Instagram/Facebook (1080x1920 hoặc 1080x1080)
- **Text Animation**: Video chữ động, typography đẹp
- **Marketing**: Video quảng cáo sản phẩm/dịch vụ

Khi người dùng mô tả video họ muốn tạo, bạn cần:
1. Xác nhận yêu cầu và hỏi thêm nếu cần
2. Khi đủ thông tin, trả về JSON spec theo format quy định

Hãy giao tiếp thân thiện bằng tiếng Việt, trừ khi người dùng dùng ngôn ngữ khác.`;

export const VIDEO_SPEC_STYLE_DEFAULT = `Tạo video chuyên nghiệp, hiện đại với phong cách visual cao cấp.
Ưu tiên:
- Gradient màu sắc đậm, tối (dark theme) tạo cảm giác sang trọng
- Typography rõ ràng, dễ đọc, font size phù hợp
- Bố cục cân đối, có trật tự, không rối mắt
- Màu accent nổi bật để highlight thông tin quan trọng
- Nội dung súc tích, đúng trọng tâm, không dài dòng`;

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA PROMPT (immutable — mirrors TypeScript types + Remotion components)
// Do NOT store this in DB. It must stay in sync with the codebase.
// ─────────────────────────────────────────────────────────────────────────────

export function buildVideoSpecSchemaPrompt(): string {
  return `═══════════════════════════════════════════════
QUY TẮC THỜI LƯỢNG — ĐỌC KỸ TRƯỚC KHI TẠO:
═══════════════════════════════════════════════

SCENE DURATION (trường "duration" trong mỗi scene):
• Scene text đơn giản (text-animation, quote): 3–4 giây
• Scene có list ngắn (≤3 bullet): 4–5 giây
• Scene có list dài (4–6 bullet): 5–7 giây
• Scene thống kê/số liệu (stat): 4–6 giây
• Scene timeline (≤3 bước): 5–6 giây, (4–5 bước): 6–8 giây
• Scene split: 4–5 giây
• Intro/Outro: 3–4 giây
• TUYỆT ĐỐI KHÔNG vượt quá 8 giây/scene

TỔNG THỜI LƯỢNG VIDEO (trường "duration" ở root):
• Phải bằng TỔNG của tất cả scene duration
• Ví dụ: 4 scenes × 4s = 16s tổng, KHÔNG được điền 60s

INTRO & OUTRO:
• CHỈ thêm "intro" khi user yêu cầu giới thiệu, branding, hoặc video dài (>30s)
• CHỈ thêm "outro" khi user yêu cầu CTA, kết thúc rõ ràng, hoặc video dài (>30s)
• Video ngắn/đơn giản: bắt đầu thẳng vào nội dung, KHÔNG cần intro/outro
• Đừng thêm scene thừa làm video dài không cần thiết

═══════════════════════════════════════════════
SCHEMA JSON:
═══════════════════════════════════════════════

{
  "type": "youtube" | "social" | "text-animation" | "marketing",
  "title": "Tiêu đề video",
  "duration": <TỔNG giây = tổng tất cả scene.duration>,
  "fps": 30,
  "resolution": "1920x1080" | "1080x1920" | "1080x1080" | "1280x720",
  "colorPalette": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "background": "#HEX",
    "text": "#HEX"
  },
  "font": { "heading": "Inter", "body": "Inter" },
  "scenes": [ ... ],
  "audio": { "backgroundMusic": "upbeat" | "calm" | "dramatic" | "corporate" | "none" }
}

═══════════════════════════════════════════════
SCENE TYPES:
═══════════════════════════════════════════════

1. "intro" — mở đầu (3–4s, CHỈ dùng khi cần)
{ "id":"s1","type":"intro","duration":3,"background":"gradient:#1a1a2e,#0f3460",
  "title":{"content":"Tiêu đề","fontSize":80,"fontWeight":"black","color":"#fff","align":"center","animation":"slideInUp"},
  "subtitle":{"content":"Mô tả","fontSize":32,"color":"#ffffffcc","animation":"fadeIn","animationDelay":0.4} }

2. "bullet-list" — danh sách tips/tính năng (4–7s tùy số bullets)
{ "id":"s2","type":"bullet-list","duration":5,"background":"gradient:#0f0f1a,#1a0a2e",
  "title":{"content":"Tiêu đề section","fontSize":52,"fontWeight":"bold","color":"#fff","animation":"slideInUp"},
  "bullets":[
    {"icon":"🚀","text":"Nội dung tip 1"},
    {"icon":"💡","text":"Nội dung tip 2"},
    {"icon":"✅","text":"Nội dung tip 3"}
  ] }

3. "stat" — số liệu (4–6s)
{ "id":"s3","type":"stat","duration":5,"background":"gradient:#0a0a1a,#0d1b2a",
  "title":{"content":"Kết quả","fontSize":44,"fontWeight":"bold","color":"#fff"},
  "stats":[
    {"value":"10x","label":"Tăng năng suất","color":"#00d4ff"},
    {"value":"95%","label":"Hài lòng","color":"#7c3aed"}
  ] }

4. "quote" — trích dẫn (3–5s)
{ "id":"s4","type":"quote","duration":4,"background":"gradient:#1a0a0a,#2d1b00",
  "title":{"content":"Câu nói ấn tượng ngắn gọn","fontSize":46,"fontWeight":"bold","color":"#fff","align":"center"},
  "subtitle":{"content":"Tác giả","fontSize":26,"color":"#fbbf24"} }

5. "timeline" — các bước (5–8s tùy số bước)
{ "id":"s5","type":"timeline","duration":6,"background":"gradient:#0f1a0f,#0a1a1a",
  "title":{"content":"Các bước","fontSize":50,"fontWeight":"bold","color":"#fff"},
  "steps":[
    {"number":1,"title":"Bước 1","description":"Mô tả ngắn"},
    {"number":2,"title":"Bước 2","description":"Mô tả ngắn"},
    {"number":3,"title":"Bước 3","description":"Mô tả ngắn"}
  ] }

6. "split" — so sánh 2 cột (4–5s)
{ "id":"s6","type":"split","duration":4,"background":"gradient:#0d0d1a,#1a0d1a",
  "title":{"content":"Trước & Sau","fontSize":46,"fontWeight":"bold","color":"#fff","align":"center"},
  "splitLeft":{"icon":"😓","title":"Vấn đề","body":"Mô tả","items":["Điểm yếu 1","Điểm yếu 2"]},
  "splitRight":{"icon":"🚀","title":"Giải pháp","body":"Mô tả","items":["Ưu điểm 1","Ưu điểm 2"]} }

7. "text-animation" — text đơn (3–4s)
{ "id":"s7","type":"text-animation","duration":4,"background":"gradient:#1a1a2e,#16213e",
  "title":{"content":"Nội dung chính","fontSize":64,"fontWeight":"bold","color":"#fff","align":"center","animation":"zoomIn"},
  "subtitle":{"content":"Phụ đề","fontSize":28,"color":"#ffffffcc","animation":"fadeIn","animationDelay":0.3} }

8. "outro" — kết thúc (3–4s, CHỈ dùng khi cần)
{ "id":"sN","type":"outro","duration":3,"background":"gradient:#0f3460,#1a1a2e",
  "title":{"content":"CTA mạnh","fontSize":64,"fontWeight":"bold","color":"#fff","align":"center","animation":"zoomIn"},
  "subtitle":{"content":"Hành động","fontSize":28,"color":"#fff","animation":"fadeIn","animationDelay":0.4} }

═══════════════════════════════════════════════
VÍ DỤ TÍNH THỜI LƯỢNG ĐÚNG:
═══════════════════════════════════════════════

Video "5 tips ngắn" → 5 scenes × ~4s = ~20s tổng:
  scene 1 bullet-list(5 tips) 6s + scene 2 stat 5s + scene 3 quote 4s + scene 4 timeline 5s = 20s
  → "duration": 20 ở root

Video "giới thiệu sản phẩm" → có intro+outro → ~25s:
  intro 3s + content 5s + features 6s + stats 5s + outro 3s = 22s
  → "duration": 22

RESOLUTION theo format:
• YouTube/ngang: "1920x1080"
• TikTok/dọc: "1080x1920"
• Instagram vuông: "1080x1080"
• HD nhỏ: "1280x720"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY EXPORTS — kept for backward-compatibility with any other importers
// New code should use promptService.ts instead.
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Import from promptService.ts */
export const SYSTEM_PROMPT = SYSTEM_PROMPT_DEFAULT;

/** @deprecated Import from promptService.ts */
export function buildVideoSpecPrompt(userPrompt: string): string {
  return `Người dùng muốn tạo video với yêu cầu sau:\n"${userPrompt}"\n\n${buildVideoSpecSchemaPrompt()}`;
}

export function buildChatResponsePrompt(
  userMessage: string,
  videoType: VideoType | null
): string {
  if (videoType) {
    return `Người dùng vừa yêu cầu tạo video loại "${videoType}": "${userMessage}"

Trả lời ngắn gọn (2-3 câu) xác nhận bạn đang tạo video và mô tả ngắn về nội dung sẽ được tạo.
Sau đó, trả về JSON spec theo format đã quy định.`;
  }

  return `Người dùng nói: "${userMessage}"

Nếu đây là yêu cầu tạo video, hãy hỏi thêm thông tin cần thiết (loại video, nội dung, phong cách...).
Nếu là câu hỏi thông thường, hãy trả lời hữu ích.
Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.`;
}
