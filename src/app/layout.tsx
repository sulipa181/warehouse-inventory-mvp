import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小倉庫手機盤點系統",
  description: "手機盤點、Excel 匯入與差異比對 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
