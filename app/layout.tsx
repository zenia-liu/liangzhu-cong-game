import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "众手成琮｜良渚玉琮王交互预览",
  description: "可自由选幕的良渚玉琮王剧情与交互原型。",
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
