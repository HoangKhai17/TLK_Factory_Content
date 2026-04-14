"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { VideoCard } from "@/components/video/VideoCard";
import type { Project, VideoRecord, ChatMessage } from "@tlk/shared";

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
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json() as Promise<ProjectPageData>)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  // Poll video status for rendering videos
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
              ? {
                  ...prev,
                  videos: prev.videos.map((v) =>
                    v.id === vid ? json.video : v
                  ),
                }
              : prev
          );
          if (
            json.video.status === "completed" ||
            json.video.status === "failed"
          ) {
            setPollingIds((prev) => {
              const next = new Set(prev);
              next.delete(vid);
              return next;
            });
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [data?.videos.map((v) => v.id + v.status).join(",")]);

  const handleMessageSent = useCallback(
    (assistantMsg: ChatMessage, videoId: string | null) => {
      setData((prev) => {
        if (!prev) return prev;
        const updatedMessages = [...prev.messages, assistantMsg];
        if (videoId) {
          // The video record will be fetched via polling
          setPollingIds((p) => new Set(p).add(videoId));
          // Refresh videos
          fetch(`/api/projects/${id}`)
            .then((r) => r.json() as Promise<ProjectPageData>)
            .then((d) =>
              setData((curr) =>
                curr ? { ...curr, videos: d.videos } : curr
              )
            );
        }
        return { ...prev, messages: updatedMessages };
      });
      if (videoId) {
        setActiveTab("videos");
        // Switch back to chat after a moment
        setTimeout(() => setActiveTab("chat"), 1500);
      }
    },
    [id]
  );

  async function handleRender(videoId: string) {
    await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            videos: prev.videos.map((v) =>
              v.id === videoId ? { ...v, status: "rendering" as const } : v
            ),
          }
        : prev
    );
    setPollingIds((p) => new Set(p).add(videoId));
  }

  async function handleDeleteVideo(videoId: string) {
    await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
    setData((prev) =>
      prev
        ? { ...prev, videos: prev.videos.filter((v) => v.id !== videoId) }
        : prev
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080810]">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080810]">
        <div className="text-center">
          <p className="text-white/50 mb-4">Project không tồn tại</p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const { project, videos, messages } = data;
  const pendingCount = videos.filter(
    (v) => v.status === "pending" || v.status === "failed"
  ).length;
  const renderingCount = videos.filter(
    (v) => v.status === "rendering" || v.status === "generating"
  ).length;
  const completedCount = videos.filter((v) => v.status === "completed").length;

  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d1a]">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
              TLK
            </div>
            <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
              TLK Factory
            </span>
          </Link>
        </div>

        {/* Project info */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">
              Project hiện tại
            </span>
          </div>
          <h2 className="font-semibold text-white text-sm leading-tight">
            {project.name}
          </h2>
          {project.description && (
            <p className="text-xs text-white/30 mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Video stats */}
        <div className="px-4 py-4 border-b border-white/5 space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
            Video stats
          </p>
          {[
            { label: "Tổng", value: videos.length, color: "text-white/60" },
            { label: "Đã render", value: completedCount, color: "text-green-400" },
            { label: "Đang render", value: renderingCount, color: "text-indigo-400" },
            { label: "Chờ render", value: pendingCount, color: "text-yellow-400" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-xs text-white/40">{stat.label}</span>
              <span className={cn("text-sm font-bold", stat.color)}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav className="px-3 py-3 flex-1">
          {(
            [
              { key: "chat" as TabKey, label: "Chat AI", icon: "💬", badge: null as number | null },
              { key: "videos" as TabKey, label: "Videos", icon: "🎬", badge: renderingCount > 0 ? renderingCount : null },
            ]
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1",
                activeTab === item.key
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <span>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Back to home */}
        <div className="px-3 py-3 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tất cả projects
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 px-6 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-white">{project.name}</h1>
            <div className="px-2 py-0.5 bg-white/5 rounded-lg text-xs text-white/40">
              {activeTab === "chat" ? "Chat AI" : `${videos.length} videos`}
            </div>
          </div>
          {activeTab === "chat" && (
            <p className="text-xs text-white/30">
              Nhập prompt để tạo video tự động với Gemini AI
            </p>
          )}
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <ChatInterface
              projectId={id}
              messages={messages}
              onMessageSent={handleMessageSent}
            />
          )}

          {activeTab === "videos" && (
            <div className="h-full overflow-y-auto px-6 py-6">
              {videos.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">🎬</div>
                  <p className="text-white/40 text-sm">
                    Chưa có video nào. Hãy chat với AI để tạo video đầu tiên!
                  </p>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="mt-4 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm"
                  >
                    Đến Chat AI →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onRender={handleRender}
                      onDelete={handleDeleteVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
