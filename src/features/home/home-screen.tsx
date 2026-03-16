"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

const initialForm = {
  username: "",
  password: ""
};

function BrandPulse() {
  return (
    <div className="relative flex items-center justify-center py-7">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative flex h-32 w-32 items-center justify-center"
      >
        <motion.div
          animate={{ opacity: [0.24, 0.48, 0.24], scale: [0.94, 1.06, 0.94] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-14px] rounded-[2.7rem] bg-[radial-gradient(circle,rgba(111,161,255,0.2),rgba(111,161,255,0))]"
        />
        <motion.div
          animate={{ opacity: [0.12, 0.32, 0.12], scale: [0.92, 1.12, 0.92] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.18 }}
          className="absolute inset-[-28px] rounded-[3rem] border border-white/45"
        />
        <BrandMark animated className="h-32 w-32" />
      </motion.div>
    </div>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const users = useAuthStore((state) => state.users);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "register">(users.length ? "login" : "register");

  const title = mode === "login" ? "登录本地账号" : "创建本地账号";
  const buttonLabel = mode === "login" ? "登录" : "注册";
  const switchLabel = mode === "login" ? "没有账号？去注册" : "已有账号？去登录";

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.username.localeCompare(right.username)),
    [users]
  );

  const submit = async () => {
    setBusy(true);
    const action = mode === "login" ? login : register;
    const result = await action(form.username, form.password);
    setMessage(result.message ?? (result.ok ? "操作成功。" : "操作失败。"));
    setBusy(false);

    if (result.ok) {
      router.replace("/vocabulary");
    }
  };

  return (
    <main className="min-h-screen bg-hero-mesh px-4 py-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <div className="w-full space-y-4">
          <BrandPulse />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut", delay: 0.08 }}
            className="space-y-2 text-center"
          >
            <p className="text-sm font-semibold text-surge">Open English v1.3</p>
            <h1 className="text-3xl font-black tracking-[-0.03em] text-ink">{title}</h1>
            <p className="text-sm leading-6 text-slate-500">
              首次打开进入登录流，已登录用户会直接进入基础-单词。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: "easeOut", delay: 0.14 }}
          >
            <Card className="space-y-4 rounded-[1.5rem] p-4">
              <div className="space-y-3">
                <input
                  data-testid="auth-username"
                  value={form.username}
                  onChange={(event) => setForm((state) => ({ ...state, username: event.target.value }))}
                  autoComplete="username"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-surge"
                  placeholder="账号"
                />
                <input
                  data-testid="auth-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-surge"
                  placeholder="密码"
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={busy}
                data-testid="auth-submit"
                onClick={() => {
                  void submit();
                }}
              >
                {busy ? "处理中..." : buttonLabel}
              </Button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  data-testid="auth-switch-mode"
                  className="text-sm font-medium text-slate-500 transition hover:text-ink"
                  onClick={() => {
                    setMode((current) => (current === "login" ? "register" : "login"));
                    setMessage("");
                  }}
                >
                  {switchLabel}
                </button>
              </div>

              {message ? <p className="text-sm text-slate-500">{message}</p> : null}

              {sortedUsers.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">本地账号</p>
                  <div className="flex flex-wrap gap-2">
                    {sortedUsers.map((user) => (
                      <button
                        key={user.username}
                        type="button"
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                        onClick={() =>
                          setForm((state) => ({
                            ...state,
                            username: user.username
                          }))
                        }
                      >
                        {user.nickname || user.username}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
