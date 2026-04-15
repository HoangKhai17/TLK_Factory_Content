"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import type { Project } from "@tlk/shared";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json() as Promise<{ projects: Project[] }>)
      .then((d) => setProjects(d.projects))
      .finally(() => setLoading(false));
  }, []);

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const activeCount = projects.filter((p) => p.status === "active").length;
  const archivedCount = projects.filter((p) => p.status === "archived").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFF]">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logotlk.png"
              alt="TLK Factory"
              width={36}
              height={36}
              className="rounded-lg object-contain"
              priority
            />
            <div>
              <span className="font-bold text-[#0F172A] text-base leading-none block">
                TLK Factory
              </span>
              <span className="text-xs text-[#94A3B8] leading-none">
                Content Platform
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#94A3B8]">
              {projects.length} projects
            </span>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium tlk-gradient hover:opacity-90 transition-opacity shadow-sm shadow-[#3A5AF7]/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo Project
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        {/* Hero section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">
            Xin chào! 👋
          </h1>
          <p className="text-[#64748B] text-sm">
            Tạo video tự động với AI — chỉ cần nhập prompt, hệ thống sẽ lo phần còn lại.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Tổng Projects",
              value: projects.length,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              ),
              color: "text-[#3A5AF7]",
              bg: "bg-[#EEF2FF]",
              border: "border-[#C7D2FE]",
            },
            {
              label: "Đang hoạt động",
              value: activeCount,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "text-[#10B981]",
              bg: "bg-[#ECFDF5]",
              border: "border-[#A7F3D0]",
            },
            {
              label: "Đã lưu trữ",
              value: archivedCount,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              ),
              color: "text-[#F59E0B]",
              bg: "bg-[#FFFBEB]",
              border: "border-[#FDE68A]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm",
                stat.border
              )}
            >
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F172A]">{stat.value}</p>
                <p className="text-xs text-[#94A3B8] font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#0F172A]">
            Danh sách Projects
          </h2>
          {projects.length > 0 && (
            <button
              onClick={() => setCreateOpen(true)}
              className="text-sm text-[#3A5AF7] hover:text-[#2D47D4] font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm mới
            </button>
          )}
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-[#F1F5F9] animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-[#E2E8F0]">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-[#EEF2FF] flex items-center justify-center">
              <svg className="w-9 h-9 text-[#3A5AF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">Chưa có project nào</h2>
            <p className="text-[#94A3B8] mb-7 text-sm max-w-sm mx-auto">
              Tạo project đầu tiên để bắt đầu tạo video tự động với AI
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-6 py-3 rounded-xl text-white font-medium tlk-gradient hover:opacity-90 transition-opacity shadow-md shadow-[#3A5AF7]/20"
            >
              Tạo Project đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={deleteProject} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-[#E2E8F0] bg-white py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logotlk.png" alt="TLK" width={22} height={22} className="opacity-60" />
            <span className="text-xs text-[#94A3B8]">TLK Factory Content</span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} Copyright by{" "}
            <span className="font-semibold tlk-gradient-text">Nguyễn Hoàng Khải</span>
            . All rights reserved.
          </p>
        </div>
      </footer>

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(p) => {
          setProjects((prev) => [p as Project, ...prev]);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const typeColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-[#ECFDF5]", text: "text-[#059669]" },
    archived: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
  };
  const badge = typeColors[project.status] ?? typeColors.active;

  return (
    <div className="group bg-white border border-[#E2E8F0] hover:border-[#3A5AF7]/30 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:shadow-[#3A5AF7]/5">
      {/* Gradient top bar */}
      <div className="h-1 tlk-gradient" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#3A5AF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", badge.bg, badge.text)}>
            {project.status === "active" ? "Active" : "Archived"}
          </span>
        </div>

        {/* Title & description */}
        <h3 className="font-semibold text-[#0F172A] mb-1 line-clamp-1 text-[15px]">
          {project.name}
        </h3>
        <p className="text-sm text-[#94A3B8] line-clamp-2 mb-1 min-h-[40px]">
          {project.description ?? "Không có mô tả"}
        </p>
        <p className="text-xs text-[#CBD5E1] mb-4">{formatDate(project.createdAt)}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-[#F1F5F9]">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium tlk-gradient text-white hover:opacity-90 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Mở project
          </Link>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="p-2.5 text-[#CBD5E1] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(project.id)}
                className="px-3 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] rounded-lg text-white text-xs font-medium"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg text-[#64748B] text-xs font-medium"
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
