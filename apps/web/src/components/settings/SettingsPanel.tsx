"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PROVIDER_MODELS, PROVIDER_NAMES } from "@/lib/ai/types";
import type { ProviderType } from "@/lib/ai/types";

type SettingsTab = "profile" | "api-keys";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface ApiConfigUI {
  provider: ProviderType;
  apiKeyMasked: string;
  activeModel: string;
  isActive: boolean;
}

// ── Provider Icon ──────────────────────────────────────────────
function ProviderIcon({ provider }: { provider: ProviderType }) {
  if (provider === "gemini")
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 10L2 7v10l10 5 10-5V7l-10 5z" fill="#4285F4" />
      </svg>
    );
  if (provider === "openai")
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.28 9.93a5.85 5.85 0 00-.5-4.81 6.1 6.1 0 00-6.56-2.92A5.87 5.87 0 0010.73 1 6.1 6.1 0 005 4.78a5.87 5.87 0 00-3.92 2.83 6.1 6.1 0 00.75 7.17 5.85 5.85 0 00.5 4.81 6.1 6.1 0 006.56 2.92A5.87 5.87 0 0013.28 23a6.1 6.1 0 005.73-3.78 5.87 5.87 0 003.92-2.83 6.1 6.1 0 00-.65-7.46zM13.28 21.5a4.56 4.56 0 01-2.93-1.06l.15-.08 4.86-2.81a.8.8 0 00.4-.69v-6.86l2.05 1.19a.07.07 0 01.04.06v5.68a4.58 4.58 0 01-4.57 4.57zm-9.82-4.2a4.56 4.56 0 01-.55-3.06l.15.09 4.86 2.81a.79.79 0 00.8 0L14.6 14v2.38a.07.07 0 01-.03.06l-4.91 2.84a4.57 4.57 0 01-6.2-1.98zm-1.27-10.6a4.55 4.55 0 012.38-2L4.6 8.87v5.62a.79.79 0 00.4.69l5.87 3.39-2.05 1.18a.08.08 0 01-.07 0L3.7 16.7a4.57 4.57 0 01-.51-10zm16.87 3.93l-5.88-3.39 2.05-1.18a.08.08 0 01.07 0l5.05 2.92a4.57 4.57 0 01-.71 8.24v-5.7a.79.79 0 00-.38-.69l-.2-.2zm2.04-3.07l-.15-.09-4.86-2.81a.79.79 0 00-.8 0L9.41 8.5V6.12a.07.07 0 01.03-.06L14.35 3.2a4.57 4.57 0 016.75 4.36zm-12.87 4.23l-2.06-1.19a.07.07 0 01-.04-.06V5.87a4.57 4.57 0 017.5-3.5l-.15.08-4.86 2.81a.8.8 0 00-.4.69l.01 6.85zm1.11-2.4L12 8.53l2.66 1.54v3.06L12 14.67l-2.66-1.54V9.79z" />
      </svg>
    );
  // anthropic
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L9.069 7.367 6.498 13.48h4.203z" />
    </svg>
  );
}

// ── Provider colors ────────────────────────────────────────────
const PROVIDER_BG: Record<ProviderType, string> = {
  gemini: "bg-[#EFF6FF]",
  openai: "bg-[#F0FDF4]",
  anthropic: "bg-[#FFF7ED]",
};
const PROVIDER_COLOR: Record<ProviderType, string> = {
  gemini: "text-[#3B82F6]",
  openai: "text-[#10B981]",
  anthropic: "text-[#F59E0B]",
};

// ── API Key Card ───────────────────────────────────────────────
function ApiKeyCard({
  provider,
  saved,
  onSaved,
}: {
  provider: ProviderType;
  saved: ApiConfigUI | undefined;
  onSaved: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDER_MODELS[provider][0]!.id);
  const [showKey, setShowKey] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [error, setError] = useState("");

  // Sync from saved config
  useEffect(() => {
    if (saved) {
      setModel(saved.activeModel);
      setIsActive(saved.isActive);
    }
  }, [saved]);

  async function handleSave() {
    if (!apiKey.trim() && !saved) {
      setError("Vui lòng nhập API Key");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim() || "KEEP",  // server keeps existing if "KEEP"
          activeModel: model,
          isActive,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Lỗi lưu config");
        return;
      }
      setApiKey("");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: apiKey.trim() || undefined, model }),
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Xoá cấu hình ${PROVIDER_NAMES[provider]}?`)) return;
    await fetch(`/api/settings/api-keys?provider=${provider}`, { method: "DELETE" });
    setApiKey("");
    setIsActive(false);
    onSaved();
  }

  const isSaved = !!saved;

  return (
    <div className={cn(
      "rounded-2xl border p-5 transition-all",
      isActive && isSaved
        ? "border-[#3B82F6] bg-[#EFF6FF] shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", PROVIDER_BG[provider], PROVIDER_COLOR[provider])}>
            <ProviderIcon provider={provider} />
          </div>
          <div>
            <p className="font-semibold text-[14px] text-[#0F172A]">{PROVIDER_NAMES[provider]}</p>
            <p className="text-[11px] text-[#94A3B8]">{PROVIDER_MODELS[provider].length} models</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <>
              {isActive && (
                <span className="text-[10.5px] font-bold text-[#3B82F6] bg-[#DBEAFE] px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
              <button
                onClick={handleDelete}
                className="text-[#CBD5E1] hover:text-[#EF4444] transition-colors p-1.5 rounded-lg hover:bg-[#FEF2F2]"
                title="Xóa"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* API Key input */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11.5px] font-semibold text-[#475569] mb-1.5">
            API Key {isSaved && <span className="text-[#94A3B8] font-normal">(hiện tại: {saved.apiKeyMasked})</span>}
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isSaved ? "Nhập key mới để thay đổi..." : "Nhập API Key..."}
              className="w-full px-3 py-2 pr-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[12.5px] placeholder-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showKey ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Model selector */}
        <div>
          <label className="block text-[11.5px] font-semibold text-[#475569] mb-1.5">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[12.5px] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          >
            {PROVIDER_MODELS[provider].map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Set Active toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "w-9 h-5 rounded-full transition-colors relative",
              isActive ? "bg-[#3B82F6]" : "bg-[#E2E8F0]"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              isActive ? "translate-x-4" : "translate-x-0.5"
            )} />
          </div>
          <span className="text-[12.5px] font-medium text-[#475569]">Đặt làm provider mặc định</span>
        </label>

        {/* Error */}
        {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}

        {/* Test result */}
        {testResult && (
          <div className={cn("flex items-center gap-1.5 text-[12px] font-medium",
            testResult === "ok" ? "text-[#10B981]" : "text-[#EF4444]"
          )}>
            {testResult === "ok" ? (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> API Key hợp lệ!</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg> API Key không hợp lệ</>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl text-white text-[12.5px] font-semibold tlk-gradient hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : isSaved ? "Cập nhật" : "Lưu"}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || (!apiKey.trim() && !isSaved)}
            className="px-4 py-2 rounded-xl text-[12.5px] font-semibold border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFF] hover:border-[#CBD5E1] transition-colors disabled:opacity-40"
          >
            {testing ? "..." : "Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export function SettingsPanel({ user: initialUser }: { user: User }) {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [avatar, setAvatar] = useState(initialUser.avatar ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [configs, setConfigs] = useState<ApiConfigUI[]>([]);

  const PROVIDERS: ProviderType[] = ["gemini", "openai", "anthropic"];

  useEffect(() => { fetchConfigs(); }, []);

  async function fetchConfigs() {
    const res = await fetch("/api/settings/api-keys");
    if (res.ok) {
      const d = await res.json() as { configs: ApiConfigUI[] };
      setConfigs(d.configs);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      const d = await res.json() as { user?: User; error?: string };
      if (!res.ok) { setProfileMsg(d.error ?? "Lỗi lưu profile"); return; }
      setUser(d.user!);
      setProfileMsg("Đã lưu thành công!");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h2 className="text-[22px] font-bold text-[#0F172A] leading-tight mb-1">Settings</h2>
        <p className="text-[13.5px] text-[#64748B]">Quản lý hồ sơ và cấu hình API</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-7 bg-[#F1F5F9] p-1 rounded-xl w-fit">
        {([
          { key: "profile" as SettingsTab, label: "Hồ sơ", icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )},
          { key: "api-keys" as SettingsTab, label: "API Keys", icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          )},
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all",
              tab === key
                ? "bg-white text-[#0F172A] shadow-sm shadow-black/5"
                : "text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === "profile" && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7">
          <div className="flex items-center gap-5 mb-8">
            {/* Avatar preview */}
            <div className="w-16 h-16 rounded-2xl bg-[#3B82F6] flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-[#3B82F6]/20">
              {avatar || user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[#0F172A] text-[15px]">{user.name}</p>
              <p className="text-[12.5px] text-[#94A3B8]">{user.email}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[13.5px] placeholder-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">
                Avatar (emoji hoặc ký tự đại diện)
              </label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="K"
                maxLength={2}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[13.5px] placeholder-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">Tối đa 2 ký tự. Để trống = chữ cái đầu của tên.</p>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] text-[#94A3B8] text-[13.5px] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">Email không thể thay đổi</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl text-white text-[13px] font-semibold tlk-gradient hover:opacity-90 transition-opacity shadow-sm shadow-[#3B82F6]/20 disabled:opacity-60"
              >
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              {profileMsg && (
                <p className={cn("text-[12.5px] font-medium",
                  profileMsg.includes("thành công") ? "text-[#10B981]" : "text-[#EF4444]"
                )}>
                  {profileMsg}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── API Keys Tab ── */}
      {tab === "api-keys" && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-[#3B82F6] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[12.5px] text-[#1D4ED8]">
              API key được lưu local, chỉ sử dụng trên máy của bạn.
              Chọn <strong>provider mặc định</strong> để áp dụng cho mọi cuộc hội thoại.
            </p>
          </div>

          {PROVIDERS.map((provider) => (
            <ApiKeyCard
              key={provider}
              provider={provider}
              saved={configs.find((c) => c.provider === provider)}
              onSaved={fetchConfigs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
