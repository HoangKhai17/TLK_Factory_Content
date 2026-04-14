import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TLK Factory Content",
  description: "AI-powered video automation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full bg-[#080810] text-white antialiased">{children}</body>
    </html>
  );
}
