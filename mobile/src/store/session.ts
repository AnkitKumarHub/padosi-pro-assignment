import { create } from "zustand";
import { ApiError, errorMessage } from "@/api/client";
import { currentUser, type OnboardingStep, type Session } from "@/api/auth";
import { clearToken, getToken, saveToken } from "@/auth/session";

export type SessionUser = {
  id: number;
  email: string;
  onboardingStep: OnboardingStep;
};

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type SessionState = {
  status: SessionStatus;
  user: SessionUser | null;
  error: string | null;
  restore: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setOnboardingStep: (step: OnboardingStep) => void;
};

// The JWT itself stays in SecureStore; only the user summary lives here (SPEC T-016).
export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  user: null,
  error: null,

  restore: async () => {
    set({ status: "loading", error: null });
    try {
      const token = await getToken();
      if (!token) {
        set({ status: "unauthenticated", user: null });
        return;
      }

      const user = await currentUser(token);
      set({
        status: "authenticated",
        user: { id: user.id, email: user.email, onboardingStep: user.onboardingStep },
      });
    } catch (error) {
      // Only a rejected token ends the session. Being offline must not log the user out.
      if (error instanceof ApiError && error.status === 401) {
        await clearToken();
        set({ status: "unauthenticated", user: null });
        return;
      }
      set({ status: "error", error: errorMessage(error) });
    }
  },

  signIn: async (session) => {
    await saveToken(session.token);
    set({
      status: "authenticated",
      error: null,
      user: {
        id: session.user.id,
        email: session.user.email,
        onboardingStep: session.onboardingStep,
      },
    });
  },

  signOut: async () => {
    await clearToken();
    set({ status: "unauthenticated", user: null, error: null });
  },

  refreshSession: async () => {
    const token = await getToken();
    if (!token) {
      set({ status: "unauthenticated", user: null });
      return;
    }
    const user = await currentUser(token);
    set({
      status: "authenticated",
      user: { id: user.id, email: user.email, onboardingStep: user.onboardingStep },
    });
  },

  setOnboardingStep: (step) => {
    set((state) =>
      state.user ? { user: { ...state.user, onboardingStep: step } } : state,
    );
  },
}));
