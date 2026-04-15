import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

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
    <html lang="vi" className={`h-full ${poppins.variable}`}>
      <body className="h-full bg-white text-[#0F172A] antialiased" style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
