"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createPasswordHash, verifyPasswordHash } from "@/lib/password";
import { useLearningStore } from "@/stores/learning-store";

export interface LocalUserAccount {
  username: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthState {
  hydrated: boolean;
  users: LocalUserAccount[];
  currentUsername?: string;
  register: (username: string, password: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function validateCredentials(username: string, password: string) {
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      users: [],
      currentUsername: undefined,
      register: async (username, password) => {
        const validation = validateCredentials(username, password);
        if (!validation.ok) {
          return validation;
        }

        const normalized = normalizeUsername(username);
        const existing = get().users.find((item) => item.username === normalized);

        if (existing) {
          return {
            ok: false,
            message: "该用户名已存在，请直接登录。"
          };
        }

        const passwordRecord = await createPasswordHash(password);

        set((state) => ({
          users: [
            ...state.users,
            {
              username: normalized,
              passwordHash: passwordRecord.hash,
              passwordSalt: passwordRecord.salt,
              createdAt: new Date().toISOString()
            }
          ],
          currentUsername: normalized,
          hydrated: true
        }));
        useLearningStore.getState().hydrateForProfile(getActiveProfileKey(normalized));

        return {
          ok: true,
          message: "账户已创建，已自动登录。"
        };
      },
      login: async (username, password) => {
        const normalized = normalizeUsername(username);
        const account = get().users.find((item) => item.username === normalized);

        if (!account) {
          return {
            ok: false,
            message: "没有找到这个账户。"
          };
        }

        const valid = await verifyPasswordHash(password, {
          hash: account.passwordHash,
          salt: account.passwordSalt
        });

        if (!valid) {
          return {
            ok: false,
            message: "密码不正确。"
          };
        }

        set({ currentUsername: normalized, hydrated: true });
        useLearningStore.getState().hydrateForProfile(getActiveProfileKey(normalized));

        return {
          ok: true,
          message: "登录成功。"
        };
      },
      logout: () => {
        set({ currentUsername: undefined, hydrated: true });
        useLearningStore.getState().hydrateForProfile(getActiveProfileKey(undefined));
      }
    }),
    {
      name: "english-climb-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        users: state.users,
        currentUsername: state.currentUsername
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      }
    }
  )
);
