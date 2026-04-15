"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import type { Project } from "@tlk/shared";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

type NavKey = "dashboard" | "projects" | "archived" | "settings";

const NAV_ITEMS: {
  key: NavKey;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: "projects",
    label: "Projects",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    key: "archived",
    label: "Archived",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ── Page titles per nav ──────────────────────────────────────
const PAGE_TITLES: Record<NavKey, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  archived: "Archived",
  settings: "Settings",
};

// ══════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json() as Promise<{ projects: Project[] }>)
      .then((d) => setProjects(d.projects))
      .finally(() => setLoading(false));

    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() as Promise<{ user: AuthUser }> : null)
      .then((d) => d && setUser(d.user));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  // Filter projects per nav section
  const visibleProjects =
    activeNav === "archived"
      ? projects.filter((p) => p.status === "archived")
      : activeNav === "projects"
      ? projects.filter((p) => p.status === "active")
      : projects; // dashboard shows all

  const activeCount = projects.filter((p) => p.status === "active").length;
  const archivedCount = projects.filter((p) => p.status === "archived").length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">

      {/* ╔═══════════════════════╗ */}
      {/* ║       SIDEBAR         ║ */}
      {/* ╚═══════════════════════╝ */}
      <aside className="w-[240px] shrink-0 bg-[#0F172A] flex flex-col h-full">

        {/* ── Logo ─────────────────────────────── */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E293B] flex items-center justify-center overflow-hidden border border-white/10">
              <Image
                src="/logotlk.png"
                alt="TLK"
                width={28}
                height={28}
                style={{ width: 28, height: "auto" }}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-none">TLK Factory</p>
              <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Content Platform</p>
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────── */}
        <div className="mx-5 h-px bg-white/5 mb-4" />

        {/* ── Navigation ───────────────────────── */}
        <nav className="flex-1 px-3 space-y-0.5">
          {/* Studio link — navigates to separate route */}
          <Link
            href="/studio"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all"
          >
            <span className="text-[#64748B]">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </span>
            Script Studio
            <span className="ml-auto text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#1E293B] text-[#8B5CF6]">AI</span>
          </Link>

          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all",
                  isActive
                    ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25"
                    : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                )}
              >
                <span className={isActive ? "text-white" : "text-[#64748B]"}>
                  {item.icon}
                </span>
                {item.label}

                {/* Badge counts */}
                {item.key === "projects" && activeCount > 0 && (
                  <span className={cn(
                    "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center",
                    isActive ? "bg-white/20 text-white" : "bg-[#1E293B] text-[#64748B]"
                  )}>
                    {activeCount}
                  </span>
                )}
                {item.key === "archived" && archivedCount > 0 && (
                  <span className={cn(
                    "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center",
                    isActive ? "bg-white/20 text-white" : "bg-[#1E293B] text-[#64748B]"
                  )}>
                    {archivedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Divider ──────────────────────────── */}
        <div className="mx-5 h-px bg-white/5 mb-4" />

        {/* ── User profile ─────────────────────── */}
        <div className="px-4 pb-5">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center shrink-0 text-white text-sm font-bold shadow-md shadow-[#3B82F6]/30">
              {user?.avatar ?? user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12.5px] font-semibold truncate leading-none mb-0.5">
                {user?.name ?? "Loading..."}
              </p>
              <p className="text-[#475569] text-[10.5px] truncate">{user?.email ?? ""}</p>
            </div>
            {/* Logout icon */}
            <button
              onClick={handleLogout}
              className="shrink-0 text-[#475569] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
              title="Đăng xuất"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ╔═══════════════════════╗ */}
      {/* ║     MAIN CONTENT      ║ */}
      {/* ╚═══════════════════════╝ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top Header ───────────────────────── */}
        <header className="shrink-0 bg-white border-b border-[#E2E8F0] px-8 h-15 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-bold text-[#0F172A]">
              {PAGE_TITLES[activeNav]}
            </h1>
            {activeNav !== "settings" && (
              <span className="text-[11px] font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                {visibleProjects.length} project{visibleProjects.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {activeNav !== "settings" && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] font-semibold tlk-gradient hover:opacity-90 transition-opacity shadow-sm shadow-[#3B82F6]/25"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tạo Project
            </button>
          )}
        </header>

        {/* ── Scrollable Body ──────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-7">

          {/* Settings panel */}
          {activeNav === "settings" && user && (
            <SettingsPanel user={user} />
          )}
          {activeNav === "settings" && !user && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {activeNav !== "settings" && (
            <>
              {/* Welcome */}
              {activeNav === "dashboard" && (
                <div className="mb-7">
                  <h2 className="text-[22px] font-bold text-[#0F172A] leading-tight mb-1">
                    Xin chào! 👋
                  </h2>
                  <p className="text-[#64748B] text-[13.5px]">
                    Tạo video tự động với AI — chỉ cần nhập prompt, hệ thống sẽ lo phần còn lại.
                  </p>
                </div>
              )}

              {/* Stats row — only on Dashboard */}
              {activeNav === "dashboard" && (
                <div className="grid grid-cols-3 gap-4 mb-7">
                  {[
                    {
                      label: "Tổng Projects",
                      value: projects.length,
                      color: "text-[#3B82F6]",
                      bg: "bg-[#EFF6FF]",
                      border: "border-[#BFDBFE]",
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                      ),
                    },
                    {
                      label: "Đang hoạt động",
                      value: activeCount,
                      color: "text-[#10B981]",
                      bg: "bg-[#ECFDF5]",
                      border: "border-[#A7F3D0]",
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ),
                    },
                    {
                      label: "Đã lưu trữ",
                      value: archivedCount,
                      color: "text-[#F59E0B]",
                      bg: "bg-[#FFFBEB]",
                      border: "border-[#FDE68A]",
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      ),
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={cn(
                        "bg-white rounded-2xl border p-5 flex items-center gap-4",
                        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]",
                        stat.border
                      )}
                    >
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#0F172A] leading-none mb-1">{stat.value}</p>
                        <p className="text-xs text-[#94A3B8] font-medium">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section heading */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-bold text-[#0F172A]">
                  {activeNav === "archived" ? "Archived Projects" : "Danh sách Projects"}
                </h3>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-1 text-[13px] text-[#3B82F6] hover:text-[#2563EB] font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm mới
                </button>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-52 rounded-2xl bg-white animate-pulse border border-[#F1F5F9]" />
                  ))}
                </div>
              ) : visibleProjects.length === 0 ? (
                <EmptyState
                  type={activeNav}
                  onCreateClick={() => setCreateOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={deleteProject}
                    />
                  ))}
                </div>
              )}

              {/* Footer copyright */}
              <div className="mt-10 pt-6 border-t border-[#E2E8F0] text-center">
                <p className="text-[11.5px] text-[#CBD5E1]">
                  © {new Date().getFullYear()} TLK Factory Content — Copyright by{" "}
                  <span className="font-semibold tlk-gradient-text">Nguyễn Hoàng Khải</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

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

// ── Empty State ────────────────────────────────────────────────
function EmptyState({
  type,
  onCreateClick,
}: {
  type: NavKey;
  onCreateClick: () => void;
}) {
  if (type === "archived") {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="w-14 h-14 mx-auto mb-4 bg-[#FFFBEB] rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="font-semibold text-[#0F172A] mb-1 text-sm">Không có project đã lưu trữ</p>
        <p className="text-[#94A3B8] text-xs">Các project archived sẽ xuất hiện ở đây</p>
      </div>
    );
  }

  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#EFF6FF] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.893L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      </div>
      <h3 className="text-[15px] font-bold text-[#0F172A] mb-1">Chưa có project nào</h3>
      <p className="text-[#94A3B8] text-[13px] mb-6 max-w-xs mx-auto">
        Tạo project đầu tiên để bắt đầu tạo video tự động với AI
      </p>
      <button
        onClick={onCreateClick}
        className="px-6 py-2.5 rounded-xl text-white text-[13px] font-semibold tlk-gradient hover:opacity-90 transition-opacity shadow-md shadow-[#3B82F6]/20"
      >
        Tạo Project đầu tiên
      </button>
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────
function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const isActive = project.status === "active";

  return (
    <div className={cn(
      "group bg-white rounded-2xl overflow-hidden transition-all",
      "border shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.06)]",
      "hover:shadow-[0_4px_16px_rgba(59,130,246,0.10)] hover:-translate-y-0.5",
      isActive
        ? "border-t-[3px] border-t-[#3B82F6] border-x-[#E2E8F0] border-b-[#E2E8F0]"
        : "border-[#E2E8F0]"
    )}>
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <span className={cn(
            "text-[11px] font-semibold px-2.5 py-1 rounded-full",
            isActive
              ? "bg-[#ECFDF5] text-[#059669]"
              : "bg-[#F1F5F9] text-[#64748B]"
          )}>
            {isActive ? "Active" : "Archived"}
          </span>
        </div>

        {/* Project name */}
        <h3 className="font-bold text-[#0F172A] text-[14.5px] mb-1 line-clamp-1">
          {project.name}
        </h3>

        {/* Description */}
        <p className="text-[12.5px] text-[#94A3B8] line-clamp-2 min-h-9 mb-2">
          {project.description ?? "Không có mô tả"}
        </p>

        {/* Date */}
        <p className="text-[11px] text-[#CBD5E1] mb-4 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(project.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-[#F8FAFC]">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold tlk-gradient text-white hover:opacity-90 transition-opacity shadow-sm shadow-[#3B82F6]/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Mở project
          </Link>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-10 flex items-center justify-center text-[#CBD5E1] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors border border-[#F1F5F9] hover:border-[#FECACA]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => { onDelete(project.id); setConfirming(false); }}
                className="px-3 py-2 bg-[#EF4444] hover:bg-[#DC2626] rounded-xl text-white text-xs font-semibold"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl text-[#64748B] text-xs font-medium"
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
