"use client";

import { useState } from "react";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import type { VideoRecord } from "@tlk/shared";

interface VideoCardProps {
  video: VideoRecord;
  onRender: (videoId: string) => void;
  onDelete: (videoId: string) => void;
}

const STATUS_CONFIG = {
  pending: { label: "Chờ render", color: "text-yellow-400", bg: "bg-yellow-400/10", dot: "bg-yellow-400" },
  generating: { label: "Đang tạo spec...", color: "text-blue-400", bg: "bg-blue-400/10", dot: "bg-blue-400 animate-pulse" },
  rendering: { label: "Đang render...", color: "text-indigo-400", bg: "bg-indigo-400/10", dot: "bg-indigo-400 animate-pulse" },
  completed: { label: "Hoàn thành", color: "text-green-400", bg: "bg-green-400/10", dot: "bg-green-400" },
  failed: { label: "Thất bại", color: "text-red-400", bg: "bg-red-400/10", dot: "bg-red-400" },
};

const TYPE_ICONS: Record<string, string> = {
  youtube: "▶",
  social: "◈",
  "text-animation": "T",
  marketing: "◎",
};

export function VideoCard({ video, onRender, onDelete }: VideoCardProps) {
  const [confirming, setConfirming] = useState(false);
  const status = STATUS_CONFIG[video.status];
  const spec = video.spec ? JSON.parse(video.spec) : null;

  return (
    <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all">
      {/* Thumbnail / Preview */}
      <div className="relative bg-linear-to-br from-indigo-900/40 to-purple-900/40 aspect-video">
        {video.thumbnailPath ? (
          <img
            src={video.thumbnailPath}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-4xl text-white/20">
              {TYPE_ICONS[spec?.type ?? "youtube"] ?? "▶"}
            </div>
            {video.status === "rendering" && (
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {/* Resolution badge */}
        {spec?.resolution && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white/70">
            {spec.resolution}
          </div>
        )}
        {/* Duration badge */}
        {video.durationSeconds && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white/80">
            {formatDuration(video.durationSeconds)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
            {video.title}
          </h3>
          <div
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs",
              status.bg,
              status.color
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
            {status.label}
          </div>
        </div>

        <p className="text-xs text-white/40 mb-4 line-clamp-2">{video.prompt}</p>

        {video.errorMessage && (
          <p className="text-xs text-red-400 bg-red-400/10 px-2 py-1.5 rounded-lg mb-3">
            {video.errorMessage}
          </p>
        )}

        <div className="flex items-center gap-2">
          {video.status === "completed" && video.outputPath && (
            <a
              href={video.outputPath}
              download
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải xuống
            </a>
          )}

          {(video.status === "pending" || video.status === "failed") && (
            <button
              onClick={() => onRender(video.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Render
            </button>
          )}

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => { onDelete(video.id); setConfirming(false); }}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-xs"
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 text-xs text-white/30">
        {formatDate(video.createdAt)}
      </div>
    </div>
  );
}
