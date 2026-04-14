"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import type { ChatMessage } from "@tlk/shared";

interface ChatInterfaceProps {
  projectId: string;
  messages: ChatMessage[];
  onMessageSent: (message: ChatMessage, videoId: string | null) => void;
}

const SUGGESTION_PROMPTS = [
  "Tạo video YouTube giới thiệu sản phẩm 60 giây, phong cách hiện đại",
  "Tạo video TikTok text animation về tips công nghệ, nền tối gradient",
  "Tạo video marketing quảng cáo dịch vụ, màu xanh chuyên nghiệp",
  "Tạo video social media 30 giây, phong cách minimalist đen trắng",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";

  // Render markdown-lite (bold, newlines)
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={i > 0 ? "mt-1" : ""}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] px-4 py-3 bg-indigo-600 rounded-2xl rounded-tr-sm text-white text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="flex gap-3 mb-4">
        {/* Avatar */}
        <div className="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          AI
        </div>
        <div className="max-w-[80%]">
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm text-white/90 text-sm">
            {renderContent(msg.content)}
          </div>
          {msg.videoId && (
            <div className="mt-2 flex items-center gap-2 text-xs text-indigo-400">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              </div>
              Video spec đã sẵn sàng — xem trong danh sách video
            </div>
          )}
          <p className="text-xs text-white/25 mt-1 ml-1">{formatDate(msg.createdAt)}</p>
        </div>
      </div>
    );
  }

  return null;
}

export function ChatInterface({
  projectId,
  messages,
  onMessageSent,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setInput("");
    setSending(true);
    setError("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: trimmed }),
      });

      const data = await res.json() as { message?: ChatMessage; videoId?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Có lỗi xảy ra");
      if (data.message) {
        onMessageSent(data.message, data.videoId ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi khi gửi tin nhắn");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const showSuggestions = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showSuggestions && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl">
                ✨
              </div>
              <h3 className="text-xl font-bold text-white mb-2">TLK Factory AI</h3>
              <p className="text-white/50 text-sm">
                Mô tả video bạn muốn tạo, AI sẽ tự động thiết kế
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
              {SUGGESTION_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => void sendMessage(prompt)}
                  className="px-4 py-3 text-left text-sm text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 rounded-xl transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {sending && (
          <div className="flex gap-3 mb-4">
            <div className="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-2 bg-white/5 border border-white/10 focus-within:border-indigo-500/60 rounded-2xl px-4 py-3 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder="Mô tả video bạn muốn tạo... (Enter để gửi, Shift+Enter xuống dòng)"
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm resize-none focus:outline-none"
            style={{ maxHeight: 200 }}
            disabled={sending}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={sending || !input.trim()}
            className={cn(
              "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !sending
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            )}
          >
            {sending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-white/20 mt-1.5 text-center">
          Powered by Gemini AI · TLK Factory
        </p>
      </div>
    </div>
  );
}
