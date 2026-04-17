"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PROVIDER_MODELS, PROVIDER_NAMES } from "@/lib/ai/types";
import type { ProviderType } from "@/lib/ai/types";

interface ApiConfigUI {
  provider: ProviderType;
  activeModel: string;
  isActive: boolean;
}

export interface ActiveModel {
  provider: ProviderType;
  model: string;
}

interface ModelSwitcherProps {
  value: ActiveModel | null;
  onChange: (next: ActiveModel) => void;
}

const PROVIDER_BADGE: Record<ProviderType, { label: string; bg: string; text: string }> = {
  gemini:    { label: "G",   bg: "bg-[#EFF6FF]", text: "text-[#3B82F6]" },
  openai:    { label: "GPT", bg: "bg-[#F0FDF4]", text: "text-[#10B981]" },
  anthropic: { label: "C",   bg: "bg-[#FFF7ED]", text: "text-[#F59E0B]" },
};

export function ModelSwitcher({ value, onChange }: ModelSwitcherProps) {
  const [configs, setConfigs] = useState<ApiConfigUI[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d: { configs?: ApiConfigUI[] }) => setConfigs(d.configs ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-40 rounded-xl bg-[#F1F5F9] animate-pulse" />
    );
  }

  if (configs.length === 0) {
    return (
      <a
        href="/?tab=settings"
        className="text-xs text-[#94A3B8] hover:text-[#3A5AF7] transition-colors"
      >
        + Thêm API Key
      </a>
    );
  }

  const activeProvider = value?.provider ?? configs.find((c) => c.isActive)?.provider ?? configs[0]!.provider;
  const activeModel =
    value?.model ??
    configs.find((c) => c.provider === activeProvider)?.activeModel ??
    PROVIDER_MODELS[activeProvider][0]?.id ??
    "";
  const modelLabel =
    PROVIDER_MODELS[activeProvider]?.find((m) => m.id === activeModel)?.name ?? activeModel;
  const badge = PROVIDER_BADGE[activeProvider];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border bg-white transition-all text-xs font-medium select-none",
          open
            ? "border-[#3A5AF7]/40 shadow-sm shadow-[#3A5AF7]/10"
            : "border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm"
        )}
      >
        <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide", badge.bg, badge.text)}>
          {badge.label}
        </span>
        <span className="text-[#475569] max-w-[160px] truncate leading-none">{modelLabel}</span>
        <svg
          className={cn("w-3 h-3 text-[#CBD5E1] transition-transform shrink-0", open && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-76 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl shadow-black/8 z-50 overflow-hidden"
          style={{ width: 300 }}>
          <div className="px-4 py-2.5 border-b border-[#F1F5F9]">
            <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-widest">Chọn Model AI</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {configs.map((config) => {
              const models = PROVIDER_MODELS[config.provider];
              const pb = PROVIDER_BADGE[config.provider];
              return (
                <div key={config.provider}>
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide", pb.bg, pb.text)}>
                      {PROVIDER_NAMES[config.provider]}
                    </span>
                  </div>
                  {models.map((m) => {
                    const selected = activeProvider === config.provider && activeModel === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => { onChange({ provider: config.provider, model: m.id }); setOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2 text-xs text-left transition-colors",
                          selected
                            ? "bg-[#EEF2FF] text-[#3A5AF7] font-semibold"
                            : "text-[#475569] hover:bg-[#F8FAFF] hover:text-[#0F172A]"
                        )}
                      >
                        <span className="leading-relaxed">{m.name}</span>
                        {selected && (
                          <svg className="w-3.5 h-3.5 text-[#3A5AF7] shrink-0 ml-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-2.5 border-t border-[#F1F5F9] bg-[#F8FAFF] flex items-center justify-between">
            <p className="text-[10px] text-[#CBD5E1]">
              Quản lý API Keys trong{" "}
              <a href="/?tab=settings" className="text-[#3A5AF7] hover:underline" onClick={() => setOpen(false)}>
                Settings
              </a>
            </p>
            <span className="text-[10px] text-[#CBD5E1]">{configs.length} provider</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Hook: load the default active model from settings on mount */
export function useActiveModel() {
  const [activeModel, setActiveModel] = useState<ActiveModel | null>(null);

  useEffect(() => {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d: { configs?: ApiConfigUI[] }) => {
        const active = (d.configs ?? []).find((c) => c.isActive);
        if (active) setActiveModel({ provider: active.provider, model: active.activeModel });
      });
  }, []);

  return [activeModel, setActiveModel] as const;
}
