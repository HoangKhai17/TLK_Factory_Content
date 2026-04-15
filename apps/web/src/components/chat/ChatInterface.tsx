"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn, formatDate } from "@/lib/utils";
import type { ChatMessage } from "@tlk/shared";

interface ChatInterfaceProps {
  projectId: string;
  messages: ChatMessage[];
  onMessageSent: (message: ChatMessage, videoId: string | null) => void;
}

const SUGGESTION_PROMPTS = [
  { icon: "▶", text: "Tạo video YouTube giới thiệu sản phẩm 60 giây, phong cách hiện đại" },
  { icon: "◈", text: "Tạo video TikTok text animation về tips công nghệ, gradient xanh" },
  { icon: "◎", text: "Tạo video marketing quảng cáo dịch vụ, tone màu xanh chuyên nghiệp" },
  { icon: "T", text: "Tạo video social media 30 giây, phong cách minimalist tối giản" },
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";

  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={i > 0 ? "mt-1" : ""}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
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
      <div className="flex justify-end mb-5">
        <div className="max-w-[75%] px-4 py-3 tlk-gradient rounded-2xl rounded-tr-sm text-white text-sm shadow-sm shadow-[#3A5AF7]/20">
          {msg.content}
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="flex gap-3 mb-5">
        {/* AI avatar */}
        <div className="shrink-0 w-8 h-8 rounded-xl tlk-gradient flex items-center justify-center shadow-sm">
          <Image src="/logotlk.png" alt="AI" width={20} height={20} className="rounded object-contain" />
        </div>
        <div className="max-w-[75%]">
          <div className="px-4 py-3 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm text-[#0F172A] text-sm shadow-sm">
            {renderContent(msg.content)}
          </div>
          {msg.videoId && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#3A5AF7] font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Video spec đã tạo — xem trong tab Videos
            </div>
          )}
          <p className="text-[11px] text-[#CBD5E1] mt-1 ml-1">{formatDate(msg.createdAt)}</p>
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

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: trimmed }),
      });
      const data = await res.json() as { message?: ChatMessage; videoId?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Có lỗi xảy ra");
      if (data.message) onMessageSent(data.message, data.videoId ?? null);
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

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFF]">

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">

        {/* Welcome / suggestions */}
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full gap-7 py-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl tlk-gradient flex items-center justify-center shadow-lg shadow-[#3A5AF7]/25">
                <Image src="/logotlk.png" alt="TLK AI" width={40} height={40} className="rounded-lg object-contain" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">TLK Factory AI</h3>
              <p className="text-[#94A3B8] text-sm max-w-xs">
                Mô tả video bạn muốn tạo, AI sẽ tự động thiết kế và render cho bạn
              </p>
            </div>

            {/* Suggestion pills */}
            <div className="w-full max-w-lg space-y-2.5">
              <p className="text-xs text-[#94A3B8] font-medium text-center uppercase tracking-wider mb-3">
                Thử ngay
              </p>
              {SUGGESTION_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => void sendMessage(prompt.text)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left bg-white border border-[#E2E8F0] hover:border-[#3A5AF7]/40 hover:bg-[#EEF2FF]/50 rounded-xl transition-all group"
                >
                  <span className="text-base w-6 text-center shrink-0 opacity-60">{prompt.icon}</span>
                  <span className="text-sm text-[#475569] group-hover:text-[#0F172A] transition-colors">
                    {prompt.text}
                  </span>
                  <svg className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#3A5AF7] ml-auto shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3 mb-5">
            <div className="shrink-0 w-8 h-8 rounded-xl tlk-gradient flex items-center justify-center">
              <Image src="/logotlk.png" alt="AI" width={20} height={20} className="rounded object-contain" />
            </div>
            <div className="px-4 py-3 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#3A5AF7] animate-bounce opacity-60"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mb-3 px-4 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#EF4444] text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="px-6 pb-5 bg-[#F8FAFF]">
        <div className={cn(
          "flex items-end gap-3 bg-white border rounded-2xl px-4 py-3 transition-all shadow-sm",
          sending ? "border-[#E2E8F0]" : "border-[#E2E8F0] focus-within:border-[#3A5AF7] focus-within:shadow-md focus-within:shadow-[#3A5AF7]/10"
        )}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder="Mô tả video bạn muốn tạo... (Enter gửi · Shift+Enter xuống dòng)"
            rows={1}
            className="flex-1 bg-transparent text-[#0F172A] placeholder-[#CBD5E1] text-sm resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: 160 }}
            disabled={sending}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={sending || !input.trim()}
            className={cn(
              "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !sending
                ? "tlk-gradient text-white shadow-sm shadow-[#3A5AF7]/30 hover:opacity-90"
                : "bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed"
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
        <p className="text-[11px] text-[#CBD5E1] mt-2 text-center">
          Powered by Gemini AI · TLK Factory by Nguyễn Hoàng Khải
        </p>
      </div>
    </div>
  );
}
