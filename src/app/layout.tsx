import type { Metadata, Viewport } from "next";
import { ClientProviders } from "@/components/client-providers";
import { withBasePath } from "@/lib/base-path";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "English Climb",
  description:
    "A lightweight bilingual English learning site focused on vocabulary, sentences, reading, and review.",
  icons: {
    icon: withBasePath("/favicon.svg")
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#edf5ff"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="app-frame">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
