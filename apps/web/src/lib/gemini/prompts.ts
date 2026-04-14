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

Hãy phân tích yêu cầu và tạo một video spec JSON hoàn chỉnh.
Trả về CHÍNH XÁC một JSON object (không có markdown, không có giải thích thêm) theo schema sau:

{
  "type": "youtube" | "social" | "text-animation" | "marketing",
  "title": "Tiêu đề video",
  "duration": <số giây, ví dụ: 30, 60, 120>,
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
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro" | "text-animation" | "image" | "split-screen" | "outro",
      "duration": <giây>,
      "background": "#HEX hoặc gradient:from,to",
      "title": {
        "content": "Nội dung",
        "fontSize": 72,
        "fontWeight": "bold",
        "color": "#HEX",
        "align": "center",
        "animation": "fadeIn" | "slideInLeft" | "slideInRight" | "slideInUp" | "slideInDown" | "zoomIn" | "typewriter",
        "animationDelay": 0
      },
      "subtitle": { ... giống title ... },
      "body": { ... giống title, fontSize nhỏ hơn ... }
    }
  ],
  "audio": {
    "backgroundMusic": "upbeat" | "calm" | "dramatic" | "corporate" | "none"
  }
}

Hướng dẫn:
- YouTube 16:9: resolution = "1920x1080", duration = 60-300s
- Social vertical (TikTok/Reels): resolution = "1080x1920", duration = 15-60s
- Social square: resolution = "1080x1080", duration = 15-30s
- Tạo 3-8 scenes tùy độ dài video
- Màu sắc phải đồng bộ và chuyên nghiệp
- Mỗi scene phải có ít nhất title
- Scene đầu tiên luôn là "intro", scene cuối là "outro"`;
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
