"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: { id: string; name: string; description: string | null; status: "active" | "archived"; thumbnailUrl: string | null; createdAt: string; updatedAt: string }) => void;
}

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
}: CreateProjectDialogProps) {
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
      const data = await res.json() as { project?: { id: string; name: string; description: string | null; status: "active" | "archived"; thumbnailUrl: string | null; createdAt: string; updatedAt: string }; error?: string };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Tạo Project mới</h2>
        <p className="text-sm text-white/50 mb-6">Tổ chức video theo từng project</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Tên project <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Marketing Q1 2025"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Mô tả <span className="text-white/30">(tùy chọn)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về project..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-white/70 hover:bg-white/5 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl font-medium transition-all",
                "bg-indigo-600 hover:bg-indigo-500 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? "Đang tạo..." : "Tạo project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
