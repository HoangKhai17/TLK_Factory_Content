"use client";

import { useEffect, useState, use, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ModelSwitcher, useActiveModel } from "@/components/chat/ModelSwitcher";
import { VideoCard } from "@/components/video/VideoCard";
import { PROVIDER_MODELS } from "@/lib/ai/types";
import type { Project, VideoRecord, ChatMessage, VideoSpec } from "@tlk/shared";

// Dynamic import — @remotion/player is browser-only
const RemotionPlayer = dynamic(
  () => import("@/components/video/RemotionPlayer").then((m) => m.RemotionPlayer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-40 text-[#94A3B8] text-sm">Đang tải player...</div> }
);

interface ProjectPageData {
  project: Project;
  videos: VideoRecord[];
  messages: ChatMessage[];
}

type TabKey = "chat" | "videos";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ProjectPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [activeModel, setActiveModel] = useActiveModel();
  const [previewSpec, setPreviewSpec] = useState<VideoSpec | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json() as Promise<ProjectPageData>)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  // Poll rendering videos
  useEffect(() => {
    if (!data) return;
    const renderingIds = data.videos
      .filter((v) => v.status === "rendering" || v.status === "generating")
      .map((v) => v.id);
    if (renderingIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const vid of renderingIds) {
        const res = await fetch(`/api/videos/${vid}`);
        const json = await res.json() as { video: VideoRecord };
        if (json.video) {
          setData((prev) =>
            prev
              ? { ...prev, videos: prev.videos.map((v) => (v.id === vid ? json.video : v)) }
              : prev
          );
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.videos.map((v) => v.id + v.status).join(",")]);

  const handleMessageSent = useCallback(
    (userMsg: ChatMessage | null, assistantMsg: ChatMessage | null, videoId: string | null) => {
      setData((prev) => {
        if (!prev) return prev;
        const toAdd = [userMsg, assistantMsg].filter(Boolean) as ChatMessage[];
        if (videoId) {
          fetch(`/api/projects/${id}`)
            .then((r) => r.json() as Promise<ProjectPageData>)
            .then((d) => setData((curr) => (curr ? { ...curr, videos: d.videos } : curr)));
        }
        const existing = prev.messages.filter(
          (m) => !toAdd.some((a) => a.id === m.id)
        );
        return { ...prev, messages: [...existing, ...toAdd] };
      });
    },
    [id]
  );

  const handleClearChat = useCallback(async () => {
    await fetch(`/api/chat?projectId=${id}`, { method: "DELETE" });
    setData((prev) => prev ? { ...prev, messages: [] } : prev);
  }, [id]);

  async function handleRender(videoId: string) {
    await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    setData((prev) =>
      prev
        ? { ...prev, videos: prev.videos.map((v) => (v.id === videoId ? { ...v, status: "rendering" as const } : v)) }
        : prev
    );
  }

  async function handleDeleteVideo(videoId: string) {
    const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
    if (res.ok) {
      setData((prev) =>
        prev ? { ...prev, videos: prev.videos.filter((v) => v.id !== videoId) } : prev
      );
    }
  }

  // Resolve current model label for display
  const modelLabel = activeModel
    ? (PROVIDER_MODELS[activeModel.provider]?.find((m) => m.id === activeModel.model)?.name ?? activeModel.model)
    : null;

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFF]">
        <div className="flex flex-col items-center gap-4">
          <Image src="/logotlk.png" alt="TLK" width={48} height={48} className="animate-pulse" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#3A5AF7] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFF]">
        <div className="text-center">
          <p className="text-[#94A3B8] mb-4">Project không tồn tại</p>
          <Link href="/" className="text-[#3A5AF7] hover:text-[#2D47D4] font-medium">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const { project, videos, messages } = data;
  const pendingCount = videos.filter((v) => v.status === "pending" || v.status === "failed").length;
  const renderingCount = videos.filter((v) => v.status === "rendering" || v.status === "generating").length;
  const completedCount = videos.filter((v) => v.status === "completed").length;

  return (
    <div className="flex h-screen bg-[#F8FAFF] overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col bg-white border-r border-[#E2E8F0]">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#F1F5F9]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logotlk.png" alt="TLK" width={32} height={32} className="rounded-lg object-contain" />
            <div>
              <span className="font-bold text-[#0F172A] text-sm block leading-none">TLK Factory</span>
              <span className="text-xs text-[#94A3B8] leading-none">Content Platform</span>
            </div>
          </Link>
        </div>

        {/* Current project */}
        <div className="px-5 py-4 border-b border-[#F1F5F9]">
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-semibold mb-2">Project hiện tại</p>
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#3A5AF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#0F172A] text-sm leading-tight truncate">{project.name}</p>
              {project.description && (
                <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-2">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Video stats */}
        <div className="px-5 py-4 border-b border-[#F1F5F9]">
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-semibold mb-3">Thống kê Video</p>
          <div className="space-y-2.5">
            {[
              { label: "Tổng cộng",   value: videos.length,   color: "text-[#3A5AF7]",  bg: "bg-[#EEF2FF]" },
              { label: "Hoàn thành",  value: completedCount,  color: "text-[#10B981]",  bg: "bg-[#ECFDF5]" },
              { label: "Đang render", value: renderingCount,  color: "text-[#06B3ED]",  bg: "bg-[#E0F7FD]" },
              { label: "Chờ render",  value: pendingCount,    color: "text-[#F59E0B]",  bg: "bg-[#FFFBEB]" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-xs text-[#64748B]">{stat.label}</span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", stat.color, stat.bg)}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-3 flex-1">
          {[
            {
              key: "chat" as TabKey,
              label: "Chat AI",
              badge: null as number | null,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
            },
            {
              key: "videos" as TabKey,
              label: "Videos",
              badge: renderingCount > 0 ? renderingCount : null,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 font-medium",
                activeTab === item.key
                  ? "bg-[#EEF2FF] text-[#3A5AF7]"
                  : "text-[#64748B] hover:bg-[#F8FAFF] hover:text-[#0F172A]"
              )}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 rounded-full tlk-gradient text-white text-[10px] flex items-center justify-center animate-pulse font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Back + Copyright */}
        <div className="border-t border-[#F1F5F9]">
          <div className="px-3 py-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-[#3A5AF7] hover:bg-[#EEF2FF] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tất cả projects
            </Link>
          </div>
          <div className="px-5 py-3">
            <p className="text-[10px] text-[#CBD5E1] leading-relaxed">
              © {new Date().getFullYear()}{" "}
              <span className="tlk-gradient-text font-semibold">Nguyễn Hoàng Khải</span>
            </p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top header bar */}
        <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-semibold text-[#0F172A] text-[15px] truncate">{project.name}</h1>
            <span className="shrink-0 px-2.5 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded-lg text-xs font-medium">
              {activeTab === "chat" ? "💬 Chat AI" : `🎬 ${videos.length} videos`}
            </span>
          </div>

          {/* Right: model switcher + status */}
          <div className="flex items-center gap-3 shrink-0">
            {activeTab === "chat" && (
              <ModelSwitcher
                value={activeModel}
                onChange={setActiveModel}
              />
            )}
            {activeTab === "videos" && pendingCount > 0 && (
              <span className="text-xs text-[#F59E0B] bg-[#FFFBEB] px-2.5 py-1 rounded-lg font-medium">
                {pendingCount} chờ render
              </span>
            )}
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <ChatInterface
              projectId={id}
              messages={messages}
              onMessageSent={handleMessageSent}
              onClearChat={handleClearChat}
              provider={activeModel?.provider}
              model={activeModel?.model}
              modelLabel={modelLabel ?? undefined}
            />
          )}

          {activeTab === "videos" && (
            <div className="h-full overflow-y-auto px-6 py-6">
              {videos.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#EEF2FF] rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#3A5AF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                  <p className="text-[#64748B] text-sm font-medium mb-1">Chưa có video nào</p>
                  <p className="text-[#94A3B8] text-xs mb-5">Hãy chat với AI để tạo video đầu tiên!</p>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium tlk-gradient text-white hover:opacity-90 transition-opacity"
                  >
                    Đến Chat AI →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-[#0F172A] text-sm">
                      {videos.length} video{videos.length > 1 ? "s" : ""}
                    </h2>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="text-xs text-[#3A5AF7] hover:text-[#2D47D4] font-medium flex items-center gap-1"
                    >
                      + Tạo video mới
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onRender={handleRender}
                        onDelete={handleDeleteVideo}
                        onPreview={video.spec ? () => {
                          try {
                            setPreviewSpec(JSON.parse(video.spec!) as VideoSpec);
                            setPreviewTitle(video.title);
                          } catch { /* ignore parse error */ }
                        } : undefined}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── PREVIEW MODAL ───────────────────────────────────── */}
      {previewSpec && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewSpec(null)}
        >
          <div
            className="relative bg-[#0F172A] rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-base">🎬</span>
                <span className="text-sm font-medium text-white truncate max-w-xs">{previewTitle}</span>
                <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">Preview</span>
              </div>
              <button
                onClick={() => setPreviewSpec(null)}
                className="text-white/50 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>
            {/* Player */}
            <div className="p-4">
              <RemotionPlayer spec={previewSpec} controls loop />
            </div>
            <div className="px-5 pb-4 text-xs text-white/30 text-center">
              Preview real-time — chưa render MP4. Nhấn nút Render để xuất file.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
