"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({
  text,
  highlights,
  className
}: {
  text: string;
  highlights: string[];
  className?: string;
}) {
  const normalized = highlights
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  if (!normalized.length) {
    return <span className={className}>{text}</span>;
  }

  const pattern = new RegExp(`(${normalized.map(escapePattern).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const matched = normalized.some((item) => item.toLowerCase() === part.toLowerCase());

        return matched ? (
          <mark
            key={`${part}-${index}`}
            className={cn(
              "rounded-lg bg-glow/70 px-1.5 py-0.5 font-semibold text-ink shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]",
              className
            )}
          >
            {part}
          </mark>
        ) : (
          <Fragment key={`${part}-${index}`}>{part}</Fragment>
        );
      })}
    </span>
  );
}
