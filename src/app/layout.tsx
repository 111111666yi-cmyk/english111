import type { Metadata } from "next";
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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
