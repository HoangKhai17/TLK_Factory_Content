"use client";

import { useEffect, useState, use, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ScriptRow, ScriptSceneRow } from "@/lib/db/schema";

type ScriptStatus = "draft" | "script-ready" | "prompts-ready" | "rendering" | "completed";
type SectionType = "hook" | "intro" | "content" | "cta" | "outro";

const SECTION_META: Record<SectionType, { label: string; color: string; bg: string; emoji: string }> = {
  hook:    { label: "Hook",    color: "text-[#EF4444]", bg: "bg-[#FEF2F2]", emoji: "🎯" },
  intro:   { label: "Intro",   color: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", emoji: "👋" },
  content: { label: "Content", color: "text-[#3B82F6]", bg: "bg-[#EFF6FF]", emoji: "📖" },
  cta:     { label: "CTA",     color: "text-[#10B981]", bg: "bg-[#ECFDF5]", emoji: "📣" },
  outro:   { label: "Outro",   color: "text-[#8B5CF6]", bg: "bg-[#F5F3FF]", emoji: "🎬" },
};

const RENDER_STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: "Chờ",        color: "text-[#94A3B8]" },
  queued:    { label: "Xếp hàng",   color: "text-[#F59E0B]" },
  rendering: { label: "Đang render",color: "text-[#3B82F6]" },
  completed: { label: "Xong",       color: "text-[#10B981]" },
  failed:    { label: "Thất bại",   color: "text-[#EF4444]" },
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

// ── Scene Card ─────────────────────────────────────────────────
function SceneCard({
  scene, index, showPrompt, editable,
  onUpdateContent, onUpdatePrompt,
}: {
  scene: ScriptSceneRow;
  index: number;
  showPrompt: boolean;
  editable: boolean;
  onUpdateContent?: (id: string, content: string) => void;
  onUpdatePrompt?: (id: string, prompt: string) => void;
}) {
  const meta = SECTION_META[scene.sectionType as SectionType] ?? SECTION_META.content!;
  const [editContent, setEditContent] = useState(scene.content ?? "");
  const [editPrompt, setEditPrompt] = useState(scene.videoPrompt ?? "");
  const [savingContent, setSavingContent] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F1F5F9]">
        <span className="text-[11px] font-bold text-[#94A3B8]">#{index + 1}</span>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", meta.bg, meta.color)}>
          {meta.emoji} {meta.label}
        </span>
        <span className="flex-1 font-semibold text-[#0F172A] text-[13px]">{scene.title}</span>
        <span className="text-[11px] text-[#94A3B8] shrink-0">{scene.duration}s</span>
        {scene.renderStatus !== "pending" && (
          <span className={cn("text-[11px] font-semibold", RENDER_STATUS_META[scene.renderStatus]?.color ?? "text-[#94A3B8]")}>
            ● {RENDER_STATUS_META[scene.renderStatus]?.label}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Script content */}
        <div>
          <p className="text-[11.5px] font-semibold text-[#475569] mb-1.5">Nội dung kịch bản</p>
          {editable ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[12.5px] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 resize-none"
              />
              <button
                onClick={async () => {
                  setSavingContent(true);
                  onUpdateContent?.(scene.id, editContent);
                  setSavingContent(false);
                }}
                disabled={savingContent}
                className="mt-1.5 text-[11.5px] text-[#3B82F6] hover:text-[#2563EB] font-semibold"
              >
                {savingContent ? "Lưu..." : "Lưu thay đổi"}
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
            <p className="text-[12px] text-[#64748B] italic">{scene.visualNotes}</p>
          </div>
        )}

        {/* Video prompt */}
        {showPrompt && (
          <div className="pt-3 border-t border-[#F1F5F9]">
            <p className="text-[11.5px] font-semibold text-[#8B5CF6] mb-1.5">
              <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              Video Prompt
            </p>
            {editable ? (
              <div>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[12.5px] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 resize-none font-mono"
                />
                <button
                  onClick={async () => {
                    setSavingPrompt(true);
                    onUpdatePrompt?.(scene.id, editPrompt);
                    setSavingPrompt(false);
                  }}
                  disabled={savingPrompt}
                  className="mt-1.5 text-[11.5px] text-[#8B5CF6] hover:text-[#7C3AED] font-semibold"
                >
                  {savingPrompt ? "Lưu..." : "Lưu prompt"}
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-[#6D28D9] bg-[#F5F3FF] px-3 py-2.5 rounded-xl leading-relaxed">{scene.videoPrompt ?? "(Chưa có prompt)"}</p>
            )}
          </div>
        )}
      </div>
    </div>
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

  // Step 1 state
  const [ideaText, setIdeaText] = useState("");
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([""]);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [batchRendering, setBatchRendering] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/studio/scripts/${id}`);
    if (!res.ok) { router.push("/studio"); return; }
    const d = await res.json() as { script: ScriptRow; scenes: ScriptSceneRow[] };
    setScript(d.script);
    setScenes(d.scenes);
    setIdeaText(d.script.ideaText ?? "");
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
      const d = await res.json() as { projectId?: string; error?: string; message?: string };
      if (!res.ok) { setError(d.error ?? "Lỗi batch render"); setBatchRendering(false); return; }
      // Refresh to see rendering state
      await fetchData();
    } catch {
      setError("Lỗi kết nối server");
      setBatchRendering(false);
    }
  }

  async function updateScene(sceneId: string, field: "content" | "videoPrompt", value: string) {
    // Optimistic update
    setScenes((prev) =>
      prev.map((s) => s.id === sceneId ? { ...s, [field === "content" ? "content" : "videoPrompt"]: value } : s)
    );
    // Persist
    await fetch(`/api/studio/scenes/${sceneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
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

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/studio" className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] font-medium transition-colors">
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
          {script.projectId && (
            <Link
              href={`/projects/${script.projectId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#3B82F6] text-[12px] font-semibold hover:bg-[#DBEAFE] transition-colors"
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
            {error}
            <button onClick={() => setError("")} className="ml-auto text-[#DC2626] hover:text-[#991B1B]">✕</button>
          </div>
        )}

        {/* ══ STEP 1: INPUT ══════════════════════════════════════════ */}
        {(status === "draft" || status === "script-ready") && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7">
              <h2 className="font-bold text-[16px] text-[#0F172A] mb-1">Bước 1 — Ý tưởng video</h2>
              <p className="text-[12.5px] text-[#64748B] mb-5">Mô tả ý tưởng của bạn. AI sẽ phân tích và viết kịch bản hoàn chỉnh.</p>

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
                    {generatingScript ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        AI đang viết kịch bản...
                      </>
                    ) : (
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

            {/* Script result */}
            {status === "script-ready" && scenes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[16px] text-[#0F172A]">
                    Bước 2 — Kịch bản ({scenes.length} scenes, ~{scenes.reduce((a, s) => a + s.duration, 0)}s)
                  </h2>
                  <button
                    onClick={handleGeneratePrompts}
                    disabled={generatingPrompts}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-[13px] bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-md shadow-[#8B5CF6]/20 disabled:opacity-60"
                  >
                    {generatingPrompts ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang tạo prompts...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>Tạo Scene Prompts →</>
                    )}
                  </button>
                </div>
                <div className="space-y-3">
                  {scenes.map((scene, i) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      index={i}
                      showPrompt={false}
                      editable={true}
                      onUpdateContent={(sid, val) => updateScene(sid, "content", val)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STEP 3: PROMPTS ════════════════════════════════════════ */}
        {(status === "prompts-ready") && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[16px] text-[#0F172A]">
                  Bước 3 — Scene Prompts ({scenes.length} scenes)
                </h2>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">Chỉnh sửa prompt nếu cần, sau đó bắt đầu batch render</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGeneratePrompts}
                  disabled={generatingPrompts}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#8B5CF6] border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[13px] font-semibold transition-colors disabled:opacity-60"
                >
                  {generatingPrompts ? "Đang tạo lại..." : "↺ Tạo lại prompts"}
                </button>
                <button
                  onClick={handleBatchRender}
                  disabled={batchRendering}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold text-[13px] tlk-gradient hover:opacity-90 transition-opacity shadow-md shadow-[#3B82F6]/20 disabled:opacity-60"
                >
                  {batchRendering ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang khởi động...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>▶ Batch Render tất cả</>
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
                  showPrompt={true}
                  editable={true}
                  onUpdateContent={(sid, val) => updateScene(sid, "content", val)}
                  onUpdatePrompt={(sid, val) => updateScene(sid, "videoPrompt", val)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ STEP 4: RENDERING ══════════════════════════════════════ */}
        {(status === "rendering" || status === "completed") && (
          <div>
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-[16px] text-[#0F172A]">
                    {status === "completed" ? "Hoàn thành!" : "Đang render..."}
                  </h2>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5">
                    {completedScenes}/{scenes.length} scenes hoàn thành
                    {failedScenes > 0 && ` · ${failedScenes} thất bại`}
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
                  className="h-full tlk-gradient rounded-full transition-all duration-500"
                  style={{ width: `${scenes.length ? (completedScenes / scenes.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {scenes.map((scene, i) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={i}
                  showPrompt={false}
                  editable={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
