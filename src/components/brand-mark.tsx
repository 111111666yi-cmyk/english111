"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  animated?: boolean;
  glow?: boolean;
};

const orbitAnimation = {
  rotate: [0, 4, 0, -4, 0],
  scale: [1, 1.015, 1]
};

export function BrandMark({ className, animated = false, glow = true }: BrandMarkProps) {
  const icon = (
    <img
      src="/brand/brand-icon-extracted.png"
      alt=""
      aria-hidden="true"
      className="h-full w-full object-contain"
      draggable={false}
    />
  );

  return (
    <div
      className={cn(
        "relative isolate aspect-square overflow-visible",
        glow && "drop-shadow-[0_16px_34px_rgba(78,116,226,0.24)]",
        className
      )}
    >
      {glow ? (
        <>
          <div className="absolute inset-[12%] -z-10 rounded-[38%] bg-[#9EDFFF]/22 blur-xl" />
          <div className="absolute inset-[20%] -z-10 rounded-[42%] bg-[#6F8BFF]/18 blur-2xl" />
        </>
      ) : null}

      {animated ? (
        <motion.div
          animate={orbitAnimation}
          transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
          className="h-full w-full"
        >
          {icon}
        </motion.div>
      ) : (
        icon
      )}
    </div>
  );
}
