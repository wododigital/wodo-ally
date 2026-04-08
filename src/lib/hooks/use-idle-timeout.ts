"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"] as const;

/**
 * Monitors user activity and logs out after IDLE_TIMEOUT_MS of inactivity.
 * Attach this hook in the dashboard layout to cover all authenticated pages.
 */
export function useIdleTimeout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
  }, [handleLogout]);

  useEffect(() => {
    // Start the timer
    resetTimer();

    // Reset on user activity
    const handlers = ACTIVITY_EVENTS.map((event) => {
      const handler = () => resetTimer();
      window.addEventListener(event, handler, { passive: true });
      return { event, handler };
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      handlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [resetTimer]);
}
