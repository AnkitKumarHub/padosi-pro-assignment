import { router } from "expo-router";
import { useCallback } from "react";
import { ApiError } from "@/api/client";
import { useSessionStore } from "@/store/session";

/** Clears the session and returns to login when a protected call is rejected. */
export function useUnauthorizedHandler() {
  const signOut = useSessionStore((state) => state.signOut);

  return useCallback(
    async (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        await signOut();
        router.replace("/login");
        return true;
      }
      return false;
    },
    [signOut],
  );
}
