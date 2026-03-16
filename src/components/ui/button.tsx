import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "neu-button bg-neu-primary text-white shadow-glass hover:text-white active:text-white",
  secondary:
    "neu-button bg-neu-secondary text-ink shadow-soft hover:text-ink active:text-ink",
  ghost:
    "neu-button bg-[linear-gradient(145deg,#edf1f5,#d6dbe1)] text-slate-700 shadow-soft hover:text-ink active:text-ink",
  success:
    "neu-button bg-neu-success text-ink shadow-soft hover:text-ink active:text-ink"
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-[1.15rem] px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition duration-200 will-change-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
