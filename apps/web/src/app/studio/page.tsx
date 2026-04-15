"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ScriptRow } from "@/lib/db/schema";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: "Nháp",          color: "text-[#64748B]",  bg: "bg-[#F1F5F9]" },
  "script-ready": { label: "Có kịch bản",   color: "text-[#3B82F6]",  bg: "bg-[#EFF6FF]" },
  "prompts-ready":{ label: "Có prompts",     color: "text-[#8B5CF6]",  bg: "bg-[#F5F3FF]" },
  rendering:      { label: "Đang render",    color: "text-[#F59E0B]",  bg: "bg-[#FFFBEB]" },
  completed:      { label: "Hoàn thành",     color: "text-[#10B981]",  bg: "bg-[#ECFDF5]" },
};

function ScriptCard({ script, onDelete }: { script: ScriptRow; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const st = STATUS_LABEL[script.status] ?? STATUS_LABEL.draft!;

  return (
    <div className="group bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-[0_4px_16px_rgba(59,130,246,0.10)] hover:-translate-y-0.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Top gradient bar */}
      <div className="h-1 tlk-gradient" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", st.bg, st.color)}>
            {st.label}
          </span>
        </div>

        <h3 className="font-bold text-[#0F172A] text-[14.5px] mb-1 line-clamp-1">{script.title}</h3>
        <p className="text-[12px] text-[#94A3B8] line-clamp-2 min-h-[34px] mb-4">
          {script.ideaText ?? "Chưa có ý tưởng"}
        </p>

        <div className="flex gap-2 pt-3 border-t border-[#F8FAFC]">
          <Link
            href={`/studio/${script.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold tlk-gradient text-white hover:opacity-90 transition-opacity shadow-sm shadow-[#8B5CF6]/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Mở Studio
          </Link>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-10 flex items-center justify-center text-[#CBD5E1] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors border border-[#F1F5F9] hover:border-[#FECACA]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => { onDelete(script.id); setConfirming(false); }}
                className="px-3 py-2 bg-[#EF4444] hover:bg-[#DC2626] rounded-xl text-white text-xs font-semibold"
              >Xóa</button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-2 bg-[#F1F5F9] rounded-xl text-[#64748B] text-xs"
              >Hủy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudioListPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<ScriptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/studio/scripts")
      .then((r) => r.json() as Promise<{ scripts: ScriptRow[] }>)
      .then((d) => setScripts(d.scripts ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function createScript() {
    setCreating(true);
    const res = await fetch("/api/studio/scripts", { method: "POST" });
    const d = await res.json() as { script: ScriptRow };
    router.push(`/studio/${d.script.id}`);
  }

  async function deleteScript(id: string) {
    await fetch(`/api/studio/scripts/${id}`, { method: "DELETE" });
    setScripts((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 bg-[#0F172A] flex flex-col h-full">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E293B] flex items-center justify-center overflow-hidden border border-white/10">
              <Image src="/logotlk.png" alt="TLK" width={28} height={28} style={{ width: 28, height: "auto" }} className="object-contain" priority />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-none">TLK Factory</p>
              <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Script Studio</p>
            </div>
          </div>
        </div>
        <div className="mx-5 h-px bg-white/5 mb-4" />
        <nav className="flex-1 px-3 space-y-0.5">
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all">
            <svg className="w-[18px] h-[18px] text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25">
            <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Script Studio
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-8 h-15 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-bold text-[#0F172A]">Script Studio</h1>
            <span className="text-[11px] font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
              {scripts.length} kịch bản
            </span>
          </div>
          <button
            onClick={createScript}
            disabled={creating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] font-semibold tlk-gradient hover:opacity-90 transition-opacity shadow-sm shadow-[#3B82F6]/25 disabled:opacity-60"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {creating ? "Đang tạo..." : "Script mới"}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl px-5 py-4 mb-7">
            <svg className="w-5 h-5 text-[#8B5CF6] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              <p className="font-semibold text-[13px] text-[#6D28D9] mb-0.5">Script Studio — Tự động hóa hàng loạt</p>
              <p className="text-[12.5px] text-[#7C3AED]">
                Nhập ý tưởng hoặc link YouTube → AI viết kịch bản đầy đủ → Tạo scene prompts → Batch render toàn bộ video tự động.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-white animate-pulse border border-[#F1F5F9]" />
              ))}
            </div>
          ) : scripts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#F5F3FF] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-[#0F172A] mb-1">Chưa có kịch bản nào</h3>
              <p className="text-[#94A3B8] text-[13px] mb-6 max-w-xs mx-auto">
                Tạo kịch bản đầu tiên và để AI tự động hoá toàn bộ quy trình tạo video
              </p>
              <button
                onClick={createScript}
                disabled={creating}
                className="px-6 py-2.5 rounded-xl text-white text-[13px] font-semibold tlk-gradient hover:opacity-90 transition-opacity shadow-md shadow-[#8B5CF6]/20 disabled:opacity-60"
              >
                {creating ? "Đang tạo..." : "Tạo Script mới"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {scripts.map((s) => (
                <ScriptCard key={s.id} script={s} onDelete={deleteScript} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
