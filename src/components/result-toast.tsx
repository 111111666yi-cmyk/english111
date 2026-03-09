"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ResultToast({
  visible,
  correct,
  text
}: {
  visible: boolean;
  correct: boolean;
  text: string;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className={cn(
            "rounded-3xl px-4 py-3 text-sm font-medium shadow-soft",
            correct ? "bg-emerald-500 text-white" : "bg-amber-400 text-ink"
          )}
        >
          {text}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
