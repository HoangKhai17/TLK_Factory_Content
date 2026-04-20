# AI Video Factory (Rendervid)

Standalone AI video generation pipeline: Gemini generates a VideoSpec, BullMQ queues the render job, ffmpeg renders scene-by-scene.

## Stack

- **Backend**: Express + TypeScript
- **Queue**: BullMQ + Redis
- **AI**: Google Gemini (`gemini-1.5-flash`)
- **Renderer**: fluent-ffmpeg (ffmpeg must be on PATH)
- **Frontend**: React + Vite

## Setup

```bash
# 1. Install dependencies
cd apps/rendervid-factory
npm install

# 2. Copy env
cp .env.example .env
# → set GEMINI_API_KEY

# 3. Start Redis (Docker)
docker-compose up -d

# 4. Start server + frontend (dev)
npm run dev

# 5. In a separate terminal, start the worker
npm run dev:worker
```

## Run order

| Terminal | Command | What it does |
|----------|---------|--------------|
| 1 | `npm run dev:server` | Express API on :3001 |
| 2 | `npm run dev:worker` | BullMQ worker (processes jobs) |
| 3 | `npm run dev:client` | Vite React UI on :5173 |

Or use `npm run dev` to run server + client together (worker needs separate terminal).

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jobs` | Create a new video job |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/:id` | Get a specific job |
| GET | `/output/:jobId/output.mp4` | Download rendered video |

## Requirements

- Node 20+
- Redis 7+
- ffmpeg installed and on PATH (`ffmpeg -version` should work)
- Google Gemini API key
