import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { useSessionStore } from "@/store/session";
import { colors } from "@/theme";

export default function RootLayout() {
  const restore = useSessionStore((state) => state.restore);

  // One session restore per app start; every screen then reads the store.
  useEffect(() => {
    void restore();
    void SystemUI.setBackgroundColorAsync(colors.bg);
  }, [restore]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
