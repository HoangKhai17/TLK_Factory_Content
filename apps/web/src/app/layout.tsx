import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TLK Factory Content",
  description: "AI-powered video automation platform by Nguyễn Hoàng Khải",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full bg-white text-[#0F172A] antialiased">{children}</body>
    </html>
  );
}
