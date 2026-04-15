"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: {
    id: string;
    name: string;
    description: string | null;
    status: "active" | "archived";
    thumbnailUrl: string | null;
    createdAt: string;
    updatedAt: string;
  }) => void;
}

export function CreateProjectDialog({ open, onClose, onCreated }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json() as {
        project?: { id: string; name: string; description: string | null; status: "active" | "archived"; thumbnailUrl: string | null; createdAt: string; updatedAt: string };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Có lỗi xảy ra");
      if (data.project) {
        onCreated(data.project);
        setName("");
        setDescription("");
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-[#0F172A]/10 overflow-hidden">

        {/* Top gradient bar */}
        <div className="h-1 tlk-gradient" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl tlk-gradient flex items-center justify-center shadow-sm">
              <Image src="/logotlk.png" alt="TLK" width={24} height={24} className="rounded object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Tạo Project mới</h2>
              <p className="text-xs text-[#94A3B8]">Tổ chức và quản lý video theo project</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
              Tên project <span className="text-[#EF4444]">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Marketing Q1 2025, YouTube Channel..."
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#CBD5E1] text-sm focus:outline-none focus:border-[#3A5AF7] focus:ring-2 focus:ring-[#3A5AF7]/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
              Mô tả{" "}
              <span className="text-[#94A3B8] font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về mục đích của project..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#CBD5E1] text-sm focus:outline-none focus:border-[#3A5AF7] focus:ring-2 focus:ring-[#3A5AF7]/10 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-[#64748B] text-sm font-medium hover:bg-[#F8FAFF] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all",
                "tlk-gradient hover:opacity-90 shadow-sm shadow-[#3A5AF7]/20",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tạo...
                </span>
              ) : (
                "Tạo project"
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F8FAFF] border-t border-[#F1F5F9]">
          <p className="text-[11px] text-[#CBD5E1] text-center">
            © TLK Factory · by{" "}
            <span className="tlk-gradient-text font-semibold">Nguyễn Hoàng Khải</span>
          </p>
        </div>
      </div>
    </div>
  );
}
