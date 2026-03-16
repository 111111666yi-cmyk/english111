"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useLearningStore } from "@/stores/learning-store";

const AUTH_STORAGE_VERSION = 2;
const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface LocalUserProfile {
  username: string;
  createdAt: string;
  nickname?: string;
  avatarDataUrl?: string;
}

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthState {
  hydrated: boolean;
  users: LocalUserProfile[];
  currentUsername?: string;
  sessionExpiresAt?: string;
  register: (username: string, password: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
  switchAccount: (username: string) => AuthResult;
  logout: () => void;
  updateProfile: (payload: { nickname?: string; avatarDataUrl?: string }) => void;
}

type PersistedAuthUser = {
  username?: string;
  createdAt?: string;
  nickname?: string;
  avatarDataUrl?: string;
};

type PersistedAuthState = {
  users?: PersistedAuthUser[];
  currentUsername?: string;
  sessionExpiresAt?: string;
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function nextSessionExpiry(now = new Date()) {
  return new Date(now.getTime() + AUTH_SESSION_TTL_MS).toISOString();
}

function isSessionValid(sessionExpiresAt?: string) {
  if (!sessionExpiresAt) {
    return false;
  }

  return Date.parse(sessionExpiresAt) > Date.now();
}

function sanitizeProfiles(users?: PersistedAuthUser[]) {
  if (!Array.isArray(users)) {
    return [] as LocalUserProfile[];
  }

  return users
    .map((user) => ({
      username: normalizeUsername(user?.username ?? ""),
      createdAt:
        typeof user?.createdAt === "string" && user.createdAt.trim()
          ? user.createdAt
          : new Date().toISOString(),
      nickname: typeof user?.nickname === "string" ? user.nickname.trim() : "",
      avatarDataUrl: typeof user?.avatarDataUrl === "string" ? user.avatarDataUrl : ""
    }))
    .filter((user) => user.username);
}

function migratePersistedAuth(persisted: unknown) {
  if (!persisted || typeof persisted !== "object") {
    return {
      users: [],
      currentUsername: undefined,
      sessionExpiresAt: undefined
    } satisfies PersistedAuthState;
  }

  const raw = persisted as PersistedAuthState;
  const users = sanitizeProfiles(raw.users);
  const currentUsername =
    typeof raw.currentUsername === "string" && raw.currentUsername.trim()
      ? normalizeUsername(raw.currentUsername)
      : undefined;
  const sessionExpiresAt =
    typeof raw.sessionExpiresAt === "string" && raw.sessionExpiresAt.trim()
      ? raw.sessionExpiresAt
      : undefined;

  return {
    users,
    currentUsername,
    sessionExpiresAt
  } satisfies PersistedAuthState;
}

function validateRegistration(username: string, password: string) {
  const normalized = normalizeUsername(username);

  if (!/^[a-z0-9_-]{3,20}$/.test(normalized)) {
    return {
      ok: false,
      message: "用户名需为 3 到 20 位，仅支持字母、数字、下划线和短横线。"
    } satisfies AuthResult;
  }

  if (password.trim().length < 6) {
    return {
      ok: false,
      message: "密码至少需要 6 位。"
    } satisfies AuthResult;
  }

  return { ok: true } satisfies AuthResult;
}

export function getActiveProfileKey(username?: string) {
  return username ? normalizeUsername(username) : "guest";
}

function enterProfile(username?: string) {
  useLearningStore.getState().hydrateForProfile(getActiveProfileKey(username));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      users: [],
      currentUsername: undefined,
      sessionExpiresAt: undefined,
      register: async (username, password) => {
        const validation = validateRegistration(username, password);
        if (!validation.ok) {
          return validation;
        }

        const normalized = normalizeUsername(username);
        const existing = get().users.find((item) => item.username === normalized);

        if (existing) {
          return {
            ok: false,
            message: "该本地账号已存在，请直接登录。"
          };
        }

        set((state) => ({
          users: [
            ...state.users,
            {
              username: normalized,
              createdAt: new Date().toISOString(),
              nickname: normalized,
              avatarDataUrl: ""
            }
          ],
          currentUsername: normalized,
          sessionExpiresAt: nextSessionExpiry(),
          hydrated: true
        }));

        enterProfile(normalized);

        return {
          ok: true,
          message: "账号已创建，并自动进入登录态。"
        };
      },
      login: async (username, password) => {
        const normalized = normalizeUsername(username);
        const account = get().users.find((item) => item.username === normalized);

        if (!account) {
          return {
            ok: false,
            message: "没有找到这个本地账号。"
          };
        }

        if (password.trim().length < 6) {
          return {
            ok: false,
            message: "密码至少需要 6 位。"
          };
        }

        set({
          currentUsername: normalized,
          sessionExpiresAt: nextSessionExpiry(),
          hydrated: true
        });

        enterProfile(normalized);

        return {
          ok: true,
          message: "登录成功。"
        };
      },
      switchAccount: (username) => {
        const normalized = normalizeUsername(username);
        const account = get().users.find((item) => item.username === normalized);

        if (!account) {
          return {
            ok: false,
            message: "未找到要切换的账号。"
          };
        }

        set({
          currentUsername: normalized,
          sessionExpiresAt: nextSessionExpiry(),
          hydrated: true
        });

        enterProfile(normalized);

        return {
          ok: true,
          message: "已切换账号。"
        };
      },
      logout: () => {
        set({
          currentUsername: undefined,
          sessionExpiresAt: undefined,
          hydrated: true
        });
        enterProfile(undefined);
      },
      updateProfile: ({ nickname, avatarDataUrl }) => {
        const currentUsername = get().currentUsername;
        if (!currentUsername) {
          return;
        }

        set((state) => ({
          users: state.users.map((user) =>
            user.username === currentUsername
              ? {
                  ...user,
                  nickname: typeof nickname === "string" ? nickname.trim() : user.nickname,
                  avatarDataUrl: typeof avatarDataUrl === "string" ? avatarDataUrl : user.avatarDataUrl
                }
              : user
          )
        }));
      }
    }),
    {
      name: "english-climb-auth",
      version: AUTH_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        users: state.users,
        currentUsername: state.currentUsername,
        sessionExpiresAt: state.sessionExpiresAt
      }),
      migrate: (persistedState) => migratePersistedAuth(persistedState),
      onRehydrateStorage: () => () => {
        const state = useAuthStore.getState();
        const keepSession = isSessionValid(state.sessionExpiresAt);

        useAuthStore.setState({
          hydrated: true,
          currentUsername: keepSession ? state.currentUsername : undefined,
          sessionExpiresAt: keepSession ? state.sessionExpiresAt : undefined
        });
      }
    }
  )
);
