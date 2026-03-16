"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, Copy, ExternalLink, LogOut, Mail, RefreshCcw, UserRound, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTACT_EMAIL, OFFICIAL_WEBSITE_URL } from "@/lib/app-links";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";

type UtilityPanel = "site" | "contact" | null;

const entryItems = [
  { title: "资料编辑", href: "#profile-editor", description: "修改昵称和头像" },
  { title: "统计", href: "/stats", description: "查看学习概览" },
  { title: "成就", href: "/achievements", description: "查看进度与徽章" },
  { title: "设置", href: "/settings", description: "管理偏好与背景" },
  { title: "打开官网", action: "site", description: "查看官网链接并复制" },
  { title: "联系我", action: "contact", description: CONTACT_EMAIL }
] as const;

function formatExpiry(sessionExpiresAt?: string) {
  if (!sessionExpiresAt) {
    return "未登录";
  }

  return new Date(sessionExpiresAt).toLocaleString("zh-CN", { hour12: false });
}

async function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
}

export function AccountScreen() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [message, setMessage] = useState("");
  const [modeOpen, setModeOpen] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<UtilityPanel>(null);

  const hydrated = useAuthStore((state) => state.hydrated);
  const users = useAuthStore((state) => state.users);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const sessionExpiresAt = useAuthStore((state) => state.sessionExpiresAt);
  const logout = useAuthStore((state) => state.logout);
  const switchAccount = useAuthStore((state) => state.switchAccount);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const setActiveMode = useLearningStore((state) => state.setActiveMode);
  const knownWords = useLearningStore((state) => state.knownWords.length);
  const completedPassages = useLearningStore((state) => state.completedPassageIds.length);
  const lastVisitedTabs = useLearningStore((state) => state.userConfig.lastVisitedTabs);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes.length);

  const currentProfile = useMemo(
    () => users.find((user) => user.username === currentUsername),
    [currentUsername, users]
  );

  useEffect(() => {
    setNicknameDraft(currentProfile?.nickname || currentProfile?.username || "");
  }, [currentProfile]);

  const displayName = currentProfile?.nickname || currentUsername || "未登录";
  const otherAccounts = users.filter((user) => user.username !== currentUsername);
  const isLoggedIn = Boolean(currentUsername);

  const saveProfile = () => {
    updateProfile({ nickname: nicknameDraft });
    setMessage("资料已保存。");
  };

  const handleCopy = async (value: string, successMessage: string) => {
    const copied = await copyText(value).catch(() => false);
    setMessage(copied ? successMessage : "当前环境暂不支持复制，请手动复制。");
  };

  const handleSwitchAccount = (username: string) => {
    const result = switchAccount(username);
    setMessage(result.ok ? "已切换账号。" : result.message ?? "切换失败。");
  };

  const utilityTitle = utilityPanel === "site" ? "打开官网" : "联系我";
  const utilityValue = utilityPanel === "site" ? OFFICIAL_WEBSITE_URL : CONTACT_EMAIL;

  return (
    <Shell>
      <div className="space-y-3">
        <Card className="space-y-4 rounded-[1.5rem] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                data-testid="account-avatar-button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sky/15 ring-1 ring-white/70 transition hover:scale-[1.02]"
                aria-label="切换头像"
                disabled={!isLoggedIn}
              >
                {currentProfile?.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentProfile.avatarDataUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-500">
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">点击换头像</span>
                  </div>
                )}
              </button>

              <div className="min-w-0">
                <p className="truncate text-2xl font-black text-ink" data-testid="account-display-name">
                  {displayName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {hydrated ? (isLoggedIn ? "已登录" : "未登录") : "同步中"}
                </p>
                <p className="mt-1 text-xs text-slate-400">会话有效期：{formatExpiry(sessionExpiresAt)}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {isLoggedIn ? (
                <Button type="button" variant="secondary" onClick={logout} data-testid="account-logout">
                  <LogOut className="mr-1 h-4 w-4" />
                  退出
                </Button>
              ) : (
                <Link href="/">
                  <Button>前往登录</Button>
                </Link>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  updateProfile({ avatarDataUrl: reader.result });
                  setMessage("头像已更新。");
                }
              };
              reader.readAsDataURL(file);
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.2rem] bg-slate-50 px-3 py-3">
              <p className="text-sm text-slate-500">登录状态</p>
              <p className="mt-1 text-lg font-black text-ink">{isLoggedIn ? "本地账号在线" : "游客模式"}</p>
            </div>
            <button
              type="button"
              data-testid="account-mode-toggle"
              className="rounded-[1.2rem] bg-slate-50 px-3 py-3 text-left transition hover:shadow-soft"
              onClick={() => setModeOpen((value) => !value)}
            >
              <p className="text-sm text-slate-500">当前模式</p>
              <p className="mt-1 text-lg font-black text-ink">{activeMode === "simple" ? "简单模式" : "困难模式"}</p>
              <p className="mt-1 text-xs text-slate-500">点击展开切换</p>
            </button>
            <div className="rounded-[1.2rem] bg-slate-50 px-3 py-3">
              <p className="text-sm text-slate-500">已掌握词汇</p>
              <p className="mt-1 text-lg font-black text-ink">{knownWords}</p>
            </div>
            <div className="rounded-[1.2rem] bg-slate-50 px-3 py-3">
              <p className="text-sm text-slate-500">复习池</p>
              <p className="mt-1 text-lg font-black text-ink">{reviewMistakes}</p>
            </div>
          </div>

          <AnimatePresence>
            {modeOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="grid gap-2 sm:grid-cols-2"
              >
                <Button
                  type="button"
                  data-testid="account-mode-simple"
                  variant={activeMode === "simple" ? "primary" : "secondary"}
                  onClick={() => {
                    setActiveMode("simple");
                    setModeOpen(false);
                    setMessage("已切换到简单模式。");
                  }}
                >
                  简单模式
                </Button>
                <Button
                  type="button"
                  data-testid="account-mode-hard"
                  variant={activeMode === "hard" ? "primary" : "secondary"}
                  onClick={() => {
                    setActiveMode("hard");
                    setModeOpen(false);
                    setMessage("已切换到困难模式。");
                  }}
                >
                  困难模式
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div id="profile-editor" className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3 rounded-[1.25rem] border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-ink">资料编辑</p>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-500 transition hover:text-ink"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isLoggedIn}
                >
                  点击头像切换
                </button>
              </div>

              <input
                data-testid="account-nickname-input"
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-surge"
                placeholder="修改名字"
                disabled={!isLoggedIn}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="button" data-testid="account-save-profile" onClick={saveProfile} disabled={!isLoggedIn}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  保存资料
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    updateProfile({ avatarDataUrl: "", nickname: currentProfile?.username || "" });
                    setNicknameDraft(currentProfile?.username || "");
                    setMessage("资料已重置。");
                  }}
                  disabled={!isLoggedIn}
                >
                  <RefreshCcw className="mr-1 h-4 w-4" />
                  重置资料
                </Button>
              </div>

              {message ? <p className="text-sm text-slate-500">{message}</p> : null}
            </div>

            <div className="space-y-3 rounded-[1.25rem] border border-slate-200 p-3">
              <p className="text-sm font-bold text-ink">账号管理</p>
              {otherAccounts.length ? (
                <div className="space-y-2">
                  {otherAccounts.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-surge/40"
                      onClick={() => handleSwitchAccount(account.username)}
                    >
                      <span className="truncate text-sm font-semibold text-ink">
                        {account.nickname || account.username}
                      </span>
                      <UserRound className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">当前只有一个本地账号。</p>
              )}

              <Link href={lastVisitedTabs.basics}>
                <Button variant="secondary" className="w-full">
                  继续学习
                </Button>
              </Link>

              {!isLoggedIn ? (
                <Link href="/">
                  <Button className="w-full">前往登录 / 注册</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="space-y-3 rounded-[1.5rem] p-3.5">
          <p className="text-sm font-bold text-ink">功能入口</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {entryItems.map((item) =>
              "action" in item ? (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setUtilityPanel(item.action)}
                  className="rounded-2xl border bg-white px-3 py-3 text-left transition hover:border-surge/40"
                >
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </button>
              ) : item.href.startsWith("#") ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border bg-white px-3 py-3 text-left transition hover:border-surge/40"
                >
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </a>
              ) : (
                <Link key={item.href} href={item.href}>
                  <div className="rounded-2xl border bg-white px-3 py-3 text-left transition hover:border-surge/40">
                    <p className="text-sm font-bold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  </div>
                </Link>
              )
            )}
          </div>

          <div className="rounded-[1.2rem] bg-slate-50 px-3 py-3">
            <p className="text-sm text-slate-500">本地状态</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              最近进入：基础 {lastVisitedTabs.basics} / 已读短文 {completedPassages}
            </p>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {utilityPanel ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/22 px-4 pb-6 pt-20 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUtilityPanel(null)}
          >
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[1.75rem] border border-white/75 bg-[linear-gradient(145deg,#f7f9fb,#d8dde4)] p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-ink">{utilityTitle}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {utilityPanel === "site" ? "可复制官网链接，或直接打开官网。" : "可复制联系邮箱。"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUtilityPanel(null)}
                  className="rounded-2xl bg-white/75 p-2 text-slate-500 transition hover:text-ink"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-3xl bg-white/82 px-4 py-4">
                <p className="break-all text-sm leading-6 text-ink">{utilityValue}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    handleCopy(
                      utilityValue,
                      utilityPanel === "site" ? "官网链接已复制。" : "联系邮箱已复制。"
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制
                </Button>
                {utilityPanel === "site" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      window.open(OFFICIAL_WEBSITE_URL, "_blank", "noopener,noreferrer");
                      setMessage("官网已在新窗口打开。");
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    打开官网
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      void handleCopy(CONTACT_EMAIL, "联系邮箱已复制。");
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    复制邮箱
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Shell>
  );
}
