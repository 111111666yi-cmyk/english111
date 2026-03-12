"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";

const initialForm = {
  username: "",
  password: ""
};

export function AccountScreen() {
  const [registerForm, setRegisterForm] = useState(initialForm);
  const [loginForm, setLoginForm] = useState(initialForm);
  const [registerMessage, setRegisterMessage] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [registerBusy, setRegisterBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);

  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const sessionExpiresAt = useAuthStore((state) => state.sessionExpiresAt);
  const users = useAuthStore((state) => state.users);
  const register = useAuthStore((state) => state.register);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const favoriteWords = useLearningStore((state) => state.favoriteWords.length);
  const knownWords = useLearningStore((state) => state.knownWords.length);
  const difficultWords = useLearningStore((state) => state.difficultWords.length);
  const completedPassages = useLearningStore((state) => state.completedPassageIds.length);

  const accountSummary = useMemo(
    () => [
      { label: "已掌握单词", value: knownWords },
      { label: "收藏词汇", value: favoriteWords },
      { label: "待复习词", value: difficultWords },
      { label: "已读短文", value: completedPassages }
    ],
    [completedPassages, difficultWords, favoriteWords, knownWords]
  );

  const submitRegister = async () => {
    setRegisterBusy(true);
    const result = await register(registerForm.username, registerForm.password);
    setRegisterMessage(result.message ?? (result.ok ? "本地账户已创建。" : "创建失败。"));

    if (result.ok) {
      setRegisterForm(initialForm);
      setLoginForm(initialForm);
    }

    setRegisterBusy(false);
  };

  const submitLogin = async () => {
    setLoginBusy(true);
    const result = await login(loginForm.username, loginForm.password);
    setLoginMessage(result.message ?? (result.ok ? "已切换到本地账户。" : "切换失败。"));

    if (result.ok) {
      setLoginForm(initialForm);
    }

    setLoginBusy(false);
  };

  const sessionExpiryText = sessionExpiresAt
    ? new Date(sessionExpiresAt).toLocaleString("zh-CN", { hour12: false })
    : "未开启";

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Account"
          title="本地轻量账户"
          description="当前账户系统只用于本机多账户切换和学习记录隔离，不是正式云端账户体系。"
        />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-ink">
                  {authHydrated ? (currentUsername ? currentUsername : "访客模式") : "正在加载账户"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {authHydrated
                    ? currentUsername
                      ? `当前账户的轻量续登截止时间：${sessionExpiryText}。到期、手动退出或清理浏览器缓存后，都需要重新登录。`
                      : "当前没有登录账户，系统会使用访客数据。"
                    : "正在恢复本地账户和学习记录。"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/vocabulary">
                  <Button>继续学习</Button>
                </Link>
                {authHydrated && currentUsername ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={logout}
                    data-testid="account-logout"
                  >
                    退出到访客
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {accountSummary.map((item) => (
                <div key={item.label} className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-black text-ink">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-sky/10 p-4">
              <p className="text-sm font-semibold text-sky-700">本地轻量认证说明</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                当前浏览器只保存本地账户名、创建时间和轻量续登时间，不会继续持久化密码摘要或盐值。
                这不是强安全账户系统，不适合存储敏感密码；如果后续升级为云端账户，再迁移安全模型。
              </p>
            </div>
          </Card>

          <div className="grid gap-4">
            <Card className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-ink">创建本地账户</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  新账户会从零开始。这里的口令只用于本地创建和切换流程，不适合当作敏感密码长期保管。
                </p>
              </div>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitRegister();
                }}
              >
                <label htmlFor="register-username" className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">用户名</span>
                  <input
                    id="register-username"
                    autoComplete="username"
                    value={registerForm.username}
                    onChange={(event) =>
                      setRegisterForm((state) => ({ ...state, username: event.target.value }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-surge"
                    placeholder="例如 reader01"
                    data-testid="register-username"
                  />
                </label>
                <label htmlFor="register-password" className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">确认口令</span>
                  <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((state) => ({ ...state, password: event.target.value }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-surge"
                    placeholder="至少 6 位"
                    data-testid="register-password"
                  />
                </label>
                <Button type="submit" disabled={registerBusy} data-testid="register-submit">
                  {registerBusy ? "创建中..." : "创建并进入"}
                </Button>
              </form>
              {registerMessage ? <p className="text-sm text-slate-500">{registerMessage}</p> : null}
            </Card>

            <Card className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-ink">切换已有账户</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  这里只用于切换当前设备上的本地账户，并刷新 7 天轻量续登时间。
                </p>
              </div>
              {users.length ? (
                <div className="flex flex-wrap gap-2">
                  {users.map((user) => (
                    <button
                      key={user.username}
                      type="button"
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                      onClick={() =>
                        setLoginForm((state) => ({
                          ...state,
                          username: user.username
                        }))
                      }
                    >
                      {user.username}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">当前浏览器里还没有创建本地账户。</p>
              )}
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitLogin();
                }}
              >
                <label htmlFor="login-username" className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">用户名</span>
                  <input
                    id="login-username"
                    autoComplete="username"
                    value={loginForm.username}
                    onChange={(event) =>
                      setLoginForm((state) => ({ ...state, username: event.target.value }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-surge"
                    placeholder="输入已有用户名"
                    data-testid="login-username"
                  />
                </label>
                <label htmlFor="login-password" className="space-y-2">
                  <span className="text-sm font-medium text-slate-600">确认口令</span>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((state) => ({ ...state, password: event.target.value }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-surge"
                    placeholder="用于确认本地切换"
                    data-testid="login-password"
                  />
                </label>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={loginBusy}
                  data-testid="login-submit"
                >
                  {loginBusy ? "切换中..." : "切换账户"}
                </Button>
              </form>
              {loginMessage ? <p className="text-sm text-slate-500">{loginMessage}</p> : null}
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
