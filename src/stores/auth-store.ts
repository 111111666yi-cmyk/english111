"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useLearningStore } from "@/stores/learning-store";

const AUTH_STORAGE_VERSION = 2;
const AUTH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface LocalUserProfile {
  username: string;
  createdAt: string;
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
  logout: () => void;
}

type PersistedAuthUser = {
  username?: string;
  createdAt?: string;
  passwordHash?: string;
  passwordSalt?: string;
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
          : new Date().toISOString()
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
      message: "确认口令至少需要 6 位。"
    } satisfies AuthResult;
  }

  return { ok: true } satisfies AuthResult;
}

export function getActiveProfileKey(username?: string) {
  return username ? normalizeUsername(username) : "guest";
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
            message: "该本机档案已存在，请直接切换。"
          };
        }

        set((state) => ({
          users: [
            ...state.users,
            {
              username: normalized,
              createdAt: new Date().toISOString()
            }
          ],
          currentUsername: normalized,
          sessionExpiresAt: nextSessionExpiry(),
          hydrated: true
        }));
        useLearningStore.getState().hydrateForProfile(getActiveProfileKey(normalized));

        return {
          ok: true,
          message: "本机档案已创建，并启用了 7 天轻量续登。"
        };
      },
      login: async (username, password) => {
        const normalized = normalizeUsername(username);
        const account = get().users.find((item) => item.username === normalized);

        if (!account) {
          return {
            ok: false,
            message: "没有找到这个本机档案。"
          };
        }

        if (password.trim().length < 6) {
          return {
            ok: false,
            message: "本机续登至少输入 6 位确认口令。"
          };
        }

        set({
          currentUsername: normalized,
          sessionExpiresAt: nextSessionExpiry(),
          hydrated: true
        });
        useLearningStore.getState().hydrateForProfile(getActiveProfileKey(normalized));

        return {
          ok: true,
          message: "已切换到本机档案，并刷新轻量续登有效期。"
        };
      },
      logout: () => {
        set({
          currentUsername: undefined,
          sessionExpiresAt: undefined,
          hydrated: true
        });
        useLearningStore.getState().hydrateForProfile(getActiveProfileKey(undefined));
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
