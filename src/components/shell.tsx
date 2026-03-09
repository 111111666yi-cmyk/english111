import type { PropsWithChildren } from "react";
import { Navbar } from "@/components/navbar";

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
