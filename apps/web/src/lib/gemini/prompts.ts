import type { VideoType } from "@tlk/shared";

export const SYSTEM_PROMPT = `Bạn là TLK Factory AI - một chuyên gia thiết kế video automation.
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

export function buildVideoSpecPrompt(userPrompt: string): string {
  return `Người dùng muốn tạo video với yêu cầu sau:
"${userPrompt}"

Hãy phân tích yêu cầu và tạo một video spec JSON hoàn chỉnh, đa dạng scene types, phong phú nội dung.
Trả về CHÍNH XÁC một JSON object theo schema sau:

{
  "type": "youtube" | "social" | "text-animation" | "marketing",
  "title": "Tiêu đề video",
  "duration": <số giây tổng>,
  "fps": 30,
  "resolution": "1920x1080" | "1080x1920" | "1080x1080" | "1280x720",
  "colorPalette": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "background": "#HEX",
    "text": "#HEX"
  },
  "font": {
    "heading": "Inter" | "Poppins" | "Montserrat" | "Playfair Display" | "Roboto",
    "body": "Inter" | "Open Sans" | "Lato" | "Roboto"
  },
  "scenes": [ <array of scene objects — see types below> ],
  "audio": {
    "backgroundMusic": "upbeat" | "calm" | "dramatic" | "corporate" | "none"
  }
}

═══════════════════════════════════════════════
SCENE TYPES — chọn đúng type phù hợp nội dung:
═══════════════════════════════════════════════

1. TYPE "intro" — màn hình mở đầu ấn tượng
{
  "id": "scene-1", "type": "intro", "duration": 4,
  "background": "gradient:#1a1a2e,#0f3460",
  "title": { "content": "Tiêu đề lớn", "fontSize": 80, "fontWeight": "black", "color": "#fff", "align": "center", "animation": "slideInUp" },
  "subtitle": { "content": "Mô tả ngắn", "fontSize": 32, "fontWeight": "normal", "color": "#ffffffcc", "align": "center", "animation": "fadeIn", "animationDelay": 0.4 }
}

2. TYPE "bullet-list" — danh sách tips, tính năng, lợi ích ← DÙNG CHO NỘI DUNG DẠNG LIST
{
  "id": "scene-2", "type": "bullet-list", "duration": 7,
  "background": "gradient:#0f0f1a,#1a0a2e",
  "title": { "content": "5 Tips Quan Trọng", "fontSize": 52, "fontWeight": "bold", "color": "#fff", "animation": "slideInUp" },
  "subtitle": { "content": "Áp dụng ngay hôm nay", "fontSize": 24, "color": "#aaaaff" },
  "bullets": [
    { "icon": "🚀", "text": "Tip 1 ngắn gọn, rõ ràng" },
    { "icon": "💡", "text": "Tip 2 ngắn gọn, rõ ràng" },
    { "icon": "✅", "text": "Tip 3 ngắn gọn, rõ ràng" },
    { "icon": "🎯", "text": "Tip 4 ngắn gọn, rõ ràng" },
    { "icon": "⚡", "text": "Tip 5 ngắn gọn, rõ ràng" }
  ]
}

3. TYPE "stat" — số liệu nổi bật, data, thống kê ← DÙNG KHI CÓ CON SỐ ẤN TƯỢNG
{
  "id": "scene-3", "type": "stat", "duration": 6,
  "background": "gradient:#0a0a1a,#0d1b2a",
  "title": { "content": "Kết Quả Thực Tế", "fontSize": 44, "fontWeight": "bold", "color": "#fff" },
  "stats": [
    { "value": "10x", "label": "Tăng năng suất", "color": "#00d4ff" },
    { "value": "95%", "label": "Người dùng hài lòng", "color": "#7c3aed" },
    { "value": "2 phút", "label": "Tiết kiệm mỗi tác vụ", "color": "#10b981" }
  ]
}

4. TYPE "quote" — trích dẫn, câu nói ấn tượng ← DÙNG ĐỂ NHẤN MẠNH Ý TƯỞNG QUAN TRỌNG
{
  "id": "scene-4", "type": "quote", "duration": 5,
  "background": "gradient:#1a0a0a,#2d1b00",
  "title": { "content": "Nội dung trích dẫn sâu sắc, không quá dài, gây ấn tượng mạnh", "fontSize": 46, "fontWeight": "bold", "color": "#fff", "align": "center" },
  "subtitle": { "content": "Tên tác giả hoặc nguồn", "fontSize": 26, "color": "#fbbf24" }
}

5. TYPE "timeline" — các bước, quy trình, lịch sử ← DÙNG KHI CÓ THỨ TỰ TUẦN TỰ
{
  "id": "scene-5", "type": "timeline", "duration": 8,
  "background": "gradient:#0f1a0f,#0a1a1a",
  "title": { "content": "3 Bước Thực Hiện", "fontSize": 50, "fontWeight": "bold", "color": "#fff" },
  "steps": [
    { "number": 1, "title": "Bước đầu tiên", "description": "Mô tả ngắn về bước này" },
    { "number": 2, "title": "Bước thứ hai", "description": "Mô tả ngắn về bước này" },
    { "number": 3, "title": "Bước cuối cùng", "description": "Mô tả ngắn về bước này" }
  ]
}

6. TYPE "split" — so sánh 2 phía, trước/sau, vấn đề/giải pháp ← DÙNG KHI CẦN ĐỐI CHIẾU
{
  "id": "scene-6", "type": "split", "duration": 6,
  "background": "gradient:#0d0d1a,#1a0d1a",
  "title": { "content": "Trước & Sau", "fontSize": 46, "fontWeight": "bold", "color": "#fff", "align": "center" },
  "splitLeft": {
    "icon": "😓",
    "title": "Vấn đề cũ",
    "body": "Mô tả ngắn vấn đề",
    "items": ["Điểm yếu 1", "Điểm yếu 2"]
  },
  "splitRight": {
    "icon": "🚀",
    "title": "Giải pháp mới",
    "body": "Mô tả ngắn giải pháp",
    "items": ["Ưu điểm 1", "Ưu điểm 2"]
  }
}

7. TYPE "text-animation" — slide text thông thường, trung gian
{
  "id": "scene-7", "type": "text-animation", "duration": 5,
  "background": "gradient:#1a1a2e,#16213e",
  "title": { "content": "Nội dung chính", "fontSize": 64, "fontWeight": "bold", "color": "#fff", "align": "center", "animation": "zoomIn" },
  "subtitle": { "content": "Mô tả phụ", "fontSize": 28, "color": "#ffffffcc", "animation": "fadeIn", "animationDelay": 0.3 },
  "body": { "content": "Nội dung chi tiết nếu cần", "fontSize": 22, "color": "#ffffff88", "animation": "fadeIn", "animationDelay": 0.6 }
}

8. TYPE "outro" — màn hình kết thúc, CTA
{
  "id": "scene-last", "type": "outro", "duration": 4,
  "background": "gradient:#0f3460,#1a1a2e",
  "title": { "content": "Kết thúc / CTA mạnh", "fontSize": 64, "fontWeight": "bold", "color": "#fff", "align": "center", "animation": "zoomIn" },
  "subtitle": { "content": "Hành động cụ thể cho viewer", "fontSize": 28, "color": "#ffffffcc", "animation": "fadeIn", "animationDelay": 0.4 }
}

═══════════════════════════════════════════════
HƯỚNG DẪN TẠO VIDEO SPEC:
═══════════════════════════════════════════════

- YouTube 16:9: resolution = "1920x1080", duration = 45-180s, fps = 30
- Social vertical (TikTok/Reels): resolution = "1080x1920", duration = 15-60s
- Social square (Instagram): resolution = "1080x1080", duration = 15-45s
- Tạo 5-10 scenes, đa dạng types — TRÁNH dùng toàn text-animation
- Scene đầu LUÔN là "intro", scene cuối LUÔN là "outro"
- Dùng "bullet-list" khi nội dung là danh sách, tips, tính năng
- Dùng "stat" khi có số liệu, dữ liệu cần nhấn mạnh
- Dùng "quote" cho câu nói ấn tượng, key message
- Dùng "timeline" cho quy trình, các bước tuần tự
- Dùng "split" cho so sánh, đối chiếu
- Màu sắc phải đồng nhất, chuyên nghiệp — accent color nên nổi bật
- Mỗi scene phải có ít nhất title hoặc dữ liệu tương ứng (bullets/stats/steps)
- bullets/stats/steps phải có nội dung thực tế, chi tiết, liên quan đến yêu cầu`;
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
