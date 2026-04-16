"use client";

import { useEffect, useRef } from "react";

interface VideoPreviewModalProps {
  src: string;
  title: string;
  onClose: () => void;
}

export function VideoPreviewModal({ src, title, onClose }: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play when opened
  useEffect(() => {
    videoRef.current?.play().catch(() => {/* autoplay blocked — user interaction needed */});
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        className="relative z-10 w-full max-w-5xl mx-4 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 bg-[#0a0a0f]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#111118] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#3A5AF7]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#3A5AF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/80 truncate max-w-xs">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download button */}
            <a
              href={src}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 hover:text-white text-xs font-medium transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải xuống
            </a>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video player */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={src}
            controls
            controlsList="nodownload"
            playsInline
            className="w-full max-h-[75vh] object-contain"
            style={{ display: "block" }}
          />
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 bg-[#111118] border-t border-white/8 flex items-center justify-between">
          <span className="text-[11px] text-white/30">Nhấn Esc hoặc click bên ngoài để đóng</span>
          <span className="text-[11px] text-white/30">TLK Factory</span>
        </div>
      </div>
    </div>
  );
}
