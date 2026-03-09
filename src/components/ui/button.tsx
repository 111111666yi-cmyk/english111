import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-surge to-sky text-white shadow-glass hover:translate-y-[-1px]",
  secondary: "bg-white/80 text-ink ring-1 ring-slate-200 hover:bg-white",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  success:
    "bg-gradient-to-r from-glow to-peach text-ink shadow-soft hover:translate-y-[-1px]"
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
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
