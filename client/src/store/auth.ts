import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId?: string;
  branchId?: string;
  forcePasswordChange: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user: AuthUser, token: string) => {
        set({ user, token });
      },
      logout: () => {
        set({ user: null, token: null });
      },
      updateUser: (userData: Partial<AuthUser>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: "elite-scholar-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
