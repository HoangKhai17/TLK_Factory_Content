# AI Video Factory

Tự động sinh video từ text prompt bằng AI — Gemini tạo kịch bản, BullMQ xếp hàng công việc, ffmpeg render từng scene thành video hoàn chỉnh.

---

## Kiến trúc

```
rendervid-factory/
├── server/
│   ├── index.ts              Express API server (:3001)
│   ├── api/jobs.ts           REST endpoints
│   ├── queue/index.ts        BullMQ + Redis connection
│   ├── worker/index.ts       Worker xử lý render job
│   ├── services/
│   │   ├── ai.ts             Gọi Gemini → sinh VideoSpec JSON
│   │   └── renderer.ts       ffmpeg render từng scene → ghép video
│   └── utils/
│       ├── logger.ts         Logger đơn giản
│       ├── cache.ts          In-memory cache (SHA-256 key)
│       └── store.ts          In-memory job store
├── client/                   React + Vite frontend (:5173)
│   └── src/
│       ├── App.tsx            Dashboard chính
│       ├── components/        CreateJobForm, JobCard
│       ├── hooks/useJobs.ts   Polling jobs mỗi 3 giây
│       └── lib/api.ts         API client
├── shared/types.ts            Shared TypeScript types
├── output/                    Video output (auto-created)
├── docker-compose.yml         Redis
└── .env.example               Mẫu biến môi trường
```

---

## Yêu cầu hệ thống

| Thứ | Version | Kiểm tra |
|-----|---------|----------|
| Node.js | >= 20 | `node -v` |
| npm | >= 10 | `npm -v` |
| Docker | bất kỳ | `docker -v` |
| ffmpeg | bất kỳ | `ffmpeg -version` |
| Google Gemini API Key | — | [aistudio.google.com](https://aistudio.google.com) |

> **Windows**: Cài ffmpeg tại https://ffmpeg.org/download.html → giải nén → thêm thư mục `bin/` vào PATH hệ thống

---

## Cài đặt

### Bước 1 — Clone / mở project

```bash
cd apps/rendervid-factory
```

### Bước 2 — Cài dependencies

```bash
npm install
```

### Bước 3 — Tạo file `.env`

```bash
cp .env.example .env
```

Mở `.env` và điền vào:

```env
PORT=3001
NODE_ENV=development

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

GEMINI_API_KEY=AIza...your_key_here
GEMINI_MODEL=gemini-2.5-pro

OUTPUT_DIR=./output
CLIENT_ORIGIN=http://localhost:5173
```

> Lấy `GEMINI_API_KEY` miễn phí tại: https://aistudio.google.com/app/apikey

### Bước 4 — Khởi động Redis

```bash
docker-compose up -d
```

Kiểm tra Redis đang chạy:

```bash
docker ps
```

---

## Chạy project (Development)

Mở **3 terminal riêng biệt**:

**Terminal 1 — API Server**
```bash
npm run dev:server
# → http://localhost:3001
```

**Terminal 2 — Worker (xử lý render job)**
```bash
npm run dev:worker
# → Lắng nghe job từ queue
```

**Terminal 3 — Frontend**
```bash
npm run dev:client
# → http://localhost:5173
```

Hoặc chạy server + client cùng lúc (vẫn cần terminal riêng cho worker):

```bash
npm run dev          # server + client
npm run dev:worker   # terminal khác
```

---

## Luồng hoạt động

```
User nhập prompt
      ↓
POST /api/jobs → tạo job, đẩy vào BullMQ queue
      ↓
Worker nhận job
      ↓
[1] Gọi Gemini API → sinh VideoSpec JSON (danh sách scenes, màu sắc, font...)
      ↓
[2] normalizeSpec() — làm sạch & validate toàn bộ output AI
      ↓
[3] ffmpeg render từng scene (màu nền + text overlay)
      ↓
[4] ffmpeg concat tất cả scenes → output.mp4
      ↓
[5] Extract thumbnail từ frame 1s
      ↓
Job status → "completed", frontend hiển thị Watch + Download
```

---

## Pipeline AI → FFmpeg (chi tiết)

```
Gemini API  (model: gemini-2.5-pro)
    │
    │  responseMimeType: "application/json"
    │  → bắt buộc model trả về JSON thuần, không có markdown
    ▼
rawSpec  (unknown — chưa tin tưởng)
    │
    ▼  server/services/ai.ts → normalizeSpec()
    │
    ├─ normalizeColor()
    │     #RGB       → #RRGGBB
    │     rgb(r,g,b) → #RRGGBB
    │     0xRRGGBB   → #RRGGBB
    │     "navy"     → #000080  (named colors)
    │     "ffffff"   → #FFFFFF  (thiếu #)
    │     <invalid>  → fallback mặc định
    │
    ├─ normalizeText()
    │     ' ' ' '   → xóa  (curly quotes từ AI)
    │     " " " "   → xóa
    │     — –        → -
    │     …          → ...
    │     <non-ASCII> → space
    │     quá dài    → cắt theo maxLen
    │
    └─ normalizeScene()  (cho từng scene)
          type không hợp lệ  → "text"
          duration ngoài [2,15] → clamp
          duration là string   → parse + clamp
          null / missing scene → bỏ qua
          title thiếu          → "Scene N"
          bullets chứa null/số → lọc bỏ
          tổng duration sai    → tính lại từ scenes
    │
    ▼
VideoSpec  (đảm bảo hợp lệ — renderer có thể dùng trực tiếp)
    │
    ▼  server/services/renderer.ts
    │
    ├─ hexToFfmpeg()      #RRGGBB → 0xRRGGBB  (định dạng màu của ffmpeg)
    │
    └─ sanitizeText()     (lớp bảo vệ thứ 2 trước khi đưa vào filter string)
          '  \ : = [ ] ; ,  → space  (ký tự nguy hiểm cho ffmpeg filter)
          còn lại non-ASCII → space
    │
    ▼
ffmpeg drawtext=text='...' filter
    │
    ▼
output.mp4  ✓
```

### Các lỗi AI model thường gặp — đều được xử lý tự động

| Output sai từ AI | Sau normalizeSpec() |
|---|---|
| `"rgb(58,90,247)"` | `"#3A5AF7"` |
| `"navy"` (named color) | `"#000080"` |
| `"0x06B3ED"` | `"#06B3ED"` |
| `"ffffff"` (thiếu `#`) | `"#FFFFFF"` |
| `"thirty"` cho fps | `30` |
| `"four"` cho duration | `5` (default) |
| `999` cho duration | `15` (clamped) |
| Scene là `null` | bỏ qua, tự sinh id |
| Type `"INVALID_TYPE"` | `"text"` |
| Text chứa `'` `"` `…` `—` | normalize → ASCII |
| Tổng `duration` tính sai | tự tính lại = Σ scene.duration |
| Thiếu trường `title` | `"Scene N"` |
| `bullets` chứa `null`, số... | lọc bỏ non-string |

---

## API Reference

| Method | Endpoint | Body / Params | Mô tả |
|--------|----------|---------------|-------|
| `POST` | `/api/jobs` | `{ prompt, resolution?, duration? }` | Tạo job mới |
| `GET` | `/api/jobs` | — | Danh sách tất cả jobs |
| `GET` | `/api/jobs/:id` | — | Chi tiết 1 job |
| `GET` | `/api/health` | — | Health check |
| `GET` | `/output/:jobId/output.mp4` | — | Stream / download video |

**Tạo job mới — ví dụ:**
```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Giải thích blockchain trong 30 giây",
    "resolution": "1920x1080",
    "duration": 30
  }'
```

**Resolution options:**
| Giá trị | Tỉ lệ | Dùng cho |
|---------|-------|----------|
| `1920x1080` | 16:9 | YouTube, landscape |
| `1280x720` | 16:9 | HD landscape |
| `1080x1920` | 9:16 | Reels, Shorts, TikTok |
| `1080x1080` | 1:1 | Square / Instagram |

---

## Build Production

```bash
npm run build        # build cả client lẫn server
npm start            # chạy server production
npm run start:worker # chạy worker production
```

---

## Troubleshooting

**`ffmpeg: command not found`**
→ Cài ffmpeg và thêm vào PATH. Windows: thêm `C:\ffmpeg\bin` vào System Environment Variables.

**`Redis connection refused`**
→ Chạy `docker-compose up -d` trước, kiểm tra `docker ps`.

**`AI returned invalid JSON`**
→ Gemini model đôi khi trả sai format. Job sẽ tự retry 3 lần. Nếu vẫn lỗi, thử prompt khác hoặc đổi `GEMINI_MODEL=gemini-1.5-pro`.

**Job mãi ở trạng thái `pending`**
→ Worker chưa chạy. Mở terminal mới và chạy `npm run dev:worker`.
