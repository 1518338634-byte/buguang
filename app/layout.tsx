import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowState",
  description: "AI creative incubation canvas for fragmented ideas."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
