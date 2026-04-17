"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn, formatDate } from "@/lib/utils";
import type { ChatMessage } from "@tlk/shared";
import { VIDEO_ANIMATION_TYPES } from "@/lib/ai/codegenSystemPrompt";
import type { VideoAnimationType } from "@/lib/ai/codegenSystemPrompt";

interface ChatInterfaceProps {
  projectId: string;
  messages: ChatMessage[];
  onMessageSent: (userMsg: ChatMessage, assistantMsg: ChatMessage, videoId: string | null) => void;
  onClearChat: () => void;
  /** Override provider/model from active settings */
  provider?: string;
  model?: string;
  modelLabel?: string;
}

// Suggestions per animation type
const TYPE_SUGGESTIONS: Record<VideoAnimationType, { icon: string; text: string }[]> = {
  "motion-graphics": [
    { icon: "◈", text: "Tạo video motion graphics 15s về AI workflow, gradient xanh-tím, animated shapes" },
    { icon: "◈", text: "Video motion graphics 12s giới thiệu startup tech, cinematic, dark theme" },
  ],
  "kinetic-typography": [
    { icon: "T↑", text: "Tạo video kinetic typography 10s với text động mạnh về 'Tương lai của AI'" },
    { icon: "T↑", text: "Video chữ động 12s về 5 facts thú vị, mỗi từ bay vào màn hình" },
  ],
  "infographic": [
    { icon: "📊", text: "Tạo infographic video 15s hiển thị 3 thống kê tăng trưởng: 97%, 10x, $1.2M" },
    { icon: "📊", text: "Video data viz 12s so sánh hiệu suất Q1-Q4 với bar chart động" },
  ],
  "logo-animation": [
    { icon: "◎", text: "Tạo logo animation 8s cho brand 'TLK Factory', chữ xuất hiện từng nét, màu xanh" },
    { icon: "◎", text: "Logo reveal animation 10s: vòng tròn vẽ ra → logo xuất hiện → tagline fade in" },
  ],
  "flat-3d": [
    { icon: "⬡", text: "Tạo video 3D flat 12s về product features, card flip animation, màu xanh-trắng" },
    { icon: "⬡", text: "Video isometric animation 15s về tech infrastructure với các cube 3D" },
  ],
  "neon-cyberpunk": [
    { icon: "⚡", text: "Tạo video neon cyberpunk 12s về Bitcoin crypto, chữ phát sáng cyan, particle effects" },
    { icon: "⚡", text: "Video cyberpunk 15s về AI agent network, scanlines, RGB split, dark background" },
  ],
};

const GENERIC_SUGGESTIONS = [
  { icon: "⚡", text: "Tạo video neon cyberpunk 12s về AI Agent, chữ phát sáng xanh lam, particles" },
  { icon: "T↑", text: "Kinetic typography 10s: '5 lý do chọn chúng tôi', chữ bay vào từng từ một" },
  { icon: "📊", text: "Infographic 15s: thống kê tăng trưởng công ty — 97% satisfaction, 10x revenue" },
  { icon: "◎", text: "Logo animation 8s: vẽ từng nét logo → xuất hiện tên brand → tagline" },
];

// ── Message bubble ───────────────────────────────────────────────

function MessageBubble({ msg, isNew }: { msg: ChatMessage; isNew?: boolean }) {
  const renderContent = (text: string) =>
    text.split("\n").map((line, i) => {
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

  if (msg.role === "user") {
    return (
      <div className={cn("flex justify-end mb-5", isNew && "animate-slide-in-right")}>
        <div className="max-w-[75%] px-4 py-3 tlk-gradient rounded-2xl rounded-tr-sm text-white text-sm shadow-sm shadow-[#3A5AF7]/20">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.role === "assistant") {
    return (
      <div className={cn("flex gap-3 mb-5", isNew && "animate-fade-in-up")}>
        <div className="shrink-0 w-8 h-8 rounded-xl tlk-gradient flex items-center justify-center shadow-sm">
          <Image src="/logotlk.png" alt="AI" width={20} height={20} className="rounded object-contain" />
        </div>
        <div className="max-w-[75%]">
          <div className="px-4 py-3 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm text-[#0F172A] text-sm shadow-sm">
            {renderContent(msg.content)}
          </div>
          {msg.videoId && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#7C3AED] font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Video đã tạo — vào tab Videos để Render
            </div>
          )}
          <p className="text-[11px] text-[#CBD5E1] mt-1 ml-1">{formatDate(msg.createdAt)}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Animation type button ────────────────────────────────────────

function TypeButton({
  typeKey,
  active,
  onClick,
}: {
  typeKey: VideoAnimationType;
  active: boolean;
  onClick: () => void;
}) {
  const info = VIDEO_ANIMATION_TYPES[typeKey];
  return (
    <button
      onClick={onClick}
      title={info.description}
      className={cn(
        "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap",
        active
          ? "text-white border-transparent shadow-sm"
          : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]"
      )}
      style={active ? { backgroundColor: info.color, boxShadow: `0 2px 12px ${info.color}55` } : {}}
    >
      <span className="text-[13px] leading-none">{info.icon}</span>
      {info.label}
    </button>
  );
}

// ── Typing indicator ─────────────────────────────────────────────

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex gap-3 mb-5 animate-fade-in-up">
      <div className="shrink-0 w-8 h-8 rounded-xl tlk-gradient flex items-center justify-center">
        <Image src="/logotlk.png" alt="AI" width={20} height={20} className="rounded object-contain" />
      </div>
      <div className="px-4 py-3 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce opacity-60"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-[11px] text-[#94A3B8] font-medium">{label}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export function ChatInterface({
  projectId,
  messages,
  onMessageSent,
  onClearChat,
  provider,
  model,
  modelLabel,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingLabel, setSendingLabel] = useState("Đang xử lý...");
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedType, setSelectedType] = useState<VideoAnimationType | null>(null);
  const [lastMsgId, setLastMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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
    setConfirmClear(false);

    // Detect if this looks like a video creation request
    const isVideo = /tạo|create|video|animation|motion|render|kinetic|infographic|logo|neon|cyberpunk/i.test(trimmed);
    setSendingLabel(isVideo ? "Đang tạo video code..." : "Đang trả lời...");

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticUserMsg: ChatMessage = {
      id: optimisticId,
      role: "user",
      content: trimmed,
      status: "done",
      createdAt: new Date().toISOString(),
    };
    setLastMsgId(optimisticId);
    onMessageSent(optimisticUserMsg, null as unknown as ChatMessage, null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: trimmed,
          generationMode: "ai-code",
          videoType: selectedType,
          ...(provider && { provider }),
          ...(model && { model }),
        }),
      });
      const data = await res.json() as { message?: ChatMessage; videoId?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Có lỗi xảy ra");
      if (data.message) {
        setLastMsgId(data.message.id);
        onMessageSent(null as unknown as ChatMessage, data.message, data.videoId ?? null);
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

  function handleTypeSelect(type: VideoAnimationType) {
    setSelectedType(prev => prev === type ? null : type);
    textareaRef.current?.focus();
  }

  const showWelcome = messages.length === 0;
  const activeSuggestions = selectedType ? TYPE_SUGGESTIONS[selectedType] : GENERIC_SUGGESTIONS;
  const activeTypeInfo = selectedType ? VIDEO_ANIMATION_TYPES[selectedType] : null;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFF]">

      {/* Chat toolbar */}
      {!showWelcome && (
        <div className="shrink-0 flex items-center justify-between px-6 py-2 border-b border-[#F1F5F9] bg-white">
          {/* Left: current model indicator */}
          {modelLabel && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              {modelLabel}
            </div>
          )}
          {!modelLabel && <div />}

          {/* Right: clear chat */}
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B]">Xóa toàn bộ lịch sử?</span>
              <button
                onClick={() => { onClearChat(); setConfirmClear(false); }}
                className="px-2.5 py-1 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-medium transition-colors"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] text-xs font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa lịch sử
            </button>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">

        {/* Welcome screen */}
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl tlk-gradient flex items-center justify-center shadow-lg shadow-[#3A5AF7]/25">
                <Image src="/logotlk.png" alt="TLK AI" width={40} height={40} className="rounded-lg object-contain" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">TLK Factory AI</h3>
              <p className="text-[#94A3B8] text-sm max-w-xs">
                Chọn loại animation, mô tả video, AI sẽ tự render MP4 cho bạn
              </p>
              {modelLabel && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full text-[11px] text-[#10B981] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  {modelLabel}
                </div>
              )}
            </div>

            {/* Animation type grid */}
            <div className="w-full max-w-lg">
              <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-widest mb-3 text-center">
                Chọn loại animation
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(VIDEO_ANIMATION_TYPES) as VideoAnimationType[]).map((type) => {
                  const info = VIDEO_ANIMATION_TYPES[type];
                  const isActive = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                        isActive
                          ? "border-transparent text-white shadow-md"
                          : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm"
                      )}
                      style={isActive ? { backgroundColor: info.color, boxShadow: `0 4px 16px ${info.color}44` } : {}}
                    >
                      <span className="text-xl shrink-0">{info.icon}</span>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold leading-tight truncate", isActive ? "text-white" : "text-[#0F172A]")}>
                          {info.label}
                        </p>
                        <p className={cn("text-[10px] leading-tight mt-0.5 line-clamp-1", isActive ? "text-white/80" : "text-[#94A3B8]")}>
                          {info.description}
                        </p>
                      </div>
                      {isActive && (
                        <svg className="w-4 h-4 text-white/80 shrink-0 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggestion prompts */}
            <div className="w-full max-w-lg">
              <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-widest mb-3 text-center">
                {selectedType ? `Gợi ý cho ${activeTypeInfo?.label}` : "Thử ngay"}
              </p>
              <div className="space-y-2">
                {activeSuggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => void sendMessage(prompt.text)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-white border border-[#E2E8F0] rounded-xl transition-all group hover:border-[#CBD5E1] hover:shadow-sm"
                  >
                    <span className="text-base w-6 text-center shrink-0 opacity-50">{prompt.icon}</span>
                    <span className="text-sm text-[#475569] group-hover:text-[#0F172A] transition-colors flex-1 text-left">
                      {prompt.text}
                    </span>
                    <svg className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#64748B] ml-auto shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isNew={msg.id === lastMsgId} />
        ))}

        {/* Typing indicator */}
        {sending && <TypingIndicator label={sendingLabel} />}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mb-3 px-4 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#EF4444] text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="shrink-0 hover:opacity-70 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-6 pb-5 bg-[#F8FAFF]">

        {/* Type selector strip */}
        <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => { setSelectedType(null); textareaRef.current?.focus(); }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap",
              !selectedType
                ? "tlk-gradient text-white border-transparent shadow-sm"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
            )}
          >
            All types
          </button>
          {(Object.keys(VIDEO_ANIMATION_TYPES) as VideoAnimationType[]).map((type) => (
            <TypeButton key={type} typeKey={type} active={selectedType === type} onClick={() => handleTypeSelect(type)} />
          ))}
        </div>

        <div className={cn(
          "flex items-end gap-3 bg-white border rounded-2xl px-4 py-3 transition-all shadow-sm",
          sending
            ? "border-[#E2E8F0]"
            : activeTypeInfo
              ? "border-[#E2E8F0] focus-within:shadow-md"
              : "border-[#E2E8F0] focus-within:border-[#7C3AED] focus-within:shadow-md focus-within:shadow-[#7C3AED]/10"
        )}>
          {/* Active type indicator */}
          {activeTypeInfo && (
            <div
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: activeTypeInfo.color }}
            >
              {activeTypeInfo.icon}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={
              activeTypeInfo
                ? `Mô tả video ${activeTypeInfo.label.toLowerCase()}... (Enter gửi)`
                : "Mô tả video bạn muốn tạo... (Enter gửi · Shift+Enter xuống dòng)"
            }
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
                ? "text-white shadow-sm hover:opacity-90 active:scale-95"
                : "bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed"
            )}
            style={
              input.trim() && !sending
                ? { backgroundColor: activeTypeInfo?.color ?? "#3A5AF7", boxShadow: `0 2px 8px ${activeTypeInfo?.color ?? "#3A5AF7"}44` }
                : {}
            }
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
          TLK Factory
          {modelLabel && <span className="ml-1">· {modelLabel}</span>}
          {!modelLabel && " · AI Motion Graphics"}
        </p>
      </div>
    </div>
  );
}
