"use client";

import { useState } from "react";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import type { VideoRecord } from "@tlk/shared";
import { VideoPreviewModal } from "./VideoPreviewModal";

interface VideoCardProps {
  video: VideoRecord;
  onRender: (videoId: string) => void;
  onDelete: (videoId: string) => void;
}

const STATUS_CONFIG = {
  pending: {
    label: "Chờ render",
    color: "text-[#D97706]",
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#F59E0B]",
  },
  generating: {
    label: "Đang tạo spec...",
    color: "text-[#2563EB]",
    bg: "bg-[#EFF6FF]",
    dot: "bg-[#3B82F6] animate-pulse",
  },
  rendering: {
    label: "Đang render...",
    color: "text-[#3A5AF7]",
    bg: "bg-[#EEF2FF]",
    dot: "bg-[#3A5AF7] animate-pulse",
  },
  completed: {
    label: "Hoàn thành",
    color: "text-[#059669]",
    bg: "bg-[#ECFDF5]",
    dot: "bg-[#10B981]",
  },
  failed: {
    label: "Thất bại",
    color: "text-[#DC2626]",
    bg: "bg-[#FEF2F2]",
    dot: "bg-[#EF4444]",
  },
};

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  youtube: { label: "YouTube", color: "text-[#DC2626]", bg: "bg-[#FEF2F2]" },
  social: { label: "Social", color: "text-[#7C3AED]", bg: "bg-[#F5F3FF]" },
  "text-animation": { label: "Text Anim", color: "text-[#0369A1]", bg: "bg-[#F0F9FF]" },
  marketing: { label: "Marketing", color: "text-[#059669]", bg: "bg-[#ECFDF5]" },
};

export function VideoCard({ video, onRender, onDelete }: VideoCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const status = STATUS_CONFIG[video.status];
  const spec = video.spec ? (JSON.parse(video.spec) as { type?: string; resolution?: string }) : null;
  const typeInfo = spec?.type ? (TYPE_LABELS[spec.type] ?? TYPE_LABELS.youtube) : null;
  const isCompleted = video.status === "completed" && !!video.outputPath;

  return (
    <>
      <div className="group bg-white border border-[#E2E8F0] hover:border-[#3A5AF7]/30 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:shadow-[#3A5AF7]/5">

        {/* Thumbnail — clickable to preview when completed */}
        <div
          className={cn(
            "relative bg-[#F0F4FF] aspect-video overflow-hidden",
            isCompleted && "cursor-pointer"
          )}
          onClick={() => isCompleted && setShowPreview(true)}
        >
          {video.thumbnailPath ? (
            <img src={video.thumbnailPath} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl tlk-gradient opacity-20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              {video.status === "rendering" && (
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3A5AF7] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Play overlay — hover on completed videos */}
          {isCompleted && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200">
                <svg className="w-6 h-6 text-[#3A5AF7] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* Badges */}
          {spec?.resolution && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs text-[#475569] font-medium shadow-sm">
              {spec.resolution}
            </div>
          )}
          {video.durationSeconds && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
              {formatDuration(video.durationSeconds)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-[#0F172A] text-sm leading-tight line-clamp-2 flex-1">
              {video.title}
            </h3>
            <div className={cn("shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", status.bg, status.color)}>
              <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
              {status.label}
            </div>
          </div>

          {/* Type badge */}
          {typeInfo && (
            <span className={cn("inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mb-2", typeInfo.bg, typeInfo.color)}>
              {typeInfo.label}
            </span>
          )}

          <p className="text-xs text-[#94A3B8] mb-4 line-clamp-2">{video.prompt}</p>

          {/* Error */}
          {video.status === "failed" && video.errorMessage && (
            <div className="mb-3 px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
              {video.errorMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9]">

            {/* Completed: Preview + Download */}
            {isCompleted && (
              <>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 tlk-gradient text-white rounded-xl text-xs font-medium hover:opacity-90 transition-opacity shadow-sm shadow-[#3A5AF7]/20"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Preview
                </button>
                <a
                  href={video.outputPath!}
                  download
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8FAFF] hover:bg-[#EEF2FF] border border-[#E2E8F0] rounded-xl text-[#3A5AF7] text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải
                </a>
              </>
            )}

            {/* Pending / Failed: Render button */}
            {(video.status === "pending" || video.status === "failed") && (
              <button
                onClick={() => onRender(video.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 tlk-gradient text-white rounded-xl text-xs font-medium transition-opacity hover:opacity-90 shadow-sm shadow-[#3A5AF7]/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Render
              </button>
            )}

            {/* Rendering spinner */}
            {video.status === "rendering" && (
              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#EEF2FF] rounded-xl text-[#3A5AF7] text-xs font-medium">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang xử lý...
              </div>
            )}

            {/* Delete */}
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="p-2 text-[#CBD5E1] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => { onDelete(video.id); setConfirming(false); }}
                  className="px-2.5 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] rounded-lg text-white text-xs font-medium"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-2.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg text-[#64748B] text-xs font-medium"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date footer */}
        <div className="px-4 pb-3 text-[11px] text-[#CBD5E1]">
          {formatDate(video.createdAt)}
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && isCompleted && (
        <VideoPreviewModal
          src={video.outputPath!}
          title={video.title}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
