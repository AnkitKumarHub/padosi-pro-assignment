import { useEffect, useState } from "react";

/**
 * Seconds remaining until an action becomes available. The starting value always comes
 * from the server's resendAvailableInSeconds, never from a hardcoded cooldown (SPEC F-018a).
 */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(Math.max(0, Math.ceil(initialSeconds)));

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const restart = (nextSeconds: number) => setSeconds(Math.max(0, Math.ceil(nextSeconds)));

  return { seconds, restart };
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
