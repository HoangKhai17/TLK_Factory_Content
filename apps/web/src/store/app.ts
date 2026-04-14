"use client";

import { create } from "zustand";
import type { Project, VideoRecord, ChatMessage } from "@tlk/shared";

interface AppState {
  // Projects
  projects: Project[];
  activeProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;

  // Videos
  videos: VideoRecord[];
  setVideos: (videos: VideoRecord[]) => void;
  addVideo: (video: VideoRecord) => void;
  updateVideo: (id: string, updates: Partial<VideoRecord>) => void;

  // Chat
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Projects
  projects: [],
  activeProject: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) =>
    set((s) => ({ projects: [project, ...s.projects] })),
  removeProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  // Videos
  videos: [],
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((s) => ({ videos: [video, ...s.videos] })),
  updateVideo: (id, updates) =>
    set((s) => ({
      videos: s.videos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),

  // Chat
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
}));
