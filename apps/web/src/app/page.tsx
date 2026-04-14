"use client";

import { useEffect, useState } from "react";
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

  return (
    <div className="min-h-screen bg-[#080810]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              TLK
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">TLK Factory</h1>
              <p className="text-xs text-white/40">Video Automation Platform</p>
            </div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo Project
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Projects", value: projects.length, icon: "◈", color: "from-indigo-500/20 to-purple-500/20" },
            { label: "Active", value: projects.filter((p) => p.status === "active").length, icon: "◉", color: "from-green-500/20 to-emerald-500/20" },
            { label: "Archived", value: projects.filter((p) => p.status === "archived").length, icon: "◎", color: "from-yellow-500/20 to-orange-500/20" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "px-5 py-4 rounded-2xl bg-linear-to-br border border-white/5",
                stat.color
              )}
            >
              <div className="text-white/50 text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/5 flex items-center justify-center text-4xl">
              🎬
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Chưa có project nào</h2>
            <p className="text-white/40 mb-6 text-sm">
              Tạo project đầu tiên để bắt đầu tạo video tự động với AI
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors"
            >
              Tạo Project đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </main>

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

  return (
    <div className="group relative bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all">
      {/* Top color strip */}
      <div className="h-1.5 bg-linear-to-r from-indigo-500 to-purple-500" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-lg">
            📁
          </div>
          <div
            className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              project.status === "active"
                ? "bg-green-500/10 text-green-400"
                : "bg-yellow-500/10 text-yellow-400"
            )}
          >
            {project.status === "active" ? "Active" : "Archived"}
          </div>
        </div>

        <h3 className="font-semibold text-white mb-1 line-clamp-2">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-white/40 line-clamp-2 mb-4">
            {project.description}
          </p>
        )}

        <p className="text-xs text-white/30 mb-4">
          {formatDate(project.createdAt)}
        </p>

        <div className="flex gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm font-medium transition-colors"
          >
            Mở project
          </Link>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(project.id)}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-xs"
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
