import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorldCupView",
  description: "2026 美加墨世界杯赛程、对阵、球员、球队、舆情与模拟投注总览。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
