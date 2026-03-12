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
    setRegisterMessage(result.message ?? (result.ok ? "账户已创建。" : "创建失败。"));

    if (result.ok) {
      setRegisterForm(initialForm);
      setLoginForm(initialForm);
    }

    setRegisterBusy(false);
  };

  const submitLogin = async () => {
    setLoginBusy(true);
    const result = await login(loginForm.username, loginForm.password);
    setLoginMessage(result.message ?? (result.ok ? "登录成功。" : "登录失败。"));

    if (result.ok) {
      setLoginForm(initialForm);
    }

    setLoginBusy(false);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Account"
          title="独立账户"
          description="每个账户使用独立的本地学习数据。未登录时会进入访客模式，数据不会继承其他账户。"
        />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-ink">
                  {authHydrated ? (currentUsername ? currentUsername : "访客模式") : "正在载入账户"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {authHydrated
                    ? currentUsername
                      ? "当前账户的数据会单独保存在本地浏览器，不会与其他账户互相覆盖。"
                      : "当前没有登录账户，系统会使用本设备上的访客数据。"
                    : "正在恢复本地账户和学习数据。"}
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
              <p className="text-sm font-semibold text-sky-700">本地安全说明</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                用户名和加盐后的密码摘要仅保存在当前浏览器，本版本不依赖服务器，不会上传到云端。
              </p>
            </div>
          </Card>

          <div className="grid gap-4">
            <Card className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-ink">注册新账户</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  新账户从零开始，推荐使用 3 到 20 位的英文用户名。
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
                  <span className="text-sm font-medium text-slate-600">密码</span>
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
                <Button
                  type="submit"
                  onClick={undefined}
                  disabled={registerBusy}
                  data-testid="register-submit"
                >
                  {registerBusy ? "创建中..." : "创建并登录"}
                </Button>
              </form>
              {registerMessage ? <p className="text-sm text-slate-500">{registerMessage}</p> : null}
            </Card>

            <Card className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-ink">登录已有账户</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  登录后会自动切换到该账户自己的学习数据。
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
                <p className="text-sm text-slate-500">当前浏览器里还没有注册账户。</p>
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
                  <span className="text-sm font-medium text-slate-600">密码</span>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((state) => ({ ...state, password: event.target.value }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-surge"
                    placeholder="输入密码"
                    data-testid="login-password"
                  />
                </label>
                <Button
                  type="submit"
                  variant="secondary"
                  onClick={undefined}
                  disabled={loginBusy}
                  data-testid="login-submit"
                >
                  {loginBusy ? "登录中..." : "登录并切换"}
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
