"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Đăng nhập thất bại"); return; }
      router.push("/");
      router.refresh();
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-[0_4px_32px_rgba(59,130,246,0.10)] border border-[#E2E8F0] overflow-hidden">

        {/* Header gradient */}
        <div className="h-1.5 tlk-gradient" />

        <div className="px-8 pt-8 pb-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] flex items-center justify-center overflow-hidden">
              <Image src="/logotlk.png" alt="TLK" width={28} height={28} style={{ width: 28, height: "auto" }} className="object-contain" />
            </div>
            <div>
              <p className="font-bold text-[16px] text-[#0F172A] leading-none">TLK Factory</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Content Platform</p>
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-[#0F172A] mb-1">Chào mừng trở lại!</h1>
          <p className="text-[13.5px] text-[#64748B] mb-7">Đăng nhập để tiếp tục tạo video</p>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 text-[13px] text-[#DC2626]">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[13.5px] placeholder-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#374151] mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] text-[#0F172A] text-[13.5px] placeholder-[#CBD5E1] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                >
                  {showPw ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-[14px] tlk-gradient hover:opacity-90 transition-opacity shadow-md shadow-[#3B82F6]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-[#94A3B8] mt-6">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-[#3B82F6] font-semibold hover:text-[#2563EB]">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#CBD5E1] mt-5">
        © {new Date().getFullYear()} TLK Factory Content — by{" "}
        <span className="tlk-gradient-text font-semibold">Nguyễn Hoàng Khải</span>
      </p>
    </div>
  );
}
