"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { HomeScreen } from "@/features/home/home-screen";
import { useAuthStore } from "@/stores/auth-store";

function LoggedInSplash() {
  return (
    <main className="min-h-screen bg-hero-mesh px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-5 text-center"
        >
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <motion.div
              animate={{ opacity: [0.16, 0.42, 0.16], scale: [0.94, 1.08, 0.94] }}
              transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-16px] rounded-[2.5rem] bg-[radial-gradient(circle,rgba(149,200,255,0.24),rgba(149,200,255,0))]"
            />
            <BrandMark animated className="h-28 w-28" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-surge">Open English</p>
            <p className="text-sm text-slate-500">正在进入基础-单词...</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const [redirectReady, setRedirectReady] = useState(false);

  useEffect(() => {
    if (!hydrated || !currentUsername) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRedirectReady(true);
      router.replace("/vocabulary");
    }, 560);

    return () => window.clearTimeout(timer);
  }, [currentUsername, hydrated, router]);

  if (!hydrated) {
    return null;
  }

  if (currentUsername) {
    return redirectReady ? null : <LoggedInSplash />;
  }

  return <HomeScreen />;
}
