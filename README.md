# TLK Factory Content

AI-powered video automation platform — tạo video YouTube, Social Media, Text Animation, Marketing tự động qua chat với Gemini AI.

## Cấu trúc dự án

```
TLK_Factory_Content/
├── apps/web/              # Next.js 16 - UI + API
│   ├── src/
│   │   ├── app/           # Pages & API routes
│   │   ├── components/    # UI components
│   │   ├── lib/           # Gemini, DB, Renderer
│   │   ├── remotion/      # Video compositions
│   │   └── store/         # Zustand state
│   └── data/              # SQLite database
├── packages/shared/       # Shared TypeScript types
└── turbo.json
```

## Bắt đầu

### 1. Cài dependencies
```bash
npm install
```

### 2. Cấu hình Gemini API Key
```bash
# Sửa file apps/web/.env.local
GEMINI_API_KEY=your_gemini_api_key_here
```
Lấy key tại: https://aistudio.google.com/apikey

### 3. Chạy development server
```bash
npm run dev
```
Mở http://localhost:3000

## Tính năng

- **Chat AI**: Nhập prompt mô tả video, Gemini tự động tạo Video Spec
- **Projects**: Quản lý video theo project
- **Video Types**: YouTube (16:9), Social (9:16, 1:1), Text Animation, Marketing
- **Render**: Remotion render React components → MP4
- **Download**: Tải video MP4 trực tiếp

## Tech Stack

- **Next.js 16** + Tailwind CSS v4
- **Remotion** - Video rendering engine
- **Google Gemini** - AI generation
- **SQLite** + Drizzle ORM
- **Turborepo** - Monorepo

