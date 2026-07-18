import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  trustScore?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (accessToken, user, refreshToken) => {
        set({ accessToken, refreshToken: refreshToken ?? null, user, isAuthenticated: true });
        // Also set a cookie so middleware can read auth state
        setCookie('aegispay-auth', JSON.stringify({ state: { accessToken, user } }));
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        deleteCookie('aegispay-auth');
      },
    }),
    { name: 'aegispay-auth', partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken }) },
  ),
);
