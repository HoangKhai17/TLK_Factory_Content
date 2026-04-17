"use client";

import { useEffect, useState, use, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { VIDEO_ANIMATION_TYPES } from "@/lib/ai/codegenSystemPrompt";
import type { VideoAnimationType } from "@/lib/ai/codegenSystemPrompt";
import type { ScriptRow, ScriptSceneRow } from "@/lib/db/schema";

type ScriptStatus = "draft" | "script-ready" | "prompts-ready" | "rendering" | "completed";
type SectionType = "hook" | "intro" | "content" | "cta" | "outro";
type VideoMode = "animation" | "slideshow";

const SECTION_META: Record<SectionType, { label: string; color: string; bg: string; emoji: string }> = {
  hook:    { label: "Hook",    color: "text-[#EF4444]", bg: "bg-[#FEF2F2]", emoji: "🎯" },
  intro:   { label: "Intro",   color: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", emoji: "👋" },
  content: { label: "Content", color: "text-[#3B82F6]", bg: "bg-[#EFF6FF]", emoji: "📖" },
  cta:     { label: "CTA",     color: "text-[#10B981]", bg: "bg-[#ECFDF5]", emoji: "📣" },
  outro:   { label: "Outro",   color: "text-[#8B5CF6]", bg: "bg-[#F5F3FF]", emoji: "🎬" },
};

const RENDER_STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "Chờ",         color: "text-[#94A3B8]", dot: "bg-[#E2E8F0]" },
  queued:    { label: "Xếp hàng",    color: "text-[#F59E0B]", dot: "bg-[#F59E0B]" },
  rendering: { label: "Đang render", color: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  completed: { label: "Xong",        color: "text-[#10B981]", dot: "bg-[#10B981]" },
  failed:    { label: "Thất bại",    color: "text-[#EF4444]", dot: "bg-[#EF4444]" },
};

const STEP_MAP: Record<ScriptStatus, number> = {
  draft: 0,
  "script-ready": 1,
  "prompts-ready": 2,
  rendering: 3,
  completed: 3,
};

// ── Step indicator ─────────────────────────────────────────────
function StepBar({ status }: { status: ScriptStatus }) {
  const current = STEP_MAP[status];
  const steps = ["Ý tưởng", "Kịch bản", "Scene Prompts", "Render"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all",
              i < current ? "bg-[#10B981] text-white" :
              i === current ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30" :
              "bg-[#E2E8F0] text-[#94A3B8]"
            )}>
              {i < current ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={cn("text-[11px] font-medium whitespace-nowrap",
              i === current ? "text-[#3B82F6]" : i < current ? "text-[#10B981]" : "text-[#94A3B8]"
            )}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("h-0.5 w-12 mx-1 mb-4 transition-colors", i < current ? "bg-[#10B981]" : "bg-[#E2E8F0]")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Animation type mini selector ───────────────────────────────
function AnimTypePicker({
  value,
  onChange,
  compact = false,
}: {
  value: string | null;
  onChange: (t: VideoAnimationType) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const typeInfo = value ? VIDEO_ANIMATION_TYPES[value as VideoAnimationType] : null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border transition-all text-xs font-semibold",
          compact ? "px-2 py-1" : "px-2.5 py-1.5",
          typeInfo
            ? "border-transparent text-white"
            : "border-[#E2E8F0] bg-white text-[#94A3B8] hover:border-[#CBD5E1]"
        )}
        style={typeInfo ? { backgroundColor: typeInfo.color } : {}}
      >
        {typeInfo ? (
          <><span>{typeInfo.icon}</span><span className={compact ? "hidden" : ""}>{typeInfo.label}</span></>
        ) : (
          <><span>?</span><span className={compact ? "hidden" : ""}>Chọn loại</span></>
        )}
        <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-30 min-w-[200px] overflow-hidden">
          {(Object.keys(VIDEO_ANIMATION_TYPES) as VideoAnimationType[]).map((type) => {
            const info = VIDEO_ANIMATION_TYPES[type];
            const isSelected = value === type;
            return (
              <button
                key={type}
                onClick={() => { onChange(type); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                  isSelected ? "bg-[#EEF2FF] font-semibold" : "hover:bg-[#F8FAFF]"
                )}
              >
                <span className="text-base shrink-0">{info.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-[#0F172A] leading-tight">{info.label}</p>
                  <p className="text-[10px] text-[#94A3B8] leading-tight truncate">{info.description}</p>
                </div>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Scene Card ─────────────────────────────────────────────────
function SceneCard({
  scene, index, showPrompt, editMode,
  onUpdateContent, onUpdatePrompt, onUpdateAnimType,
  onReRender,
}: {
  scene: ScriptSceneRow;
  index: number;
  showPrompt: boolean;
  editMode: boolean;
  onUpdateContent?: (id: string, val: string) => void;
  onUpdatePrompt?: (id: string, val: string) => void;
  onUpdateAnimType?: (id: string, t: VideoAnimationType) => void;
  onReRender?: (videoId: string) => void;
}) {
  const meta = SECTION_META[scene.sectionType as SectionType] ?? SECTION_META.content!;
  const [editContent, setEditContent] = useState(scene.content ?? "");
  const [editPrompt, setEditPrompt] = useState(scene.videoPrompt ?? "");
  const [savedContent, setSavedContent] = useState(false);
  const [savedPrompt, setSavedPrompt] = useState(false);
  const renderMeta = RENDER_STATUS_META[scene.renderStatus] ?? RENDER_STATUS_META.pending!;
  const isRendering = scene.renderStatus === "rendering" || scene.renderStatus === "queued";
  const isFailed = scene.renderStatus === "failed";

  // Sync when scene changes (e.g., after AI regenerates)
  useEffect(() => { setEditContent(scene.content ?? ""); }, [scene.content]);
  useEffect(() => { setEditPrompt(scene.videoPrompt ?? ""); }, [scene.videoPrompt]);

  async function saveContent() {
    onUpdateContent?.(scene.id, editContent);
    setSavedContent(true);
    setTimeout(() => setSavedContent(false), 1500);
  }
  async function savePrompt() {
    onUpdatePrompt?.(scene.id, editPrompt);
    setSavedPrompt(true);
    setTimeout(() => setSavedPrompt(false), 1500);
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all",
      isFailed ? "border-[#FECACA]" : "border-[#E2E8F0]"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#F1F5F9]">
        <span className="text-[11px] font-bold text-[#94A3B8] shrink-0">#{index + 1}</span>
        <span className={cn("shrink-0 text-xs font-bold px-2 py-0.5 rounded-full", meta.bg, meta.color)}>
          {meta.emoji} {meta.label}
        </span>
        <span className="flex-1 font-semibold text-[#0F172A] text-[13px] truncate">{scene.title}</span>
        <span className="shrink-0 text-[11px] text-[#94A3B8]">{scene.duration}s</span>

        {/* Render status */}
        {scene.renderStatus !== "pending" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={cn("w-1.5 h-1.5 rounded-full", renderMeta.dot, isRendering && "animate-pulse")} />
            <span className={cn("text-[11px] font-semibold", renderMeta.color)}>
              {renderMeta.label}
            </span>
            {isFailed && onReRender && scene.videoId && (
              <button
                onClick={() => onReRender(scene.videoId!)}
                className="ml-1 px-2 py-0.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[10px] font-semibold transition-colors border border-[#FECACA]"
              >
                Render lại
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Script content */}
        <div>
          <p className="text-[11.5px] font-semibold text-[#475569] mb-1.5">Nội dung kịch bản</p>
          {editMode ? (
            <div className="space-y-1.5">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[12.5px] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 resize-none transition-all"
              />
              <button
                onClick={saveContent}
                className={cn(
                  "text-[11.5px] font-semibold transition-colors",
                  savedContent ? "text-[#10B981]" : "text-[#3B82F6] hover:text-[#2563EB]"
                )}
              >
                {savedContent ? "✓ Đã lưu" : "Lưu thay đổi"}
              </button>
            </div>
          ) : (
            <p className="text-[12.5px] text-[#475569] leading-relaxed whitespace-pre-wrap">{scene.content ?? "(Chưa có nội dung)"}</p>
          )}
        </div>

        {/* Visual notes */}
        {scene.visualNotes && (
          <div>
            <p className="text-[11.5px] font-semibold text-[#475569] mb-1">Gợi ý visual</p>
            <p className="text-[12px] text-[#64748B] italic leading-relaxed">{scene.visualNotes}</p>
          </div>
        )}

        {/* Video prompt + animation type */}
        {showPrompt && (
          <div className="pt-3 border-t border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11.5px] font-semibold text-[#8B5CF6] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Video Prompt
              </p>
              {/* Animation type picker */}
              <AnimTypePicker
                value={scene.animationType}
                onChange={(t) => onUpdateAnimType?.(scene.id, t)}
                compact={!editMode}
              />
            </div>

            {editMode ? (
              <div className="space-y-1.5">
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[12.5px] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 resize-none font-mono transition-all"
                />
                <button
                  onClick={savePrompt}
                  className={cn(
                    "text-[11.5px] font-semibold transition-colors",
                    savedPrompt ? "text-[#10B981]" : "text-[#8B5CF6] hover:text-[#7C3AED]"
                  )}
                >
                  {savedPrompt ? "✓ Đã lưu prompt" : "Lưu prompt"}
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-[#6D28D9] bg-[#F5F3FF] px-3 py-2.5 rounded-xl leading-relaxed font-mono">
                {scene.videoPrompt ?? "(Chưa có prompt)"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────
function Spinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
export default function StudioWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [script, setScript] = useState<ScriptRow | null>(null);
  const [scenes, setScenes] = useState<ScriptSceneRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Input state
  const [ideaText, setIdeaText] = useState("");
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([""]);
  const [videoMode, setVideoMode] = useState<VideoMode>("animation");

  // Action state
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [batchRendering, setBatchRendering] = useState(false);
  const [error, setError] = useState("");

  // Edit toggle: per step
  const [editModeScript, setEditModeScript] = useState(false);
  const [editModePrompts, setEditModePrompts] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/studio/scripts/${id}`);
    if (!res.ok) { router.push("/studio"); return; }
    const d = await res.json() as { script: ScriptRow; scenes: ScriptSceneRow[] };
    setScript(d.script);
    setScenes(d.scenes);
    setIdeaText(d.script.ideaText ?? "");
    setVideoMode((d.script.videoMode as VideoMode) ?? "animation");
    const urls = d.script.youtubeUrls ? JSON.parse(d.script.youtubeUrls) as string[] : [""];
    setYoutubeUrls(urls.length > 0 ? urls : [""]);
  }, [id, router]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Poll rendering progress
  useEffect(() => {
    if (script?.status !== "rendering") return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [script?.status, fetchData]);

  // Persist video mode change
  async function handleVideoModeChange(mode: VideoMode) {
    setVideoMode(mode);
    await fetch(`/api/studio/scripts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoMode: mode }),
    });
  }

  async function handleGenerateScript() {
    setError("");
    if (!ideaText.trim()) { setError("Vui lòng nhập ý tưởng video"); return; }
    setGeneratingScript(true);
    try {
      const urls = youtubeUrls.filter((u) => u.trim());
      const res = await fetch(`/api/studio/scripts/${id}/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaText: ideaText.trim(), youtubeUrls: urls }),
      });
      const d = await res.json() as { script?: ScriptRow; scenes?: ScriptSceneRow[]; error?: string };
      if (!res.ok) { setError(d.error ?? "Lỗi generate script"); return; }
      setScript(d.script!);
      setScenes(d.scenes!);
    } finally {
      setGeneratingScript(false);
    }
  }

  async function handleGeneratePrompts() {
    setError("");
    setGeneratingPrompts(true);
    try {
      const res = await fetch(`/api/studio/scripts/${id}/generate-prompts`, { method: "POST" });
      const d = await res.json() as { script?: ScriptRow; scenes?: ScriptSceneRow[]; error?: string };
      if (!res.ok) { setError(d.error ?? "Lỗi generate prompts"); return; }
      setScript(d.script!);
      setScenes(d.scenes!);
    } finally {
      setGeneratingPrompts(false);
    }
  }

  async function handleBatchRender() {
    setError("");
    setBatchRendering(true);
    try {
      const res = await fetch(`/api/studio/scripts/${id}/batch-render`, { method: "POST" });
      const d = await res.json() as { projectId?: string; error?: string };
      if (!res.ok) { setError(d.error ?? "Lỗi batch render"); setBatchRendering(false); return; }
      await fetchData();
    } catch {
      setError("Lỗi kết nối server");
      setBatchRendering(false);
    }
  }

  async function updateScene(sceneId: string, field: "content" | "videoPrompt" | "animationType", value: string) {
    setScenes((prev) =>
      prev.map((s) => s.id === sceneId ? { ...s, [field]: value } : s)
    );
    await fetch(`/api/studio/scenes/${sceneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function handleReRender(videoId: string) {
    // Reset scene render status optimistically
    setScenes((prev) =>
      prev.map((s) => s.videoId === videoId ? { ...s, renderStatus: "queued" as const } : s)
    );
    await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!script) return null;

  const status = script.status as ScriptStatus;
  const completedScenes = scenes.filter((s) => s.renderStatus === "completed").length;
  const failedScenes = scenes.filter((s) => s.renderStatus === "failed").length;
  const renderingScenes = scenes.filter((s) => s.renderStatus === "rendering" || s.renderStatus === "queued").length;
  const totalDuration = scenes.reduce((a, s) => a + s.duration, 0);

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/studio" className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] font-medium transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Script Studio
          </Link>
          <span className="text-[#E2E8F0]">/</span>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Image src="/logotlk.png" alt="" width={20} height={20} style={{ width: 20, height: "auto" }} className="shrink-0" />
            <span className="font-bold text-[14px] text-[#0F172A] truncate">{script.title}</span>
          </div>
          {/* Mode badge */}
          <div className={cn(
            "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold",
            videoMode === "animation" ? "bg-[#EEF2FF] text-[#3B82F6]" : "bg-[#F1F5F9] text-[#94A3B8]"
          )}>
            {videoMode === "animation" ? "🎬 Animation" : "🖼 Ảnh động"}
          </div>
          {script.projectId && (
            <Link
              href={`/projects/${script.projectId}`}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#3B82F6] text-[12px] font-semibold hover:bg-[#DBEAFE] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Xem Project
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step indicator */}
        <StepBar status={status} />

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 text-[13px] text-[#DC2626]">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="text-[#DC2626] hover:text-[#991B1B]">✕</button>
          </div>
        )}

        {/* ══ STEP 1: IDEA INPUT ═══════════════════════════════════ */}
        {(status === "draft" || status === "script-ready") && (
          <div className="space-y-6">
            {/* Video Mode Selector */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <h2 className="font-bold text-[15px] text-[#0F172A] mb-1">Chọn loại video</h2>
              <p className="text-[12px] text-[#64748B] mb-4">Chọn định dạng video bạn muốn tạo</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Animation mode */}
                <button
                  onClick={() => handleVideoModeChange("animation")}
                  className={cn(
                    "flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all",
                    videoMode === "animation"
                      ? "border-[#3B82F6] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🎬</span>
                    {videoMode === "animation" && (
                      <div className="w-5 h-5 rounded-full bg-[#3B82F6] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={cn("text-[13px] font-bold", videoMode === "animation" ? "text-[#3B82F6]" : "text-[#0F172A]")}>
                      Video Animation
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                      AI tạo code Remotion — motion graphics, kinetic typography, infographic...
                    </p>
                  </div>
                </button>

                {/* Slideshow mode (coming soon) */}
                <div className="flex flex-col gap-2 p-4 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFF] opacity-60 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🖼</span>
                    <span className="text-[10px] font-bold text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sắp có
                    </span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#94A3B8]">Ảnh Động (Slideshow)</p>
                    <p className="text-[11px] text-[#CBD5E1] mt-0.5 leading-relaxed">
                      Ghép ảnh + text thành video slideshow — đang phát triển
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Idea input */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7">
              <h2 className="font-bold text-[16px] text-[#0F172A] mb-1">Bước 1 — Ý tưởng video</h2>
              <p className="text-[12.5px] text-[#64748B] mb-5">Mô tả ý tưởng của bạn. AI sẽ phân tích và viết kịch bản hoàn chỉnh, sau đó đề xuất loại animation phù hợp cho từng scene.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Ý tưởng / Chủ đề video</label>
                  <textarea
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="Ví dụ: Làm video YouTube về 5 tips tăng năng suất làm việc cho developer, phong cách hiện đại tối giản, nhắm đến lập trình viên 22-30 tuổi..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[13px] placeholder-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 resize-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">
                    Link YouTube tham khảo
                    <span className="text-[#94A3B8] font-normal ml-1">(tuỳ chọn — AI sẽ phân tích phong cách)</span>
                  </label>
                  <div className="space-y-2">
                    {youtubeUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            const next = [...youtubeUrls];
                            next[i] = e.target.value;
                            setYoutubeUrls(next);
                          }}
                          placeholder="https://youtube.com/watch?v=..."
                          className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[13px] placeholder-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
                        />
                        {youtubeUrls.length > 1 && (
                          <button
                            onClick={() => setYoutubeUrls((prev) => prev.filter((_, j) => j !== i))}
                            className="w-10 flex items-center justify-center text-[#CBD5E1] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors border border-[#E2E8F0]"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setYoutubeUrls((prev) => [...prev, ""])}
                      className="flex items-center gap-1.5 text-[12.5px] text-[#3B82F6] hover:text-[#2563EB] font-semibold"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm link YouTube
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleGenerateScript}
                    disabled={generatingScript}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-[14px] tlk-gradient hover:opacity-90 transition-opacity shadow-md shadow-[#3B82F6]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {generatingScript ? <Spinner label="AI đang viết kịch bản..." /> : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {status === "script-ready" ? "Viết lại kịch bản" : "Generate Script với AI"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── STEP 2: Script scenes ──────────────────────────── */}
            {status === "script-ready" && scenes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div>
                    <h2 className="font-bold text-[16px] text-[#0F172A]">
                      Bước 2 — Kịch bản
                    </h2>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      {scenes.length} scenes · ~{totalDuration}s tổng · AI đề xuất animation cho từng scene ở bước sau
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Edit toggle */}
                    <button
                      onClick={() => setEditModeScript((v) => !v)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-semibold transition-all",
                        editModeScript
                          ? "border-[#F59E0B] bg-[#FFFBEB] text-[#F59E0B]"
                          : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]"
                      )}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {editModeScript ? "Đang sửa" : "Chỉnh sửa"}
                    </button>
                    {/* Next step */}
                    <button
                      onClick={handleGeneratePrompts}
                      disabled={generatingPrompts}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-md shadow-[#8B5CF6]/20 disabled:opacity-60"
                    >
                      {generatingPrompts ? <Spinner label="Đang tạo prompts..." /> : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                          </svg>
                          Tạo Scene Prompts →
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {scenes.map((scene, i) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      index={i}
                      showPrompt={false}
                      editMode={editModeScript}
                      onUpdateContent={(sid, val) => updateScene(sid, "content", val)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STEP 3: PROMPTS ════════════════════════════════════════ */}
        {status === "prompts-ready" && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="font-bold text-[16px] text-[#0F172A]">
                  Bước 3 — Scene Prompts
                </h2>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  {scenes.length} scenes · AI đã đề xuất loại animation phù hợp cho từng scene · Có thể chỉnh sửa trước khi render
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Edit toggle */}
                <button
                  onClick={() => setEditModePrompts((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-semibold transition-all",
                    editModePrompts
                      ? "border-[#F59E0B] bg-[#FFFBEB] text-[#F59E0B]"
                      : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]"
                  )}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {editModePrompts ? "Đang sửa" : "Chỉnh sửa"}
                </button>
                {/* Re-generate prompts */}
                <button
                  onClick={handleGeneratePrompts}
                  disabled={generatingPrompts}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#8B5CF6] border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[12.5px] font-semibold transition-colors disabled:opacity-60"
                >
                  {generatingPrompts ? "Đang tạo lại..." : "↺ Tạo lại prompts"}
                </button>
                {/* Batch render */}
                <button
                  onClick={handleBatchRender}
                  disabled={batchRendering}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold text-[13px] tlk-gradient hover:opacity-90 transition-opacity shadow-md shadow-[#3B82F6]/20 disabled:opacity-60"
                >
                  {batchRendering ? <Spinner label="Đang khởi động..." /> : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ▶ Batch Render
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Animation type summary */}
            <div className="mb-4 p-3.5 bg-white rounded-xl border border-[#E2E8F0] flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider shrink-0">Animation types:</span>
              {scenes.map((scene) => {
                const info = scene.animationType ? VIDEO_ANIMATION_TYPES[scene.animationType as VideoAnimationType] : null;
                return (
                  <span key={scene.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-[#E2E8F0] bg-[#F8FAFF] text-[#475569]">
                    <span>{info?.icon ?? "?"}</span>
                    <span className="max-w-[80px] truncate">{info?.label ?? "Chưa chọn"}</span>
                  </span>
                );
              })}
            </div>

            <div className="space-y-3">
              {scenes.map((scene, i) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={i}
                  showPrompt={true}
                  editMode={editModePrompts}
                  onUpdateContent={(sid, val) => updateScene(sid, "content", val)}
                  onUpdatePrompt={(sid, val) => updateScene(sid, "videoPrompt", val)}
                  onUpdateAnimType={(sid, t) => updateScene(sid, "animationType", t)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ STEP 4: RENDERING ══════════════════════════════════════ */}
        {(status === "rendering" || status === "completed") && (
          <div>
            {/* Progress card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-[16px] text-[#0F172A] flex items-center gap-2">
                    {status === "completed" ? (
                      <><span className="text-[#10B981]">✓</span> Hoàn thành!</>
                    ) : (
                      <><div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" /> Đang render...</>
                    )}
                  </h2>
                  <p className="text-[12.5px] text-[#64748B] mt-1">
                    <span className="text-[#10B981] font-semibold">{completedScenes}</span>/{scenes.length} hoàn thành
                    {renderingScenes > 0 && <span className="text-[#3B82F6] font-semibold ml-2">{renderingScenes} đang render</span>}
                    {failedScenes > 0 && <span className="text-[#EF4444] font-semibold ml-2">{failedScenes} thất bại</span>}
                  </p>
                </div>
                {script.projectId && (
                  <Link
                    href={`/projects/${script.projectId}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-[13px] tlk-gradient hover:opacity-90 transition-opacity shadow-sm shadow-[#3B82F6]/20"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Xem Project & Videos
                  </Link>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full tlk-gradient rounded-full transition-all duration-700"
                  style={{ width: `${scenes.length ? (completedScenes / scenes.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-[#94A3B8]">Render tuần tự (AI code → MP4)</span>
                <span className="text-[11px] font-semibold text-[#0F172A]">
                  {scenes.length ? Math.round((completedScenes / scenes.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Scene list with status */}
            <div className="space-y-3">
              {scenes.map((scene, i) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={i}
                  showPrompt={false}
                  editMode={false}
                  onReRender={handleReRender}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
